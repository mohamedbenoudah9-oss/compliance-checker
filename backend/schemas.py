from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# ── Criterion ──────────────────────────────────────────────────────────────────

class CriterionCreate(BaseModel):
    text: str
    description: Optional[str] = None
    order_index: int = 0


class CriterionUpdate(BaseModel):
    text: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None


class CriterionResponse(BaseModel):
    id: int
    checklist_id: int
    text: str
    description: Optional[str] = None
    order_index: int

    model_config = {"from_attributes": True}


# ── Checklist ──────────────────────────────────────────────────────────────────

class ChecklistCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ChecklistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ChecklistResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChecklistDetailResponse(ChecklistResponse):
    criteria: List[CriterionResponse] = []


# ── Document ───────────────────────────────────────────────────────────────────

class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    checklist_id: int
    uploaded_at: datetime
    status: str

    model_config = {"from_attributes": True}


class DocumentDetailResponse(DocumentResponse):
    checklist: ChecklistResponse


# ── CheckResult ────────────────────────────────────────────────────────────────

class CheckResultResponse(BaseModel):
    id: int
    document_id: int
    criterion_id: int
    status: str
    evidence: Optional[str] = None
    doc_quote: Optional[str] = None
    section_ref: Optional[str] = None
    criterion_text: Optional[str] = None
    checklist_name: Optional[str] = None

    model_config = {"from_attributes": True}


class CheckRunResponse(BaseModel):
    message: str
    document_id: int
