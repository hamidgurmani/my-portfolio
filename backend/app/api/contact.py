from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.models.database import get_db, ContactMessage

router = APIRouter()

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    message: str

@router.post("/")
async def send_message(request: ContactRequest, db: Session = Depends(get_db)):
    try:
        new_message = ContactMessage(
            name=request.name,
            email=request.email,
            message=request.message
        )
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        return {"status": "success", "message": "Your message has been received. I'll get back to you soon!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")
