# Diretrizes de Desenvolvimento do Workspace Groomy

## 📌 Arquivo Mestre de Planejamento e Memória Continuada
Toda a execução de tarefas e o progresso do desenvolvimento devem ser documentados e orientados através do arquivo [implementation_plan.md](file:///c:/AI-PROJECTS/GROOMY/implementation_plan.md).
- **Leitura Obrigatória:** Todo agente que iniciar neste workspace **DEVE** ler o `implementation_plan.md` logo no primeiro turno para entender o roadmap, as especificações técnicas e as regras ativas.
- **Atualização de Progresso:** Qualquer alteração no escopo, novas decisões de arquitetura ou conclusão de tarefas devem ser documentadas neste arquivo mestre.
- **Versionamento Automatizado:**
  - A marcação de passo iniciado (`[/]`) deve ser feita assim que o agente começar a trabalhar em um item.
  - A conclusão de um passo (`[x]`) deve ser seguida imediatamente por um `git commit` detalhado da entrega.

<!-- BEGIN:database-performance-rules -->
# Diretriz Crítica de Arquitetura de Banco de Dados — Banimento Estrito do Prisma ORM

- **PROIBIDO O USO DO PRISMA ORM:** É estritamente proibido utilizar Prisma ORM para consultas ou manipulação de dados no projeto Groomy. O Prisma introduz camadas pesadas de abstração, mascara problemas reais de infraestrutura/índices e gera queries ineficientes que ocultam os planos de execução do MySQL.
- **PADRÃO OBRIGATÓRIO:** Todas as consultas, relatórios e transações no Next.js devem utilizar **SQL Direto Nativo com Prepared Statements (via `mysql2/promise` ou pool de conexões otimizado)**.
- **TRANSPARÊNCIA E ALTA PERFORMANCE:** Todas as consultas no backend devem ser analisadas diretamente com `EXPLAIN` no MySQL VPS1 para garantir respostas em tempo de execução de **< 5ms**, aproveitando 100% dos índices compostos das tabelas `tbl_`.
<!-- END:database-performance-rules -->
