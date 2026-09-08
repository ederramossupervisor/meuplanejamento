/**
 * GESTÃO DE TURMAS
 */

const Turmas = {
    lista: [],
    edicaoId: null,

    async render() {
        const content = document.getElementById('conteudo');
        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0">Minhas Turmas</h4>
                <button class="btn btn-primary" onclick="Turmas.abrirFormulario()">
                    <i class="fas fa-plus"></i> Nova Turma
                </button>
            </div>
            <div id="turmas-lista" class="row"></div>
        `;
        await this.carregar();
    },

    async carregar() {
        const container = document.getElementById('turmas-lista');
        container.innerHTML = '<div class="text-center py-4 w-100"><div class="loading-spinner"></div></div>';
        try {
            const response = await api.get('listarTurmas');
            this.lista = response.data || [];
            this.renderLista();
        } catch (error) {
            container.innerHTML = '<p class="text-muted">Não foi possível carregar as turmas.</p>';
        }
    },

    renderLista() {
        const container = document.getElementById('turmas-lista');

        if (this.lista.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="fas fa-school" style="font-size:3rem;"></i>
                    <p class="mt-3">Nenhuma turma cadastrada ainda.</p>
                </div>`;
            return;
        }

        container.innerHTML = this.lista.map(turma => `
            <div class="col-md-4 mb-3">
                <div class="card card-plano h-100">
                    <div class="card-header">
                        <div class="turma">${UI.escaparHTML(turma.etapa || '')} ${turma.anoletivo ? '· ' + turma.anoletivo : ''}</div>
                        <div class="assunto">${UI.escaparHTML(turma.nome_turma || '')}</div>
                    </div>
                    <div class="card-body">
                        <p class="mb-1"><strong>Ano/Série:</strong> ${UI.escaparHTML(turma.ano_serie || '-')}</p>
                        <p class="mb-1"><strong>Modalidade:</strong> ${UI.escaparHTML(turma.modalidade || '-')}</p>
                        <p class="mb-0"><strong>Turno:</strong> ${UI.escaparHTML(turma.turno || '-')}</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn-action btn-outline-secondary" onclick="Turmas.abrirFormulario('${turma.id_turma}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-action btn-outline-danger" onclick="Turmas.excluir('${turma.id_turma}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    abrirFormulario(idTurma = null) {
        this.edicaoId = idTurma;
        const turma = idTurma ? this.lista.find(t => t.id_turma === idTurma) : null;

        const modalHtml = `
        <div class="modal fade" id="modal-turma" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${turma ? 'Editar Turma' : 'Nova Turma'}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Nome da turma</label>
                            <input type="text" class="form-control" id="turma-nome" value="${UI.escaparHTML(turma?.nome_turma || '')}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Etapa</label>
                            <input type="text" class="form-control" id="turma-etapa" placeholder="Ex: Ensino Fundamental" value="${UI.escaparHTML(turma?.etapa || '')}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Ano/Série</label>
                            <input type="text" class="form-control" id="turma-ano-serie" value="${UI.escaparHTML(turma?.ano_serie || '')}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Modalidade</label>
                            <input type="text" class="form-control" id="turma-modalidade" value="${UI.escaparHTML(turma?.modalidade || '')}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Turno</label>
                            <select class="form-select" id="turma-turno">
                                ${['Matutino', 'Vespertino', 'Noturno', 'Integral'].map(t =>
                                    `<option ${turma?.turno === t ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Ano letivo</label>
                            <input type="number" class="form-control" id="turma-ano-letivo" value="${turma?.ano_letivo || CONFIG.ANO_LETIVO}">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button class="btn btn-primary" onclick="Turmas.salvar()">Salvar</button>
                    </div>
                </div>
            </div>
        </div>`;

        document.getElementById('modal-turma-container')?.remove();
        const wrapper = document.createElement('div');
        wrapper.id = 'modal-turma-container';
        wrapper.innerHTML = modalHtml;
        document.body.appendChild(wrapper);

        const modal = new bootstrap.Modal(document.getElementById('modal-turma'));
        modal.show();
    },

    async salvar() {
        const dados = {
            idTurma: this.edicaoId || undefined,
            nomeTurma: document.getElementById('turma-nome').value.trim(),
            etapa: document.getElementById('turma-etapa').value.trim(),
            anoSerie: document.getElementById('turma-ano-serie').value.trim(),
            modalidade: document.getElementById('turma-modalidade').value.trim(),
            turno: document.getElementById('turma-turno').value,
            anoLetivo: document.getElementById('turma-ano-letivo').value
        };

        if (!dados.nomeTurma) {
            Toast.warning('Informe o nome da turma.');
            return;
        }

        try {
            UI.showLoading();
            await api.post('salvarTurma', dados);
            bootstrap.Modal.getInstance(document.getElementById('modal-turma')).hide();
            Toast.success('Turma salva com sucesso!');
            await this.carregar();
        } catch (error) {
            Toast.error('Não foi possível salvar a turma.');
        } finally {
            UI.hideLoading();
        }
    },

    async excluir(idTurma) {
        if (!UI.confirmarExclusao('Excluir esta turma? Os planos vinculados a ela não serão apagados.')) return;
        try {
            UI.showLoading();
            await api.get('excluirTurma', { idTurma });
            Toast.success('Turma excluída.');
            await this.carregar();
        } catch (error) {
            Toast.error('Não foi possível excluir a turma.');
        } finally {
            UI.hideLoading();
        }
    }
};
