/**
 * ImohMarket | Elite Automotive Exchange
 * Core Frontend Logic
 */

// 1. PRODUCTION API CONFIGURATION
const API_URL = "https://imohmarket.onrender.com";

// 2. STATE MANAGEMENT
const state = {
    user: JSON.parse(localStorage.getItem('imoh_user')) || null,
    token: localStorage.getItem('imoh_token') || null,
    cars: []
};

// 3. CORE API FUNCTIONS
const api = {
    // Fetch all car listings
    async getCars() {
        try {
            const response = await fetch(`${API_URL}/vehicles`);
            if (!response.ok) throw new Error('Failed to fetch inventory');
            return await response.json();
        } catch (err) {
            console.error('API Error:', err);
            return [];
        }
    },

    // Handle Login
    async login(email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('imoh_token', data.access_token);
                localStorage.setItem('imoh_user', JSON.stringify(data.user));
                window.location.reload(); // Refresh to update UI
            } else {
                alert(data.detail || 'Login failed');
            }
        } catch (err) {
            alert('Server connection failed. Is the backend awake?');
        }
    }
};

// 4. UI RENDERING LOGIC
const ui = {
    renderShowroom(cars) {
        const container = document.getElementById('car-container');
        if (!container) return;

        if (cars.length === 0) {
            container.innerHTML = `<p class="no-cars">No elite vehicles currently listed. Check back soon!</p>`;
            return;
        }

        container.innerHTML = cars.map(car => `
            <div class="car-card">
                <div class="car-image">
                    <img src="${car.image_url || 'https://via.placeholder.com/400x250?text=Premium+Auto'}" alt="${car.make}">
                </div>
                <div class="car-info">
                    <h3>${car.year} ${car.make} ${car.model}</h3>
                    <p class="car-price">$${car.price.toLocaleString()}</p>
                    <div class="car-specs">
                        <span>⛽ ${car.fuel_type}</span>
                        <span>🛣️ ${car.mileage.toLocaleString()} miles</span>
                    </div>
                    <button class="view-btn" onclick="viewDetails('${car.id}')">View Listing</button>
                </div>
            </div>
        `).join('');
    },

    updateAuthDisplay() {
        const authSection = document.getElementById('auth-links');
        if (!authSection) return;

        if (state.token) {
            authSection.innerHTML = `
                <span>Welcome, ${state.user.full_name}</span>
                <button onclick="logout()">Logout</button>
            `;
        }
    }
};

// 5. INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🏎️ ImohMarket Initialized | Connecting to:", API_URL);
    
    ui.updateAuthDisplay();
    
    // Load Inventory
    const inventory = await api.getCars();
    ui.renderShowroom(inventory);
});

// Helper for Global Access
window.logout = () => {
    localStorage.clear();
    window.location.reload();
};