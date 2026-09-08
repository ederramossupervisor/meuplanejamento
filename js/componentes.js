/**
 * GESTÃO DE COMPONENTES CURRICULARES
 */

const Componentes = {
    lista: [],
    edicaoId: null,

    async render() {
        const content = document.getElementById('conteudo');
        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0">Componentes Curriculares</h4>
                <button class="btn btn-primary" onclick="Componentes.abrirFormulario()">
                    <i class="fas fa-plus"></i> Novo Componente
                </button>
            </div>
            <div class="card">
                <div class="table-responsive">
                    <table class="table mb-0">
                        <thead>
                            <tr>
                                <th>Componente</th>
                                <th>Área</th>
                                <th>Etapa</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="componentes-tbody"></tbody>
                    </table>
                </div>
            </div>
        `;
        await this.carregar();
    },

    async carregar() {
        const tbody = document.getElementById('componentes-tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="loading-spinner"></div></td></tr>';
        try {
            const response = await api.get('listarComponentes');
            this.lista = response.data || [];
            this.renderLista();
        } catch (error) {
            if (document.getElementById('componentes-tbody')) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Não foi possível carregar os componentes.</td></tr>';
            }
        }
    },

    renderLista() {
        const tbody = document.getElementById('componentes-tbody');
        if (!tbody) return;

        if (this.lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nenhum componente cadastrado ainda.</td></tr>';
            return;
        }

        tbody.innerHTML = this.lista.map(c => `
            <tr>
                <td>${UI.escaparHTML(c.componente || '')}</td>
                <td>${UI.escaparHTML(c.area || '-')}</td>
                <td>${UI.escaparHTML(c.etapa || '-')}</td>
                <td><span class="badge ${c.status === 'ATIVO' ? 'bg-success' : 'bg-secondary'}">${UI.escaparHTML(c.status || 'ATIVO')}</span></td>
                <td class="text-end">
                    <button class="btn-action btn-outline-secondary" onclick="Componentes.abrirFormulario('${c.id_componente}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-outline-danger" onclick="Componentes.excluir('${c.id_componente}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    abrirFormulario(idComponente = null) {
        this.edicaoId = idComponente;
        const c = idComponente ? this.lista.find(x => x.id_componente === idComponente) : null;

        const modalHtml = `
        <div class="modal fade" id="modal-componente" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${c ? 'Editar Componente' : 'Novo Componente'}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Componente curricular</label>
                            <input type="text" class="form-control" id="comp-nome" placeholder="Ex: Língua Portuguesa" value="${UI.escaparHTML(c?.componente || '')}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Área de conhecimento</label>
                            <input type="text" class="form-control" id="comp-area" placeholder="Ex: Linguagens" value="${UI.escaparHTML(c?.area || '')}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Etapa</label>
                            <input type="text" class="form-control" id="comp-etapa" placeholder="Ex: Ensino Fundamental" value="${UI.escaparHTML(c?.etapa || '')}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="comp-status">
                                <option value="ATIVO" ${c?.status !== 'INATIVO' ? 'selected' : ''}>Ativo</option>
                                <option value="INATIVO" ${c?.status === 'INATIVO' ? 'selected' : ''}>Inativo</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button class="btn btn-primary" onclick="Componentes.salvar()">Salvar</button>
                    </div>
                </div>
            </div>
        </div>`;

        document.getElementById('modal-componente-container')?.remove();
        const wrapper = document.createElement('div');
        wrapper.id = 'modal-componente-container';
        wrapper.innerHTML = modalHtml;
        document.body.appendChild(wrapper);

        const modal = new bootstrap.Modal(document.getElementById('modal-componente'));
        modal.show();
    },

    async salvar() {
        const dados = {
            idComponente: this.edicaoId || undefined,
            componente: document.getElementById('comp-nome').value.trim(),
            area: document.getElementById('comp-area').value.trim(),
            etapa: document.getElementById('comp-etapa').value.trim(),
            status: document.getElementById('comp-status').value
        };

        if (!dados.componente) {
            Toast.warning('Informe o nome do componente.');
            return;
        }

        try {
            UI.showLoading();
            await api.post('salvarComponente', dados);
            api.invalidarCache('listarComponentes');
            bootstrap.Modal.getInstance(document.getElementById('modal-componente')).hide();
            Toast.success('Componente salvo com sucesso!');
            await this.carregar();
        } catch (error) {
            Toast.error('Não foi possível salvar o componente.');
        } finally {
            UI.hideLoading();
        }
    },

    async excluir(idComponente) {
        if (!UI.confirmarExclusao('Excluir este componente curricular?')) return;
        try {
            UI.showLoading();
            await api.get('excluirComponente', { idComponente });
            api.invalidarCache('listarComponentes');
            Toast.success('Componente excluído.');
            await this.carregar();
        } catch (error) {
            Toast.error('Não foi possível excluir o componente.');
        } finally {
            UI.hideLoading();
        }
    }
};
