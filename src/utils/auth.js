// Utilitários para geração de valores aleatórios
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
        //const clientId = window.CLIENT_ID; // Será injetado via GitHub Actions
        const clientId = Ov23lihCtieY7buaZx6s;
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

    // Trocar code por access_token
    static async exchangeCodeForToken(code) {
        const codeVerifier = sessionStorage.getItem('code_verifier');
        const clientId = window.CLIENT_ID;

        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                code: code,
                code_verifier: codeVerifier,
                redirect_uri: `${window.location.origin}/callback.html`
            })
        });

        if (!response.ok) {
            throw new Error('Falha na troca do código por token');
        }

        const data = await response.json();
        return data.access_token;
    }

    // Verificar escopos do usuário
    static async getUserScopes(accessToken) {
        try {
            // Tentar uma operação de escrita para verificar escopo 'repo'
            const response = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    name: 'test-scope-validation',
                    auto_init: true,
                    private: true
                })
            });

            // Se conseguir criar repositório, tem escopo Manager
            if (response.status === 201) {
                // Deletar o repositório de teste
                const repoData = await response.json();
                await fetch(`https://api.github.com/repos/${repoData.owner.login}/${repoData.name}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                return 'manager';
            }
        } catch (error) {
            // Se falhar, é Viewer
            console.log('Usuário tem escopo viewer apenas');
        }
        return 'viewer';
    }
}

export default AuthUtils;