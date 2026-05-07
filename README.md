# 🏎️ ImohMarket | Elite Automotive Exchange

**The premier destination for high-performance, production-ready automotive trade.**

ImohMarket is a sophisticated full-stack marketplace platform engineered for the luxury vehicle industry. It provides a secure environment where elite sellers can showcase inventory and serious buyers can browse a curated showroom with real-time data persistence.

---

## 🌐 Live Environment

* **Frontend UI:** [Your-Vercel-Link-Here.vercel.app]
* **Backend API:** [https://imohmarket.onrender.com/docs](https://imohmarket.onrender.com/docs)
* **Database:** PostgreSQL (Supabase)

---

## 💎 Core Features

- **🚀 Dynamic Automotive Showroom:** A high-fidelity frontend designed to display vehicle inventory in real-time, optimized for high-resolution vehicle imagery.
- **🛠️ Vehicle-Specific Metadata:** Deep integration for car-specific data including **Make, Model, Year, Mileage, Fuel Type,** and **Transmission**.
- **🔐 Secure Role-Switching:** Dual-role architecture allowing users to toggle between **Buyer** and **Seller** profiles with distinct dashboard experiences.
- **🛡️ Production-Grade Security:** Robust authentication powered by **JWT (JSON Web Tokens)** and salted Bcrypt password hashing.
- **🎨 Premium UI/UX:** A mobile-first, responsive interface featuring a native **Dark Mode** toggle and professional typography.
- **🛒 Relational Persistence:** A specialized PostgreSQL backend ensuring user data and listings remain consistent across sessions.

---

## 🛠️ Technical Architecture

### **Backend (API Layer)**
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous Python)
- **Database:** [PostgreSQL](https://www.postgresql.org/) via Supabase
- **ORM:** SQLAlchemy 2.0 with Pydantic validation.
- **Hosting:** Render (Web Service)

### **Frontend (UI Layer)**
- **Language:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **State Management:** LocalStorage-based auth persistence.
- **Hosting:** Vercel

---

## 📂 Project Structure

```text
ImohMarket/
├── backend/
│   ├── app/
│   │   ├── routes/      # Specialized API endpoints (Vehicles, Auth, Users)
│   │   ├── models.py    # SQLAlchemy Relational schemas
│   │   ├── database.py  # Connection pooling and engine setup
│   │   └── main.py      # FastAPI entry point
│   ├── requirements.txt # Production dependencies
│   └── .env             # Configuration (Protected)
├── frontend/
│   ├── index.html       # Showroom landing page
│   ├── app.js           # Core logic & API integration
│   └── style.css        # Premium branding & theme variables
└── README.md