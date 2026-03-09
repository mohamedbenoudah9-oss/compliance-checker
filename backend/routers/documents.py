import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from database import get_db
from models import Document
from schemas import DocumentResponse, DocumentDetailResponse
from services import storage

ALLOWED_EXTENSIONS = {".pdf", ".docx"}

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    checklist_id: int = Form(...),
    db: Session = Depends(get_db),
):
    original_filename = file.filename or "upload"
    ext = os.path.splitext(original_filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Only PDF and DOCX are allowed.",
        )

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    contents = await file.read()
    storage.upload_file(contents, unique_filename)

    document = Document(
        filename=unique_filename,
        original_filename=original_filename,
        checklist_id=checklist_id,
        status="pending",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.get("", response_model=List[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.uploaded_at.desc()).all()


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        storage.delete_file(document.filename)
    except Exception:
        pass  # Don't fail delete if storage file is already gone

    db.delete(document)
    db.commit()
