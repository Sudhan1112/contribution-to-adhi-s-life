import { authService } from './auth.service.js';

const BASE_URL = 'https://contribution-to-adhi-s-life-backend-r348bm04u.vercel.app/api';

export const userService = {
    async getUsers(page = 1, limit = 10, search = '') {
        const response = await fetch(
            `${BASE_URL}/users?page=${page}&limit=${limit}&search=${search}`,
            {
                headers: { 'Authorization': `Bearer ${authService.token}` }
            }
        );

        if (response.status === 401) {
            throw new Error('Unauthorized');
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch users');
        return data;
    },

    async updateUser(userId, userData) {
        const response = await fetch(`${BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authService.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update user');
        return data;
    },

    async deleteUser(userId) {
        const response = await fetch(`${BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authService.token}` }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete user');
        return data;
    },

    async toggleUserStatus(userId) {
        const response = await fetch(`${BASE_URL}/users/${userId}/toggle-status`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authService.token}` }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to toggle user status');
        return data;
    }
};