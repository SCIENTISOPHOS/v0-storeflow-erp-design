/**
 * StoreFlow ERP - Dashboard Page
 * Page principale du tableau de bord
 */

const DashboardPage = {
    stats: null,
    recentSales: [],
    lowStockProducts: [],
    salesChart: null,
    
    /**
     * Render dashboard
     */
    async render() {
        App.renderLayout(`
            <div class="page-content fade-in">
                <div class="page-header">
                    <div>
                        <h1 class="page-title">Tableau de bord</h1>
                        <p class="page-subtitle">Vue d'ensemble de votre activite</p>
                    </div>
                    <div class="d-flex gap-2">
                        <select class="form-select form-select-sm" id="periodFilter" onchange="DashboardPage.changePeriod(this.value)">
                            <option value="today">Aujourd'hui</option>
                            <option value="week" selected>Cette semaine</option>
                            <option value="month">Ce mois</option>
                            <option value="year">Cette annee</option>
                        </select>
                        <button class="btn btn-sm btn-outline-secondary" onclick="DashboardPage.refresh()">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Stats Cards -->
                <div class="stats-grid" id="statsGrid">
                    ${this.renderStatsSkeletons()}
                </div>
                
                <!-- Charts Row -->
                <div class="row g-4 mb-4">
                    <div class="col-lg-8">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Evolution des ventes</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="salesChart" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Repartition par mode de paiement</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="paymentChart" height="250"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Tables Row -->
                <div class="row g-4">
                    <div class="col-lg-7">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="card-title mb-0">Ventes recentes</h5>
                                <a href="#" onclick="Router.navigate('/sales')" class="btn btn-sm btn-outline-primary">
                                    Voir tout
                                </a>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-container" id="recentSalesTable">
                                    ${this.renderTableSkeleton()}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-5">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="card-title mb-0">
                                    <i class="bi bi-exclamation-triangle text-warning me-2"></i>
                                    Stock faible
                                </h5>
                                <a href="#" onclick="Router.navigate('/products')" class="btn btn-sm btn-outline-primary">
                                    Gerer
                                </a>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-container" id="lowStockTable">
                                    ${this.renderTableSkeleton()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        // Load data
        await this.loadData();
    },
    
    /**
     * Render stats skeleton loaders
     */
    renderStatsSkeletons() {
        return Array(4).fill(`
            <div class="stat-card">
                <div class="stat-icon primary">
                    <div class="skeleton" style="width: 24px; height: 24px;"></div>
                </div>
                <div class="stat-content">
                    <div class="skeleton mb-2" style="width: 60px; height: 12px;"></div>
                    <div class="skeleton mb-1" style="width: 100px; height: 28px;"></div>
                    <div class="skeleton" style="width: 80px; height: 12px;"></div>
                </div>
            </div>
        `).join('');
    },
    
    /**
     * Render table skeleton
     */
    renderTableSkeleton() {
        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th><div class="skeleton" style="width: 80px; height: 12px;"></div></th>
                        <th><div class="skeleton" style="width: 100px; height: 12px;"></div></th>
                        <th><div class="skeleton" style="width: 60px; height: 12px;"></div></th>
                    </tr>
                </thead>
                <tbody>
                    ${Array(5).fill(`
                        <tr>
                            <td><div class="skeleton" style="width: 100%; height: 16px;"></div></td>
                            <td><div class="skeleton" style="width: 100%; height: 16px;"></div></td>
                            <td><div class="skeleton" style="width: 100%; height: 16px;"></div></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },
    
    /**
     * Load dashboard data
     */
    async loadData() {
        try {
            const [stats, recentSales, lowStock] = await Promise.all([
                this.fetchStats(),
                this.fetchRecentSales(),
                this.fetchLowStockProducts()
            ]);
            
            this.stats = stats;
            this.recentSales = recentSales;
            this.lowStockProducts = lowStock;
            
            this.renderStats();
            this.renderRecentSales();
            this.renderLowStock();
            this.renderCharts();
        } catch (error) {
            console.error('Dashboard load error:', error);
            Utils.showToast('Erreur lors du chargement des donnees', 'error');
        }
    },
    
    /**
     * Fetch dashboard stats
     */
    async fetchStats() {
        const client = getSupabase();
        
        // Get date range
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        
        // Fetch sales count and total
        const { data: salesData, error: salesError } = await client
            .from('sales')
            .select('total, created_at')
            .gte('created_at', startOfMonth);
        
        if (salesError) throw salesError;
        
        // Fetch clients count
        const { count: clientsCount, error: clientsError } = await client
            .from('clients')
            .select('*', { count: 'exact', head: true });
        
        if (clientsError) throw clientsError;
        
        // Fetch products count
        const { count: productsCount, error: productsError } = await client
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);
        
        if (productsError) throw productsError;
        
        // Fetch pending credit
        const { data: creditData, error: creditError } = await client
            .from('clients')
            .select('current_balance')
            .gt('current_balance', 0);
        
        if (creditError) throw creditError;
        
        // Calculate stats
        const totalSales = salesData.reduce((sum, sale) => sum + Number(sale.total), 0);
        const todaySales = salesData.filter(s => new Date(s.created_at) >= new Date(startOfDay));
        const todayTotal = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0);
        const totalCredit = creditData.reduce((sum, c) => sum + Number(c.current_balance), 0);
        
        return {
            todaySales: todayTotal,
            monthSales: totalSales,
            salesCount: salesData.length,
            todaySalesCount: todaySales.length,
            clientsCount: clientsCount || 0,
            productsCount: productsCount || 0,
            pendingCredit: totalCredit
        };
    },
    
    /**
     * Fetch recent sales
     */
    async fetchRecentSales() {
        const client = getSupabase();
        
        const { data, error } = await client
            .from('sales')
            .select(`
                id,
                total,
                payment_method,
                created_at,
                clients (name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Fetch low stock products
     */
    async fetchLowStockProducts() {
        const client = getSupabase();
        
        const { data, error } = await client
            .from('products')
            .select('id, name, quantity, min_stock')
            .eq('is_active', true)
            .order('quantity', { ascending: true })
            .limit(5);
        
        if (error) throw error;
        
        // Filter products where quantity <= min_stock
        return data.filter(p => p.quantity <= p.min_stock);
    },
    
    /**
     * Render stats cards
     */
    renderStats() {
        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid || !this.stats) return;
        
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon success">
                    <i class="bi bi-currency-dollar"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Ventes aujourd'hui</div>
                    <div class="stat-value">${Utils.formatCurrency(this.stats.todaySales)}</div>
                    <div class="stat-change positive">
                        <i class="bi bi-arrow-up"></i>
                        ${this.stats.todaySalesCount} ventes
                    </div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon primary">
                    <i class="bi bi-graph-up"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Ventes du mois</div>
                    <div class="stat-value">${Utils.formatCurrency(this.stats.monthSales)}</div>
                    <div class="stat-change positive">
                        <i class="bi bi-cart"></i>
                        ${this.stats.salesCount} ventes
                    </div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon warning">
                    <i class="bi bi-people"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Clients</div>
                    <div class="stat-value">${Utils.formatNumber(this.stats.clientsCount)}</div>
                    <div class="stat-change">
                        <i class="bi bi-box-seam"></i>
                        ${this.stats.productsCount} produits
                    </div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon danger">
                    <i class="bi bi-credit-card"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Credits en cours</div>
                    <div class="stat-value">${Utils.formatCurrency(this.stats.pendingCredit)}</div>
                    <div class="stat-change negative">
                        A recouvrer
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Render recent sales table
     */
    renderRecentSales() {
        const container = document.getElementById('recentSalesTable');
        if (!container) return;
        
        if (!this.recentSales.length) {
            container.innerHTML = `
                <div class="empty-state py-4">
                    <i class="bi bi-cart-x"></i>
                    <p class="mb-0">Aucune vente recente</p>
                </div>
            `;
            return;
        }
        
        const paymentLabels = {
            'cash': 'Especes',
            'credit': 'Credit',
            'mobile_money': 'Mobile Money',
            'bank_transfer': 'Virement'
        };
        
        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Client</th>
                        <th>Montant</th>
                        <th>Paiement</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.recentSales.map(sale => `
                        <tr>
                            <td>
                                <span class="fw-medium">${Utils.escapeHtml(sale.clients?.name || 'Client anonyme')}</span>
                            </td>
                            <td class="fw-semibold">${Utils.formatCurrency(sale.total)}</td>
                            <td>
                                <span class="badge-status ${sale.payment_method === 'credit' ? 'pending' : 'active'}">
                                    ${paymentLabels[sale.payment_method] || sale.payment_method}
                                </span>
                            </td>
                            <td class="text-muted">${Utils.getRelativeTime(sale.created_at)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },
    
    /**
     * Render low stock table
     */
    renderLowStock() {
        const container = document.getElementById('lowStockTable');
        if (!container) return;
        
        if (!this.lowStockProducts.length) {
            container.innerHTML = `
                <div class="empty-state py-4">
                    <i class="bi bi-check-circle text-success"></i>
                    <p class="mb-0">Tous les stocks sont OK</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th>Stock</th>
                        <th>Min</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.lowStockProducts.map(product => `
                        <tr>
                            <td>
                                <span class="fw-medium">${Utils.escapeHtml(product.name)}</span>
                            </td>
                            <td>
                                <span class="badge-status ${product.quantity === 0 ? 'inactive' : 'pending'}">
                                    ${product.quantity}
                                </span>
                            </td>
                            <td class="text-muted">${product.min_stock}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },
    
    /**
     * Render charts
     */
    async renderCharts() {
        await this.renderSalesChart();
        await this.renderPaymentChart();
    },
    
    /**
     * Render sales line chart
     */
    async renderSalesChart() {
        const canvas = document.getElementById('salesChart');
        if (!canvas) return;
        
        // Get last 7 days sales data
        const client = getSupabase();
        const days = [];
        const totals = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString();
            const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString();
            
            days.push(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
            
            const { data } = await client
                .from('sales')
                .select('total')
                .gte('created_at', dayStart)
                .lte('created_at', dayEnd);
            
            const total = (data || []).reduce((sum, s) => sum + Number(s.total), 0);
            totals.push(total);
        }
        
        // Destroy existing chart
        if (this.salesChart) {
            this.salesChart.destroy();
        }
        
        this.salesChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Ventes',
                    data: totals,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => Utils.formatCurrency(context.raw)
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => Utils.formatCurrency(value)
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Render payment method pie chart
     */
    async renderPaymentChart() {
        const canvas = document.getElementById('paymentChart');
        if (!canvas) return;
        
        // Get payment method distribution
        const client = getSupabase();
        const { data } = await client
            .from('sales')
            .select('payment_method, total');
        
        const paymentTotals = {
            'cash': 0,
            'credit': 0,
            'mobile_money': 0,
            'bank_transfer': 0
        };
        
        (data || []).forEach(sale => {
            if (paymentTotals.hasOwnProperty(sale.payment_method)) {
                paymentTotals[sale.payment_method] += Number(sale.total);
            }
        });
        
        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Especes', 'Credit', 'Mobile Money', 'Virement'],
                datasets: [{
                    data: Object.values(paymentTotals),
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b',
                        '#6366f1',
                        '#06b6d4'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${Utils.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Change period filter
     */
    changePeriod(period) {
        Utils.showToast(`Periode: ${period}`, 'info');
        this.loadData();
    },
    
    /**
     * Refresh dashboard
     */
    refresh() {
        this.loadData();
        Utils.showToast('Donnees actualisees', 'success');
    }
};

// Register route
Router.register('/dashboard', () => DashboardPage.render());
