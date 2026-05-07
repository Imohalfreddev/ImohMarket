from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database, auth

router = APIRouter(prefix="/cart", tags=["cart"])

@router.get("/")
def get_cart(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Fetch the current buyer's cart and calculate totals."""
    cart = db.query(models.Cart).filter(models.Cart.user_id == current_user.id).first()
    if not cart:
        return {"items": [], "total": 0}
    
    items = []
    total = 0
    for item in cart.items:
        items.append({
            "id": item.id,
            "product": item.product,
            "quantity": item.quantity
        })
        total += item.product.price * item.quantity
        
    return {"cart_id": cart.id, "items": items, "total": total}

@router.post("/add")
def add_to_cart(item: schemas.CartItemAdd, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Add a product to the cart or increase its quantity if it already exists."""
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can add to cart")
        
    cart = db.query(models.Cart).filter(models.Cart.user_id == current_user.id).first()
    
    # Check if the product is already in the cart
    existing_item = db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id, models.CartItem.product_id == item.product_id).first()
    if existing_item:
        existing_item.quantity += item.quantity
    else:
        new_item = models.CartItem(cart_id=cart.id, product_id=item.product_id, quantity=item.quantity)
        db.add(new_item)
        
    db.commit()
    return {"message": "Added to cart"}

@router.put("/item/{item_id}")
def update_cart_item(item_id: int, action: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Increase or decrease the quantity of a specific item in the cart. Action must be 'increase' or 'decrease'."""
    # Ensure the item belongs to the current user's cart
    cart_item = db.query(models.CartItem).join(models.Cart).filter(
        models.CartItem.id == item_id, 
        models.Cart.user_id == current_user.id
    ).first()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Item not found in cart")
        
    if action == "increase":
        cart_item.quantity += 1
    elif action == "decrease":
        cart_item.quantity -= 1
        # If quantity hits zero, remove the item entirely
        if cart_item.quantity <= 0:
            db.delete(cart_item)
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'increase' or 'decrease'.")
            
    db.commit()
    return {"message": f"Item quantity {action}d"}