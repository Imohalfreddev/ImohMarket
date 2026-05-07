const API_URL = 'https://imohmarket.onrender.com';

const state = {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role')
};

// --- UI Utilities ---
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) { 
        container = document.createElement('div'); 
        container.id = 'toast-container'; 
        document.body.appendChild(container); 
    }
    const toast = document.createElement('div'); 
    toast.className = `toast ${type}`; 
    toast.innerText = message; 
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { 
        toast.classList.remove('show'); 
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
}

function initTheme() { 
    document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light'); 
}

function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next); 
    localStorage.setItem('theme', next);
}
initTheme();

function togglePassword(inputId, toggleBtnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(toggleBtnId);
    if (input.type === 'password') { 
        input.type = 'text'; 
        btn.innerText = 'HIDE'; 
    } else { 
        input.type = 'password'; 
        btn.innerText = 'SHOW'; 
    }
}

const setAuth = (token, role) => { 
    localStorage.setItem('token', token); 
    localStorage.setItem('role', role); 
    state.token = token; 
    state.role = role; 
};

const logout = () => { 
    localStorage.clear(); 
    window.location.href = 'index.html'; 
};

const getHeaders = () => ({ 
    'Content-Type': 'application/json', 
    ...(state.token ? { 'Authorization': `Bearer ${state.token}` } : {}) 
});

const getImageUrl = (url) => url.startsWith('http') ? url : `${API_URL}${url}`;

// --- Auth API ---
async function login(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('username', document.getElementById('username').value);
    formData.append('password', document.getElementById('password').value);
    
    const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', body: formData });
    if (res.ok) {
        const data = await res.json(); 
        setAuth(data.access_token, data.role);
        showToast("Access Granted. Loading Dashboard...", "success");
        setTimeout(() => window.location.href = data.role === 'seller' ? 'seller-dashboard.html' : 'buyer-dashboard.html', 1000);
    } else {
        showToast("Authentication failed.", "error");
    }
}

async function signup(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    if (password !== confirmPassword) { showToast("Passwords do not match!", "error"); return; }

    const payload = { 
        full_name: document.getElementById('fullname').value,
        username: document.getElementById('username').value, 
        email: document.getElementById('email').value, 
        password: password, 
        role: document.getElementById('role').value 
    };
    
    const res = await fetch(`${API_URL}/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { showToast("Registration complete!", "success"); setTimeout(() => window.location.href = 'login.html', 1500); } 
    else { showToast("Registration failed. Data error.", "error"); }
}

async function switchRole() {
    const res = await fetch(`${API_URL}/users/switch-role`, { method: 'POST', headers: getHeaders() });
    if (res.ok) {
        const data = await res.json();
        setAuth(data.access_token, data.role);
        showToast(`Switched to ${data.role} profile!`, "success");
        setTimeout(() => window.location.href = data.role === 'seller' ? 'seller-dashboard.html' : 'buyer-dashboard.html', 1000);
    }
}

// --- Automotive Core API ---
async function addProduct(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('make', document.getElementById('make').value);
    formData.append('model', document.getElementById('model').value);
    formData.append('year', document.getElementById('year').value);
    formData.append('mileage', document.getElementById('mileage').value);
    formData.append('fuel_type', document.getElementById('fuel_type').value);
    formData.append('transmission', document.getElementById('transmission').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('image', document.getElementById('image_file').files[0]);

    const res = await fetch(`${API_URL}/products/`, { 
        method: 'POST', 
        headers: state.token ? { 'Authorization': `Bearer ${state.token}` } : {}, 
        body: formData 
    });
    
    if (res.ok) { showToast('Vehicle listed in showroom!', 'success'); setTimeout(() => window.location.reload(), 1000); } 
    else { showToast('Failed to post vehicle.', 'error'); }
}

async function loadProducts() {
    const res = await fetch(`${API_URL}/products`); 
    const products = await res.json();
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No vehicles currently in inventory.</p>';
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="card">
            <img src="${getImageUrl(p.image_url)}" alt="${p.make} ${p.model}" onclick="window.location.href='product.html?id=${p.id}'" style="cursor: pointer; height: 200px; object-fit: cover; width: 100%;">
            <div class="card-content">
                <h3 class="card-title">${p.year} ${p.make} ${p.model}</h3>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 1rem 0;">
                    <span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${p.mileage.toLocaleString()} km</span>
                    <span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${p.transmission}</span>
                </div>
                <div class="card-price" style="font-weight: bold; font-size: 1.25rem; color: var(--primary);">$${p.price.toLocaleString()}</div>
                <button class="btn" style="width: 100%; margin-top: 1rem;" onclick="window.location.href='product.html?id=${p.id}'">View Inventory Detail</button>
            </div>
        </div>
    `).join('');
}

// --- Navigation Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const navAuth = document.getElementById('nav-auth');
    if (navAuth) {
        if (state.token) {
            const dashLink = state.role === 'seller' ? 'seller-dashboard.html' : 'buyer-dashboard.html';
            const switchText = state.role === 'buyer' ? 'Switch to Seller' : 'Switch to Buyer';
            navAuth.innerHTML = `
                <a href="products.html">Showroom</a> 
                <a href="${dashLink}">Dashboard</a> 
                <a onclick="switchRole()" style="cursor: pointer; color: var(--primary); font-weight: bold;">${switchText}</a>
                <a onclick="logout()" style="cursor: pointer;">Logout</a>
            `;
        } else {
            navAuth.innerHTML = `<a href="login.html">Login</a> <a href="signup.html">Sign Up</a>`;
        }
    }
});