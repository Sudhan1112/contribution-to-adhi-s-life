import { authService } from './services/auth.service.js';
import { userService } from './services/user.service.js';
import { uiService } from './services/ui.service.js';

// DOM Elements
const elements = {
    forms: {
        login: document.getElementById('loginForm'),
        register: document.getElementById('registerForm'),
        reset: document.getElementById('resetForm')
    },
    messages: {
        login: document.getElementById('loginMessage'),
        register: document.getElementById('registerMessage'),
        reset: document.getElementById('resetMessage')
    },
    userInfo: document.getElementById('userInfo'),
    userName: document.getElementById('userName'),
    logoutBtn: document.getElementById('logoutBtn'),
    searchInput: document.getElementById('searchInput'),
    prevPageBtn: document.getElementById('prevPage'),
    nextPageBtn: document.getElementById('nextPage'),
    currentPageSpan: document.getElementById('currentPage'),
    usersTable: document.querySelector('#usersTable tbody')
};

// Initialize pagination
let currentPage = 1;
const PAGE_SIZE = 10;

// Event Handlers
function attachEventListeners() {
    // Auth form submissions
    elements.forms.login.addEventListener('submit', handleLogin);
    elements.forms.register.addEventListener('submit', handleRegister);
    elements.forms.reset.addEventListener('submit', handlePasswordReset);
    elements.logoutBtn.addEventListener('click', handleLogout);

    // Search and pagination
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    elements.prevPageBtn.addEventListener('click', () => changePage(-1));
    elements.nextPageBtn.addEventListener('click', () => changePage(1));
}

// Event Handlers
async function handleLogin(e) {
    e.preventDefault();
    uiService.setLoadingState(e.target, true);

    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const data = await authService.login(email, password);
        uiService.showMessage('loginMessage', 'Login successful! Loading your dashboard...', 'success');
        
        elements.userInfo.style.display = 'block';
        elements.userName.textContent = data.user.name;
        elements.logoutBtn.style.display = 'block';
        
        await loadUsers();
    } catch (error) {
        uiService.showMessage('loginMessage', error.message, 'danger');
    } finally {
        uiService.setLoadingState(e.target, false);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    uiService.setLoadingState(e.target, true);

    try {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        const data = await authService.register(name, email, password);
        uiService.showMessage('registerMessage', data.message, 'success');
        e.target.reset();
    } catch (error) {
        uiService.showMessage('registerMessage', error.message, 'danger');
    } finally {
        uiService.setLoadingState(e.target, false);
    }
}

function handleLogout() {
    authService.logout();
    window.location.reload();
}

async function handleSearch() {
    currentPage = 1;
    await loadUsers(elements.searchInput.value);
}

async function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage < 1) return;
    
    currentPage = newPage;
    await loadUsers(elements.searchInput.value);
}

// User Management
async function loadUsers(search = '') {
    if (!authService.token) return;
    
    try {
        const data = await userService.getUsers(currentPage, PAGE_SIZE, search);
        renderUsers(data.users);
        updatePagination(data.totalPages);
    } catch (error) {
        console.error('Error loading users:', error);
        if (error.message === 'Unauthorized') {
            handleLogout();
        }
    }
}

function renderUsers(users) {
    elements.usersTable.innerHTML = '';
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-sm bg-primary-subtle rounded-circle me-2 d-flex align-items-center justify-content-center">
                        <i class="fas fa-user text-primary"></i>
                    </div>
                    ${user.name}
                </div>
            </td>
            <td>${user.email}</td>
            <td>
                <span class="badge bg-${user.role === 'admin' ? 'danger' : 'info'}">
                    <i class="fas fa-${user.role === 'admin' ? 'shield-alt' : 'user'} me-1"></i>
                    ${user.role}
                </span>
            </td>
            <td>
                <span class="badge bg-${user.status === 'active' ? 'success' : 'warning'}">
                    <i class="fas fa-${user.status === 'active' ? 'check-circle' : 'clock'} me-1"></i>
                    ${user.status}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    ${user.role !== 'admin' ? `
                        <button class="user-action-btn edit" onclick="window.editUser('${user._id}')" title="Edit User">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="user-action-btn delete" onclick="window.deleteUser('${user._id}')" title="Delete User">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        elements.usersTable.appendChild(tr);
    });
}

function updatePagination(totalPages) {
    elements.currentPageSpan.textContent = `Page ${currentPage} of ${totalPages}`;
    elements.prevPageBtn.disabled = currentPage === 1;
    elements.nextPageBtn.disabled = currentPage >= totalPages;
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    attachEventListeners();
    
    // Auto-login if token exists
    if (authService.token) {
        elements.userInfo.style.display = 'block';
        elements.logoutBtn.style.display = 'block';
        loadUsers();
    }
});