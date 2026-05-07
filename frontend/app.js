const API_URL = 'http://localhost:8000';

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
        showToast("Login successful!", "success");
        setTimeout(() => window.location.href = data.role === 'seller' ? 'seller-dashboard.html' : 'products.html', 1000);
    } else {
        showToast("Login failed. Check credentials.", "error");
    }
}

async function signup(e) {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
        showToast("Passwords do not match!", "error");
        return;
    }

    const payload = { 
        full_name: document.getElementById('fullname').value,
        username: document.getElementById('username').value, 
        email: document.getElementById('email').value, 
        password: password, 
        role: document.getElementById('role').value 
    };
    
    const res = await fetch(`${API_URL}/auth/signup`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
    });
    
    if (res.ok) { 
        showToast("Account created successfully! Redirecting to login...", "success"); 
        setTimeout(() => window.location.href = 'login.html', 1500); 
    } else {
        showToast("Signup failed. Username or email may exist.", "error");
    }
}

// --- Role Switching API ---
async function switchRole() {
    const res = await fetch(`${API_URL}/users/switch-role`, { 
        method: 'POST', 
        headers: getHeaders() 
    });
    
    if (res.ok) {
        const data = await res.json();
        setAuth(data.access_token, data.role);
        showToast(`Successfully switched to ${data.role} mode!`, "success");
        // Redirect to the appropriate dashboard for their new role
        setTimeout(() => window.location.href = data.role === 'seller' ? 'seller-dashboard.html' : 'buyer-dashboard.html', 1000);
    } else {
        showToast("Failed to switch roles.", "error");
    }
}

// --- Product API ---
async function loadProducts() {
    const res = await fetch(`${API_URL}/products`); 
    const products = await res.json();
    
    document.getElementById('product-grid').innerHTML = products.map(p => `
        <div class="card">
            <img src="${getImageUrl(p.image_url)}" alt="${p.name}" onclick="window.location.href='product.html?id=${p.id}'" style="cursor: pointer;">
            <div class="card-content">
                <h3 class="card-title" onclick="window.location.href='product.html?id=${p.id}'" style="cursor: pointer;">${p.name}</h3>
                <p>${p.description}</p>
                <div class="card-price">$${p.price.toFixed(2)}</div>
                ${state.role === 'buyer' ? `<button class="btn" onclick="addToCart(${p.id})">Add to Cart</button>` : ''}
            </div>
        </div>
    `).join('');
}

async function loadSingleProduct() {
    const productId = new URLSearchParams(window.location.search).get('id'); 
    if (!productId) return;
    
    const res = await fetch(`${API_URL}/products/${productId}`);
    if (res.ok) {
        const p = await res.json();
        document.getElementById('product-detail').innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <img src="${getImageUrl(p.image_url)}" alt="${p.name}" style="width: 100%; border-radius: 8px; object-fit: cover;">
                <div>
                    <h1 style="margin-bottom: 1rem;">${p.name}</h1>
                    <h2 class="card-price" style="font-size: 2rem;">$${p.price.toFixed(2)}</h2>
                    <p style="margin: 1.5rem 0; font-size: 1.1rem; color: #475569;">${p.description}</p>
                    ${state.role === 'buyer' ? `<button class="btn" onclick="addToCart(${p.id})">Add to Cart</button>` : ''}
                </div>
            </div>
        `;
    }
}

// --- Cart API ---
async function addToCart(productId) {
    if (!state.token) { window.location.href = 'login.html'; return; }
    await fetch(`${API_URL}/cart/add`, { 
        method: 'POST', headers: getHeaders(), body: JSON.stringify({ product_id: productId, quantity: 1 }) 
    });
    showToast('Item added to cart!', 'success');
}

async function updateCartQuantity(itemId, action) { 
    await fetch(`${API_URL}/cart/item/${itemId}?action=${action}`, { method: 'PUT', headers: getHeaders() }); 
    loadCart(); 
}

async function loadCart() {
    const res = await fetch(`${API_URL}/cart/`, { headers: getHeaders() }); 
    const data = await res.json();
    const cartContainer = document.getElementById('cart-items'); 
    if (!cartContainer) return;
    
    if (data.items.length === 0) { 
        cartContainer.innerHTML = '<p>Your cart is empty.</p>'; 
        document.getElementById('checkout-btn').disabled = true; 
    } else {
        cartContainer.innerHTML = data.items.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding: 1rem 0;">
                <div style="flex: 2;">
                    <strong>${item.product.name}</strong>
                    <div style="color: #64748b;">$${item.product.price.toFixed(2)} each</div>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <button class="btn" style="padding: 0.2rem 0.6rem; width: auto;" onclick="updateCartQuantity(${item.id}, 'decrease')">-</button>
                    <span>${item.quantity}</span>
                    <button class="btn" style="padding: 0.2rem 0.6rem; width: auto;" onclick="updateCartQuantity(${item.id}, 'increase')">+</button>
                </div>
                <div style="flex: 1; text-align: right; font-weight: bold;">
                    $${(item.product.price * item.quantity).toFixed(2)}
                </div>
            </div>
        `).join('');
        document.getElementById('checkout-btn').disabled = false;
    }
    document.getElementById('cart-total').innerText = `$${data.total.toFixed(2)}`;
}

// --- Checkout API ---
async function processFinalCheckout(e) {
    e.preventDefault(); 
    const res = await fetch(`${API_URL}/orders/checkout`, { method: 'POST', headers: getHeaders() });
    
    if (res.ok) { 
        document.getElementById('checkout-form').classList.add('hidden'); 
        document.getElementById('success-message').classList.remove('hidden'); 
        showToast('Payment successful!', 'success'); 
    } else {
        showToast('Checkout failed or cart is empty.', 'error');
    }
}

// --- Seller API ---
async function addProduct(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('image', document.getElementById('image_file').files[0]);

    const headers = state.token ? { 'Authorization': `Bearer ${state.token}` } : {};
    const res = await fetch(`${API_URL}/products/`, { method: 'POST', headers: headers, body: formData });
    
    if (res.ok) {
        showToast('Product successfully uploaded!', 'success');
        setTimeout(() => window.location.reload(), 1000);
    } else {
        showToast('Failed to upload product.', 'error');
    }
}

// --- User Profile API ---
async function updateProfile(e) {
    e.preventDefault();
    const payload = { username: document.getElementById('prof-username').value, email: document.getElementById('prof-email').value };
    const res = await fetch(`${API_URL}/users/me`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload) });
    
    if(res.ok) showToast("Profile updated successfully!", "success"); 
    else showToast("Update failed. Username/Email taken.", "error");
}

async function deleteAccount() {
    if(confirm("Are you absolutely sure? This will delete all your data.")) {
        const res = await fetch(`${API_URL}/users/me`, { method: 'DELETE', headers: getHeaders() });
        if(res.ok) { showToast("Account deleted.", "success"); setTimeout(logout, 1500); }
    }
}

// --- Password Resets ---
async function requestReset(e) {
    e.preventDefault(); 
    const email = document.getElementById('reset-email').value;
    const res = await fetch(`${API_URL}/auth/forgot-password`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) 
    });
    if (res.ok) { showToast("Reset link simulated! Redirecting...", "success"); setTimeout(() => window.location.href = `reset-password.html?email=${email}`, 1500); }
}

async function confirmReset(e) {
    e.preventDefault(); 
    const email = new URLSearchParams(window.location.search).get('email');
    const newPassword = document.getElementById('new-password').value;
    const res = await fetch(`${API_URL}/auth/reset-password`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, new_password: newPassword }) 
    });
    if (res.ok) { showToast("Password updated!", "success"); setTimeout(() => window.location.href = 'login.html', 1500); } 
    else showToast("Failed to reset password.", "error");
}

// --- Global Nav Setup ---
document.addEventListener('DOMContentLoaded', () => {
    const navAuth = document.getElementById('nav-auth');
    if (navAuth) {
        if (state.token) {
            const dashLink = state.role === 'seller' ? 'seller-dashboard.html' : 'buyer-dashboard.html';
            const switchText = state.role === 'buyer' ? 'Switch to Seller' : 'Switch to Buyer';
            
            navAuth.innerHTML = `
                <a href="products.html">Browse</a> 
                ${state.role === 'buyer' ? '<a href="cart.html">Cart</a>' : ''} 
                <a href="${dashLink}">Dashboard</a> 
                <a onclick="switchRole()" style="cursor: pointer; color: var(--primary); font-weight: bold;">${switchText}</a>
                <a href="profile.html">Profile</a> 
                <a onclick="logout()" style="cursor: pointer;">Logout</a>
            `;
        } else {
            navAuth.innerHTML = `<a href="login.html">Login</a> <a href="signup.html">Sign Up</a>`;
        }
    }
});