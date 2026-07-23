# Plano de Implementação & Memória de Desenvolvimento - Groomy

Este arquivo serve como memória recorrente do projeto, permitindo o acompanhamento de todas as etapas concluídas e em andamento para o desenvolvimento do sistema Groomy.

## ⚠️ Regra de Versionamento Automatizada
> **"A marcação de passo iniciado (marcado `[/]`) DEVE ser feita assim que o agente iniciar o trabalho no item, funcionando como sinalizador de atividade ativa no Roadmap. A cada passo concluído (marcado `[x]`) DEVE haver uma execução imediata de um `git commit` detalhando a entrega. SOMENTE a finalização `[x]` dispara commits; a marcação `[/]` serve exclusivamente para controle de execução em tempo real pelo agente atual."**

---

## 🗺️ Roadmap de Execução

### Etapa 1: Infraestrutura de Dados & Prototipagem (Concluído)
- [x] Criação do banco de dados MySQL `devcs_banco_groomy` na VPS1
- [x] Desenvolvimento do script de migração ETL (`migrate_dbfs.py`)
- [x] Execução da migração massiva dos DBFs do FoxPro para a VPS1 (600k+ registros importados)
- [x] Desenvolvimento do mockup funcional HTML interativo (`index.html`) com suporte a drag-and-drop, cupom de atendimento e comissões em tempo real

### Etapa 2: Inicialização da Aplicação Next.js
- [ ] Configuração do projeto Next.js (App Router, TypeScript)
- [ ] Configuração da conexão com o banco de dados MySQL na VPS1 (sem Prisma ORM, utilizando queries nativas ou query builder leve para alta performance)
- [ ] Configuração do sistema de rotas e layout base do painel administrativo

### Etapa 3: Módulo de Agendamento de Profissionais
- [ ] Criação do componente visual de grade/agenda por colunas (uma coluna por Profissional)
- [ ] Integração do comportamento Drag & Drop com persistência imediata no banco de dados via Server Actions
- [ ] Exibição em tempo real de conflitos ou indisponibilidade de horários

### Etapa 4: Módulo de Atendimento Rápido & Comissões
- [ ] Criação da tela de lançamento ágil focada em navegação rápida por teclado (Enter, Tab e seletores com busca rápida)
- [ ] Cálculo automático e exibição de comissões em tempo real durante a montagem do pedido
- [ ] Desenvolvimento de Server Action em transação atômica MySQL para finalização de atendimentos:
  - Salvar pedido/venda na tabela `atendimentos` e itens na `itens_atendimento`
  - Gerar registros de comissão pendente para o profissional na tabela `comissoes`
- [ ] Geração e visualização do cupom de pedidos para impressão

### Etapa 5: Módulo de Pagamentos & Comissões
- [ ] Lançamento financeiro de pagamentos (PIX, cartões, dinheiro)
- [ ] Painel para os profissionais consultarem suas comissões acumuladas e solicitar baixas
- [ ] Registro histórico de baixas e pagamentos de comissão efetuados
