from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Checklist, Criterion
from schemas import (
    ChecklistCreate,
    ChecklistUpdate,
    ChecklistResponse,
    ChecklistDetailResponse,
    CriterionCreate,
    CriterionUpdate,
    CriterionResponse,
)

router = APIRouter(prefix="/api/checklists", tags=["checklists"])


@router.get("", response_model=List[ChecklistResponse])
def list_checklists(db: Session = Depends(get_db)):
    return db.query(Checklist).order_by(Checklist.created_at.desc()).all()


@router.post("", response_model=ChecklistResponse, status_code=201)
def create_checklist(payload: ChecklistCreate, db: Session = Depends(get_db)):
    checklist = Checklist(name=payload.name, description=payload.description)
    db.add(checklist)
    db.commit()
    db.refresh(checklist)
    return checklist


@router.get("/{checklist_id}", response_model=ChecklistDetailResponse)
def get_checklist(checklist_id: int, db: Session = Depends(get_db)):
    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return checklist


@router.put("/{checklist_id}", response_model=ChecklistResponse)
def update_checklist(
    checklist_id: int,
    payload: ChecklistUpdate,
    db: Session = Depends(get_db),
):
    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    if payload.name is not None:
        checklist.name = payload.name
    if payload.description is not None:
        checklist.description = payload.description
    db.commit()
    db.refresh(checklist)
    return checklist


@router.delete("/{checklist_id}", status_code=204)
def delete_checklist(checklist_id: int, db: Session = Depends(get_db)):
    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    db.delete(checklist)
    db.commit()


@router.post("/{checklist_id}/criteria", response_model=CriterionResponse, status_code=201)
def add_criterion(
    checklist_id: int,
    payload: CriterionCreate,
    db: Session = Depends(get_db),
):
    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    criterion = Criterion(
        checklist_id=checklist_id,
        text=payload.text,
        description=payload.description,
        order_index=payload.order_index,
    )
    db.add(criterion)
    db.commit()
    db.refresh(criterion)
    return criterion


@router.put("/{checklist_id}/criteria/{criterion_id}", response_model=CriterionResponse)
def update_criterion(
    checklist_id: int,
    criterion_id: int,
    payload: CriterionUpdate,
    db: Session = Depends(get_db),
):
    criterion = (
        db.query(Criterion)
        .filter(Criterion.id == criterion_id, Criterion.checklist_id == checklist_id)
        .first()
    )
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")
    if payload.text is not None:
        criterion.text = payload.text
    if payload.description is not None:
        criterion.description = payload.description
    if payload.order_index is not None:
        criterion.order_index = payload.order_index
    db.commit()
    db.refresh(criterion)
    return criterion


@router.delete("/{checklist_id}/criteria/{criterion_id}", status_code=204)
def delete_criterion(
    checklist_id: int,
    criterion_id: int,
    db: Session = Depends(get_db),
):
    criterion = (
        db.query(Criterion)
        .filter(Criterion.id == criterion_id, Criterion.checklist_id == checklist_id)
        .first()
    )
    if not criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")
    db.delete(criterion)
    db.commit()
