# 🍕 A Fornalha - Sistema de Gerenciamento de Pedidos (PDV)

Um sistema de Ponto de Venda (PDV) leve e responsivo desenvolvido para otimizar o fluxo de atendimento e registro de pedidos em uma pizzaria. O projeto foca na agilidade do operador de caixa e na integração direta com o Google Sheets como banco de dados.

## 🎯 O Desafio e a Solução
A rotina de um balcão de vendas exige sistemas rápidos, intuitivos e que minimizem erros de digitação durante o atendimento. Esta aplicação foi desenhada com foco na experiência do usuário (UX) do atendente, permitindo o registro de múltiplos itens, cálculo automático de subtotais e organização visual do fluxo de entregas.

A arquitetura do projeto utiliza uma abordagem *Serverless* leve, utilizando o **Google Apps Script** para transformar uma planilha do Google Sheets em uma API RESTful, garantindo um banco de dados gratuito, acessível e de fácil manutenção para o dono do negócio.

## ✨ Funcionalidades Principais
- **Dashboard Interativo:** Resumo financeiro diário, cálculo de ticket médio e gráficos de barras com os itens mais vendidos.
- **Filtros de Status Operacional:** Acompanhamento em tempo real (Recebido, Em preparo, Saiu para entrega, Entregue).
- **Carrinho Dinâmico:** Adição e remoção de itens com recálculo automático de valores.
- **Integração com API (Google Sheets):** Métodos `GET` e `POST` configurados via Apps Script para persistência e resgate histórico de dados.

## 🛠️ Tecnologias Utilizadas
- **Frontend:** HTML5, CSS3 (Flexbox/Grid), JavaScript (Vanilla)
- **Backend/Database:** Google Apps Script, Google Sheets API
- **Comunicação:** Fetch API, JSON

## 🚀 Como executar o projeto localmente

1. Clone este repositório:
   ```bash
   git clone [https://github.com/SEU-USUARIO/sistema-pizzaria-fornalha.git](https://github.com/SEU-USUARIO/sistema-pizzaria-fornalha.git)
