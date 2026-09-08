/**
 * ANEXOS DO PLANO (Google Drive)
 *
 * Os arquivos ficam organizados em:
 *
 * Pasta principal
 *   └── Professor_Nome
 *        └── Planos
 *             └── ID_DO_PLANO
 *                  └── arquivo.pdf
 *
 * O plano precisa estar salvo antes do envio do anexo.
 */

const DriveAnexos = {

    idPlano: null,
    elId: null,

    /**
     * Renderiza a área de anexos
     */
    async render(idPlano, elId) {

        this.idPlano = idPlano;
        this.elId = elId;

        const elemento = document.getElementById(elId);

        if (!elemento) {
            console.error(
                '[DriveAnexos] Elemento não encontrado:',
                elId
            );
            return;
        }

        elemento.innerHTML = `

            <div class="mb-2">

                <input
                    type="file"
                    class="form-control"
                    id="drive-input-arquivo"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                >

                <small class="text-muted">
                    Apenas arquivos PDF, JPG ou PNG.
                </small>

            </div>

            <button
                type="button"
                class="btn btn-sm btn-outline-primary mb-3"
                onclick="DriveAnexos.upload()"
            >
                <i class="fas fa-upload"></i>
                Enviar arquivo
            </button>

            <div id="drive-anexos-lista">
                <div class="text-muted">
                    Carregando anexos...
                </div>
            </div>
        `;

        await this.carregar();
    },


    /**
     * Lista os anexos do plano
     */
    async carregar() {

        const lista = document.getElementById(
            'drive-anexos-lista'
        );

        if (!lista) {
            console.error(
                '[DriveAnexos] Lista de anexos não encontrada.'
            );
            return;
        }

        lista.innerHTML = `
            <div class="text-muted">
                Carregando anexos...
            </div>
        `;

        try {

            if (!this.idPlano) {

                lista.innerHTML = `
                    <p class="text-muted mb-0">
                        Salve o plano antes de adicionar anexos.
                    </p>
                `;

                return;
            }

            console.log(
                '[DriveAnexos.carregar] ID do plano:',
                this.idPlano
            );

            const response = await api.get(
                'listarAnexos',
                {
                    idPlano: this.idPlano
                }
            );

            console.log(
                '[DriveAnexos.carregar] Resposta:',
                response
            );

            const anexos = response.data || [];

            if (anexos.length === 0) {

                lista.innerHTML = `
                    <p class="text-muted mb-0">
                        Nenhum anexo enviado ainda.
                    </p>
                `;

                return;
            }

            lista.innerHTML = anexos.map(a => {

                const nomeArquivo =
                    UI.escaparHTML(
                        a.nome_arquivo || 'Arquivo'
                    );

                const url =
                    a.url || '#';

                const idAnexo =
                    a.id_anexo || '';

                return `

                    <div
                        class="d-flex justify-content-between align-items-center border rounded px-3 py-2 mb-2"
                    >

                        <a
                            href="${url}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-decoration-none"
                        >
                            <i class="fas fa-paperclip"></i>
                            ${nomeArquivo}
                        </a>

                        <button
                            type="button"
                            class="btn-action btn-outline-danger"
                            onclick="DriveAnexos.excluir('${idAnexo}')"
                            title="Excluir anexo"
                        >
                            <i class="fas fa-trash"></i>
                        </button>

                    </div>

                `;

            }).join('');

        } catch (error) {

            console.error(
                '[DriveAnexos.carregar] Erro:',
                error
            );

            lista.innerHTML = `
                <p class="text-muted mb-0">
                    Não foi possível carregar os anexos.
                </p>
            `;
        }
    },


    /**
     * Faz o upload do arquivo
     *
     * VERSÃO DE DIAGNÓSTICO
     *
     * Neste momento estamos usando FormData para descobrir
     * exatamente o que está acontecendo entre o navegador
     * e o Google Apps Script.
     */
    async upload() {

    const input = document.getElementById('drive-input-arquivo');
    const arquivo = input?.files?.[0];

    if (!arquivo) {
        Toast.warning('Selecione um arquivo primeiro.');
        return;
    }

    if (!this.idPlano) {
        Toast.warning('Salve o plano antes de enviar um arquivo.');
        return;
    }

    const tiposPermitidos = [
        'application/pdf',
        'image/jpeg',
        'image/png'
    ];

    if (!tiposPermitidos.includes(arquivo.type)) {
        Toast.warning('Apenas PDF, JPG ou PNG são permitidos.');
        return;
    }

    const token = api.getToken();

    if (!token) {
        Toast.error('Sua sessão expirou. Faça login novamente.');
        return;
    }

    console.log('==========================================');
    console.log('[DriveAnexos.upload] INICIANDO UPLOAD');
    console.log('==========================================');

    console.log('Arquivo:', arquivo.name);
    console.log('Tipo:', arquivo.type);
    console.log('Tamanho:', arquivo.size);
    console.log('ID plano:', this.idPlano);

    UI.showLoading('Preparando arquivo...');

    try {

        /*
         * Converte o arquivo para Base64.
         */
        const base64 = await new Promise((resolve, reject) => {

            const reader = new FileReader();

            reader.onload = () => {

                try {

                    const resultado = reader.result;

                    /*
                     * FileReader retorna algo como:
                     *
                     * data:application/pdf;base64,JVBERi0x...
                     *
                     * Precisamos somente da parte depois da vírgula.
                     */

                    const base64Data =
                        resultado.split(',')[1];

                    if (!base64Data) {
                        reject(
                            new Error(
                                'Não foi possível converter o arquivo para Base64.'
                            )
                        );
                        return;
                    }

                    resolve(base64Data);

                } catch (error) {

                    reject(error);

                }

            };

            reader.onerror = () => {

                reject(
                    new Error(
                        'Erro ao ler o arquivo.'
                    )
                );

            };

            reader.readAsDataURL(arquivo);

        });


        console.log(
            '[DriveAnexos.upload] Arquivo convertido para Base64.'
        );

        console.log(
            '[DriveAnexos.upload] Tamanho Base64:',
            base64.length
        );


        UI.showLoading('Enviando arquivo...');


        /*
         * Monta os dados enviados ao Apps Script.
         */
        const dados = {

            idPlano: this.idPlano,

            nomeArquivo: arquivo.name,

            mimeType: arquivo.type,

            arquivoBase64: base64

        };


        const url =
            `${CONFIG.APPS_SCRIPT_URL}` +
            `?action=uploadAnexo` +
            `&token=${encodeURIComponent(token)}` +
            `&teste=${Date.now()}`;


        console.log(
            '[DriveAnexos.upload] Enviando para Apps Script...'
        );


        const response = await fetch(
            url,
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'text/plain;charset=utf-8'
                },

                body: JSON.stringify(dados)
            }
        );


        console.log(
            '[DriveAnexos.upload] HTTP:',
            response.status
        );


        const texto =
            await response.text();


        console.log(
            '[DriveAnexos.upload] Resposta:',
            texto
        );


        let resultado;

        try {

            resultado =
                JSON.parse(texto);

        } catch (error) {

            console.error(
                '[DriveAnexos.upload] Resposta inválida:',
                texto
            );

            throw new Error(
                'O servidor não retornou uma resposta válida.'
            );

        }


        if (!resultado.success) {

            throw new Error(

                resultado.message ||

                resultado.details ||

                resultado.error ||

                'ERRO_UPLOAD'

            );

        }


        console.log(
            '[DriveAnexos.upload] Upload concluído:',
            resultado.data
        );


        Toast.success(
            'Arquivo enviado com sucesso!'
        );


        input.value = '';


        await this.carregar();


    } catch (error) {

        console.error(
            '=========================================='
        );

        console.error(
            '[DriveAnexos.upload] ERRO'
        );

        console.error(
            error
        );

        console.error(
            'Mensagem:',
            error.message
        );

        console.error(
            '=========================================='
        );


        Toast.error(
            error.message ||
            'Não foi possível enviar o arquivo.'
        );


    } finally {

        UI.hideLoading();

    }

},


    /**
     * Exclui um anexo
     */
    async excluir(idAnexo) {

        if (!idAnexo) {

            Toast.error(
                'ID do anexo não informado.'
            );

            return;
        }


        if (
            !UI.confirmarExclusao(
                'Excluir este anexo?'
            )
        ) {

            return;
        }


        try {

            UI.showLoading(
                'Excluindo anexo...'
            );


            console.log(
                '[DriveAnexos.excluir] ID:',
                idAnexo
            );


            const response =
                await api.get(
                    'excluirAnexo',
                    {
                        idAnexo: idAnexo
                    }
                );


            console.log(
                '[DriveAnexos.excluir] Resposta:',
                response
            );


            Toast.success(
                'Anexo excluído.'
            );


            await this.carregar();


        } catch (error) {

            console.error(
                '[DriveAnexos.excluir] Erro:',
                error
            );


            Toast.error(
                'Não foi possível excluir o anexo.'
            );


        } finally {

            UI.hideLoading();

        }

    }

};
