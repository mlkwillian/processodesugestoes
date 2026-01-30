/* =========================
   CONFIGURAÇÃO DOS PARTICIPANTES
   =========================
   Troque os nomes / chances conforme necessário.
   Cada participante: { nome: "Nome", chances: X }
*/
let participantes = [];

const excelInput = document.getElementById("excelInput");

excelInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (evt) {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // primeira aba do Excel
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // converte para JSON
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (rows.length === 0) {
            alert("Planilha vazia");
            return;
        }

        // pega TODAS as colunas, independente da posição
        const colunas = Object.keys(rows[0]);

        // encontra a coluna que contém 'nome'
        const colunaNome = colunas.find(col =>
            col.toLowerCase().includes("nome")
        );

        if (!colunaNome) {
            alert("❌ Nenhuma coluna contendo 'nome' foi encontrada");
            return;
        }

        // soma duplicados como chances
        const mapaChances = {};

        rows.forEach(linha => {
            const valor = linha[colunaNome];
            if (!valor) return;

            const nome = String(valor).trim();
            if (!nome) return;

            mapaChances[nome] = (mapaChances[nome] || 0) + 1;
        });

        // monta participantes
        participantes = Object.entries(mapaChances).map(([nome, chances]) => ({
            nome,
            chances
        }));

        // reset do sorteio
        vencedores = [];
        rebuildExpandedList();
        atualizarInfos();
        atualizarHistorico();

        winnerName.textContent = "—";
        counterSmall.textContent = "Participantes carregados do Excel";

        alert(`✔ ${participantes.length} participantes importados`);
    };

    /* =========================
   LEITURA DA SEGUNDA ABA (PRÊMIOS)
   ========================= */

    if (workbook.SheetNames.length < 2) {
        alert("❌ A planilha precisa ter uma segunda aba com os prêmios");
        return;
    }

    const sheetPremiosName = workbook.SheetNames[1];
    const worksheetPremios = workbook.Sheets[sheetPremiosName];

    // converte para JSON
    const rowsPremios = XLSX.utils.sheet_to_json(worksheetPremios, { defval: "" });

    if (rowsPremios.length === 0) {
        alert("❌ A aba de prêmios está vazia");
        return;
    }

    // pega todas as colunas
    const colunasPremios = Object.keys(rowsPremios[0]);

    // encontra coluna que contenha "premios"
    const colunaPremio = colunasPremios.find(col =>
        col.toLowerCase().includes("premios")
    );

    if (!colunaPremio) {
        alert("❌ Nenhuma coluna contendo 'prêmio' foi encontrada na segunda aba");
        return;
    }

    // monta lista de prêmios
    premios = rowsPremios
        .map(linha => String(linha[colunaPremio]).trim())
        .filter(p => p);

    // reseta prêmios disponíveis
    premiosDisponiveis = [...premios];


    reader.readAsArrayBuffer(file);
});


let premios = [];


/* variáveis do sorteio */
let listaExpandida = [];
let vencedores = [];
const maxSorteios = premios.length;
let premiosDisponiveis = [...premios];


/* elementos DOM */
const btn = document.getElementById('btnSortear');
const participantsCount = document.getElementById('participantsCount');
const infoSub = document.getElementById('infoSub');
const winnerName = document.getElementById('winnerName');
const counterSmall = document.getElementById('counterSmall');
const stateTitle = document.getElementById('stateTitle');
const historyList = document.getElementById('historyList');
const vCard = document.getElementById('vCard');
const winnerPrize = document.getElementById('winnerPrize');

/* inicializa a lista expandida */
function rebuildExpandedList() {
    listaExpandida = [];
    participantes.forEach(p => {
        const n = Math.max(0, Math.floor(Number(p.chances) || 0));
        for (let i = 0; i < n; i++) listaExpandida.push(p.nome);
    });
}

/* atualiza infos visuais */
function atualizarInfos() {
    const uniqueNames = participantes.map(p => p.nome).length;
    participantsCount.textContent = `${participantes.length} participantes cadastrados`;
    infoSub.textContent = `Total de entradas (pesos): ${listaExpandida.length}`;
    counterSmall.textContent = `Sorteios feitos: ${vencedores.length} / ${maxSorteios}`;
    if (vencedores.length >= maxSorteios) {
        btn.disabled = true;
        btn.textContent = "SORTEIOS FINALIZADOS";
        btn.setAttribute('aria-pressed', 'true');
    } else {
        btn.disabled = false;
        btn.textContent = "🎲 SORTEAR AGORA";
        btn.setAttribute('aria-pressed', 'false');
    }
}

/* adiciona no histórico visual */
function atualizarHistorico() {
    historyList.innerHTML = "";
    vencedores.forEach((v, i) => {
        const div = document.createElement('div');
        div.className = 'item';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.innerHTML = `<div style="opacity:0.95;font-weight:800">${i + 1}. ${v}</div><div style="color:var(--dourado);font-weight:900">✓</div>`;
        historyList.appendChild(div);
    });
}

/* animação contador (3..2..1) usando setTimeout encadeado */
function executarContagem(callback) {
    stateTitle.textContent = "SORTEANDO...";
    winnerName.textContent = "";

    let tempo = 3; // começa em 5

    const intervalo = setInterval(() => {
        winnerName.textContent = tempo;

        // reinicia animação
        winnerName.classList.remove("slide-number");
        void winnerName.offsetWidth;
        winnerName.classList.add("slide-number");

        tempo--;
        if (tempo < 1) {
            clearInterval(intervalo);
            setTimeout(() => callback(), 300);
        }
    }, 1000); // troca a cada 0.5s
}



/* revela vencedor (após contagem) */
function revelarVencedor() {
    if (listaExpandida.length === 0 || premiosDisponiveis.length === 0) {
        stateTitle.textContent = "Não há mais sorteios disponíveis";
        winnerName.textContent = "—";
        winnerPrize.textContent = "—";
        atualizarInfos();
        return;
    }

    // sorteia participante
    const idxPessoa = Math.floor(Math.random() * listaExpandida.length);
    const escolhido = listaExpandida[idxPessoa];

    // remove todas as chances desse participante
    listaExpandida = listaExpandida.filter(n => n !== escolhido);

    // sorteia prêmio
    const idxPremio = Math.floor(Math.random() * premiosDisponiveis.length);
    const premio = premiosDisponiveis.splice(idxPremio, 1)[0];

    vencedores.push(`${escolhido} — ${premio}`);

    // UI
    stateTitle.textContent = "🎉 VENCEDOR!";
    winnerName.textContent = escolhido;
    winnerPrize.textContent = premio;
    counterSmall.textContent = `Sorteio ${vencedores.length} de ${maxSorteios}`;

    atualizarHistorico();
    atualizarInfos();

    vCard.animate([
        { transform: 'scale(0.98)' },
        { transform: 'scale(1)' }
    ], { duration: 380 });
}


/* evento do botão */
btn.addEventListener('click', () => {
    if (vencedores.length >= maxSorteios) {
        atualizarInfos();
        return;
    }

    // desativa botão até terminar o processo
    btn.disabled = true;
    stateTitle.textContent = "Preparando...";
    winnerName.textContent = "";

    // executar contagem e depois revelar
    executarContagem(() => {
        revelarVencedor();
        // reabilitar botão se não atingiu o máximo (com pequeno delay p/ UX)
        setTimeout(() => {
            if (vencedores.length < maxSorteios) {
                btn.disabled = false;
            } else {
                btn.disabled = true;
                btn.textContent = "SORTEIOS FINALIZADOS";
            }
        }, 480);
    });
});

/* inicialização */
function init() {
    rebuildExpandedList();
    atualizarInfos();
    atualizarHistorico();
    // mostra traço no campo do vencedor inicialmente
    winnerName.textContent = "—";
    counterSmall.textContent = `Sorteios feitos: ${vencedores.length} / ${maxSorteios}`;
}

init();

/* OBSERVAÇÕES:
 - Para ajustar participantes, edite o array "participantes" no topo.
 - Salve como index.html e abra no navegador.
 - Se quiser som, efeitos extras ou permitir import de CSV, eu adapto.
*/