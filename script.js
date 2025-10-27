// script.js

const JORNADA_TOTAL_MINUTOS = 8 * 60; // 8 horas
const ALMOCO_MINIMO_MINUTOS = 1 * 60; // 1 hora
let dataAtual = new Date(); // Variável global para a data exibida

// --- Utilitários de Data e Tempo ---

// Formata a data para a chave no LocalStorage (AAAA-MM-DD)
function formatDateKey(date) {
    if (!date || isNaN(date.getTime())) return '';
    // Usa uma data neutra (meio-dia) para evitar problemas com fuso horário
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0];
}

// Formata a data para exibição (Dia Semana, DD/MM/AAAA)
function formatDisplayDate(date) {
    if (!date || isNaN(date.getTime())) return 'Data Inválida';
    const todayKey = formatDateKey(new Date());
    const dateKey = formatDateKey(date);
    
    if (dateKey === todayKey) {
        return 'Hoje';
    }
    
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function timeToMinutes(time) {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60) + minutes;
}

function minutesToTime(totalMinutes) {
    if (totalMinutes < 0) totalMinutes = 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60); 
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// --- Funções de LocalStorage ---

// Carrega TODOS os dados do LocalStorage
function getDadosCompletos() {
    const dados = localStorage.getItem('pontosPorDia');
    return dados ? JSON.parse(dados) : {};
}

// Retorna uma lista ordenada e única de todas as chaves de data (AAAA-MM-DD) que possuem registros
function getSortedRecordedDates() {
    const allData = getDadosCompletos();
    // Keys are AAAA-MM-DD strings, so default sort is chronological
    return Object.keys(allData).sort(); 
}

// Salva os dados do dia atual no LocalStorage
function salvarDadosDoDia() {
    const chaveDia = formatDateKey(dataAtual);
    const todosOsDados = getDadosCompletos();
    
    const dadosDoDia = {
        entradaManha: document.getElementById('entradaManha').value,
        saidaAlmoco: document.getElementById('saidaAlmoco').value,
        voltaAlmoco: document.getElementById('voltaAlmoco').value,
        saidaFinal: document.getElementById('saidaFinal').value
    };

    // Só salva se houver pelo menos 1 registro, caso contrário, remove o dia do histórico
    if (Object.values(dadosDoDia).some(v => v)) {
        todosOsDados[chaveDia] = dadosDoDia;
    } else {
        delete todosOsDados[chaveDia];
    }
    
    localStorage.setItem('pontosPorDia', JSON.stringify(todosOsDados));
    // Salva a última data visualizada para carregar na próxima sessão
    localStorage.setItem('dataAtualExibida', chaveDia); 
}

// Carrega os dados para a tela com base na data atual
function carregarDadosDoDia() {
    const chaveDia = formatDateKey(dataAtual);
    const todosOsDados = getDadosCompletos();
    const dadosDoDia = todosOsDados[chaveDia] || {};

    document.getElementById('current-date').textContent = formatDisplayDate(dataAtual);
    
    // Preenche os inputs
    document.getElementById('entradaManha').value = dadosDoDia.entradaManha || '';
    document.getElementById('saidaAlmoco').value = dadosDoDia.saidaAlmoco || '';
    document.getElementById('voltaAlmoco').value = dadosDoDia.voltaAlmoco || '';
    document.getElementById('saidaFinal').value = dadosDoDia.saidaFinal || '';

    calcularPontos();
    updateNavigationButtons(); // Atualiza o estado dos botões após o carregamento
}

// --- Funções de Navegação e Botões ---

function updateNavigationButtons() {
    const sortedDates = getSortedRecordedDates();
    const currentDateKey = formatDateKey(dataAtual);
    
    const btnPrev = document.querySelector('.date-nav-btn[onclick="mudarDia(-1)"]');
    const btnNext = document.querySelector('.date-nav-btn[onclick="mudarDia(1)"]');
    
    const isToday = currentDateKey === formatDateKey(new Date());

    // A lista de datas registradas é a única rota de navegação.
    // Se o dia atual não está registrado, mas é hoje, tratamos "Hoje" como um ponto de entrada/saída.
    
    let currentIndex = sortedDates.indexOf(currentDateKey);
    
    // Se estamos em "Hoje" e hoje não tem registro, a navegação de "Voltar" 
    // deve ir para o último dia registrado.
    if (isToday && currentIndex === -1) {
        btnPrev.disabled = sortedDates.length === 0;
        btnNext.disabled = true; // Não há como avançar a partir de hoje
        return;
    }

    // Se estamos em um dia registrado:
    
    // 'Voltar' fica desativado se for o primeiro dia registrado
    btnPrev.disabled = currentIndex === 0;

    // 'Avançar' fica desativado se:
    // 1. O dia atual é "Hoje".
    // 2. O dia atual é o último dia registrado.
    btnNext.disabled = isToday || currentIndex === sortedDates.length - 1;
}

function mudarDia(delta) {
    salvarDadosDoDia(); 
    
    const todayKey = formatDateKey(new Date());
    const sortedDates = getSortedRecordedDates();
    let currentDateKey = formatDateKey(dataAtual);

    let currentIndex = sortedDates.indexOf(currentDateKey);
    let newIndex;
    
    if (delta === -1) { // VOLTAR
        if (currentDateKey === todayKey && currentIndex === -1 && sortedDates.length > 0) {
            // Caso 1: Está em "Hoje" (sem registro) -> vai para o último dia registrado
            newIndex = sortedDates.length - 1; 
        } else {
            // Caso 2: Está em um dia registrado -> volta para o anterior
            newIndex = currentIndex - 1;
        }
    } else if (delta === 1) { // AVANÇAR
        if (currentDateKey === todayKey) return; // Não avança além de "Hoje"
        
        // Vai para o próximo dia registrado
        newIndex = currentIndex + 1;
    }
    
    // Verifica se a nova data é válida
    if (newIndex >= 0 && newIndex < sortedDates.length) {
        const newDateKey = sortedDates[newIndex];
        // Cria a nova data
        dataAtual = new Date(newDateKey + 'T12:00:00'); 
    } else if (newIndex === sortedDates.length) {
        // Se avançou além do último dia registrado (que não é hoje), vai para "Hoje"
        dataAtual = new Date();
    } else {
        return; // Limites de navegação atingidos
    }
    
    // Garante que se a data é hoje, a variável global esteja atualizada
    if (formatDateKey(dataAtual) === todayKey) {
        dataAtual = new Date();
    }

    carregarDadosDoDia();
}


function registrarPonto(inputId) {
    const isToday = formatDateKey(dataAtual) === formatDateKey(new Date());

    if (isToday) {
        document.getElementById(inputId).value = getCurrentTime();
    } else {
        alert('Você só pode registrar o ponto "Agora" para o dia de hoje. Para dias anteriores, edite manualmente.');
    }
    calcularPontos(); 
}

function limparRegistros() {
    const chaveDia = formatDateKey(dataAtual);
    const todosOsDados = getDadosCompletos();
    
    if (!todosOsDados[chaveDia]) {
        alert('Não há registros para limpar neste dia.');
        return;
    }

    // Remove APENAS o registro do dia atual
    delete todosOsDados[chaveDia]; 
    localStorage.setItem('pontosPorDia', JSON.stringify(todosOsDados));
    
    alert(`Registros do dia ${chaveDia} limpos!`);
    
    // Após limpar, navega para o último dia registrado ou para "Hoje"
    const sortedDates = getSortedRecordedDates();
    if (sortedDates.length > 0) {
        const newDateKey = sortedDates[sortedDates.length - 1];
        dataAtual = new Date(newDateKey + 'T12:00:00');
    } else {
        dataAtual = new Date();
    }
    
    carregarDadosDoDia(); 
}

// --- Lógica Principal de Cálculo ---

function calcularPontos() {
    const entradaManha = document.getElementById('entradaManha').value;
    const saidaAlmoco = document.getElementById('saidaAlmoco').value;
    const voltaAlmoco = document.getElementById('voltaAlmoco').value;
    const saidaFinal = document.getElementById('saidaFinal').value;
    
    const mEntradaManha = timeToMinutes(entradaManha);
    const mSaidaAlmoco = timeToMinutes(saidaAlmoco);
    const mVoltaAlmoco = timeToMinutes(voltaAlmoco);
    const mSaidaFinal = timeToMinutes(saidaFinal);
    
    let totalTrabalhado = 0;
    let proximoPonto = '--:--';
    const isToday = formatDateKey(dataAtual) === formatDateKey(new Date());
    let lunchIntervalMinutes = 0;

    // 1. Cálculo do Intervalo de Almoço (NOVO)
    if (saidaAlmoco && voltaAlmoco && mVoltaAlmoco > mSaidaAlmoco) {
        lunchIntervalMinutes = mVoltaAlmoco - mSaidaAlmoco;
        document.getElementById('lunch-interval').textContent = minutesToTime(lunchIntervalMinutes);
    } else {
        document.getElementById('lunch-interval').textContent = '--:--';
    }


    // 2. Cálculo do tempo trabalhado
    const horasManha = mSaidaAlmoco && mEntradaManha ? (mSaidaAlmoco - mEntradaManha) : 0;
    const horasTarde = mSaidaFinal && mVoltaAlmoco ? (mSaidaFinal - mVoltaAlmoco) : 0;
    
    totalTrabalhado = horasManha + horasTarde;
    
    // Se o dia é hoje, e o último ponto foi a volta do almoço, adiciona o tempo corrido
    if (isToday && mVoltaAlmoco && !mSaidaFinal) {
        const tempoCorridoTarde = timeToMinutes(getCurrentTime()) - mVoltaAlmoco;
        if (tempoCorridoTarde > 0) {
            totalTrabalhado += tempoCorridoTarde;
        }
    }

    // 3. Lógica do Próximo Ponto (foco em guiar o usuário HOJE)
    if (isToday) {
        if (!entradaManha) {
            proximoPonto = 'Registar Entrada';
        } else if (!saidaAlmoco) {
            // Saída para almoço (4h após a entrada)
            const saidaMinima = mEntradaManha + JORNADA_TOTAL_MINUTOS / 2;
            proximoPonto = minutesToTime(saidaMinima) + ' (Saída Almoço)';
        } else if (!voltaAlmoco) {
            // Volta mínima (1h após a saída)
            const faltaAlmoco = ALMOCO_MINIMO_MINUTOS - lunchIntervalMinutes;
            if (faltaAlmoco > 0 && mSaidaAlmoco) {
                const voltaMinima = mSaidaAlmoco + faltaAlmoco;
                proximoPonto = minutesToTime(voltaMinima) + ' (Volta Almoço)';
            } else {
                proximoPonto = 'Volta Almoço (Hora Flexível)';
            }
        } else if (voltaAlmoco && !saidaFinal) {
            // Calcular Saída Final para dar 8h
            const tempoFaltante = JORNADA_TOTAL_MINUTOS - horasManha;
            
            const minutosTardeNecessarios = Math.max(0, tempoFaltante); 
            
            const saidaPrevista = mVoltaAlmoco + minutosTardeNecessarios;
            
            proximoPonto = minutesToTime(saidaPrevista) + ' (Saída Final)';
        } else {
            // Se todos os 4 pontos foram batidos
            const minutosRestantes = JORNADA_TOTAL_MINUTOS - totalTrabalhado;
            if (minutosRestantes > 0) {
                proximoPonto = `Faltam ${minutesToTime(minutosRestantes)} p/ 8h`;
            } else if (minutosRestantes < 0) {
                proximoPonto = `+ ${minutesToTime(Math.abs(minutosRestantes))} (Extra!)`;
            } else {
                proximoPonto = 'Jornada Perfeita (8:00)!';
            }
        }
    } else {
        // Se não é hoje, não há "próximo ponto" dinâmico
        proximoPonto = 'Dia Passado/Futuro';
    }


    // 4. Exibição e Salvação
    document.getElementById('total-trabalhado').textContent = minutesToTime(totalTrabalhado);
    document.getElementById('next-point').textContent = proximoPonto;
    
    // Salva os dados (necessário para atualizar o histórico ao editar)
    salvarDadosDoDia();
    updateNavigationButtons();
}

// --- Inicialização ---

function inicializarApp() {
    const ultimaDataKey = localStorage.getItem('dataAtualExibida');
    const sortedDates = getSortedRecordedDates();
    
    if (ultimaDataKey && getDadosCompletos()[ultimaDataKey]) {
        // Carrega o último dia com registro
        dataAtual = new Date(ultimaDataKey + 'T12:00:00');
    } else if (sortedDates.length > 0) {
        // Se a data salva estiver vazia/limpa, vai para o último dia registrado
        dataAtual = new Date(sortedDates[sortedDates.length - 1] + 'T12:00:00');
    } else {
        // Se não houver registros, usa hoje
        dataAtual = new Date();
    }
    
    // Adiciona listener para garantir que o salvamento ocorra antes de fechar a aba
    window.addEventListener('beforeunload', salvarDadosDoDia);

    carregarDadosDoDia();
}

window.onload = inicializarApp;
