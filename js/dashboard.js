const Dashboard = {
    async render() {
        const content = document.getElementById('conteudo');
        const usuario = auth.getUsuario();
        const primeiroNome = (usuario?.nome || '').trim().split(' ')[0];
        const saudacao = primeiroNome ? `Olá, ${UI.escaparHTML(primeiroNome)}!` : 'Olá, professor(a)!';
        content.innerHTML = `
            <div class="dashboard-page">
            <h2>${saudacao}</h2>
            <p>Bem-vindo ao ${CONFIG.APP_NAME}</p>
            <div class="row mt-4">
                <div class="col-md-3 mb-3">
                    <div class="card card-stats">
                        <div class="icon" style="background:#e3f2fd; color:#1a73e8;"><i class="fas fa-book"></i></div>
                        <div class="value" id="stat-total-planos">
                            <span class="spinner-border spinner-border-sm" role="status"></span>
                        </div>
                        <div class="label">Total de Planos</div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card card-stats">
                        <div class="icon" style="background:#e8f5e9; color:#28a745;"><i class="fas fa-calendar-check"></i></div>
                        <div class="value" id="stat-planos-mes">
                            <span class="spinner-border spinner-border-sm" role="status"></span>
                        </div>
                        <div class="label">Planos deste Mês</div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card card-stats">
                        <div class="icon" style="background:#fff3e0; color:#ff9800;"><i class="fas fa-school"></i></div>
                        <div class="value" id="stat-turmas">
                            <span class="spinner-border spinner-border-sm" role="status"></span>
                        </div>
                        <div class="label">Turmas Cadastradas</div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card card-stats">
                        <div class="icon" style="background:#fce4ec; color:#dc3545;"><i class="fas fa-star"></i></div>
                        <div class="value" id="stat-favoritos">
                            <span class="spinner-border spinner-border-sm" role="status"></span>
                        </div>
                        <div class="label">Favoritos</div>
                    </div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-white"><h5>Ações rápidas</h5></div>
                        <div class="card-body">
                            <button class="btn btn-primary mb-2" onclick="app.navegarPara('novo-plano')"><i class="fas fa-plus"></i> Novo Plano</button>
                            <button class="btn btn-secondary mb-2" onclick="app.navegarPara('planos')"><i class="fas fa-book"></i> Meus Planos</button>
                            <button class="btn btn-info mb-2" onclick="app.abrirGemini()"><i class="fas fa-sparkles"></i> Gerar com Gemini</button>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        `;

        this.carregarEstatisticas();
    },

    /**
     * Busca planos e turmas na planilha do professor e preenche os
     * cards de estatística do dashboard.
     */
    async carregarEstatisticas() {
        try {
            const [respPlanos, respTurmas] = await Promise.all([
                api.get('buscarPlanos'),
                api.get('listarTurmas')
            ]);

            const planos = respPlanos.data || [];
            const turmas = respTurmas.data || [];

            const agora = new Date();
            const mesAtual = agora.getMonth();
            const anoAtual = agora.getFullYear();

            const planosDoMes = planos.filter(p => {
                const dataRef = p.data_aula || p.data_criacao;
                if (!dataRef) return false;
                const d = new Date(dataRef);
                if (isNaN(d)) return false;
                return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
            }).length;

            const favoritos = planos.filter(p => p.favorito === true || p.favorito === 'true').length;

            this.setValor('stat-total-planos', planos.length);
            this.setValor('stat-planos-mes', planosDoMes);
            this.setValor('stat-turmas', turmas.length);
            this.setValor('stat-favoritos', favoritos);
        } catch (error) {
            // Se a página já mudou, ou a busca falhou, mostra "-" em vez de travar no spinner
            ['stat-total-planos', 'stat-planos-mes', 'stat-turmas', 'stat-favoritos'].forEach(id => this.setValor(id, '-'));
        }
    },

    setValor(id, valor) {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    }
};
