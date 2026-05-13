const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const uploadDir = path.join(__dirname, 'uploads');
const dataFile = path.join(__dirname, 'tickets.json');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, '[]', 'utf8');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}_${file.originalname}`);
  }
});

const upload = multer({ storage });

function loadTickets() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function saveTickets(tickets) {
  fs.writeFileSync(dataFile, JSON.stringify(tickets, null, 2), 'utf8');
}

function getPythonCommand() {
  if (process.env.PYTHON) return process.env.PYTHON;
  return process.platform === 'win32' ? 'python' : 'python3';
}

function classifyDescription(description) {
  return new Promise((resolve) => {
    const python = getPythonCommand();
    const script = path.join(__dirname, '..', 'scripts', 'classificador.py');
    const child = spawn(python, [script, description], { shell: false });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString();
    });

    child.on('error', () => {
      resolve({ categoria: 'Geral', prioridade: 'Média' });
    });

    child.on('close', () => {
      try {
        const result = JSON.parse(output);
        resolve({
          categoria: result.categoria || 'Geral',
          prioridade: result.prioridade || 'Média'
        });
      } catch (e) {
        resolve({ categoria: 'Geral', prioridade: 'Média' });
      }
    });
  });
}

app.get('/', (req, res) => {
  res.send('Backend do Sistema de Atendimento está rodando.');
});

app.get('/tickets', (req, res) => {
  const tickets = loadTickets();
  res.json(tickets);
});

app.post('/tickets', upload.single('foto'), async (req, res) => {
  try {
    const { titulo = '', descricao = '', usuario = '', lat, lng } = req.body;

    if (!titulo.trim() || !descricao.trim() || !usuario.trim()) {
      return res.status(400).json({ erro: 'titulo, descricao e usuario são obrigatórios' });
    }

    const tickets = loadTickets();
    const id = tickets.length > 0 ? Math.max(...tickets.map((t) => t.id || 0)) + 1 : 1;

    const { categoria, prioridade } = await classifyDescription(descricao);

    const ticket = {
      id,
      titulo,
      descricao,
      usuario,
      categoria,
      prioridade,
      status: 'aberto',
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      foto: req.file ? `/uploads/${req.file.filename}` : null,
      criado_em: new Date().toISOString()
    };

    tickets.push(ticket);
    saveTickets(tickets);

    return res.status(201).json(ticket);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao salvar o chamado' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor backend rodando em http://localhost:${port}`);
});
