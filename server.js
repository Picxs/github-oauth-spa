import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

// Para simular __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ⚠️ USANDO VARIÁVEL DE AMBIENTE para o Client Secret
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

if (!GITHUB_CLIENT_SECRET) {
    console.error('❌ ERRO: GITHUB_CLIENT_SECRET não está definido!');
    console.log('Use: GITHUB_CLIENT_SECRET=seu_secret node server.js');
    process.exit(1);
}

console.log('✅ GITHUB_CLIENT_SECRET configurado');

// Rota para trocar código por token
app.post('/exchange-token', async (req, res) => {
    try {
        const { code, code_verifier, client_id, redirect_uri } = req.body;

        console.log('=== BACKEND: Recebendo requisição ===');
        console.log('Client ID:', client_id);
        console.log('Code:', code ? 'PRESENTE' : 'AUSENTE');
        console.log('Code Verifier:', code_verifier ? 'PRESENTE' : 'AUSENTE');

        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'GitHub-OAuth-SPA'
            },
            body: JSON.stringify({
                client_id,
                client_secret: GITHUB_CLIENT_SECRET,
                code,
                code_verifier,
                redirect_uri
            })
        });

        console.log('Status do GitHub:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Resposta do GitHub:', data);
        
        res.json(data);
    } catch (error) {
        console.error('Error no backend:', error);
        res.status(500).json({ error: error.message });
    }
});

// Servir arquivos estáticos
app.use(express.static('.'));

// Rota raiz para teste
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota de health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`✅ Backend server running on http://localhost:${PORT}`);
    console.log(`📝 Endpoint: http://localhost:${PORT}/exchange-token`);
    console.log(`🌐 Frontend: http://localhost:${PORT}/`);
    console.log(`❤️  Health: http://localhost:${PORT}/health`);
    console.log('Press Ctrl+C to stop the server');
});

// Manter o processo ativo
process.on('SIGINT', () => {
    console.log('\n🛑 Parando servidor...');
    process.exit(0);
});
