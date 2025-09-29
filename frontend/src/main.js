import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles.css';

// Global state
let currentPage = 1;
const itemsPerPage = 10;
let userRole = null;
let token = localStorage.getItem('token');
let userId = localStorage.getItem('userId');

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const resetForm = document.getElementById('resetForm');
const usersTable = document.getElementById('usersTable').getElementsByTagName('tbody')[0];
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');
const searchInput = document.getElementById('searchInput');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const authSection = document.getElementById('authSection');

// API URL configuration
const API_URL = 'https://contribution-to-adhi-s-life-1.onrender.com';

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
resetForm.addEventListener('submit', handlePasswordReset);
prevPageBtn.addEventListener('click', () => changePage(-1));
nextPageBtn.addEventListener('click', () => changePage(1));
searchInput.addEventListener('input', debounce(handleSearch, 300));
logoutBtn.addEventListener('click', handleLogout);

// Initialize application
checkAuth();

// Authentication handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        setLoading(submitBtn, true);
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            showSuccessMessage(messageDiv, 'Login successful!');
            checkAuth();
            e.target.reset();
        } else {
            showErrorMessage(messageDiv, data.message || 'Login failed');
        }
    } catch (error) {
        showErrorMessage(messageDiv, 'An error occurred. Please try again.');
    } finally {
        setLoading(submitBtn, false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const messageDiv = document.getElementById('registerMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        setLoading(submitBtn, true);
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            showSuccessMessage(messageDiv, 'Registration successful! Please login.');
            e.target.reset();
        } else {
            showErrorMessage(messageDiv, data.message || 'Registration failed');
        }
    } catch (error) {
        showErrorMessage(messageDiv, 'An error occurred. Please try again.');
    } finally {
        setLoading(submitBtn, false);
    }
}

async function handlePasswordReset(e) {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;
    const messageDiv = document.getElementById('resetMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        setLoading(submitBtn, true);
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        
        if (response.ok) {
            showSuccessMessage(messageDiv, 'Password reset email sent!');
            e.target.reset();
        } else {
            showErrorMessage(messageDiv, data.message || 'Password reset failed');
        }
    } catch (error) {
        showErrorMessage(messageDiv, 'An error occurred. Please try again.');
    } finally {
        setLoading(submitBtn, false);
    }
}

async function checkAuth() {
    if (!token) {
        handleLogout();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/check`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            userRole = data.role;
            userName.textContent = data.name;
            showAuthenticatedUI();
            loadUsers();
        } else {
            handleLogout();
        }
    } catch (error) {
        handleLogout();
    }
}

function showAuthenticatedUI() {
    authSection.classList.add('animated');
    authSection.style.display = 'none';
    userInfo.style.display = 'block';
    logoutBtn.style.display = 'block';
    
    // Trigger animations
    userInfo.classList.add('animated');
    logoutBtn.classList.add('animated');
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    token = null;
    userId = null;
    userRole = null;
    authSection.style.display = 'block';
    userInfo.style.display = 'none';
    logoutBtn.style.display = 'none';
    usersTable.innerHTML = '';
    
    // Reset forms
    loginForm.reset();
    registerForm.reset();
    resetForm.reset();
}

// User management functionality
async function loadUsers(searchQuery = '') {
    try {
        const response = await fetch(
            `${API_URL}/users?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (response.ok) {
            const data = await response.json();
            renderUsers(data.users);
            updatePagination(data.totalPages);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsers(users) {
    usersTable.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.classList.add('animated');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center gap-2">
                    <i class="fas fa-user-circle text-muted"></i>
                    <span>${user.name}</span>
                </div>
            </td>
            <td>${user.email}</td>
            <td><span class="badge bg-${user.role === 'admin' ? 'danger' : 'primary'}">${user.role}</span></td>
            <td><span class="badge bg-${user.status === 'active' ? 'success' : 'warning'}">${user.status}</span></td>
            <td class="text-end">
                ${userRole === 'admin' && user._id !== userId ? `
                    <button class="btn btn-sm btn-${user.status === 'active' ? 'warning' : 'success'} me-1" 
                            onclick="toggleUserStatus('${user._id}', '${user.status}')">
                        <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </td>
        `;
        usersTable.appendChild(row);
    });
}

function updatePagination(totalPages) {
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    currentPageSpan.textContent = `Page ${currentPage} of ${totalPages}`;
}

function changePage(delta) {
    currentPage += delta;
    loadUsers(searchInput.value);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function handleSearch() {
    currentPage = 1;
    loadUsers(searchInput.value);
}

window.toggleUserStatus = async function(userId, currentStatus) {
    try {
        const response = await fetch(`${API_URL}/users/${userId}/toggle-status`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            loadUsers(searchInput.value);
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
    }
};

window.deleteUser = async function(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            loadUsers(searchInput.value);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    }
};

function showSuccessMessage(element, message) {
    element.className = 'alert alert-success mt-3 animated';
    element.textContent = message;
}

function showErrorMessage(element, message) {
    element.className = 'alert alert-danger mt-3 animated';
    element.textContent = message;
}

function setLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}