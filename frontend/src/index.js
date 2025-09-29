import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles.css';

let currentPage = 1;
const itemsPerPage = 10;
let userRole = null;
let token = localStorage.getItem('token');
let userId = localStorage.getItem('userId');

// DOM Elements
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const userTableSection = document.getElementById('userTableSection');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const usersTable = document.getElementById('usersTable').getElementsByTagName('tbody')[0];
const logoutBtn = document.getElementById('logoutBtn');

// API URL
const API_URL = 'https://contribution-to-adhi-s-life-1.onrender.com/api';

// Event Listeners
registerForm.addEventListener('submit', handleRegister);
loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);

// Navigation event listeners
document.getElementById('showLoginBtn').addEventListener('click', showLoginPage);
document.getElementById('showRegisterBtn').addEventListener('click', showRegisterPage);

// Search and pagination event listeners
document.getElementById('searchBtn').addEventListener('click', () => handleSearch());
document.getElementById('searchInput').addEventListener('input', debounce(() => handleSearch(), 300));
document.getElementById('prevPageBtn').addEventListener('click', () => changePage(-1));
document.getElementById('nextPageBtn').addEventListener('click', () => changePage(1));

// Check authentication status on page load
checkAuth();

async function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted'); // Debug line
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');

    try {
        console.log('Sending login request to:', `${API_URL}/auth/login`);
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Login response:', data); // Debug line
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userRole', data.user.role);
            showSuccessMessage(messageDiv, 'Login successful! Redirecting to dashboard...');
            
            // Wait 1.5 seconds before showing the user table
            setTimeout(() => {
                showUserTableSection();
                document.getElementById('userInfo').style.display = 'block';
                document.getElementById('userName').textContent = data.user.name;
                logoutBtn.style.display = 'block';
                loadUsers(); // This will now load users with authentication
            }, 1500);
        } else {
            showErrorMessage(messageDiv, data.error || 'Invalid email or password');
        }
    } catch (error) {
        console.error('Login error:', error); // Debug line
        showErrorMessage(messageDiv, 'An error occurred. Please try again.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const messageDiv = document.getElementById('registerMessage');

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            showSuccessMessage(messageDiv, 'Registration successful! Please login.');
            registerForm.reset();
        } else {
            showErrorMessage(messageDiv, data.message || 'Registration failed');
        }
    } catch (error) {
        showErrorMessage(messageDiv, 'An error occurred. Please try again.');
    }
}

async function handlePasswordReset(e) {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;
    const messageDiv = document.getElementById('resetMessage');

    try {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        
        if (response.ok) {
            showSuccessMessage(messageDiv, 'Password reset email sent!');
            resetForm.reset();
        } else {
            showErrorMessage(messageDiv, data.message || 'Password reset failed');
        }
    } catch (error) {
        showErrorMessage(messageDiv, 'An error occurred. Please try again.');
    }
}

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginPage();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            userRole = data.role;
            document.getElementById('userInfo').style.display = 'block';
            document.getElementById('userName').textContent = data.name;
            logoutBtn.style.display = 'block';
            showUserTableSection();
            loadUsers();
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('userRole');
            showLoginPage();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        showLoginPage();
    }
}

function showAuthenticatedUI() {
    authSection.style.display = 'none';
    userInfo.style.display = 'block';
    logoutBtn.style.display = 'block';
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    token = null;
    userId = null;
    userRole = null;
    usersTable.innerHTML = '';
    showLoginPage();
}

async function loadUsers(searchQuery = '') {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showLoginPage();
            return;
        }

        const response = await fetch(
            `${API_URL}/users?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.ok) {
            const data = await response.json();
            console.log('Users data:', data); // Debug line
            renderUsers(data.users);
            updatePagination(data.totalPages);
        } else if (response.status === 401) {
            // If unauthorized, clear storage and show login
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('userRole');
            showLoginPage();
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsers(users) {
    usersTable.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge bg-${user.role === 'admin' ? 'danger' : 'primary'}">${user.role}</span></td>
            <td><span class="badge bg-${user.status === 'active' ? 'success' : 'warning'}">${user.status}</span></td>
            <td>
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

function showLoginPage() {
    loginSection.style.display = 'block';
    registerSection.style.display = 'none';
    userTableSection.style.display = 'none';
    // Clear registration form and messages
    registerForm.reset();
    const registerMessage = document.getElementById('registerMessage');
    if (registerMessage) registerMessage.textContent = '';
}

function showRegisterPage() {
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
    userTableSection.style.display = 'none';
    // Clear login form and messages
    loginForm.reset();
    const loginMessage = document.getElementById('loginMessage');
    if (loginMessage) loginMessage.textContent = '';
}

function showUserTableSection() {
    loginSection.style.display = 'none';
    registerSection.style.display = 'none';
    userTableSection.style.display = 'block';
    // Load users when showing the table
    loadUsers();
    logoutBtn.style.display = 'block';
}

function showSuccessMessage(element, message) {
    element.className = 'alert alert-success mt-3';
    element.textContent = message;
}

function showErrorMessage(element, message) {
    element.className = 'alert alert-danger mt-3';
    element.textContent = message;
}