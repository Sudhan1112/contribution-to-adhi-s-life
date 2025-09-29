// API Configuration
const API_CONFIG = {
    BASE_URL: 'https://contribution-to-adhi-s-life-1.onrender.com/api',
    ENDPOINTS: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        RESET_PASSWORD: '/auth/forgot-password',
        USER_PROFILE: '/auth/profile',
        USERS: '/users'
    }
};

// Authentication Service
export const authService = {
    token: localStorage.getItem('token'),

    async login(email, password) {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');
        
        this.token = data.token;
        localStorage.setItem('token', data.token);
        return data;
    },

    async register(name, email, password) {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.REGISTER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registration failed');
        return data;
    },

    async resetPassword(email) {
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.RESET_PASSWORD, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Password reset failed');
        return data;
    },

    async getUserProfile() {
        if (!this.token) throw new Error('Not authenticated');
        
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.USER_PROFILE, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to get profile');
        return data;
    },

    logout() {
        localStorage.removeItem('token');
        this.token = null;
    }
};