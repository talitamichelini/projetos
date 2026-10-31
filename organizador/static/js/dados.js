// Os prazos são calculados a partir de "agora" para o exemplo sempre mostrar atrasos.

const agora = new Date();
const emHoras = (h) => new Date(agora.getTime() + h * 3600000);

const AREAS = ["Mídia paga", "Social media", "Design", "Outros"];
