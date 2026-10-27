
from organizador import enviar_email
import os

destinatario = os.getenv("EMAIL_DESTINATARIO")

if not destinatario:
    raise ValueError("Configure EMAIL_DESTINATARIO no arquivo .env.")

enviar_email(
    destinatario,
    "Teste do Organizador",
    "Este é um teste de envio de e-mail do Organizador. "
    "Se você recebeu esta mensagem, a conexão com o Gmail funcionou."
)

print("E-mail enviado com sucesso!")
