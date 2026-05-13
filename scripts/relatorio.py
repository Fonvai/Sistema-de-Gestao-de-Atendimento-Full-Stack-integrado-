#!/usr/bin/env python3
# ============================================================
#  SISTEMA DE GESTÃO DE ATENDIMENTO — RELATÓRIO (Python)
#  Arquivo: scripts/relatorio.py
#
#  O QUE ESTE SCRIPT FAZ:
#  - Lê o arquivo JSON com todos os tickets
#  - Calcula estatísticas (por categoria, prioridade, status)
#  - Gera um gráfico de barras (PNG)
#  - Exporta um relatório PDF
#  - Imprime um JSON com o resumo (para o Node.js ler)
#
#  COMO RODAR MANUALMENTE:
#  python3 relatorio.py tickets_temp.json
#
#  DEPENDÊNCIAS (instale uma vez):
#  pip install matplotlib reportlab
# ============================================================

import sys
import json
import os
from collections import Counter
from datetime import datetime

# Tenta importar as bibliotecas de gráfico e PDF
try:
    import matplotlib
    matplotlib.use('Agg')  # backend sem interface gráfica (funciona em servidor)
    import matplotlib.pyplot as plt
    MATPLOTLIB_OK = True
except ImportError:
    MATPLOTLIB_OK = False

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    REPORTLAB_OK = True
except ImportError:
    REPORTLAB_OK = False


# ============================================================
#  FUNÇÃO: Gerar gráfico de barras
# ============================================================

def gerar_grafico(dados_categorias, dados_prioridades, caminho_saida):
    """
    Cria dois gráficos lado a lado:
    - Esquerda: chamados por categoria
    - Direita: chamados por prioridade
    """
    if not MATPLOTLIB_OK:
        return None

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
    fig.suptitle('Relatório de Chamados — Sistema de Atendimento',
                 fontsize=14, fontweight='bold')

    # --- Gráfico 1: Por Categoria ---
    categorias = list(dados_categorias.keys())
    qtd_cat    = list(dados_categorias.values())
    cores_cat  = ['#4A90D9', '#50C878', '#FF6B6B', '#FFD93D']

    barras1 = ax1.bar(categorias, qtd_cat, color=cores_cat[:len(categorias)], 
                      edgecolor='white', linewidth=1.5)
    ax1.set_title('Chamados por Categoria', fontweight='bold')
    ax1.set_ylabel('Quantidade')
    ax1.set_ylim(0, max(qtd_cat) + 1 if qtd_cat else 5)

    # Coloca o número em cima de cada barra
    for barra in barras1:
        altura = barra.get_height()
        ax1.text(barra.get_x() + barra.get_width() / 2., altura,
                 f'{int(altura)}', ha='center', va='bottom', fontweight='bold')

    # --- Gráfico 2: Por Prioridade ---
    # Ordem lógica de prioridade
    ordem_prioridade = ['Urgente', 'Alta', 'Média', 'Baixa']
    prioridades = [p for p in ordem_prioridade if p in dados_prioridades]
    qtd_pri     = [dados_prioridades[p] for p in prioridades]
    cores_pri   = {'Urgente': '#FF4444', 'Alta': '#FF8800',
                   'Média': '#FFD700', 'Baixa': '#44BB44'}

    barras2 = ax2.bar(prioridades, qtd_pri,
                      color=[cores_pri.get(p, '#999') for p in prioridades],
                      edgecolor='white', linewidth=1.5)
    ax2.set_title('Chamados por Prioridade', fontweight='bold')
    ax2.set_ylabel('Quantidade')
    ax2.set_ylim(0, max(qtd_pri) + 1 if qtd_pri else 5)

    for barra in barras2:
        altura = barra.get_height()
        ax2.text(barra.get_x() + barra.get_width() / 2., altura,
                 f'{int(altura)}', ha='center', va='bottom', fontweight='bold')

    plt.tight_layout()
    plt.savefig(caminho_saida, dpi=150, bbox_inches='tight',
                facecolor='#FAFAFA')
    plt.close()
    return caminho_saida


# ============================================================
#  FUNÇÃO: Gerar PDF
# ============================================================

def gerar_pdf(tickets, estatisticas, caminho_grafico, caminho_pdf):
    """
    Cria um PDF profissional com:
    - Cabeçalho com data
    - Tabela de resumo
    - Tabela com os últimos 10 chamados
    """
    if not REPORTLAB_OK:
        return None

    doc    = SimpleDocTemplate(caminho_pdf, pagesize=A4)
    estilos = getSampleStyleSheet()
    elementos = []

    # Título
    titulo = Paragraph(
        "<b>Relatório de Chamados — Sistema de Atendimento</b>",
        estilos['Title']
    )
    elementos.append(titulo)

    # Data de geração
    data_geracao = Paragraph(
        f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}",
        estilos['Normal']
    )
    elementos.append(data_geracao)
    elementos.append(Spacer(1, 20))

    # Tabela de resumo
    dados_resumo = [
        ['Métrica', 'Valor'],
        ['Total de chamados', str(estatisticas['total'])],
        ['Chamados abertos', str(estatisticas['por_status'].get('aberto', 0))],
        ['Em andamento', str(estatisticas['por_status'].get('em_andamento', 0))],
        ['Resolvidos', str(estatisticas['por_status'].get('resolvido', 0))],
        ['Urgentes', str(estatisticas['por_prioridade'].get('Urgente', 0))],
    ]

    tabela_resumo = Table(dados_resumo, colWidths=[250, 100])
    tabela_resumo.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2C3E50')),
        ('TEXTCOLOR',  (0, 0), (-1, 0), colors.white),
        ('FONTNAME',   (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN',      (0, 0), (-1, -1), 'CENTER'),
        ('GRID',       (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
    ]))
    elementos.append(tabela_resumo)
    elementos.append(Spacer(1, 20))

    # Tabela com últimos chamados
    cabecalho = ['ID', 'Título', 'Categoria', 'Prioridade', 'Status']
    linhas = [cabecalho]
    for t in tickets[-10:]:  # últimos 10
        linhas.append([
            str(t.get('id', '')),
            t.get('titulo', '')[:30],
            t.get('categoria', ''),
            t.get('prioridade', ''),
            t.get('status', '')
        ])

    tabela_tickets = Table(linhas, colWidths=[30, 180, 80, 70, 80])
    tabela_tickets.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498DB')),
        ('TEXTCOLOR',  (0, 0), (-1, 0), colors.white),
        ('FONTNAME',   (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',   (0, 0), (-1, -1), 8),
        ('ALIGN',      (0, 0), (-1, -1), 'CENTER'),
        ('GRID',       (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#EBF5FB')]),
    ]))
    elementos.append(Paragraph("<b>Últimos 10 Chamados</b>", estilos['Heading2']))
    elementos.append(tabela_tickets)

    doc.build(elementos)
    return caminho_pdf


# ============================================================
#  EXECUÇÃO PRINCIPAL
# ============================================================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"erro": "Informe o caminho do JSON de tickets"}))
        sys.exit(1)

    caminho_json = sys.argv[1]

    # Lê o arquivo de tickets
    try:
        with open(caminho_json, 'r', encoding='utf-8') as f:
            tickets = json.load(f)
    except Exception as e:
        print(json.dumps({"erro": f"Não foi possível ler o arquivo: {str(e)}"}))
        sys.exit(1)

    if not tickets:
        print(json.dumps({"aviso": "Nenhum chamado encontrado", "total": 0}))
        sys.exit(0)

    # Calcula estatísticas
    por_categoria  = Counter(t.get('categoria', 'Geral') for t in tickets)
    por_prioridade = Counter(t.get('prioridade', 'Média') for t in tickets)
    por_status     = Counter(t.get('status', 'aberto') for t in tickets)

    estatisticas = {
        "total":          len(tickets),
        "por_categoria":  dict(por_categoria),
        "por_prioridade": dict(por_prioridade),
        "por_status":     dict(por_status)
    }

    # Gera os arquivos de saída
    caminho_grafico = "relatorio_grafico.png"
    caminho_pdf     = "relatorio.pdf"

    grafico_gerado = gerar_grafico(por_categoria, por_prioridade, caminho_grafico)
    pdf_gerado     = gerar_pdf(tickets, estatisticas, grafico_gerado, caminho_pdf)

    # Resultado final para o Node.js
    resultado = {
        **estatisticas,
        "grafico": caminho_grafico if grafico_gerado else "matplotlib não instalado",
        "pdf":     caminho_pdf     if pdf_gerado     else "reportlab não instalado",
        "libs":    {
            "matplotlib": MATPLOTLIB_OK,
            "reportlab":  REPORTLAB_OK
        }
    }

    print(json.dumps(resultado, ensure_ascii=False))