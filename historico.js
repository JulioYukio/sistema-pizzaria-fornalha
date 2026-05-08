let todosOsPedidosHistorico = []; 
let graficoItensCanvas = null;

function atualizarData() {
    const data = new Date();
    const diasDaSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const nomeDia = diasDaSemana[data.getDay()];
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); 
    const ano = data.getFullYear();
    
    const elementoData = document.getElementById('data-atual');
    if (elementoData) {
        elementoData.textContent = `${nomeDia}, ${dia}/${mes}/${ano}`;
    }
}

// 1. CARREGAMENTO INICIAL
async function carregarDashboard() {
    try {
        const response = await fetch(API_URL);
        const dados = await response.json();
        
        todosOsPedidosHistorico = dados.pedidos || dados || []; 
        
        document.getElementById('data-inicio').value = '';
        document.getElementById('data-fim').value = '';
        
        atualizarPainel(todosOsPedidosHistorico);

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        document.getElementById('tabela-pedidos-body').innerHTML = `<tr><td colspan="6" style="text-align:center; color:#c0392b;">Erro de conexão com a planilha.</td></tr>`;
    }
}

// 2. FUNÇÕES DE FEEDBACK VISUAL (LOADING)
function mostrarLoading() {
    const tbody = document.getElementById('tabela-pedidos-body');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="tabela-loading">
                <div class="spinner"></div>
                <div style="margin-top: 15px;">Atualizando relatórios...</div>
            </td>
        </tr>
    `;
    // Deixa os gráficos meio transparentes enquanto carrega
    document.getElementById('faturamento-hoje').style.opacity = '0.3';
    document.getElementById('ticket-medio').style.opacity = '0.3';
    document.getElementById('lista-mais-pedidos').style.opacity = '0.3';
}

function restaurarOpacidade() {
    document.getElementById('faturamento-hoje').style.opacity = '1';
    document.getElementById('ticket-medio').style.opacity = '1';
    document.getElementById('lista-mais-pedidos').style.opacity = '1';
}

function atualizarPainel(pedidos) {
    renderizarTabela(pedidos);
    calcularResumoFinanceiro(pedidos);
    calcularItensMaisPedidos(pedidos);
    restaurarOpacidade();
}

// 3. LÓGICA DE FILTRO DE DATAS COM ANIMAÇÃO
function aplicarFiltroData() {
    const inputInicio = document.getElementById('data-inicio').value;
    const inputFim = document.getElementById('data-fim').value;

    if (!inputInicio || !inputFim) {
        alert("Selecione a data inicial e final.");
        return;
    }

    // Dispara a animação
    mostrarLoading();

    // Atraso de 400ms para a atendente "ver" a tela a carregar
    setTimeout(() => {
        const dataInicio = new Date(inputInicio + 'T00:00:00');
        const dataFim = new Date(inputFim + 'T23:59:59');

        const pedidosFiltrados = todosOsPedidosHistorico.filter(pedido => {
            if (!pedido.data) return false;
            
            let dataPedidoObj;
            const dataString = String(pedido.data);
            
            if (dataString.includes('T') || dataString.includes('-')) {
                dataPedidoObj = new Date(dataString);
            } else {
                const partes = dataString.split(/[\s/:]+/); 
                if(partes.length >= 3) {
                     dataPedidoObj = new Date(partes[2], partes[1] - 1, partes[0], partes[3] || 0, partes[4] || 0); 
                }
            }

            return dataPedidoObj && !isNaN(dataPedidoObj.getTime()) && 
                   dataPedidoObj >= dataInicio && dataPedidoObj <= dataFim;
        });

        atualizarPainel(pedidosFiltrados);
    }, 400);
}

function limparFiltroData() {
    mostrarLoading();
    
    setTimeout(() => {
        document.getElementById('data-inicio').value = '';
        document.getElementById('data-fim').value = '';
        atualizarPainel(todosOsPedidosHistorico); 
    }, 400);
}

// 4. RENDERIZAÇÃO DA TABELA
function renderizarTabela(pedidos) {
    const tbody = document.getElementById('tabela-pedidos-body');
    tbody.innerHTML = '';

    const ultimosPedidos = pedidos.slice().reverse();

    if(ultimosPedidos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px 0;">Nenhum pedido encontrado.</td></tr>`;
        return;
    }

    ultimosPedidos.forEach((pedido, index) => {
        // Ignora linhas vazias/corrompidas do Sheets
        if (!pedido || (!pedido.total && !pedido.itens)) return;

        let dataHoraFormatada = "--/--/----, --:--";
        if (pedido.data) {
            const dataString = String(pedido.data);
            if (dataString.includes('T') && dataString.includes('Z')) {
                const dataObj = new Date(dataString);
                dataHoraFormatada = dataObj.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            } else {
                dataHoraFormatada = dataString;
            }
        }

        let textoSabores = "---";
        if (pedido.itens) {
            let listaItens = typeof pedido.itens === 'string' ? JSON.parse(pedido.itens) : pedido.itens;
            if (Array.isArray(listaItens)) {
                textoSabores = listaItens.map(item => {
                    const qtd = item.quantidade || 1;
                    if (item.type === 'bebida' || item.bebidaId) {
                        const b = bebidas.find(x => x.id == item.bebidaId);
                        return `${qtd}x ${b ? b.nome : 'Bebida'}`;
                    } else {
                        const p = pizzas.find(x => x.id == item.pizzaId);
                        return `${qtd}x ${p ? p.nome : 'Pizza'}${item.tamanho ? ` (${item.tamanho})` : ''}`;
                    }
                }).join(', ');
            }
        }

        let valorNum = parseFloat(String(pedido.total).replace(',', '.'));
        if (isNaN(valorNum)) valorNum = 0;

        let statusExibicao = pedido.status || "Recebido";
        let classeBadge = "recebido"; 

        if (statusExibicao === "Em preparo") classeBadge = "preparo";
        else if (statusExibicao === "Saiu p/ entrega") classeBadge = "saiu";
        else if (statusExibicao === "Entregue") classeBadge = "entregue";
        else if (statusExibicao === "Cancelado") { classeBadge = "cancelado"; }

        tbody.innerHTML += `
            <tr>
                <td>${pedido.linha || "#"}</td>
                <td style="color: #ccc; font-size: 11px;">${dataHoraFormatada}</td>
                <td>${pedido.nome || "Cliente"}</td>
                <td style="font-size: 12px; color: #fff;">${textoSabores}</td>
                <td>R$ ${formatarMoeda(valorNum)}</td>
                <td><span class="badge ${classeBadge}" ${statusExibicao === "Cancelado" ? 'style="background:#333;color:#888;"' : ''}>${statusExibicao}</span></td>
            </tr>
        `;
    });
}

// 5. RESUMO FINANCEIRO
function calcularResumoFinanceiro(pedidos) {
    let faturamentoTotal = 0;
    let pedidosValidos = 0;
    
    pedidos.forEach(p => {
        if (p.status !== "Cancelado") {
            let valor = parseFloat(String(p.total).replace(',', '.'));
            if (!isNaN(valor)) {
                faturamentoTotal += valor;
                pedidosValidos++;
            }
        }
    });

    const ticketMedio = pedidosValidos > 0 ? (faturamentoTotal / pedidosValidos) : 0;
    document.getElementById('faturamento-hoje').textContent = `R$ ${formatarMoeda(faturamentoTotal)}`;
    document.getElementById('ticket-medio').textContent = `R$ ${formatarMoeda(ticketMedio)}`;
}

// 6. ITENS MAIS PEDIDOS E GRÁFICOS (CHART.JS)
function calcularItensMaisPedidos(pedidos) {
    const contagemItens = {};

    pedidos.forEach(pedido => {
        if (pedido.status === "Cancelado") return; 
        
        let itensDoPedido = pedido.itens;
        if (typeof itensDoPedido === 'string') {
            try { itensDoPedido = JSON.parse(itensDoPedido); } catch(e) {}
        }

        if (itensDoPedido && Array.isArray(itensDoPedido)) {
            itensDoPedido.forEach(item => {
                let nomeItem = "";
                const qtd = parseInt(item.quantidade) || 1;
                
                if (item.type === 'bebida' || item.bebidaId) {
                    const b = bebidas.find(x => x.id == item.bebidaId);
                    nomeItem = b ? b.nome : `Bebida #${item.bebidaId}`;
                } else {
                    const p = pizzas.find(x => x.id == item.pizzaId);
                    nomeItem = p ? `Pizza ${p.nome}` : `Produto #${item.pizzaId}`;
                }
                
                if (!contagemItens[nomeItem]) contagemItens[nomeItem] = 0;
                contagemItens[nomeItem] += qtd;
            });
        }
    });

    const itensOrdenados = Object.entries(contagemItens)
        .map(([nome, qtd]) => ({ nome, qtd }))
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, 5); 

    const maxQtd = itensOrdenados.length > 0 ? itensOrdenados[0].qtd : 1;
    const listaHtml = document.getElementById('lista-mais-pedidos');
    const graficoHtml = document.getElementById('grafico-barras');
    
    listaHtml.innerHTML = '';
    
    // Constrói o Gráfico Chart.js
    if(graficoHtml) {
        const ctx = graficoHtml.getContext('2d');
        if (graficoItensCanvas) {
            graficoItensCanvas.destroy();
        }

        if(itensOrdenados.length === 0) {
            listaHtml.innerHTML = "<div style='color:#666;'>Sem dados suficientes neste período</div>";
            return;
        }

        const nomesGrafico = itensOrdenados.map(item => item.nome.replace('Pizza ', '').replace('Bebida ', '')); 
        const quantidadesGrafico = itensOrdenados.map(item => item.qtd);

        graficoItensCanvas = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: nomesGrafico,
                datasets: [{
                    label: 'Unidades',
                    data: quantidadesGrafico,
                    backgroundColor: '#c0392b',
                    borderRadius: 4, 
                    barPercentage: 0.6 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(context) { return ` ${context.raw} unidades`; } } } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, color: '#888', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { ticks: { color: '#ccc', font: { size: 11 } }, grid: { display: false } }
                }
            }
        });
    }

    // Constrói a lista abaixo do gráfico
    itensOrdenados.forEach((item, index) => {
        const porcentagem = (item.qtd / maxQtd) * 100;
        listaHtml.innerHTML += `
            <div class="top-item-row">
                <span class="top-item-rank">${index + 1}</span>
                <span class="top-item-name">${item.nome}</span>
                <div class="top-item-bar-container">
                    <div class="top-item-bar-fill" style="width: ${porcentagem}%;"></div>
                </div>
                <span class="top-item-qtd">${item.qtd}x</span>
            </div>
        `;
    });
}

window.onload = () => {
    atualizarData();
    carregarDashboard();
};