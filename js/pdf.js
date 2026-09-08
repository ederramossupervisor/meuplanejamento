/**
 * GERAÇÃO DE PDF DO PLANO DE AULA
 */

const PDF = {
    async gerar(idPlano) {
        if (!idPlano) {
            Toast.warning('Abra a visualização de um plano antes de baixar o PDF.');
            return;
        }

        UI.showLoading('Gerando PDF...');
        try {
            const response = await api.get('gerarPDF', { idPlano });
            if (response.data && response.data.url) {
                window.open(response.data.url, '_blank');
                Toast.success('PDF gerado! Ele também foi salvo na pasta do plano no Drive.');
            } else {
                Toast.error('Não foi possível gerar o PDF.');
            }
        } catch (error) {
            // Enquanto a ação "gerarPDF" não estiver disponível no backend,
            // a impressão do navegador (Ctrl+P) é o caminho alternativo.
            Toast.error('Geração de PDF indisponível no momento. Use "Imprimir" como alternativa.');
        } finally {
            UI.hideLoading();
        }
    }
};

/**
 * Atalho global usado pelo botão "Baixar PDF" do modal de visualização (index.html)
 */
function baixarPDF() {
    const idPlano = Visualizacao.planoAtual?.id_plano;
    PDF.gerar(idPlano);
}
