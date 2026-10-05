# bibliotecas = pacotes de código prontos para serem utilizados
# pyautogui.click() = comando para clicar com o mouse
# pyautogui.write() = comando para escrever com o teclado
# pyautogui.press() = comando para pressionar uma tecla do teclado
# pyautogui.hotkey() = comando para pressionar uma combinação de teclas do teclado

import pyautogui
import time

pyautogui.PAUSE = 1 # tempo de espera entre os comandos (em segundos)

# link = "X" # link do sistema da empresa #var
# principal que pode ser alterar

# Passo a passo (log p)
# 1: Entrar no sistema da empresa
# abrir o navegador
pyautogui.press("win")
pyautogui.write("chrome")
pyautogui.press("enter")

pyautogui.write(link)
pyautogui.press("enter")
# fazer uma pausa maior pro site carregar
time.sleep(3)

# 2: Fazer login
# clicar no campo de e-mail
# precida de valor x, y da tela
pyautogui.click() # (x=, y=) pegar posição do campo de e-mail. muda de acordo com a resolução da tela
pyautogui,write("") # escrever o e-mail
pyautogui.press("tab") # ir para o campo de senha
pyautogui.write("") # escrever a senha
pyautogui.press("tab")
pyautogui.press("enter") # apertar enter para logar
# fazer uma pausa para o site carregar
time.sleep(4)

# 3: Entrar no sistema
# pip install pandas openpyxl - rodar no terminal - python com base de dados
import pandas

tabela = pandas.read_csv("", "") # nome do arquivo - py vai ler as informações
# excel tem abas - sheet_name = "" # nome da aba do excel
print(tabela)

for linha in tabela.index: # vai percorrer todas as linhas da tabela - fazer esse processo abaixo(identado) várias vezes
# index: linha - column: coluna - cell: célula
    # 4: cadastrar 1 item - manualmente
    # varia de acordo com o sistema

    # pegar a posição do clique
    codigo = str(tabela.loc[linha, "codigo"]) # vai pegar o valor da coluna e linha da tabela automaticamente
    pyautogui.write(codigo) # escrever o código do item
    # clicar na posição do campo inicial
    # escrever
    # ir dando tab

    # pegar marca ou informação específica do item (automático)
    tipo = str(tabela.loc[linha, "tipo"]) # vai pegar o valor da coluna e linha da tabela automaticamente
    marca = tabela.loc[linha, "marca"] # vai pegar o valor da coluna e linha da tabela automaticamente

    # copiar e colar tab etc (manual)

    # tab e enter pra finalizar

    # voltar ao início do cadastro
    pyautogui.scroll(5000) # nº + pra cima, nº - pra baixo

# 5: repetir o passo 4 até acabar a lista de cadastros

# usado para estudar e aprender a automatizar processos repetitivos em python com pyautogui e pandas