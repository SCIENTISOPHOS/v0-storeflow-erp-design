/**
 * StoreFlow ERP - Header Component
 * Composant d'en-tete principal
 */

const Header = {
    searchQuery: '',
    
    /**
     * Render header HTML
     */
    render() {
        return `
            <header class="main-header">
                <div class="header-left">
                    <button class="header-toggle d-lg-none" onclick="Sidebar.toggleMobile()">
                        <i class="bi bi-list"></i>
                    </button>
                    <button class="header-toggle d-none d-lg-block" onclick="Sidebar.toggle()">
                        <i class="bi bi-layout-sidebar-inset"></i>
                    </button>
                    <div class="header-search d-none d-md-block">
                        <i class="bi bi-search"></i>
                        <input type="text" 
                               placeholder="Rechercher..." 
                               id="globalSearch"
                               value="${Utils.escapeHtml(this.searchQuery)}"
                               onkeyup="Header.handleSearch(event)">
                    </div>
                </div>
                
                <div class="header-right">
                    <button class="header-btn d-md-none" onclick="Header.showSearchModal()">
                        <i class="bi bi-search"></i>
                    </button>
                    <button class="header-btn" onclick="Header.showNotifications()" id="notificationBtn">
                        <i class="bi bi-bell"></i>
                        <span class="badge" id="notificationBadge" style="display: none;">0</span>
                    </button>
                    <button class="header-btn" onclick="Header.toggleFullscreen()">
                        <i class="bi bi-fullscreen"></i>
                    </button>
                    <button class="header-btn" onclick="Header.showQuickActions()">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                </div>
            </header>
        `;
    },
    
    /**
     * Handle global search
     */
    handleSearch(event) {
        this.searchQuery = event.target.value;
        
        if (event.key === 'Enter' && this.searchQuery.trim()) {
            this.performSearch(this.searchQuery);
        }
    },
    
    /**
     * Perform global search
     */
    async performSearch(query) {
        // Search across clients, products
        Utils.showToast(`Recherche: "${query}"`, 'info');
        
        // Navigate to appropriate page based on context
        const currentPath = Router.getCurrentPath();
        
        if (currentPath.includes('/clients')) {
            // Trigger client search
            if (typeof ClientsPage !== 'undefined' && ClientsPage.search) {
                ClientsPage.search(query);
            }
        } else if (currentPath.includes('/products')) {
            // Trigger product search
            if (typeof ProductsPage !== 'undefined' && ProductsPage.search) {
                ProductsPage.search(query);
            }
        } else if (currentPath.includes('/sales')) {
            // Trigger sales search
            if (typeof SalesPage !== 'undefined' && SalesPage.searchProducts) {
                SalesPage.searchProducts(query);
            }
        }
    },
    
    /**
     * Show search modal (mobile)
     */
    showSearchModal() {
        const modalHTML = `
            <div class="modal fade" id="searchModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Recherche</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="input-group">
                                <input type="text" 
                                       class="form-control" 
                                       placeholder="Rechercher clients, produits..."
                                       id="mobileSearchInput"
                                       autofocus>
                                <button class="btn btn-primary" onclick="Header.performMobileSearch()">
                                    <i class="bi bi-search"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('searchModal'));
        modal.show();
        
        document.getElementById('searchModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
        // Handle enter key
        document.getElementById('mobileSearchInput').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.performMobileSearch();
            }
        });
    },
    
    /**
     * Perform mobile search
     */
    performMobileSearch() {
        const input = document.getElementById('mobileSearchInput');
        if (input && input.value.trim()) {
            bootstrap.Modal.getInstance(document.getElementById('searchModal')).hide();
            this.performSearch(input.value);
        }
    },
    
    /**
     * Show notifications panel
     */
    showNotifications() {
        const notifications = [
            { id: 1, title: 'Stock faible', message: 'Le produit "Riz 25kg" est en stock faible', time: '5 min', type: 'warning' },
            { id: 2, title: 'Nouvelle vente', message: 'Vente #1234 completee', time: '15 min', type: 'success' },
            { id: 3, title: 'Paiement recu', message: 'Client Jean a effectue un paiement', time: '1h', type: 'info' }
        ];
        
        const notifHTML = `
            <div class="dropdown-menu dropdown-menu-end show p-0" id="notificationPanel" 
                 style="position: fixed; top: 60px; right: 60px; width: 360px; max-height: 400px; overflow-y: auto;">
                <div class="px-3 py-2 border-bottom d-flex align-items-center justify-content-between">
                    <h6 class="mb-0">Notifications</h6>
                    <button class="btn btn-sm btn-link text-decoration-none" onclick="Header.markAllRead()">
                        Tout marquer lu
                    </button>
                </div>
                ${notifications.length ? notifications.map(notif => `
                    <div class="px-3 py-2 border-bottom hover-bg-light" style="cursor: pointer;">
                        <div class="d-flex align-items-start gap-2">
                            <div class="rounded-circle p-2 ${notif.type === 'warning' ? 'bg-warning-subtle text-warning' : 
                                                            notif.type === 'success' ? 'bg-success-subtle text-success' : 
                                                            'bg-primary-subtle text-primary'}">
                                <i class="bi ${notif.type === 'warning' ? 'bi-exclamation-triangle' : 
                                              notif.type === 'success' ? 'bi-check-circle' : 'bi-info-circle'}"></i>
                            </div>
                            <div class="flex-1">
                                <div class="fw-semibold small">${notif.title}</div>
                                <div class="text-muted small">${notif.message}</div>
                                <div class="text-muted smaller mt-1">${notif.time}</div>
                            </div>
                        </div>
                    </div>
                `).join('') : `
                    <div class="p-4 text-center text-muted">
                        <i class="bi bi-bell-slash fs-1 mb-2 d-block"></i>
                        Aucune notification
                    </div>
                `}
                <div class="px-3 py-2 text-center border-top">
                    <a href="#" class="text-decoration-none small">Voir toutes les notifications</a>
                </div>
            </div>
            <div class="position-fixed top-0 start-0 w-100 h-100" 
                 style="z-index: 999;" 
                 onclick="Header.closeNotifications()"></div>
        `;
        
        this.closeNotifications();
        document.body.insertAdjacentHTML('beforeend', notifHTML);
    },
    
    /**
     * Close notifications panel
     */
    closeNotifications() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.nextElementSibling?.remove();
            panel.remove();
        }
    },
    
    /**
     * Mark all notifications as read
     */
    markAllRead() {
        document.getElementById('notificationBadge').style.display = 'none';
        Utils.showToast('Toutes les notifications marquees comme lues', 'success');
        this.closeNotifications();
    },
    
    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                Utils.showToast('Erreur plein ecran: ' + err.message, 'error');
            });
        } else {
            document.exitFullscreen();
        }
    },
    
    /**
     * Show quick actions menu
     */
    showQuickActions() {
        const actions = [
            { label: 'Nouvelle vente', icon: 'bi-cart-plus', route: '/sales' },
            { label: 'Nouveau client', icon: 'bi-person-plus', action: 'ClientsPage.showModal()' },
            { label: 'Nouveau produit', icon: 'bi-box-seam', action: 'ProductsPage.showModal()' }
        ];
        
        const menuHTML = `
            <div class="dropdown-menu dropdown-menu-end show" id="quickActionsMenu" 
                 style="position: fixed; top: 60px; right: 10px; min-width: 200px;">
                <div class="px-3 py-2 border-bottom">
                    <h6 class="mb-0">Actions rapides</h6>
                </div>
                ${actions.map(action => `
                    <a class="dropdown-item py-2" href="#" onclick="${action.action ? action.action : `Router.navigate('${action.route}')`}; Header.closeQuickActions(); return false;">
                        <i class="${action.icon} me-2"></i> ${action.label}
                    </a>
                `).join('')}
            </div>
            <div class="position-fixed top-0 start-0 w-100 h-100" 
                 style="z-index: 999;" 
                 onclick="Header.closeQuickActions()"></div>
        `;
        
        this.closeQuickActions();
        document.body.insertAdjacentHTML('beforeend', menuHTML);
    },
    
    /**
     * Close quick actions menu
     */
    closeQuickActions() {
        const menu = document.getElementById('quickActionsMenu');
        if (menu) {
            menu.nextElementSibling?.remove();
            menu.remove();
        }
    },
    
    /**
     * Update notification badge
     */
    updateBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
};
