let todosOsPedidosDoDia = [];

function atualizarData() {
    const data = new Date();
    const diasDaSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const nomeDia = diasDaSemana[data.getDay()];
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); 
    const ano = data.getFullYear();
    document.getElementById('data-atual').textContent = `${nomeDia}, ${dia}/${mes}/${ano}`;
}

async function carregarPedidosDoDia() {
    try {
        const response = await fetch(API_URL);
        const dados = await response.json();
        let todosOsPedidos = dados.pedidos || dados || []; 
        
        const dataAtual = new Date();
        const stringHoje = `${String(dataAtual.getDate()).padStart(2, '0')}/${String(dataAtual.getMonth() + 1).padStart(2, '0')}/${dataAtual.getFullYear()}`;

        const pedidosApenasDeHoje = todosOsPedidos.filter(pedido => {
            if (!pedido.data) return false;
            try {
                const dataPedidoObj = new Date(pedido.data);
                if (!isNaN(dataPedidoObj.getTime())) {
                    const diaP = String(dataPedidoObj.getDate()).padStart(2, '0');
                    const mesP = String(dataPedidoObj.getMonth() + 1).padStart(2, '0');
                    const anoP = dataPedidoObj.getFullYear();
                    return `${diaP}/${mesP}/${anoP}` === stringHoje;
                }
            } catch(e) {}
            return String(pedido.data).includes(stringHoje);
        });

        todosOsPedidosDoDia = pedidosApenasDeHoje.map((p, index) => {
            return {
                ...p,
                idExibicao: index + 1,
                statusAtual: p.status || "Recebido" 
            };
        }).reverse(); 

        filtrarTabela('Todos'); 
        calcularGraficoDiario(todosOsPedidosDoDia); 

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

async function alterarStatusPedido(linhaPlanilha, novoStatus) {
    try {
        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "update_status",
                linha: linhaPlanilha,
                status: novoStatus
            })
        });
        carregarPedidosDoDia(); 
    } catch (error) {
        alert("Erro ao tentar mudar o status. Verifique a internet.");
    }
}

function filtrarTabela(statusSelecionado) {
    const botoes = document.querySelectorAll('.filter-btn');
    botoes.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.trim() === statusSelecionado) btn.classList.add('active');
    });

    let pedidosFiltrados = todosOsPedidosDoDia;
    if (statusSelecionado !== 'Todos') {
        pedidosFiltrados = todosOsPedidosDoDia.filter(p => p.statusAtual === statusSelecionado);
    }

    renderizarTabela(pedidosFiltrados);
    atualizarResumos(todosOsPedidosDoDia);
}

function processarItensParaTexto(itens) {
    if (!itens) return "---";
    let lista = typeof itens === 'string' ? JSON.parse(itens) : itens;
    return lista.map(item => {
        const qtd = item.quantidade || 1;
        if (item.type === 'bebida' || item.bebidaId) {
            const b = bebidas.find(x => x.id == item.bebidaId);
            return `${qtd}x ${b ? b.nome : 'Bebida'}`;
        } else {
            const p = pizzas.find(x => x.id == item.pizzaId);
            const tam = item.tamanho ? ` (${item.tamanho})` : '';
            return `${qtd}x ${p ? p.nome : 'Pizza'}${tam}`;
        }
    }).join(', ');
}

function renderizarTabela(pedidosFiltrados) {
    const tbody = document.getElementById('tabela-pedidos-body');
    tbody.innerHTML = '';

    if(pedidosFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Nenhum pedido neste status para o dia de hoje.</td></tr>`;
        return;
    }

    pedidosFiltrados.forEach(pedido => {
        const telefoneFormatado = pedido.telefone || "(00)00000-0000";
        let valorNum = parseFloat(String(pedido.total).replace(',', '.'));
        if (isNaN(valorNum)) valorNum = 0;
        
        let horaFormatada = "--:--";
        if (pedido.data) {
            const dataString = String(pedido.data);
            if (dataString.includes('T')) {
                const dataObj = new Date(dataString);
                horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            } else {
                const match = dataString.match(/(\d{1,2}):(\d{2})/);
                if (match) horaFormatada = `${match[1].padStart(2, '0')}:${match[2]}`;
            }
        }

        let textoSabores = processarItensParaTexto(pedido.itens);
        
        const opcoesStatus = ["Recebido", "Em preparo", "Saiu p/ entrega", "Entregue", "Cancelado"];
        let selectHtml = `<select class="status-select" onchange="alterarStatusPedido(${pedido.linha}, this.value)">`;
        opcoesStatus.forEach(status => {
            const selecionado = pedido.statusAtual === status ? "selected" : "";
            selectHtml += `<option value="${status}" ${selecionado}>${status}</option>`;
        });
        selectHtml += `</select>`;

        // BOTÕES DE AÇÃO COM PREVENÇÃO DE ASPAS
        const pedidoJSON = encodeURIComponent(JSON.stringify(pedido));
        const btnEditar = `<button class="btn-action-red" onclick="prepararEdicao('${pedidoJSON}')">EDITAR</button>`;
        const btnCancelar = `<button class="btn-action-red" onclick="cancelarPedido(${pedido.linha})">CANCELAR</button>`;

        tbody.innerHTML += `
            <tr>
                <td>${pedido.idExibicao}</td>
                <td style="color: #ccc;">${horaFormatada}</td>
                <td>${pedido.nome || "Cliente"}</td>
                <td style="color: #aaa;">${telefoneFormatado}</td>
                <td style="font-size: 12px; color: #fff;">${textoSabores}</td>
                <td>R$ ${formatarMoeda(valorNum)}</td>
                <td>${selectHtml}</td>
                <td class="td-actions">${btnEditar} ${btnCancelar}</td>
            </tr>
        `;
    });
}

function prepararEdicao(pedidoEncoded) {
    const pedido = JSON.parse(decodeURIComponent(pedidoEncoded));
    localStorage.setItem('pedidoEmEdicao', JSON.stringify(pedido));
    window.location.href = 'novo_pedido.html';
}

function cancelarPedido(linha) {
    if(confirm("Deseja realmente CANCELAR este pedido? Ele ficará marcado como Cancelado.")) {
        alterarStatusPedido(linha, "Cancelado");
    }
}

function atualizarResumos(pedidos) {
    const totalPedidos = pedidos.length;
    const emAndamento = pedidos.filter(p => p.statusAtual !== "Entregue" && p.statusAtual !== "Cancelado").length;
    const entregues = pedidos.filter(p => p.statusAtual === "Entregue").length;
    
    let faturamento = 0;
    pedidos.forEach(p => {
        if(p.statusAtual !== "Cancelado") {
            let valor = parseFloat(String(p.total).replace(',', '.'));
            if (!isNaN(valor)) faturamento += valor;
        }
    });

    document.getElementById('resumo-total').textContent = totalPedidos;
    document.getElementById('resumo-andamento').textContent = emAndamento;
    document.getElementById('resumo-entregues').textContent = entregues;
    document.getElementById('resumo-faturamento').textContent = formatarMoeda(faturamento);
}

function calcularGraficoDiario(pedidos) {
    const contagemItens = {};

    pedidos.forEach(pedido => {
        if(pedido.statusAtual === "Cancelado") return; // Ignora cancelados no gráfico
        
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
    const graficoHtml = document.getElementById('grafico-barras');
    const listaHtml = document.getElementById('lista-mais-pedidos');
    
    graficoHtml.innerHTML = '';
    listaHtml.innerHTML = '';

    if(itensOrdenados.length === 0) return;

    itensOrdenados.forEach((item, index) => {
        const alturaBarra = Math.max((item.qtd / maxQtd) * 100, 10); 
        graficoHtml.innerHTML += `<div class="chart-bar" style="height: ${alturaBarra}%;" title="${item.nome} (${item.qtd})"></div>`;
        const porcentagem = (item.qtd / maxQtd) * 100;
        listaHtml.innerHTML += `
            <div class="top-item-row">
                <span class="top-item-rank">${index + 1}</span>
                <span class="top-item-name">${item.nome}</span>
                <div class="top-item-bar-container"><div class="top-item-bar-fill" style="width: ${porcentagem}%;"></div></div>
                <span class="top-item-qtd">${item.qtd}x</span>
            </div>
        `;
    });
}

window.onload = () => {
    atualizarData();
    carregarPedidosDoDia();
};