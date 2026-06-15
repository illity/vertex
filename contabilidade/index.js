
let questaoAtual = null;
let inicioQuestao = null;
let intervaloCronometro = null;

// Banco de contas falsas (intrusas) que NÃO afetam o Lucro Bruto (na DRE) nem o Valor Adicionado/Pessoal (na DVA)
const contasIntrusasDisponiveis = [
    { conta: "Caixa e Equivalentes de Caixa", valor: 150, obs: "Conta Patrimonial (Ativo)" },
    { conta: "Capital Social Subscrito", valor: 500, obs: "Conta Patrimonial (Patrimônio Líquido)" },
    { conta: "Fornecedores Nacionais", valor: 85, obs: "Conta Patrimonial (Passivo Circulante)" },
    { conta: "Empréstimos Bancários de Longo Prazo", valor: 200, obs: "Conta Patrimonial (Passivo Não Circulante)" },
    { conta: "Aplicações Financeiras", valor: 60, obs: "Conta Patrimonial (Ativo)" },
    { conta: "Dividendos Propostos a Pagar", valor: 45, obs: "Conta Patrimonial (Passivo)" }
];

function r(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function gerarQuestaoTeorica() {
    const tipo = document.getElementById("tipoDemonstracao").value;
    const dificuldade = document.getElementById("nivelDificuldade").value;

    document.getElementById("areaResposta").innerHTML = ""; // Limpa resposta anterior
    document.getElementById("areaQuestao").style.display = "block";

    let contasBase = [];
    let solucaoExplicada = {};

    if (tipo === 'dre') {
        // 1. Definição dos valores base da DRE (Sempre inteiros e pequenos)
        const rb = r(50, 90);
        const impostos = r(2, 4) * 2; // Força par para facilitar se houver divisão
        const devolucoes = r(2, 5);
        const cmv = r(15, 30);

        // Despesas operacionais que NÃO entram no cálculo do Lucro Bruto (Apenas Intrusas de Resultado)
        const despesaPropaganda = r(3, 8);
        const despesaFinanceira = r(2, 6);

        contasBase = [
            { conta: "Receita Bruta de Vendas", valor: rb, afeta: true, tag: "RB" },
            { conta: "Impostos Incidentes sobre Vendas", valor: impostos, afeta: true, tag: "DED" },
            { conta: "Devoluções de Vendas", valor: devolucoes, afeta: true, tag: "DED" },
            { conta: "Custo das Mercadorias Vendidas (CMV)", valor: cmv, afeta: true, tag: "CMV" },
            { conta: "Despesas com Propaganda e Marketing", valor: despesaPropaganda, afeta: true, tag: "OPER" },
            { conta: "Despesas Financeiras Líquidas", valor: despesaFinanceira, afeta: true, tag: "FIN" }
        ];

        // Cálculo da resolução teórica
        const deducoes = impostos + devolucoes;
        const receitaLiquida = rb - deducoes;
        const lucroBruto = receitaLiquida - cmv;

        // Despesas após o lucro bruto
        const despesasOperacionais = despesaPropaganda;
        const despesasFinanceiras = despesaFinanceira;

        const lucroLiquido = lucroBruto - despesasOperacionais - despesasFinanceiras;

        solucaoExplicada = {
            tipo: "DRE",
            texto: `
                <strong>Resolução Passo a Passo (DRE):</strong><br><br>

                • Receita Bruta: R$ ${rb}<br>
                • (–) Impostos sobre Vendas: R$ ${impostos}<br>
                • (–) Devoluções de Vendas: R$ ${devolucoes}<br>
                <strong>👉 RECEITA LÍQUIDA = R$ ${receitaLiquida}</strong><br><br>

                • Receita Líquida: R$ ${receitaLiquida}<br>
                • (–) Custo das Mercadorias Vendidas (CMV): R$ ${cmv}<br>
                <strong>👉 LUCRO BRUTO = R$ ${lucroBruto}</strong><br><br>

                • Lucro Bruto: R$ ${lucroBruto}<br>
                • (–) Despesas com Propaganda e Marketing: R$ ${despesaPropaganda}<br>
                • (–) Despesas Financeiras Líquidas: R$ ${despesaFinanceira}<br>
                <strong>👉 LUCRO LÍQUIDO = R$ ${lucroLiquido}</strong><br>
            `
        };

        document.getElementById("tituloQuestao").innerText = "Exercício de Estrutura: DRE";
        document.getElementById("enunciadoQuestao").innerText = "Com base exclusivamente nas contas fornecidas, determine: (1) a Receita Líquida, (2) o Lucro Bruto e (3) o Lucro Líquido.";

    } else if (tipo === 'dva') {
        // 2. Definição dos valores base da DVA
        const rb = r(60, 100);
        const insumos = r(20, 40);

        const depreciacao = r(2, 6);

        const salarios = r(10, 30);
        const encargos = Math.round(salarios * 0.3);

        const impostosGoverno = r(4, 10);

        const juros = r(2, 8);

        const dividendos = r(3, 10);

        const equivalenciaPatrimonial = r(5, 12);
        contasBase = [
            {
                conta: "Receita Bruta de Vendas",
                valor: rb,
                afeta: true,
                tag: "DVA_REC"
            },

            {
                conta: "Insumos Adquiridos de Terceiros",
                valor: insumos,
                afeta: true,
                tag: "DVA_INS"
            },

            {
                conta: "Depreciação do Período",
                valor: depreciacao,
                afeta: true,
                tag: "DVA_RET"
            },

            {
                conta: "Salários",
                valor: salarios,
                afeta: true,
                tag: "DVA_PES"
            },

            {
                conta: "Encargos Sociais",
                valor: encargos,
                afeta: true,
                tag: "DVA_PES"
            },

            {
                conta: "Impostos, Taxas e Contribuições",
                valor: impostosGoverno,
                afeta: true,
                tag: "DVA_GOV"
            },

            {
                conta: "Juros sobre Empréstimos",
                valor: juros,
                afeta: true,
                tag: "DVA_TER"
            },

            {
                conta: "Dividendos Distribuídos",
                valor: dividendos,
                afeta: true,
                tag: "DVA_PROP"
            },

            {
                conta: "Receita de Equivalência Patrimonial",
                valor: equivalenciaPatrimonial,
                afeta: true,
                tag: "DVA_TRANSF"
            }
        ];

        const valorAdicionadoBruto = rb - insumos;

        const valorAdicionadoLiquido = valorAdicionadoBruto - depreciacao;

        const valorAdicionadoTotalDistribuir = valorAdicionadoLiquido + equivalenciaPatrimonial;

        const pessoal = salarios + encargos;

        const governo = impostosGoverno;

        const capitalTerceiros = juros;

        const capitalProprio = dividendos;

        solucaoExplicada = {
            tipo: "DVA",
            texto: `
        <strong>Resolução da DVA:</strong><br><br>

        • Receitas: R$ ${rb}<br>
        • (–) Insumos adquiridos de terceiros: R$ ${insumos}<br>

        <strong>👉 Valor Adicionado Bruto = R$ ${valorAdicionadoBruto}</strong><br><br>

        • (–) Depreciação: R$ ${depreciacao}<br>

        <strong>👉 Valor Adicionado Líquido Produzido pela Entidade = R$ ${valorAdicionadoLiquido}</strong><br><br>

        • (+) Valor Adicionado Recebido em Transferência (Equivalência Patrimonial): R$ ${equivalenciaPatrimonial}<br>

        <strong>👉 Valor Adicionado Total a Distribuir = R$ ${valorAdicionadoTotalDistribuir}</strong><br><br>

        <strong>Distribuição do Valor Adicionado:</strong><br>

        • Pessoal = Salários + Encargos = R$ ${pessoal}<br>

        • Governo = R$ ${governo}<br>

        • Capital de Terceiros = R$ ${capitalTerceiros}<br>

        • Capital Próprio = R$ ${capitalProprio}<br>
    `
        };

        document.getElementById("tituloQuestao").innerText = "Exercício de Estrutura: DVA";
        document.getElementById("enunciadoQuestao").innerText = "Com base nas contas apresentadas e na NBC TG 09, elabore a DVA, determinando: Valor Adicionado Bruto, Valor Adicionado Líquido Produzido pela Entidade, Valor Adicionado Total a Distribuir e a distribuição para Pessoal, Governo, Capital de Terceiros e Capital Próprio.";
    } else if (tipo === 'dfc') {

        const saldoInicial = r(10, 30);

        // Operacionais
        const recebimentoClientes = r(50, 100);
        const pagamentoFornecedores = r(20, 50);
        const pagamentoSalarios = r(10, 30);

        // Investimento
        const compraImobilizado = r(10, 25);
        const vendaImobilizado = r(5, 15);

        // Financiamento
        const emprestimoObtido = r(10, 30);
        const pagamentoEmprestimo = r(5, 15);
        const dividendosPagos = r(2, 10);

        contasBase = [
            {
                conta: "Saldo Inicial de Caixa",
                valor: saldoInicial,
                afeta: true,
                tag: "DFC_CAIXA"
            },

            {
                conta: "Recebimento de Clientes",
                valor: recebimentoClientes,
                afeta: true,
                tag: "DFC_OPER"
            },

            {
                conta: "Pagamento a Fornecedores",
                valor: pagamentoFornecedores,
                afeta: true,
                tag: "DFC_OPER"
            },

            {
                conta: "Pagamento de Salários",
                valor: pagamentoSalarios,
                afeta: true,
                tag: "DFC_OPER"
            },

            {
                conta: "Aquisição de Imobilizado",
                valor: compraImobilizado,
                afeta: true,
                tag: "DFC_INV"
            },

            {
                conta: "Venda de Imobilizado",
                valor: vendaImobilizado,
                afeta: true,
                tag: "DFC_INV"
            },

            {
                conta: "Empréstimos Obtidos",
                valor: emprestimoObtido,
                afeta: true,
                tag: "DFC_FIN"
            },

            {
                conta: "Pagamento de Empréstimos",
                valor: pagamentoEmprestimo,
                afeta: true,
                tag: "DFC_FIN"
            },

            {
                conta: "Dividendos Pagos",
                valor: dividendosPagos,
                afeta: true,
                tag: "DFC_FIN"
            }
        ];

        // Cálculos

        const fluxoOperacional =
            recebimentoClientes
            - pagamentoFornecedores
            - pagamentoSalarios;

        const fluxoInvestimento =
            vendaImobilizado
            - compraImobilizado;

        const fluxoFinanciamento =
            emprestimoObtido
            - pagamentoEmprestimo
            - dividendosPagos;

        const variacaoLiquida =
            fluxoOperacional
            + fluxoInvestimento
            + fluxoFinanciamento;

        const saldoFinal =
            saldoInicial
            + variacaoLiquida;

        solucaoExplicada = {
            tipo: "DFC",
            texto: `
            <strong>Resolução da DFC:</strong><br><br>

            <strong>Fluxo das Atividades Operacionais</strong><br>
            • Recebimento de Clientes: R$ ${recebimentoClientes}<br>
            • (–) Pagamento a Fornecedores: R$ ${pagamentoFornecedores}<br>
            • (–) Pagamento de Salários: R$ ${pagamentoSalarios}<br>

            <strong>👉 FCO = R$ ${fluxoOperacional}</strong><br><br>

            <strong>Fluxo das Atividades de Investimento</strong><br>
            • Venda de Imobilizado: R$ ${vendaImobilizado}<br>
            • (–) Aquisição de Imobilizado: R$ ${compraImobilizado}<br>

            <strong>👉 FCI = R$ ${fluxoInvestimento}</strong><br><br>

            <strong>Fluxo das Atividades de Financiamento</strong><br>
            • Empréstimos Obtidos: R$ ${emprestimoObtido}<br>
            • (–) Pagamento de Empréstimos: R$ ${pagamentoEmprestimo}<br>
            • (–) Dividendos Pagos: R$ ${dividendosPagos}<br>

            <strong>👉 FCF = R$ ${fluxoFinanciamento}</strong><br><br>

            <strong>👉 Variação Líquida de Caixa = R$ ${variacaoLiquida}</strong><br><br>

            • Saldo Inicial de Caixa: R$ ${saldoInicial}<br>

            <strong>👉 Saldo Final de Caixa = R$ ${saldoFinal}</strong>
        `
        };

        document.getElementById("tituloQuestao").innerText =
            "Exercício de Estrutura: DFC";

        document.getElementById("enunciadoQuestao").innerText =
            "Com base nas contas apresentadas, elabore a Demonstração dos Fluxos de Caixa (Método Direto), determinando: Fluxo Operacional, Fluxo de Investimento, Fluxo de Financiamento, Variação Líquida de Caixa e Saldo Final de Caixa.";
    }

    // 3. Adicionar Contas Patrimoniais Intrusas com base na dificuldade
    let quantidadeIntrusas = 0;
    if (dificuldade === "medio") quantidadeIntrusas = 2;
    if (dificuldade === "dificil") quantidadeIntrusas = 4;

    // Embaralha e pinça do banco de intrusas patrimoniais
    const intrusasSelecionadas = [...contasIntrusasDisponiveis]
        .sort(() => 0.5 - Math.random())
        .slice(0, quantidadeIntrusas)
        .map(item => ({ ...item, afeta: false, tag: "INTRUSA_PATRIMONIAL" }));

    // Consolida e reordena todas as contas aleatoriamente para exibição na tabela
    const listaExibicaoFinal = [...contasBase, ...intrusasSelecionadas]
        .sort(() => 0.5 - Math.random());

    questaoAtual = {
        contas: listaExibicaoFinal,
        solucao: solucaoExplicada
    };

    // 4. Renderiza a tabela HTML
    const tbody = document.getElementById("corpoTabelaContas");
    tbody.innerHTML = "";

    listaExibicaoFinal.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td>${item.conta}</td>
                <td class="text-right">R$ ${item.valor},00</td>
            </tr>
        `;
    });
    iniciarCronometro();
}

function formatarTempo(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;

    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}

function iniciarCronometro() {

    clearInterval(intervaloCronometro);

    inicioQuestao = Date.now();

    document.getElementById("cronometroQuestao").innerText =
        "Tempo: 00:00";

    intervaloCronometro = setInterval(() => {

        const segundos = Math.floor(
            (Date.now() - inicioQuestao) / 1000
        );

        document.getElementById("cronometroQuestao").innerText =
            `Tempo: ${formatarTempo(segundos)}`;

    }, 1000);
}

function pararCronometro() {

    clearInterval(intervaloCronometro);

    return Math.floor(
        (Date.now() - inicioQuestao) / 1000
    );
}

function revelarResposta() {
    if (!questaoAtual) return;

    const tempoGasto = pararCronometro();

    let htmlIntrusas = "<h4>Análise das Contas Sem Impacto Neste Cálculo:</h4><ul>";
    let houveIntrusa = false;

    questaoAtual.contas.forEach(item => {
        if (!item.afeta) {
            houveIntrusa = true;
            let motivo = item.tag === "INTRUSA_PATRIMONIAL" ? "Conta de Balanço Patrimonial (não vai para DRE/DVA)" : "Aparece na demonstração, mas fora do grupo solicitado";
            htmlIntrusas += `<li><strong>${item.conta}</strong> (R$ ${item.valor}) <span class="badge">Sem impacto</span><br><small>Motivo: ${motivo}.</small></li>`;
        }
    });

    if (!houveIntrusa) htmlIntrusas += "<li>Nenhuma conta intrusa gerada neste nível.</li>";
    htmlIntrusas += "</ul>";

    document.getElementById("areaResposta").innerHTML = `
        <div class="resultado-box">

            <div style="
                background:#eef7ff;
                border:1px solid #cce5ff;
                padding:10px;
                margin-bottom:15px;
                border-radius:6px;
                font-weight:bold;
            ">
                ⏱ Tempo gasto: ${formatarTempo(tempoGasto)}
            </div>

            ${questaoAtual.solucao.texto}

            <hr style="border: 0; border-top: 1px solid #ccc; margin: 15px 0;">

            ${htmlIntrusas}
        </div>
    `;
}