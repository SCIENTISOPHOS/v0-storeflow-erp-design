/**
 * StoreFlow ERP - Login Page
 * Page de connexion et inscription
 */

const LoginPage = {
    mode: 'login', // 'login', 'register', 'forgot'
    isLoading: false,
    
    /**
     * Render login page
     */
    render() {
        const app = document.getElementById('app');
        
        if (this.mode === 'register') {
            app.innerHTML = this.renderRegister();
        } else if (this.mode === 'forgot') {
            app.innerHTML = this.renderForgotPassword();
        } else {
            app.innerHTML = this.renderLogin();
        }
        
        // Hide loading
        document.getElementById('loading')?.remove();
    },
    
    /**
     * Render login form
     */
    renderLogin() {
        return `
            <div class="login-page">
                <div class="login-card slide-in">
                    <div class="login-logo">
                        <i class="bi bi-shop"></i>
                        <h1>StoreFlow</h1>
                        <p>Systeme de Gestion Commerciale</p>
                    </div>
                    
                    <form id="loginForm" onsubmit="LoginPage.handleLogin(event)">
                        <div class="form-group">
                            <label class="form-label">Adresse email</label>
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-envelope"></i>
                                </span>
                                <input type="email" 
                                       class="form-control" 
                                       name="email" 
                                       placeholder="votre@email.com"
                                       required 
                                       autofocus>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label d-flex justify-content-between">
                                <span>Mot de passe</span>
                                <a href="#" onclick="LoginPage.showForgotPassword()" class="text-decoration-none small">
                                    Mot de passe oublie ?
                                </a>
                            </label>
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-lock"></i>
                                </span>
                                <input type="password" 
                                       class="form-control" 
                                       name="password" 
                                       placeholder="Votre mot de passe"
                                       required
                                       minlength="6">
                                <button class="btn btn-outline-secondary" type="button" 
                                        onclick="LoginPage.togglePassword(this)">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="rememberMe" name="remember">
                                <label class="form-check-label" for="rememberMe">
                                    Se souvenir de moi
                                </label>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-100 btn-lg" id="loginBtn">
                            <span class="spinner-border spinner-border-sm me-2 d-none" id="loginSpinner"></span>
                            <i class="bi bi-box-arrow-in-right me-2" id="loginIcon"></i>
                            Se connecter
                        </button>
                    </form>
                    
                    <div class="text-center mt-4">
                        <p class="text-muted mb-0">
                            Pas encore de compte ?
                            <a href="#" onclick="LoginPage.showRegister()" class="text-decoration-none">
                                Creer un compte
                            </a>
                        </p>
                    </div>
                    
                    <hr class="my-4">
                    
                    <div class="text-center">
                        <p class="text-muted small mb-2">Connexion demo</p>
                        <button class="btn btn-outline-secondary btn-sm" onclick="LoginPage.demoLogin()">
                            <i class="bi bi-lightning me-1"></i>
                            Connexion Admin Demo
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Render register form
     */
    renderRegister() {
        return `
            <div class="login-page">
                <div class="login-card slide-in">
                    <div class="login-logo">
                        <i class="bi bi-shop"></i>
                        <h1>StoreFlow</h1>
                        <p>Creer un nouveau compte</p>
                    </div>
                    
                    <form id="registerForm" onsubmit="LoginPage.handleRegister(event)">
                        <div class="form-group">
                            <label class="form-label">Nom complet</label>
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-person"></i>
                                </span>
                                <input type="text" 
                                       class="form-control" 
                                       name="fullName" 
                                       placeholder="Jean Dupont"
                                       required 
                                       autofocus>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Adresse email</label>
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-envelope"></i>
                                </span>
                                <input type="email" 
                                       class="form-control" 
                                       name="email" 
                                       placeholder="votre@email.com"
                                       required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Mot de passe</label>
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-lock"></i>
                                </span>
                                <input type="password" 
                                       class="form-control" 
                                       name="password" 
                                       placeholder="Minimum 6 caracteres"
                                       required
                                       minlength="6">
                                <button class="btn btn-outline-secondary" type="button" 
                                        onclick="LoginPage.togglePassword(this)">
                                    <i class="bi bi-eye"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Confirmer le mot de passe</label>
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-lock-fill"></i>
                                </span>
                                <input type="password" 
                                       class="form-control" 
                                       name="confirmPassword" 
                                       placeholder="Retapez le mot de passe"
                                       required
                                       minlength="6">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="acceptTerms" required>
                                <label class="form-check-label" for="acceptTerms">
                                    J'accepte les <a href="#" class="text-decoration-none">conditions d'utilisation</a>
                                </label>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-100 btn-lg" id="registerBtn">
                            <span class="spinner-border spinner-border-sm me-2 d-none" id="registerSpinner"></span>
                            <i class="bi bi-person-plus me-2" id="registerIcon"></i>
                            Creer mon compte
                        </button>
                    </form>
                    
                    <div class="text-center mt-4">
                        <p class="text-muted mb-0">
                            Deja un compte ?
                            <a href="#" onclick="LoginPage.showLogin()" class="text-decoration-none">
                                Se connecter
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Render forgot password form
     */
    renderForgotPassword() {
        return `
            <div class="login-page">
                <div class="login-card slide-in">
                    <div class="login-logo">
                        <i class="bi bi-key"></i>
                        <h1>Mot de passe oublie</h1>
                        <p>Entrez votre email pour reinitialiser</p>
                    </div>
                    
                    <form id="forgotForm" onsubmit="LoginPage.handleForgotPassword(event)">
                        <div class="form-group">
                            <label class="form-label">Adresse email</label>
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-envelope"></i>
                                </span>
                                <input type="email" 
                                       class="form-control" 
                                       name="email" 
                                       placeholder="votre@email.com"
                                       required 
                                       autofocus>
                            </div>
                            <div class="form-text">
                                Un lien de reinitialisation sera envoye a cette adresse
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-100 btn-lg" id="forgotBtn">
                            <span class="spinner-border spinner-border-sm me-2 d-none" id="forgotSpinner"></span>
                            <i class="bi bi-send me-2" id="forgotIcon"></i>
                            Envoyer le lien
                        </button>
                    </form>
                    
                    <div class="text-center mt-4">
                        <a href="#" onclick="LoginPage.showLogin()" class="text-decoration-none">
                            <i class="bi bi-arrow-left me-1"></i>
                            Retour a la connexion
                        </a>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Handle login form submission
     */
    async handleLogin(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const form = event.target;
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        
        this.setLoading(true, 'login');
        
        try {
            await Auth.login(email, password);
            Utils.showToast('Connexion reussie ! Bienvenue.', 'success');
            Router.navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            Utils.showToast(this.getErrorMessage(error), 'error');
        } finally {
            this.setLoading(false, 'login');
        }
    },
    
    /**
     * Handle register form submission
     */
    async handleRegister(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const form = event.target;
        const formData = new FormData(form);
        const fullName = formData.get('fullName');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        // Validate passwords match
        if (password !== confirmPassword) {
            Utils.showToast('Les mots de passe ne correspondent pas', 'error');
            return;
        }
        
        this.setLoading(true, 'register');
        
        try {
            await Auth.register(email, password, fullName);
            Utils.showToast('Compte cree ! Verifiez votre email pour confirmer.', 'success');
            this.showLogin();
        } catch (error) {
            console.error('Register error:', error);
            Utils.showToast(this.getErrorMessage(error), 'error');
        } finally {
            this.setLoading(false, 'register');
        }
    },
    
    /**
     * Handle forgot password form submission
     */
    async handleForgotPassword(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const form = event.target;
        const formData = new FormData(form);
        const email = formData.get('email');
        
        this.setLoading(true, 'forgot');
        
        try {
            await Auth.resetPassword(email);
            Utils.showToast('Email envoye ! Verifiez votre boite de reception.', 'success');
            this.showLogin();
        } catch (error) {
            console.error('Reset password error:', error);
            Utils.showToast(this.getErrorMessage(error), 'error');
        } finally {
            this.setLoading(false, 'forgot');
        }
    },
    
    /**
     * Demo login with test credentials
     */
    async demoLogin() {
        const demoEmail = 'admin@storeflow.com';
        const demoPassword = 'admin123';
        
        // Fill in the form
        const emailInput = document.querySelector('input[name="email"]');
        const passwordInput = document.querySelector('input[name="password"]');
        
        if (emailInput && passwordInput) {
            emailInput.value = demoEmail;
            passwordInput.value = demoPassword;
        }
        
        Utils.showToast('Identifiants demo remplis. Cliquez sur "Se connecter"', 'info');
    },
    
    /**
     * Toggle password visibility
     */
    togglePassword(button) {
        const input = button.previousElementSibling;
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'bi bi-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'bi bi-eye';
        }
    },
    
    /**
     * Show login mode
     */
    showLogin() {
        this.mode = 'login';
        Router.navigate('/login');
    },
    
    /**
     * Show register mode
     */
    showRegister() {
        this.mode = 'register';
        this.render();
    },
    
    /**
     * Show forgot password mode
     */
    showForgotPassword() {
        this.mode = 'forgot';
        this.render();
    },
    
    /**
     * Set loading state
     */
    setLoading(isLoading, formType) {
        this.isLoading = isLoading;
        
        const spinner = document.getElementById(`${formType}Spinner`);
        const icon = document.getElementById(`${formType}Icon`);
        const btn = document.getElementById(`${formType}Btn`);
        
        if (spinner) spinner.classList.toggle('d-none', !isLoading);
        if (icon) icon.classList.toggle('d-none', isLoading);
        if (btn) btn.disabled = isLoading;
    },
    
    /**
     * Get user-friendly error message
     */
    getErrorMessage(error) {
        const messages = {
            'Invalid login credentials': 'Email ou mot de passe incorrect',
            'Email not confirmed': 'Veuillez confirmer votre email',
            'User already registered': 'Un compte existe deja avec cet email',
            'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caracteres'
        };
        
        return messages[error.message] || error.message || 'Une erreur est survenue';
    }
};

// Register route
Router.register('/login', () => {
    LoginPage.mode = 'login';
    LoginPage.render();
});

Router.register('/register', () => {
    LoginPage.mode = 'register';
    LoginPage.render();
});

Router.register('/forgot-password', () => {
    LoginPage.mode = 'forgot';
    LoginPage.render();
});
