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
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('cart');
    localStorage.removeItem('cartTotal');
    state.token = null;
    state.role = null;
    window.location.href = 'index.html';
};

const getHeaders = () => ({ 
    'Content-Type': 'application/json', 
    ...(state.token ? { 'Authorization': `Bearer ${state.token}` } : {}) 
});

const getImageUrl = (url) => url && url.startsWith('http') ? url : `${API_URL}${url || ''}`;

// --- Auth API ---
async function login(e) {
    e.preventDefault();
    const formData = new FormData();
    const emailField = document.getElementById('email')?.value || '';
    const usernameField = document.getElementById('username')?.value || emailField;
    const passwordField = document.getElementById('password')?.value || '';
    
    formData.append('username', usernameField);
    formData.append('password', passwordField);
    
    try {
        const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', body: formData });
        if (res.ok) {
            const data = await res.json(); 
            setAuth(data.access_token, data.role);
            showToast("Access Granted. Loading Dashboard...", "success");
            setTimeout(() => window.location.href = data.role === 'seller' ? 'seller-dashboard.html' : 'buyer-dashboard.html', 1000);
        } else {
            showToast("Authentication failed. Please check your credentials.", "error");
        }
    } catch (error) {
        showToast("Network Error. Cannot reach server.", "error");
    }
}

async function signup(e) {
    e.preventDefault();
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirm-password')?.value || password; 
    
    if (password !== confirmPassword) { showToast("Passwords do not match!", "error"); return; }

    const emailInput = document.getElementById('email')?.value || '';
    const payload = { 
        full_name: document.getElementById('fullname')?.value || document.getElementById('fullName')?.value || 'User',
        username: document.getElementById('username')?.value || emailInput, 
        email: emailInput, 
        password: password, 
        role: document.getElementById('role')?.value || 'seller' 
    };
    
    try {
        const res = await fetch(`${API_URL}/auth/signup`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        if (res.ok) { 
            showToast("Registration complete!", "success"); 
            setTimeout(() => window.location.href = 'login.html', 1500); 
        } else { 
            showToast("Registration failed. Data might already exist.", "error"); 
        }
    } catch (error) {
        showToast("Network Error. Cannot reach server.", "error");
    }
}

async function switchRole() {
    try {
        const res = await fetch(`${API_URL}/users/switch-role`, { method: 'POST', headers: getHeaders() });
        if (res.ok) {
            const data = await res.json();
            setAuth(data.access_token, data.role);
            showToast(`Switched to ${data.role} profile!`, "success");
            setTimeout(() => window.location.href = data.role === 'seller' ? 'seller-dashboard.html' : 'buyer-dashboard.html', 1000);
        } else {
            showToast('Failed to switch role.', 'error');
        }
    } catch (error) {
        showToast('Network Error. Cannot reach server.', 'error');
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

    try {
        const res = await fetch(`${API_URL}/products/`, { 
            method: 'POST', 
            headers: state.token ? { 'Authorization': `Bearer ${state.token}` } : {}, 
            body: formData 
        });
        if (res.ok) { 
            showToast('Vehicle listed in showroom!', 'success'); 
            setTimeout(() => window.location.reload(), 1000); 
        } else { 
            showToast('Failed to post vehicle.', 'error'); 
        }
    } catch (error) {
        showToast('Network Error. Cannot reach server.', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
        const res = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (res.ok) {
            showToast('Listing deleted.', 'success');
            setTimeout(() => window.location.href = 'seller-dashboard.html', 1000);
        } else {
            showToast('Failed to delete listing.', 'error');
        }
    } catch (error) {
        showToast('Network Error. Cannot reach server.', 'error');
    }
}

async function editProduct(productId) {
    const res = await fetch(`${API_URL}/products/${productId}`);
    if (!res.ok) { showToast('Failed to load listing.', 'error'); return; }
    const p = await res.json();

    const modal = document.createElement('div');
    modal.id = 'edit-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;';
    modal.innerHTML = `
        <div style="background:var(--card-bg);border-radius:8px;padding:2rem;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;">
            <h3 style="margin-bottom:1.5rem;">Edit Listing</h3>
            <div class="form-group"><label>Listing Title</label><input id="edit-name" class="form-control" value="${p.name || ''}"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div class="form-group"><label>Make</label><input id="edit-make" class="form-control" value="${p.make || ''}"></div>
                <div class="form-group"><label>Model</label><input id="edit-model" class="form-control" value="${p.model || ''}"></div>
                <div class="form-group"><label>Year</label><input id="edit-year" type="number" class="form-control" value="${p.year || ''}"></div>
                <div class="form-group"><label>Mileage (km)</label><input id="edit-mileage" type="number" class="form-control" value="${p.mileage || ''}"></div>
                <div class="form-group"><label>Fuel Type</label>
                    <select id="edit-fuel_type" class="form-control">
                        <option ${p.fuel_type==='Petrol'?'selected':''}>Petrol</option>
                        <option ${p.fuel_type==='Diesel'?'selected':''}>Diesel</option>
                        <option ${p.fuel_type==='Electric'?'selected':''}>Electric</option>
                        <option ${p.fuel_type==='Hybrid'?'selected':''}>Hybrid</option>
                    </select>
                </div>
                <div class="form-group"><label>Transmission</label>
                    <select id="edit-transmission" class="form-control">
                        <option ${p.transmission==='Automatic'?'selected':''}>Automatic</option>
                        <option ${p.transmission==='Manual'?'selected':''}>Manual</option>
                    </select>
                </div>
            </div>
            <div class="form-group"><label>Price ($)</label><input id="edit-price" type="number" step="0.01" class="form-control" value="${p.price || ''}"></div>
            <div class="form-group"><label>Description</label><textarea id="edit-description" class="form-control" rows="3">${p.description || ''}</textarea></div>
            <div class="form-group"><label>New Photo (optional)</label><input id="edit-image" type="file" class="form-control" accept="image/*"></div>
            <div style="display:flex;gap:1rem;margin-top:1rem;">
                <button class="btn" style="flex:1;" onclick="saveEdit(${productId})">Save Changes</button>
                <button class="btn-outline" style="flex:1;" onclick="document.getElementById('edit-modal').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function saveEdit(productId) {
    const formData = new FormData();
    formData.append('name', document.getElementById('edit-name').value);
    formData.append('make', document.getElementById('edit-make').value);
    formData.append('model', document.getElementById('edit-model').value);
    formData.append('year', document.getElementById('edit-year').value);
    formData.append('mileage', document.getElementById('edit-mileage').value);
    formData.append('fuel_type', document.getElementById('edit-fuel_type').value);
    formData.append('transmission', document.getElementById('edit-transmission').value);
    formData.append('price', document.getElementById('edit-price').value);
    formData.append('description', document.getElementById('edit-description').value);
    const imageFile = document.getElementById('edit-image').files[0];
    if (imageFile) formData.append('image', imageFile);

    try {
        const res = await fetch(`${API_URL}/products/${productId}`, {
            method: 'PUT',
            headers: state.token ? { 'Authorization': `Bearer ${state.token}` } : {},
            body: formData
        });
        if (res.ok) {
            showToast('Listing updated!', 'success');
            document.getElementById('edit-modal').remove();
            setTimeout(() => loadMyListings(), 500);
        } else {
            showToast('Failed to update listing.', 'error');
        }
    } catch (error) {
        showToast('Network Error. Cannot reach server.', 'error');
    }
}

async function addToCart(productId) {
    if (!state.token) { showToast('Please log in as a buyer first.', 'error'); return; }
    if (state.role !== 'buyer') { showToast('Switch to buyer role to add to cart.', 'error'); return; }
    try {
        const res = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ product_id: productId, quantity: 1 })
        });
        if (res.ok) {
            showToast('Vehicle added to cart!', 'success');
        } else {
            const data = await res.json();
            showToast(data.detail || 'Failed to add to cart.', 'error');
        }
    } catch (error) {
        showToast('Network Error. Cannot reach server.', 'error');
    }
}

async function updateCartItem(itemId, action) {
    try {
        const res = await fetch(`${API_URL}/cart/item/${itemId}?action=${action}`, {
            method: 'PUT',
            headers: getHeaders()
        });
        if (res.ok) {
            loadCart();
        } else {
            showToast('Failed to update cart.', 'error');
        }
    } catch (error) {
        showToast('Network Error. Cannot reach server.', 'error');
    }
}

async function loadCart() {
    if (!state.token) {
        window.location.href = 'login.html';
        return;
    }
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    if (!cartItems) return;

    try {
        const res = await fetch(`${API_URL}/cart/`, { headers: getHeaders() });
        if (!res.ok) { cartItems.innerHTML = '<p>Failed to load cart.</p>'; return; }
        const data = await res.json();

        if (!data.items || data.items.length === 0) {
            cartItems.innerHTML = '<p style="text-align:center; color:#64748b;">Your cart is empty. <a href="products.html">Browse vehicles</a></p>';
            cartTotal.innerText = '$0.00';
            document.getElementById('checkout-btn').style.display = 'none';
            localStorage.removeItem('cart');
            localStorage.removeItem('cartTotal');
            return;
        }

        const cartForStorage = data.items.map(item => ({
            name: `${item.product.year || ''} ${item.product.make || ''} ${item.product.model || ''}`,
            price: item.product.price * item.quantity
        }));
        localStorage.setItem('cart', JSON.stringify(cartForStorage));
        localStorage.setItem('cartTotal', data.total);

        cartItems.innerHTML = data.items.map(item => `
            <div style="display:flex; align-items:center; gap:1rem; padding:1rem 0; border-bottom:1px solid var(--border);">
                <img src="${getImageUrl(item.product.image_url)}" style="width:100px; height:70px; object-fit:cover; border-radius:6px;">
                <div style="flex:1;">
                    <div style="font-weight:600;">${item.product.year || ''} ${item.product.make || ''} ${item.product.model || ''}</div>
                    <div style="color:#64748b; font-size:0.9rem;">$${item.product.price ? item.product.price.toLocaleString() : 'N/A'}</div>
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <button class="btn-outline" style="padding:0.25rem 0.6rem;" onclick="updateCartItem(${item.id}, 'decrease')">−</button>
                    <span style="min-width:24px; text-align:center;">${item.quantity}</span>
                    <button class="btn-outline" style="padding:0.25rem 0.6rem;" onclick="updateCartItem(${item.id}, 'increase')">+</button>
                </div>
                <div style="font-weight:bold; min-width:80px; text-align:right;">$${(item.product.price * item.quantity).toLocaleString()}</div>
            </div>
        `).join('');

        cartTotal.innerText = `$${data.total.toLocaleString()}`;
    } catch (error) {
        cartItems.innerHTML = '<p>Failed to load cart. Please try again.</p>';
    }
}

async function loadProducts() {
    try {
        const res = await fetch(`${API_URL}/products/`);
        const products = await res.json();
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        if (products.length === 0) {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No vehicles currently in inventory.</p>';
            return;
        }

        grid.innerHTML = products.map(p => `
            <div class="card">
                <img src="${getImageUrl(p.image_url)}" alt="${p.make || ''} ${p.model || ''}" onclick="window.location.href='product.html?id=${p.id}'" style="cursor: pointer; height: 200px; object-fit: cover; width: 100%;">
                <div class="card-content">
                    <h3 class="card-title">${p.year || ''} ${p.make || ''} ${p.model || ''}</h3>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 1rem 0;">
                        <span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${p.mileage ? p.mileage.toLocaleString() : 'N/A'} km</span>
                        <span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${p.transmission || 'N/A'}</span>
                    </div>
                    <div class="card-price" style="font-weight: bold; font-size: 1.25rem; color: var(--primary);">$${p.price ? p.price.toLocaleString() : 'N/A'}</div>
                    <button class="btn" style="width: 100%; margin-top: 1rem;" onclick="window.location.href='product.html?id=${p.id}'">View Inventory Detail</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        const grid = document.getElementById('product-grid');
        if (grid) grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Failed to load inventory. Please try again.</p>';
    }
}

async function loadSingleProduct() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;
    const detail = document.getElementById('product-detail');
    try {
        const res = await fetch(`${API_URL}/products/${id}`);
        if (!res.ok) { detail.innerHTML = '<p>Product not found.</p>'; return; }
        const p = await res.json();

        const isSeller = state.role === 'seller';
        const isBuyer = state.role === 'buyer';

        detail.innerHTML = `
            <img src="${getImageUrl(p.image_url)}" alt="${p.make || ''} ${p.model || ''}">
            <h1 style="font-size: 1.8rem; margin-bottom: 0.5rem;">${p.year || ''} ${p.make || ''} ${p.model || ''}</h1>
            <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin-bottom: 1rem;">$${p.price ? p.price.toLocaleString() : 'N/A'}</div>
            <div class="product-meta">
                <div class="meta-item"><span>Make</span><strong>${p.make || 'N/A'}</strong></div>
                <div class="meta-item"><span>Model</span><strong>${p.model || 'N/A'}</strong></div>
                <div class="meta-item"><span>Year</span><strong>${p.year || 'N/A'}</strong></div>
                <div class="meta-item"><span>Mileage</span><strong>${p.mileage ? p.mileage.toLocaleString() : 'N/A'} km</strong></div>
                <div class="meta-item"><span>Fuel Type</span><strong>${p.fuel_type || 'N/A'}</strong></div>
                <div class="meta-item"><span>Transmission</span><strong>${p.transmission || 'N/A'}</strong></div>
            </div>
            <p style="line-height: 1.7; margin-bottom: 1.5rem;">${p.description || ''}</p>
            ${isBuyer ? `<button class="btn" style="width: 100%; padding: 0.85rem;" onclick="addToCart(${p.id})">Add to Cart</button>` : ''}
            ${isSeller ? `<button class="btn" style="width: 100%; padding: 0.85rem; background: var(--danger); border-color: var(--danger);" onclick="deleteProduct(${p.id})">Delete Listing</button>` : ''}
        `;
    } catch (error) {
        detail.innerHTML = '<p>Failed to load product details.</p>';
    }
}

async function loadMyListings() {
    const container = document.getElementById('my-listings');
    if (!container) return;
    try {
        const res = await fetch(`${API_URL}/products/me`, { headers: getHeaders() });
        if (!res.ok) { container.innerHTML = '<p>Failed to load listings.</p>'; return; }
        const products = await res.json();

        if (products.length === 0) {
            container.innerHTML = '<p style="color:#64748b;">You have no active listings. Post one above!</p>';
            return;
        }

        container.innerHTML = products.map(p => `
            <div class="listing-card">
                <img src="${getImageUrl(p.image_url)}" alt="${p.make || ''} ${p.model || ''}">
                <div class="listing-card-info">
                    <h4>${p.year || ''} ${p.make || ''} ${p.model || ''}</h4>
                    <p>$${p.price ? p.price.toLocaleString() : 'N/A'} &bull; ${p.mileage ? p.mileage.toLocaleString() : 'N/A'} km &bull; ${p.transmission || 'N/A'}</p>
                </div>
                <div class="listing-card-actions">
                    <a href="product.html?id=${p.id}" class="btn-outline" style="padding: 0.4rem 1rem; font-size: 0.85rem; text-decoration: none;">View</a>
                    <button class="btn" style="padding: 0.4rem 1rem; font-size: 0.85rem;" onclick="editProduct(${p.id})">Edit</button>
                    <button class="btn" style="padding: 0.4rem 1rem; font-size: 0.85rem; background: var(--danger); border-color: var(--danger);" onclick="deleteProduct(${p.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p>Failed to load listings. Please try again.</p>';
    }
}

// --- Dynamic Navigation Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const navAuth = document.getElementById('nav-auth');
    if (navAuth) {
        navAuth.style.display = 'flex';
        navAuth.style.gap = '0.5rem';
        navAuth.style.alignItems = 'center';

        if (state.token) {
            const dashLink = state.role === 'seller' ? 'seller-dashboard.html' : 'buyer-dashboard.html';
            const switchText = state.role === 'buyer' ? 'Switch to Seller' : 'Switch to Buyer';

            navAuth.innerHTML = `
                <a href="products.html" class="btn-outline" style="width: auto; padding: 0.4rem 1rem; font-size: 0.9rem;">Showroom</a> 
                <a href="${dashLink}" class="btn-outline" style="width: auto; padding: 0.4rem 1rem; font-size: 0.9rem;">Dashboard</a> 
                <a onclick="switchRole()" class="btn" style="cursor: pointer; width: auto; padding: 0.4rem 1rem; font-size: 0.9rem;">${switchText}</a>
                <a onclick="logout()" class="btn-outline" style="cursor: pointer; width: auto; padding: 0.4rem 1rem; font-size: 0.9rem; color: var(--danger); border-color: var(--danger) !important;">Logout</a>
            `;
        } 
    }
});