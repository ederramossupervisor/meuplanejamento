/**
 * FORMULÁRIO DE PLANO DE AULA (criação e edição)
 */

const FormularioPlano = {
    idPlano: null,
    dataCriacao: null,
    turmas: [],
    componentes: [],

    // Estado das listas dinâmicas
    habilidades: [],       // [{codigo, descricao}]
    competencias: [],      // ['texto']
    objetivos: [],         // [{descricao}]
    desenvolvimento: [],   // [{titulo, tempo, metodologia, descricao}]
    recursos: [],          // ['texto']
    referencias: [],       // ['texto']

    async render(_ignorado, parametros = null) {
        this.idPlano = parametros?.idPlano || null;

        const content = document.getElementById('conteudo');
        content.innerHTML = '<div class="text-center py-5"><div class="loading-spinner"></div></div>';

        // Zerar estado
        this.habilidades = [];
        this.competencias = [];
        this.objetivos = [];
        this.desenvolvimento = [];
        this.recursos = [];
        this.referencias = [];
        this.dataCriacao = null;

        const [turmasResp, componentesResp] = await Promise.all([
            api.get('listarTurmas', {}, { cache: true, ttl: 300000 }).catch(() => ({ data: [] })),
            api.get('listarComponentes', {}, { cache: true, ttl: 300000 }).catch(() => ({ data: [] }))
        ]);
        this.turmas = turmasResp.data || [];
        this.componentes = componentesResp.data || [];

        let plano = null;
        if (this.idPlano) {
            try {
                const response = await api.get('getPlano', { idPlano: this.idPlano });
                plano = response.data;
                this.carregarPlanoNoEstado(plano);
            } catch (error) {
                Toast.error('Não foi possível carregar o plano.');
            }
        }

        content.innerHTML = this.montarHtml(plano);
        this.renderHabilidades();
        this.renderCompetencias();
        this.renderObjetivos();
        this.renderDesenvolvimento();
        this.renderRecursos();
        this.renderReferencias();
        if (this.idPlano) {
            DriveAnexos.render(this.idPlano, 'fp-anexos');
        }
    },

    parseJSON(valor, padrao) {
        try {
            if (!valor) return padrao;
            if (Array.isArray(valor)) return valor;
            return JSON.parse(valor);
        } catch (e) {
            return padrao;
        }
    },

    carregarPlanoNoEstado(plano) {
        this.habilidades = this.parseJSON(plano.habilidades, []);
        this.competencias = this.parseJSON(plano.competencias, []);
        this.objetivos = (plano.objetivos || []).map(o => ({ descricao: o.descricao }));
        this.desenvolvimento = (plano.desenvolvimento || []).map(e => ({
            titulo: e.titulo, tempo: e.tempo, metodologia: e.metodologia, descricao: e.descricao
        }));
        this.recursos = this.parseJSON(plano.recursos, []);
        this.referencias = this.parseJSON(plano.referencias, []);
        this.dataCriacao = plano.data_criacao || null;
    },

    montarHtml(plano) {
        return `
        <div class="form-section">
            <div class="form-section-title"><i class="fas fa-info-circle"></i> Dados gerais</div>
            <div class="row g-3">
                <div class="col-md-4">
                    <label class="form-label">Turma *</label>
                    <select class="form-select" id="fp-turma">
                        <option value="">Selecione...</option>
                        ${this.turmas.map(t => `<option value="${t.id_turma}" ${plano?.id_turma === t.id_turma ? 'selected' : ''}>${UI.escaparHTML(t.nome_turma)}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Componente curricular *</label>
                    <input list="fp-componentes-lista" class="form-control" id="fp-componente" value="${UI.escaparHTML(plano?.componente || '')}">
                    <datalist id="fp-componentes-lista">
                        ${this.componentes.map(c => `<option value="${UI.escaparHTML(c.componente)}">`).join('')}
                    </datalist>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Status</label>
                    <select class="form-select" id="fp-status">
                        ${CONFIG.STATUS_PLANO.map(s => `<option ${plano?.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Data da aula</label>
                    <input type="date" class="form-control" id="fp-data" value="${plano?.data_aula ? String(plano.data_aula).substring(0,10) : ''}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Quantidade de aulas</label>
                    <input type="number" min="1" class="form-control" id="fp-quantidade" value="${plano?.quantidade_aulas || 1}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Duração (min)</label>
                    <input type="number" min="1" class="form-control" id="fp-duracao" value="${plano?.duracao || 50}">
                </div>
            </div>
        </div>

        <div class="form-section">
            <div class="form-section-title"><i class="fas fa-bookmark"></i> Assunto e tema</div>
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label">Assunto *</label>
                    <input type="text" class="form-control" id="fp-assunto" value="${UI.escaparHTML(plano?.assunto || '')}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Tema</label>
                    <input type="text" class="form-control" id="fp-tema" value="${UI.escaparHTML(plano?.tema || '')}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Unidade temática</label>
                    <input type="text" class="form-control" id="fp-unidade" value="${UI.escaparHTML(plano?.unidade_tematica || '')}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Objeto de conhecimento</label>
                    <input type="text" class="form-control" id="fp-objeto" value="${UI.escaparHTML(plano?.objeto_conhecimento || '')}">
                </div>
            </div>
        </div>

        <div class="form-section">
            <div class="form-section-title"><i class="fas fa-star"></i> Habilidades (BNCC)</div>
            <div id="fp-habilidades-lista"></div>
            <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="FormularioPlano.adicionarHabilidade()">
                <i class="fas fa-plus"></i> Adicionar habilidade
            </button>
        </div>

        <div class="form-section">
            <div class="form-section-title"><i class="fas fa-check-double"></i> Competências</div>
            <div id="fp-competencias-lista"></div>
            <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="FormularioPlano.adicionarItemSimples('competencias')">
                <i class="fas fa-plus"></i> Adicionar competência
            </button>
        </div>

        <div class="form-section">
            <div class="form-section-title"><i class="fas fa-bullseye"></i> Objetivos de aprendizagem</div>
            <label class="form-label">Objetivo geral</label>
            <textarea class="form-control mb-3" id="fp-objetivo-geral" rows="2">${UI.escaparHTML(plano?.objetivo_geral || '')}</textarea>
            <label class="form-label">Objetivos específicos</label>
            <div id="fp-objetivos-lista"></div>
            <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="FormularioPlano.adicionarObjetivo()">
                <i class="fas fa-plus"></i> Adicionar objetivo
            </button>
        </div>

        <div class="form-section">
            <div class="form-section-title"><i class="fas fa-tasks"></i> Desenvolvimento da aula</div>
            <div id="fp-desenvolvimento-lista"></div>
            <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="FormularioPlano.adicionarEtapa()">
                <i class="fas fa-plus"></i> Adicionar etapa
            </button>
        </div>

        <div class="form-section">
            <div class="form-section-title"><i class="fas fa-clipboard-check"></i> Avaliação</div>
            <label class="form-label">Estratégias de avaliação</label>
            <div class="row">
                ${CONFIG.ESTRATEGIAS_AVALIACAO.map(estr => `
                    <div class="col-md-4">
                        <div class="form-check">
                            <input class="form-check-input fp-estrategia-avaliacao" type="checkbox" value="${estr}" id="ea-${estr.replace(/\s+/g,'')}"
                                ${this.parseJSON(plano?.estrategias_avaliacao, []).includes(estr) ? 'checked' : ''}>
                            <label class="form-check-label" for="ea-${estr.replace(/\s+/g,'')}">${estr}</label>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="form-section">
            <div class="form-section-title"><i class="fas fa-toolbox"></i> Recursos</div>
            <div class="mb-2">
                ${CONFIG.RECURSOS.map(r => `
                    <button type="button" class="btn btn-sm btn-outline-secondary me-1 mb-1" onclick="FormularioPlano.adicionarRecursoRapido('${r.replace(/'/g, "\\'")}')">
                        + ${r}
                    </button>
                `).join('')}
            </div>
            <div id="fp-recursos-lista"></div>
            <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="FormularioPlano.adicionarItemSimples('recursos')">
                <i class="fas fa-plus"></i> Adicionar outro recurso
            </button>
        </div>

        <div class="form-section">
            <div class="form-section-title"><i class="fas fa-book-open"></i> Referências bibliográficas</div>
            <div id="fp-referencias-lista"></div>
            <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="FormularioPlano.adicionarItemSimples('referencias')">
                <i class="fas fa-plus"></i> Adicionar referência
            </button>
        </div>

        <div class="form-section">
            <div class="form-section-title"><i class="fas fa-universal-access"></i> Inclusão e outros aspectos</div>
            <div class="row g-3">
                <div class="col-12">
                    <label class="form-label">Inclusão e acessibilidade</label>
                    <textarea class="form-control" id="fp-inclusao" rows="2">${UI.escaparHTML(plano?.inclusao || '')}</textarea>
                </div>
                <div class="col-12">
                    <label class="form-label">Interdisciplinaridade</label>
                    <textarea class="form-control" id="fp-interdisciplinaridade" rows="2">${UI.escaparHTML(plano?.interdisciplinaridade || '')}</textarea>
                </div>
                <div class="col-12">
                    <label class="form-label">Conhecimentos prévios</label>
                    <textarea class="form-control" id="fp-conhecimentos-previos" rows="2">${UI.escaparHTML(plano?.conhecimentos_previos || '')}</textarea>
                </div>
                <div class="col-12">
                    <label class="form-label">Tarefa de casa</label>
                    <textarea class="form-control" id="fp-tarefa-casa" rows="2">${UI.escaparHTML(plano?.tarefa_casa || '')}</textarea>
                </div>
                <div class="col-12">
                    <label class="form-label">Observações</label>
                    <textarea class="form-control" id="fp-observacoes" rows="2">${UI.escaparHTML(plano?.observacoes || '')}</textarea>
                </div>
            </div>
        </div>

        ${this.idPlano ? `
        <div class="form-section">
            <div class="form-section-title"><i class="fas fa-paperclip"></i> Anexos</div>
            <div id="fp-anexos"></div>
        </div>` : ''}

        <div class="d-flex justify-content-end gap-2 mb-5">
            <button class="btn btn-secondary" onclick="app.navegarPara('planos')">Cancelar</button>
            <button class="btn btn-primary" onclick="FormularioPlano.salvar()">
                <i class="fas fa-save"></i> Salvar plano
            </button>
        </div>
        `;
    },

    // ---------- Habilidades ----------
    renderHabilidades() {
        const el = document.getElementById('fp-habilidades-lista');
        el.innerHTML = this.habilidades.map((h, i) => `
            <div class="etapa-item">
                <button type="button" class="btn-remove" onclick="FormularioPlano.removerHabilidade(${i})">&times;</button>
                <div class="row g-2">
                    <div class="col-md-3">
                        <input type="text" class="form-control" placeholder="Código (ex: EF67LP08)" value="${UI.escaparHTML(h.codigo || '')}" onchange="FormularioPlano.habilidades[${i}].codigo = this.value">
                    </div>
                    <div class="col-md-9">
                        <input type="text" class="form-control" placeholder="Descrição da habilidade" value="${UI.escaparHTML(h.descricao || '')}" onchange="FormularioPlano.habilidades[${i}].descricao = this.value">
                    </div>
                </div>
            </div>
        `).join('') || '<p class="text-muted">Nenhuma habilidade adicionada.</p>';
    },
    adicionarHabilidade() {
        this.habilidades.push({ codigo: '', descricao: '' });
        this.renderHabilidades();
    },
    removerHabilidade(i) {
        this.habilidades.splice(i, 1);
        this.renderHabilidades();
    },

    // ---------- Listas simples de texto (competências / recursos / referências) ----------
    renderListaSimples(chave, elId, placeholder) {
        const el = document.getElementById(elId);
        el.innerHTML = this[chave].map((valor, i) => `
            <div class="input-group mb-2">
                <input type="text" class="form-control" placeholder="${placeholder}" value="${UI.escaparHTML(valor)}" onchange="FormularioPlano.${chave}[${i}] = this.value">
                <button type="button" class="btn btn-outline-danger" onclick="FormularioPlano.removerItemSimples('${chave}', ${i})"><i class="fas fa-times"></i></button>
            </div>
        `).join('') || '<p class="text-muted">Nenhum item adicionado.</p>';
    },
    renderCompetencias() { this.renderListaSimples('competencias', 'fp-competencias-lista', 'Descreva a competência'); },
    renderRecursos() { this.renderListaSimples('recursos', 'fp-recursos-lista', 'Descreva o recurso'); },
    renderReferencias() { this.renderListaSimples('referencias', 'fp-referencias-lista', 'Ex: Autor, Título, Ano'); },

    adicionarItemSimples(chave) {
        this[chave].push('');
        this['render' + chave.charAt(0).toUpperCase() + chave.slice(1)]();
    },
    removerItemSimples(chave, i) {
        this[chave].splice(i, 1);
        this['render' + chave.charAt(0).toUpperCase() + chave.slice(1)]();
    },
    adicionarRecursoRapido(nome) {
        if (!this.recursos.includes(nome)) {
            this.recursos.push(nome);
            this.renderRecursos();
        }
    },

    // ---------- Objetivos específicos ----------
    renderObjetivos() {
        const el = document.getElementById('fp-objetivos-lista');
        el.innerHTML = this.objetivos.map((o, i) => `
            <div class="input-group mb-2">
                <input type="text" class="form-control" placeholder="Objetivo específico" value="${UI.escaparHTML(o.descricao || '')}" onchange="FormularioPlano.objetivos[${i}].descricao = this.value">
                <button type="button" class="btn btn-outline-danger" onclick="FormularioPlano.removerObjetivo(${i})"><i class="fas fa-times"></i></button>
            </div>
        `).join('') || '<p class="text-muted">Nenhum objetivo específico adicionado.</p>';
    },
    adicionarObjetivo() {
        this.objetivos.push({ descricao: '' });
        this.renderObjetivos();
    },
    removerObjetivo(i) {
        this.objetivos.splice(i, 1);
        this.renderObjetivos();
    },

    // ---------- Desenvolvimento (etapas da aula) ----------
    renderDesenvolvimento() {
        const el = document.getElementById('fp-desenvolvimento-lista');
        el.innerHTML = this.desenvolvimento.map((e, i) => `
            <div class="etapa-item">
                <button type="button" class="btn-remove" onclick="FormularioPlano.removerEtapa(${i})">&times;</button>
                <div class="row g-2">
                    <div class="col-md-6">
                        <input type="text" class="form-control" placeholder="Título da etapa" value="${UI.escaparHTML(e.titulo || '')}" onchange="FormularioPlano.desenvolvimento[${i}].titulo = this.value">
                    </div>
                    <div class="col-md-3">
                        <input type="text" class="form-control" placeholder="Tempo (ex: 10 min)" value="${UI.escaparHTML(e.tempo || '')}" onchange="FormularioPlano.desenvolvimento[${i}].tempo = this.value">
                    </div>
                    <div class="col-md-3">
                        <input type="text" class="form-control" placeholder="Metodologia" value="${UI.escaparHTML(e.metodologia || '')}" onchange="FormularioPlano.desenvolvimento[${i}].metodologia = this.value">
                    </div>
                    <div class="col-12">
                        <textarea class="form-control mt-2" rows="2" placeholder="Descrição da etapa" onchange="FormularioPlano.desenvolvimento[${i}].descricao = this.value">${UI.escaparHTML(e.descricao || '')}</textarea>
                    </div>
                </div>
            </div>
        `).join('') || '<p class="text-muted">Nenhuma etapa adicionada.</p>';
    },
    adicionarEtapa() {
        this.desenvolvimento.push({ titulo: '', tempo: '', metodologia: '', descricao: '' });
        this.renderDesenvolvimento();
    },
    removerEtapa(i) {
        this.desenvolvimento.splice(i, 1);
        this.renderDesenvolvimento();
    },

    // ---------- Salvar ----------
    coletarDados() {
        const estrategiasAvaliacao = Array.from(document.querySelectorAll('.fp-estrategia-avaliacao:checked')).map(el => el.value);

        return {
            idPlano: this.idPlano || undefined,
            idTurma: document.getElementById('fp-turma').value,
            componente: document.getElementById('fp-componente').value.trim(),
            status: document.getElementById('fp-status').value,
            dataAula: document.getElementById('fp-data').value,
            quantidadeAulas: Number(document.getElementById('fp-quantidade').value) || 1,
            duracao: Number(document.getElementById('fp-duracao').value) || 50,
            assunto: document.getElementById('fp-assunto').value.trim(),
            tema: document.getElementById('fp-tema').value.trim(),
            unidadeTematica: document.getElementById('fp-unidade').value.trim(),
            objetoConhecimento: document.getElementById('fp-objeto').value.trim(),
            habilidades: this.habilidades.filter(h => h.descricao?.trim()),
            competencias: this.competencias.filter(c => c?.trim()),
            objetivoGeral: document.getElementById('fp-objetivo-geral').value.trim(),
            objetivos: this.objetivos.filter(o => o.descricao?.trim()),
            desenvolvimento: this.desenvolvimento.filter(e => e.titulo?.trim() || e.descricao?.trim()),
            estrategiasAvaliacao,
            recursos: this.recursos.filter(r => r?.trim()),
            referencias: this.referencias.filter(r => r?.trim()),
            inclusao: document.getElementById('fp-inclusao').value.trim(),
            interdisciplinaridade: document.getElementById('fp-interdisciplinaridade').value.trim(),
            conhecimentosPrevios: document.getElementById('fp-conhecimentos-previos').value.trim(),
            tarefaCasa: document.getElementById('fp-tarefa-casa').value.trim(),
            observacoes: document.getElementById('fp-observacoes').value.trim(),
            dataCriacao: this.dataCriacao || undefined
        };
    },

    async salvar() {
        const dados = this.coletarDados();

        if (!dados.idTurma || !dados.componente || !dados.assunto) {
            Toast.warning('Preencha turma, componente e assunto antes de salvar.');
            return;
        }

        try {
            UI.showLoading();
            if (this.idPlano) {
                await api.post('atualizarPlano', dados);
                Toast.success('Plano atualizado com sucesso!');
            } else {
                await api.post('salvarPlano', dados);
                Toast.success('Plano criado com sucesso!');
            }
            api.invalidarCache('buscarPlanos');
            app.navegarPara('planos');
        } catch (error) {
            Toast.error('Não foi possível salvar o plano.');
        } finally {
            UI.hideLoading();
        }
    }
};
