# ⏰ Calculadora de Ponto Pessoal

Este é um Web App simples desenvolvido com HTML, CSS e JavaScript para controle pessoal de jornada de trabalho. A principal funcionalidade é calcular dinamicamente o **próximo horário de ponto necessário** (saída do almoço, volta do almoço, saída final) para garantir exatamente 8 horas trabalhadas, evitando horas extras.

A aplicação é **100% gratuita, sem anúncios** e armazena todos os seus registros de forma privada no seu navegador (`LocalStorage`).

## ✨ Funcionalidades

* **Registro de 4 Pontos:** Entradas e saídas da manhã e da tarde.
* **Cálculo Dinâmico:** Informa o horário exato que você precisa bater o ponto para completar a jornada de 8h, garantindo o mínimo de 1h de almoço.
* **Histórico por Dia:** Armazena os registros por data no seu navegador (LocalStorage).
* **Navegação Inteligente:** Botões "Voltar" e "Avançar" só permitem navegar entre os dias que possuem dados registrados, garantindo que você não perca tempo em dias vazios.
* **Tema Escuro (Dark Mode):** Interface otimizada para uso em dispositivos móveis.
* **Registro Rápido:** Botão "Registrar" para preencher o campo com o horário exato do seu clique.

## 🚀 Como Usar (Passo a Passo)

Para usar o aplicativo no seu celular de forma mais eficiente, recomendamos criar um atalho na tela inicial.

1.  **Acesse o Link:** Abra o link do seu GitHub Pages no navegador do seu celular:
    `https://[seu-usuario].github.io/calculadora-ponto/`

2.  **Crie o Atalho (para Android/Chrome):**
    * Toque no **menu de três pontos** no canto superior direito do Chrome.
    * Selecione **"Adicionar à tela inicial"**.
    * Dê um nome (ex: "Meu Ponto") e confirme.
    * O ícone do seu Web App aparecerá na tela inicial, funcionando como um aplicativo nativo.

3.  **Registro de Ponto:**
    * Ao chegar/sair, clique no botão **"Registrar"** ao lado do campo de hora correspondente.
    * Observe o campo **"Próximo Ponto Recomendado"** para saber exatamente a hora de bater a próxima marcação (principalmente a saída final).

4.  **Navegação no Histórico:**
    * Use os botões **"← Voltar"** e **"Avançar →"** para alternar entre os dias que você já registrou. Se o dia não tiver registro, o botão estará desativado.

## ⚙️ Configuração da Jornada

A lógica de cálculo segue a seguinte regra:

* **Jornada Total:** 8h de trabalho (definida no código JavaScript pela constante `JORNADA_TOTAL_MINUTOS`).
* **Intervalo Mínimo de Almoço:** 1h (definida no código JavaScript pela constante `ALMOCO_MINIMO_MINUTOS`).

## 💾 Sobre o Armazenamento de Dados

Seus dados são armazenados exclusivamente no **`LocalStorage`** do seu navegador (no seu celular).

* **Privacidade:** Os dados **NÃO** são enviados para nenhum servidor ou para o GitHub.
* **Acesso:** Se você limpar o cache ou os dados do seu navegador, todos os seus registros serão perdidos.
