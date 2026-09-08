const UI = {
    mostrarTelaLogin() {
        document.getElementById('tela-login').classList.remove('d-none');
        document.getElementById('app').classList.add('d-none');
        document.getElementById('tela-config-inicial').classList.add('d-none');
    },
    mostrarTelaConfigInicial() {
        document.getElementById('tela-login').classList.add('d-none');
        document.getElementById('app').classList.add('d-none');
        document.getElementById('tela-config-inicial').classList.remove('d-none');
    },
    mostrarApp() {
        document.getElementById('tela-login').classList.add('d-none');
        document.getElementById('tela-config-inicial').classList.add('d-none');
        document.getElementById('app').classList.remove('d-none');
    },
    mostrarUsuario(usuario) {
        const avatar = document.getElementById('user-avatar-mini');
        const nome = document.getElementById('user-name-mini');

        avatar.onerror = () => { avatar.onerror = null; avatar.src = UI.avatarIniciais(usuario.nome || usuario.email); };
        avatar.src = usuario.foto ? usuario.foto : UI.avatarIniciais(usuario.nome || usuario.email);

        nome.textContent = usuario.nome || usuario.email;
    },
    /**
     * Gera um avatar simples (círculo colorido com a inicial do nome) como
     * data URI, sem depender de nenhum arquivo de imagem no projeto.
     */
    avatarIniciais(nomeOuEmail) {
        const inicial = (nomeOuEmail || '?').trim().charAt(0).toUpperCase() || '?';
        const cor = (CONFIG.CORES && CONFIG.CORES.PRIMARY) || '#1a73e8';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
            <circle cx="40" cy="40" r="40" fill="${cor}"/>
            <text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#ffffff">${inicial}</text>
        </svg>`;
        return 'data:image/svg+xml,' + encodeURIComponent(svg);
    },
    formatarData(dataString) {
        if (!dataString) return '';
        const date = new Date(dataString);
        return date.toLocaleDateString('pt-BR');
    },
    formatarDataHora(dataString) {
        if (!dataString) return '';
        const date = new Date(dataString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    },
    escaparHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    },
    gerarId(prefixo = '') {
        return prefixo + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },
    toastSuccess(mensagem) { Toast.success(mensagem); },
    toastError(mensagem) { Toast.error(mensagem); },
    toastWarning(mensagem) { Toast.warning(mensagem); },
    showLoading() { Loading.show(); },
    hideLoading() { Loading.hide(); },
    confirmarExclusao(mensagem = 'Tem certeza que deseja excluir? Esta ação não poderá ser desfeita.') {
        return confirm(mensagem);
    },
    validarCampos(campos) {
        const faltantes = [];
        for (const campo of campos) {
            const elemento = document.getElementById(campo.id);
            if (elemento && !elemento.value.trim()) {
                faltantes.push(campo.nome);
            }
        }
        if (faltantes.length > 0) {
            Toast.warning(`Preencha os campos: ${faltantes.join(', ')}`);
            return false;
        }
        return true;
    }
};

const Toast = {
    success(mensagem, duracao = 3000) { this.exibir(mensagem, 'success', duracao); },
    error(mensagem, duracao = 5000) { this.exibir(mensagem, 'error', duracao); },
    warning(mensagem, duracao = 4000) { this.exibir(mensagem, 'warning', duracao); },
    info(mensagem, duracao = 3000) { this.exibir(mensagem, 'info', duracao); },
    exibir(mensagem, tipo, duracao) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        let icone = 'fa-info-circle';
        if (tipo === 'success') icone = 'fa-check-circle';
        if (tipo === 'error') icone = 'fa-exclamation-circle';
        if (tipo === 'warning') icone = 'fa-exclamation-triangle';
        toast.innerHTML = `<i class="fas ${icone}"></i><span>${UI.escaparHTML(mensagem)}</span><button class="btn-close toast-close">&times;</button>`;
        container.appendChild(toast);
        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, duracao);
    }
};

const Loading = {
    show(mensagem = 'Carregando...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `<div class="loading-spinner"></div><p class="loading-text">${UI.escaparHTML(mensagem)}</p>`;
        document.body.appendChild(overlay);
    },
    hide() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) overlay.remove();
    }
};
