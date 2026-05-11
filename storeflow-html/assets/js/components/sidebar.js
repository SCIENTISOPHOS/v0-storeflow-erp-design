/**
 * StoreFlow ERP - Sidebar Component
 * Composant de navigation latérale
 */

const Sidebar = {
    isCollapsed: false,
    isMobileOpen: false,
    
    /**
     * Get navigation items based on user role
     */
    getNavItems() {
        const profile = Auth.getProfile();
        const role = profile?.role || 'seller';
        
        const allItems = {
            main: [
                {
                    id: 'dashboard',
                    label: 'Tableau de bord',
                    icon: 'bi-grid-1x2',
                    route: '/dashboard',
                    roles: ['admin', 'manager', 'seller']
                },
                {
                    id: 'sales',
                    label: 'Ventes / POS',
                    icon: 'bi-cart3',
                    route: '/sales',
                    roles: ['admin', 'manager', 'seller']
                },
                {
                    id: 'clients',
                    label: 'Clients',
                    icon: 'bi-people',
                    route: '/clients',
                    roles: ['admin', 'manager', 'seller']
                },
                {
                    id: 'products',
                    label: 'Produits',
                    icon: 'bi-box-seam',
                    route: '/products',
                    roles: ['admin', 'manager']
                }
            ],
            analytics: [
                {
                    id: 'reports',
                    label: 'Rapports',
                    icon: 'bi-bar-chart-line',
                    route: '/reports',
                    roles: ['admin', 'manager']
                }
            ],
            settings: [
                {
                    id: 'users',
                    label: 'Utilisateurs',
                    icon: 'bi-person-gear',
                    route: '/users',
                    roles: ['admin']
                }
            ]
        };
        
        // Filter items based on role
        const filterByRole = (items) => items.filter(item => item.roles.includes(role));
        
        return {
            main: filterByRole(allItems.main),
            analytics: filterByRole(allItems.analytics),
            settings: filterByRole(allItems.settings)
        };
    },
    
    /**
     * Render sidebar HTML
     */
    render() {
        const profile = Auth.getProfile();
        const navItems = this.getNavItems();
        const currentPath = Router.getCurrentPath();
        
        const renderNavSection = (title, items) => {
            if (!items.length) return '';
            return `
                <div class="nav-section">
                    <div class="nav-section-title">${title}</div>
                    ${items.map(item => `
                        <div class="nav-item">
                            <div class="nav-link ${currentPath === item.route ? 'active' : ''}" 
                                 onclick="Router.navigate('${item.route}')">
                                <i class="bi ${item.icon}"></i>
                                <span>${item.label}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        };
        
        return `
            <aside class="sidebar ${this.isCollapsed ? 'collapsed' : ''}" id="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">
                        <i class="bi bi-shop"></i>
                    </div>
                    <div class="sidebar-title">StoreFlow</div>
                </div>
                
                <nav class="sidebar-nav">
                    ${renderNavSection('Menu Principal', navItems.main)}
                    ${renderNavSection('Analytique', navItems.analytics)}
                    ${renderNavSection('Administration', navItems.settings)}
                </nav>
                
                <div class="sidebar-footer">
                    <div class="sidebar-user" onclick="Sidebar.showUserMenu()">
                        <div class="sidebar-user-avatar">
                            ${Utils.getInitials(profile?.full_name || 'User')}
                        </div>
                        <div class="sidebar-user-info">
                            <div class="sidebar-user-name">${Utils.escapeHtml(profile?.full_name || 'Utilisateur')}</div>
                            <div class="sidebar-user-role">${this.getRoleLabel(profile?.role)}</div>
                        </div>
                        <i class="bi bi-chevron-up"></i>
                    </div>
                </div>
            </aside>
        `;
    },
    
    /**
     * Get role label in French
     */
    getRoleLabel(role) {
        const labels = {
            'admin': 'Administrateur',
            'manager': 'Gestionnaire',
            'seller': 'Vendeur'
        };
        return labels[role] || role || 'Utilisateur';
    },
    
    /**
     * Toggle sidebar collapse
     */
    toggle() {
        this.isCollapsed = !this.isCollapsed;
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed', this.isCollapsed);
        }
        localStorage.setItem('sidebarCollapsed', this.isCollapsed);
    },
    
    /**
     * Toggle mobile sidebar
     */
    toggleMobile() {
        this.isMobileOpen = !this.isMobileOpen;
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open', this.isMobileOpen);
        }
    },
    
    /**
     * Close mobile sidebar
     */
    closeMobile() {
        this.isMobileOpen = false;
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    },
    
    /**
     * Show user menu dropdown
     */
    showUserMenu() {
        const profile = Auth.getProfile();
        
        const menuHTML = `
            <div class="dropdown-menu dropdown-menu-end show" id="userMenu" 
                 style="position: fixed; bottom: 70px; left: 10px; min-width: 220px;">
                <div class="px-3 py-2 border-bottom">
                    <div class="fw-semibold">${Utils.escapeHtml(profile?.full_name || 'Utilisateur')}</div>
                    <div class="text-muted small">${Utils.escapeHtml(profile?.email || '')}</div>
                </div>
                <a class="dropdown-item py-2" href="#" onclick="Sidebar.showProfile(); return false;">
                    <i class="bi bi-person me-2"></i> Mon profil
                </a>
                <a class="dropdown-item py-2" href="#" onclick="Sidebar.showSettings(); return false;">
                    <i class="bi bi-gear me-2"></i> Parametres
                </a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item py-2 text-danger" href="#" onclick="Sidebar.logout(); return false;">
                    <i class="bi bi-box-arrow-right me-2"></i> Deconnexion
                </a>
            </div>
            <div class="position-fixed top-0 start-0 w-100 h-100" 
                 style="z-index: 999;" 
                 onclick="Sidebar.closeUserMenu()"></div>
        `;
        
        // Remove existing menu if any
        this.closeUserMenu();
        
        document.body.insertAdjacentHTML('beforeend', menuHTML);
    },
    
    /**
     * Close user menu
     */
    closeUserMenu() {
        const menu = document.getElementById('userMenu');
        if (menu) {
            menu.nextElementSibling?.remove();
            menu.remove();
        }
    },
    
    /**
     * Show profile modal
     */
    showProfile() {
        this.closeUserMenu();
        const profile = Auth.getProfile();
        
        const modalHTML = `
            <div class="modal fade" id="profileModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Mon Profil</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="profileForm">
                                <div class="mb-3">
                                    <label class="form-label">Nom complet</label>
                                    <input type="text" class="form-control" name="full_name" 
                                           value="${Utils.escapeHtml(profile?.full_name || '')}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" value="${Utils.escapeHtml(profile?.email || '')}" disabled>
                                    <div class="form-text">L'email ne peut pas etre modifie</div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Role</label>
                                    <input type="text" class="form-control" 
                                           value="${this.getRoleLabel(profile?.role)}" disabled>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                            <button type="button" class="btn btn-primary" onclick="Sidebar.saveProfile()">
                                <i class="bi bi-check-lg me-1"></i> Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('profileModal'));
        modal.show();
        
        document.getElementById('profileModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Save profile
     */
    async saveProfile() {
        const form = document.getElementById('profileForm');
        const formData = new FormData(form);
        
        try {
            await Auth.updateProfile({
                full_name: formData.get('full_name')
            });
            
            bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
            Utils.showToast('Profil mis a jour avec succes', 'success');
            
            // Refresh sidebar to show updated name
            App.refreshLayout();
        } catch (error) {
            Utils.showToast('Erreur: ' + error.message, 'error');
        }
    },
    
    /**
     * Show settings
     */
    showSettings() {
        this.closeUserMenu();
        Utils.showToast('Parametres bientot disponible', 'info');
    },
    
    /**
     * Logout
     */
    async logout() {
        this.closeUserMenu();
        
        const confirmed = await Utils.confirm(
            'Deconnexion',
            'Etes-vous sur de vouloir vous deconnecter ?'
        );
        
        if (confirmed) {
            try {
                await Auth.logout();
                Utils.showToast('Deconnexion reussie', 'success');
            } catch (error) {
                Utils.showToast('Erreur: ' + error.message, 'error');
            }
        }
    },
    
    /**
     * Initialize sidebar state
     */
    init() {
        this.isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    }
};

// Initialize
Sidebar.init();
