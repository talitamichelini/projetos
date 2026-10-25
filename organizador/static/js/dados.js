// DADOS FICTÍCIOS — só para demonstração visual.
// Depois, o Flask/SQLite fornecerá estas mesmas informações.
// Os prazos são calculados a partir de "agora" para o exemplo sempre mostrar atrasos.

const agora = new Date();
const emHoras = (h) => new Date(agora.getTime() + h * 3600000);

const contas = [
  { id: 1, nome: "Padaria Doce Vida" },
  { id: 2, nome: "Clínica Vitalis" },
  { id: 3, nome: "Studio Fit" },
  { id: 4, nome: "Aurora Moda" },
  { id: 5, nome: "Construtora Horizonte" },
  { id: 6, nome: "Café Raiz" },
];

const AREAS = ["Mídia paga", "Social media", "Design", "Outros"];

const profissionais = [
  { id: 1, nome: "Ana Souza", area: "Mídia paga" },
  { id: 2, nome: "Bruno Lima", area: "Social media" },
  { id: 3, nome: "Carla Mendes", area: "Design" },
  { id: 4, nome: "Diego Rocha", area: "Social media" },
  { id: 5, nome: "Elisa Prado", area: "Outros" },
];

// status gravado manualmente pelo profissional: "concluido" | "andamento"
// "atrasado" NÃO é gravado: é calculado pelo prazo (ver app.js)
const tarefas = [
  { id: 1,  contaId: 1, profId: 1, titulo: "Relatório mensal de campanhas", prazo: emHoras(-30), status: "andamento", obs: "" },
  { id: 2,  contaId: 1, profId: 2, titulo: "Calendário de posts — próximo mês", prazo: emHoras(48), status: "andamento", obs: "" },
  { id: 3,  contaId: 1, profId: 3, titulo: "Cardápio digital novo", prazo: emHoras(-72), status: "concluido", obs: "Aprovado pelo cliente." },
  { id: 4,  contaId: 2, profId: 1, titulo: "Configurar campanha de check-up", prazo: emHoras(-5), status: "andamento", obs: "Aguardando acesso à conta de anúncios do cliente." },
  { id: 5,  contaId: 2, profId: 4, titulo: "Reels de depoimentos", prazo: emHoras(20), status: "andamento", obs: "" },
  { id: 6,  contaId: 2, profId: 3, titulo: "Identidade dos stories", prazo: emHoras(-100), status: "concluido", obs: "" },
  { id: 7,  contaId: 3, profId: 2, titulo: "Posts da campanha de verão", prazo: emHoras(-26), status: "andamento", obs: "Cliente ainda não enviou as fotos." },
  { id: 8,  contaId: 3, profId: 1, titulo: "Otimização de anúncios", prazo: emHoras(72), status: "andamento", obs: "" },
  { id: 9,  contaId: 3, profId: 5, titulo: "Texto da página de planos", prazo: emHoras(-10), status: "concluido", obs: "" },
  { id: 10, contaId: 4, profId: 3, titulo: "Banners da coleção outono", prazo: emHoras(4), status: "andamento", obs: "" },
  { id: 11, contaId: 4, profId: 4, titulo: "Roteiro de vídeos de lançamento", prazo: emHoras(-3), status: "andamento", obs: "" },
  { id: 12, contaId: 4, profId: 1, titulo: "Campanha Black Friday", prazo: emHoras(120), status: "andamento", obs: "" },
  { id: 13, contaId: 5, profId: 5, titulo: "Texto do folder institucional", prazo: emHoras(30), status: "andamento", obs: "" },
  { id: 14, contaId: 5, profId: 3, titulo: "Peças para stand de feira", prazo: emHoras(-48), status: "concluido", obs: "" },
  { id: 15, contaId: 5, profId: 2, titulo: "Publicações de obra do mês", prazo: emHoras(50), status: "andamento", obs: "Sem acesso ao canteiro para registrar imagens." },
  { id: 16, contaId: 6, profId: 2, titulo: "Posts de lançamento do blend", prazo: emHoras(8), status: "andamento", obs: "" },
  { id: 17, contaId: 6, profId: 1, titulo: "Campanha local no Google", prazo: emHoras(-60), status: "concluido", obs: "" },
  { id: 18, contaId: 6, profId: 3, titulo: "Rótulo da embalagem", prazo: emHoras(96), status: "andamento", obs: "" },
];

// Meses arquivados (fictícios). Status no fechamento: "concluido", "andamento" ou "atrasado".
const mesesArquivados = [
  { id: 1, nome: "Setembro 2026", tarefas: [
    { conta: "Padaria Doce Vida", titulo: "Relatório mensal de campanhas", prof: "Ana Souza", prazo: "30/09 às 18:00", status: "concluido", obs: "Entregue um dia antes do prazo." },
    { conta: "Clínica Vitalis", titulo: "Reels de depoimentos", prof: "Diego Rocha", prazo: "22/09 às 12:00", status: "atrasado", obs: "Paciente demorou a liberar a gravação." },
    { conta: "Studio Fit", titulo: "Posts da campanha de primavera", prof: "Bruno Lima", prazo: "15/09 às 17:00", status: "concluido", obs: "" },
    { conta: "Aurora Moda", titulo: "Banners da coleção primavera", prof: "Carla Mendes", prazo: "10/09 às 10:00", status: "concluido", obs: "Aprovado na primeira rodada." },
    { conta: "Café Raiz", titulo: "Texto do cardápio de inverno", prof: "Elisa Prado", prazo: "05/09 às 15:00", status: "atrasado", obs: "Aguardava definição dos preços." },
    { conta: "Aurora Moda", titulo: "Roteiro de vídeos de outubro", prof: "Diego Rocha", prazo: "02/10 às 12:00", status: "andamento", obs: "Ainda em andamento no fechamento do mês.", },
  ]},
  { id: 2, nome: "Agosto 2026", tarefas: [
    { conta: "Construtora Horizonte", titulo: "Folder institucional", prof: "Elisa Prado", prazo: "28/08 às 18:00", status: "concluido", obs: "" },
    { conta: "Padaria Doce Vida", titulo: "Campanha de Dia dos Pais", prof: "Ana Souza", prazo: "08/08 às 09:00", status: "concluido", obs: "Resultado acima da meta." },
    { conta: "Clínica Vitalis", titulo: "Identidade dos stories", prof: "Carla Mendes", prazo: "20/08 às 17:00", status: "concluido", obs: "" },
    { conta: "Studio Fit", titulo: "Otimização de anúncios", prof: "Ana Souza", prazo: "25/08 às 12:00", status: "atrasado", obs: "Orçamento ajustado pelo cliente no meio da campanha." },
  ]},
];
