# 🏎️ ImohMarket | Elite Automotive Exchange

**The premier destination for high-end, production-ready automotive trade.**

ImohMarket is a sophisticated, full-stack marketplace platform engineered specifically for the luxury vehicle industry. It provides a secure, high-performance environment where elite sellers can showcase inventory and serious buyers can browse a curated showroom with confidence.

---

## 💎 Core Features

- **🚀 Dynamic Automotive Showroom:** A high-fidelity frontend designed to load and display vehicle inventory in real-time, optimized for high-resolution vehicle imagery.
- **🛠️ Vehicle-Specific Metadata:** Deep integration for car-specific data including **Make, Model, Year, Mileage, Fuel Type,** and **Transmission**.
- **🔐 Secure Role-Switching:** Dual-role architecture allowing users to toggle between **Buyer** and **Seller** profiles seamlessly, with distinct dashboard experiences.
- **🛡️ Production-Grade Security:** Robust authentication powered by **JWT (JSON Web Tokens)**, salted Bcrypt password hashing, and secure environment variable isolation.
- **🎨 Premium UI/UX:** A mobile-first, responsive interface featuring a native **Dark Mode** toggle and clean, professional typography.
- **🛒 Relational Persistence:** A specialized PostgreSQL backend ensuring user carts and listing data remain consistent across sessions.

---

## 🛠️ Technical Architecture

### **Backend (API Layer)**
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous Python)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (Production relational storage)
- **ORM:** SQLAlchemy 2.0
- **Validation:** Pydantic models for strict data integrity.

### **Frontend (UI Layer)**
- **Language:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **State Management:** LocalStorage-based authentication persistence.
- **Media Handling:** Multipart/form-data for high-quality vehicle uploads.

---

## 📂 Project Structure

```text
ImohMarket/
├── backend/
│   ├── app/
│   │   ├── routes/      # Specialized API endpoints (Vehicles, Auth, Users)
│   │   ├── models.py    # SQLAlchemy Vehicle & User schemas
│   │   ├── schemas.py   # Data validation & response shapes
│   │   └── main.py      # FastAPI entry point
│   ├── uploads/         # Local vehicle image storage
│   ├── .env             # Private credentials (Protected)
│   └── requirements.txt # Manifest of dependencies
├── frontend/
│   ├── index.html       # Showroom landing page
│   ├── app.js           # Core logic & Inventory API integration
│   └── style.css        # Premium branding & theme variables
└── README.md