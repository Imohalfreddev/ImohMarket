from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from .. import models, schemas, auth, database
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/auth", tags=["auth"])

class PasswordResetRequest(BaseModel): 
    email: str

class PasswordResetConfirm(BaseModel): 
    email: str
    new_password: str

@router.post("/signup")
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    if db.query(models.User).filter(models.User.username == user.username).first() or db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    new_user = models.User(
        full_name=user.full_name,
        username=user.username, 
        email=user.email, 
        hashed_password=auth.get_password_hash(user.password), 
        role=user.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    if new_user.role == "buyer":
        db.add(models.Cart(user_id=new_user.id))
        db.commit()
        
    return {"message": "User created successfully"}

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    return {"access_token": auth.create_access_token(data={"sub": user.username, "role": user.role}), "token_type": "bearer", "role": user.role}

@router.post("/forgot-password")
def forgot_password(req: PasswordResetRequest, db: Session = Depends(database.get_db)):
    return {"message": "If that email exists, a reset link was sent."}

@router.post("/reset-password")
def reset_password(req: PasswordResetConfirm, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user: 
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = auth.get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password updated"}