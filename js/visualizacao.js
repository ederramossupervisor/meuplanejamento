/**
 * VISUALIZAÇÃO (PRÉVIA) DO PLANO DE AULA
 */

const Visualizacao = {
    planoAtual: null,

    parseJSON(valor, padrao) {
        try {
            if (!valor) return padrao;
            if (Array.isArray(valor)) return valor;
            return JSON.parse(valor);
        } catch (e) {
            return padrao;
        }
    },

    async abrir(idPlano) {
        UI.showLoading('Carregando plano...');
        try {
            const response = await api.get('getPlano', { idPlano });
            const plano = response.data;
            this.planoAtual = plano;

            document.getElementById('conteudo-visualizacao').innerHTML = this.montarHtml(plano);

            const modal = new bootstrap.Modal(document.getElementById('modal-visualizacao'));
            modal.show();
        } catch (error) {
            Toast.error('Não foi possível carregar o plano.');
        } finally {
            UI.hideLoading();
        }
    },

    montarHtml(plano) {
        const habilidades = this.parseJSON(plano.habilidades, []);
        const competencias = this.parseJSON(plano.competencias, []);
        const recursos = this.parseJSON(plano.recursos, []);
        const referencias = this.parseJSON(plano.referencias, []);
        const estrategiasAvaliacao = this.parseJSON(plano.estrategias_avaliacao, []);

        let html = `<div class="documento-preview">
            <div class="documento-header">
                <h1>Plano de Aula</h1>
                <p><strong>Componente:</strong> ${UI.escaparHTML(plano.componente || '')}</p>
                <p><strong>Data da aula:</strong> ${UI.formatarData(plano.data_aula)}</p>
            </div>`;

        html += `<div class="documento-section">
            <h2>1. Assunto/Tema</h2>
            <p><strong>Assunto:</strong> ${UI.escaparHTML(plano.assunto || '')}</p>
            ${plano.tema ? `<p><strong>Tema:</strong> ${UI.escaparHTML(plano.tema)}</p>` : ''}
            ${plano.unidade_tematica ? `<p><strong>Unidade Temática:</strong> ${UI.escaparHTML(plano.unidade_tematica)}</p>` : ''}
            ${plano.objeto_conhecimento ? `<p><strong>Objeto de Conhecimento:</strong> ${UI.escaparHTML(plano.objeto_conhecimento)}</p>` : ''}
        </div>`;

        if (habilidades.length > 0) {
            html += `<div class="documento-section"><h2>2. Habilidades</h2><ul>`;
            habilidades.forEach(h => {
                html += `<li><strong>${UI.escaparHTML(h.codigo || '')}</strong> - ${UI.escaparHTML(h.descricao || '')}</li>`;
            });
            html += `</ul></div>`;
        }

        if (competencias.length > 0) {
            html += `<div class="documento-section"><h2>3. Competências</h2><ul>`;
            competencias.forEach(c => { html += `<li>${UI.escaparHTML(c)}</li>`; });
            html += `</ul></div>`;
        }

        if (plano.objetivo_geral || (plano.objetivos && plano.objetivos.length > 0)) {
            html += `<div class="documento-section"><h2>4. Objetivos de Aprendizagem</h2>`;
            if (plano.objetivo_geral) html += `<p><strong>Objetivo Geral:</strong> ${UI.escaparHTML(plano.objetivo_geral)}</p>`;
            if (plano.objetivos && plano.objetivos.length > 0) {
                html += `<p><strong>Objetivos Específicos:</strong></p><ol>`;
                plano.objetivos.forEach(o => { html += `<li>${UI.escaparHTML(o.descricao || '')}</li>`; });
                html += `</ol>`;
            }
            html += `</div>`;
        }

        if (plano.desenvolvimento && plano.desenvolvimento.length > 0) {
            html += `<div class="documento-section"><h2>5. Desenvolvimento</h2>
                <table class="documento-table">
                    <thead><tr><th>Etapa</th><th>Tempo</th><th>Metodologia</th><th>Desenvolvimento</th></tr></thead>
                    <tbody>`;
            plano.desenvolvimento.forEach((e, i) => {
                html += `<tr>
                    <td>${i + 1}</td>
                    <td>${UI.escaparHTML(e.tempo || '')}</td>
                    <td>${UI.escaparHTML(e.metodologia || '')}</td>
                    <td>${UI.escaparHTML(e.descricao || '')}</td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
        }

        if (estrategiasAvaliacao.length > 0) {
            html += `<div class="documento-section"><h2>6. Estratégias de Avaliação</h2><ul>`;
            estrategiasAvaliacao.forEach(e => { html += `<li>${UI.escaparHTML(e)}</li>`; });
            html += `</ul></div>`;
        }

        if (recursos.length > 0) {
            html += `<div class="documento-section"><h2>7. Recursos Utilizados</h2><ul>`;
            recursos.forEach(r => { html += `<li>${UI.escaparHTML(r)}</li>`; });
            html += `</ul></div>`;
        }

        if (referencias.length > 0) {
            html += `<div class="documento-section"><h2>8. Referências Bibliográficas</h2><ul>`;
            referencias.forEach(r => { html += `<li>${UI.escaparHTML(r)}</li>`; });
            html += `</ul></div>`;
        }

        if (plano.inclusao) html += `<div class="documento-section"><h2>9. Inclusão e Acessibilidade</h2><p>${UI.escaparHTML(plano.inclusao)}</p></div>`;
        if (plano.interdisciplinaridade) html += `<div class="documento-section"><h2>10. Interdisciplinaridade</h2><p>${UI.escaparHTML(plano.interdisciplinaridade)}</p></div>`;
        if (plano.observacoes) html += `<div class="documento-section"><h2>11. Observações</h2><p>${UI.escaparHTML(plano.observacoes)}</p></div>`;

        html += `</div>`;
        return html;
    }
};

/**
 * Atalho global usado pelo botão "Imprimir" do modal de visualização (index.html)
 */
function imprimirPlano() {
    window.print();
}
