/**
 * LISTAGEM E GESTÃO DE PLANOS DE AULA
 */

const PALETA_CORES_TURMA = [
    '#4285F4', '#EA4335', '#34A853', '#FBBC04', '#9C27B0',
    '#FF6D01', '#00ACC1', '#8D6E63', '#EC407A', '#5C6BC0'
];

const Planos = {
    lista: [],
    turmasMap: {},
    turmasCoresMap: {},
    filtros: { busca: '', status: '', favoritos: '', ordenar: 'mais_recentes' },

    /**
     * Gera uma cor estável (sempre a mesma) para uma turma, a partir do seu ID.
     * Assim cada turma sempre aparece com a mesma cor, sem precisar salvar nada.
     */
    corDaTurma(idTurma) {
        if (!idTurma) return '#adb5bd';
        if (this.turmasCoresMap[idTurma]) return this.turmasCoresMap[idTurma];

        let hash = 0;
        const str = String(idTurma);
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const cor = PALETA_CORES_TURMA[Math.abs(hash) % PALETA_CORES_TURMA.length];
        this.turmasCoresMap[idTurma] = cor;
        return cor;
    },

    async render() {
        const content = document.getElementById('conteudo');
        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 class="mb-0">Meus Planos</h4>
                <button class="btn btn-primary" onclick="app.navegarPara('novo-plano')">
                    <i class="fas fa-plus"></i> Novo Plano
                </button>
            </div>

            <div class="card mb-3">
                <div class="card-body">
                    <div class="row g-2 align-items-end">
                        <div class="col-md-4">
                            <label class="form-label">Buscar</label>
                            <input type="text" class="form-control" id="filtro-busca" placeholder="Assunto, tema ou componente...">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="filtro-status">
                                <option value="">Todos</option>
                                ${CONFIG.STATUS_PLANO.map(s => `<option value="${s}">${s}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Favoritos</label>
                            <select class="form-select" id="filtro-favoritos">
                                <option value="">Todos</option>
                                <option value="true">Somente favoritos</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Ordenar por</label>
                            <select class="form-select" id="filtro-ordenar">
                                <option value="mais_recentes">Mais recentes</option>
                                <option value="mais_antigos">Mais antigos</option>
                                <option value="data_aula">Data da aula</option>
                                <option value="assunto">Assunto (A-Z)</option>
                                <option value="favoritos">Favoritos primeiro</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-outline-primary w-100" onclick="Planos.aplicarFiltros()">
                                <i class="fas fa-filter"></i> Filtrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="planos-lista" class="row"></div>
        `;

        document.getElementById('filtro-busca').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.aplicarFiltros();
        });

        await this.carregarTurmas();
        await this.carregar();
    },

    async carregarTurmas() {
        try {
            const response = await api.get('listarTurmas', {}, { cache: true, ttl: 300000 });
            this.turmasMap = {};
            (response.data || []).forEach(t => { this.turmasMap[t.id_turma] = t.nome_turma; });
        } catch (error) {
            this.turmasMap = {};
        }
    },

    aplicarFiltros() {
        this.filtros.busca = document.getElementById('filtro-busca').value.trim();
        this.filtros.status = document.getElementById('filtro-status').value;
        this.filtros.favoritos = document.getElementById('filtro-favoritos').value;
        this.filtros.ordenar = document.getElementById('filtro-ordenar').value;
        this.carregar();
    },

    async carregar() {
        const container = document.getElementById('planos-lista');
        if (!container) return; // a página mudou antes deste carregamento terminar
        container.innerHTML = '<div class="text-center py-4 w-100"><div class="loading-spinner"></div></div>';
        try {
            const params = {};
            Object.entries(this.filtros).forEach(([chave, valor]) => { if (valor) params[chave] = valor; });
            const response = await api.get('buscarPlanos', params, { cache: true, ttl: 60000 });
            this.lista = response.data || [];
            this.renderLista();
        } catch (error) {
            if (document.getElementById('planos-lista')) {
                container.innerHTML = '<p class="text-muted">Não foi possível carregar os planos.</p>';
            }
        }
    },

    renderLista() {
        const container = document.getElementById('planos-lista');
        if (!container) return; // a página mudou antes deste carregamento terminar

        if (this.lista.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="fas fa-book" style="font-size:3rem;"></i>
                    <p class="mt-3">Nenhum plano encontrado.</p>
                </div>`;
            return;
        }

        container.innerHTML = this.lista.map(plano => {
            const corTurma = this.corDaTurma(plano.id_turma);
            return `
            <div class="col-md-4 mb-3">
                <div class="card card-plano h-100" style="border-left: 5px solid ${corTurma};">
                    <div class="card-header">
                        <div class="componente">${UI.escaparHTML(plano.componente || '')}</div>
                        <div class="turma">
                            <span class="turma-dot" style="background:${corTurma};"></span>
                            ${UI.escaparHTML(this.turmasMap[plano.id_turma] || 'Turma não informada')} · ${UI.formatarData(plano.data_aula)}
                        </div>
                        <div class="assunto">${UI.escaparHTML(plano.assunto || '')}</div>
                    </div>
                    <div class="card-body">
                        <span class="badge bg-primary">${UI.escaparHTML(plano.status || 'Rascunho')}</span>
                        ${plano.favorito === true || plano.favorito === 'true' ? '<i class="fas fa-star text-warning ms-1"></i>' : ''}
                        ${plano.tema ? `<p class="text-muted mt-2 mb-0">${UI.escaparHTML(plano.tema)}</p>` : ''}
                    </div>
                    <div class="card-footer flex-wrap">
                        <button class="btn-action btn-outline-primary" onclick="Visualizacao.abrir('${plano.id_plano}')" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-outline-secondary" onclick="app.navegarPara('editar-plano', {idPlano:'${plano.id_plano}'})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-outline-info" onclick="Planos.abrirAnexos('${plano.id_plano}')" title="Anexos">
                            <i class="fas fa-paperclip"></i>
                        </button>
                        <button class="btn-action btn-outline-warning" onclick="Planos.favoritar('${plano.id_plano}', ${!(plano.favorito === true || plano.favorito === 'true')})" title="Favoritar">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="btn-action btn-outline-success" onclick="Planos.duplicar('${plano.id_plano}')" title="Duplicar">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn-action btn-outline-danger" onclick="Planos.excluir('${plano.id_plano}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    },

    /**
     * Abre o modal de anexos do plano, sem precisar entrar na tela de edição.
     */
    abrirAnexos(idPlano) {
        const modalEl = document.getElementById('modal-anexos');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
        DriveAnexos.render(idPlano, 'anexos-modal-body');
    },

    async favoritar(idPlano, favorito) {
        try {
            await api.get('favoritarPlano', { idPlano, favorito });
            api.invalidarCache('buscarPlanos');
            await this.carregar();
        } catch (error) {
            Toast.error('Não foi possível atualizar o favorito.');
        }
    },

    async duplicar(idPlano) {
        const plano = this.lista.find(p => p.id_plano === idPlano);
        if (!plano) return;
        if (!confirm('Duplicar este plano? Ele será criado como um novo rascunho.')) return;
        try {
            UI.showLoading();
            await api.post('duplicarPlano', { idPlano, novaTurma: plano.id_turma, novaData: plano.data_aula });
            api.invalidarCache('buscarPlanos');
            Toast.success('Plano duplicado com sucesso!');
            await this.carregar();
        } catch (error) {
            Toast.error('Não foi possível duplicar o plano.');
        } finally {
            UI.hideLoading();
        }
    },

    async excluir(idPlano) {
        if (!UI.confirmarExclusao()) return;
        try {
            UI.showLoading();
            await api.get('excluirPlano', { idPlano });
            api.invalidarCache('buscarPlanos');
            Toast.success('Plano excluído.');
            await this.carregar();
        } catch (error) {
            Toast.error('Não foi possível excluir o plano.');
        } finally {
            UI.hideLoading();
        }
    }
};

/**
 * Atalho global usado pelo botão "Novo Plano" na topbar (index.html)
 */
function abrirNovoPlano() {
    app.navegarPara('novo-plano');
}
