# Plano de Implementação & Memória de Desenvolvimento - Groomy

Este arquivo serve como memória recorrente do projeto, permitindo o acompanhamento de todas as etapas concluídas e em andamento para o desenvolvimento do sistema Groomy.

## ⚠️ Regra de Versionamento Automatizada
> **"A marcação de passo iniciado (marcado `[/]`) DEVE ser feita assim que o agente iniciar o trabalho no item, funcionando como sinalizador de atividade ativa no Roadmap. A cada passo concluído (marcado `[x]`) DEVE haver uma execução imediata de um `git commit` detalhando a entrega. SOMENTE a finalização `[x]` dispara commits; a marcação `[/]` serve exclusivamente para controle de execução em tempo real pelo agente atual."**

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
- **Total Migrado:** Mais de 920.000 registros importados em lote com sucesso da base atualizada.

---

## 🗺️ Roadmap de Execução

### Etapa 1: Infraestrutura de Dados & Prototipagem (Concluído)
- [x] Criação do banco de dados MySQL `devcs_banco_groomy` na VPS1 (Tabelas Principais e Complementares)
- [x] Desenvolvimento do script de migração ETL completo (`migrate_dbfs.py`)
- [x] Execução da migração massiva dos DBFs do FoxPro para a VPS1 (Tabelas completas)
- [x] Desenvolvimento do mockup funcional HTML interativo (`index.html`)

### Etapa 2: Inicialização da Aplicação Next.js & Autenticação
- [x] Configuração do projeto Next.js (App Router, TypeScript)
- [x] Configuração da conexão com o banco de dados MySQL na VPS1 (sem Prisma ORM)
- [x] CRUD completo de Gerenciamento de Usuários (`usuarios`) integrado com criptografia Caesar compatível e etiqueta de suporte `FRM-USR` no rodapé
- [ ] Sistema de autenticação seguro (JWT/Cookies) diferenciando:
  - Perfil **Recepção/Administrador** (Desktop)
  - Perfil **Profissional** (Mobile - restrito aos seus próprios lançamentos)


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

### Etapa 6: Módulo de Pagamentos & Relatório de Comissões
- [ ] Lançamento financeiro de pagamentos (PIX, cartões com taxas, dinheiro com descontos)
- [ ] Painel do profissional para consulta e solicitação de baixa de comissões acumuladas
- [ ] Registro histórico de baixas e pagamentos de comissão efetuados

## 🛠️ Diretrizes Globais de Interface e Suporte
- **Identificação Discreta de Telas:** Toda tela da aplicação web (tanto desktop quanto mobile) deve exibir em seu canto inferior direito, com opacidade reduzida e fonte discreta (ex: `text-[10px] text-gray-400/50`), o código único de identificação da tela (ex: `FRM-LGN` para login, `FRM-EXP` para Pedido Expresso, `FRM-AGD` para Agenda, `FRM-ATD` para Atendimento Rápido). Essa convenção ajudará a equipe de suporte e manutenção a identificar com exatidão a view operacional utilizada pelo cliente.


