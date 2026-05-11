/**
 * StoreFlow ERP - Configuration
 * Configuration globale de l'application
 */

const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
    
    // Application Settings
    APP_NAME: 'StoreFlow ERP',
    APP_VERSION: '1.0.0',
    DEFAULT_LOCALE: 'fr-FR',
    CURRENCY: 'XAF',
    CURRENCY_SYMBOL: 'FCFA',
    
    // Pagination
    ITEMS_PER_PAGE: 10,
    
    // Roles
    ROLES: {
        ADMIN: 'admin',
        MANAGER: 'manager',
        SELLER: 'seller'
    },
    
    // Payment Methods
    PAYMENT_METHODS: {
        CASH: 'cash',
        CREDIT: 'credit',
        MOBILE: 'mobile_money',
        BANK: 'bank_transfer'
    },
    
    // Product Types
    PRODUCT_TYPES: {
        SIMPLE: 'simple',
        PARENT: 'parent',
        VARIANT: 'variant'
    },
    
    // Audit Actions
    AUDIT_ACTIONS: {
        INSERT: 'INSERT',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE'
    }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.ROLES);
Object.freeze(CONFIG.PAYMENT_METHODS);
Object.freeze(CONFIG.PRODUCT_TYPES);
Object.freeze(CONFIG.AUDIT_ACTIONS);
