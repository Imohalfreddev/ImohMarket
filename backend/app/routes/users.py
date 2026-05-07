from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from .. import models, database, auth, schemas

router = APIRouter(prefix="/users", tags=["users"])

class UserUpdate(BaseModel):
    username: str
    email: str

@router.put("/me")
def update_profile(user_update: UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    existing = db.query(models.User).filter((models.User.username == user_update.username) | (models.User.email == user_update.email)).first()
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=400, detail="Username or email taken")
    
    current_user.username = user_update.username
    current_user.email = user_update.email
    db.commit()
    return {"message": "Profile updated"}

@router.delete("/me")
def delete_account(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted"}

@router.post("/switch-role", response_model=schemas.Token)
def switch_role(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Toggles the user's role between buyer and seller and issues a new token."""
    # Determine the new role
    new_role = "seller" if current_user.role == "buyer" else "buyer"
    current_user.role = new_role
    db.commit()

    # If they are becoming a buyer for the first time, they need an empty cart
    if new_role == "buyer":
        existing_cart = db.query(models.Cart).filter(models.Cart.user_id == current_user.id).first()
        if not existing_cart:
            db.add(models.Cart(user_id=current_user.id))
            db.commit()

    # Generate a fresh token containing the new role
    access_token = auth.create_access_token(data={"sub": current_user.username, "role": current_user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": current_user.role}