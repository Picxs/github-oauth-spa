import AuthUtils from './utils/auth.js';
import Dashboard from './components/Dashboard.js';

class App {
    constructor() {
        this.init();
    }

    async init() {
        const content = document.getElementById('content');
        
        // Verificar se estamos no callback
        if (window.location.pathname.includes('callback.html')) {
            await this.handleCallback();
            return;
        }

        // Verificar se já está autenticado
        const accessToken = sessionStorage.getItem('access_token');
        if (accessToken) {
            await this.showDashboard(accessToken);
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="login-container">
                <h2>GitHub Repository Manager</h2>
                <p>Gerencie seus repositórios do GitHub de forma segura</p>
                <button id="login-btn" class="btn btn-primary">Login com GitHub</button>
                <div class="features">
                    <h3>Funcionalidades:</h3>
                    <ul>
                        <li>🔍 Visualizar seus repositórios</li>
                        <li>⚡ Criar novos repositórios (Manager)</li>
                        <li>🔒 Autenticação segura com OAuth 2.0 PKCE</li>
                    </ul>
                </div>
            </div>
        `;

        document.getElementById('login-btn').addEventListener('click', () => {
            AuthUtils.startOAuthFlow();
        });
    }

    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        // Validar state (Proteção CSRF - Requisito C)
        const storedState = sessionStorage.getItem('oauth_state');
        if (state !== storedState) {
            alert('Erro de segurança: State inválido');
            window.location.href = '/';
            return;
        }

        if (error) {
            alert(`Erro de autorização: ${error}`);
            window.location.href = '/';
            return;
        }

        try {
            const accessToken = await AuthUtils.exchangeCodeForToken(code);
            
            // Armazenar token apenas em sessionStorage (Requisito C)
            sessionStorage.setItem('access_token', accessToken);
            
            // Limpar code_verifier e state
            sessionStorage.removeItem('code_verifier');
            sessionStorage.removeItem('oauth_state');
            
            // Redirecionar para página principal
            window.location.href = '/';
            
        } catch (error) {
            console.error('Erro no callback:', error);
            alert('Falha na autenticação');
            window.location.href = '/';
        }
    }

    async showDashboard(accessToken) {
        try {
            // Verificar escopos do usuário (Requisito B)
            const userScope = await AuthUtils.getUserScopes(accessToken);
            
            const dashboard = new Dashboard(accessToken, userScope);
            await dashboard.render(document.getElementById('content'));
            
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            sessionStorage.removeItem('access_token');
            this.showLogin();
        }
    }
}

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new App();
});