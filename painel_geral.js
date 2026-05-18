let metaDiaria = parseFloat(localStorage.getItem('metaDiaria')) || 1500.00; 
let pedidosParaFechar = []; 
let estoqueGlobal = [];

function editarMeta() {
    const input = prompt("Defina a nova meta do dia (Ex: 2000 ou 1500.50):", metaDiaria);
    if (input !== null) {
        const valor = parseFloat(input.replace(',', '.'));
        if (!isNaN(valor) && valor > 0) {
            metaDiaria = valor;
            localStorage.setItem('metaDiaria', metaDiaria); // Salva no navegador
            atualizarData(); // Atualiza o texto
            carregarDadosDoPainel(); // Recalcula a barra de progresso e o termômetro
        } else {
            alert("Valor inválido. Digite apenas números.");
        }
    }
}

function atualizarData() {
    const data = new Date();
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    document.getElementById('data-atual').textContent = `${dias[data.getDay()]}, ${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1).toString().padStart(2, '0')}/${data.getFullYear()}`;
    
    // Botão dinâmico e profissional (Ícone SVG + Efeito Hover)
    const btnDinamico = `
        <button onclick="editarMeta()" 
                style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); color: #ccc; font-size: 11px; font-weight: bold; cursor: pointer; margin-left: 15px; padding: 5px 12px; border-radius: 20px; vertical-align: middle; transition: all 0.2s ease-in-out; display: inline-flex; align-items: center;"
                onmouseover="this.style.background='#c0392b'; this.style.color='#fff'; this.style.borderColor='#c0392b';" 
                onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.color='#ccc'; this.style.borderColor='rgba(255, 255, 255, 0.2)';">
            
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            EDITAR
        </button>
    `;

    document.getElementById('meta-valor').innerHTML = `R$ ${formatarMoeda(metaDiaria)} ${btnDinamico}`;
}

async function carregarDadosDoPainel() {
    try {
        const response = await fetch(API_URL);
        const dados = await response.json();
        
        let todosOsPedidos = dados.pedidos || []; 
        estoqueGlobal = dados.estoque || []; // <--- Lendo o estoque! 
        
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

        const porcentagem = Math.min((faturamentoHoje / metaDiaria) * 100, 100); 
        const faltam = metaDiaria - faturamentoHoje;

        document.getElementById('faturamento-atual').textContent = `R$ ${formatarMoeda(faturamentoHoje)}`;
        document.getElementById('progress-bar').style.width = `${porcentagem}%`;

        const textoTermometro = document.getElementById('termometro-texto');
        if (faturamentoHoje >= metaDiaria) {
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

    // 1. Alertas Dinâmicos de Estoque (Mostra se tiver 5 ou menos)
    estoqueGlobal.forEach(item => {
        const qtd = parseInt(item.quantidade);
        if (qtd <= 5) {
            alertasHTML += `
                <div class="alerta-box">
                    <span class="alerta-icon">⚠️</span>
                    <span class="alerta-texto">Atenção: Restam apenas ${qtd} un. de ${item.nome} no estoque.</span>
                </div>
            `;
        }
    });

    // 2. Alerta da Cozinha
    if (fila > 5) {
        alertasHTML += `
            <div class="alerta-box" style="border-color: #f39c12; background: rgba(243, 156, 18, 0.1);">
                <span class="alerta-icon">🔥</span>
                <span class="alerta-texto" style="color: #f39c12;">A cozinha está com alta demanda. Avise os clientes sobre o tempo extra.</span>
            </div>
        `;
    }

    if (alertasHTML === "") {
        alertasHTML = `<div style="color: #888; font-size: 14px; padding: 10px 0;">Tudo operando normalmente. Estoque adequado.</div>`;
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
            token: "Fornalha_USCS_2026!Sec", // Tem de ser igual ao do Apps Script
            action: "save", 
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

// ==========================================
// CONTROLE DE ESTOQUE
// ==========================================
function abrirModalEstoque() {
    document.getElementById('modal-estoque').style.display = 'flex';
    renderizarEstoqueModal();
}

function fecharModalEstoque() {
    document.getElementById('modal-estoque').style.display = 'none';
}

function renderizarEstoqueModal() {
    const container = document.getElementById('lista-estoque-modal');
    container.innerHTML = '';

    if (estoqueGlobal.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: #888;">Nenhum item cadastrado na aba "Estoque".</div>`;
        return;
    }

    estoqueGlobal.forEach((item, index) => {
        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #333;">
                <span style="color: #fff; font-size: 14px; flex: 1;">${item.nome}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button onclick="mudarQtdEstoque(${index}, -1)" style="background: #e74c3c; border: none; color: white; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-weight: bold;">-</button>
                    <span style="color: #fff; font-weight: bold; width: 30px; text-align: center;">${item.quantidade}</span>
                    <button onclick="mudarQtdEstoque(${index}, 1)" style="background: #3498db; border: none; color: white; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-weight: bold;">+</button>
                </div>
            </div>
        `;
    });
}

function mudarQtdEstoque(index, delta) {
    let novaQtd = parseInt(estoqueGlobal[index].quantidade) + delta;
    if (novaQtd < 0) novaQtd = 0;
    estoqueGlobal[index].quantidade = novaQtd;
    renderizarEstoqueModal(); // Atualiza a tela instantaneamente
}

async function salvarEstoque() {
    const btn = document.getElementById('btn-salvar-estoque');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    // Prepara só os dados que importam para mandar para o Google Sheets
    const payloadEnvio = estoqueGlobal.map(item => ({
        linha: item.linha,
        quantidade: item.quantidade
    }));

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'update_estoque',
                itensEstoque: payloadEnvio
            })
        });

        if (response.ok) {
            fecharModalEstoque();
            // Recarrega o painel para atualizar os alertas reais na tela principal
            carregarDadosDoPainel();
        }
    } catch (error) {
        console.error("Erro ao salvar estoque:", error);
        alert("Erro ao conectar com a planilha.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Alterações';
    }
}

window.onload = () => {
    atualizarData();
    carregarDadosDoPainel();
};