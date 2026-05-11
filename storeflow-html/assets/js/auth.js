/**
 * StoreFlow ERP - Authentication Module
 * Gestion de l'authentification via Supabase
 */

const Auth = {
    currentUser: null,
    currentProfile: null,
    
    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        try {
            const client = getSupabase();
            if (!client) return false;
            
            const { data: { session } } = await client.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                await this.loadProfile();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    },
    
    /**
     * Load user profile
     */
    async loadProfile() {
        if (!this.currentUser) return null;
        
        try {
            const profile = await DB.getById('profiles', this.currentUser.id);
            this.currentProfile = profile;
            return profile;
        } catch (error) {
            console.error('Load profile error:', error);
            return null;
        }
    },
    
    /**
     * Login with email and password
     */
    async login(email, password) {
        const client = getSupabase();
        
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        this.currentUser = data.user;
        await this.loadProfile();
        
        return data;
    },
    
    /**
     * Register new user
     */
    async register(email, password, fullName) {
        const client = getSupabase();
        
        const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        
        if (error) throw error;
        
        return data;
    },
    
    /**
     * Logout
     */
    async logout() {
        const client = getSupabase();
        
        const { error } = await client.auth.signOut();
        if (error) throw error;
        
        this.currentUser = null;
        this.currentProfile = null;
        
        Router.navigate('/login');
    },
    
    /**
     * Request password reset
     */
    async resetPassword(email) {
        const client = getSupabase();
        
        const { error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/#/reset-password'
        });
        
        if (error) throw error;
    },
    
    /**
     * Update password
     */
    async updatePassword(newPassword) {
        const client = getSupabase();
        
        const { error } = await client.auth.updateUser({
            password: newPassword
        });
        
        if (error) throw error;
    },
    
    /**
     * Get current user
     */
    getUser() {
        return this.currentUser;
    },
    
    /**
     * Get current profile
     */
    getProfile() {
        return this.currentProfile;
    },
    
    /**
     * Check if user has role
     */
    hasRole(roles) {
        if (!this.currentProfile) return false;
        if (typeof roles === 'string') roles = [roles];
        return roles.includes(this.currentProfile.role);
    },
    
    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.hasRole([CONFIG.ROLES.ADMIN]);
    },
    
    /**
     * Check if user is manager or admin
     */
    isManagerOrAdmin() {
        return this.hasRole([CONFIG.ROLES.ADMIN, CONFIG.ROLES.MANAGER]);
    },
    
    /**
     * Update profile
     */
    async updateProfile(data) {
        if (!this.currentUser) throw new Error('Not authenticated');
        
        const result = await DB.update('profiles', this.currentUser.id, {
            ...data,
            updated_at: new Date().toISOString()
        });
        
        this.currentProfile = result;
        return result;
    },
    
    /**
     * Listen to auth state changes
     */
    onAuthStateChange(callback) {
        const client = getSupabase();
        return client.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                this.currentUser = session?.user;
                this.loadProfile().then(() => callback(event, session));
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.currentProfile = null;
                callback(event, session);
            } else {
                callback(event, session);
            }
        });
    }
};
