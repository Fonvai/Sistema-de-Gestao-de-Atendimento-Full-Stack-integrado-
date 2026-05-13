#!/usr/bin/env python3
# ============================================================
#  SISTEMA DE GESTÃO DE ATENDIMENTO — CLASSIFICADOR (Python)
#  Arquivo: scripts/classificador.py
#
#  O QUE ESTE SCRIPT FAZ:
#  - Recebe a descrição do chamado como argumento
#  - Analisa as palavras usando lógica de palavras-chave
#  - Retorna um JSON com: categoria e prioridade
#
#  COMO RODAR MANUALMENTE:
#  python3 classificador.py "meu computador não liga e a tela ficou preta"
# ============================================================

import sys
import json
import re

# ============================================================
#  DICIONÁRIO DE PALAVRAS-CHAVE
#  Cada categoria tem uma lista de palavras que indicam aquele problema.
#  Adicione mais palavras conforme necessário!
# ============================================================

CATEGORIAS = {
    "Hardware": [
        "não liga", "tela", "monitor", "teclado", "mouse", "impressora",
        "cabo", "bateria", "fonte", "memória", "hd", "ssd", "placa",
        "superaquecendo", "barulho", "ventilador", "travando", "lento",
        "pendrive", "usb", "conector", "notebook", "desktop", "físico"
    ],
    "Software": [
        "sistema", "programa", "aplicativo", "app", "windows", "linux",
        "mac", "erro", "atualização", "instalar", "desinstalar", "travou",
        "crash", "tela azul", "vírus", "malware", "antivírus", "driver",
        "licença", "senha", "login", "acesso", "permissão", "arquivo",
        "pasta", "excel", "word", "office", "navegador", "chrome", "firefox"
    ],
    "Rede": [
        "internet", "wifi", "wi-fi", "conexão", "rede", "cabo de rede",
        "sem acesso", "lento", "vpn", "ip", "dns", "roteador", "switch",
        "firewall", "ping", "servidor", "email", "e-mail", "outlook",
        "teams", "zoom", "nuvem", "cloud", "acesso remoto"
    ]
}

# Palavras que aumentam a prioridade para URGENTE
PALAVRAS_URGENTES = [
    "urgente", "parado", "não consigo trabalhar", "produção parada",
    "cliente esperando", "reunião", "prazo", "chefe", "diretor",
    "sistema fora", "caiu", "bloqueado", "crítico", "emergência",
    "imediato", "agora", "socorro", "ajuda urgente"
]

# Palavras que indicam prioridade ALTA
PALAVRAS_ALTA = [
    "importante", "preciso logo", "hoje", "rápido", "não funciona",
    "problema", "erro grave", "não abre", "travado"
]

# ============================================================
#  FUNÇÕES DE ANÁLISE
# ============================================================

def normalizar(texto):
    """
    Converte o texto para minúsculas e remove caracteres especiais.
    Ex: "Meu COMPUTADOR não liga!" → "meu computador não liga"
    """
    texto = texto.lower()
    texto = re.sub(r'[^\w\sáéíóúãõâêôçñü]', ' ', texto)
    return texto


def classificar_categoria(texto_normalizado):
    """
    Conta quantas palavras-chave de cada categoria aparecem no texto.
    A categoria com mais pontos vence.
    Retorna "Geral" se nenhuma categoria for identificada.
    """
    pontuacao = {categoria: 0 for categoria in CATEGORIAS}

    for categoria, palavras_chave in CATEGORIAS.items():
        for palavra in palavras_chave:
            if palavra in texto_normalizado:
                pontuacao[categoria] += 1

    # Pega a categoria com maior pontuação
    melhor = max(pontuacao, key=pontuacao.get)

    # Se a maior pontuação for 0, nenhuma categoria foi identificada
    if pontuacao[melhor] == 0:
        return "Geral"

    return melhor


def classificar_prioridade(texto_normalizado):
    """
    Verifica palavras de urgência no texto e retorna a prioridade.
    Níveis: Urgente > Alta > Média > Baixa
    """
    for palavra in PALAVRAS_URGENTES:
        if palavra in texto_normalizado:
            return "Urgente"

    for palavra in PALAVRAS_ALTA:
        if palavra in texto_normalizado:
            return "Alta"

    # Heurística extra: textos muito curtos tendem a ser menos urgentes
    if len(texto_normalizado.split()) < 5:
        return "Baixa"

    return "Média"


# ============================================================
#  EXECUÇÃO PRINCIPAL
# ============================================================

if __name__ == "__main__":
    # Verifica se a descrição foi passada como argumento
    if len(sys.argv) < 2:
        print(json.dumps({"erro": "Nenhuma descrição fornecida"}))
        sys.exit(1)

    # Pega o primeiro argumento (a descrição do chamado)
    descricao_original = sys.argv[1]

    # Normaliza o texto para análise
    descricao_normalizada = normalizar(descricao_original)

    # Classifica categoria e prioridade
    categoria  = classificar_categoria(descricao_normalizada)
    prioridade = classificar_prioridade(descricao_normalizada)

    # Monta o resultado e imprime como JSON (o Node.js vai ler isso)
    resultado = {
        "categoria":  categoria,
        "prioridade": prioridade,
        "descricao":  descricao_original[:100]  # primeiros 100 chars para log
    }

    # IMPORTANTE: print() aqui é o que o Node.js lê via stdout
    print(json.dumps(resultado, ensure_ascii=False))