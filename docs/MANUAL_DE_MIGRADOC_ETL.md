# Manual de Migração, Tombamento de Dados e Segurança RBAC — Groomy

Este documento estabelece as diretrizes de arquitetura, especificação de schema, módulo de segurança RBAC e o protocolo de execução em duas fases para a conversão e o tombamento definitivo do banco de dados do sistema legado **CSI (Visual FoxPro DBF)** para o novo banco de dados **MySQL VPS1 (`devcs_banco_groomy`)**.

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

O controle de segurança e auditoria do sistema segue a estrutura de **Controle de Acesso Baseado em Funções (RBAC)** com o prefixo `sec_` (proveniente de *Security*), garantindo controle granular por aplicação/tela e auditoria imutável (`sc_log` / `sec_log`).

### 1. `sec_users` — Tabela de Usuários e Credenciais
*   **Chave Primária:** `login` (`VARCHAR(251)`)
*   **Finalidade:** Armazena os usuários do sistema, senhas em hash MD5, status de ativador (`active`), token de validação de 6 dígitos via WhatsApp (`user_tk`), expiração e dados de sessão.
```sql
CREATE TABLE `sec_users` (
  `login` varchar(251) NOT NULL,
  `pswd` varchar(50) NOT NULL,
  `name` varchar(64) DEFAULT NULL,
  `email` varchar(250) DEFAULT NULL,
  `active` varchar(1) DEFAULT NULL,
  `activation_code` varchar(32) DEFAULT NULL,
  `priv_admin` varchar(1) DEFAULT NULL,
  `foto` longblob,
  `celular` varchar(20) DEFAULT NULL,
  `pswd_temp` varchar(50) DEFAULT 'SIM',
  `data_cadastro` datetime DEFAULT NULL,
  `grupo_usu` int DEFAULT NULL,
  `user_obs` varchar(240) DEFAULT NULL,
  `user_expo` int DEFAULT '0',
  `user_mobile_check` varchar(3) DEFAULT 'NAO',
  `user_tk` varchar(60) DEFAULT NULL,
  `pswd_changed_at` datetime DEFAULT NULL,
  `pswd_expires_at` datetime DEFAULT NULL,
  `login_count` int DEFAULT '0',
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `user_tk_expira` datetime DEFAULT NULL,
  PRIMARY KEY (`login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2. `sec_groups` — Grupos de Acesso
*   **Chave Primária:** `group_id` (`INT AUTO_INCREMENT`)
*   **Finalidade:** Cadastro de grupos/funções de trabalho (ex: `1 = Administrador`, `2 = Recepção / Caixa`, `3 = Profissionais`).
```sql
CREATE TABLE `sec_groups` (
  `group_id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`group_id`),
  UNIQUE KEY `description` (`description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3. `sec_apps` — Catálogo de Aplicações e Telas
*   **Chave Primária:** `app_name` (`VARCHAR(128)`)
*   **Finalidade:** Cadastra todas as telas do sistema associadas às suas rotas e codificações discretas de suporte (ex: `FRM-LGN`, `FRM-USR`, `FRM-WTP`, `FRM-MBL`, `FRM-AGD`, `FRM-CHK`, `FRM-PRN`, `FRM-REL`, `FRM-AUD`).
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

### 4. `sec_groups_apps` — Permissões Granulares por Grupo e Aplicação
*   **Chave Primária Composta:** (`group_id`, `app_name`)
*   **Finalidade:** Matriz de permissões detalhadas (`priv_access`, `priv_insert`, `priv_delete`, `priv_update`, `priv_export`, `priv_print`).
```sql
CREATE TABLE `sec_groups_apps` (
  `group_id` int NOT NULL,
  `app_name` varchar(128) NOT NULL,
  `priv_access` varchar(1) DEFAULT NULL,
  `priv_insert` varchar(1) DEFAULT NULL,
  `priv_delete` varchar(1) DEFAULT NULL,
  `priv_update` varchar(1) DEFAULT NULL,
  `priv_export` varchar(1) DEFAULT NULL,
  `priv_print` varchar(1) DEFAULT NULL,
  PRIMARY KEY (`group_id`,`app_name`),
  CONSTRAINT `sec_groups_apps_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `sec_groups` (`group_id`) ON DELETE CASCADE,
  CONSTRAINT `sec_groups_apps_ibfk_2` FOREIGN KEY (`app_name`) REFERENCES `sec_apps` (`app_name`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 5. `sec_users_groups` — Associação Usuários vs. Grupos
*   **Chave Primária Composta:** (`login`, `group_id`)
*   **Finalidade:** Relacionamento N:M permitindo que um usuário pertença a múltiplos grupos.
```sql
CREATE TABLE `sec_users_groups` (
  `login` varchar(251) NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`login`,`group_id`),
  CONSTRAINT `sec_users_groups_ibfk_1` FOREIGN KEY (`login`) REFERENCES `sec_users` (`login`) ON DELETE CASCADE,
  CONSTRAINT `sec_users_groups_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `sec_groups` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 6. `sec_logged` — Usuários Ativos em Tempo Real
*   **Chave Primária:** `login` (`VARCHAR(251)`)
*   **Finalidade:** Rastreamento de sessões concorrentes e usuários online.
```sql
CREATE TABLE `sec_logged` (
  `login` varchar(251) NOT NULL,
  `date_login` varchar(128) DEFAULT NULL,
  `sc_session` varchar(32) DEFAULT NULL,
  `ip` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 7. `sc_log` / `sec_log` — Trilha de Auditoria Imutável
*   **Chave Primária:** `id` (`INT AUTO_INCREMENT`)
*   **Finalidade:** Registro de log de auditoria de cada ação executada no sistema (data, usuário, aplicação, IP, ação e descrição).
*   **Regra de Ouro:** Usuários que possuem registros gravados na `sc_log` **não podem sofrer exclusão física do banco**, apenas desativação lógica (`active = 'N'`).
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

---

## 🔄 Protocolo de Tombamento em Duas Fases

O processo de migração foi estruturado para ocorrer estritamente em **2 Fases**:

### 🔹 Fase 1: Desenvolvimento e Validação de Schema (Em Andamento)
1. Re-criação dinâmica das tabelas com tipagem MySQL otimizada (`DECIMAL`, `DATE`, `DATETIME`, `TINYINT(1)`, `VARCHAR`, `TEXT`).
2. Importação em lote (*batch insert* em blocos de 3.000 registros por transação).
3. Ajuste do ponteiro `AUTO_INCREMENT` para `MAX + 1` em cada tabela com chave sequencial.
4. Criação e semeadura inicial do módulo de segurança RBAC (`sec_*`).

### 🔹 Fase 2: Tombamento Definitivo (Virada de Chave / Cutover)
1. **Congelamento:** Bloquear novos lançamentos no sistema legado FoxPro.
2. **Extração Final:** Executar o script `remigrate_exact_schema.py` na raiz do projeto.
3. **Ajuste de Sequenciadores:** Executar `apply_auto_increment_and_schema.py` para recalcular o `MAX + 1` de todas as chaves primárias.
4. **Validação de Totais:** Conferir se a contagem de registros entre os arquivos `.DBF` e as tabelas MySQL VPS1 coincide 100%.
5. **Ativação:** Liberar o acesso operacional exclusivo pelo Groomy ERP.
