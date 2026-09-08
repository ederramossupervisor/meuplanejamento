/**
 * CALENDÁRIO DE AULAS
 */

const Calendario = {
    mesAtual: new Date().getMonth(),
    anoAtual: new Date().getFullYear(),
    planosPorDia: {},

    async render() {
        const content = document.getElementById('conteudo');
        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-outline-secondary" onclick="Calendario.mudarMes(-1)"><i class="fas fa-chevron-left"></i></button>
                <h4 class="mb-0" id="calendario-titulo"></h4>
                <button class="btn btn-outline-secondary" onclick="Calendario.mudarMes(1)"><i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="card">
                <div class="card-body">
                    <div id="calendario-grid"></div>
                </div>
            </div>
            <div id="calendario-dia-detalhe" class="mt-3"></div>
        `;
        await this.carregarPlanos();
        this.renderGrid();
    },

    async carregarPlanos() {
        try {
            const response = await api.get('buscarPlanos', { anoLetivo: String(this.anoAtual) });
            const planos = response.data || [];
            this.planosPorDia = {};
            planos.forEach(p => {
                if (!p.data_aula) return;
                const chave = String(p.data_aula).substring(0, 10);
                if (!this.planosPorDia[chave]) this.planosPorDia[chave] = [];
                this.planosPorDia[chave].push(p);
            });
        } catch (error) {
            this.planosPorDia = {};
        }
    },

    async mudarMes(delta) {
        this.mesAtual += delta;
        if (this.mesAtual > 11) { this.mesAtual = 0; this.anoAtual++; await this.carregarPlanos(); }
        if (this.mesAtual < 0) { this.mesAtual = 11; this.anoAtual--; await this.carregarPlanos(); }
        this.renderGrid();
    },

    renderGrid() {
        const nomesMeses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        document.getElementById('calendario-titulo').textContent = `${nomesMeses[this.mesAtual]} de ${this.anoAtual}`;
        document.getElementById('calendario-dia-detalhe').innerHTML = '';

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

            celulas += `
                <div class="cal-dia ${ehHoje ? 'cal-dia-hoje' : ''} ${planosDoDia.length ? 'cal-dia-com-plano' : ''}" onclick="Calendario.abrirDia('${chave}')">
                    <span class="cal-dia-numero">${dia}</span>
                    ${planosDoDia.length ? `<span class="badge bg-primary cal-dia-badge">${planosDoDia.length}</span>` : ''}
                </div>`;
        }

        document.getElementById('calendario-grid').innerHTML = `
            <div class="cal-cabecalho">
                ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => `<div>${d}</div>`).join('')}
            </div>
            <div class="cal-grid">${celulas}</div>
        `;
    },

    abrirDia(chave) {
        const planosDoDia = this.planosPorDia[chave] || [];
        const container = document.getElementById('calendario-dia-detalhe');

        if (planosDoDia.length === 0) {
            container.innerHTML = `
                <div class="card"><div class="card-body text-center text-muted">
                    Nenhum plano para ${UI.formatarData(chave)}.
                    <button class="btn btn-sm btn-primary ms-2" onclick="app.navegarPara('novo-plano')">Criar plano</button>
                </div></div>`;
            return;
        }

        container.innerHTML = `
            <div class="card">
                <div class="card-header bg-white"><strong>Planos de ${UI.formatarData(chave)}</strong></div>
                <div class="list-group list-group-flush">
                    ${planosDoDia.map(p => `
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${UI.escaparHTML(p.componente)}</strong> — ${UI.escaparHTML(p.assunto)}
                            </div>
                            <button class="btn-action btn-outline-primary" onclick="Visualizacao.abrir('${p.id_plano}')"><i class="fas fa-eye"></i></button>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }
};
