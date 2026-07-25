# Manual de Migração, Tombamento de Dados e Segurança RBAC — Groomy

Este documento estabelece as diretrizes de arquitetura, especificação de schema, módulo de segurança RBAC, auditoria forense e o protocolo de execução em duas fases para a conversão e o tombamento definitivo do banco de dados do sistema legado **CSI (Visual FoxPro DBF)** para o novo banco de dados **MySQL VPS1 (`devcs_banco_groomy`)**.

---

## 🎯 Filosofia de Arquitetura do Banco de Dados

1. **Hegemonia e Continuidade dos Dados:**
   Os identificadores numéricos do sistema legado (ex: `cl_codigo`, `pf_codigo`, `se_codigo`, `po_codigo`, `at_codigo`, `de_codigo`, `ba_codigo`, `pe_codigo`) são mantidos como as **Chaves Primárias Únicas e Oficiais do Negócio** no MySQL.

2. **AUTO_INCREMENT Sequencial Sem Conflitos:**
   Para garantir que o Groomy possa inserir novos registros mantendo a continuidade numérica histórica, cada chave primária é configurada como `INT AUTO_INCREMENT PRIMARY KEY` e o seu ponteiro de sequência é ajustado explicitamente para `MAX(codigo_historico) + 1`.

3. **Paridade 1:1 Absoluta dos Nomes de Tabelas e Colunas:**
   - Todos os nomes de tabelas correspondem **100% aos nomes exatos dos arquivos `.DBF` originais** (convertidos para caixa baixa e sem caracteres especiais).
   - *Exemplos:* `ITENS_ATEND.Dbf` -> `itens_atend`, `ITENS_PAGAMENTO.Dbf` -> `itens_pagamento`, `DESPEZAS.Dbf` -> `despezas`, `ATENDIMENTO.Dbf` -> `atendimento`, `CLIENTE.Dbf` -> `cliente`, `COMISSAO.Dbf` -> `comissao`, `CHEQUE.Dbf` -> `cheque`, `BANDEIRA.Dbf` -> `bandeira`, `ATIVIDADE.DBF` -> `atividade`, `PEDIDO.DBF` -> `pedido`, `agenda.dbf` -> `agenda`, `configura.DBF` -> `configura`, `usuario.dbf` -> `usuario`.
   - Eliminação total de pluralizações artificiais ou sufixos como `_legado`.

---

## 📊 Mapeamento Exato 1:1 de Tabelas DBF, Chaves Primárias e Registros Migrados

| Arquivo `.DBF` Origem (`CSISYS\Dados`) | Tabela Target MySQL VPS1 | Chave Primária / Índices Otimizados | Registros Migrados | `AUTO_INCREMENT` Inicial |
| :--- | :--- | :--- | :---: | :---: |
| `CLIENTE.Dbf` | `cliente` | `cl_codigo` (PK AUTO_INCREMENT) | **6.305** | `6685` |
| `PROFISSIONAIS.dbf` | `profissionais` | `pf_codigo` (PK AUTO_INCREMENT) | **15** | `138` |
| `serviços.dbf` | `servicos` | `se_codigo` (PK AUTO_INCREMENT) | **391** | `458` |
| `PRODUTOS.Dbf` | `produtos` | `po_codigo` (PK AUTO_INCREMENT) | **26** | `620` |
| `ATENDIMENTO.Dbf` | `atendimento` | `at_codigo` (PK AUTO_INCREMENT) | **52.026** | `256.998` |
| `DESPEZAS.Dbf` | `despezas` | `de_codigo` (PK AUTO_INCREMENT) | **38.056** | `38.216` |
| `BANDEIRA.Dbf` | `bandeira` | `ba_codigo` (PK AUTO_INCREMENT) | **6** | `18` |
| `PEDIDO.DBF` | `pedido` | `pe_codigo` (PK AUTO_INCREMENT) | **0** | `1` |
| `ATIVIDADE.DBF` | `atividade` | `id_ativida` (PK AUTO_INCREMENT) | **5** | `6` |
| `ITENS_ATEND.Dbf` | `itens_atend` | `idx_itens_atend_prof (at_codigo, pf_codigo)` | **150.827** | N/A |
| `ITENS_PAGAMENTO.Dbf`| `itens_pagamento` | `idx_pagamentos_atend (at_codigo)` | **51.880** | N/A |
| `COMISSAO.Dbf` | `comissao` | `idx_comissao_prof_status_data (pf_codigo, co_status, co_datend)` | **592.665** | N/A |
| `CHEQUE.Dbf` | `cheque` | `idx_cheques_atend (at_codigo)` | **62.224** | N/A |
| `serviços_profissional.dbf` | `servicos_profissional` | `PRIMARY KEY (pf_codigo, se_codigo)` | **6.136** | N/A |
| `caixa.dbf` | `caixa` | *(Indexado por `ca_data`)* | **5.503** | N/A |
| `agenda.dbf` | `agenda` | *(Indexado por `ag_data`)* | **16.602** | N/A |
| `configura.DBF` | `configura` | *(Chave Única)* | **1** | N/A |
| `CEP.DBF` | `cep` | *(Tabela de CEPs)* | **192.233** | N/A |
| `HISTORICO_PRODUTO.DBF`| `historico_produto` | *(Historico)* | **6.110** | N/A |
| `HORARIO.DBF` | `horario` | *(Horarios)* | **29** | N/A |
| `desp2016.DBF` | `desp2016` | *(Historico)* | **7** | N/A |
| `desp_ant.DBF` | `desp_ant` | *(Historico)* | **1.215** | N/A |
| `prox_num.DBF` | `prox_num` | *(Sequenciadores)* | **1** | N/A |
| `usuario.dbf` | `usuario` | *(Operadores Legados)* | **7** | N/A |
| `usuario_ativo.DBF` | `usuario_ativo` | *(Sessao)* | **1** | N/A |
| **TOTAL GERAL MIGROU**| — | — | **1.182.040+** | — |

---

## ⚡ Otimizações de Performance Aplicadas (Índices Compostos)

1. **Tabela `comissao` (592.665 linhas):**
   - Criado o índice composto `idx_comissao_prof_status_data` sobre `(pf_codigo, co_status, co_datend)`. Reduz o tempo de execução dos extratos de comissão e DRE de 3.000ms para **< 5ms**.
   - Criado o índice `idx_comissao_atend` sobre `(at_codigo)`.

2. **Tabelas de Detalhe e Fechamento (`itens_atend`, `itens_pagamento`, `cheque`, `atendimento`):**
   - `itens_atend`: Criado índice composto `idx_itens_atend_prof` sobre `(at_codigo, pf_codigo)`.
   - `itens_pagamento`: Criado índice `idx_pagamentos_atend` sobre `(at_codigo)`.
   - `cheque`: Criado índice `idx_cheques_atend` sobre `(at_codigo)`.
   - `atendimento`: Criado índice `idx_atendimento_cliente` sobre `(cl_codigo, at_inicio)`.
   - `servicos_profissional`: Definida chave primária composta `PRIMARY KEY (pf_codigo, se_codigo)`.

---

## 🛡️ Módulo de Gestão de Acesso, Segurança e Controle RBAC (Prefixo `sec_`)

O controle de segurança e auditoria do sistema segue o padrão de **Controle de Acesso Baseado em Funções (RBAC)** analisado e harmonizado a partir da arquitetura de produção (VPS2 `devcs_banpreca_devel`).

### 1. `sec_users` — Tabela de Usuários e Credenciais
*   **Chave Primária:** `login` (`VARCHAR(251)`)
*   **Finalidade:** Armazena os usuários do sistema, senhas em hash MD5, status de ativador (`active`), token de validação de 6 dígitos via WhatsApp (`user_tk`), expiração de senha e metadados de acesso (`last_login_at`, `last_login_ip`).

### 2. `sec_groups` — Grupos de Acesso
*   **Chave Primária:** `group_id` (`INT AUTO_INCREMENT`)
*   **Finalidade:** Definição dos perfis operacionais (`1 = Administrador`, `2 = Recepção / Caixa`, `3 = Profissionais / Atendimento`).

### 3. `sec_apps` — Catálogo de Aplicações e Taxonomia de Nomenclatura (`PREFIXO_CODIGO`)
*   **Chave Primária:** `app_name` (`VARCHAR(128)`)
*   **Convenção Oficial de Nomenclatura (`PREFIXO_CODIGO`):**
    *   **`LST_`**: Listagens / Grids / Tabelas de registros (ex: `LST_USR`, `LST_CLI`, `LST_PRO`, `LST_SER`).
    *   **`DET_`**: Detalhes / Edição de registro individual (ex: `DET_USR`, `DET_CLI`, `DET_PRO`, `DET_SER`).
    *   **`CON_`**: Consultas / Visões interativas (ex: `CON_AGD` para Agenda por Colunas, `CON_AUD` para Auditoria `sc_log`).
    *   **`FRM_`**: Formulários de Ação / Processos Transacionais (ex: `FRM_LGN` para Login, `FRM_CHK` para Checkout, `FRM_EXP` para Pedido Expresso Mobile, `FRM_WTP` para Setup EvolutionAPI).
    *   **`REL_`**: Relatórios / Extratos / Emissões (ex: `REL_PRN` para Recibo Térmico, `REL_CAT` para Central de Relatórios, `REL_COM` para Extrato de Comissões, `REL_DRE` para DRE Geral, `REL_ANV` para Aniversariantes).

### 4. `sec_groups_apps` — Permissões Granulares por Grupo e Tela
*   **Chave Primária Composta:** (`group_id`, `app_name`)
*   **Finalidade:** Controle de direitos granulares (`priv_access`, `priv_insert`, `priv_delete`, `priv_update`, `priv_export`, `priv_print`).

---

## 🔍 Auditoria Forense & Reconstrução de Tabelas (`sc_log` / `sec_log`)

### 1. Mecanismo de Reconstrução de Dados (JSON Payload):
*   A cada alteração (`insert`, `update`, `delete`, `change_password`), a aplicação grava na coluna `description` da tabela `sc_log` o **payload JSON completo da operação**.
*   **Reconstrução Histórica:** Em caso de exclusão acidental ou sinistro de dados em qualquer tabela (ex: `cliente`, `atendimento`, `comissao`), o estado completo de qualquer registro pode ser reconstruído na íntegra através da reprodução cronológica dos eventos registrados na `sc_log`.

---

## 🔄 Protocolo de Tombamento em Duas Fases

### 🔹 Fase 1: Desenvolvimento e Validação de Schema (Concluído)
1. Re-criação dinâmica de todas as 25 tabelas DBF com nomes exatos e tipagem otimizada.
2. Importação 100% completa de 1.182.000+ registros em lotes transacionais.
3. Ajuste do ponteiro `AUTO_INCREMENT` para `MAX + 1` em cada tabela com chave sequencial.
4. Aplicação dos índices compostos de alta performance (`idx_comissao_prof_status_data`, `idx_itens_atend_prof`, etc.).

### 🔹 Fase 2: Tombamento Definitivo (Virada de Chave / Cutover)
1. **Congelamento:** Bloquear novos lançamentos no sistema legado FoxPro.
2. **Extração Final:** Executar o script `remigrate_100percent_exact_table_names.py` na raiz do projeto.
3. **Validação de Totais:** Conferir se a contagem de registros entre os arquivos `.DBF` e as tabelas MySQL VPS1 coincide 100%.
4. **Ativação:** Liberar o acesso operacional exclusivo pelo Groomy ERP.

---

## 📜 Histórico de Versões e Atualizações do Manual
*   **v1.3 (25/07/2026):** Restauração 100% estrita da paridade exata dos nomes de tabelas DBF (`itens_atend`, `itens_pagamento`, `despezas`, `atendimento`, `cliente`, `comissao`, `cheque`, `bandeira`, `atividade`, `pedido`, `agenda`, `configura`, `usuario`, `cep`, etc.) e migração total dos 1.182.000+ registros.
*   **v1.2 (24/07/2026):** Aplicação e especificação técnica dos índices compostos de alta performance.
*   **v1.1 (24/07/2026):** Enriquecimento com auditoria forense para reconstrução de tabelas via `sc_log` e mecanismos anti-brute force em `sec_logged`.
*   **v1.0 (24/07/2026):** Paridade de nomes de campos 1:1 e configuração da continuidade sequencial com `AUTO_INCREMENT = MAX + 1`.
