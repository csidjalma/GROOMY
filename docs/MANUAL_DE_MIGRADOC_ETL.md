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

## 📊 Mapeamento de Tabelas, Chaves Primárias e AUTO_INCREMENT

| Tabela DBF Origem | Tabela MySQL Target | Chave Primária (`PK`) | MAX Histórico Atual | Sequência `AUTO_INCREMENT` Inicial |
| :--- | :--- | :--- | :--- | :--- |
| `CLIENTE.Dbf` | `clientes` | `cl_codigo` | `6684` | `6685` |
| `PROFISSIONAIS.dbf` | `profissionais` | `pf_codigo` | `137` | `138` |
| `serviços.dbf` | `servicos` | `se_codigo` | `457` | `458` |
| `PRODUTOS.Dbf` | `produtos` | `po_codigo` | `619` | `620` |
| `ATENDIMENTO.Dbf` | `atendimentos` | `at_codigo` | `256.997` | `256.998` |
| `DESPEZAS.Dbf` | `despesas` | `de_codigo` | `38.215` | `38.216` |
| `BANDEIRA.Dbf` | `bandeiras` | `ba_codigo` | `17` | `18` |
| `PEDIDO.DBF` | `pedidos` | `pe_codigo` | `0` | `1` |
| `ATIVIDADE.DBF` | `atividades` | `id_ativida` | `5` | `6` |
| `ITENS_ATEND.Dbf` | `itens_atendimento` | *(Chave Composta `at_codigo` + `ia_codigo`)* | N/A | N/A |
| `ITENS_PAGAMENTO.Dbf`| `pagamentos` | *(Chave Composta `at_codigo` + `ip_data`)* | N/A | N/A |
| `COMISSAO.Dbf` | `comissoes` | *(Indexado por `pf_codigo`, `at_codigo`)* | N/A | N/A |
| `CHEQUE.Dbf` | `cheques` | *(Indexado por `ch_codigo`, `at_codigo`)* | N/A | N/A |

---

## 🛡️ Módulo de Gestão de Acesso, Segurança e Controle RBAC (Prefixo `sec_`)

O controle de segurança e auditoria do sistema segue o padrão de **Controle de Acesso Baseado em Funções (RBAC)** analisado e harmonizado a partir da arquitetura de produção (VPS2 `devcs_banpreca_devel`).

### 1. `sec_users` — Tabela de Usuários e Credenciais
*   **Chave Primária:** `login` (`VARCHAR(251)`)
*   **Finalidade:** Armazena os usuários do sistema, senhas em hash MD5, status de ativador (`active`), token de validação de 6 dígitos via WhatsApp (`user_tk`), expiração de senha e metadados de acesso (`last_login_at`, `last_login_ip`).

### 2. `sec_groups` — Grupos de Acesso
*   **Chave Primária:** `group_id` (`INT AUTO_INCREMENT`)
*   **Finalidade:** Definição dos perfis operacionais (`1 = Administrador`, `2 = Recepção / Caixa`, `3 = Profissionais / Atendimento`).

### 3. `sec_apps` — Catálogo de Aplicações e Codificação Discreta
*   **Chave Primária:** `app_name` (`VARCHAR(128)`)
*   **Finalidade:** Cadastro de rotas e códigos discretos de suporte exibidos no canto inferior direito das telas (ex: `FRM-LGN`, `FRM-USR`, `FRM-WTP`, `FRM-MBL`, `FRM-AGD`, `FRM-CHK`, `FRM-PRN`, `FRM-REL`, `FRM-AUD`).

### 4. `sec_groups_apps` — Permissões Granulares por Grupo e Tela
*   **Chave Primária Composta:** (`group_id`, `app_name`)
*   **Finalidade:** Controle de direitos granulares (`priv_access`, `priv_insert`, `priv_delete`, `priv_update`, `priv_export`, `priv_print`).

### 5. `sec_users_groups` — Associação Usuários vs. Grupos
*   **Chave Primária Composta:** (`login`, `group_id`)
*   **Finalidade:** Relacionamento N:M permitindo atribuição multi-perfil.

---

## 🔍 Auditoria Forense & Reconstrução de Tabelas (`sc_log` / `sec_log`)

Inspecionado na base real de produção (VPS2 `devcs_banpreca_devel`), o sistema de auditoria `sc_log` opera como um **Log de Eventos Imutável (Event Sourcing / Forensic Audit Trail)**:

### 1. Mecanismo de Reconstrução de Dados:
*   A cada alteração (`insert`, `update`, `delete`, `change_password`), a aplicação grava na coluna `description` da tabela `sc_log` o **payload completo da operação** (em formato JSON ou pares chave-valor dos campos antigos vs. novos).
*   **Reconstrução Histórica:** Em caso de exclusão acidental ou sinistro de dados em qualquer tabela (ex: `clientes`, `atendimentos`, `comissoes`), o estado completo de qualquer registro pode ser reconstruído na íntegra através da reprodução cronológica dos eventos registrados na `sc_log`.

### 2. Campos da Tabela `sc_log`:
```sql
CREATE TABLE `sc_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inserted_date` datetime DEFAULT NULL,
  `username` varchar(90) NOT NULL,
  `application` varchar(255) NOT NULL,
  `creator` varchar(30) NOT NULL,
  `ip_user` varchar(255) NOT NULL,
  `action` varchar(255) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
*   `creator`: Identifica o motor executor (ex: `'NEXT'` para requisições web Next.js, `'SYSTEM'` para rotinas de lote).
*   `action`: Ação executada (`'access'`, `'insert'`, `'update'`, `'delete'`, `'login'`, `'login_fail'`, `'timeout'`, `'change_password'`).
*   `description`: Snapshot dos dados alterados / payload de auditoria.

### 3. Regra de Proteção contra Exclusão Física:
*   Usuários ou cadastros que possuem apontamentos de histórico gravados na `sc_log` **não podem sofrer exclusão física do MySQL** (`DELETE FROM sec_users`), preservando a integridade jurídica e forense.
*   Em caso de desligamento de usuário, o status é alterado exclusivamente para **inativo** (`active = 'N'`).

---

## 🚨 Proteção Anti-Brute Force e Controle de Sessão Concorrente (`sec_logged`)

A tabela `sec_logged` desempenha duas funções cruciais na segurança do sistema:

### 1. Monitoramento de Sessões Ativas:
*   Registra a sessão ativa do usuário (`login`, `date_login`, `sc_session`, `ip`).
*   Permite identificar acessos concorrentes e gerenciar logout por inatividade (`timeout`).

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
4. Semeadura inicial do módulo de segurança RBAC (`sec_*`) e sincronização da tabela de auditoria `sc_log`.

### 🔹 Fase 2: Tombamento Definitivo (Virada de Chave / Cutover)
1. **Congelamento:** Bloquear novos lançamentos no sistema legado FoxPro.
2. **Extração Final:** Executar o script `remigrate_exact_schema.py` na raiz do projeto.
3. **Ajuste de Sequenciadores:** Executar `apply_auto_increment_and_schema.py` para recalcular o `MAX + 1` de todas as chaves primárias.
4. **Validação de Totais:** Conferir se a contagem de registros entre os arquivos `.DBF` e as tabelas MySQL VPS1 coincide 100%.
5. **Ativação:** Liberar o acesso operacional exclusivo pelo Groomy ERP.

---

## 📜 Histórico de Versões e Atualizações do Manual
*   **v1.1 (24/07/2026):** Enriquecimento com auditoria forense para reconstrução de tabelas via `sc_log` e mecanismos anti-brute force em `sec_logged` (inspecionados na VPS2 `devcs_banpreca_devel`).
*   **v1.0 (24/07/2026):** Restauração da paridade de nomes de campos 1:1, eliminação do sufixo `_legado`, e configuração da continuidade sequencial com `AUTO_INCREMENT = MAX + 1`.
