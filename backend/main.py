import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from database import engine, Base
from routers import checklists, documents, checks

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Compliance Checker API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(checklists.router)
app.include_router(documents.router)
app.include_router(checks.router)


@app.get("/")
def root():
    return {"message": "Compliance Checker API is running."}
