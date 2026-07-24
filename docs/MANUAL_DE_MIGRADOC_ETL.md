# Manual de Migração e Tombamento de Dados — FoxPro para MySQL (Groomy)

Este documento estabelece as diretrizes de arquitetura, especificação de schema e o protocolo de execução em duas fases para a conversão e o tombamento definitivo do banco de dados do sistema legado **CSI (Visual FoxPro DBF)** para o novo banco de dados **MySQL VPS1 (`devcs_banco_groomy`)**.

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

## 🔄 Protocolo de Tombamento em Duas Fases

O processo de migração foi estruturado para ocorrer estritamente em **2 Fases**:

### 🔹 Fase 1: Desenvolvimento e Validação de Schema (Em Andamento)
*   **Objetivo:** Criar e testar todas as rotas da aplicação Next.js contra um snapshot atualizado da base de dados.
*   **Execução:**
    1. Re-criação dinâmica das tabelas com tipagem MySQL otimizada (`DECIMAL`, `DATE`, `DATETIME`, `TINYINT(1)`, `VARCHAR`, `TEXT`).
    2. Importação em lote (*batch insert* em blocos de 3.000 registros por transação).
    3. Ajuste do ponteiro `AUTO_INCREMENT` para `MAX + 1` em cada tabela com chave sequencial.

### 🔹 Fase 2: Tombamento Definitivo (Virada de Chave / Cutover)
*   **Objetivo:** Executar o congelamento final da base FoxPro no dia da virada para o Groomy.
*   **Checklist de Execução da Virada:**
    1. **Congelamento:** Bloquear novos lançamentos no sistema legado FoxPro.
    2. **Extração Final:** Executar o script `remigrate_exact_schema.py` na raiz do projeto.
    3. **Ajuste de Sequenciadores:** Executar `apply_auto_increment_and_schema.py` para recalcular o `MAX + 1` de todas as chaves primárias.
    4. **Validação de Totais:** Conferir se a contagem de registros entre os arquivos `.DBF` e as tabelas MySQL VPS1 coincide 100%.
    5. **Ativação:** Liberar o acesso operacional exclusivo pelo Groomy ERP.

---

## 🛡️ Gestão de Acesso, Segurança e Controle RBAC

A segurança do sistema é gerenciada separadamente nas tabelas dedicadas de controle de acesso (padrão Scriptcase RBAC + `sc_log`):
*   `sec_users`: Contas de usuários, logins, senhas em hash MD5, token de recuperação `user_tk` e ativador `active`.
*   `sec_groups`: Definição dos grupos de trabalho (Administrador, Recepção, Profissionais).
*   `sec_users_groups`: Relação M:N entre usuários e grupos.
*   `sec_apps`: Módulos e telas com código discreto no canto inferior direito (ex: `FRM-LGN`, `FRM-USR`, `FRM-WTP`, `FRM-CHK`).
*   `sec_groups_apps`: Permissões granulares de acesso (Ler, Gravar, Alterar, Excluir).
*   `sc_log`: Registro de auditoria imutável (bloqueia exclusão física de usuários auditados).

---

## 📜 Histórico de Versões e Atualizações do Manual
*   **v1.0 (24/07/2026):** Restauração da paridade de nomes de campos 1:1, eliminação do sufixo `_legado`, e configuração da continuidade sequencial com `AUTO_INCREMENT = MAX + 1`.
