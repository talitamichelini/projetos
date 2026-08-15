from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from app.models.database import init_db
from app.routes.blog import router as blog_router
from app.routes.admin import router as admin_router

app = FastAPI(title="Blog")

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(blog_router)
app.include_router(admin_router)


@app.on_event("startup")
def startup():
    init_db()

# Run the following commands to start the server:
#venv\Scripts\activate
#uvicorn main:app --reload