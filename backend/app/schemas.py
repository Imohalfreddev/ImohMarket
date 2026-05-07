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
    name: str
    price: float
    description: str
    image_url: str

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