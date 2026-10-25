
// ===== Funções auxiliares =====
const $app = document.getElementById("app");

let contas = [];
let profissionais = [];
let tarefas = [];

async function buscarTarefas() {
  const resposta = await fetch("/api/tarefas");

  if (!resposta.ok) {
    throw new Error("Não foi possível buscar as tarefas.");
  }

  const dados = await resposta.json();

  return dados.tarefas.map((t) => ({
    ...t,
    id: Number(t.id),
    contaId: Number(t.conta_id),
    profId: Number(t.profissional_id),
    servicoId: Number(t.servico_id),
    prazo: new Date(String(t.prazo).replace(" ", "T")),
    obs: t.observacao || "",
    servico: t.servico_nome || "",
    status: t.status || "andamento"
  }));
}

async function carregarDadosReais() {
  const [resContas, resProfissionais, resTarefas] =
    await Promise.all([
      fetch("/api/contas"),
      fetch("/api/profissionais"),
      fetch("/api/tarefas")
    ]);

  if (!resContas.ok || !resProfissionais.ok || !resTarefas.ok) {
    throw new Error("Não foi possível carregar os dados do sistema.");
  }

  const [dadosContas, dadosProfissionais, dadosTarefas] =
    await Promise.all([
      resContas.json(),
      resProfissionais.json(),
      resTarefas.json()
    ]);

  contas = dadosContas.contas.map((c) => ({
    ...c,
    id: Number(c.id)
  }));

  profissionais = dadosProfissionais.profissionais.map((p) => ({
    ...p,
    id: Number(p.id)
  }));

  tarefas = dadosTarefas.tarefas.map((t) => ({
    ...t,
    id: Number(t.id),
    contaId: Number(t.conta_id),
    profId: Number(t.profissional_id),
    servicoId: Number(t.servico_id),
    prazo: new Date(String(t.prazo).replace(" ", "T")),
    obs: t.observacao || "",
    servico: t.servico_nome || "",
    status: t.status || "andamento"
  }));
}

async function buscarContas() {
  const resposta = await fetch("/api/contas");

  if (!resposta.ok) {
    throw new Error("Não foi possível buscar as contas.");
  }

  const dados = await resposta.json();
  return dados.contas;
}

async function buscarProfissionais() {
  const resposta = await fetch("/api/profissionais");

  if (!resposta.ok) {
    throw new Error("Não foi possível buscar os profissionais.");
  }

  const dados = await resposta.json();
  return dados.profissionais;
}

const porId = (lista, id) => lista.find((i) => i.id === Number(id));

// Status exibido: "atrasado" é calculado automaticamente pelo prazo.
function statusDe(t) {
  if (t.status === "concluido") return "concluido";
  return t.prazo < new Date() ? "atrasado" : "andamento";
}

const estaAtrasada = (t) => t.status !== "concluido" && t.prazo < new Date();
const precisaAtencao = (t) => statusDe(t) === "atrasado";

const ROTULOS = {
  concluido: "Concluído",
  andamento: "Em andamento",
  atrasado: "Atrasado"
};

const selo = (t) =>
  `<span class="selo ${statusDe(t)}">${ROTULOS[statusDe(t)]}</span>`;

const dataBR = (d) =>
  d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short"
  }) +
  " às " +
  d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

const prazoHtml = (t) =>
  `<span class="${estaAtrasada(t) ? "prazo-atraso" : ""}">${dataBR(t.prazo)}</span>`;

const paraInput = (d) =>
  new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

function avisar(msg) {
  const el = document.getElementById("aviso");
  el.textContent = msg;
  el.classList.add("visivel");
  setTimeout(() => el.classList.remove("visivel"), 3200);
}

const NAO_CONECTADO =
  "Protótipo: esta ação ainda não está conectada a um banco de dados.";

// Linha de tarefa (reutilizada em várias telas)
function linhaTarefa(t, mostrarConta) {
  const conta = porId(contas, t.contaId).nome;
  const prof = porId(profissionais, t.profId).nome;

  return `<a class="linha ${precisaAtencao(t) ? "destaque" : ""}" href="#/tarefa/${t.id}">
    <span class="nome">${t.titulo}</span>
    <span>${selo(t)}</span>
    <span class="suave">${mostrarConta ? conta + " · " : ""}${prof}</span>
    <span class="suave">${prazoHtml(t)}</span>
  </a>`;
}

// ===== Filtro por status (Painel) =====
let filtroStatus = "todas";

const FILTROS = [
  ["todas", "Todas"],
  ["andamento", "Em andamento"],
  ["concluido", "Concluídas"],
  ["atrasado", "Atrasadas"]
];

const areaDe = (t) =>
  t.servico || porId(profissionais, t.profId).area;

const areasEm = (lista) => {
  const ordem = (a) => (AREAS.includes(a) ? AREAS.indexOf(a) : 99);

  return [...new Set(lista.map(areaDe))]
    .sort((a, b) => ordem(a) - ordem(b) || a.localeCompare(b));
};

function chipsStatus() {
  return FILTROS.map(([k, nome]) => {
    const n = tarefas.filter(
      (t) => k === "todas" || statusDe(t) === k
    ).length;

    return `<button class="chip ${filtroStatus === k ? "ativo" : ""}" data-status="${k}">${nome} (${n})</button>`;
  }).join("");
}

function corpoPainel() {
  const peso = { atrasado: 0, andamento: 1, concluido: 2 };

  const grupos = contas.map((c) => ({
    c,
    ts: tarefas
      .filter(
        (t) =>
          t.contaId === c.id &&
          (filtroStatus === "todas" || statusDe(t) === filtroStatus)
      )
      .sort(
        (a, b) =>
          peso[statusDe(a)] - peso[statusDe(b)] ||
          a.prazo - b.prazo
      )
  })).filter((g) => g.ts.length);

  if (!grupos.length) {
    return '<p class="vazio">Nenhuma tarefa com este status.</p>';
  }

  return grupos.map((g) => `
    <h3 class="grupo">
      <a href="#/conta/${g.c.id}">${g.c.nome}</a>
      <span class="suave">· ${g.ts.length}</span>
    </h3>
    <div class="lista">
      ${g.ts.map((t) => linhaTarefa(t, false)).join("")}
    </div>
  `).join("");
}

// ===== Tela 1: Painel =====
function telaPainel() {
  const pend = tarefas.filter((t) => t.status !== "concluido").length;
  const conc = tarefas.filter((t) => t.status === "concluido").length;
  const atras = tarefas.filter(estaAtrasada).length;

  return `
    <div class="topo">
      <div>
        <h1>Olá, Gabrielle</h1>
        <p class="suave">Visão geral de todas as contas</p>
      </div>
      <a class="btn" href="#/nova-tarefa">Cadastrar tarefa</a>
    </div>

    <div class="resumo">
      <a class="card" href="#/contas">
        <span class="suave">Contas</span>
        <div class="numero">${contas.length}</div>
      </a>
      <div class="card">
        <span class="suave">Entregas pendentes</span>
        <div class="numero">${pend}</div>
      </div>
      <div class="card">
        <span class="suave">Concluídas</span>
        <div class="numero v">${conc}</div>
      </div>
      <div class="card">
        <span class="suave">Atrasadas</span>
        <div class="numero r">${atras}</div>
      </div>
    </div>

    <h2>Tarefas por conta</h2>
    <div class="faixa">
      Tarefas atrasadas geram um alerta por e-mail para Gabrielle.
      O envio será feito pelo sistema na versão com backend.
    </div>

    <div class="filtros">${chipsStatus()}</div>
    ${corpoPainel()}

    <p style="margin-top:20px">
      <a class="btn sec" href="#/contas">Ver contas cadastradas</a>
    </p>
  `;
}

async function telaProfissionais() {
  const profissionais = await buscarProfissionais();

  const respostaServicos = await fetch("/api/servicos");
  if (!respostaServicos.ok) {
    throw new Error("Não foi possível carregar os serviços.");
  }
  const dadosServicos = await respostaServicos.json();
  const servicos = dadosServicos.servicos;

  const cardsProfissionais = profissionais.map((p) => `
    <div class="card conta">
      <h3>${p.nome}</h3>
      <p class="suave">${p.area || "Serviço não informado"}</p>
    </div>
  `).join("");

  const cardsServicos = servicos.map((s) => `
    <div class="card conta">
      <h3>${s.nome}</h3>
    </div>
  `).join("");

  return `
    <div class="topo">
      <div>
        <h1>Cadastros</h1>
        <p class="suave">Gerencie profissionais e serviços.</p>
      </div>
    </div>

    <form class="card painel" id="form-profissional">
      <label for="nome-profissional">Nome do profissional</label>
      <input id="nome-profissional"
        placeholder="Ex.: Ana Souza">

      <label for="area-profissional">Serviço</label>
      <input id="area-profissional"
        placeholder="Ex.: Design, Mídia paga">

      <button class="btn" type="submit">Salvar cadastro</button>
      <p class="suave">
        Preencha um campo ou os dois.
      </p>
    </form>

    <h2>Profissionais cadastrados</h2>
    <div class="grade">
      ${cardsProfissionais || '<p class="vazio">Nenhum profissional cadastrado.</p>'}
    </div>

    <h2>Serviços cadastrados</h2>
    <div class="grade">
      ${cardsServicos || '<p class="vazio">Nenhum serviço cadastrado.</p>'}
    </div>
  `;
}

 // ===== Tela 2: Contas =====
function telaContas(listaContas = contas) {
  const cards = listaContas.map((c) => {
    return `<div class="card conta">
      <h3>${c.nome}</h3>
      <a class="btn sec pequeno" href="#/conta/${c.id}">Abrir conta</a>
    </div>`;
  }).join("");

  return `<div class="topo">
    <div>
      <h1>Contas</h1>
      <p class="suave">${listaContas.length} clientes cadastrados</p>
    </div>
  </div>

  <form class="card painel" id="form-conta">
    <label for="nome-conta">Nome do cliente</label>
    <input id="nome-conta" name="nome" required
      placeholder="Ex.: Clínica São Lucas">
    <button class="btn" type="submit">Cadastrar cliente</button>
  </form>

  <h2>Clientes cadastrados</h2>
  <div class="grade">
    ${cards || '<p class="vazio">Nenhum cliente cadastrado ainda.</p>'}
  </div>`;
}

// ===== Tela 3: Detalhes da conta =====
let filtroProf = 0;

function telaConta(id) {
  const conta = porId(contas, id);

  if (!conta) {
    return '<p class="vazio">Conta não encontrada.</p>';
  }

  const daConta = tarefas.filter((t) => t.contaId === conta.id);

  const profs = profissionais.filter(
    (p) => daConta.some((t) => t.profId === p.id)
  );

  const visiveis = daConta.filter(
    (t) => !filtroProf || t.profId === filtroProf
  );

  const chips = [
    `<button class="chip ${!filtroProf ? "ativo" : ""}" data-prof="0">Todos</button>`
  ].concat(
    profs.map(
      (p) => `<button class="chip ${filtroProf === p.id ? "ativo" : ""}" data-prof="${p.id}">${p.nome}</button>`
    )
  ).join("");

  const secoes = areasEm(visiveis).map((area) => {
    const lista = visiveis.filter((t) => areaDe(t) === area);

    if (!lista.length) return "";

    return `<h2>${area}</h2>
      <div class="lista">
        ${lista.map((t) => linhaTarefa(t, false)).join("")}
      </div>`;
  }).join("");

  return `<a class="migalha" href="#/contas">← Contas</a>
    <div class="topo">
      <div>
        <h1>${conta.nome}</h1>
        <p class="suave">${daConta.length} entregas nesta conta</p>
      </div>
      <a class="btn" href="#/nova-tarefa?conta=${conta.id}">Cadastrar tarefa</a>
    </div>
    <div class="filtros" id="filtros">${chips}</div>
    ${secoes || '<p class="vazio">Nenhuma entrega para este filtro.</p>'}`;
}

// ===== Tela 4: Detalhes da tarefa =====
function telaTarefa(id) {
  const t = porId(tarefas, id);

  if (!t) {
    return '<p class="vazio">Tarefa não encontrada.</p>';
  }

  const conta = porId(contas, t.contaId);
  const prof = porId(profissionais, t.profId);

  return `<a class="migalha" href="#/conta/${conta.id}">← ${conta.nome}</a>
    <div class="card painel">
      <div class="topo" style="margin-bottom:16px">
        <h1>${t.titulo}</h1>
        ${selo(t)}
      </div>
      <dl class="detalhes">
        <div><dt>Conta do cliente</dt><dd>${conta.nome}</dd></div>
        <div><dt>Profissional responsável</dt><dd>${prof.nome} <span class="suave">(${prof.area})</span></dd></div>
        <div><dt>Prazo</dt><dd>${prazoHtml(t)}</dd></div>
        <div><dt>Status atual</dt><dd>${selo(t)}</dd></div>
      </dl>
      ${estaAtrasada(t) ? '<div class="faixa" style="margin-top:20px">Tarefa atrasada: alerta por e-mail previsto para Gabrielle (envio real será feito pelo backend).</div>' : ""}
      <label for="obs">Observação</label>
      <textarea id="obs" placeholder="Impedimentos, justificativa de atraso ou atualizações importantes">${t.obs}</textarea>
      <div class="acoes">
        <a class="btn" href="#/nova-tarefa?editar=${t.id}">Editar</a>
        <button class="btn perigo" id="excluir" data-excluir="${t.id}">Excluir</button>
      </div>
    </div>`;
}

// ===== Cadastro / edição de tarefa =====
async function telaForm(params) {
  const contas = await buscarContas();
  const profissionais = await buscarProfissionais();
  
  const idEdicao = Number(params.get("editar")) || null;
  const tarefaEdicao = idEdicao
    ? tarefas.find((t) => t.id === idEdicao)
    : null;

  if (idEdicao && !tarefaEdicao) {
  throw new Error("Tarefa não encontrada para edição.");
  }

  const respostaServicos = await fetch("/api/servicos");
  if (!respostaServicos.ok) {
    throw new Error("Não foi possível carregar os serviços.");
  }
  const dadosServicos = await respostaServicos.json();
  const servicos = dadosServicos.servicos;

  const opc = (lista, sel, txt) =>
    lista.map((i) =>
      `<option value="${i.id}" ${i.id === sel ? "selected" : ""}>${txt(i)}</option>`
    ).join("");
  
  const contaSel = tarefaEdicao
    ? tarefaEdicao.contaId
    : Number(params.get("conta")) || "";

  const profSel = tarefaEdicao ? tarefaEdicao.profId : "";
  const servicoSel = tarefaEdicao ? tarefaEdicao.servicoId : "";

  return `
    <a class="migalha" href="javascript:history.back()">← Voltar</a>
    <h1>${tarefaEdicao ? "Editar tarefa" : "Nova tarefa"}</h1>

    <form class="card painel" id="form" data-editar="${idEdicao || ""}">
      <label for="conta">Conta do cliente</label>
      <select id="conta" required>
        <option value="">Selecione</option>
        ${opc(contas, contaSel, (c) => c.nome)}
      </select>

      <label for="nome">Nome da entrega</label>
      <input id="nome" required placeholder="Ex.: Criar campanha"
        value="${tarefaEdicao ? tarefaEdicao.titulo : ""}">
      <label for="prof">Profissional responsável</label>
      <select id="prof" required>
        <option value="">Selecione</option>
        ${opc(profissionais, profSel, (p) => p.nome)}
      </select>

      <label for="servico">Serviço</label>
      <select id="servico" required>
        <option value="">Selecione um serviço</option>
        ${opc(servicos, servicoSel, (s) => s.nome)}
      </select>

      <label for="prazo">Prazo</label>
      <input id="prazo" type="datetime-local" required
        value="${tarefaEdicao ? paraInput(tarefaEdicao.prazo) : ""}">
      <label for="obsini">
        Observação inicial <span class="suave">(opcional)</span>
      </label>
      <textarea id="obsini">${tarefaEdicao ? tarefaEdicao.obs : ""}</textarea>

      <div class="acoes">
        <button class="btn" type="submit">
          ${tarefaEdicao ? "Salvar alterações" : "Cadastrar tarefa"}
      </button>
        <a class="btn sec" href="javascript:history.back()">Cancelar</a>
      </div>
    </form>`;
}

// ===== Perfil (apenas para a prévia; NÃO é autenticação real) =====
let perfil = 0;

const ehAdmin = () => perfil === 0;

const MENU_ADMIN = [
  ["#/", "dashboard", "Painel"],
  ["#/contas", "contas", "Contas"],
  ["#/profissionais", "profissionais", "Profissionais"],
  ["#/nova-tarefa", "nova", "Nova tarefa"],
  ["#/meses", "meses", "Mês anterior"],
  ["#/fechamento", "fechamento", "Fechar mês"]
];

function faixaPerfil() {
  const ops =
    `<option value="0">Gabrielle (administração)</option>` +
    profissionais.map(
      (p) => `<option value="${p.id}" ${p.id === perfil ? "selected" : ""}>${p.nome} (profissional)</option>`
    ).join("");

  return `<div class="perfil">
    <label for="perfil">Prévia de acesso:</label>
    <select id="perfil">${ops}</select>
  </div>`;
}

// Tela do profissional: só as próprias tarefas (dados ainda fictícios)
function telaMinhas() {
  const p = porId(profissionais, perfil);

  if (!p) {
    return '<p class="vazio">Profissional não encontrado.</p>';
  }

  const minhas = tarefas
    .filter((t) => t.profId === perfil)
    .sort((a, b) => a.prazo - b.prazo);

  const cards = minhas.map((t) => `<div class="card">
    <div class="topo" style="margin-bottom:10px">
      <div>
        <div class="nome">${t.titulo}</div>
        <p class="suave">${porId(contas, t.contaId).nome} · Prazo: ${prazoHtml(t)}</p>
      </div>
      ${selo(t)}
    </div>
    <button class="switch" role="switch" aria-checked="${t.status === "concluido"}" data-toggle="${t.id}">
      <span class="knob"></span>Concluída
    </button>
    <label for="obs${t.id}">Observação</label>
    <textarea id="obs${t.id}" placeholder="Atualizações, justificativas ou informações relevantes">${t.obs}</textarea>
    <div class="acoes">
      <button class="btn sec pequeno" data-salvar-obs="${t.id}">Atualizar observação</button>
    </div>
  </div>`).join("");

  return `<div class="topo">
    <div>
      <h1>Minhas tarefas</h1>
      <p class="suave">${p.nome} · ${p.area}</p>
    </div>
  </div>
  <div class="pilha">${cards || '<p class="vazio">Nenhuma tarefa atribuída.</p>'}</div>`;
}

// ===== Navegação (rotas por #) =====

async function renderizar() {
  try {
    await carregarDadosReais();
  } catch (erro) {
    console.error(erro);
    $app.innerHTML =
      '<p class="vazio">Não foi possível carregar os dados. Verifique se o Flask está funcionando.</p>';
    return;
  }

  const [caminho, query] = (location.hash.slice(1) || "/").split("?");
  const params = new URLSearchParams(query || "");
  const [, rota, id] = caminho.split("/");

  let html;
  let ativo = "dashboard";

  if (!ehAdmin()) {
    html = telaMinhas();
    ativo = "minhas";
    
  } else if (rota === "profissionais") {
    try {
      html = await telaProfissionais();
    } catch (erro) {
      console.error(erro);
      html = '<p class="vazio">Não foi possível carregar os profissionais.</p>';
    }
    ativo = "profissionais";

  } else if (rota === "contas") {
    try {
      const contasReais = await buscarContas();
      html = telaContas(contasReais);
    } catch (erro) {
      console.error(erro);
      html = '<p class="vazio">Não foi possível carregar as contas. Verifique se o Flask está funcionando.</p>';
    }
    ativo = "contas";
  } else if (rota === "conta" && porId(contas, id)) {
    html = telaConta(id);
    ativo = "contas";
  } else if (rota === "tarefa" && porId(tarefas, id)) {
    html = telaTarefa(id);
    ativo = "contas";
  } else if (rota === "nova-tarefa") {
  try {
    html = await telaForm(params);
  } catch (erro) {
    console.error(erro);
    html = '<p class="vazio">Não foi possível carregar o formulário. Verifique se o Flask está funcionando.</p>';
  }
  ativo = "nova";
  } else if (rota === "meses") {
    html = telaMeses();
    ativo = "meses";
  } else if (rota === "mes" && porId(mesesArquivados, id)) {
    html = telaMes(id);
    ativo = "meses";
  } else if (rota === "relatorio" && porId(mesesArquivados, id)) {
    html = telaRelatorio(id);
    ativo = "meses";
  } else if (rota === "fechamento") {
    html = telaFechamento();
    ativo = "fechamento";
  } else {
    html = telaPainel();
  }

  const menu = ehAdmin()
    ? MENU_ADMIN
    : [["#/", "minhas", "Minhas tarefas"]];

  document.getElementById("nav").innerHTML =
    `<div class="marca">Acompanhamento</div>` +
    menu.map(
      ([h, r, txt]) => `<a href="${h}" data-rota="${r}" class="${r === ativo ? "ativo" : ""}">${txt}</a>`
    ).join("");

  $app.innerHTML = faixaPerfil() + html;
  window.scrollTo(0, 0);

  const filtros = document.getElementById("filtros");

  if (filtros) {
    filtros.onclick = (e) => {
      if (e.target.dataset.prof === undefined) return;
      filtroProf = Number(e.target.dataset.prof);
      renderizar();
    };
  }
  
const form = document.getElementById("form");

if (form) {
  form.onsubmit = async (e) => {
    e.preventDefault();

    const idEdicao = Number(form.dataset.editar) || null;

    const conta_id = Number(document.getElementById("conta").value);
    const titulo = document.getElementById("nome").value.trim();
    const profissional_id = Number(document.getElementById("prof").value);
    const servico_id = Number(document.getElementById("servico").value);
    const prazo = document.getElementById("prazo").value;
    const observacao = document.getElementById("obsini").value.trim();

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;

    try {
      const resposta = await fetch(
        idEdicao
          ? `/api/tarefas/${idEdicao}`
          : "/api/tarefas",
        {
          method: idEdicao ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conta_id,
            profissional_id,
            servico_id,
            titulo,
            prazo: prazo.replace("T", " "),
            observacao,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Não foi possível salvar a tarefa."
        );
      }

      avisar(
        idEdicao
          ? "Tarefa atualizada com sucesso!"
          : "Tarefa cadastrada com sucesso!"
      );

      location.hash = "#/";
    } catch (erro) {
      avisar(erro.message || "Não foi possível salvar a tarefa.");
      botao.disabled = false;
    }
  };
}
  
const formProfissional = document.getElementById("form-profissional");

if (formProfissional) {
  formProfissional.onsubmit = async (e) => {
    e.preventDefault();

    const nome = document
      .getElementById("nome-profissional").value.trim();

    const servico = document
      .getElementById("area-profissional").value.trim();

    if (!nome && !servico) {
      avisar("Preencha o nome, o serviço ou ambos.");
      return;
    }

    const botao = formProfissional.querySelector(
      'button[type="submit"]'
    );
    botao.disabled = true;

    try {
      const resposta = await fetch("/api/profissionais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, servico })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao salvar cadastro.");
      }

      avisar(dados.mensagem || "Cadastro realizado com sucesso!");
      await renderizar();

    } catch (erro) {
      avisar(erro.message || "Não foi possível cadastrar.");
      botao.disabled = false;
    }
  };
}

  const excluir = document.getElementById("excluir");

  if (excluir) {
    excluir.onclick = () => avisar(NAO_CONECTADO);
  }
}

// ==
 // ===== Ações conectadas ao backend =====
$app.addEventListener("click", async (e) => {
  const tg = e.target.closest("[data-toggle]");

  if (tg) {
    const t = porId(tarefas, tg.dataset.toggle);
    if (!t) return;

    const novoStatus =
      t.status === "concluido" ? "andamento" : "concluido";

    tg.disabled = true;

    try {
      const resposta = await fetch(
        `/api/tarefas/${t.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status: novoStatus })
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Não foi possível atualizar o status."
        );
      }

      await renderizar();
      avisar("Status atualizado e salvo no banco!");

    } catch (erro) {
      avisar(erro.message || "Erro ao atualizar o status.");
      tg.disabled = false;
    }

    return;
  }

  
const so = e.target.closest("[data-salvar-obs]");

if (so) {
  const id = Number(so.dataset.salvarObs);
  const campo = document.getElementById("obs" + id);

  if (!campo) return;

  so.disabled = true;

  try {
    const resposta = await fetch(
      `/api/tarefas/${id}/observacao`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          observacao: campo.value
        })
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        dados.erro || "Não foi possível salvar a observação."
      );
    }

    const tarefa = porId(tarefas, id);
    if (tarefa) tarefa.obs = campo.value;

    avisar("Observação salva no banco de dados!");

  } catch (erro) {
    avisar(erro.message || "Erro ao salvar a observação.");
  } finally {
    so.disabled = false;
  }

  return;
}

  const fs = e.target.closest("[data-status]");

  if (fs) {
    const y = window.scrollY;
    filtroStatus = fs.dataset.status;
    await renderizar();
    window.scrollTo(0, y);
    return;
  }

  if (e.target.closest("[data-pdf]")) {
    avisar("A geração real do PDF ainda não está conectada.");
    return;
  }

  if (e.target.closest("#arquivar")) {
    avisar("O arquivamento ainda não está conectado ao banco.");
    return;
  }

const botaoExcluir = e.target.closest("[data-excluir]");

if (botaoExcluir) {
  const id = Number(botaoExcluir.dataset.excluir);

  const confirmar = window.confirm(
    "Tem certeza de que deseja excluir esta tarefa? Essa ação não poderá ser desfeita."
  );

  if (!confirmar) return;

  botaoExcluir.disabled = true;

  try {
    const resposta = await fetch(`/api/tarefas/${id}`, {
      method: "DELETE"
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível excluir a tarefa.");
    }

    window.location.hash = "#/minhas-tarefas";
    await renderizar();
    avisar("Tarefa excluída com sucesso!");

  } catch (erro) {
    avisar(erro.message || "Erro ao excluir a tarefa.");
    botaoExcluir.disabled = false;
  }

  return;
}

});

$app.addEventListener("input", (e) => {
  if (e.target.id === "confirma") {
    document.getElementById("apagar").disabled =
      e.target.value.trim() !== "APAGAR";
  }
});

$app.addEventListener("change", (e) => {
  if (e.target.id === "perfil") {
    perfil = Number(e.target.value);
    location.hash = "#/";
    renderizar();
  }
});

window.addEventListener("hashchange", () => {
  if (!location.hash.startsWith("#/conta/")) {
    filtroProf = 0;
  }
  renderizar();
});

renderizar();
