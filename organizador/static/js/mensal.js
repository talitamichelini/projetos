// ===== Histórico mensal e fechamento =====

async function buscarMesesArquivados() {
  const resposta = await fetch("/api/meses");

  if (!resposta.ok) {
    throw new Error("Não foi possível buscar os meses arquivados.");
  }

  const dados = await resposta.json();
  mesesArquivados = dados.meses;

  return mesesArquivados;
}

// ===== Tela: meses arquivados =====

async function telaMeses() {
  const meses = await buscarMesesArquivados();

  const cards = meses.map((m) => `
    <div class="card conta">
      <h3>${m.nome_mes}</h3>

      <div class="nums">
        <span><b class="v">${m.concluidas}</b>concluídas</span>
        <span><b>${m.andamento}</b>em andamento</span>
        <span><b class="${m.atrasadas ? "r" : ""}">${m.atrasadas}</b>atrasadas</span>
      </div>

      <p class="suave">${m.total_tarefas} tarefas no total</p>
      <p class="suave">Fechado em: ${new Date(m.fechado_em).toLocaleDateString("pt-BR")}</p>
    </div>
  `).join("");

  return `
    <div class="topo">
      <div>
        <h1>Mês anterior</h1>
        <p class="suave">Resumo dos meses arquivados</p>
      </div>
    </div>

    <div class="grade">
      ${cards || '<p class="vazio">Nenhum mês arquivado ainda.</p>'}
    </div>
  `;
}

// ===== Tela: fechamento do mês =====

function telaFechamento() {
  const conc = tarefas.filter((t) => t.status === "concluido").length;
  const atras = tarefas.filter(estaAtrasada).length;
  const andam = tarefas.length - conc - atras;

  return `
    <div class="topo">
      <div>
        <h1>Fechamento do mês</h1>
        <p class="suave">
          ${tarefas.length} tarefas ·
          ${conc} concluídas ·
          ${andam} em andamento ·
          ${atras} atrasadas
        </p>
      </div>
    </div>

    <div class="card painel">
      <h3>Fechar mês</h3>

      <p class="suave">
        Antes de fechar, você pode baixar o relatório em PDF.
        Depois do fechamento, o sistema guardará apenas o resumo
        mensal e removerá as tarefas operacionais.
      </p>

      <div class="acoes">
        <button class="btn sec" id="baixar-pdf">
          Baixar relatório PDF
        </button>

        <button class="btn" id="arquivar">
          Fechar mês
        </button>
      </div>
    </div>
  `;
}