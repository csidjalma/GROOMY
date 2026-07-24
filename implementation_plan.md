# Plano de Implementação & Memória de Desenvolvimento - Groomy

Este arquivo serve como memória recorrente do projeto, permitindo o acompanhamento de todas as etapas concluídas e em andamento para o desenvolvimento do sistema Groomy.

## ⚠️ Regra de Versionamento Automatizada
> **"A marcação de passo iniciado (marcado `[/]`) DEVE ser feita assim que o agente iniciar o trabalho no item, funcionando como sinalizador de atividade ativa no Roadmap. A cada passo concluído (marcado `[x]`) DEVE haver uma execução imediata de um `git commit` detalhando a entrega. SOMENTE a finalização `[x]` dispara commits; a marcação `[/]` serve exclusivamente para controle de execução em tempo real pelo agente atual."**

---

## 🗄️ Detalhes Técnicos & Status do Banco (VPS1)
- **Nome do Banco:** `devcs_banco_groomy`
- **Host / Porta:** VPS1 (`135.181.254.249`) via Docker MySQL na porta `3308`.
- **Acesso Operacional:** Usuário `csi_super` com permissões completas concedidas.
- **Tecnologia DBF -> MySQL:** Script em Python (`migrate_dbfs.py`) utilizando `dbfread`, `pymysql` e `sshtunnel` lendo a base local.

### 📊 Estatísticas da Migração de Dados (ETL Realizado):
- **clientes**: 6.305 registros
- **profissionais**: 15 registros
- **servicos**: 391 registros
- **agenda_vfp**: 16.602 registros (grade original do FoxPro)
- **atendimentos**: 52.026 registros
- **itens_atendimento**: 150.827 registros
- **pagamentos**: 51.880 registros
- **comissoes**: 592.665 registros
- **produtos**: 26 registros
- **servicos_profissional**: 6.136 registros
- **caixa**: 5.501 registros
- **despesas**: 38.056 registros
- **bandeiras**: 6 registros
- **atividades**: 5 registros
- **pedidos**: 0 registros
- **usuarios**: 7 registros (incluindo MESTRE, WAGNER, ROSA e RAPHAEL)
- **Tabelas de Segurança (RBAC)**:
  - `sec_users`: Tabela de usuários RBAC com hash MD5 de senha, suporte a tokens e ativadores.
  - `sec_apps`: Catálogo de módulos/telas (semeado com 10 aplicações padrão).
  - `sec_groups`: Definição de grupos de trabalho (Administrador, Recepção, Profissional, etc.).
  - `sec_users_groups`: Relação Muitos-para-Muitos entre Usuários e Grupos.
  - `sec_groups_apps`: Permissões granulares de acesso (Ler, Gravar, Alterar, Excluir) por grupo em cada app.
  - `sc_log`: Auditoria detalhada de ações dos usuários com retenção e trava de exclusão física.
- **Tabela de Configurações Dinâmicas**:
  - `tbl_config`: Armazena parâmetros globais do sistema (`evolution_api_url`, `evolution_api_token`, `evolution_instance`, `app_timezone`).
- **Total Migrado:** Mais de 920.000 registros importados em lote com sucesso da base atualizada.

---

## 📐 Mockup & Mapeamento de Impressão e Relatórios

### 1. Protótipo Interativo UX/UI
- **Localização:** [CSISYS/Mockup/index.html](file:///c:/AI-PROJECTS/GROOMY/CSISYS/Mockup/index.html)
- **Demonstração:**
  - **Agenda por Colunas (`FRM-AGD`):** Visão por profissionais com lançamento direto.
  - **Pedido Expresso Mobile (`FRM-MBL`):** Interface simulação smartphone para funcionários lançarem serviços via Ficha.
  - **Checkout / Atendimento Rápido (`FRM-CHK`):** Calculadora com cálculo imediato do Fator de Desconto e Fator de Cartão na comissão.
  - **Auditoria de Sistema (`FRM-AUD`):** Registro de rastreabilidade na tabela `sc_log`.

### 2. Impressão de Cupom Não Fiscal no Caixa Desktop
- **Layout:** Monocromático monoespaçado de 35 a 48 colunas (bobinas de 58mm ou 80mm).
- **Mecanismo:** CSS `@media print` com suporte a `--kiosk-printing` (impressão silenciosa instantânea no Chrome/Edge) e comandos brutos ESC/POS via Web Serial API para corte de papel/abertura de gaveta.

### 3. Mapeamento dos 17 Relatórios Legados (`G:\Meu Drive\VisualFoxPro\Connection\Relats`)
- `AGENDA.FRX` / `agendarelat.frx` -> Relatório de Agenda do Salão
- `aniversario.frx` / `aniversario_abre.frx` -> Relatório de Aniversariantes do Mês com Disparo Direto no WhatsApp
- `comissao_diario.frx` / `relaçao_comissao.frx` -> Relatórios de Comissão Diária e Extrato Analítico com Fatores
- `geral.frx` -> **DRE / Dashboard Executivo de Faturamento e Lucro Líquido**
- `imp_bandeira.frx` -> Conciliação de Vendas por Cartão e Retenção de Taxas
- `imp_cheque.frx` / `relaçao_cheque.frx` -> Relatório e Comprovantes de Cheques
- `mala_direta.frx` / `mala.lbx` -> Automação de Mala Direta e Campanhas via WhatsApp
- `relacao_servicos_prof.frx` -> Ranking de Serviços por Profissional
- `relaçao_atendimentos.frx` -> Extrato Geral de Atendimentos por Período
- `relaçao_despesas.frx` -> Contas a Pagar e Despesas Operacionais
- `relaçao_produtos.frx` -> Inventário de Estoque e Curva ABC de Produtos
- `relaçao_serviços.frx` -> Tabela Base de Serviços e Comissões
- `venda_itens.frx` -> Histórico Analítico de Vendas (Produtos vs. Serviços)

---

## 🗺️ Roadmap de Execução

### Etapa 1: Infraestrutura de Dados & Prototipagem (Concluído)
- [x] Criação do banco de dados MySQL `devcs_banco_groomy` na VPS1 (Tabelas Principais e Complementares)
- [x] Desenvolvimento do script de migração ETL completo (`migrate_dbfs.py`)
- [x] Execução da migração massiva dos DBFs do FoxPro para a VPS1 (Tabelas completas)
- [x] Desenvolvimento do mockup funcional HTML interativo ([CSISYS/Mockup/index.html](file:///c:/AI-PROJECTS/GROOMY/CSISYS/Mockup/index.html))

### Etapa 2: Inicialização da Aplicação Next.js, Segurança RBAC & WhatsApp Setup
- [x] Configuração do projeto Next.js (App Router, TypeScript, Tailwind CSS)
- [x] Conexão com o banco de dados MySQL na VPS1 (`mysql2/promise` pool sem Prisma ORM)
- [x] CRUD completo de Gerenciamento de Usuários (`usuarios`) integrado com criptografia Caesar e etiqueta de suporte `FRM-USR`
- [x] Criação da tabela `tbl_config` e rotas de configuração (`/api/config`)
- [x] Tela de Pareamento e Autenticação do WhatsApp com a EvolutionAPI (`/setup/whatsapp`) com suporte visual (`FRM-WTP`)
- [ ] Módulo de Autenticação RBAC e Troca/Recuperação de Senha via Token (`sec_users`, `sec_groups`, `sc_log`)

### Etapa 3: Módulo Movel - Pedido Expresso (Profissionais)
- [ ] Fluxo de Convite e Cadastro via EvolutionAPI (WhatsApp):
  - Recepção gera convite ➔ Dispara mensagem WhatsApp com URL + Token único ➔ Profissional realiza cadastro e valida celular.
- [ ] Tela Mobile do Profissional (Foco em Usabilidade e Agilidade):
  - Campo de Ficha (Card número)
  - Seleção de Serviço (exibe comissões/preços associados)
  - Lançamento rápido direto na tabela `pedidos` (com status pendente/aberto).

### Etapa 4: Módulo de Agendamento de Profissionais
- [ ] Grade/agenda por colunas (uma coluna por Profissional)
- [ ] Integração Drag & Drop com persistência imediata via Server Actions
- [ ] Exibição em tempo real de conflitos ou indisponibilidade de horários

### Etapa 5: Módulo de Atendimento Rápido (Recepção) & Comissões
- [ ] Importação automática da Ficha (ex: abrindo a ficha 2798, o sistema consolida na tela de fechamento todos os serviços adicionados pelos profissionais na mesa/celular)
- [ ] Tela de lançamento manual rápido por teclado (Enter, Tab e busca preditiva)
- [ ] Server Action com transação atômica MySQL para finalização de atendimentos:
  - Salvar atendimento final, itens da ordem, pagamentos e gerar comissões ajustadas.
  - Fechar/Limpar a Ficha (marcar pedidos como processados).
  - Emissão de Cupom Não Fiscal para impressora térmica.

### Etapa 6: Módulo de Pagamentos, Módulo Financeiro & Relatórios
- [ ] Lançamento financeiro de pagamentos (PIX, cartões com taxas, dinheiro com descontos)
- [ ] Painel do profissional para consulta e solicitação de baixa de comissões acumuladas
- [ ] Desenvolvimento da Central de Relatórios (Exportação PDF/Excel dos 17 relatórios legados)

---

## 🛠️ Diretrizes Globais de Interface e Suporte
- **Identificação Discreta de Telas:** Toda tela da aplicação web (tanto desktop quanto mobile) deve exibir em seu canto inferior direito, com opacidade reduzida e fonte discreta (ex: `text-[10px] text-gray-400/50`), o código único de identificação da tela (ex: `FRM-LGN` para login, `FRM-EXP` para Pedido Expresso, `FRM-AGD` para Agenda, `FRM-ATD` para Atendimento Rápido, `FRM-WTP` para WhatsApp Setup). Essa convenção ajudará a equipe de suporte e manutenção a identificar com exatidão a view operacional utilizada pelo cliente.
