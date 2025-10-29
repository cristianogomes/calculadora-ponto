// script.js

const JORNADA_TOTAL_MINUTOS = 8 * 60; // 8 horas
const ALMOCO_MINIMO_MINUTOS = 1 * 60; // 1 hora
const NOTIFICATION_KEY = 'saidaNotification'; // Chave para salvar a notificação
let dataAtual = new Date(); // Variável global para a data exibida
let notificationTimeout = null; // Para armazenar o ID do setTimeout

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
    const todayKey = formatDateKey(new Date());
    
    const btnPrev = document.querySelector('.date-nav-btn[onclick="mudarDia(-1)"]');
    const btnNext = document.querySelector('.date-nav-btn[onclick="mudarDia(1)"]');
    
    let currentIndex = sortedDates.indexOf(currentDateKey);
    let isToday = currentDateKey === todayKey;

    // 'Voltar' fica desativado se:
    // 1. Não há registros (length === 0)
    // 2. Se for o primeiro dia registrado
    btnPrev.disabled = sortedDates.length === 0 || currentIndex === 0;

    // 'Avançar' fica desativado se:
    // 1. O dia atual é "Hoje".
    // 2. O dia atual é o último dia registrado.
    btnNext.disabled = isToday || (sortedDates.length > 0 && currentIndex === sortedDates.length - 1);
}

function mudarDia(delta) {
    salvarDadosDoDia(); 
    
    const todayKey = formatDateKey(new Date());
    const sortedDates = getSortedRecordedDates();
    let currentDateKey = formatDateKey(dataAtual);
    
    // Calcula o índice atual da data na lista de registros
    let currentIndex = sortedDates.indexOf(currentDateKey);

    if (delta === -1) { // VOLTAR
        // Se está em "Hoje" (sem registro) e há dias registrados:
        if (currentDateKey === todayKey && currentIndex === -1 && sortedDates.length > 0) {
             // Vai para o último dia registrado
            const newDateKey = sortedDates[sortedDates.length - 1];
            dataAtual = new Date(newDateKey + 'T12:00:00');
        } else if (currentIndex > 0) {
            // Vai para o dia registrado anterior
            const newDateKey = sortedDates[currentIndex - 1];
            dataAtual = new Date(newDateKey + 'T12:00:00');
        } else {
            return; // Limite atingido (primeiro dia registrado)
        }
    } else if (delta === 1) { // AVANÇAR
        if (currentDateKey === todayKey) return; // Não avança além de "Hoje"

        // Vai para o próximo dia registrado ou para hoje
        if (currentIndex !== -1 && currentIndex < sortedDates.length - 1) {
            // Vai para o próximo dia registrado
            const newDateKey = sortedDates[currentIndex + 1];
            dataAtual = new Date(newDateKey + 'T12:00:00');
        } else if (currentIndex === sortedDates.length - 1) {
            // Se estava no último dia registrado, vai para hoje
            dataAtual = new Date();
        } else {
            return; // Limites de navegação atingidos
        }
    }

    // Se a data é hoje, atualiza a variável global para o momento exato
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
    
    // Desliga a notificação se for o dia atual
    if (formatDateKey(dataAtual) === formatDateKey(new Date())) {
        toggleNotification(true);
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
    document.getElementById('total-trabalhado').textContent = minutesToTime(horasManha + horasTarde);
    document.getElementById('next-point').textContent = proximoPonto;
    
    salvarDadosDoDia();
    updateNotificationButton(); // Atualiza o estado do botão de notificação
}


// Função para solicitar permissão de notificação (sem alterações)
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('Este navegador/dispositivo não suporta notificações.');
        return Promise.resolve('denied');
    }
    return Notification.requestPermission();
}

/**
 * Agenda a notificação para a hora de saída.
 * @param {string} saidaTimeStr Hora de saída prevista (HH:MM).
 */
function scheduleNotification(saidaTimeStr) {
    clearTimeout(notificationTimeout); // 1. Limpa qualquer agendamento anterior

    const [saidaH, saidaM] = saidaTimeStr.split(':').map(Number);
    const now = new Date();
    const saidaDate = new Date();
    
    saidaDate.setHours(saidaH, saidaM, 0, 0);

    const timeUntilSaida = saidaDate.getTime() - now.getTime();

    // 2. CHECAGEM CRÍTICA: Se a hora de saída já passou ou falta menos de 1 minuto, não agenda.
    // 60000ms = 1 minuto
    if (timeUntilSaida <= 60000) { 
        alert(`Não foi possível agendar. A hora de saída (${saidaTimeStr}) já passou ou está a menos de 1 minuto.`);
        localStorage.removeItem(NOTIFICATION_KEY);
        updateNotificationButton();
        return;
    }

    // 3. Agenda o alarme
    notificationTimeout = setTimeout(() => {
        new Notification('🚨 HORA DO PONTO!', {
            body: `Está na hora de bater seu último ponto (${saidaTimeStr}) para não fazer hora extra.`,
            vibrate: [200, 100, 200, 100, 200]
        });
        localStorage.removeItem(NOTIFICATION_KEY); // Desativa após disparar
        updateNotificationButton();
    }, timeUntilSaida);

    // 4. Salva o estado como ATIVO
    localStorage.setItem(NOTIFICATION_KEY, saidaTimeStr); 
    updateNotificationButton();
    new Notification('Lembrete Agendado!', { body: `Você será notificado às ${saidaTimeStr}.` });
}

function updateNotificationButton() {
    const btn = document.getElementById('toggle-notification');
    const saidaAgendada = localStorage.getItem(NOTIFICATION_KEY);
    const nextPointText = document.getElementById('next-point').textContent;
    const isToday = formatDateKey(dataAtual) === formatDateKey(new Date());

    const isSaidaFinalCalculada = nextPointText.includes('Saída Final');

    // Desliga e mostra o estado
    btn.disabled = false;
    if (!isToday) {
        btn.textContent = 'Lembrete disponível apenas para Hoje';
        btn.style.backgroundColor = '#6c757d';
        btn.disabled = true;
        clearTimeout(notificationTimeout);
        return;
    }

    if (saidaAgendada) {
        btn.textContent = `🔔 Lembrete ATIVO para: ${saidaAgendada}`;
        btn.style.backgroundColor = '#FF5722'; // Laranja para ATIVO
        btn.onclick = () => { toggleNotification(true); }; 
    } else if (isSaidaFinalCalculada) {
        const saidaPrevistaStr = nextPointText.split(' ')[0];
        btn.textContent = `🔔 Ativar Lembrete para ${saidaPrevistaStr}`;
        btn.style.backgroundColor = '#007bff';
        btn.onclick = toggleNotification; 
    } else {
         btn.textContent = `Aguardando Saída Final...`;
         btn.style.backgroundColor = '#6c757d';
         btn.disabled = true;
    }
}

// A função updateNotificationButton permanece inalterada
function toggleNotification(forceOff = false) {
    if (forceOff || localStorage.getItem(NOTIFICATION_KEY)) {
        // Desligar (Este bloco foi o que disparou instantaneamente antes)
        clearTimeout(notificationTimeout);
        localStorage.removeItem(NOTIFICATION_KEY);
        updateNotificationButton();
        new Notification('Lembrete Desativado', { body: 'O alarme de saída foi cancelado.' });
        return;
    }

    // Ligar
    const nextPointText = document.getElementById('next-point').textContent;
    const isSaidaFinalCalculada = nextPointText.includes('Saída Final');

    if (isSaidaFinalCalculada) {
        const saidaPrevistaStr = nextPointText.split(' ')[0];
        
        requestNotificationPermission().then(permission => {
            if (permission === 'granted') {
                scheduleNotification(saidaPrevistaStr); // Chama a nova função de agendamento
            } else {
                alert('Permissão de notificação negada. Verifique as configurações do seu navegador/PWA.');
            }
        });
    } else {
        alert('A hora de Saída Final ainda não foi calculada.');
    }
}


// --- Inicialização ---

function inicializarApp() {
    const todayKey = formatDateKey(new Date());
    const ultimaDataKey = localStorage.getItem('dataAtualExibida');
    const sortedDates = getSortedRecordedDates();
    
    let isToday = false;

    // CORREÇÃO DO BUG: Se a última data salva é diferente de hoje, força a data de hoje.
    if (!ultimaDataKey || ultimaDataKey !== todayKey) {
        // Se a última data salva não é hoje, ou é a primeira vez que abre.
        dataAtual = new Date();
        isToday = true;
    } else {
        // Se a última data salva é hoje, carrega o objeto Date salvo.
        dataAtual = new Date(ultimaDataKey + 'T12:00:00');
    }
    
    // Tenta reativar a notificação salva ao carregar a página
    const saidaAgendada = localStorage.getItem(NOTIFICATION_KEY);
    if (isToday && saidaAgendada) {
        scheduleNotification(saidaAgendada);
    }
    
    window.addEventListener('beforeunload', salvarDadosDoDia);

    carregarDadosDoDia();
}

window.onload = inicializarApp;
