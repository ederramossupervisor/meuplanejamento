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
                <div class="form-section-title"><i class="fas fa-cog"></i> Sobre o aplicativo</div>
                <p class="mb-1"><strong>Versão:</strong> ${CONFIG.VERSAO}</p>
                <p class="mb-0"><strong>Ano letivo:</strong> ${CONFIG.ANO_LETIVO}</p>
            </div>
        `;
    }
};
