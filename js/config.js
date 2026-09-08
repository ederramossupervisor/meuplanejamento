/**
 * ARQUIVO DE CONFIGURAÇÃO DO APLICATIVO
 * Centraliza todas as configurações para fácil manutenção
 */

const CONFIG = {
    // Nome do aplicativo (fácil de alterar)
    APP_NAME: 'Meu Planejamento',
    
    // URL do Google Apps Script Web App
    // IMPORTANTE: Substitua pela URL do seu projeto Apps Script
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwRiFo6HqBIpc2b2tFdOsQQg5h3rN02JLmNaGQL6WKpMXc_cG3VK6STcK-oV1VgHVDgRQ/exec',
    
    // Versão do sistema
    VERSAO: '1.0.0',
    
    // Ano letivo
    ANO_LETIVO: new Date().getFullYear(),
    
    // Configurações de PWA
    PWA: {
        CACHE_NAME: 'meu-planejamento-v1.0.0',
        OFFLINE_URL: 'index.html'
    },
    
    // URLs padrão (para desenvolvimento)
    URLS: {
        GEM_GEMINI: '', // Será carregada da planilha de configurações
        LOGIN: '#',
    },
    
    // Configurações do Google
    GOOGLE: {
        // OBRIGATÓRIO para o login funcionar: crie um "OAuth 2.0 Client ID" do tipo
        // "Web application" em console.cloud.google.com > APIs e serviços > Credenciais,
        // adicione a origem do seu site em "Authorized JavaScript origins" (ex:
        // http://127.0.0.1:5500 em dev, e a URL do GitHub Pages em produção) e cole
        // o Client ID aqui. O MESMO valor precisa estar em backend/Config.gs -> GOOGLE_CLIENT_ID.
        CLIENT_ID: '327419300290-6b3of6phhiu7h4a2knj0svl0jgcfdgof.apps.googleusercontent.com',
        API_KEY: '',   // Se necessário
        SCOPES: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ]
    },
    
    // Cores institucionais
    CORES: {
        PRIMARY: '#1a73e8',
        PRIMARY_DARK: '#1557b0',
        SUCCESS: '#28a745',
        DANGER: '#dc3545',
        WARNING: '#ffc107',
        INFO: '#17a2b8'
    },
    
    // Estados possíveis de um plano
    STATUS_PLANO: ['Rascunho', 'Planejado', 'Realizado', 'Arquivado'],
    
    // Estratégias metodológicas padrão
    ESTRATEGIAS_METODOLOGICAS: [
        'Aula expositiva dialogada',
        'Debate',
        'Roda de conversa',
        'Aprendizagem baseada em problemas',
        'Aprendizagem colaborativa',
        'Estudo de caso',
        'Sala de aula invertida',
        'Gamificação',
        'Pesquisa',
        'Trabalho em grupo',
        'Produção individual',
        'Oficina',
        'Projeto',
        'Seminário',
        'Resolução de problemas'
    ],
    
    // Estratégias de avaliação padrão
    ESTRATEGIAS_AVALIACAO: [
        'Observação',
        'Participação',
        'Atividade escrita',
        'Atividade oral',
        'Produção textual',
        'Resolução de problemas',
        'Trabalho em grupo',
        'Apresentação',
        'Exercício',
        'Quiz',
        'Projeto',
        'Autoavaliação',
        'Avaliação formativa'
    ],
    
    // Recursos padrão
    RECURSOS: [
        'Quadro',
        'Projetor',
        'Computador',
        'Celular',
        'Internet',
        'Livro didático',
        'Apostila',
        'Cartolina',
        'Papel',
        'Imagens',
        'Vídeos',
        'Mapas',
        'Laboratório',
        'Materiais recicláveis'
    ]
};
