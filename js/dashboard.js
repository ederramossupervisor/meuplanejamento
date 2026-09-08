const Dashboard = {
    async render() {
        const content = document.getElementById('conteudo');
        const usuario = auth.getUsuario();
        const primeiroNome = (usuario?.nome || '').trim().split(' ')[0];
        const saudacao = primeiroNome ? `Olá, ${UI.escaparHTML(primeiroNome)}!` : 'Olá, professor(a)!';
        content.innerHTML = `
            <h2>${saudacao}</h2>
            <p>Bem-vindo ao ${CONFIG.APP_NAME}</p>
            <div class="row mt-4">
                <div class="col-md-3 mb-3">
                    <div class="card card-stats">
                        <div class="icon" style="background:#e3f2fd; color:#1a73e8;"><i class="fas fa-book"></i></div>
                        <div class="value">0</div>
                        <div class="label">Total de Planos</div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card card-stats">
                        <div class="icon" style="background:#e8f5e9; color:#28a745;"><i class="fas fa-calendar-check"></i></div>
                        <div class="value">0</div>
                        <div class="label">Planos deste Mês</div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card card-stats">
                        <div class="icon" style="background:#fff3e0; color:#ff9800;"><i class="fas fa-school"></i></div>
                        <div class="value">0</div>
                        <div class="label">Turmas Cadastradas</div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card card-stats">
                        <div class="icon" style="background:#fce4ec; color:#dc3545;"><i class="fas fa-star"></i></div>
                        <div class="value">0</div>
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
        `;
    }
};
