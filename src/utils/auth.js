
class AuthUtils {
    static generateRandomString(length) {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let text = '';
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    // Gerar code_verifier (43-128 caracteres)
    static generateCodeVerifier() {
        return this.generateRandomString(64);
    }

    // Gerar code_challenge (SHA256 do verifier em base64url)
    static async generateCodeChallenge(verifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const hash = await crypto.subtle.digest('SHA-256', data);
        
        // Converter para base64url
        return btoa(String.fromCharCode(...new Uint8Array(hash)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    // Gerar state para proteção CSRF
    static generateState() {
        return this.generateRandomString(32);
    }

    // Iniciar fluxo OAuth
    static async startOAuthFlow() {
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        const state = this.generateState();

        // Armazenar no sessionStorage (Requisito C)
        sessionStorage.setItem('code_verifier', codeVerifier);
        sessionStorage.setItem('oauth_state', state);

        // Construir URL de autorização
        const clientId = window.CLIENT_ID;
        const redirectUri = `${window.location.origin}/callback.html`;
        const scope = 'read:user repo'; // Escopos para Viewer e Manager

        const authUrl = new URL('https://github.com/login/oauth/authorize');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', scope);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');

        // Redirecionar para GitHub OAuth
        window.location.href = authUrl.toString();
    }

    // Verificar escopos do usuário
    static async getUserScopes(accessToken) {
        try {
            // Tentar uma operação de leitura primeiro
            const response = await fetch('https://api.github.com/user/repos', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                // Para simplificar, vamos considerar que se consegue ler repositórios,
                // tem pelo menos permissão de viewer
                // Em um cenário real, você verificaria os escopos no token JWT
                return 'viewer';
            }
        } catch (error) {
            console.log('Erro ao verificar escopos:', error);
        }
        return 'viewer';
    }
}

export default AuthUtils;