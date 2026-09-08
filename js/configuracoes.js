/**
 * CONFIGURAÇÕES DO USUÁRIO E DO APLICATIVO
 */

const Configuracoes = {
    async render() {
        const content = document.getElementById('conteudo');
        content.innerHTML = `
            <div class="form-section">
                <div class="form-section-title"><i class="fas fa-user"></i> Meu perfil</div>
                <p class="mb-1"><strong>Nome:</strong> ${UI.escaparHTML(auth.getUsuario()?.nome || '-')}</p>
                <p class="mb-0"><strong>E-mail:</strong> ${UI.escaparHTML(auth.getUsuario()?.email || '-')}</p>
            </div>

            <div class="form-section">
                <div class="form-section-title"><i class="fas fa-sparkles"></i> Assistente Gemini</div>
                <label class="form-label">URL da Gem do Gemini</label>
                <div class="input-group">
                    <input type="url" class="form-control" id="config-url-gemini" placeholder="https://gemini.google.com/gem/...">
                    <button class="btn btn-primary" onclick="Configuracoes.salvarUrlGemini()">Salvar</button>
                </div>
                <small class="text-muted">Usada pelo botão "✨ Gemini" no menu lateral.</small>
            </div>

            <div class="form-section">
                <div class="form-section-title"><i class="fas fa-cog"></i> Sobre o aplicativo</div>
                <p class="mb-1"><strong>Versão:</strong> ${CONFIG.VERSAO}</p>
                <p class="mb-0"><strong>Ano letivo:</strong> ${CONFIG.ANO_LETIVO}</p>
            </div>
        `;
        await this.carregarUrlGemini();
    },

    async carregarUrlGemini() {
        try {
            const response = await api.get('getConfiguracao', { chave: 'URL_GEM_GEMINI' });
            document.getElementById('config-url-gemini').value = response.data?.valor || '';
        } catch (error) {
            // configuração ainda não definida — mantém o campo vazio
        }
    },

    async salvarUrlGemini() {
        const url = document.getElementById('config-url-gemini').value.trim();
        try {
            UI.showLoading();
            await api.post('salvarConfiguracao', { chave: 'URL_GEM_GEMINI', valor: url });
            Toast.success('Configuração salva!');
        } catch (error) {
            Toast.error('Não foi possível salvar a configuração.');
        } finally {
            UI.hideLoading();
        }
    }
};
