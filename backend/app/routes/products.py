from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
import shutil
import uuid
from .. import models, schemas, database, auth

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(database.get_db)):
    """Fetch all products available in the marketplace."""
    return db.query(models.Product).all()

@router.post("/", response_model=schemas.ProductResponse)
def create_product(
    name: str = Form(...),
    price: float = Form(...),
    description: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """Allow sellers to create a new product with an image upload."""
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can create products")
    
    # Generate a unique filename to prevent overwriting existing files
    file_extension = image.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_location = f"uploads/{unique_filename}"
    
    # Save the file physically to the disk
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(image.file, file_object)
        
    # Set the URL path to the newly saved image
    image_url = f"/uploads/{unique_filename}"
    
    new_product = models.Product(
        name=name, 
        price=price, 
        description=description, 
        image_url=image_url, 
        owner_id=current_user.id
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.get("/me", response_model=List[schemas.ProductResponse])
def get_my_products(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Fetch only the products created by the currently logged-in seller."""
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Product).filter(models.Product.owner_id == current_user.id).all()

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(database.get_db)):
    """Fetch details for a single product by its ID."""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product