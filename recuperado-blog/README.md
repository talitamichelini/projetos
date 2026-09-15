# Blog com Painel Admin 🐍

Blog completo em Python com FastAPI, Jinja2 e SQLite.

## Stack

- **FastAPI** — framework web moderno
- **Jinja2** — templates HTML
- **SQLAlchemy + SQLite** — banco de dados
- **JWT + bcrypt** — autenticação do admin
- **TailwindCSS** — estilização via CDN

## Como rodar

### 1. Criar ambiente virtual

```bash
python -m venv venv
```

### 2. Ativar o ambiente virtual

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Instalar dependências

```bash
pip install -r requirements.txt
```

### 4. Configurar variáveis de ambiente

Edite o arquivo `.env`:
```
SECRET_KEY=coloque-uma-chave-secreta-aqui
ADMIN_USERNAME=admin
ADMIN_PASSWORD=suasenha
```

### 5. Rodar o servidor

```bash
uvicorn main:app --reload
```

### 6. Acessar

- Blog público: http://localhost:8000
- Painel admin: http://localhost:8000/admin
- Login padrão: `admin` / `admin123`

## Estrutura de pastas

```
blog/
├── main.py                  # Entrada da aplicação
├── requirements.txt
├── .env
└── app/
    ├── auth.py              # JWT e autenticação
    ├── models/
    │   └── database.py      # Modelos SQLAlchemy
    ├── routes/
    │   ├── blog.py          # Rotas públicas
    │   └── admin.py         # Rotas do painel
    ├── static/
    │   └── uploads/         # Imagens de capa
    └── templates/
        ├── blog/            # Templates públicos
        └── admin/           # Templates do admin
```
