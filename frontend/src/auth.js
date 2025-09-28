// API Configuration
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const elements = {
    sections: {
        login: document.getElementById('loginSection'),
        register: document.getElementById('registerSection'),
        userTable: document.getElementById('userTableSection')
    },
    forms: {
        login: document.getElementById('loginForm'),
        register: document.getElementById('registerForm')
    },
    messages: {
        login: document.getElementById('loginMessage'),
        register: document.getElementById('registerMessage')
    },
    buttons: {
        logout: document.getElementById('logoutBtn'),
        prevPage: document.getElementById('prevPageBtn'),
        nextPage: document.getElementById('nextPageBtn')
    }
};

// Check authentication on load
let token = localStorage.getItem('token');
if (token) {
    showUserTable();
}

// Event Listeners
elements.forms.login.addEventListener('submit', handleLogin);
elements.forms.register.addEventListener('submit', handleRegister);
elements.buttons.logout.addEventListener('click', handleLogout);

// Auth Handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            showMessage('loginMessage', 'Login successful!', 'success');
            localStorage.setItem('token', data.token);
            token = data.token;
            showUserTable();
        } else {
            throw new Error(data.error || 'Login failed');
        }
    } catch (error) {
        showMessage('loginMessage', error.message, 'danger');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            showMessage('registerMessage', 'Registration successful! Please login.', 'success');
            setTimeout(() => showSection('loginSection'), 1500);
            e.target.reset();
        } else {
            throw new Error(data.error || 'Registration failed');
        }
    } catch (error) {
        showMessage('registerMessage', error.message, 'danger');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    token = null;
    showSection('loginSection');
}

// UI Helpers
function showSection(sectionId) {
    Object.values(elements.sections).forEach(section => {
        if (section) section.style.display = 'none';
    });
    const section = document.getElementById(sectionId);
    if (section) section.style.display = 'block';
}

function showUserTable() {
    showSection('userTableSection');
    loadUsers();
}

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.className = `alert alert-${type} mt-3`;
    element.textContent = message;
}

// User Management
async function loadUsers() {
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderUsers(data.users);
        } else if (response.status === 401) {
            handleLogout();
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsers(users) {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.status || 'active'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2">Edit</button>
                <button class="btn btn-sm btn-outline-danger">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}