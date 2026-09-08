/**
 * ANEXOS DO PLANO (Google Drive)
 * Só pode ser usado com um plano já salvo (idPlano existente),
 * pois os arquivos ficam na pasta do plano no Drive.
 */

const DriveAnexos = {
    idPlano: null,

    async render(idPlano, elId) {
        this.idPlano = idPlano;
        this.elId = elId;
        document.getElementById(elId).innerHTML = `
            <div class="mb-2">
                <input type="file" class="form-control" id="drive-input-arquivo" accept=".pdf,.jpg,.jpeg,.png">
                <small class="text-muted">Apenas PDF, JPG ou PNG.</small>
            </div>
            <button type="button" class="btn btn-sm btn-outline-primary mb-3" onclick="DriveAnexos.upload()">
                <i class="fas fa-upload"></i> Enviar arquivo
            </button>
            <div id="drive-anexos-lista"></div>
        `;
        await this.carregar();
    },

    async carregar() {
        const lista = document.getElementById('drive-anexos-lista');
        lista.innerHTML = '<div class="text-muted">Carregando anexos...</div>';
        try {
            const response = await api.get('listarAnexos', { idPlano: this.idPlano });
            const anexos = response.data || [];
            if (anexos.length === 0) {
                lista.innerHTML = '<p class="text-muted mb-0">Nenhum anexo enviado ainda.</p>';
                return;
            }
            lista.innerHTML = anexos.map(a => `
                <div class="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2">
                    <a href="${a.url}" target="_blank"><i class="fas fa-paperclip"></i> ${UI.escaparHTML(a.nome_arquivo)}</a>
                    <button class="btn-action btn-outline-danger" onclick="DriveAnexos.excluir('${a.id_anexo}')"><i class="fas fa-trash"></i></button>
                </div>
            `).join('');
        } catch (error) {
            lista.innerHTML = '<p class="text-muted mb-0">Não foi possível carregar os anexos.</p>';
        }
    },

    async upload() {
        const input = document.getElementById('drive-input-arquivo');
        const arquivo = input.files[0];

        if (!arquivo) {
            Toast.warning('Selecione um arquivo primeiro.');
            return;
        }

        const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!tiposPermitidos.includes(arquivo.type)) {
            Toast.warning('Apenas PDF, JPG ou PNG são permitidos.');
            return;
        }

        const formData = new FormData();
        formData.append('idPlano', this.idPlano);
        formData.append('arquivo', arquivo);

        UI.showLoading('Enviando arquivo...');
        try {
            // Upload multipart separado de api.post (que envia JSON) — o Apps Script
            // interpreta o campo "arquivo" de um FormData como Blob em e.parameter.
            // IMPORTANTE: o token precisa ir na query string aqui também, porque
            // handleRequest() no backend exige e.parameter.token em toda ação
            // que não seja "login" (ver getUsuarioAtual em Auth.gs).
            const token = encodeURIComponent(api.getToken());
            const response = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=uploadAnexo&token=${token}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const resultado = await response.json();

            if (!resultado.success) throw new Error(resultado.error || 'ERRO_UPLOAD');

            Toast.success('Arquivo enviado com sucesso!');
            input.value = '';
            await this.carregar();
        } catch (error) {
            console.error('[DriveAnexos.upload]', error);
            if (error.message === 'AUTH_ERROR') {
                Toast.error('Sua sessão expirou. Faça login novamente.');
            } else {
                Toast.error('Não foi possível enviar o arquivo.');
            }
        } finally {
            UI.hideLoading();
        }
    },

    async excluir(idAnexo) {
        if (!UI.confirmarExclusao('Excluir este anexo?')) return;
        try {
            UI.showLoading();
            await api.get('excluirAnexo', { idAnexo });
            Toast.success('Anexo excluído.');
            await this.carregar();
        } catch (error) {
            Toast.error('Não foi possível excluir o anexo.');
        } finally {
            UI.hideLoading();
        }
    }
};
