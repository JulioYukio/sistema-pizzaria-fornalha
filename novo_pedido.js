let pedidoItens = [];
let linhaEdicao = null;

function adicionarPizza() {
    pedidoItens.push({ type: 'pizza', pizzaId: 16, tamanho: "GRANDE", quantidade: 1 });
    renderizarPedido();
}

function adicionarBebida() {
    pedidoItens.push({ type: 'bebida', bebidaId: 1001, quantidade: 1 });
    renderizarPedido();
}

function removerItem(i) {
    pedidoItens.splice(i, 1);
    renderizarPedido();
}

function renderizarPedido() {
    const container = document.getElementById("itens-container");
    container.innerHTML = "";

    pedidoItens.forEach((item, i) => {
        let htmlItem = "";
        
        if (item.type === 'pizza') {
            const pizza = pizzas.find(p => p.id == item.pizzaId) || pizzas[0];
            const subtotal = (pizza.preco[item.tamanho] || 0) * item.quantidade;

            htmlItem = `
                <div class="pedido-item" style="border-left: 4px solid #c0392b;">
                    <div class="form-group" style="flex: 2;">
                        <select onchange="pedidoItens[${i}].pizzaId=this.value; renderizarPedido()">
                            ${pizzas.map(p => `<option value="${p.id}" ${p.id == item.pizzaId ? "selected" : ""}>${p.id.toString().padStart(2, '0')} - ${p.nome}</option>`).join("")}
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <select onchange="pedidoItens[${i}].tamanho=this.value; renderizarPedido()">
                            <option value="BROTO" ${item.tamanho == "BROTO" ? "selected" : ""}>BROTO</option>
                            <option value="MÉDIA" ${item.tamanho == "MÉDIA" ? "selected" : ""}>MÉDIA</option>
                            <option value="GRANDE" ${item.tamanho == "GRANDE" ? "selected" : ""}>GRANDE</option>
                            <option value="FAMÍLIA" ${item.tamanho == "FAMÍLIA" ? "selected" : ""}>FAMÍLIA</option>
                        </select>
                    </div>
                    <div class="form-group" style="width: 60px; flex: none;">
                        <input type="number" min="1" value="${item.quantidade}" onchange="pedidoItens[${i}].quantidade=Number(this.value); renderizarPedido()">
                    </div>
                    <div class="form-group subtotal-group" style="flex: 1; align-items: flex-end; justify-content: center; padding-right: 10px;">
                        <span class="subtotal-text">R$ ${formatarMoeda(subtotal)}</span>
                    </div>
                    <div class="form-group action-group">
                        <button type="button" class="btn-remove" onclick="removerItem(${i})">×</button>
                    </div>
                </div>`;
        } else {
            const bebida = bebidas.find(b => b.id == item.bebidaId) || bebidas[0];
            const subtotal = bebida.preco * item.quantidade;

            htmlItem = `
                <div class="pedido-item" style="border-left: 4px solid #3498db;">
                    <div class="form-group" style="flex: 3;">
                        <select onchange="pedidoItens[${i}].bebidaId=this.value; renderizarPedido()">
                            ${bebidas.map(b => `<option value="${b.id}" ${b.id == item.bebidaId ? "selected" : ""}>${b.nome}</option>`).join("")}
                        </select>
                    </div>
                    <div class="form-group" style="width: 60px; flex: none;">
                        <input type="number" min="1" value="${item.quantidade}" onchange="pedidoItens[${i}].quantidade=Number(this.value); renderizarPedido()">
                    </div>
                    <div class="form-group subtotal-group" style="flex: 1; align-items: flex-end; justify-content: center; padding-right: 10px;">
                        <span class="subtotal-text">R$ ${formatarMoeda(subtotal)}</span>
                    </div>
                    <div class="form-group action-group">
                        <button type="button" class="btn-remove" onclick="removerItem(${i})">×</button>
                    </div>
                </div>`;
        }
        container.innerHTML += htmlItem;
    });
    document.getElementById("total-valor").innerText = "R$ " + formatarMoeda(calcularTotal());
}

function calcularTotal() {
    let total = 0;
    pedidoItens.forEach(item => {
        if (item.type === 'pizza') {
            const p = pizzas.find(x => x.id == item.pizzaId);
            total += (p.preco[item.tamanho] || 0) * item.quantidade;
        } else {
            const b = bebidas.find(x => x.id == item.bebidaId);
            total += (b.preco || 0) * item.quantidade;
        }
    });
    return total;
}

async function salvarPedido() {
    const nome = document.getElementById("nome").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const endereco = document.getElementById("endereco").value.trim();
    const pagamento = document.getElementById("pagamento").value;
    const obs = String(document.getElementById("obs").value).trim();

    if (!nome || !telefone || !endereco) {
        mostrarNotificacao("Preencha todos os dados do cliente!", "erro");
        return;
    }
    const numerosDoTelefone = telefone.replace(/\D/g, ""); 
    if (numerosDoTelefone.length < 10) {
        mostrarNotificacao("Por favor, digite um número de telefone válido.", "erro");
        return;
    }
    if (pedidoItens.length === 0) {
        mostrarNotificacao("Adicione pelo menos um item!", "erro");
        return;
    }

    const btnSalvar = document.querySelector('.save');
    btnSalvar.textContent = linhaEdicao ? "Atualizando..." : "A salvar...";
    btnSalvar.disabled = true;

    const payload = {
        action: linhaEdicao ? "update" : "save", // A MÁGICA ESTÁ AQUI
        linha: linhaEdicao,
        data: new Date().toLocaleString(),
        nome, telefone, endereco, pagamento, obs,
        itens: pedidoItens,
        total: calcularTotal()
    };

    try {
        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        mostrarNotificacao(linhaEdicao ? "Pedido atualizado!" : "Pedido salvo!", "sucesso");
        limparPedido();
        setTimeout(() => { window.location.href = "pedidos_do_dia.html"; }, 2000);
    } catch (error) {
        mostrarNotificacao("Erro de conexão.", "erro");
        btnSalvar.textContent = linhaEdicao ? "Atualizar Pedido" : "Salvar pedido";
        btnSalvar.disabled = false;
    }
}

function mostrarNotificacao(mensagem, tipo) {
    const existente = document.querySelector('.notificacao');
    if (existente) existente.remove();
    const div = document.createElement('div');
    div.className = `notificacao ${tipo}`; 
    const icone = tipo === 'sucesso' ? '✅' : '⚠️';
    div.innerHTML = `<div class="notificacao-icon">${icone}</div><div class="notificacao-texto">${mensagem}</div>`;
    document.body.appendChild(div);
    setTimeout(() => { div.classList.add('ocultar'); setTimeout(() => div.remove(), 300); }, 3000);
}

function limparPedido() {
    pedidoItens = [];
    linhaEdicao = null;
    localStorage.removeItem('pedidoEmEdicao');
    renderizarPedido();
    document.getElementById("nome").value = "";
    document.getElementById("telefone").value = "";
    document.getElementById("endereco").value = "";
    document.getElementById("obs").value = "";
    document.getElementById("pagamento").selectedIndex = 0;
    document.querySelector('.top h1').textContent = "Novo pedido";
    document.querySelector('.save').textContent = "Salvar pedido";
}

function atualizarData() {
    const data = new Date();
    const dias = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    document.getElementById('data-atual').textContent = `${dias[data.getDay()]}, ${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
}

const inputTelefone = document.getElementById("telefone");
inputTelefone.addEventListener('input', function (e) {
    let v = e.target.value.replace(/\D/g, "").substring(0, 11); 
    if (v.length > 0) v = v.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
    e.target.value = v;
});

const inputNome = document.getElementById("nome");
inputNome.addEventListener('input', function (e) {
    e.target.value = e.target.value.replace(/[^a-zA-ZáàãâéèêíïóôõöúçñÁÀÃÂÉÈÊÍÏÓÔÕÖÚÇÑ ]/g, "");
});

window.onload = () => {
    atualizarData(); 
    
    // VERIFICA SE TEM UM PEDIDO PARA EDITAR NA MEMÓRIA
    const dadosEdicao = localStorage.getItem('pedidoEmEdicao');
    if (dadosEdicao) {
        const pedido = JSON.parse(dadosEdicao);
        linhaEdicao = pedido.linha;
        
        document.getElementById("nome").value = pedido.nome || "";
        document.getElementById("telefone").value = pedido.telefone || "";
        document.getElementById("endereco").value = pedido.endereco || "";
        document.getElementById("obs").value = pedido.obs || "";
        if(pedido.pagamento) document.getElementById("pagamento").value = pedido.pagamento;
        
        try {
            pedidoItens = typeof pedido.itens === 'string' ? JSON.parse(pedido.itens) : pedido.itens;
        } catch(e) { pedidoItens = []; }
        
        renderizarPedido();
        
        document.querySelector('.top h1').textContent = "Editar Pedido #" + pedido.idExibicao;
        document.querySelector('.save').textContent = "Atualizar pedido";
        
        localStorage.removeItem('pedidoEmEdicao'); // Limpa a memória para o próximo
    } else {
        adicionarPizza(); 
    }
};