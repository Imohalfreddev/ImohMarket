from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database, auth

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/checkout")
def checkout(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    cart = db.query(models.Cart).filter(models.Cart.user_id == current_user.id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
        
    total_price = sum(item.product.price * item.quantity for item in cart.items)
    
    new_order = models.Order(user_id=current_user.id, total_price=total_price)
    db.add(new_order)
    
    # Clear cart
    db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id).delete()
    db.commit()
    
    return {"message": "Payment successful, order confirmed", "order_id": new_order.id}