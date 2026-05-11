/**
 * StoreFlow ERP - Clients Page
 * Gestion des clients
 */

const ClientsPage = {
    clients: [],
    filteredClients: [],
    currentPage: 1,
    searchQuery: '',
    selectedClient: null,
    isLoading: false,
    
    /**
     * Render clients page
     */
    async render() {
        App.renderLayout(`
            <div class="page-content fade-in">
                <div class="page-header">
                    <div>
                        <h1 class="page-title">Clients</h1>
                        <p class="page-subtitle">Gerez vos clients et leurs comptes</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-secondary" onclick="ClientsPage.exportData()">
                            <i class="bi bi-download me-1"></i>
                            Exporter
                        </button>
                        <button class="btn btn-primary" onclick="ClientsPage.showModal()">
                            <i class="bi bi-plus-lg me-1"></i>
                            Nouveau client
                        </button>
                    </div>
                </div>
                
                <!-- Filters -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-4">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                                    <input type="text" 
                                           class="form-control" 
                                           placeholder="Rechercher un client..."
                                           id="clientSearch"
                                           value="${Utils.escapeHtml(this.searchQuery)}"
                                           oninput="ClientsPage.handleSearch(this.value)">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="statusFilter" onchange="ClientsPage.filterByStatus(this.value)">
                                    <option value="">Tous les statuts</option>
                                    <option value="active">Actifs</option>
                                    <option value="blocked">Bloques</option>
                                    <option value="credit">Avec credit</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="sortBy" onchange="ClientsPage.sortBy(this.value)">
                                    <option value="name">Trier par nom</option>
                                    <option value="balance">Par solde</option>
                                    <option value="recent">Plus recents</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-outline-secondary w-100" onclick="ClientsPage.resetFilters()">
                                    <i class="bi bi-x-circle me-1"></i>
                                    Reinitialiser
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Clients Table -->
                <div class="card">
                    <div class="card-body p-0">
                        <div class="table-container" id="clientsTable">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Chargement...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer" id="pagination"></div>
                </div>
            </div>
        `);
        
        await this.loadClients();
    },
    
    /**
     * Load clients from database
     */
    async loadClients() {
        this.isLoading = true;
        
        try {
            const client = getSupabase();
            const { data, error } = await client
                .from('clients')
                .select('*')
                .order('name', { ascending: true });
            
            if (error) throw error;
            
            this.clients = data || [];
            this.filteredClients = [...this.clients];
            this.renderTable();
        } catch (error) {
            console.error('Load clients error:', error);
            Utils.showToast('Erreur lors du chargement des clients', 'error');
        } finally {
            this.isLoading = false;
        }
    },
    
    /**
     * Render clients table
     */
    renderTable() {
        const container = document.getElementById('clientsTable');
        if (!container) return;
        
        if (!this.filteredClients.length) {
            container.innerHTML = `
                <div class="empty-state py-5">
                    <i class="bi bi-people"></i>
                    <h3>Aucun client trouve</h3>
                    <p>Commencez par ajouter votre premier client</p>
                    <button class="btn btn-primary" onclick="ClientsPage.showModal()">
                        <i class="bi bi-plus-lg me-1"></i>
                        Ajouter un client
                    </button>
                </div>
            `;
            document.getElementById('pagination').innerHTML = '';
            return;
        }
        
        // Pagination
        const startIndex = (this.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
        const endIndex = startIndex + CONFIG.ITEMS_PER_PAGE;
        const paginatedClients = this.filteredClients.slice(startIndex, endIndex);
        
        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Client</th>
                        <th>Contact</th>
                        <th>Solde</th>
                        <th>Limite credit</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${paginatedClients.map(client => `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center gap-2">
                                    <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" 
                                         style="width: 36px; height: 36px; font-size: 0.875rem; font-weight: 600;">
                                        ${Utils.getInitials(client.name)}
                                    </div>
                                    <div>
                                        <div class="fw-medium">${Utils.escapeHtml(client.name)}</div>
                                        ${client.address ? `<div class="text-muted small">${Utils.escapeHtml(client.address)}</div>` : ''}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="small">
                                    ${client.phone ? `<div><i class="bi bi-telephone me-1"></i>${Utils.escapeHtml(client.phone)}</div>` : ''}
                                    ${client.email ? `<div><i class="bi bi-envelope me-1"></i>${Utils.escapeHtml(client.email)}</div>` : ''}
                                </div>
                            </td>
                            <td>
                                <span class="${Number(client.current_balance) > 0 ? 'text-danger fw-semibold' : 'text-success'}">
                                    ${Utils.formatCurrency(client.current_balance || 0)}
                                </span>
                            </td>
                            <td>${Utils.formatCurrency(client.credit_limit || 0)}</td>
                            <td>
                                <span class="badge-status ${client.is_blocked ? 'inactive' : 'active'}">
                                    ${client.is_blocked ? 'Bloque' : 'Actif'}
                                </span>
                            </td>
                            <td>
                                <div class="d-flex gap-1">
                                    <button class="btn btn-sm btn-icon btn-outline-primary" 
                                            onclick="ClientsPage.viewClient('${client.id}')"
                                            title="Voir details">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-icon btn-outline-secondary" 
                                            onclick="ClientsPage.showModal('${client.id}')"
                                            title="Modifier">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    ${Number(client.current_balance) > 0 ? `
                                        <button class="btn btn-sm btn-icon btn-outline-success" 
                                                onclick="ClientsPage.showPaymentModal('${client.id}')"
                                                title="Enregistrer paiement">
                                            <i class="bi bi-cash-coin"></i>
                                        </button>
                                    ` : ''}
                                    <button class="btn btn-sm btn-icon btn-outline-danger" 
                                            onclick="ClientsPage.deleteClient('${client.id}')"
                                            title="Supprimer">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        this.renderPagination();
    },
    
    /**
     * Render pagination
     */
    renderPagination() {
        const container = document.getElementById('pagination');
        if (!container) return;
        
        const totalPages = Math.ceil(this.filteredClients.length / CONFIG.ITEMS_PER_PAGE);
        
        if (totalPages <= 1) {
            container.innerHTML = `<span class="text-muted">${this.filteredClients.length} client(s)</span>`;
            return;
        }
        
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted">${this.filteredClients.length} client(s)</span>
                <nav>
                    <ul class="pagination pagination-sm mb-0">
                        <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                            <a class="page-link" href="#" onclick="ClientsPage.goToPage(${this.currentPage - 1})">
                                <i class="bi bi-chevron-left"></i>
                            </a>
                        </li>
                        ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
                            <li class="page-item ${page === this.currentPage ? 'active' : ''}">
                                <a class="page-link" href="#" onclick="ClientsPage.goToPage(${page})">${page}</a>
                            </li>
                        `).join('')}
                        <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                            <a class="page-link" href="#" onclick="ClientsPage.goToPage(${this.currentPage + 1})">
                                <i class="bi bi-chevron-right"></i>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        `;
    },
    
    /**
     * Go to specific page
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredClients.length / CONFIG.ITEMS_PER_PAGE);
        if (page < 1 || page > totalPages) return;
        this.currentPage = page;
        this.renderTable();
    },
    
    /**
     * Handle search
     */
    handleSearch: Utils.debounce(function(query) {
        ClientsPage.searchQuery = query;
        ClientsPage.search(query);
    }, 300),
    
    /**
     * Search clients
     */
    search(query) {
        if (!query.trim()) {
            this.filteredClients = [...this.clients];
        } else {
            const q = query.toLowerCase();
            this.filteredClients = this.clients.filter(c => 
                c.name?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.phone?.includes(q)
            );
        }
        this.currentPage = 1;
        this.renderTable();
    },
    
    /**
     * Filter by status
     */
    filterByStatus(status) {
        let filtered = [...this.clients];
        
        if (status === 'active') {
            filtered = filtered.filter(c => !c.is_blocked);
        } else if (status === 'blocked') {
            filtered = filtered.filter(c => c.is_blocked);
        } else if (status === 'credit') {
            filtered = filtered.filter(c => Number(c.current_balance) > 0);
        }
        
        this.filteredClients = filtered;
        this.currentPage = 1;
        this.renderTable();
    },
    
    /**
     * Sort clients
     */
    sortBy(field) {
        switch (field) {
            case 'name':
                this.filteredClients.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'balance':
                this.filteredClients.sort((a, b) => Number(b.current_balance) - Number(a.current_balance));
                break;
            case 'recent':
                this.filteredClients.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }
        this.renderTable();
    },
    
    /**
     * Reset filters
     */
    resetFilters() {
        this.searchQuery = '';
        this.filteredClients = [...this.clients];
        this.currentPage = 1;
        
        document.getElementById('clientSearch').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('sortBy').value = 'name';
        
        this.renderTable();
    },
    
    /**
     * Show add/edit client modal
     */
    showModal(clientId = null) {
        const client = clientId ? this.clients.find(c => c.id === clientId) : null;
        const isEdit = !!client;
        
        const modalHTML = `
            <div class="modal fade" id="clientModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${isEdit ? 'Modifier le client' : 'Nouveau client'}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="clientForm">
                                <input type="hidden" name="id" value="${client?.id || ''}">
                                
                                <div class="mb-3">
                                    <label class="form-label">Nom complet *</label>
                                    <input type="text" class="form-control" name="name" 
                                           value="${Utils.escapeHtml(client?.name || '')}" required>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Telephone</label>
                                        <input type="tel" class="form-control" name="phone" 
                                               value="${Utils.escapeHtml(client?.phone || '')}"
                                               placeholder="+237 6XX XXX XXX">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-control" name="email" 
                                               value="${Utils.escapeHtml(client?.email || '')}">
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Adresse</label>
                                    <textarea class="form-control" name="address" rows="2">${Utils.escapeHtml(client?.address || '')}</textarea>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Limite de credit</label>
                                        <div class="input-group">
                                            <input type="number" class="form-control" name="credit_limit" 
                                                   value="${client?.credit_limit || 0}" min="0" step="1000">
                                            <span class="input-group-text">${CONFIG.CURRENCY_SYMBOL}</span>
                                        </div>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Statut</label>
                                        <select class="form-select" name="is_blocked">
                                            <option value="false" ${!client?.is_blocked ? 'selected' : ''}>Actif</option>
                                            <option value="true" ${client?.is_blocked ? 'selected' : ''}>Bloque</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Notes</label>
                                    <textarea class="form-control" name="notes" rows="2">${Utils.escapeHtml(client?.notes || '')}</textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                            <button type="button" class="btn btn-primary" onclick="ClientsPage.saveClient()">
                                <i class="bi bi-check-lg me-1"></i>
                                ${isEdit ? 'Mettre a jour' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal
        document.getElementById('clientModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById('clientModal'));
        modal.show();
        
        document.getElementById('clientModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Save client
     */
    async saveClient() {
        const form = document.getElementById('clientForm');
        const formData = new FormData(form);
        
        const clientData = {
            name: formData.get('name'),
            phone: formData.get('phone') || null,
            email: formData.get('email') || null,
            address: formData.get('address') || null,
            credit_limit: Number(formData.get('credit_limit')) || 0,
            is_blocked: formData.get('is_blocked') === 'true',
            notes: formData.get('notes') || null
        };
        
        const clientId = formData.get('id');
        
        try {
            if (clientId) {
                await DB.update('clients', clientId, clientData);
                Utils.showToast('Client mis a jour avec succes', 'success');
            } else {
                await DB.insert('clients', clientData);
                Utils.showToast('Client ajoute avec succes', 'success');
            }
            
            bootstrap.Modal.getInstance(document.getElementById('clientModal')).hide();
            await this.loadClients();
        } catch (error) {
            console.error('Save client error:', error);
            Utils.showToast('Erreur: ' + error.message, 'error');
        }
    },
    
    /**
     * Delete client
     */
    async deleteClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;
        
        const confirmed = await Utils.confirm(
            'Supprimer le client',
            `Etes-vous sur de vouloir supprimer "${client.name}" ? Cette action est irreversible.`
        );
        
        if (!confirmed) return;
        
        try {
            await DB.delete('clients', clientId);
            Utils.showToast('Client supprime avec succes', 'success');
            await this.loadClients();
        } catch (error) {
            console.error('Delete client error:', error);
            Utils.showToast('Erreur: ' + error.message, 'error');
        }
    },
    
    /**
     * View client details
     */
    viewClient(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;
        
        const modalHTML = `
            <div class="modal fade" id="clientDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Details du client</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="d-flex align-items-center gap-3 mb-4">
                                        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" 
                                             style="width: 64px; height: 64px; font-size: 1.5rem; font-weight: 600;">
                                            ${Utils.getInitials(client.name)}
                                        </div>
                                        <div>
                                            <h4 class="mb-1">${Utils.escapeHtml(client.name)}</h4>
                                            <span class="badge-status ${client.is_blocked ? 'inactive' : 'active'}">
                                                ${client.is_blocked ? 'Bloque' : 'Actif'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <h6 class="text-muted mb-2">Informations de contact</h6>
                                    <ul class="list-unstyled">
                                        ${client.phone ? `<li><i class="bi bi-telephone me-2"></i>${Utils.escapeHtml(client.phone)}</li>` : ''}
                                        ${client.email ? `<li><i class="bi bi-envelope me-2"></i>${Utils.escapeHtml(client.email)}</li>` : ''}
                                        ${client.address ? `<li><i class="bi bi-geo-alt me-2"></i>${Utils.escapeHtml(client.address)}</li>` : ''}
                                    </ul>
                                    
                                    ${client.notes ? `
                                        <h6 class="text-muted mb-2 mt-3">Notes</h6>
                                        <p class="small">${Utils.escapeHtml(client.notes)}</p>
                                    ` : ''}
                                </div>
                                <div class="col-md-6">
                                    <div class="card bg-light border-0 mb-3">
                                        <div class="card-body">
                                            <h6 class="text-muted mb-3">Situation financiere</h6>
                                            <div class="row text-center">
                                                <div class="col-6">
                                                    <div class="small text-muted">Solde actuel</div>
                                                    <div class="h4 ${Number(client.current_balance) > 0 ? 'text-danger' : 'text-success'}">
                                                        ${Utils.formatCurrency(client.current_balance || 0)}
                                                    </div>
                                                </div>
                                                <div class="col-6">
                                                    <div class="small text-muted">Limite credit</div>
                                                    <div class="h4">${Utils.formatCurrency(client.credit_limit || 0)}</div>
                                                </div>
                                            </div>
                                            ${Number(client.current_balance) > 0 ? `
                                                <button class="btn btn-success w-100 mt-3" 
                                                        onclick="bootstrap.Modal.getInstance(document.getElementById('clientDetailsModal')).hide(); ClientsPage.showPaymentModal('${client.id}')">
                                                    <i class="bi bi-cash-coin me-1"></i>
                                                    Enregistrer un paiement
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                    
                                    <div class="small text-muted">
                                        <div>Cree le: ${Utils.formatDate(client.created_at)}</div>
                                        <div>Modifie le: ${Utils.formatDate(client.updated_at)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" onclick="bootstrap.Modal.getInstance(document.getElementById('clientDetailsModal')).hide(); ClientsPage.showModal('${client.id}')">
                                <i class="bi bi-pencil me-1"></i> Modifier
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('clientDetailsModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById('clientDetailsModal'));
        modal.show();
        
        document.getElementById('clientDetailsModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Show payment modal
     */
    showPaymentModal(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;
        
        const modalHTML = `
            <div class="modal fade" id="paymentModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Enregistrer un paiement</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <strong>${Utils.escapeHtml(client.name)}</strong><br>
                                Solde actuel: <strong class="text-danger">${Utils.formatCurrency(client.current_balance)}</strong>
                            </div>
                            
                            <form id="paymentForm">
                                <input type="hidden" name="client_id" value="${client.id}">
                                
                                <div class="mb-3">
                                    <label class="form-label">Montant du paiement *</label>
                                    <div class="input-group">
                                        <input type="number" class="form-control form-control-lg" name="amount" 
                                               max="${client.current_balance}" min="1" required autofocus>
                                        <span class="input-group-text">${CONFIG.CURRENCY_SYMBOL}</span>
                                    </div>
                                    <div class="form-text">Maximum: ${Utils.formatCurrency(client.current_balance)}</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Notes (optionnel)</label>
                                    <textarea class="form-control" name="notes" rows="2"></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                            <button type="button" class="btn btn-success" onclick="ClientsPage.savePayment()">
                                <i class="bi bi-check-lg me-1"></i>
                                Enregistrer le paiement
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('paymentModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
        modal.show();
        
        document.getElementById('paymentModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Save payment
     */
    async savePayment() {
        const form = document.getElementById('paymentForm');
        const formData = new FormData(form);
        
        const clientId = formData.get('client_id');
        const amount = Number(formData.get('amount'));
        const notes = formData.get('notes') || null;
        
        const client = this.clients.find(c => c.id === clientId);
        if (!client || amount <= 0) return;
        
        try {
            const user = Auth.getUser();
            
            // Insert payment record
            await DB.insert('payments', {
                client_id: clientId,
                amount: amount,
                notes: notes,
                user_id: user.id
            });
            
            // Update client balance
            const newBalance = Math.max(0, Number(client.current_balance) - amount);
            await DB.update('clients', clientId, {
                current_balance: newBalance
            });
            
            bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
            Utils.showToast(`Paiement de ${Utils.formatCurrency(amount)} enregistre`, 'success');
            await this.loadClients();
        } catch (error) {
            console.error('Save payment error:', error);
            Utils.showToast('Erreur: ' + error.message, 'error');
        }
    },
    
    /**
     * Export clients data
     */
    exportData() {
        if (!this.clients.length) {
            Utils.showToast('Aucune donnee a exporter', 'warning');
            return;
        }
        
        const data = this.clients.map(c => ({
            Nom: c.name,
            Telephone: c.phone || '',
            Email: c.email || '',
            Adresse: c.address || '',
            Solde: c.current_balance || 0,
            Limite_Credit: c.credit_limit || 0,
            Statut: c.is_blocked ? 'Bloque' : 'Actif',
            Date_Creation: Utils.formatDate(c.created_at)
        }));
        
        Utils.exportToCSV(data, 'clients_storeflow');
        Utils.showToast('Export termine', 'success');
    }
};

// Register route
Router.register('/clients', () => ClientsPage.render());
