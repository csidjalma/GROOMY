# Groomy ERP — Sistema Moderno de Gestão de Salões de Beleza

![Next.js](https://img.shields.io/badge/Next.js-16.2.11-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)

O **Groomy** é a modernização completa do sistema legado de gestão de salões de beleza (FoxPro CSI). Ele combina uma experiência de usuário responsiva e moderna com alta performance, mantendo a precisão matemática das regras originais de comissões, rateio proporcional e segurança granular.

---

## 🌟 Principais Módulos & Funcionalidades

### 📱 1. Módulo Móvel — Pedido Expresso (Profissionais)
*   Interface otimizada para smartphones rodando diretamente nos celulares dos funcionários.
*   Lançamento rápido por número de **Ficha do Cliente** (ex: 2798) e seleção de serviço.
*   Autenticação e disparo de convite seguro via WhatsApp (**EvolutionAPI**).
*   Trava de segurança: cada colaborador lança serviços exclusivamente para a sua conta.

### 💳 2. Atendimento Rápido & Checkout (Caixa)
*   Consolidação automática dos itens lançados nas Fichas.
*   Cálculo automático e proporcional do **Fator de Desconto** e **Fator de Cartão** sobre as comissões:
    $$\text{Fator Cartão} = 1 - \left(\frac{\text{Taxa Cartão}}{\text{Total Pago}}\right)$$
    $$\text{Fator Desconto} = 1 - \left(\frac{\text{Desconto}}{\text{Subtotal}}\right)$$
*   Transação atômica em MySQL para fechamento da venda e geração dos extratos de comissão.

### 🖨️ 3. Impressão de Cupom Não Fiscal
*   Gerador de recibos térmicos em bobinas de **58mm / 80mm** (fonte monoespaçada 35–48 colunas).
*   Suporte a impressão silenciosa instantânea via navegação em modo Kiosk (`--kiosk-printing`) e comandos brutos ESC/POS para guilhotina e gaveta de dinheiro.

### 🛡️ 4. Segurança RBAC & Auditoria (`sec_users`, `sec_groups`, `sc_log`)
*   Controle de acesso granular por grupo de trabalho (RBAC: Acessar, Inserir, Alterar, Excluir).
*   Criptografia compatível com o legado FoxPro e hash MD5 para senhas.
*   Rastreabilidade total na tabela `sc_log` com bloqueio de exclusão física para contas que possuem histórico de auditoria.
*   Etiqueta de código discreto para suporte visual em todas as telas (ex: `FRM-LGN`, `FRM-USR`, `FRM-WTP`).

### 💬 5. Painel de Integração WhatsApp EvolutionAPI (`/setup/whatsapp`)
*   Interface gráfica para pareamento e leitura de QR Code em tempo real.
*   Polling automático para detecção de pareamento.
*   Persistência dinâmica das credenciais na tabela `tbl_config`.

### 📊 6. Central de Relatórios (17 Módulos Mapeados)
*   Migração de todos os 17 relatórios legados (`.FRX`) para telas web com exportação em PDF, Excel (.xlsx) e ações diretas de marketing no WhatsApp (como o Relatório de Aniversariantes).

---

## 🛠️ Stack Tecnológica

*   **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons.
*   **Backend:** Next.js Route Handlers & Server Actions.
*   **Banco de Dados:** MySQL 8.0 (Docker na VPS1 via SSH Tunneling e Pool `mysql2/promise`).
*   **Integrações:** EvolutionAPI (WhatsApp Webhook/REST API).
*   **ETL:** Python 3.12 com `dbfread` e `sshtunnel` (migração de +920.000 registros).

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
*   Node.js v18.x ou superior.
*   npm / pnpm / yarn.

### 2. Instalação de Dependências
```bash
git clone git@github.com:csidjalma/GROOMY.git
cd GROOMY
npm install
```

### 3. Variáveis de Ambiente (`.env.local`)
Crie o arquivo `.env.local` na raiz com as credenciais do banco:
```env
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=csi_super
DB_PASSWORD=SuaSenhaAqui
DB_NAME=devcs_banco_groomy
```

### 4. Executando o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

---

## 📄 Licença e Suporte
Desenvolvido por **CSI Sistemas** (Djalma Julião). Todos os direitos reservados.
