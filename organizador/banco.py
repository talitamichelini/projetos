
import sqlite3

conexao = sqlite3.connect("organizador.db")

try:
    # Mantém a coluna area, caso ela já exista
    colunas = [
        coluna[1]
        for coluna in conexao.execute(
            "PRAGMA table_info(profissionais)"
        ).fetchall()
    ]

    if colunas and "area" not in colunas:
        conexao.execute(
            "ALTER TABLE profissionais ADD COLUMN area TEXT"
        )

    # Cadastro independente de serviços
    conexao.execute("""
        CREATE TABLE IF NOT EXISTS servicos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE
        )
    """)

    # Permite vincular vários serviços a cada profissional
    conexao.execute("""
        CREATE TABLE IF NOT EXISTS profissional_servicos (
            profissional_id INTEGER NOT NULL,
            servico_id INTEGER NOT NULL,
            PRIMARY KEY (profissional_id, servico_id),
            FOREIGN KEY (profissional_id)
                REFERENCES profissionais(id),
            FOREIGN KEY (servico_id)
                REFERENCES servicos(id)
        )
    """)

    # Adiciona o serviço às tarefas, se ainda não existir
    colunas_tarefas = [
        coluna[1]
        for coluna in conexao.execute(
            "PRAGMA table_info(tarefas)"
        ).fetchall()
    ]

    if colunas_tarefas and "servico_id" not in colunas_tarefas:
        conexao.execute(
            "ALTER TABLE tarefas ADD COLUMN servico_id INTEGER"
        )

    # Migra os serviços antigos para a tabela servicos
    profissionais = conexao.execute("""
        SELECT area, servico
        FROM profissionais
    """).fetchall()

    for profissional in profissionais:
        for campo in profissional:
            if campo and campo.strip():
                conexao.execute("""
                    INSERT OR IGNORE INTO servicos (nome)
                    VALUES (?)
                """, (campo.strip(),))

    conexao.commit()
    print("Banco atualizado com sucesso!")

except Exception:
    conexao.rollback()
    raise

finally:
    conexao.close()
