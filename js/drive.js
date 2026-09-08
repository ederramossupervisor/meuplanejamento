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

        console.log(
            '=========================================='
        );

        console.log(
            '[DriveAnexos.upload] INÍCIO DO UPLOAD'
        );

        console.log(
            '=========================================='
        );


        const input =
            document.getElementById(
                'drive-input-arquivo'
            );


        if (!input) {

            console.error(
                '[DriveAnexos.upload] Input de arquivo não encontrado.'
            );

            Toast.error(
                'Campo de arquivo não encontrado.'
            );

            return;
        }


        const arquivo =
            input.files && input.files[0];


        if (!arquivo) {

            console.warn(
                '[DriveAnexos.upload] Nenhum arquivo selecionado.'
            );

            Toast.warning(
                'Selecione um arquivo primeiro.'
            );

            return;
        }


        /**
         * Informações do arquivo
         */
        console.log(
            '[DriveAnexos.upload] Arquivo:',
            arquivo.name
        );

        console.log(
            '[DriveAnexos.upload] Tipo:',
            arquivo.type
        );

        console.log(
            '[DriveAnexos.upload] Tamanho:',
            arquivo.size,
            'bytes'
        );

        console.log(
            '[DriveAnexos.upload] ID do plano:',
            this.idPlano
        );


        /**
         * Verifica se existe plano
         */
        if (!this.idPlano) {

            Toast.warning(
                'Salve o plano antes de enviar um arquivo.'
            );

            return;
        }


        /**
         * Tipos permitidos
         */
        const tiposPermitidos = [

            'application/pdf',

            'image/jpeg',

            'image/png'

        ];


        if (!tiposPermitidos.includes(arquivo.type)) {

            console.warn(
                '[DriveAnexos.upload] Tipo não permitido:',
                arquivo.type
            );

            Toast.warning(
                'Apenas PDF, JPG ou PNG são permitidos.'
            );

            return;
        }


        /**
         * Verifica token
         */
        const token = api.getToken();


        console.log(
            '[DriveAnexos.upload] Token existe?',
            !!token
        );


        if (!token) {

            Toast.error(
                'Sua sessão expirou. Faça login novamente.'
            );

            return;
        }


        /**
         * Cria FormData
         */
        const formData =
            new FormData();


        formData.append(
            'idPlano',
            this.idPlano
        );


        formData.append(
            'arquivo',
            arquivo
        );


        console.log(
            '[DriveAnexos.upload] FormData criado.'
        );


        /**
         * URL do Apps Script
         */
        const url =
            `${CONFIG.APPS_SCRIPT_URL}` +
            `?action=uploadAnexo` +
            `&token=${encodeURIComponent(token)}` +
            `&teste=${Date.now()}`;


        console.log(
            '[DriveAnexos.upload] URL:',
            url
        );


        /**
         * Mostra carregamento
         */
        UI.showLoading(
            'Enviando arquivo...'
        );


        try {

            console.log(
                '[DriveAnexos.upload] Iniciando fetch...'
            );


            /**
             * Envia para o Apps Script
             */
            const response =
                await fetch(
                    url,
                    {
                        method: 'POST',

                        body: formData
                    }
                );


            console.log(
                '[DriveAnexos.upload] Resposta recebida.'
            );


            console.log(
                '[DriveAnexos.upload] HTTP status:',
                response.status
            );


            console.log(
                '[DriveAnexos.upload] HTTP ok:',
                response.ok
            );


            /**
             * Lê primeiro como texto.
             *
             * Isso é proposital para conseguirmos
             * enxergar uma eventual resposta que
             * não seja JSON.
             */
            const texto =
                await response.text();


            console.log(
                '[DriveAnexos.upload] Resposta bruta:'
            );


            console.log(
                texto
            );


            /**
             * Tenta transformar em JSON
             */
            let resultado;


            try {

                resultado =
                    JSON.parse(texto);

            } catch (jsonError) {

                console.error(
                    '[DriveAnexos.upload] Resposta não é JSON:',
                    jsonError
                );

                throw new Error(
                    'O servidor não retornou uma resposta JSON. ' +
                    'Resposta recebida: ' +
                    texto.substring(0, 500)
                );
            }


            console.log(
                '[DriveAnexos.upload] JSON recebido:',
                resultado
            );


            /**
             * Verifica erro retornado pelo Apps Script
             */
            if (!resultado.success) {

                const mensagem =

                    resultado.message ||

                    resultado.details ||

                    resultado.error ||

                    'ERRO_UPLOAD';


                console.error(
                    '[DriveAnexos.upload] Erro informado pelo servidor:',
                    mensagem
                );


                throw new Error(
                    mensagem
                );
            }


            /**
             * Upload realizado
             */
            console.log(
                '[DriveAnexos.upload] UPLOAD REALIZADO COM SUCESSO'
            );


            console.log(
                '[DriveAnexos.upload] Dados:',
                resultado.data
            );


            Toast.success(
                'Arquivo enviado com sucesso!'
            );


            /**
             * Limpa o campo
             */
            input.value = '';


            /**
             * Atualiza lista
             */
            await this.carregar();


        } catch (error) {

            console.error(
                '=========================================='
            );

            console.error(
                '[DriveAnexos.upload] ERRO'
            );

            console.error(
                'Mensagem:',
                error.message
            );

            console.error(
                'Erro completo:',
                error
            );

            console.error(
                '=========================================='
            );


            /**
             * Mostra o erro real durante o diagnóstico.
             */
            Toast.error(
                'Erro no envio: ' +
                (error.message || 'Erro desconhecido')
            );


        } finally {

            UI.hideLoading();

        }


        console.log(
            '[DriveAnexos.upload] FIM DO UPLOAD'
        );

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
