/**
 * StoreFlow ERP - Router
 * Système de routage SPA basé sur le hash
 */

const Router = {
    routes: {},
    currentRoute: null,
    
    /**
     * Register a route
     */
    register(path, handler) {
        this.routes[path] = handler;
    },
    
    /**
     * Navigate to a route
     */
    navigate(path) {
        window.location.hash = path;
    },
    
    /**
     * Get current path
     */
    getCurrentPath() {
        return window.location.hash.slice(1) || '/login';
    },
    
    /**
     * Parse route params (e.g., /clients/:id)
     */
    parseParams(routePattern, actualPath) {
        const routeParts = routePattern.split('/');
        const pathParts = actualPath.split('/');
        
        if (routeParts.length !== pathParts.length) return null;
        
        const params = {};
        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                params[routeParts[i].slice(1)] = pathParts[i];
            } else if (routeParts[i] !== pathParts[i]) {
                return null;
            }
        }
        return params;
    },
    
    /**
     * Find matching route
     */
    findRoute(path) {
        // Exact match first
        if (this.routes[path]) {
            return { handler: this.routes[path], params: {} };
        }
        
        // Pattern matching
        for (const routePattern of Object.keys(this.routes)) {
            const params = this.parseParams(routePattern, path);
            if (params) {
                return { handler: this.routes[routePattern], params };
            }
        }
        
        return null;
    },
    
    /**
     * Handle route change
     */
    async handleRouteChange() {
        const path = this.getCurrentPath();
        const route = this.findRoute(path);
        
        // Check authentication
        const isAuthenticated = await Auth.isAuthenticated();
        const publicRoutes = ['/login', '/register', '/forgot-password'];
        
        if (!isAuthenticated && !publicRoutes.includes(path)) {
            this.navigate('/login');
            return;
        }
        
        if (isAuthenticated && publicRoutes.includes(path)) {
            this.navigate('/dashboard');
            return;
        }
        
        if (route) {
            this.currentRoute = path;
            await route.handler(route.params);
        } else {
            // 404 - redirect to dashboard or login
            this.navigate(isAuthenticated ? '/dashboard' : '/login');
        }
    },
    
    /**
     * Initialize router
     */
    init() {
        window.addEventListener('hashchange', () => this.handleRouteChange());
        
        // Handle initial route
        if (!window.location.hash) {
            window.location.hash = '/login';
        }
        
        this.handleRouteChange();
    }
};
