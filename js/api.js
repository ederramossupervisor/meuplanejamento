/**
 * CAMADA DE COMUNICAÇÃO COM O APPS SCRIPT
 * Centraliza todas as chamadas fetch e tratamento de erros
 */

class API {
    constructor() {
        this.baseUrl = CONFIG.APPS_SCRIPT_URL;
    }

    /**
     * Token de sessão atual (emitido no login), incluído em toda chamada
     * para que o Apps Script consiga identificar o usuário — ele não
     * consegue usar Session.getActiveUser() para requisições externas.
     */
    getToken() {
        return (typeof auth !== 'undefined' && auth.getToken()) || localStorage.getItem('auth_token') || '';
    }

    /**
     * Realiza uma chamada GET ao Apps Script
     */
    async get(endpoint, params = {}) {
        try {
            const queryString = new URLSearchParams({
                action: endpoint,
                token: this.getToken(),
                ...params,
                timestamp: Date.now()
            }).toString();

            const response = await fetch(`${this.baseUrl}?${queryString}`);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.success === false) {
                throw new Error(data.error || 'ERRO_DESCONHECIDO');
            }

            return data;
        } catch (error) {
            console.error(`[API GET] ${endpoint}:`, error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Realiza uma chamada POST ao Apps Script
     * (o token vai na query string também, pois o Apps Script lê e.parameter
     * independente do método — o corpo fica só com os dados da ação)
     */
    async post(endpoint, data = {}) {
        try {
            const queryString = new URLSearchParams({
                action: endpoint,
                token: this.getToken()
            }).toString();

            const response = await fetch(`${this.baseUrl}?${queryString}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();

            if (result.success === false) {
                throw new Error(result.error || 'ERRO_DESCONHECIDO');
            }

            return result;
        } catch (error) {
            console.error(`[API POST] ${endpoint}:`, error);
            this.handleError(error);
            throw error;
        }
    }

    /**
     * Tratamento centralizado de erros
     */
    handleError(error) {
        console.error('Detalhes do erro:', error);

        const mensagens = {
            'AUTH_ERROR': 'Sua sessão expirou. Faça login novamente.',
            'PERMISSION_DENIED': 'Você não tem permissão para esta ação.',
            'NOT_FOUND': 'Dados não encontrados.',
            'VALIDATION_ERROR': 'Verifique os campos obrigatórios.',
        };

        // Sessão inválida em uma chamada feita DEPOIS de já estar logado -> desloga de verdade.
        // (Se ainda nem havia login, deixamos o próprio auth.init() tratar isso em silêncio.)
        if (error.message === 'AUTH_ERROR' && typeof auth !== 'undefined' && auth.estaAutenticado()) {
            auth.logout();
        }

        if (typeof Toast !== 'undefined') {
            const mensagem = mensagens[error.message] || 'Ocorreu um erro. Tente novamente.';
            Toast.error(mensagem);
        }
    }

    /**
     * Cria a planilha individual do professor
     */
    async criarPlanilhaProfessor() {
        return await this.post('criarPlanilhaProfessor', {});
    }

    /**
     * Busca dados do usuário
     */
    async getUsuario() {
        return await this.get('getUsuario');
    }
}

// Instância global da API
const api = new API();
