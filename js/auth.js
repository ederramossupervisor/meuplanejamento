/**
 * GERENCIAMENTO DE AUTENTICAÇÃO
 *
 * Fluxo: o Google Identity Services (GIS) autentica o usuário no navegador e
 * entrega um ID token (JWT). Esse token é enviado ao Apps Script (ação "login"),
 * que o valida e devolve um token de SESSÃO próprio. Esse token de sessão (não
 * o do Google) é o que fica salvo e é reenviado em toda chamada à API.
 */

class Auth {
    constructor() {
        this.usuario = null;
        this.token = null;
        this._resolverLogin = null;
        this._googleInicializado = false;
    }

    /**
     * Inicializa o cliente do Google Identity Services (uma vez só).
     * Exige que <script src="https://accounts.google.com/gsi/client"> esteja no index.html.
     */
    inicializarGoogleIdentity() {
        if (this._googleInicializado) return;

        if (typeof google === 'undefined' || !google.accounts) {
            console.error('Google Identity Services não carregou (verifique o <script> no index.html).');
            return;
        }

        if (!CONFIG.GOOGLE.CLIENT_ID) {
            console.error('CONFIG.GOOGLE.CLIENT_ID não configurado em js/config.js.');
            return;
        }

        google.accounts.id.initialize({
            client_id: CONFIG.GOOGLE.CLIENT_ID,
            callback: (resposta) => this.aoReceberCredencialGoogle(resposta)
        });

        this._googleInicializado = true;
    }

    /**
     * Callback do GIS: recebe o ID token do Google e troca por uma sessão do app.
     */
    async aoReceberCredencialGoogle(resposta) {
        try {
            const login = await api.post('login', { idToken: resposta.credential });

            if (login.success) {
                this.usuario = login.data.usuario;
                this.token = login.data.token;
                this.salvarSessao();
                if (this._resolverLogin) this._resolverLogin(true);
            } else {
                Toast.error(login.message || 'Não foi possível concluir o login.');
                if (this._resolverLogin) this._resolverLogin(false);
            }
        } catch (error) {
            console.error('Erro ao validar login do Google:', error);
            Toast.error('Não foi possível concluir o login.');
            if (this._resolverLogin) this._resolverLogin(false);
        } finally {
            this._resolverLogin = null;
        }
    }

    /**
     * Inicializa a autenticação: tenta restaurar sessão salva e confere no
     * servidor se ela ainda é válida.
     */
    async init() {
        this.inicializarGoogleIdentity();

        if (this.restaurarSessao()) {
            try {
                const response = await api.get('verificarAutenticacao');
                if (response.success && response.data) {
                    this.usuario = response.data;
                    return true;
                }
            } catch (error) {
                // token expirado/ inválido — cai para limpar a sessão abaixo
            }
        }

        this.limparSessao();
        return false;
    }

    /**
     * Dispara o login com Google e só resolve quando o servidor confirmar a sessão.
     */
    async login() {
        this.inicializarGoogleIdentity();

        if (!this._googleInicializado) {
            Toast.error('Login do Google indisponível. Recarregue a página.');
            return false;
        }

        Loading.show('Conectando à sua conta Google...');

        try {
            const sucesso = await new Promise((resolve) => {
                this._resolverLogin = resolve;
                google.accounts.id.prompt((notificacao) => {
                    if (notificacao.isNotDisplayed && (notificacao.isNotDisplayed() || notificacao.isSkippedMoment())) {
                        Toast.error('Não foi possível abrir o login do Google. Verifique bloqueadores de pop-up/cookies de terceiros.');
                        if (this._resolverLogin) { this._resolverLogin(false); this._resolverLogin = null; }
                    }
                });
            });
            return sucesso;
        } finally {
            Loading.hide();
        }
    }

    /**
     * Salva a sessão no localStorage
     */
    salvarSessao() {
        if (this.token) {
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('auth_usuario', JSON.stringify(this.usuario));
        }
    }

    /**
     * Restaura a sessão do localStorage
     */
    restaurarSessao() {
        const token = localStorage.getItem('auth_token');
        const usuario = localStorage.getItem('auth_usuario');

        if (token && usuario) {
            this.token = token;
            this.usuario = JSON.parse(usuario);
            return true;
        }
        return false;
    }

    /**
     * Limpa a sessão local, sem avisos/redirecionamento (uso interno)
     */
    limparSessao() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_usuario');
        this.usuario = null;
        this.token = null;
    }

    /**
     * Encerra a sessão (ação explícita do usuário ou sessão expirada em uso)
     */
    logout() {
        this.limparSessao();
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.disableAutoSelect();
        }
        UI.mostrarTelaLogin();
        Toast.info('Sessão encerrada.');
    }

    /**
     * Verifica se o usuário está autenticado
     */
    estaAutenticado() {
        return !!this.token;
    }

    /**
     * Obtém informações do usuário atual
     */
    getUsuario() {
        return this.usuario;
    }

    /**
     * Obtém token de sessão
     */
    getToken() {
        return this.token;
    }
}

// Instância global
const auth = new Auth();
