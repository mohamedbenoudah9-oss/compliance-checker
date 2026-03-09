from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class Checklist(Base):
    __tablename__ = "checklists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    criteria = relationship("Criterion", back_populates="checklist", cascade="all, delete-orphan", order_by="Criterion.order_index")
    documents = relationship("Document", back_populates="checklist")


class Criterion(Base):
    __tablename__ = "criteria"

    id = Column(Integer, primary_key=True, index=True)
    checklist_id = Column(Integer, ForeignKey("checklists.id"), nullable=False)
    text = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)

    checklist = relationship("Checklist", back_populates="criteria")
    check_results = relationship("CheckResult", back_populates="criterion", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    checklist_id = Column(Integer, ForeignKey("checklists.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")

    checklist = relationship("Checklist", back_populates="documents")
    check_results = relationship("CheckResult", back_populates="document", cascade="all, delete-orphan")


class CheckResult(Base):
    __tablename__ = "check_results"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    criterion_id = Column(Integer, ForeignKey("criteria.id"), nullable=False)
    status = Column(String, nullable=False)  # PASS / FAIL / UNCLEAR
    evidence = Column(Text, nullable=True)
    doc_quote = Column(Text, nullable=True)
    section_ref = Column(String, nullable=True)

    document = relationship("Document", back_populates="check_results")
    criterion = relationship("Criterion", back_populates="check_results")
