class Toast {
    constructor() {
        this.createToastContainer();
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = this.getIcon(type);

        toast.innerHTML = `
            <div class="toast-content">
                ${icon}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">×</button>
        `;

        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        // Add close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.hide(toast));

        // Auto-hide after 5 seconds
        setTimeout(() => this.hide(toast), 5000);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    }

    hide(toast) {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }

    success(message) {
        this.show(message, 'success');
    }

    error(message) {
        this.show(message, 'error');
    }

    warning(message) {
        this.show(message, 'warning');
    }

    info(message) {
        this.show(message, 'info');
    }

    getIcon(type) {
        switch (type) {
            case 'success':
                return '<svg class="toast-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>';
            case 'error':
                return '<svg class="toast-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>';
            case 'warning':
                return '<svg class="toast-icon" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.17L19.83 19H4.17L12 5.17zM11 16h2v2h-2zm0-6h2v4h-2z"/></svg>';
            default:
                return '<svg class="toast-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-11h2v2h-2zm0 4h2v6h-2z"/></svg>';
        }
    }
}

export const toast = new Toast();
export default Toast;