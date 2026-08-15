from fastapi import APIRouter, Depends, Request, Form, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import re, os, shutil, uuid

from app.models.database import get_db, Post
from app.auth import authenticate_admin, create_access_token, require_admin

router = APIRouter(prefix="/admin")
templates = Jinja2Templates(directory="app/templates")
UPLOAD_DIR = "app/static/uploads"


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text


def check_admin(request: Request):
    user = require_admin(request)
    if not user:
        return RedirectResponse("/admin/login", status_code=302)
    return None


# --- Login ---

@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("admin/login.html", {"request": request, "error": None})


@router.post("/login")
def login(request: Request, username: str = Form(...), password: str = Form(...)):
    if authenticate_admin(username, password):
        token = create_access_token({"sub": username})
        response = RedirectResponse("/admin", status_code=302)
        response.set_cookie("access_token", token, httponly=True, max_age=60 * 60 * 8)
        return response
    return templates.TemplateResponse("admin/login.html", {"request": request, "error": "Usuário ou senha incorretos"})


@router.get("/logout")
def logout():
    response = RedirectResponse("/admin/login", status_code=302)
    response.delete_cookie("access_token")
    return response


# --- Dashboard ---

@router.get("", response_class=HTMLResponse)
def dashboard(request: Request, db: Session = Depends(get_db)):
    redir = check_admin(request)
    if redir:
        return redir
    posts = db.query(Post).order_by(Post.created_at.desc()).all()
    total = len(posts)
    published = sum(1 for p in posts if p.published)
    return templates.TemplateResponse("admin/dashboard.html", {
        "request": request,
        "posts": posts,
        "total": total,
        "published": published,
        "drafts": total - published,
    })


# --- Criar Post ---

@router.get("/posts/new", response_class=HTMLResponse)
def new_post_page(request: Request):
    redir = check_admin(request)
    if redir:
        return redir
    return templates.TemplateResponse("admin/post_form.html", {"request": request, "post": None, "error": None})


@router.post("/posts/new")
async def create_post(
    request: Request,
    title: str = Form(...),
    summary: str = Form(""),
    content: str = Form(...),
    category: str = Form(""),
    tags: str = Form(""),
    published: str = Form("off"),
    cover: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    redir = check_admin(request)
    if redir:
        return redir

    slug = slugify(title)
    existing = db.query(Post).filter(Post.slug == slug).first()
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    cover_path = None
    if cover and cover.filename:
        ext = cover.filename.split(".")[-1]
        filename = f"{uuid.uuid4().hex}.{ext}"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        with open(f"{UPLOAD_DIR}/{filename}", "wb") as f:
            shutil.copyfileobj(cover.file, f)
        cover_path = f"/static/uploads/{filename}"

    post = Post(
        title=title,
        slug=slug,
        summary=summary,
        content=content,
        category=category or None,
        tags=tags or None,
        cover_image=cover_path,
        published=published == "on",
    )
    db.add(post)
    db.commit()
    return RedirectResponse("/admin", status_code=302)


# --- Editar Post ---

@router.get("/posts/{post_id}/edit", response_class=HTMLResponse)
def edit_post_page(post_id: int, request: Request, db: Session = Depends(get_db)):
    redir = check_admin(request)
    if redir:
        return redir
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        return RedirectResponse("/admin", status_code=302)
    return templates.TemplateResponse("admin/post_form.html", {"request": request, "post": post, "error": None})


@router.post("/posts/{post_id}/edit")
async def update_post(
    post_id: int,
    request: Request,
    title: str = Form(...),
    summary: str = Form(""),
    content: str = Form(...),
    category: str = Form(""),
    tags: str = Form(""),
    published: str = Form("off"),
    cover: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    redir = check_admin(request)
    if redir:
        return redir
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        return RedirectResponse("/admin", status_code=302)

    post.title = title
    post.summary = summary
    post.content = content
    post.category = category or None
    post.tags = tags or None
    post.published = published == "on"

    if cover and cover.filename:
        ext = cover.filename.split(".")[-1]
        filename = f"{uuid.uuid4().hex}.{ext}"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        with open(f"{UPLOAD_DIR}/{filename}", "wb") as f:
            shutil.copyfileobj(cover.file, f)
        post.cover_image = f"/static/uploads/{filename}"

    db.commit()
    return RedirectResponse("/admin", status_code=302)


# --- Deletar Post ---

@router.post("/posts/{post_id}/delete")
def delete_post(post_id: int, request: Request, db: Session = Depends(get_db)):
    redir = check_admin(request)
    if redir:
        return redir
    post = db.query(Post).filter(Post.id == post_id).first()
    if post:
        db.delete(post)
        db.commit()
    return RedirectResponse("/admin", status_code=302)
