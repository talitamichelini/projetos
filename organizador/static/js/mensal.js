// Telas de histórico mensal, relatório em PDF (prévia) e fechamento do mês.
const resumoMes = (m) => ({
  c: m.tarefas.filter((t) => t.status === "concluido").length,
  e: m.tarefas.filter((t) => t.status === "andamento").length,
  a: m.tarefas.filter((t) => t.status === "atrasado").length,
});
const seloTxt = (s) => `<span class="selo ${s}">${ROTULOS[s]}</span>`;

// Tela: lista de meses arquivados
function telaMeses() {
  const cards = mesesArquivados.map((m) => {
    const r = resumoMes(m);
    return `<div class="card conta"><h3>${m.nome}</h3>
      <div class="nums"><span><b class="v">${r.c}</b>concluídas</span><span><b class="${r.a ? "r" : ""}">${r.a}</b>atrasadas</span></div>
      <div class="acoes" style="margin:0"><a class="btn sec pequeno" href="#/mes/${m.id}">Ver tarefas</a>
      <a class="btn sec pequeno" href="#/relatorio/${m.id}">Relatório PDF</a></div></div>`;
  }).join("");
  return `<div class="topo"><div><h1>Mês anterior</h1><p class="suave">Meses arquivados, para consulta</p></div></div><div class="grade">${cards}</div>`;
}

// Tela: detalhes de um mês arquivado
function telaMes(id) {
  const m = porId(mesesArquivados, id), r = resumoMes(m);
  const itens = m.tarefas.map((t) => `<details class="linha-det"><summary>
      <span><span class="nome">${t.titulo}</span><br><span class="suave">${t.conta} · ${t.prof} · ${t.prazo}</span></span>${seloTxt(t.status)}</summary>
      <div class="det-corpo"><p><b>Observação:</b> ${t.obs || "—"}</p></div></details>`).join("");
  return `<a class="migalha" href="#/meses">← Mês anterior</a>
  <div class="topo"><div><h1>${m.nome}</h1><p class="suave">${r.c} concluídas · ${r.e} em andamento · ${r.a} atrasadas</p></div>
    <div class="acoes" style="margin:0"><a class="btn" href="#/relatorio/${m.id}">Ver relatório PDF</a><button class="btn sec" data-pdf>Baixar PDF</button></div></div>
  <div class="lista">${itens}</div>`;
}

// Tela: prévia do relatório mensal (o PDF real virá do backend)
function telaRelatorio(id) {
  const m = porId(mesesArquivados, id), r = resumoMes(m);
  const linhas = m.tarefas.map((t) => `<tr><td>${t.conta}</td><td>${t.titulo}</td><td>${t.prof}</td>
    <td>${t.prazo}</td><td>${seloTxt(t.status)}</td><td>${t.obs || "—"}</td></tr>`).join("");
  return `<a class="migalha" href="#/mes/${m.id}">← ${m.nome}</a>
  <div class="topo"><h1>Relatório mensal</h1><button class="btn" data-pdf>Baixar PDF</button></div>
  <div class="papel"><h2 style="margin-top:0">Relatório mensal — ${m.nome}</h2>
    <p class="suave">Situação das ${m.tarefas.length} entregas no fechamento do mês:</p>
    <div class="conta"><div class="nums"><span><b class="v">${r.c}</b>concluídas</span><span><b>${r.e}</b>em andamento</span><span><b class="${r.a ? "r" : ""}">${r.a}</b>atrasadas</span></div></div>
    <div class="rolar"><table><thead><tr><th>Conta</th><th>Entrega</th><th>Profissional</th><th>Prazo</th><th>Status final</th><th>Observações</th></tr></thead><tbody>${linhas}</tbody></table></div>
    <p class="suave" style="margin-top:16px">Prévia ilustrativa com dados fictícios.</p></div>`;
}

// Tela: fechamento do mês (somente Gabrielle)
function telaFechamento() {
  const conc = tarefas.filter((t) => t.status === "concluido").length, atras = tarefas.filter(estaAtrasada).length, andam = tarefas.length - conc - atras;
  return `<div class="topo"><div><h1>Fechamento do mês</h1><p class="suave">Outubro 2026 · ${tarefas.length} tarefas · ${conc} concluídas · ${andam} em andamento · ${atras} atrasadas</p></div></div>
  <div class="card painel"><h3 style="margin:0 0 8px">Arquivar mês</h3>
    <p class="suave">Preserva tarefas, status, prazos e observações. Gera o relatório em PDF e deixa o mês disponível em “Mês anterior”. Nenhuma tarefa é levada automaticamente para o mês seguinte.</p>
    <div class="acoes"><button class="btn" id="arquivar">Arquivar mês</button><button class="btn sec" data-pdf>Gerar relatório PDF</button></div>
    <p class="suave" style="margin-top:14px">Depois de arquivar, cadastre o novo planejamento manualmente: <a href="#/nova-tarefa"><u>cadastrar tarefas</u></a>.</p></div>
  <div class="card painel perigo-card" style="margin-top:18px"><h3 style="margin:0 0 8px">Apagar dados do mês</h3>
    <p class="suave">Exclui as tarefas deste mês. <b>A exclusão pode ser permanente e não poderá ser desfeita.</b> Para guardar o histórico, arquive o mês antes.</p>
    <label for="confirma">Para confirmar, digite APAGAR</label><input id="confirma" autocomplete="off">
    <div class="acoes"><button class="btn perigo" id="apagar" disabled>Apagar dados do mês</button></div></div>`;
}
