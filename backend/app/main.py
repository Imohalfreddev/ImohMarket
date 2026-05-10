from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import auth, products, cart, orders, users

# Initialize Database Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ImohMarket API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all the route modules
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(users.router)

@app.get("/")
def root():
    return {"message": "ImohMarket API is running"}