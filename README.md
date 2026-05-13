# Sistema de Gestão de Atendimento — Full Stack

Estrutura atual do projeto:

- `backend/` — servidor Node.js com API de tickets
- `mobile-app/` — app React Native / Expo para abrir chamados
- `scripts/` — utilitários Python (`classificador.py` e `relatorio.py`)

## Como rodar o backend

1. No terminal, entre na raiz do projeto:
   ```bash
   cd c:/Users/u04538/Documents/GitHub/Sistema-de-Gestao-de-Atendimento-Full-Stack-integrado-
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```

O backend ficará disponível em `http://localhost:3001`.

## Como rodar o app móvel

1. Instale o Expo se ainda não tiver:
   ```bash
   npm install -g expo-cli
   ```
2. Entre na pasta `mobile-app`:
   ```bash
   cd mobile-app
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o app Expo:
   ```bash
   npx expo start
   ```
5. Abra no:
   - emulador Android
   - emulador iOS
   - ou Expo Go no celular

6. Se usar celular físico, ajuste `LOCAL_API_HOST` em `mobile-app/App.js` para o IP correto do seu PC.

## Como usar os scripts Python

- Classificar um texto de chamado:
  ```bash
  python scripts/classificador.py "meu computador não liga"
  ```

- Gerar relatório a partir de um JSON de tickets:
  ```bash
  python scripts/relatorio.py backend/tickets.json
  ```

## Como interagir com o sistema completo

### 1. Inicie o backend
```bash
npm start
```
O servidor ficará rodando em `http://localhost:3001`.

### 2. Abra o app móvel
```bash
cd mobile-app
npx expo start
```
Escaneie o QR code com o Expo Go no seu celular.

### 3. Use o app para:
- **Abrir chamados**: Preencha título, descrição, tire foto, adicione localização GPS
- **Ver chamados**: Veja todos os seus chamados com status, categoria e prioridade
- **Classificação automática**: O backend classifica automaticamente cada chamado usando IA Python

### 4. Gerencie chamados via API
- GET `/tickets` — Lista todos os chamados
- POST `/tickets` — Cria novo chamado (com foto opcional)
- PUT `/tickets/:id` — Atualiza status/categoria/prioridade

### 5. Gere relatórios
```bash
python scripts/relatorio.py backend/tickets.json
```
Gera PDF com gráficos de chamados por categoria, prioridade e status.

## Funcionalidades principais

- ✅ **Classificação automática** de chamados (Hardware, Software, Rede, etc.)
- ✅ **Priorização inteligente** (Baixa, Média, Alta, Crítica)
- ✅ **Upload de fotos** dos problemas
- ✅ **Localização GPS** dos chamados
- ✅ **Relatórios em PDF** com gráficos
- ✅ **App mobile** para abertura e acompanhamento
- ✅ **API REST** completa para integração

## Tecnologias usadas

- **Backend**: Node.js + Express + Multer + CORS
- **Mobile**: React Native + Expo + Camera + Location
- **IA**: Python + NLTK para classificação de texto
- **Relatórios**: Python + Matplotlib + ReportLab
