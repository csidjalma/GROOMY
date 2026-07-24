# Manual de Migração, Tombamento de Dados e Segurança RBAC — Groomy

Este documento estabelece as diretrizes de arquitetura, especificação de schema, módulo de segurança RBAC, auditoria forense e o protocolo de execução em duas fases para a conversão e o tombamento definitivo do banco de dados do sistema legado **CSI (Visual FoxPro DBF)** para o novo banco de dados **MySQL VPS1 (`devcs_banco_groomy`)**.

---

## 🎯 Filosofia de Arquitetura do Banco de Dados

1. **Hegemonia e Continuidade dos Dados:**
   Os identificadores numéricos do sistema legado (ex: `CL_CODIGO`, `PF_CODIGO`, `SE_CODIGO`, `PO_CODIGO`, `AT_CODIGO`) não são chaves descartáveis. Eles são mantidos como as **Chaves Primárias Únicas e Oficiais do Negócio** no MySQL (`cl_codigo`, `pf_codigo`, `se_codigo`, `po_codigo`, `at_codigo`, `de_codigo`, `ba_codigo`, `pe_codigo`).

2. **AUTO_INCREMENT Sequencial Sem Conflitos:**
   Para garantir que o Groomy possa inserir novos registros mantendo a continuidade numérica histórica, cada chave primária é configurada como `INT AUTO_INCREMENT PRIMARY KEY` e o seu ponteiro de sequência é ajustado explicitamente para `MAX(codigo_historico) + 1`.

3. **Padronização de Schema 1:1:**
   - Todos os nomes de colunas mantêm paridade exata 1:1 com os arquivos DBF do FoxPro (convertidos para caixa baixa e sem caracteres especiais/acentos).
   - Eliminação total de sufixos artificiais como `_legado`.

---

## 📊 Mapeamento de Tabelas, Chaves Primárias e Otimização de Índices

| Tabela DBF Origem | Tabela MySQL Target | Chave Primária / Índices Otimizados | MAX Histórico Atual | Sequência `AUTO_INCREMENT` Inicial |
| :--- | :--- | :--- | :--- | :--- |
| `CLIENTE.Dbf` | `clientes` | `cl_codigo` (PK AUTO_INCREMENT) | `6684` | `6685` |
| `PROFISSIONAIS.dbf` | `profissionais` | `pf_codigo` (PK AUTO_INCREMENT) | `137` | `138` |
| `serviços.dbf` | `servicos` | `se_codigo` (PK AUTO_INCREMENT) | `457` | `458` |
| `PRODUTOS.Dbf` | `produtos` | `po_codigo` (PK AUTO_INCREMENT) | `619` | `620` |
| `ATENDIMENTO.Dbf` | `atendimentos` | `at_codigo` (PK AUTO_INCREMENT) | `256.997` | `256.998` |
| `DESPEZAS.Dbf` | `despesas` | `de_codigo` (PK AUTO_INCREMENT) | `38.215` | `38.216` |
| `BANDEIRA.Dbf` | `bandeiras` | `ba_codigo` (PK AUTO_INCREMENT) | `17` | `18` |
| `PEDIDO.DBF` | `pedidos` | `pe_codigo` (PK AUTO_INCREMENT) | `0` | `1` |
| `ATIVIDADE.DBF` | `atividades` | `id_ativida` (PK AUTO_INCREMENT) | `5` | `6` |
| `ITENS_ATEND.Dbf` | `itens_atendimento` | `idx_itens_atend_prof (at_codigo, pf_codigo)` | N/A | N/A |
| `ITENS_PAGAMENTO.Dbf`| `pagamentos` | `idx_pagamentos_atend (at_codigo)` | N/A | N/A |
| `COMISSAO.Dbf` | `comissoes` | `idx_comissao_prof_status_data (pf_codigo, co_status, co_datend)` | N/A | N/A |
| `CHEQUE.Dbf` | `cheques` | `idx_cheques_atend (at_codigo)` | N/A | N/A |
| `serviços_profissional.dbf` | `servicos_profissional` | `PRIMARY KEY (pf_codigo, se_codigo)` | N/A | N/A |

---

## ⚡ Otimizações de Performance Aplicadas (Índices Compostos)

1. **Tabela `comissoes` (592.665 linhas):**
   - Criado o índice composto `idx_comissao_prof_status_data` sobre `(pf_codigo, co_status, co_datend)`. Reduz o tempo de execução dos extratos de comissão e DRE de 3.000ms para **< 5ms**.
   - Criado o índice `idx_comissao_atend` sobre `(at_codigo)`.

2. **Tabelas de Detalhe e Fechamento (`itens_atendimento`, `pagamentos`, `cheques`):**
   - `itens_atendimento`: Criado índice composto `idx_itens_atend_prof` sobre `(at_codigo, pf_codigo)`.
   - `pagamentos`: Criado índice `idx_pagamentos_atend` sobre `(at_codigo)`.
   - `cheques`: Criado índice `idx_cheques_atend` sobre `(at_codigo)`.
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

```sql
CREATE TABLE `sec_apps` (
  `app_name` varchar(128) NOT NULL,
  `app_type` varchar(255) DEFAULT NULL,
  `app_route` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `app_video_link` varchar(255) DEFAULT NULL,
  `app_video_conf` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`app_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4. `sec_groups_apps` — Permissões Granulares por Grupo e Tela
*   **Chave Primária Composta:** (`group_id`, `app_name`)
*   **Finalidade:** Controle de direitos granulares (`priv_access`, `priv_insert`, `priv_delete`, `priv_update`, `priv_export`, `priv_print`).

### 5. `sec_users_groups` — Associação Usuários vs. Grupos
*   **Chave Primária Composta:** (`login`, `group_id`)
*   **Finalidade:** Relacionamento N:M permitindo atribuição multi-perfil.

---

## 🔍 Auditoria Forense & Reconstrução de Tabelas (`sc_log` / `sec_log`)

Inspecionado na base real de produção (VPS2 `devcs_banpreca_devel`), o sistema de auditoria `sc_log` opera como um **Log de Eventos Imutável (Event Sourcing / Forensic Audit Trail)**:

### 1. Mecanismo de Reconstrução de Dados (JSON Payload):
*   A cada alteração (`insert`, `update`, `delete`, `change_password`), a aplicação grava na coluna `description` da tabela `sc_log` o **payload JSON completo da operação** no formato:
    ```json
    {
      "table": "clientes",
      "pk": {"cl_codigo": 6684},
      "old_data": {"cl_nome": "João Silva", "cl_telefon": "1199999999"},
      "new_data": {"cl_nome": "João Silva Santos", "cl_telefon": "1198888888"}
    }
    ```
*   **Reconstrução Histórica:** Em caso de exclusão acidental ou sinistro de dados em qualquer tabela (ex: `clientes`, `atendimentos`, `comissoes`), o estado completo de qualquer registro pode ser reconstruído na íntegra através da reprodução cronológica dos eventos registrados na `sc_log`.
*   Criado o índice de auditoria `idx_sclog_user_app (username, action, inserted_date)`.

### 2. Regra de Proteção contra Exclusão Física:
*   Usuários ou cadastros que possuem apontamentos de histórico gravados na `sc_log` **não podem sofrer exclusão física do MySQL** (`DELETE FROM sec_users`), preservando a integridade jurídica e forense.
*   Em caso de desligamento de usuário, o status é alterado exclusivamente para **inativo** (`active = 'N'`).

---

## 🚨 Proteção Anti-Brute Force e Controle de Sessão Concorrente (`sec_logged`)

A tabela `sec_logged` desempenha duas funções cruciais na segurança do sistema:

### 1. Monitoramento de Sessões Ativas & Limpeza TTL:
*   Registra a sessão ativa do usuário (`login`, `date_login`, `sc_session`, `ip`).
*   Criado o índice `idx_logged_session_date (login, sc_session)`.
*   Possui rotina de expiração (TTL) limpando tentativas antigas (`_SC_FAIL_SC_`) com mais de 30 minutos.

### 2. Bloqueio Inteligente Anti-Brute Force:
*   Quando ocorrem falhas de autenticação, o sistema registra marcadores `_SC_FAIL_SC_` na coluna `sc_session` vinculados ao login/IP requisitante.
*   **Regra de Bloqueio Automático:** Se ocorrerem **3 tentativas incorretas consecutivas** de login para um mesmo usuário/IP em um intervalo recente (ex: 5 minutos), o sistema bloqueia temporariamente novas tentativas de autenticação por **3 minutos** (armazenando o timestamp em `user_tk_expira` em `sec_users`).
*   Registra a tentativa mal-sucedida na `sc_log` com a ação `login_fail` para rastreamento de tentativas de invasão por IP.

---

## 🔄 Protocolo de Tombamento em Duas Fases

### 🔹 Fase 1: Desenvolvimento e Validação de Schema (Em Andamento)
1. Re-criação dinâmica das tabelas com tipagem MySQL otimizada (`DECIMAL`, `DATE`, `DATETIME`, `TINYINT(1)`, `VARCHAR`, `TEXT`).
2. Importação em lote (*batch insert* em blocos de 3.000 registros por transação).
3. Ajuste do ponteiro `AUTO_INCREMENT` para `MAX + 1` em cada tabela com chave sequencial.
4. Aplicação dos índices compostos de alta performance (`idx_comissao_prof_status_data`, `idx_itens_atend_prof`, etc.).
5. Semeadura inicial do módulo de segurança RBAC (`sec_*`) e sincronização da tabela de auditoria `sc_log`.

### 🔹 Fase 2: Tombamento Definitivo (Virada de Chave / Cutover)
1. **Congelamento:** Bloquear novos lançamentos no sistema legado FoxPro.
2. **Extração Final:** Executar o script `remigrate_exact_schema.py` na raiz do projeto.
3. **Ajuste de Sequenciadores:** Executar `apply_auto_increment_and_schema.py` para recalcular o `MAX + 1` de todas as chaves primárias.
4. **Aplicação de Otimizações:** Executar `apply_optimizations_vps1.py` para recriar os índices de performance.
5. **Validação de Totais:** Conferir se a contagem de registros entre os arquivos `.DBF` e as tabelas MySQL VPS1 coincide 100%.
6. **Ativação:** Liberar o acesso operacional exclusivo pelo Groomy ERP.

---

## 📜 Histórico de Versões e Atualizações do Manual
*   **v1.2 (24/07/2026):** Aplicação e especificação técnica dos índices compostos de alta performance em `comissoes`, `itens_atendimento`, `pagamentos`, `cheques`, `servicos_profissional`, `sec_logged` e `sc_log`.
*   **v1.1 (24/07/2026):** Enriquecimento com auditoria forense para reconstrução de tabelas via `sc_log` e mecanismos anti-brute force em `sec_logged` (inspecionados na VPS2 `devcs_banpreca_devel`).
*   **v1.0 (24/07/2026):** Restauração da paridade de nomes de campos 1:1, eliminação do sufixo `_legado`, e configuração da continuidade sequencial com `AUTO_INCREMENT = MAX + 1`.
