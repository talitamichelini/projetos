
import os
import sqlite3
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from flask import Flask, render_template, request
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler

load_dotenv()

app = Flask(__name__)

def enviar_email(destinatario, assunto, mensagem):
    email_remetente = os.getenv("EMAIL_REMETENTE")
    senha_app = os.getenv("EMAIL_SENHA_APP")

    if not email_remetente or not senha_app:
        raise ValueError("Credenciais de e-mail não configuradas.")

    email = EmailMessage()
    email["From"] = email_remetente
    email["To"] = destinatario
    email["Subject"] = assunto
    email.set_content(mensagem)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as servidor:
        servidor.login(email_remetente, senha_app)
        servidor.send_message(email)

def verificar_tarefas_vencidas():
    preparar_tabela_alertas()

    conexao = conectar_banco()
    try:
        tarefas = conexao.execute("""
            SELECT
                t.id,
                t.titulo,
                t.prazo,
                t.status,
                c.nome AS cliente
            FROM tarefas t
            JOIN contas c ON c.id = t.conta_id
            WHERE LOWER(t.status) != 'concluido'
              AND NOT EXISTS (
                  SELECT 1
                  FROM alertas_enviados a
                  WHERE a.tarefa_id = t.id
              )
        """).fetchall()

        agora = datetime.now()

        for tarefa in tarefas:
            try:
                prazo = datetime.fromisoformat(
                    tarefa["prazo"].replace("Z", "+00:00")
                )

                # Os prazos cadastrados pelo formulário são locais.
                if prazo.tzinfo is not None:
                    prazo = prazo.replace(tzinfo=None)

            except (ValueError, AttributeError):
                continue

            if agora < prazo:
                continue

            destinatario = os.getenv("EMAIL_DESTINATARIO")
            if not destinatario:
                print("Destinatário do e-mail não configurado.")
                return

            assunto = f"Prazo vencido: {tarefa['titulo']}"
            mensagem = (
                "Uma tarefa do Organizador está com o prazo vencido.\n\n"
                f"Cliente: {tarefa['cliente']}\n"
                f"Tarefa: {tarefa['titulo']}\n"
                f"Prazo: {tarefa['prazo']}\n\n"
                "Acesse o Organizador para consultar a tarefa."
            )

            try:
                enviar_email(destinatario, assunto, mensagem)

                conexao.execute("""
                    INSERT INTO alertas_enviados (tarefa_id, enviado_em)
                    VALUES (?, ?)
                """, (tarefa["id"], agora.isoformat()))

                conexao.commit()
                print(f"Alerta enviado para a tarefa {tarefa['id']}.")

            except Exception as erro:
                print(
                    f"Erro ao enviar alerta da tarefa "
                    f"{tarefa['id']}: {erro}"
                )

    finally:
        conexao.close()

def conectar_banco():
    conexao = sqlite3.connect("organizador.db")
    conexao.row_factory = sqlite3.Row
    conexao.execute("PRAGMA foreign_keys = ON")
    return conexao

def preparar_tabela_alertas():
    conexao = conectar_banco()
    try:
        conexao.execute("""
            CREATE TABLE IF NOT EXISTS alertas_enviados (
                tarefa_id INTEGER PRIMARY KEY,
                enviado_em TEXT NOT NULL
            )
        """)
        conexao.commit()
    finally:
        conexao.close()

def texto(dados, campo):
    valor = dados.get(campo, "")
    return valor.strip() if isinstance(valor, str) else ""

@app.route("/")
def inicio():
    return render_template("index.html")

@app.route("/teste-banco")
def teste_banco():
    conexao = conectar_banco()
    try:
        tabelas = conexao.execute("""
            SELECT name FROM sqlite_master
            WHERE type = 'table'
        """).fetchall()
        return {"tabelas": [t["name"] for t in tabelas]}
    finally:
        conexao.close()

# CLIENTES
@app.route("/api/contas", methods=["GET"])
def listar_contas_api():
    conexao = conectar_banco()
    try:
        contas = conexao.execute(
            "SELECT id, nome FROM contas ORDER BY nome"
        ).fetchall()
        return {"contas": [dict(c) for c in contas]}
    finally:
        conexao.close()

@app.route("/api/contas", methods=["POST"])
def cadastrar_conta_api():
    dados = request.get_json(silent=True)
    nome = texto(dados, "nome") if isinstance(dados, dict) else ""

    if not nome:
        return {"erro": "Informe o nome do cliente."}, 400

    conexao = conectar_banco()
    try:
        cursor = conexao.execute(
            "INSERT INTO contas (nome) VALUES (?)", (nome,)
        )
        conexao.commit()
        return {"id": cursor.lastrowid, "nome": nome}, 201
    finally:
        conexao.close()

# PROFISSIONAIS
@app.route("/api/profissionais", methods=["GET"])
def listar_profissionais_api():
    conexao = conectar_banco()
    try:
        profissionais = conexao.execute("""
            SELECT id, nome, area
            FROM profissionais
            ORDER BY nome
        """).fetchall()
        return {"profissionais": [dict(p) for p in profissionais]}
    finally:
        conexao.close()

@app.route("/api/profissionais", methods=["POST"])
def cadastrar_profissional_api():
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict):
        return {"erro": "Informe os dados do cadastro."}, 400

    nome = texto(dados, "nome")
    servico = texto(dados, "servico") or texto(dados, "area")

    if not nome and not servico:
        return {
            "erro": "Preencha o nome do profissional, o serviço ou ambos."
        }, 400

    conexao = conectar_banco()
    try:
        servico_id = None

        # Cadastra o serviço, se foi informado
        if servico:
            existente = conexao.execute(
                "SELECT id FROM servicos WHERE nome = ? COLLATE NOCASE",
                (servico,)
            ).fetchone()

            if existente:
                servico_id = existente["id"]
            else:
                cursor_servico = conexao.execute(
                    "INSERT INTO servicos (nome) VALUES (?)",
                    (servico,)
                )
                servico_id = cursor_servico.lastrowid

        profissional_id = None

        # Cadastra o profissional, se foi informado
        if nome:
            cursor_profissional = conexao.execute("""
                INSERT INTO profissionais (nome, area, servico)
                VALUES (?, ?, ?)
            """, (nome, servico or "", servico or ""))

            profissional_id = cursor_profissional.lastrowid

            # Vincula o serviço ao profissional
            if servico_id is not None:
                conexao.execute("""
                    INSERT OR IGNORE INTO profissional_servicos
                        (profissional_id, servico_id)
                    VALUES (?, ?)
                """, (profissional_id, servico_id))

        conexao.commit()

        return {
            "mensagem": "Cadastro realizado com sucesso!",
            "profissional_id": profissional_id,
            "servico_id": servico_id
        }, 201

    except sqlite3.IntegrityError:
        conexao.rollback()
        return {
            "erro": "Não foi possível concluir o cadastro. Verifique os dados."
        }, 400
    finally:
        conexao.close()

# SERVIÇOS
@app.route("/api/servicos", methods=["GET"])
def listar_servicos_api():
    conexao = conectar_banco()
    try:
        servicos = conexao.execute("""
            SELECT id, nome FROM servicos ORDER BY nome
        """).fetchall()
        return {"servicos": [dict(s) for s in servicos]}
    finally:
        conexao.close()

@app.route("/api/servicos", methods=["POST"])
def cadastrar_servico_api():
    dados = request.get_json(silent=True)
    nome = texto(dados, "nome") if isinstance(dados, dict) else ""

    if not nome:
        return {"erro": "Informe o nome do serviço."}, 400

    conexao = conectar_banco()
    try:
        existente = conexao.execute(
            "SELECT id, nome FROM servicos WHERE nome = ? COLLATE NOCASE",
            (nome,)
        ).fetchone()

        if existente:
            return {
                "id": existente["id"],
                "nome": existente["nome"],
                "mensagem": "Esse serviço já está cadastrado."
            }, 200

        cursor = conexao.execute(
            "INSERT INTO servicos (nome) VALUES (?)", (nome,)
        )
        conexao.commit()

        return {
            "id": cursor.lastrowid,
            "nome": nome,
            "mensagem": "Serviço cadastrado com sucesso!"
        }, 201
    finally:
        conexao.close()

# TAREFAS
@app.route("/api/tarefas", methods=["GET"])
def listar_tarefas_api():
    conexao = conectar_banco()
    try:
        tarefas = conexao.execute("""
            SELECT
                t.id,
                t.conta_id,
                c.nome AS conta_nome,
                t.profissional_id,
                p.nome AS profissional_nome,
                t.titulo,
                t.prazo,
                t.status,
                t.observacao,
                t.servico_id,
                s.nome AS servico_nome
            FROM tarefas t
            JOIN contas c ON c.id = t.conta_id
            JOIN profissionais p ON p.id = t.profissional_id
            LEFT JOIN servicos s ON s.id = t.servico_id
            ORDER BY t.prazo
        """).fetchall()

        return {"tarefas": [dict(t) for t in tarefas]}
    finally:
        conexao.close()

@app.route("/api/tarefas", methods=["POST"])
def cadastrar_tarefa_api():
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict):
        return {"erro": "Informe os dados da tarefa."}, 400

    titulo = texto(dados, "titulo")
    prazo = texto(dados, "prazo")
    observacao = texto(dados, "observacao")

    try:
        conta_id = int(dados.get("conta_id"))
        profissional_id = int(dados.get("profissional_id"))
        servico_id = int(dados.get("servico_id"))
    except (TypeError, ValueError):
        return {
            "erro": "Selecione um cliente, profissional e serviço válidos."
        }, 400

    if not titulo or not prazo:
        return {"erro": "Informe o título e o prazo da tarefa."}, 400

    conexao = conectar_banco()
    try:
        conta = conexao.execute(
            "SELECT id FROM contas WHERE id = ?", (conta_id,)
        ).fetchone()

        profissional = conexao.execute(
            "SELECT id FROM profissionais WHERE id = ?",
            (profissional_id,)
        ).fetchone()

        servico = conexao.execute(
            "SELECT id FROM servicos WHERE id = ?", (servico_id,)
        ).fetchone()

        if not conta or not profissional or not servico:
            return {
                "erro": "Cliente, profissional ou serviço não encontrado."
            }, 400

        cursor = conexao.execute("""
            INSERT INTO tarefas
                (conta_id, profissional_id, titulo, prazo,
                 status, observacao, servico_id)
            VALUES (?, ?, ?, ?, 'andamento', ?, ?)
        """, (
            conta_id,
            profissional_id,
            titulo,
            prazo,
            observacao,
            servico_id
        ))

        conexao.commit()

        return {
            "id": cursor.lastrowid,
            "mensagem": "Tarefa cadastrada com sucesso!"
        }, 201

    except sqlite3.IntegrityError:
        conexao.rollback()
        return {"erro": "Não foi possível cadastrar a tarefa."}, 400
    finally:
        conexao.close()

@app.route("/api/tarefas/<int:tarefa_id>/status", methods=["PATCH"])
def atualizar_status_tarefa_api(tarefa_id):
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict):
        return {"erro": "Informe o novo status."}, 400

    status = texto(dados, "status").strip().lower()
    status_validos = {"andamento", "concluido"}

    if status not in status_validos:
        return {
        "erro": f"Status inválido: {status!r}"
    }, 400
    conexao = conectar_banco()
    try:
        tarefa = conexao.execute(
            "SELECT id FROM tarefas WHERE id = ?",
            (tarefa_id,)
        ).fetchone()

        if not tarefa:
            return {"erro": "Tarefa não encontrada."}, 404

        conexao.execute(
            "UPDATE tarefas SET status = ? WHERE id = ?",
            (status, tarefa_id)
        )
        conexao.commit()

        return {
            "mensagem": "Status atualizado com sucesso!",
            "id": tarefa_id,
            "status": status
        }

    finally:
        conexao.close()

@app.route("/api/tarefas/<int:tarefa_id>/observacao", methods=["PATCH"])
def atualizar_observacao_tarefa_api(tarefa_id):
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict):
        return {"erro": "Informe a observação."}, 400

    observacao = dados.get("observacao")

    if not isinstance(observacao, str):
        return {"erro": "A observação deve ser um texto."}, 400

    conexao = conectar_banco()
    try:
        tarefa = conexao.execute(
            "SELECT id FROM tarefas WHERE id = ?",
            (tarefa_id,)
        ).fetchone()

        if not tarefa:
            return {"erro": "Tarefa não encontrada."}, 404

        conexao.execute(
            "UPDATE tarefas SET observacao = ? WHERE id = ?",
            (observacao.strip(), tarefa_id)
        )
        conexao.commit()

        return {
            "mensagem": "Observação salva com sucesso!",
            "id": tarefa_id
        }

    finally:
        conexao.close()

@app.route("/api/tarefas/<int:tarefa_id>", methods=["PATCH"])
def editar_tarefa_api(tarefa_id):
    dados = request.get_json()

    campos = [
        "conta_id",
        "profissional_id",
        "servico_id",
        "titulo",
        "prazo",
        "observacao",
    ]

    if not dados or any(campo not in dados for campo in campos):
        return {"erro": "Preencha todos os campos obrigatórios."}, 400

    conexao = conectar_banco()

    try:
        tarefa = conexao.execute(
            "SELECT id FROM tarefas WHERE id = ?",
            (tarefa_id,),
        ).fetchone()

        if not tarefa:
            return {"erro": "Tarefa não encontrada."}, 404

        conexao.execute(
            """
            UPDATE tarefas
            SET conta_id = ?,
                profissional_id = ?,
                servico_id = ?,
                titulo = ?,
                prazo = ?,
                observacao = ?
            WHERE id = ?
            """,
            (
                dados["conta_id"],
                dados["profissional_id"],
                dados["servico_id"],
                dados["titulo"],
                dados["prazo"],
                dados["observacao"],
                tarefa_id,
            ),
        )

        conexao.commit()

        return {
            "mensagem": "Tarefa atualizada com sucesso!",
            "id": tarefa_id,
        }

    finally:
        conexao.close()

@app.route("/api/tarefas/<int:tarefa_id>", methods=["DELETE"])
def excluir_tarefa_api(tarefa_id):
    conexao = conectar_banco()
    try:
        tarefa = conexao.execute(
            "SELECT id FROM tarefas WHERE id = ?",
            (tarefa_id,)
        ).fetchone()

        if not tarefa:
            return {"erro": "Tarefa não encontrada."}, 404

        conexao.execute(
            "DELETE FROM tarefas WHERE id = ?",
            (tarefa_id,)
        )
        conexao.commit()

        return {
            "mensagem": "Tarefa excluída com sucesso!",
            "id": tarefa_id
        }

    finally:
        conexao.close()

if __name__ == "__main__":
    preparar_tabela_alertas()

    agendador = BackgroundScheduler()
    agendador.add_job(
        verificar_tarefas_vencidas,
        "interval",
        minutes=1,
        id="verificar_prazos",
        max_instances=1,
        coalesce=True,
    )
    agendador.start()

    try:
        app.run(debug=True, use_reloader=False)
    finally:
        agendador.shutdown(wait=False)
