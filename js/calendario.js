/**
 * CALENDÁRIO DE AULAS (visão mensal e semanal)
 */

const Calendario = {
    modo: 'mes', // 'mes' | 'semana'
    mesAtual: new Date().getMonth(),
    anoAtual: new Date().getFullYear(),
    dataReferencia: new Date(), // usada na visão semanal

    planosPorDia: {},
    anosCarregados: new Set(),
    turmasMap: {},

    async carregarTurmas() {
        try {
            const response = await api.get('listarTurmas', {}, { cache: true, ttl: 300000 });
            this.turmasMap = {};
            (response.data || []).forEach(t => { this.turmasMap[t.id_turma] = t.nome_turma; });
        } catch (error) {
            this.turmasMap = {};
        }
    },

    /**
     * Mesma cor estável usada nos cards de "Meus Planos" (Planos.corDaTurma),
     * para que a turma apareça sempre com a mesma cor em todas as telas.
     */
    corTurma(idTurma) {
        return Planos.corDaTurma(idTurma);
    },

    async render() {
        const content = document.getElementById('conteudo');
        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <button class="btn btn-outline-secondary" onclick="Calendario.mudarPeriodo(-1)"><i class="fas fa-chevron-left"></i></button>
                <h4 class="mb-0" id="calendario-titulo"></h4>
                <button class="btn btn-outline-secondary" onclick="Calendario.mudarPeriodo(1)"><i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="d-flex justify-content-center mb-3">
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-outline-primary" id="btn-modo-mes" onclick="Calendario.mudarModo('mes')">
                        <i class="fas fa-calendar-alt"></i> Mês
                    </button>
                    <button type="button" class="btn btn-outline-primary" id="btn-modo-semana" onclick="Calendario.mudarModo('semana')">
                        <i class="fas fa-calendar-week"></i> Semana
                    </button>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <div id="calendario-grid"></div>
                </div>
            </div>
        `;
        await this.carregarTurmas();
        await this.garantirAnoCarregado(this.anoAtual);
        this.atualizarBotoesModo();
        this.renderConteudo();
    },

    atualizarBotoesModo() {
        const btnMes = document.getElementById('btn-modo-mes');
        const btnSemana = document.getElementById('btn-modo-semana');
        if (!btnMes || !btnSemana) return;
        btnMes.classList.toggle('active', this.modo === 'mes');
        btnSemana.classList.toggle('active', this.modo === 'semana');
    },

    async mudarModo(modo) {
        if (this.modo === modo) return;
        this.modo = modo;
        this.atualizarBotoesModo();
        await this.garantirPeriodoCarregado();
        this.renderConteudo();
    },

    /**
     * Garante que os planos do(s) ano(s) relevantes para o período visível
     * (mês ou semana) já estão carregados, buscando o que faltar.
     */
    async garantirPeriodoCarregado() {
        if (this.modo === 'mes') {
            await this.garantirAnoCarregado(this.anoAtual);
        } else {
            const dias = this.getDiasDaSemana(this.dataReferencia);
            const anos = new Set(dias.map(d => d.getFullYear()));
            for (const ano of anos) {
                await this.garantirAnoCarregado(ano);
            }
        }
    },

    async garantirAnoCarregado(ano) {
        if (this.anosCarregados.has(ano)) return;
        try {
            const response = await api.get('buscarPlanos', { anoLetivo: String(ano) }, { cache: true, ttl: 60000 });
            const planos = response.data || [];
            planos.forEach(p => {
                if (!p.data_aula) return;
                const chave = String(p.data_aula).substring(0, 10);
                if (!this.planosPorDia[chave]) this.planosPorDia[chave] = [];
                this.planosPorDia[chave].push(p);
            });
            this.anosCarregados.add(ano);
        } catch (error) {
            // segue sem travar a tela — os dias desse ano só aparecerão sem planos
        }
    },

    async mudarPeriodo(delta) {
        if (this.modo === 'mes') {
            this.mesAtual += delta;
            if (this.mesAtual > 11) { this.mesAtual = 0; this.anoAtual++; }
            if (this.mesAtual < 0) { this.mesAtual = 11; this.anoAtual--; }
        } else {
            const nova = new Date(this.dataReferencia);
            nova.setDate(nova.getDate() + (delta * 7));
            this.dataReferencia = nova;
        }
        await this.garantirPeriodoCarregado();
        this.renderConteudo();
    },

    renderConteudo() {
        if (this.modo === 'mes') {
            this.renderGrid();
        } else {
            this.renderSemana();
        }
    },

    chaveData(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    getDiasDaSemana(dataReferencia) {
        const dias = [];
        const inicio = new Date(dataReferencia);
        inicio.setDate(inicio.getDate() - inicio.getDay()); // volta até domingo
        for (let i = 0; i < 7; i++) {
            const d = new Date(inicio);
            d.setDate(inicio.getDate() + i);
            dias.push(d);
        }
        return dias;
    },

    // ---------- Visão mensal ----------
    renderGrid() {
        const tituloEl = document.getElementById('calendario-titulo');
        if (!tituloEl) return;
        const nomesMeses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        tituloEl.textContent = `${nomesMeses[this.mesAtual]} de ${this.anoAtual}`;

        const primeiroDia = new Date(this.anoAtual, this.mesAtual, 1);
        const diasNoMes = new Date(this.anoAtual, this.mesAtual + 1, 0).getDate();
        const diaSemanaInicio = primeiroDia.getDay();

        let celulas = '';
        for (let i = 0; i < diaSemanaInicio; i++) celulas += '<div class="cal-dia cal-dia-vazio"></div>';

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const chave = `${this.anoAtual}-${String(this.mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const planosDoDia = this.planosPorDia[chave] || [];
            const hoje = new Date();
            const ehHoje = hoje.getFullYear() === this.anoAtual && hoje.getMonth() === this.mesAtual && hoje.getDate() === dia;

            const turmasDoDia = [...new Set(planosDoDia.map(p => p.id_turma))];
            const dots = turmasDoDia.slice(0, 4).map(idTurma =>
                `<span class="cal-turma-dot" style="background:${this.corTurma(idTurma)};" title="${UI.escaparHTML(this.turmasMap[idTurma] || '')}"></span>`
            ).join('');

            celulas += `
                <div class="cal-dia ${ehHoje ? 'cal-dia-hoje' : ''} ${planosDoDia.length ? 'cal-dia-com-plano' : ''}" onclick="Calendario.abrirDia('${chave}')">
                    <span class="cal-dia-numero">${dia}</span>
                    ${planosDoDia.length ? `<span class="badge bg-primary cal-dia-badge">${planosDoDia.length}</span>` : ''}
                    ${dots ? `<div class="cal-turma-dots">${dots}</div>` : ''}
                </div>`;
        }

        document.getElementById('calendario-grid').innerHTML = `
            <div class="cal-cabecalho">
                ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => `<div>${d}</div>`).join('')}
            </div>
            <div class="cal-grid">${celulas}</div>
        `;
    },

    // ---------- Visão semanal ----------
    renderSemana() {
        const tituloEl = document.getElementById('calendario-titulo');
        if (!tituloEl) return;

        const dias = this.getDiasDaSemana(this.dataReferencia);
        const primeiro = dias[0];
        const ultimo = dias[6];
        const opcoes = { day: '2-digit', month: '2-digit' };
        tituloEl.textContent = `${primeiro.toLocaleDateString('pt-BR', opcoes)} a ${ultimo.toLocaleDateString('pt-BR', opcoes)} de ${ultimo.getFullYear()}`;

        const nomesDias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
        const hoje = new Date();

        const colunas = dias.map((data, i) => {
            const chave = this.chaveData(data);
            const planosDoDia = this.planosPorDia[chave] || [];
            const ehHoje = data.toDateString() === hoje.toDateString();

            return `
                <div class="col">
                    <div class="card h-100 ${ehHoje ? 'border-primary' : ''}">
                        <div class="card-header bg-white text-center">
                            <div class="small text-muted">${nomesDias[i]}</div>
                            <div class="fw-bold ${ehHoje ? 'text-primary' : ''}">${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                        </div>
                        <div class="card-body p-2">
                            ${planosDoDia.length === 0
                                ? '<p class="text-muted small mb-0">Sem planos</p>'
                                : planosDoDia.map(p => `
                                    <div class="border rounded p-2 mb-2 small cal-plano-item" style="cursor:pointer; border-left: 4px solid ${this.corTurma(p.id_turma)} !important;" onclick="Visualizacao.abrir('${p.id_plano}')">
                                        <strong>${UI.escaparHTML(p.componente || '')}</strong><br>
                                        ${UI.escaparHTML(p.assunto || '')}
                                    </div>
                                `).join('')
                            }
                        </div>
                        <div class="card-footer bg-white text-center p-1">
                            <button class="btn btn-sm btn-link" onclick="Calendario.abrirDia('${chave}')">
                                <i class="fas fa-plus"></i> Novo
                            </button>
                        </div>
                    </div>
                </div>`;
        }).join('');

        document.getElementById('calendario-grid').innerHTML = `
            <div class="row row-cols-1 row-cols-md-4 row-cols-lg-7 g-2">${colunas}</div>
        `;
    },

    /**
     * Ao clicar em um dia do calendário, abre um modal listando os planos
     * daquele dia para o professor selecionar (visualizar/editar) um deles.
     */
    abrirDia(chave) {
        const planosDoDia = this.planosPorDia[chave] || [];
        const titulo = document.getElementById('dia-planos-modal-titulo');
        const body = document.getElementById('dia-planos-modal-body');

        titulo.innerHTML = `<i class="fas fa-calendar-day"></i> Planos de ${UI.formatarData(chave)}`;

        if (planosDoDia.length === 0) {
            body.innerHTML = `
                <div class="text-center text-muted py-3">
                    Nenhum plano cadastrado para este dia.
                </div>`;
        } else {
            body.innerHTML = `
                <div class="list-group">
                    ${planosDoDia.map(p => `
                        <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                onclick="Calendario.selecionarPlanoDoDia('${p.id_plano}')" style="border-left: 4px solid ${this.corTurma(p.id_turma)};">
                            <div>
                                <span class="turma-dot" style="background:${this.corTurma(p.id_turma)};"></span>
                                <strong>${UI.escaparHTML(p.componente || '')}</strong> — ${UI.escaparHTML(p.assunto || '')}
                                <div class="small text-muted">${UI.escaparHTML(this.turmasMap[p.id_turma] || 'Turma não informada')}</div>
                            </div>
                            <span class="badge bg-primary">${UI.escaparHTML(p.status || 'Rascunho')}</span>
                        </button>
                    `).join('')}
                </div>`;
        }

        const modalEl = document.getElementById('modal-dia-planos');
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    },

    /**
     * Chamado ao selecionar um plano na lista do modal do dia: fecha o
     * modal de seleção e abre a prévia do plano escolhido.
     */
    selecionarPlanoDoDia(idPlano) {
        const modalEl = document.getElementById('modal-dia-planos');
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        Visualizacao.abrir(idPlano);
    }
};
