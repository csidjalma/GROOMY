# Manual de Migração, Taxonomia de Banco e Protocolo de Tombamento — Groomy

Este documento estabelece as diretrizes completas de arquitetura de banco de dados, taxonomia de nomenclatura de tabelas, módulo de segurança RBAC (`sec_`), regras de descarte de tabelas obsoletas, protocolo de execução e o **banimento estrito de ORMs pesados (Prisma)** em favor de **SQL Direto com Prepared Statements (`mysql2/promise`)** no novo sistema **Groomy ERP (Next.js)** hospedado no MySQL VPS1 (`devcs_banco_groomy`).

---

## ⛔ 1. Diretriz Crítica de Arquitetura: Banimento Estrito do Prisma ORM

> [!CAUTION]
> **PROIBIDO O USO DO PRISMA ORM NO PROJETO GROOMY**  
> O Prisma introduz camadas pesadas de abstração, gera SQLs ineficientes e oculta os planos de execução reais (`EXPLAIN`) do MySQL, induzindo a diagnósticos errôneos de infraestrutura/estrutura quando o problema é a arquitetura da biblioteca de ORM.

### 🚀 Padrão Obrigatório de Banco de Dados no Next.js:
1. **SQL Direto Nativo via `mysql2/promise`:**  
   Todas as consultas, relatórios e gravações no backend (Server Actions e Route Handlers) utilizarão **SQL Direto Nativo com Prepared Statements** ou pool de conexões otimizado.
2. **Transparência e Alta Performance (`EXPLAIN`):**  
   Todas as consultas no backend devem ser analisadas diretamente com `EXPLAIN` no MySQL VPS1 para garantir respostas em tempo de execução de **< 5ms**, aproveitando 100% dos índices compostos das tabelas.
3. **Tipagem TypeScript Sem Overhead:**  
   As interfaces TypeScript espelham diretamente o retorno das consultas SQL, mantendo a aplicação leve e veloz.

---

## 🏷️ 2. Regra de Nomenclatura das Tabelas (`tbl_` vs `sec_`)

A taxonomia de nomenclatura do banco de dados divide as tabelas em dois grupos estruturais bem definidos:

### 🟢 A. Tabelas de Negócio e Domínio Operacional (Prefixo `tbl_` com Hierarquia PAI ➔ FILHO)
Todas as tabelas de negócio utilizam obrigatoriamente o prefixo **`tbl_`** e seguem uma nomenclatura hierárquica que identifica claramente a entidade principal (**PAI**) e suas extensões relativas (**FILHO**).

*   **Vantagem no Código Next.js:** Leitura instantânea do que é uma tabela física de banco de dados.
*   **Vantagem nas Ferramentas (SQLyog/DBeaver):** Agrupamento alfabético perfeito de todas as tabelas do mesmo módulo lado a lado.

#### Relações PAI ➔ FILHO Mapeadas:
*   **Módulo Atendimento:**
    *   `tbl_atendimento` *(PAI — Dados gerais da ficha/atendimento)*
    *   `tbl_atendimento_itens` *(FILHO — Serviços e produtos realizados no atendimento)*
    *   `tbl_atendimento_pagamentos` *(FILHO — Formas de pagamento recebidas)*
    *   `tbl_atendimento_comissao` *(FILHO — Extrato de comissões geradas aos profissionais)*
    *   `tbl_atendimento_cheque` *(FILHO — Cadastro de cheques vinculados)*
*   **Módulo Clientes:**
    *   `tbl_cliente` *(PAI — Cadastro de clientes e fichas)*
*   **Módulo Profissionais & Serviços:**
    *   `tbl_profissional` *(PAI — Cadastro de profissionais)*
    *   `tbl_servico` *(PAI — Catálogo de serviços)*
    *   `tbl_profissional_servicos` *(N:N — Tabela intermediária de comissões por serviço)*
*   **Módulo Produtos & Estoque:**
    *   `tbl_produto` *(PAI — Cadastro e saldo de produtos)*
    *   `tbl_produto_historico` *(FILHO — Movimentações e histórico de estoque)*
*   **Módulo Financeiro & Operacional:**
    *   `tbl_caixa` *(PAI — Fechamentos diários de caixa)*
    *   `tbl_despesas` *(PAI — Lançamentos de despesas correntes)*
    *   `tbl_forma_pagamento` *(PAI — Formas e custos operacionais de cartão/PIX)*
    *   `tbl_agenda` *(PAI — Grade de agendamentos horários)*
    *   `tbl_pedido` *(PAI — Pedidos prévios/comadreja)*
    *   `tbl_atividade` *(Apoio — Categorias de atividades)*
    *   `tbl_horario` *(Apoio — Grade de slots)*
    *   `tbl_cep` *(Apoio — Tabela de busca de CEPs)*
    *   `tbl_config` *(Configurações — Dados da empresa e rodapés)*

---

### 🛡️ B. Tabelas de Segurança, RBAC e Auditoria (Prefixo `sec_` Inalterado)
Tabelas que já possuem prefixos de módulo de segurança mantêm a sua nomenclatura original **sem a adição do prefixo `tbl_`**, garantindo padronização nativa:

*   **`sec_users`**: Usuários do sistema, senhas em hash MD5, status de ativador (`active`), token de validação de 6 dígitos via WhatsApp (`user_tk`) e metadados de acesso.
*   **`sec_groups`**: Perfis/Grupos de acesso (`1 = Administrador`, `2 = Recepção / Caixa`, `3 = Profissionais`).
*   **`sec_apps`**: Catálogo de aplicações/telas padronizadas na taxonomia `PREFIXO_CODIGO` (`LST_`, `DET_`, `CON_`, `FRM_`, `REL_`).
*   **`sec_groups_apps`**: Matriz granular de direitos de acesso (`priv_access`, `priv_insert`, `priv_delete`, `priv_update`, `priv_export`, `priv_print`).
*   **`sec_log`**: Tabela oficial de auditoria forense e reconstrução de payloads JSON (padronizada de `sc_log` para `sec_log`).
*   **`sec_logged`**: Tabela de controle de sessões ativas do sistema.

---

## 🗑️ 3. Descarte e Unificação de Tabelas Legadas Obsoletas

Das 25 tabelas originais extraídas do Visual FoxPro, **4 tabelas foram descartadas** por se tratarem de arquivos mortos ou gambiarras de sessão monocusto do legado, e **2 tabelas foram unificadas**:

| Tabela Legada FoxPro | Ação | Justificativa Técnica |
| :--- | :---: | :--- |
| **`desp2016.DBF`** | 🗑️ **Descartada** | Dados de arquivo morto do ano de 2016. Sem utilidade contábil. |
| **`desp_ant.DBF`** | 🗑️ **Descartada** | Registros de despesas antigas pré-2016. |
| **`usuario_ativo.DBF`** | 🗑️ **Descartada** | Gambiarra de sessão monocusto do FoxPro. Substituída por `sec_logged`. |
| **`prox_num.DBF`** | 🗑️ **Descartada** | Contador manual antigo. Substituído por `AUTO_INCREMENT` nativo do InnoDB. |
| **`configura.DBF`** | 🔄 **Unificada em `tbl_config`** | Configurações gerais consolidadas na tabela central `tbl_config`. |
| **`usuario.DBF`** | 🔄 **Unificada em `sec_users`**| Operadores legados consolidados na tabela RBAC `sec_users`. |

---

## 📊 4. Mapeamento Geral do Banco de Dados VPS1 (`devcs_banco_groomy`)

| Tabela no MySQL VPS1 | Módulo / Função | Tabela DBF Origem | Total de Registros | `AUTO_INCREMENT` Inicial |
| :--- | :---: | :--- | :---: | :---: |
| **`tbl_atendimento`** | Negócio (PAI) | `ATENDIMENTO.Dbf` | **52.026** | `256.998` |
| **`tbl_atendimento_itens`** | Negócio (FILHO) | `ITENS_ATEND.Dbf` | **150.827** | N/A |
| **`tbl_atendimento_pagamentos`** | Negócio (FILHO) | `ITENS_PAGAMENTO.Dbf` | **51.880** | N/A |
| **`tbl_atendimento_comissao`** | Negócio (FILHO) | `COMISSAO.Dbf` | **592.665** | N/A |
| **`tbl_atendimento_cheque`** | Negócio (FILHO) | `CHEQUE.Dbf` | **62.224** | N/A |
| **`tbl_cliente`** | Negócio (PAI) | `CLIENTE.Dbf` | **6.305** | `6.685` |
| **`tbl_profissional`** | Negócio (PAI) | `PROFISSIONAIS.dbf` | **15** | `138` |
| **`tbl_servico`** | Negócio (PAI) | `serviços.dbf` | **391** | `458` |
| **`tbl_profissional_servicos`** | Negócio (N:N) | `serviços_profissional.dbf`| **6.136** | N/A |
| **`tbl_produto`** | Negócio (PAI) | `PRODUTOS.Dbf` | **26** | `620` |
| **`tbl_produto_historico`** | Negócio (FILHO) | `HISTORICO_PRODUTO.DBF`| **6.110** | N/A |
| **`tbl_caixa`** | Negócio (PAI) | `caixa.dbf` | **5.503** | N/A |
| **`tbl_despesas`** | Negócio (PAI) | `DESPEZAS.Dbf` | **38.056** | `38.216` |
| **`tbl_forma_pagamento`** | Negócio (PAI) | `BANDEIRA.Dbf` | **6** | `18` |
| **`tbl_agenda`** | Negócio (PAI) | `agenda.dbf` | **16.602** | N/A |
| **`tbl_pedido`** | Negócio (PAI) | `PEDIDO.DBF` | **0** | `1` |
| **`tbl_atividade`** | Apoio | `ATIVIDADE.DBF` | **5** | `6` |
| **`tbl_horario`** | Apoio | `HORARIO.DBF` | **29** | N/A |
| **`tbl_cep`** | Apoio | `CEP.DBF` | **192.233** | N/A |
| **`tbl_config`** | Configuração | `configura.DBF` | **4** | N/A |
| **`sec_users`** | Segurança RBAC | `USUARIO.DBF` + RBAC | **7** | N/A |
| **`sec_groups`** | Segurança RBAC | Perfil de Grupos | **3** | `4` |
| **`sec_apps`** | Segurança RBAC | Taxonomia `PREFIXO_COD`| **19** | N/A |
| **`sec_groups_apps`** | Segurança RBAC | Matriz de Direitos | **19** | N/A |
| **`sec_log`** | Auditoria Forense | Registro JSON (`sc_log`) | **0** | N/A |
| **`sec_logged`** | Sessões Ativas | Sessões de Usuário | **0** | N/A |
| **TOTAL GERAL MIGROU** | — | — | **1.181.250+** | — |

---

## ⚡ 5. Índices Compostos de Alta Velocidade (Covering Indexes)

Para garantir performance extrema com SQL Direto (`< 5ms`), as tabelas contam com os seguintes índices físicos aplicados no InnoDB:

1. **`tbl_atendimento_comissao` (592k linhas):**
   * `idx_tbl_comissao_prof_status_data (pf_codigo, co_status, co_datend)`
   * `idx_tbl_comissao_atend (at_codigo)`
2. **`tbl_atendimento_itens` (150k linhas):**
   * `idx_tbl_itens_atend_prof (at_codigo, pf_codigo)`
3. **`tbl_atendimento_pagamentos` (51k linhas):**
   * `idx_tbl_pagamentos_atend (at_codigo)`
4. **`tbl_atendimento_cheque` (62k linhas):**
   * `idx_tbl_cheques_atend (at_codigo)`
5. **`tbl_atendimento` (52k linhas):**
   * `idx_tbl_atendimento_cliente (cl_codigo, at_inicio)`

---

## 🔄 6. Protocolo de Tombamento Definitivo (Dia do Cutover)

No dia da migração final e virada de chave do sistema antigo para o Groomy ERP, siga rigorosamente o procedimento abaixo:

1. **Congelamento Operacional:** Encerrar lançamentos no sistema legado Visual FoxPro.
2. **Execução do Script Autoritativo:**  
   Rodar no terminal o script de migração:  
   `python scratch/remigrate_tbl_exact_schema2.py`
3. **Validação de Totais:**  
   Conferir se os totais de registros coincidem com os números listados na tabela da Seção 4.
4. **Verificação de Ponteiros Sequenciais:**  
   Confirmar se os ponteiros de `AUTO_INCREMENT` foram ajustados para `MAX + 1`.
5. **Liberar Acesso Exclusivo no Groomy:** Ativar acesso em produção.

---

## 📜 Histórico de Versões e Atualizações do Manual
*   **v2.1 (28/07/2026):** **Padronização total com prefixo `tbl_` nas tabelas de negócio (PAI ➔ FILHO), preservação das tabelas de segurança `sec_` (com padronização de `sec_log`) e banimento estrito do Prisma ORM.**
*   **v2.0 (28/07/2026):** Definição da taxonomia de prefixos e descarte de tabelas legadas mortas.
*   **v1.3 (25/07/2026):** Restauração 100% estrita dos dados históricos e 1.182.000+ registros.
