import os
import tempfile
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, SessionLocal
from models import Document, Criterion, CheckResult
from schemas import CheckResultResponse, CheckRunResponse


router = APIRouter(prefix="/api/checks", tags=["checks"])


def _run_compliance_check(document_id: int, api_key: str):
    """Background task: extract text, chunk, call AI, store results."""
    db: Session = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return

        document.status = "processing"
        db.commit()

        criteria: List[Criterion] = (
            db.query(Criterion)
            .filter(Criterion.checklist_id == document.checklist_id)
            .order_by(Criterion.order_index)
            .all()
        )

        if not criteria:
            document.status = "done"
            db.commit()
            return

        from services.extractor import extract_text
        from services.ai_checker import check_document
        from services.storage import download_to_temp

        ext = os.path.splitext(document.filename)[1]
        tmp_path = download_to_temp(document.filename, ext)
        try:
            sections = extract_text(tmp_path)
            results = check_document(sections, criteria, api_key)
        finally:
            os.unlink(tmp_path)

        # Delete any existing results for this document (re-run case)
        db.query(CheckResult).filter(CheckResult.document_id == document_id).delete()

        for item in results:
            cr = CheckResult(
                document_id=document_id,
                criterion_id=item["criterion_id"],
                status=item["status"],
                evidence=item.get("evidence"),
                doc_quote=item.get("doc_quote"),
                section_ref=item.get("section_ref"),
            )
            db.add(cr)

        document.status = "done"
        db.commit()

    except Exception as exc:
        db.rollback()
        try:
            document = db.query(Document).filter(Document.id == document_id).first()
            if document:
                document.status = "error"
                db.commit()
        except Exception:
            pass
        raise exc
    finally:
        db.close()


@router.post("/run/{document_id}", response_model=CheckRunResponse)
def run_check(
    document_id: int,
    db: Session = Depends(get_db),
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    api_key = os.getenv("QWEN_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="QWEN_API_KEY is not configured on the server.",
        )

    _run_compliance_check(document_id, api_key)

    return CheckRunResponse(
        message="Compliance check started.",
        document_id=document_id,
    )


@router.get("/results/{document_id}", response_model=List[CheckResultResponse])
def get_results(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    results = (
        db.query(CheckResult)
        .filter(CheckResult.document_id == document_id)
        .join(CheckResult.criterion)
        .order_by(Criterion.order_index)
        .all()
    )

    response = []
    for r in results:
        response.append(
            CheckResultResponse(
                id=r.id,
                document_id=r.document_id,
                criterion_id=r.criterion_id,
                status=r.status,
                evidence=r.evidence,
                doc_quote=r.doc_quote,
                section_ref=r.section_ref,
                criterion_text=r.criterion.text if r.criterion else None,
                checklist_name=r.criterion.checklist.name if r.criterion and r.criterion.checklist else None,
            )
        )
    return response
