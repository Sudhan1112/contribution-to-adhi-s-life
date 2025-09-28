export const uiService = {
    showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.className = `alert alert-${type}`;
        element.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
            ${message}
        `;
    },

    setLoadingState(form, loading) {
        const button = form.querySelector('button[type="submit"]');
        if (loading) {
            button.disabled = true;
            button.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2"></span>
                Loading...
            `;
        } else {
            button.disabled = false;
            button.innerHTML = button.getAttribute('data-original-text') || button.innerHTML;
        }
    }
};