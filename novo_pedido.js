let pedidoItens = [];
let linhaEdicao = null;

function adicionarPizza() {
    const primeiraSalgada = pizzas.find(p => (p.categoria || 'salgada').toLowerCase() === 'salgada') || pizzas[0];
    pedidoItens.push({ 
        type: 'pizza', 
        pizzaId: primeiraSalgada.id, 
        tamanho: "GRANDE", 
        quantidade: 1,
        categoriaAtiva: 'salgada' 
    });
    renderizarPedido();
}

function adicionarBebida() {
    const primeiraNaoAlcoolica = bebidas.find(b => (b.categoria || 'nao_alcoolica').toLowerCase() === 'nao_alcoolica') || bebidas[0];
    pedidoItens.push({ 
        type: 'bebida', 
        bebidaId: primeiraNaoAlcoolica.id, 
        quantidade: 1,
        categoriaAtiva: 'nao_alcoolica'
    });
    renderizarPedido();
}

function removerItem(i) {
    pedidoItens.splice(i, 1);
    renderizarPedido();
}

// Troca de Aba para PIZZAS
function mudarAbaSabor(indexItem, novaCategoria) {
    pedidoItens[indexItem].categoriaAtiva = novaCategoria;
    const primeiraDaCategoria = pizzas.find(p => (p.categoria || 'salgada').toLowerCase() === novaCategoria);
    if (primeiraDaCategoria) {
        pedidoItens[indexItem].pizzaId = primeiraDaCategoria.id;
    }
    renderizarPedido();
}

// Troca de Aba para BEBIDAS
function mudarAbaBebida(indexItem, novaCategoria) {
    pedidoItens[indexItem].categoriaAtiva = novaCategoria;
    const primeiraDaCategoria = bebidas.find(b => (b.categoria || 'nao_alcoolica').toLowerCase() === novaCategoria);
    if (primeiraDaCategoria) {
        pedidoItens[indexItem].bebidaId = primeiraDaCategoria.id;
    }
    renderizarPedido();
}

// Função para mudar a aba automaticamente caso a pizza pesquisada seja de outra categoria
function selecionarPizza(indexPedido, pizzaId) {
    if (!pizzaId) return; // Ignora caso clique na opção de instrução "👇 Selecione..."

    pedidoItens[indexPedido].pizzaId = pizzaId;
    const pizza = pizzas.find(p => p.id == pizzaId);
    
    if (pizza) {
        // Atualiza a aba ativa para a categoria real da pizza selecionada
        pedidoItens[indexPedido].categoriaAtiva = (pizza.categoria || 'salgada').toLowerCase();
    }
    
    renderizarPedido();
}

function renderizarPedido() {
    const container = document.getElementById("itens-container");
    container.innerHTML = "";

    pedidoItens.forEach((item, i) => {
        let htmlItem = "";
        
        if (item.type === 'pizza') {
            const categoriaAtual = item.categoriaAtiva || 'salgada';
            const pizzasDaCategoria = pizzas.filter(p => (p.categoria || 'salgada').toLowerCase() === categoriaAtual);
            const pizza = pizzas.find(p => p.id == item.pizzaId) || pizzasDaCategoria[0] || pizzas[0];
            const subtotal = (pizza.preco[item.tamanho] || 0) * item.quantidade;

            htmlItem = `
                <div class="pedido-item" style="border-left: 4px solid #c0392b; flex-wrap: wrap; padding: 15px; margin-bottom: 15px; background: #141414; border-radius: 6px;">
                    
                    <div class="abas-produtos-container" style="display: flex; gap: 6px; width: 100%; margin-bottom: 12px;">
                        <button type="button" onclick="mudarAbaSabor(${i}, 'salgada')" style="flex: 1; padding: 6px; border-radius: 4px; border: 1px solid #333; font-size: 11px; font-weight: bold; cursor: pointer; background: ${categoriaAtual === 'salgada' ? '#c0392b' : '#222'}; color: #fff;">🔴 Salgadas</button>
                        <button type="button" onclick="mudarAbaSabor(${i}, 'doce')" style="flex: 1; padding: 6px; border-radius: 4px; border: 1px solid #333; font-size: 11px; font-weight: bold; cursor: pointer; background: ${categoriaAtual === 'doce' ? '#e67e22' : '#222'}; color: #fff;">🍫 Doces</button>
                        <button type="button" onclick="mudarAbaSabor(${i}, 'light')" style="flex: 1; padding: 6px; border-radius: 4px; border: 1px solid #333; font-size: 11px; font-weight: bold; cursor: pointer; background: ${categoriaAtual === 'light' ? '#27ae60' : '#222'}; color: #fff;">🥗 Light</button>
                        <button type="button" onclick="mudarAbaSabor(${i}, 'especial')" style="flex: 1; padding: 6px; border-radius: 4px; border: 1px solid #333; font-size: 11px; font-weight: bold; cursor: pointer; background: ${categoriaAtual === 'especial' ? '#9b59b6' : '#222'}; color: #fff;">⭐ Especiais</button>
                    </div>
                    
                    <div class="form-group" style="width: 100%; margin-bottom: 10px;">
                        <input type="text" placeholder="🔍 Buscar em todo o cardápio por ID, nome ou ingrediente (Pressione ENTER para selecionar)..." 
                               onkeyup="filtrarPizzasCategoria(event, this, ${i}, '${categoriaAtual}')" autocomplete="off"
                               style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #444; background: #1c1c1c; color: #fff;">
                    </div>

                    <div class="form-group" style="flex: 2;">
                        <select id="select-pizza-${i}" onchange="selecionarPizza(${i}, this.value)">
                            ${pizzasDaCategoria.map(p => `<option value="${p.id}" ${p.id == item.pizzaId ? "selected" : ""}>${p.id.toString().padStart(2, '0')} - ${p.nome}</option>`).join("")}
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
            // LÓGICA PARA BEBIDAS
            const categoriaAtual = item.categoriaAtiva || 'nao_alcoolica';
            const bebidasDaCategoria = bebidas.filter(b => (b.categoria || 'nao_alcoolica').toLowerCase() === categoriaAtual);
            const bebida = bebidas.find(b => b.id == item.bebidaId) || bebidasDaCategoria[0] || bebidas[0];
            const subtotal = (bebida.preco || 0) * item.quantidade;

            htmlItem = `
                <div class="pedido-item" style="border-left: 4px solid #3498db; background: #141414; padding: 15px; margin-bottom: 15px; border-radius: 6px; flex-wrap: wrap;">
                    
                    <div class="abas-produtos-container" style="display: flex; gap: 6px; width: 100%; margin-bottom: 12px;">
                        <button type="button" onclick="mudarAbaBebida(${i}, 'nao_alcoolica')" style="flex: 1; padding: 6px; border-radius: 4px; border: 1px solid #333; font-size: 11px; font-weight: bold; cursor: pointer; background: ${categoriaAtual === 'nao_alcoolica' ? '#3498db' : '#222'}; color: #fff;">🥤 Sem Álcool</button>
                        <button type="button" onclick="mudarAbaBebida(${i}, 'alcoolica')" style="flex: 1; padding: 6px; border-radius: 4px; border: 1px solid #333; font-size: 11px; font-weight: bold; cursor: pointer; background: ${categoriaAtual === 'alcoolica' ? '#f1c40f' : '#222'}; color: #fff;">🍺 Alcoólicas</button>
                    </div>

                    <div class="form-group" style="flex: 3;">
                        <select onchange="pedidoItens[${i}].bebidaId=this.value; renderizarPedido()">
                            ${bebidasDaCategoria.map(b => `<option value="${b.id}" ${b.id == item.bebidaId ? "selected" : ""}>${b.nome}</option>`).join("")}
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

// Função de Busca Global que procura por ID, Nome ou Ingredientes
// 2. FUNÇÃO DE FILTRO GLOBAL COM SELEÇÃO AUTOMÁTICA NO 'ENTER'
// 2. FUNÇÃO DE FILTRO GLOBAL COM SELEÇÃO AUTOMÁTICA NO 'ENTER' (Visual Limpo)
function filtrarPizzasCategoria(event, inputElement, indexPedido, categoriaAtiva) {
    const termoPesquisa = inputElement.value.toLowerCase().trim();
    const selectPizza = document.getElementById(`select-pizza-${indexPedido}`);
    
    // Filtra em todo o cardápio se houver pesquisa, ou apenas na aba se estiver vazio
    const pizzasFiltradas = pizzas.filter(p => {
        const pertenceACategoria = (p.categoria || 'salgada').toLowerCase() === categoriaAtiva;
        const nomeDaPizza = p.nome.toLowerCase();
        const ingredientesDaPizza = (p.ingredientes || "").toLowerCase(); 
        const idDaPizza = p.id.toString();
        
        if (termoPesquisa !== "") {
            return idDaPizza === termoPesquisa ||
                   idDaPizza.includes(termoPesquisa) || 
                   nomeDaPizza.includes(termoPesquisa) || 
                   ingredientesDaPizza.includes(termoPesquisa);
        } else {
            return pertenceACategoria;
        }
    });

    // ====================================================
    // A MÁGICA DO ENTER: Se apertou Enter e encontrou algo
    // ====================================================
    if (event.key === 'Enter' && termoPesquisa !== "") {
        if (pizzasFiltradas.length > 0) {
            // Prioriza se o usuário digitou o ID exato, senão pega o primeiro resultado
            let pizzaEscolhida = pizzasFiltradas[0];
            const pizzaPorId = pizzasFiltradas.find(p => p.id.toString() === termoPesquisa);
            if (pizzaPorId) {
                pizzaEscolhida = pizzaPorId;
            }
            
            // Chama a função de selecionar, que troca a aba e redesenha a tela!
            selecionarPizza(indexPedido, pizzaEscolhida.id);
            return; 
        }
    }

    // Se não for Enter, desenha o dropdown com os resultados
    selectPizza.innerHTML = "";

    if (pizzasFiltradas.length === 0) {
        selectPizza.innerHTML = `<option value="">Nenhuma pizza encontrada...</option>`;
    } else {
        
        pizzasFiltradas.forEach((p, index) => {
            // Se estiver a pesquisar, a primeira pizza encontrada fica imediatamente visível na caixa
            // Se a pesquisa estiver vazia, mostra a pizza que já estava selecionada no pedido
            let isSelected = "";
            if (termoPesquisa !== "") {
                isSelected = (index === 0) ? "selected" : "";
            } else {
                isSelected = (p.id == pedidoItens[indexPedido].pizzaId) ? "selected" : "";
            }
            
            const tagCategoria = (p.categoria || 'salgada').toLowerCase() !== categoriaAtiva && termoPesquisa !== "" 
                ? ` [${(p.categoria || 'SALGADA').toUpperCase()}]` 
                : "";
                
            selectPizza.innerHTML += `<option value="${p.id}" ${isSelected}>${p.id.toString().padStart(2, '0')} - ${p.nome}${tagCategoria}</option>`;
        });
    }
}

function calcularTotal() {
    let total = 0;
    pedidoItens.forEach(item => {
        if (item.type === 'pizza') {
            const p = pizzas.find(x => x.id == item.pizzaId);
            if (p) total += (p.preco[item.tamanho] || 0) * item.quantidade;
        } else {
            const b = bebidas.find(x => x.id == item.bebidaId);
            if (b) total += (b.preco || 0) * item.quantidade;
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
        token: "Fornalha_USCS_2026!Sec", // Tem de ser igual ao do Apps Script
        action: "save",
        action: linhaEdicao ? "update" : "save",
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
if (inputTelefone) {
    inputTelefone.addEventListener('input', function (e) {
        let v = e.target.value.replace(/\D/g, "").substring(0, 11); 
        if (v.length > 0) v = v.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2");
        e.target.value = v;
    });
}

const inputNome = document.getElementById("nome");
if (inputNome) {
    inputNome.addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/[^a-zA-ZáàãâéèêíïóôõöúçñÁÀÃÂÉÈÊÍÏÓÔÕÖÚÇÑ ]/g, "");
    });
}

window.onload = () => {
    atualizarData(); 
    
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
            
            pedidoItens.forEach(item => {
                if (item.type === 'pizza') {
                    const pizzaSalva = pizzas.find(p => p.id == item.pizzaId);
                    item.categoriaAtiva = pizzaSalva ? (pizzaSalva.categoria || 'salgada').toLowerCase() : 'salgada';
                } else if (item.type === 'bebida') {
                    const bebidaSalva = bebidas.find(b => b.id == item.bebidaId);
                    item.categoriaAtiva = bebidaSalva ? (bebidaSalva.categoria || 'nao_alcoolica').toLowerCase() : 'nao_alcoolica';
                }
            });
        } catch(e) { pedidoItens = []; }
        
        renderizarPedido();
        document.querySelector('.top h1').textContent = "Editar Pedido #" + (pedido.idExibicao || pedido.linha);
        document.querySelector('.save').textContent = "Atualizar pedido";
        localStorage.removeItem('pedidoEmEdicao');
    } else {
        adicionarPizza(); 
    }
};