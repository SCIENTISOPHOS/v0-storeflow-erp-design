/**
 * StoreFlow ERP - Products Page
 * Gestion des produits et stocks
 */

const ProductsPage = {
    products: [],
    filteredProducts: [],
    currentPage: 1,
    searchQuery: '',
    isLoading: false,
    
    /**
     * Render products page
     */
    async render() {
        App.renderLayout(`
            <div class="page-content fade-in">
                <div class="page-header">
                    <div>
                        <h1 class="page-title">Produits</h1>
                        <p class="page-subtitle">Gerez vos produits et stocks</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-secondary" onclick="ProductsPage.exportData()">
                            <i class="bi bi-download me-1"></i>
                            Exporter
                        </button>
                        <button class="btn btn-primary" onclick="ProductsPage.showModal()">
                            <i class="bi bi-plus-lg me-1"></i>
                            Nouveau produit
                        </button>
                    </div>
                </div>
                
                <!-- Stats Cards -->
                <div class="stats-grid mb-4">
                    <div class="stat-card">
                        <div class="stat-icon primary">
                            <i class="bi bi-box-seam"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">Total produits</div>
                            <div class="stat-value" id="totalProducts">-</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon success">
                            <i class="bi bi-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">En stock</div>
                            <div class="stat-value" id="inStockProducts">-</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon warning">
                            <i class="bi bi-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">Stock faible</div>
                            <div class="stat-value" id="lowStockProducts">-</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon danger">
                            <i class="bi bi-x-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">Rupture</div>
                            <div class="stat-value" id="outOfStockProducts">-</div>
                        </div>
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
                                           placeholder="Rechercher un produit..."
                                           id="productSearch"
                                           value="${Utils.escapeHtml(this.searchQuery)}"
                                           oninput="ProductsPage.handleSearch(this.value)">
                                </div>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="typeFilter" onchange="ProductsPage.filterByType(this.value)">
                                    <option value="">Tous les types</option>
                                    <option value="simple">Simple</option>
                                    <option value="parent">Parent</option>
                                    <option value="variant">Variante</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="stockFilter" onchange="ProductsPage.filterByStock(this.value)">
                                    <option value="">Tous les stocks</option>
                                    <option value="in_stock">En stock</option>
                                    <option value="low">Stock faible</option>
                                    <option value="out">Rupture</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="sortBy" onchange="ProductsPage.sortBy(this.value)">
                                    <option value="name">Trier par nom</option>
                                    <option value="price">Par prix</option>
                                    <option value="stock">Par stock</option>
                                    <option value="recent">Plus recents</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-outline-secondary w-100" onclick="ProductsPage.resetFilters()">
                                    <i class="bi bi-x-circle me-1"></i>
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Products Table -->
                <div class="card">
                    <div class="card-body p-0">
                        <div class="table-container" id="productsTable">
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
        
        await this.loadProducts();
    },
    
    /**
     * Load products from database
     */
    async loadProducts() {
        this.isLoading = true;
        
        try {
            const client = getSupabase();
            const { data, error } = await client
                .from('products')
                .select('*')
                .order('name', { ascending: true });
            
            if (error) throw error;
            
            this.products = data || [];
            this.filteredProducts = [...this.products];
            this.updateStats();
            this.renderTable();
        } catch (error) {
            console.error('Load products error:', error);
            Utils.showToast('Erreur lors du chargement des produits', 'error');
        } finally {
            this.isLoading = false;
        }
    },
    
    /**
     * Update stats cards
     */
    updateStats() {
        const total = this.products.length;
        const inStock = this.products.filter(p => p.quantity > p.min_stock).length;
        const lowStock = this.products.filter(p => p.quantity > 0 && p.quantity <= p.min_stock).length;
        const outOfStock = this.products.filter(p => p.quantity === 0).length;
        
        document.getElementById('totalProducts').textContent = total;
        document.getElementById('inStockProducts').textContent = inStock;
        document.getElementById('lowStockProducts').textContent = lowStock;
        document.getElementById('outOfStockProducts').textContent = outOfStock;
    },
    
    /**
     * Render products table
     */
    renderTable() {
        const container = document.getElementById('productsTable');
        if (!container) return;
        
        if (!this.filteredProducts.length) {
            container.innerHTML = `
                <div class="empty-state py-5">
                    <i class="bi bi-box-seam"></i>
                    <h3>Aucun produit trouve</h3>
                    <p>Commencez par ajouter votre premier produit</p>
                    <button class="btn btn-primary" onclick="ProductsPage.showModal()">
                        <i class="bi bi-plus-lg me-1"></i>
                        Ajouter un produit
                    </button>
                </div>
            `;
            document.getElementById('pagination').innerHTML = '';
            return;
        }
        
        // Pagination
        const startIndex = (this.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
        const endIndex = startIndex + CONFIG.ITEMS_PER_PAGE;
        const paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
        
        const typeLabels = {
            'simple': 'Simple',
            'parent': 'Parent',
            'variant': 'Variante'
        };
        
        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th>SKU</th>
                        <th>Type</th>
                        <th>Prix</th>
                        <th>Stock</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${paginatedProducts.map(product => {
                        const stockStatus = this.getStockStatus(product);
                        return `
                            <tr>
                                <td>
                                    <div>
                                        <div class="fw-medium">${Utils.escapeHtml(product.name)}</div>
                                        ${product.description ? `<div class="text-muted small text-truncate" style="max-width: 200px;">${Utils.escapeHtml(product.description)}</div>` : ''}
                                    </div>
                                </td>
                                <td><code>${Utils.escapeHtml(product.sku || '-')}</code></td>
                                <td>
                                    <span class="badge bg-secondary-subtle text-secondary">${typeLabels[product.type] || product.type}</span>
                                </td>
                                <td class="fw-semibold">${Utils.formatCurrency(product.price)}</td>
                                <td>
                                    <span class="badge-status ${stockStatus.class}">
                                        ${product.quantity} / ${product.min_stock}
                                    </span>
                                </td>
                                <td>
                                    <span class="badge-status ${product.is_active ? 'active' : 'inactive'}">
                                        ${product.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                </td>
                                <td>
                                    <div class="d-flex gap-1">
                                        <button class="btn btn-sm btn-icon btn-outline-secondary" 
                                                onclick="ProductsPage.showModal('${product.id}')"
                                                title="Modifier">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm btn-icon btn-outline-primary" 
                                                onclick="ProductsPage.adjustStock('${product.id}')"
                                                title="Ajuster stock">
                                            <i class="bi bi-arrow-left-right"></i>
                                        </button>
                                        <button class="btn btn-sm btn-icon btn-outline-danger" 
                                                onclick="ProductsPage.deleteProduct('${product.id}')"
                                                title="Supprimer">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        this.renderPagination();
    },
    
    /**
     * Get stock status
     */
    getStockStatus(product) {
        if (product.quantity === 0) {
            return { class: 'inactive', label: 'Rupture' };
        } else if (product.quantity <= product.min_stock) {
            return { class: 'pending', label: 'Faible' };
        }
        return { class: 'active', label: 'OK' };
    },
    
    /**
     * Render pagination
     */
    renderPagination() {
        const container = document.getElementById('pagination');
        if (!container) return;
        
        const totalPages = Math.ceil(this.filteredProducts.length / CONFIG.ITEMS_PER_PAGE);
        
        if (totalPages <= 1) {
            container.innerHTML = `<span class="text-muted">${this.filteredProducts.length} produit(s)</span>`;
            return;
        }
        
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted">${this.filteredProducts.length} produit(s)</span>
                <nav>
                    <ul class="pagination pagination-sm mb-0">
                        <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                            <a class="page-link" href="#" onclick="ProductsPage.goToPage(${this.currentPage - 1})">
                                <i class="bi bi-chevron-left"></i>
                            </a>
                        </li>
                        ${Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) {
                                page = i + 1;
                            } else if (this.currentPage <= 3) {
                                page = i + 1;
                            } else if (this.currentPage >= totalPages - 2) {
                                page = totalPages - 4 + i;
                            } else {
                                page = this.currentPage - 2 + i;
                            }
                            return `
                                <li class="page-item ${page === this.currentPage ? 'active' : ''}">
                                    <a class="page-link" href="#" onclick="ProductsPage.goToPage(${page})">${page}</a>
                                </li>
                            `;
                        }).join('')}
                        <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                            <a class="page-link" href="#" onclick="ProductsPage.goToPage(${this.currentPage + 1})">
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
        const totalPages = Math.ceil(this.filteredProducts.length / CONFIG.ITEMS_PER_PAGE);
        if (page < 1 || page > totalPages) return;
        this.currentPage = page;
        this.renderTable();
    },
    
    /**
     * Handle search
     */
    handleSearch: Utils.debounce(function(query) {
        ProductsPage.searchQuery = query;
        ProductsPage.search(query);
    }, 300),
    
    /**
     * Search products
     */
    search(query) {
        if (!query.trim()) {
            this.filteredProducts = [...this.products];
        } else {
            const q = query.toLowerCase();
            this.filteredProducts = this.products.filter(p => 
                p.name?.toLowerCase().includes(q) ||
                p.sku?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q)
            );
        }
        this.currentPage = 1;
        this.renderTable();
    },
    
    /**
     * Filter by type
     */
    filterByType(type) {
        if (!type) {
            this.filteredProducts = [...this.products];
        } else {
            this.filteredProducts = this.products.filter(p => p.type === type);
        }
        this.currentPage = 1;
        this.renderTable();
    },
    
    /**
     * Filter by stock
     */
    filterByStock(status) {
        let filtered = [...this.products];
        
        if (status === 'in_stock') {
            filtered = filtered.filter(p => p.quantity > p.min_stock);
        } else if (status === 'low') {
            filtered = filtered.filter(p => p.quantity > 0 && p.quantity <= p.min_stock);
        } else if (status === 'out') {
            filtered = filtered.filter(p => p.quantity === 0);
        }
        
        this.filteredProducts = filtered;
        this.currentPage = 1;
        this.renderTable();
    },
    
    /**
     * Sort products
     */
    sortBy(field) {
        switch (field) {
            case 'name':
                this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'price':
                this.filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
                break;
            case 'stock':
                this.filteredProducts.sort((a, b) => a.quantity - b.quantity);
                break;
            case 'recent':
                this.filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }
        this.renderTable();
    },
    
    /**
     * Reset filters
     */
    resetFilters() {
        this.searchQuery = '';
        this.filteredProducts = [...this.products];
        this.currentPage = 1;
        
        document.getElementById('productSearch').value = '';
        document.getElementById('typeFilter').value = '';
        document.getElementById('stockFilter').value = '';
        document.getElementById('sortBy').value = 'name';
        
        this.renderTable();
    },
    
    /**
     * Show add/edit product modal
     */
    showModal(productId = null) {
        const product = productId ? this.products.find(p => p.id === productId) : null;
        const isEdit = !!product;
        
        // Get parent products for variant selection
        const parentProducts = this.products.filter(p => p.type === 'parent');
        
        const modalHTML = `
            <div class="modal fade" id="productModal" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="productForm">
                                <input type="hidden" name="id" value="${product?.id || ''}">
                                
                                <div class="row">
                                    <div class="col-md-8 mb-3">
                                        <label class="form-label">Nom du produit *</label>
                                        <input type="text" class="form-control" name="name" 
                                               value="${Utils.escapeHtml(product?.name || '')}" required>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">SKU</label>
                                        <input type="text" class="form-control" name="sku" 
                                               value="${Utils.escapeHtml(product?.sku || '')}"
                                               placeholder="Auto-genere si vide">
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Description</label>
                                    <textarea class="form-control" name="description" rows="2">${Utils.escapeHtml(product?.description || '')}</textarea>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Type *</label>
                                        <select class="form-select" name="type" id="productType" onchange="ProductsPage.toggleParentField()">
                                            <option value="simple" ${product?.type === 'simple' ? 'selected' : ''}>Simple</option>
                                            <option value="parent" ${product?.type === 'parent' ? 'selected' : ''}>Parent (avec variantes)</option>
                                            <option value="variant" ${product?.type === 'variant' ? 'selected' : ''}>Variante</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4 mb-3" id="parentProductField" style="display: ${product?.type === 'variant' ? 'block' : 'none'};">
                                        <label class="form-label">Produit parent</label>
                                        <select class="form-select" name="parent_product_id">
                                            <option value="">Selectionner...</option>
                                            ${parentProducts.map(p => `
                                                <option value="${p.id}" ${product?.parent_product_id === p.id ? 'selected' : ''}>
                                                    ${Utils.escapeHtml(p.name)}
                                                </option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Prix de vente *</label>
                                        <div class="input-group">
                                            <input type="number" class="form-control" name="price" 
                                                   value="${product?.price || ''}" min="0" step="1" required>
                                            <span class="input-group-text">${CONFIG.CURRENCY_SYMBOL}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Quantite en stock *</label>
                                        <input type="number" class="form-control" name="quantity" 
                                               value="${product?.quantity ?? 0}" min="0" required>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Stock minimum *</label>
                                        <input type="number" class="form-control" name="min_stock" 
                                               value="${product?.min_stock ?? 5}" min="0" required>
                                        <div class="form-text">Alerte si stock inferieur</div>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label class="form-label">Statut</label>
                                        <select class="form-select" name="is_active">
                                            <option value="true" ${product?.is_active !== false ? 'selected' : ''}>Actif</option>
                                            <option value="false" ${product?.is_active === false ? 'selected' : ''}>Inactif</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                            <button type="button" class="btn btn-primary" onclick="ProductsPage.saveProduct()">
                                <i class="bi bi-check-lg me-1"></i>
                                ${isEdit ? 'Mettre a jour' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('productModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
        
        document.getElementById('productModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Toggle parent product field visibility
     */
    toggleParentField() {
        const typeSelect = document.getElementById('productType');
        const parentField = document.getElementById('parentProductField');
        
        if (typeSelect && parentField) {
            parentField.style.display = typeSelect.value === 'variant' ? 'block' : 'none';
        }
    },
    
    /**
     * Save product
     */
    async saveProduct() {
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        
        const productData = {
            name: formData.get('name'),
            sku: formData.get('sku') || this.generateSKU(formData.get('name')),
            description: formData.get('description') || null,
            type: formData.get('type'),
            parent_product_id: formData.get('parent_product_id') || null,
            price: Number(formData.get('price')),
            quantity: Number(formData.get('quantity')),
            min_stock: Number(formData.get('min_stock')),
            is_active: formData.get('is_active') === 'true'
        };
        
        const productId = formData.get('id');
        
        try {
            if (productId) {
                await DB.update('products', productId, productData);
                Utils.showToast('Produit mis a jour avec succes', 'success');
            } else {
                await DB.insert('products', productData);
                Utils.showToast('Produit ajoute avec succes', 'success');
            }
            
            bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
            await this.loadProducts();
        } catch (error) {
            console.error('Save product error:', error);
            Utils.showToast('Erreur: ' + error.message, 'error');
        }
    },
    
    /**
     * Generate SKU from product name
     */
    generateSKU(name) {
        const prefix = name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 3);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${random}`;
    },
    
    /**
     * Adjust stock
     */
    adjustStock(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        const modalHTML = `
            <div class="modal fade" id="stockModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Ajuster le stock</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <strong>${Utils.escapeHtml(product.name)}</strong><br>
                                Stock actuel: <strong>${product.quantity}</strong>
                            </div>
                            
                            <form id="stockForm">
                                <input type="hidden" name="product_id" value="${product.id}">
                                
                                <div class="mb-3">
                                    <label class="form-label">Type d'ajustement</label>
                                    <div class="btn-group w-100" role="group">
                                        <input type="radio" class="btn-check" name="adjustment_type" id="addStock" value="add" checked>
                                        <label class="btn btn-outline-success" for="addStock">
                                            <i class="bi bi-plus-lg me-1"></i> Ajouter
                                        </label>
                                        
                                        <input type="radio" class="btn-check" name="adjustment_type" id="removeStock" value="remove">
                                        <label class="btn btn-outline-danger" for="removeStock">
                                            <i class="bi bi-dash-lg me-1"></i> Retirer
                                        </label>
                                        
                                        <input type="radio" class="btn-check" name="adjustment_type" id="setStock" value="set">
                                        <label class="btn btn-outline-secondary" for="setStock">
                                            <i class="bi bi-arrow-repeat me-1"></i> Definir
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Quantite</label>
                                    <input type="number" class="form-control form-control-lg text-center" 
                                           name="quantity" min="0" value="0" required autofocus>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Raison (optionnel)</label>
                                    <input type="text" class="form-control" name="reason" 
                                           placeholder="Ex: Reception commande, Inventaire...">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                            <button type="button" class="btn btn-primary" onclick="ProductsPage.saveStockAdjustment()">
                                <i class="bi bi-check-lg me-1"></i>
                                Appliquer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('stockModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById('stockModal'));
        modal.show();
        
        document.getElementById('stockModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    },
    
    /**
     * Save stock adjustment
     */
    async saveStockAdjustment() {
        const form = document.getElementById('stockForm');
        const formData = new FormData(form);
        
        const productId = formData.get('product_id');
        const adjustmentType = formData.get('adjustment_type');
        const quantity = Number(formData.get('quantity'));
        
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        let newQuantity;
        switch (adjustmentType) {
            case 'add':
                newQuantity = product.quantity + quantity;
                break;
            case 'remove':
                newQuantity = Math.max(0, product.quantity - quantity);
                break;
            case 'set':
                newQuantity = quantity;
                break;
            default:
                return;
        }
        
        try {
            await DB.update('products', productId, { quantity: newQuantity });
            
            bootstrap.Modal.getInstance(document.getElementById('stockModal')).hide();
            Utils.showToast(`Stock mis a jour: ${newQuantity} unites`, 'success');
            await this.loadProducts();
        } catch (error) {
            console.error('Stock adjustment error:', error);
            Utils.showToast('Erreur: ' + error.message, 'error');
        }
    },
    
    /**
     * Delete product
     */
    async deleteProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        const confirmed = await Utils.confirm(
            'Supprimer le produit',
            `Etes-vous sur de vouloir supprimer "${product.name}" ? Cette action est irreversible.`
        );
        
        if (!confirmed) return;
        
        try {
            await DB.delete('products', productId);
            Utils.showToast('Produit supprime avec succes', 'success');
            await this.loadProducts();
        } catch (error) {
            console.error('Delete product error:', error);
            Utils.showToast('Erreur: ' + error.message, 'error');
        }
    },
    
    /**
     * Export products data
     */
    exportData() {
        if (!this.products.length) {
            Utils.showToast('Aucune donnee a exporter', 'warning');
            return;
        }
        
        const data = this.products.map(p => ({
            Nom: p.name,
            SKU: p.sku || '',
            Type: p.type,
            Prix: p.price,
            Stock: p.quantity,
            Stock_Min: p.min_stock,
            Statut: p.is_active ? 'Actif' : 'Inactif',
            Date_Creation: Utils.formatDate(p.created_at)
        }));
        
        Utils.exportToCSV(data, 'produits_storeflow');
        Utils.showToast('Export termine', 'success');
    }
};

// Register route
Router.register('/products', () => ProductsPage.render());
