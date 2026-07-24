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
  - `sec_groups_apps`: Permissões granulares de acesso (Ler, Gravar, Alterar, Excluir, Exportar, Imprimir) por grupo em cada app.
  - `sec_logged`: Controle de sessões concorrentes e proteção **anti-brute force** (bloqueio automático de 3 minutos após 3 falhas consecutivas de login).
  - `sc_log` / `sec_log`: **Auditoria Forense de Reconstrução**: grava o snapshot/payload JSON completo de cada `insert`, `update` e `delete`, permitindo a reconstrução integral do estado de qualquer tabela ou registro. Possui trava de exclusão física para usuários auditados.
- **Tabela de Configurações Dinâmicas**:
  - `tbl_config`: Armazena parâmetros globais do sistema (`evolution_api_url`, `evolution_api_token`, `evolution_instance`, `app_timezone`).
- **Estrutura de Colunas & Sequenciamento:** **Paridade Exata 1:1** com o banco FoxPro (caixa baixa, sem acentos nem sufixos `_legado`). As chaves primárias numéricas (`cl_codigo`, `pf_codigo`, `se_codigo`, `po_codigo`, `at_codigo`, `de_codigo`, `ba_codigo`, `pe_codigo`) possuem **`AUTO_INCREMENT` ativo e configurado dinamicamente para `MAX + 1`**, garantindo continuidade histórica e que novos cadastros não colidam com o passado.
- **Manual de Tombamento de Dados:** Documentação oficial completa registrada em [docs/MANUAL_DE_MIGRADOC_ETL.md](file:///C:/AI-PROJECTS/GROOMY/docs/MANUAL_DE_MIGRADOC_ETL.md).
- **Total Migrado:** Mais de 920.000 registros re-importados e validados em lote.



---

## 📐 Mockup & Diretrizes Técnicas

### 1. Protótipo Interativo UX/UI
- **Localização:** [CSISYS/Mockup/index.html](file:///c:/AI-PROJECTS/GROOMY/CSISYS/Mockup/index.html)
- **Demonstração de Telas Mapeadas:**
  - **Agenda por Colunas (`FRM-AGD`):** Visão por profissionais com lançamento direto.
  - **Pedido Expresso Mobile (`FRM-MBL`):** Interface simulação smartphone para funcionários lançarem serviços via Ficha.
  - **Checkout / Atendimento Rápido (`FRM-CHK`):** Calculadora com cálculo imediato do Fator de Desconto e Fator de Cartão na comissão.
  - **Auditoria de Sistema (`FRM-AUD`):** Registro de rastreabilidade na tabela `sc_log`.

### 2. Impressão de Cupom Não Fiscal no Caixa Desktop
- **Layout:** Monocromático monoespaçado de 35 a 48 colunas (bobinas de 58mm ou 80mm).
- **Mecanismo:** CSS `@media print` com suporte a `--kiosk-printing` (impressão silenciosa instantânea no Chrome/Edge) e comandos brutos ESC/POS via Web Serial API para corte de papel/abertura de gaveta.

---

## 🗺️ Roadmap de Execução

### Etapa 1: Infraestrutura de Dados & Prototipagem (Concluído)
- [x] Criação do banco de dados MySQL `devcs_banco_groomy` na VPS1 (Tabelas Principais e Complementares)
- [x] Desenvolvimento do script de migração ETL completo (`migrate_dbfs.py`)
- [x] Execução da migração massiva dos DBFs do FoxPro para a VPS1 (Tabelas completas)
- [x] Desenvolvimento do mockup funcional HTML interativo ([CSISYS/Mockup/index.html](file:///c:/AI-PROJECTS/GROOMY/CSISYS/Mockup/index.html))

### Etapa 2: Inicialização da Aplicação Next.js, Segurança RBAC & WhatsApp Setup (Concluído / Em Andamento)
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
- [ ] Relatório/Impressão da Agenda Diária por Profissional (`AGENDA.FRX` / `agendarelat.frx`)

### Etapa 5: Módulo de Atendimento Rápido (Recepção) & Comissões
- [ ] Importação automática da Ficha (ex: abrindo a ficha 2798, o sistema consolida na tela de fechamento todos os serviços adicionados pelos profissionais na mesa/celular)
- [ ] Tela de lançamento manual rápido por teclado (Enter, Tab e busca preditiva)
- [ ] Server Action com transação atômica MySQL para finalização de atendimentos:
  - Salvar atendimento final, itens da ordem, pagamentos e gerar comissões ajustadas.
  - Fechar/Limpar a Ficha (marcar pedidos como processados).
- [ ] Módulo de Emissão de Cupom Não Fiscal para Impressora Térmica (CSS `@media print` + Kiosk Printing)

### Etapa 6: Módulo de Pagamentos, Módulo Financeiro & Central de Relatórios (PENDENTES)
- [ ] Lançamento financeiro de pagamentos (PIX, cartões com taxas, dinheiro com descontos)
- [ ] Painel do profissional para consulta e solicitação de baixa de comissões acumuladas
- [ ] Registro histórico de baixas e pagamentos de comissão efetuados
- [ ] **Desenvolvimento da Central de Relatórios (Mapeamento dos 17 Relatórios Legados):**
  - [ ] **Relatório 01:** Extrato Analítico de Comissões por Profissional (`relaçao_comissao.frx`) — aplicação dos fatores de cartão/desconto
  - [ ] **Relatório 02:** Resumo Diário de Comissão por Funcionário (`comissao_diario.frx`)
  - [ ] **Relatório 03:** DRE & Dashboard Executivo Gerencial de Faturamento/Lucro (`geral.frx`)
  - [ ] **Relatório 04:** Relação de Aniversariantes do Mês com Disparo Direto no WhatsApp (`aniversario.frx` / `aniversario_abre.frx`)
  - [ ] **Relatório 05:** Desempenho e Ranking de Serviços por Profissional (`relacao_servicos_prof.frx`)
  - [ ] **Relatório 06:** Histórico Analítico de Itens Vendidos — Produtos vs. Serviços (`venda_itens.frx`)
  - [ ] **Relatório 07:** Extrato Geral de Atendimentos por Período e Operador (`relaçao_atendimentos.frx`)
  - [ ] **Relatório 08:** Gestão de Contas a Pagar e Despesas Operacionais (`relaçao_despesas.frx`)
  - [ ] **Relatório 09:** Conciliação de Vendas por Bandeira de Cartão e Retenção de Taxas (`imp_bandeira.frx`)
  - [ ] **Relatório 10:** Controle de Cheques Custodiados e A Vencer (`imp_cheque.frx` / `relaçao_cheque.frx`)
  - [ ] **Relatório 11:** Inventário de Estoque de Produtos, Custo, Venda e Ponto de Reposição (`relaçao_produtos.frx`)
  - [ ] **Relatório 12:** Tabela Base de Preços de Serviços e Percentuais de Comissão (`relaçao_serviços.frx`)
  - [ ] **Relatório 13:** Mala Direta, Campanhas de E-mail e Disparos em Massa via WhatsApp (`mala_direta.frx` / `mala.lbx`)

---

## 🛠️ Diretrizes Globais de Interface e Suporte
- **Identificação Discreta de Telas (Taxonomia Oficial `PREFIXO_CODIGO`):** Toda tela da aplicação web (tanto desktop quanto mobile) deve exibir em seu canto inferior direito, com opacidade reduzida e fonte discreta (ex: `text-[10px] text-gray-400/50`), o código único de identificação da tela em `sec_apps` seguindo os prefixos padronizados:
  - **`LST_`**: Listagem / Grid (`LST_USR`, `LST_CLI`, `LST_PRO`, `LST_SER`)
  - **`DET_`**: Detalhe / Edição (`DET_USR`, `DET_CLI`, `DET_PRO`, `DET_SER`)
  - **`CON_`**: Consulta Interativa (`CON_AGD`, `CON_AUD`)
  - **`FRM_`**: Formulário de Ação / Processo (`FRM_LGN`, `FRM_CHK`, `FRM_EXP`, `FRM_WTP`)
  - **`REL_`**: Relatório / Emissão (`REL_PRN`, `REL_CAT`, `REL_COM`, `REL_DRE`, `REL_ANV`)

