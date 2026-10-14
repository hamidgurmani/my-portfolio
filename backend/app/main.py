from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api import contact

app = FastAPI(title="Portfolio Backend API")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, this should be restricted to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(contact.router, prefix="/contact", tags=["contact"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Portfolio backend is running smoothly"}
