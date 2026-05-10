from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import cloudinary
import cloudinary.uploader
import os
from .. import models, schemas, database, auth

cloudinary.config(
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key    = os.getenv("CLOUDINARY_API_KEY"),
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
)

router = APIRouter(prefix="/products", tags=["products"])


def upload_image(file: UploadFile) -> str:
    try:
        contents = file.file.read()
        result = cloudinary.uploader.upload(contents, folder="imohmarket")
        return result["secure_url"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")


@router.get("/", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(database.get_db)):
    return db.query(models.Product).all()


@router.post("/", response_model=schemas.ProductResponse)
def create_product(
    name: str = Form(...),
    make: str = Form(...),
    model: str = Form(...),
    year: int = Form(...),
    mileage: int = Form(...),
    fuel_type: str = Form(...),
    transmission: str = Form(...),
    price: float = Form(...),
    description: str = Form(...),
    image: UploadFile = File(...),
    image_2: Optional[UploadFile] = File(None),
    image_3: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can create products")

    image_url = upload_image(image)
    image_url_2 = upload_image(image_2) if image_2 and image_2.filename else None
    image_url_3 = upload_image(image_3) if image_3 and image_3.filename else None

    new_product = models.Product(
        name=name,
        make=make,
        model=model,
        year=year,
        mileage=mileage,
        fuel_type=fuel_type,
        transmission=transmission,
        price=price,
        description=description,
        image_url=image_url,
        image_url_2=image_url_2,
        image_url_3=image_url_3,
        owner_id=current_user.id
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.get("/me", response_model=List[schemas.ProductResponse])
def get_my_products(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Product).filter(models.Product.owner_id == current_user.id).all()


@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(database.get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    name: str = Form(...),
    make: str = Form(...),
    model: str = Form(...),
    year: int = Form(...),
    mileage: int = Form(...),
    fuel_type: str = Form(...),
    transmission: str = Form(...),
    price: float = Form(...),
    description: str = Form(...),
    image: UploadFile = File(None),
    image_2: Optional[UploadFile] = File(None),
    image_3: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this listing")

    product.name = name
    product.make = make
    product.model = model
    product.year = year
    product.mileage = mileage
    product.fuel_type = fuel_type
    product.transmission = transmission
    product.price = price
    product.description = description

    if image and image.filename:
        product.image_url = upload_image(image)
    if image_2 and image_2.filename:
        product.image_url_2 = upload_image(image_2)
    if image_3 and image_3.filename:
        product.image_url_3 = upload_image(image_3)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing")
    db.delete(product)
    db.commit()
    return {"message": "Listing deleted"}