/**
 * APLICAÇÃO PRINCIPAL
 * Controla o fluxo entre páginas e inicialização
 */

class App {
    constructor() {
        this.paginaAtual = 'dashboard';
        this.dadosUsuario = null;
    }

    /**
     * Inicializa a aplicação
     */
    async init() {
        console.log(`Inicializando ${CONFIG.APP_NAME} v${CONFIG.VERSAO}...`);

        // Configurar eventos globais
        this.configurarEventos();

        // Verificar autenticação
        const autenticado = await auth.init();
        
        if (autenticado) {
            this.dadosUsuario = auth.getUsuario();
            console.log('Usuário autenticado:', this.dadosUsuario.email);
            
            // Verificar se usuário tem planilha configurada
            await this.verificarConfiguracao();
        } else {
            UI.mostrarTelaLogin();
        }

        // Inicializar PWA
        this.inicializarPWA();
    }

    /**
     * Configura eventos globais
     */
    configurarEventos() {
        // Botão logout
        document.getElementById('btn-logout').addEventListener('click', () => {
            auth.logout();
        });

        // Navegação sidebar
        document.querySelectorAll('.sidebar-nav .nav-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.closest('.nav-link').dataset.page;
                this.navegarPara(page);
            });
        });

        // Botão menu mobile
        document.getElementById('btn-menu-mobile').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('open');
        });

        // Botão Gemini
        document.getElementById('btn-gemini').addEventListener('click', (e) => {
            e.preventDefault();
            this.abrirGemini();
        });

        // Botão login Google
        const btnLogin = document.getElementById('btn-login-google');
        if (btnLogin) {
            btnLogin.addEventListener('click', () => this.loginGoogle());
        }

        // Botão criar planilha (tela de configuração inicial)
        const btnCriarPlanilha = document.getElementById('btn-criar-planilha');
        if (btnCriarPlanilha) {
            btnCriarPlanilha.addEventListener('click', () => this.criarPlanilhaProfessor());
        }
    }

    /**
     * Cria a planilha individual do professor (tela de configuração inicial)
     */
    async criarPlanilhaProfessor() {
        const btn = document.getElementById('btn-criar-planilha');
        try {
            if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loading-spinner"></span> Criando...'; }

            const response = await api.criarPlanilhaProfessor();

            if (response.success) {
                Toast.success('Planilha criada com sucesso!');
                await this.verificarConfiguracao();
            } else {
                Toast.error(response.message || 'Não foi possível criar a planilha.');
            }
        } catch (error) {
            console.error('Erro ao criar planilha:', error);
            Toast.error('Não foi possível criar a planilha.');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus-circle"></i> CRIAR MINHA PLANILHA'; }
        }
    }

    /**
     * Verifica configuração do usuário
     */
    async verificarConfiguracao() {
        try {
            const response = await api.get('verificarConfiguracaoUsuario');
            
            if (!response.data.planilhaConfigurada) {
                UI.mostrarTelaConfigInicial();
            } else {
                UI.mostrarApp();
                await this.navegarPara('dashboard');
            }
        } catch (error) {
            console.error('Erro ao verificar configuração:', error);
            UI.mostrarTelaConfigInicial();
        }
    }

    /**
     * Realiza login com Google
     */
    async loginGoogle() {
        try {
            await auth.login();
            if (auth.estaAutenticado()) {
                await this.verificarConfiguracao();
            }
        } catch (error) {
            console.error('Erro no login:', error);
        }
    }

    /**
     * Navegação entre páginas
     * @param {string} pagina - nome da página (data-page)
     * @param {Object|null} parametros - dados extras (ex: {idPlano} ao editar/visualizar)
     */
    async navegarPara(pagina, parametros = null) {
        this.paginaAtual = pagina;
        this.parametros = parametros;
        
        // Atualizar menu
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pagina) {
                link.classList.add('active');
            }
        });

        // Fechar sidebar no mobile
        document.querySelector('.sidebar').classList.remove('open');

        // Carregar página
        const content = document.getElementById('conteudo');
        content.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>';

        try {
            switch(pagina) {
                case 'dashboard':
                    await Dashboard.render();
                    break;
                case 'planos':
                    await Planos.render();
                    break;
                case 'novo-plano':
                    await FormularioPlano.render();
                    break;
                case 'editar-plano':
                    await FormularioPlano.render(null, this.parametros);
                    break;
                case 'calendario':
                    await Calendario.render();
                    break;
                case 'turmas':
                    await Turmas.render();
                    break;
                case 'componentes':
                    await Componentes.render();
                    break;
                case 'configuracoes':
                    await Configuracoes.render();
                    break;
                default:
                    await Dashboard.render();
            }

            // Atualizar título
            const titulos = {
                'dashboard': 'Dashboard',
                'planos': 'Meus Planos',
                'novo-plano': 'Novo Plano de Aula',
                'calendario': 'Calendário',
                'turmas': 'Minhas Turmas',
                'componentes': 'Componentes Curriculares',
                'configuracoes': 'Configurações'
            };

            document.getElementById('topbar-title').textContent = titulos[pagina] || 'Dashboard';

        } catch (error) {
            console.error('Erro ao carregar página:', error);
            content.innerHTML = `
                <div class="container text-center py-5">
                    <i class="fas fa-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                    <h3 class="mt-3">Erro ao carregar página</h3>
                    <p>Por favor, tente novamente.</p>
                </div>
            `;
        }
    }

    /**
     * Abre a Gem do Gemini
     */
    async abrirGemini() {
        try {
            // Buscar URL da Gem na configuração
            const response = await api.get('getConfiguracao', { chave: 'URL_GEM_GEMINI' });
            
            if (response.data && response.data.valor) {
                window.open(response.data.valor, '_blank');
            } else {
                Toast.warning('URL da Gem Gemini não configurada. Acesse Configurações.');
                this.navegarPara('configuracoes');
            }
        } catch (error) {
            Toast.error('Não foi possível abrir a Gem Gemini.');
        }
    }

    /**
     * Inicializa PWA
     */
    inicializarPWA() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('service-worker.js')
                    .then(registration => {
                        console.log('Service Worker registrado:', registration.scope);
                    })
                    .catch(error => {
                        console.error('Erro ao registrar Service Worker:', error);
                    });
            });
        }
    }
}

// Instância global
const app = new App();

// Inicializar ao carregar
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
