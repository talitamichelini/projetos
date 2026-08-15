from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import or_
import markdown as md

from app.models.database import get_db, Post

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


def render_markdown(text: str) -> str:
    return md.markdown(text, extensions=["fenced_code", "tables", "nl2br"])


@router.get("/", response_class=HTMLResponse)
def index(request: Request, page: int = 1, category: str = None, db: Session = Depends(get_db)):
    per_page = 6
    query = db.query(Post).filter(Post.published == True)
    if category:
        query = query.filter(Post.category == category)
    total = query.count()
    posts = query.order_by(Post.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    categories = db.query(Post.category).filter(Post.published == True, Post.category != None).distinct().all()
    categories = [c[0] for c in categories if c[0]]
    return templates.TemplateResponse("blog/index.html", {
        "request": request,
        "posts": posts,
        "page": page,
        "total_pages": (total + per_page - 1) // per_page,
        "current_category": category,
        "categories": categories,
    })


@router.get("/post/{slug}", response_class=HTMLResponse)
def post_detail(slug: str, request: Request, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.slug == slug, Post.published == True).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post não encontrado")
    post.content_html = render_markdown(post.content)
    related = db.query(Post).filter(
        Post.published == True,
        Post.id != post.id,
        Post.category == post.category
    ).limit(3).all()
    return templates.TemplateResponse("blog/post.html", {
        "request": request,
        "post": post,
        "related": related,
    })
