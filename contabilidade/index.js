// Catálogo de contas
const accounts = {
  receitaBruta: { synonyms: ["Receita Bruta", "Faturamento Bruto"] },
  deducoes: { synonyms: ["Deduções", "Impostos sobre Vendas"] },
  receitaLiquida: { synonyms: ["Receita Líquida", "Faturamento Líquido"] },
  cmv: { synonyms: ["CMV", "Custo das Mercadorias Vendidas"] },
  lucroBruto: { synonyms: ["Lucro Bruto"] },
  despesasOperacionais: { synonyms: ["Despesas Operacionais"] },
  resultadoFinanceiro: { synonyms: ["Resultado Financeiro"] },
  tributos: { synonyms: ["Tributos", "Imposto de Renda"] },
  lucroLiquido: { synonyms: ["Lucro Líquido"] },
  outrosResultadosAbrangentes: { synonyms: ["Ganhos Atuariais", "Outros Resultados"] },
  resultadoAbrangente: { synonyms: ["Resultado Abrangente"] }
};

// Catálogo de cálculos
const calculators = {
  receitaLiquida: ({ receitaBruta, deducoes }) => receitaBruta - deducoes,
  lucroBruto: ({ receitaLiquida, cmv }) => receitaLiquida - cmv,
  lucroLiquido: ({ lucroBruto, despesasOperacionais, resultadoFinanceiro, tributos }) =>
    lucroBruto - despesasOperacionais + resultadoFinanceiro - tributos,
  resultadoAbrangente: ({ lucroLiquido, outrosResultadosAbrangentes }) =>
    lucroLiquido + outrosResultadosAbrangentes
};

// Templates de exercícios
const templates = [
  {
    id: "receitaLiquida",
    module: "DRE",
    variables: [
      { id: "receitaBruta", min: 10, max: 20 },
      { id: "deducoes", min: 2, max: 5 }
    ],
    calculator: "receitaLiquida",
    question: "Receita Bruta = {receitaBruta}, Deduções = {deducoes}, Receita Líquida = ?",
    explanation: "Receita Líquida = Receita Bruta − Deduções"
  },
  {
    id: "lucroBruto",
    module: "DRE",
    variables: [
      { id: "receitaLiquida", min: 8, max: 15 },
      { id: "cmv", min: 3, max: 7 }
    ],
    calculator: "lucroBruto",
    question: "Receita Líquida = {receitaLiquida}, CMV = {cmv}, Lucro Bruto = ?",
    explanation: "Lucro Bruto = Receita Líquida − CMV"
  },
  {
    id: "lucroLiquido",
    module: "DRE",
    variables: [
      { id: "lucroBruto", min: 5, max: 12 },
      { id: "despesasOperacionais", min: 2, max: 5 },
      { id: "resultadoFinanceiro", min: -2, max: 2 },
      { id: "tributos", min: 1, max: 3 }
    ],
    calculator: "lucroLiquido",
    question: "Lucro Bruto = {lucroBruto}, Despesas = {despesasOperacionais}, Resultado Financeiro = {resultadoFinanceiro}, Tributos = {tributos}, Lucro Líquido = ?",
    explanation: "Lucro Líquido = Lucro Bruto − Despesas + Resultado Financeiro − Tributos"
  },
  {
    id: "resultadoAbrangente",
    module: "DRA",
    variables: [
      { id: "lucroLiquido", min: 5, max: 10 },
      { id: "outrosResultadosAbrangentes", min: -3, max: 3 }
    ],
    calculator: "resultadoAbrangente",
    question: "Lucro Líquido = {lucroLiquido}, Outros Resultados = {outrosResultadosAbrangentes}, Resultado Abrangente = ?",
    explanation: "Resultado Abrangente = Lucro Líquido + Outros Resultados"
  }
];

// Função utilitária para sortear valores
function randomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Gerador de exercício
function generateExercise(template) {
  const values = {};
  template.variables.forEach(v => {
    values[v.id] = randomValue(v.min, v.max);
  });
  const answer = calculators[template.calculator](values);
  const question = template.question.replace(/\{(\w+)\}/g, (_, id) => values[id]);
  return { question, answer, explanation: template.explanation, values };
}

// Correção
function checkAnswer(exercise, userAnswer) {
  const correct = Number(userAnswer) === exercise.answer;
  return {
    correct,
    feedback: `${exercise.explanation}\nCálculo: ${Object.values(exercise.values).join(", ")} → ${exercise.answer}`
  };
}

// Estatísticas simples em localStorage
function updateStats(correct) {
  const stats = JSON.parse(localStorage.getItem("stats") || '{"total":0,"correct":0}');
  stats.total++;
  if (correct) stats.correct++;
  localStorage.setItem("stats", JSON.stringify(stats));
  return stats;
}

// Interface mínima
function renderExercise() {
  const template = templates[Math.floor(Math.random() * templates.length)];
  const exercise = generateExercise(template);

  document.body.innerHTML = `
    <h3>${template.module}</h3>
    <p>${exercise.question}</p>
    <input id="answer" type="number" />
    <button id="submit">Responder</button>
    <div id="feedback"></div>
    <div id="stats"></div>
  `;

  document.getElementById("submit").onclick = () => {
    const userAnswer = document.getElementById("answer").value;
    const result = checkAnswer(exercise, userAnswer);
    document.getElementById("feedback").innerText = result.feedback;
    const stats = updateStats(result.correct);
    document.getElementById("stats").innerText = `Total: ${stats.total}, Acertos: ${stats.correct}`;
  };
}

// Inicialização
renderExercise();
