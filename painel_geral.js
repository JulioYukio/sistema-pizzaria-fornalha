const META_DIARIA = 1500.00; 
let pedidosParaFechar = []; // Variável global que guarda os pedidos

function atualizarData() {
    const data = new Date();
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    document.getElementById('data-atual').textContent = `${dias[data.getDay()]}, ${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()}`;
    
    document.getElementById('meta-valor').textContent = `R$ ${formatarMoeda(META_DIARIA)}`;
}

async function carregarDadosDoPainel() {
    try {
        const response = await fetch(API_URL);
        const dados = await response.json();
        let todosOsPedidos = dados.pedidos || dados || []; 
        
        // 1. FILTRAR APENAS OS PEDIDOS DE HOJE
        const dataAtual = new Date();
        const stringHoje = `${String(dataAtual.getDate()).padStart(2, '0')}/${String(dataAtual.getMonth() + 1).padStart(2, '0')}/${dataAtual.getFullYear()}`;

        const pedidosDeHoje = todosOsPedidos.filter(pedido => {
            if (!pedido || (!pedido.total && !pedido.itens)) return false;
            if (!pedido.data) return false;
            
            try {
                const dataP = new Date(pedido.data);
                if (!isNaN(dataP.getTime())) {
                    return `${String(dataP.getDate()).padStart(2, '0')}/${String(dataP.getMonth() + 1).padStart(2, '0')}/${dataP.getFullYear()}` === stringHoje;
                }
            } catch(e) {}
            return String(pedido.data).includes(stringHoje);
        });

        // ====================================================
        // A SOLUÇÃO AQUI: Guardamos os pedidos na memória!
        // ====================================================
        pedidosParaFechar = pedidosDeHoje;

        // 2. CALCULAR O TERMÔMETRO DO TURNO
        let faturamentoHoje = 0;
        pedidosDeHoje.forEach(p => {
            const status = p.status || "Recebido";
            if (status !== "Cancelado") {
                let valor = parseFloat(String(p.total).replace(',', '.'));
                if (!isNaN(valor)) faturamentoHoje += valor;
            }
        });

        const porcentagem = Math.min((faturamentoHoje / META_DIARIA) * 100, 100); 
        const faltam = META_DIARIA - faturamentoHoje;

        document.getElementById('faturamento-atual').textContent = `R$ ${formatarMoeda(faturamentoHoje)}`;
        document.getElementById('progress-bar').style.width = `${porcentagem}%`;

        const textoTermometro = document.getElementById('termometro-texto');
        if (faturamentoHoje >= META_DIARIA) {
            textoTermometro.innerHTML = `🎉 <strong>Meta batida!</strong> Parabéns pelo turno incrível.`;
            textoTermometro.style.color = '#2ecc71';
        } else {
            textoTermometro.innerHTML = `Faltam <strong>R$ ${formatarMoeda(faltam)}</strong> para bater a meta do dia!`;
        }

        // 3. CALCULAR STATUS DA COZINHA
        let pedidosNaFila = 0;
        pedidosDeHoje.forEach(p => {
            const status = p.status || "Recebido";
            if (status === "Recebido" || status === "Em preparo") {
                pedidosNaFila++;
            }
        });

        const tempoEstimado = pedidosNaFila === 0 ? 0 : 15 + (pedidosNaFila * 5);

        document.getElementById('pedidos-fila').textContent = pedidosNaFila;
        document.getElementById('tempo-espera').textContent = `${tempoEstimado} min`;

        // 4. GERAR ALERTAS
        gerarAlertas(pedidosNaFila);

    } catch (error) {
        console.error("Erro:", error);
        document.getElementById('termometro-texto').textContent = "Erro ao ler faturamento da planilha.";
    }
}

function gerarAlertas(fila) {
    const container = document.getElementById('lista-alertas');
    let alertasHTML = "";

    alertasHTML += `
        <div class="alerta-box">
            <span class="alerta-icon">🥤</span>
            <span class="alerta-texto">Atenção: Restam apenas 3 Coca-Colas 2L no estoque.</span>
        </div>
    `;

    if (fila > 5) {
        alertasHTML += `
            <div class="alerta-box" style="border-color: #f39c12; background: rgba(243, 156, 18, 0.1);">
                <span class="alerta-icon">🔥</span>
                <span class="alerta-texto" style="color: #f39c12;">A cozinha está com alta demanda. Avise os clientes sobre o tempo extra.</span>
            </div>
        `;
    }

    container.innerHTML = alertasHTML;
}

// 5. FUNÇÃO DE FECHAR CAIXA
async function fecharCaixa() {
    // Agora a variável pedidosParaFechar tem dados!
    if (pedidosParaFechar.length === 0) {
        alert("Não há pedidos registrados hoje para fechar o caixa.");
        return;
    }

    if (!confirm(`Deseja fechar o caixa com ${pedidosParaFechar.length} pedidos realizados hoje?`)) {
        return;
    }

    let totalGeral = 0;
    let totalDinheiro = 0;
    let totalCartao = 0;
    let totalPix = 0;
    let qtdValida = 0;

    pedidosParaFechar.forEach(p => {
        if (p.status !== "Cancelado") {
            let valor = parseFloat(String(p.total).replace(',', '.'));
            if (!isNaN(valor)) {
                totalGeral += valor;
                qtdValida++;

                const metodo = String(p.pagamento).toLowerCase();
                if (metodo.includes("dinheiro")) totalDinheiro += valor;
                else if (metodo.includes("cartao") || metodo.includes("cartão")) totalCartao += valor;
                else if (metodo.includes("pix")) totalPix += valor;
            }
        }
    });

    const btnFechar = document.querySelector('.btn-fechar');
    const textoOriginal = btnFechar.innerHTML;
    btnFechar.disabled = true;
    btnFechar.innerHTML = "Processando...";

    try {
        const payload = {
            action: "fechar_caixa",
            data: new Date().toLocaleString('pt-BR'),
            totalGeral: totalGeral,
            qtdPedidos: qtdValida,
            totalDinheiro: totalDinheiro,
            totalCartao: totalCartao,
            totalPix: totalPix
        };

        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        alert(`✅ Caixa Fechado com Sucesso!\n\nTotal: R$ ${formatarMoeda(totalGeral)}\nDinheiro: R$ ${formatarMoeda(totalDinheiro)}\nCartão: R$ ${formatarMoeda(totalCartao)}\nPix: R$ ${formatarMoeda(totalPix)}`);
        
    } catch (error) {
        console.error("Erro ao fechar caixa:", error);
        alert("Erro de conexão ao fechar o caixa. Tente novamente.");
    } finally {
        btnFechar.disabled = false;
        btnFechar.innerHTML = textoOriginal;
    }
}

window.onload = () => {
    atualizarData();
    carregarDadosDoPainel();
};