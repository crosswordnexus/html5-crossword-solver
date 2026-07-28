/**
 * Toast Notification Utility
 */
const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'cw-toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 4000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `cw-toast ${type}`;
        toast.textContent = message;
        
        // Add to container
        this.container.appendChild(toast);
        
        // Force reflow for animation
        toast.offsetHeight;
        
        // Show
        toast.classList.add('show');
        
        // Auto-remove
        const remove = () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode === this.container) {
                    this.container.removeChild(toast);
                }
            }, 300);
        };

        toast.onclick = remove;
        if (duration > 0) {
            setTimeout(remove, duration);
        }
    },

    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error', 6000); },
    info(message) { this.show(message, 'info'); }
};

// Global shorthand
function showToast(message, type) {
    Toast.show(message, type);
}

// Expose on window object for ES module compatibility
window.Toast = Toast;
