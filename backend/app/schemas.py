from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    full_name: str
    username: str
    email: str
    password: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class ProductBase(BaseModel):
    name: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    mileage: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_url_2: Optional[str] = None
    image_url_3: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    owner_id: int
    class Config:
        orm_mode = True

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int

class OrderResponse(BaseModel):
    id: int
    total_price: float
    status: str
    created_at: datetime
    class Config:
        orm_mode = True