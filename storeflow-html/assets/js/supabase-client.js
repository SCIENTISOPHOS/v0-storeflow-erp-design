/**
 * StoreFlow ERP - Supabase Client
 * Client Supabase pour les opérations de base de données
 */

let supabase = null;

/**
 * Initialize Supabase client
 */
function initSupabase() {
    if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.error('Supabase URL not configured');
        return null;
    }
    
    supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    return supabase;
}

/**
 * Get current Supabase client instance
 */
function getSupabase() {
    if (!supabase) {
        return initSupabase();
    }
    return supabase;
}

/**
 * Database helper functions
 */
const DB = {
    /**
     * Fetch all records from a table
     */
    async getAll(table, options = {}) {
        const client = getSupabase();
        let query = client.from(table).select(options.select || '*');
        
        if (options.order) {
            query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
        }
        
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        if (options.filters) {
            options.filters.forEach(filter => {
                query = query[filter.operator](filter.column, filter.value);
            });
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },
    
    /**
     * Fetch a single record by ID
     */
    async getById(table, id, select = '*') {
        const client = getSupabase();
        const { data, error } = await client
            .from(table)
            .select(select)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },
    
    /**
     * Insert a new record
     */
    async insert(table, data) {
        const client = getSupabase();
        const { data: result, error } = await client
            .from(table)
            .insert(data)
            .select()
            .single();
        
        if (error) throw error;
        return result;
    },
    
    /**
     * Insert multiple records
     */
    async insertMany(table, dataArray) {
        const client = getSupabase();
        const { data: result, error } = await client
            .from(table)
            .insert(dataArray)
            .select();
        
        if (error) throw error;
        return result;
    },
    
    /**
     * Update a record by ID
     */
    async update(table, id, data) {
        const client = getSupabase();
        const { data: result, error } = await client
            .from(table)
            .update(data)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return result;
    },
    
    /**
     * Delete a record by ID
     */
    async delete(table, id) {
        const client = getSupabase();
        const { error } = await client
            .from(table)
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    },
    
    /**
     * Execute a custom query
     */
    async query(table) {
        return getSupabase().from(table);
    },
    
    /**
     * Call a stored procedure/function
     */
    async rpc(functionName, params = {}) {
        const client = getSupabase();
        const { data, error } = await client.rpc(functionName, params);
        if (error) throw error;
        return data;
    }
};
