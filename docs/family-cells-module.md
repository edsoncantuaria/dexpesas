# Famílias Financeiras — Redesign do Módulo de Família

## Visão

Vamos substituir o módulo atual de “famílias”/`clans` por **Famílias Financeiras**: workspaces leves onde cada grupo escolhe como colaborar, controlar seus orçamentos e registrar interações compartilhadas. O objetivo é unir simplicidade (KISS) com flexibilidade de configurações para casais, famílias, repúblicas, projetos pontuais e parceiros informais.

## Objetivos

- Unificar contas, fundos, rateios e permissões dentro de uma única entidade (`FamilyCell`).
- Suportar orçamentos híbridos (pessoal, familiar ou misto) sem duplicar regras.
- Garantir trilha de auditoria clara (timeline) com votações e alertas críticos.
- Tornar a experiência plugável para cenários bem distintos (casal, república, viagem, negócio informal).
- Manter o modo família opcional: usuários solos continuam com sua visão pessoal.

## Fora de Escopo (por enquanto)

- Integrações externas automáticas (Open Finance) dentro da família.
- Apps móveis ou widgets dedicados (reutilizaremos o app web responsivo).
- Automação de PIX/billing real (apenas sugerimos quanto cada membro deve pagar).

## Vocabulário

| Nome             | Descrição |
| ---------------- | --------- |
| **FamilyCell**   | Workspace compartilhado criado por um Owner. Sucede `Clan` e centraliza todas as configurações.
| **Member**       | Usuário dentro da família com um _Role_ padrão e permissões customizadas.
| **Role**         | Perfis pré-definidos (`OWNER`, `MANAGER`, `CONTRIBUTOR`, `VIEWER`).
| **Fund/Caixinha**| Subconta com objetivo, meta e regras. Recebe contribuições automáticas ou pontuais.
| **Shared Account** | Conta bancária ou cartão marcado como coletivo dentro da família.
| **Hybrid Budget** | Orçamento que combina parte pessoal e parte da família (ex.: 50/50, porcentagens customizadas ou linkado a um fundo).
| **Split Rule**   | Regra de rateio automático aplicada a despesas recorrentes ou pontuais.
| **Equilibrium**  | Motor que calcula quem deve para quem e sugere reembolsos automáticos (tipo Splitwise nativo).

## Arquitetura Funcional

### Camadas

- **Frontend (Next App)**: novas telas `/cells` para criação, visão geral, timeline, fundos, rateios e relatórios. O dashboard continua mostrando um card "Família em Destaque" com atalhos.
- **Backend API**: renomeia rotas `/familia` para `/cells` (rotas antigas permanecem por um tempo via proxy) e adiciona serviços específicos (`CellBudgetService`, `SplitEngine`, `EquilibriumService`, `DecisionService`).
- **Persistência**: novas tabelas específicas para fundos, rateios e votos. O schema atual de `clans`, `shared_expenses` e `clan_members` será migrado sem perder histórico.
- **Workers**: jobs para rateios periódicos, alertas de meta, cálculo de equilíbrio e expiração de convites.

### Entidades Principais

| Tabela nova/alterada | Campos-chave | Observações |
| -------------------- | ------------ | ----------- |
| `family_cells` (novo nome de `clans`) | `id`, `name`, `mode` (`CASAL`, `FAMILIA`, `REPUBLICA`, `PROJETO`, `NEGOCIO_INFORMAL`), `governance_policy`, `visibility`, `balance`, `decision_threshold` | `mode` dirige presets. `governance_policy` JSON guarda regras customizadas (ex.: quais roles votam em cada tema). |
| `cell_members` (renomeia `clan_members`) | `user_id`, `cell_id`, `role`, `permissions_json`, `joined_at`, `status` | `permissions_json` guarda flags individuais (ver orçamento pessoal do outro, movimentar fundos, aprovar rateios, etc.). |
| `cell_shared_accounts` | `id`, `cell_id`, `account_id`, `visibility`, `allowed_roles` | Faz ponte com `accounts` existentes para marcar se uma conta pessoal virou compartilhada. |
| `cell_budgets` | `id`, `cell_id`, `category_id`, `label`, `type` (`PERSONAL`, `CELL`, `HYBRID`), `split_config`, `fund_id?`, `limit`, `effective_from` | `split_config` define 50/50, percentual livre ou montantes fixos por membro. |
| `cell_funds` | `id`, `cell_id`, `name`, `target_amount`, `current_amount`, `allowed_roles`, `usage_policy`, `goal_deadline`, `status` | Representa as “Caixinhas”. |
| `cell_fund_contributions` | `id`, `fund_id`, `member_id`, `amount`, `source`, `from_budget_id?`, `created_at` | Histórico completo de aporte e automações. |
| `cell_split_rules` | `id`, `cell_id`, `name`, `trigger` (`RECURRING_BILL`, `ADHOC`, `USAGE_BASED`), `method` (`EQUAL`, `WEIGHTED`, `CONSUMPTION`, `PAYER_REIMBURSED`), `weights_json`, `consumption_metric`, `auto_reimburse` | Casa os cenários de rateio automático. |
| `cell_expenses` (substitui `shared_expenses`) | `id`, `cell_id`, `creator_id`, `description`, `category_id`, `amount`, `budget_id?`, `fund_id?`, `split_rule_id?`, `attachments`, `status`, `paid_at` | Cada lançamento conhece como foi rateado. |
| `cell_expense_splits` | `id`, `cell_expense_id`, `member_id`, `owed_amount`, `status`, `reimbursed_at`, `linked_transaction_id?` | Registra quem pagou o quê e libera o Equilibrium. |
| `cell_decisions` | `id`, `cell_id`, `type` (`EXPENSE_APPROVAL`, `NEW_BUDGET`, etc.), `payload`, `status`, `created_by`, `threshold`, `expires_at` | Alimenta o fluxo de votação rápida. |
| `cell_votes` | `decision_id`, `member_id`, `vote` (`YES`, `NO`, `ABSTAIN`), `justification` | Permite acompanhar histórico. |
| `cell_events` | `id`, `cell_id`, `actor_id`, `type`, `payload`, `created_at`, `visibility` | Alimenta a timeline familiar. |
| `cell_equilibrium_snapshots` | `id`, `cell_id`, `month`, `summary_json` | Guarda os cálculos de quem deve para quem e sugere ajustes.

### Orçamentos Híbridos

- Cada transação continua ligada a `budgets`, porém agora o orçamento pode apontar para `cell_budgets`.
- `type = HYBRID` exige `split_config`: lista de `%` por membro ou fundos (`[{memberId, share}]`).
- Ao lançar despesa, a UI oferece toggles: `Pessoal`, `Cell`, `Rateio`, `Fundo`. Dependendo da opção, o backend registra `TransactionAllocation` contendo `source_type` e `cell_budget_id` ou `cell_fund_id`.

### Caixinhas (Funds)

- Fundos podem ser abastecidos por: contribuições livres, aportes automáticos (ex.: 10% de todo salário que cair numa conta compartilhada) ou conversões de `budgets`.
- Regra de uso: `usage_policy` define quem movimenta (roles e permissões), limite máximo por transação e se exige votação.
- Histórico: `cell_fund_contributions` + `cell_events` mostram quando uma meta chega a 20%, 60%, 100% (gera evento tipo `FUND_PROGRESS`).

### Rateio Automático

- Serviços `SplitEngine` aplicam `cell_split_rules` aos lançamentos recorrentes configurados. Métodos suportados:
  - `EQUAL`: divide igualmente.
  - `WEIGHTED`: pesos salvos em `weights_json` (pessoa/percentual ou valor fixo).
  - `CONSUMPTION`: captura métrica (kWh, nº de pessoas, dias no mês). O input pode vir manualmente ou via integração (ex.: formulário mensal para o responsável informar consumo). O motor normaliza a métrica (ex.: `household_kwh` por membro).
  - `PAYER_REIMBURSED`: quem pagou informa o total e o sistema cria splits automáticos com vínculo à pessoa pagadora.
- `auto_reimburse = true` gera tarefas no Equilibrium para marcar “fulano deve R$X”.
- UI: wizard de 3 passos (definir conta/despesa, escolher método, revisar rateio) conforme pedido pelo usuário.

### Sistema De Roles E Permissões

| Role        | Pode criar família? | Gerencia membros? | Cria orçamentos/contas? | Adiciona transações? | Move fundos? | Vota? |
| ----------- | ------------------ | ------------------ | ----------------------- | --------------------- | ------------ | ----- |
| **Owner**        | Sim | Sim (e transferir ownership) | Sim | Sim | Sim | Sempre |
| **Manager**      | Não | Convida/remove (exceto Owners) | Sim | Sim | Sim | Sim |
| **Contributor**  | Não | Não | Não (salvo permissão extra) | Sim | Conforme permissão | Sim |
| **Viewer**       | Não | Não | Não | Não (a menos que ganhe permissão de registrar despesas) | Não | Pode votar apenas se owner liberar |

`permissions_json` permite granularidade adicional: ver orçamento pessoal dos outros, visualizar contas pessoais, registrar despesas, movimentar fundos, aprovar rateios, reabrir splits.

### Convites E Fluxo De Entrada

1. Owner/Manager envia convite via ID de jogador ou e-mail.
2. Usuário aceita e precisa escolher quais dados pessoais expõe (ver meu orçamento pessoal? sim/não, contas? sim/não). Estas preferências ficam em `cell_member_visibility` (nova tabela leve) ou no próprio `permissions_json`.
3. Após entrada, um checklist orienta: confirmar fundos relevantes, revisar rateios ativos e definir se a pessoa participa do Equilibrium.

### Timeline Familiar (Feed)

- `cell_events` registra tudo: criação de orçamento, despesa rateada, fundo atingindo meta, entrada/saída de membro, voto, alerta de equilíbrio.
- UI: componente no dashboard (cards) e página dedicada com filtros por tipo.
- Eventos trazem CTA contextual (ex.: “Ver rateio”, “Ver fundo”).

### Equilíbrio Familiar

- `EquilibriumService` roda ao criar/atualizar `cell_expense_splits` e também mensalmente.
- Calcula quanto cada membro consumiu vs. quanto pagou: `saldo = pagos - quota_devida`.
- Gera `cell_equilibrium_snapshots` com lista `[{fromUserId, toUserId, amount, suggestedPixMessage}]` e envia notificação.
- Quando um membro marca “recebi/transferi”, atualizamos `cell_expense_splits.status` → `SETTLED` e o snapshot seguinte desconsidera o débito.

### Modos Personalizáveis

- `mode` no `family_cells` define presets:
  - **CASAL**: apenas 2 membros, rateios default 50/50, Equilibrium automático.
  - **FAMILIA**: roles completos, fundos como “Casa”, “Viagem”.
  - **REPUBLICA**: consumo por pessoas/dias, votações obrigatórias para despesas > X.
  - **PROJETO/VIAGEM**: família com data de encerramento, fundos temporários e modo convidado.
  - **NEGOCIO_INFORMAL**: maior foco em contas compartilhadas e fluxo de aprovação.
- Usuário pode customizar qualquer preset após criação.

### Decisões Por Votação

- `DecisionService` cria registro em `cell_decisions` quando uma regra exigir (ex.: novo orçamento acima de R$5.000).
- Cada decisão tem `decision_threshold` (% de votos positivos ou número absoluto). Default: maioria simples dos roles permitidos.
- UI: modal de “3 cliques” (ver resumo, votar, confirmar). Histórico fica disponível.

### Alertas Inteligentes

- Novos tipos de alerta atrelados a família: `CELL_BUDGET_RISK`, `FUND_TARGET_NEAR`, `MEMBER_DELINQUENT`, `EQUILIBRIUM_OFF`.
- Alertas aparecem no dashboard e podem virar notificações push/email.

### Relatórios Pessoal vs Família

- Novo painel `/dashboard/reports/hybrid` que exibe comparativos:
  - `Gastos pessoais x gastos para família` (por período).
  - `Quanto paguei pelos outros` (usa dados do Equilibrium).
  - `Contribuição mensal por fundo`.
- Estes relatórios reutilizam os data loaders existentes com filtros `cell_id`.

## Mudanças De Dados E Migração

1. **Renomear tabelas** (`clans` → `family_cells`, `clan_members` → `cell_members`, etc.) via migrações Prisma.
2. **Backfill**: povoar `permissions_json` com defaults baseados em role atual. Sinalizar que todos os membros existentes participam do Equilibrium.
3. **Shared accounts**: permitir que contas já existentes sejam vinculadas a uma família (bridge table `cell_shared_accounts`).
4. **Histórico**: `shared_expenses` vira `cell_expenses` (nova coluna `split_rule_id` e `allocation_json`).
5. **Auditoria**: migrar logs antigos para `cell_events` (script que transforma `audit_logs` relevantes em eventos).

### Diagrama ER (Resumo)

- `family_cells` é pai principal. Liga-se a `cell_members` (1:N), `cell_budgets`, `cell_funds`, `cell_split_rules`, `cell_expenses`, `cell_decisions`, `cell_events` e `cell_equilibrium_snapshots`.
- `cell_members` referencia `users` (`user_id`) e guarda `permissions_json`. `cell_member_visibility` (nova) relaciona `cell_member_id` ↔ preferências pessoais compartilhadas (1:1).
- `cell_budgets` liga `family_cells` a `categories` (`category_id`) e opcionalmente a `cell_funds`. `split_config` descreve rateios por membro.
- `cell_funds` recebe aportes por `cell_fund_contributions` (1:N). Contribuições referenciam `cell_members` (opcionalmente `transactions` via `source`).
- `cell_split_rules` conecta-se a `cell_expenses` através de `split_rule_id` e dita geração de `cell_expense_splits` (1:N).
- `cell_expenses` substitui `shared_expenses` e referencia `cell_members` (`creator_id`), `categories`, `cell_budgets`, `cell_funds` e `cell_split_rules`.
- `cell_expense_splits` referencia `transactions` (`linked_transaction_id`), gerando insumos para `cell_equilibrium_snapshots`.
- `cell_decisions` e `cell_votes` repetem relacionamento 1:N.
- `cell_events` registra qualquer ação vinculada a `family_cells` e opcionalmente a entidades filhas (`entity_id`, `entity_type`).

### Migrações Detalhadas & Impacto

1. **Renomeação + colunas novas**  
   - Renomear `clans` → `family_cells` mantendo PKs/constraints.  
   - Adicionar colunas novas (`mode`, `decision_threshold`, `governance_policy`, `visibility`).  
   - Atualizar FKs (`clanId` → `cellId`) com `ON DELETE` atuais.
2. **Members/permissões**  
   - Renomear `clan_members` → `cell_members`.  
   - Adicionar `permissions_json`, `status`, `visibility_flags`. Popular com JSON default via script (role → flag).  
   - Adicionar `cell_member_visibility` (opcional) e criar registros default (`sharePersonalBudget: false`, etc.).
3. **Expenses & Splits**  
   - Criar `cell_expenses` e mover dados de `shared_expenses` (mapeando 1:1).  
   - Criar `cell_expense_splits` a partir de `shared_expense_participants` com nova coluna `status` default `OPEN`.  
   - Atualizar referências de transações geradas (`createdTransactionId` → `linked_transaction_id`).
4. **Budgets/Funds**  
   - Criar `cell_budgets` e converter orçamentos familiares existentes (se existirem) para registros default `type=CELL`.  
   - Criar `cell_funds`/`cell_fund_contributions` e migrar dados de metas compartilhadas (metas familiares) para fundos com `goal_deadline` herdado.
5. **Rules/Decisions/Events**  
   - Criar `cell_split_rules`, `cell_decisions`, `cell_votes`, `cell_events`, `cell_equilibrium_snapshots`.  
   - Seed inicial: gerar decisão default para políticas >R$X com base em `policies` antigas (se existirem).  
   - Transformar `audit_logs` relacionados a `/familia` em `cell_events` para manter timeline.
6. **Compatibilidade**  
   - Criar views ou endpoints legados que traduzem `clan` ↔ `family_cell` até Fase 4.  
   - Scripts de verificação: comparar saldo consolidado, ranking e membros antes/depois para garantir consistência.  
   - Planejar rollback (snapshot das tabelas antes da migração).

## API E Serviços

### Endpoints Principais (prefixo `/cells`)

- `POST /cells` – cria família (modo + presets).
- `GET /cells/:cellId` – visão geral com budgets, fundos, timeline resumida.
- `PATCH /cells/:cellId/settings` – altera governance/policies.
- `POST /cells/:cellId/invite` / `POST /cells/invites/:token/accept` – fluxo de convite.
- `PATCH /cells/:cellId/members/:memberId` – atualiza role/permissões/visibilidade.
- `DELETE /cells/:cellId/members/:memberId` – remove membro.
- `POST /cells/:cellId/budgets` + `PATCH`/`DELETE` – CRUD de orçamentos híbridos.
- `POST /cells/:cellId/funds` – criar caixinha; `POST .../contributions` – registrar aporte.
- `POST /cells/:cellId/split-rules` – cria regra automática.
- `POST /cells/:cellId/expenses` – adiciona despesa e aplica rateio.
- `POST /cells/:cellId/decisions` e `POST /cells/:cellId/decisions/:id/vote` – votações.
- `GET /cells/:cellId/equilibrium` – mostra quem deve para quem.
- `POST /cells/:cellId/equilibrium/:pairId/settle` – confirma settle.
- `GET /cells/:cellId/events` – timeline paginada.
- `POST /cells/:cellId/alerts/test` – endpoint interno para QA.

### Serviços Internos

- `CellBudgetService`: valida híbridos, gera `TransactionAllocation`.
- `SplitEngine`: roda rateios e gera splits.
- `EquilibriumService`: consolida débitos e publica snapshots.
- `DecisionService`: regra de votação + expiração.
- `AlertService`: avalia limites e dispara eventos.
- `TimelineService`: normaliza `cell_events` e cria payload para o frontend.

## UX/Telas

1. **Dashboard**: card “Família Financeira” substitui `FamilySummaryCard`. Mostra saldo compartilhado, atalhos para aprovar despesas, status do Equilibrium e link rápido para fundos.
2. **Listagem `/dashboard/cells`**: cards com status (modo, nº de membros, alertas). CTA para criar nova família.
3. **Visão da Família** (tabs):
   - **Home**: saldo, fundos, alertas, timeline resumida.
   - **Transações & Rateios**: lista despesas, regras, botão “Nova divisão (3 passos)”.
   - **Membros & Permissões**: matriz de roles, checkboxes para visibilidade.
   - **Relatórios**: gráficos comparando pessoal vs família.
4. **Wizard de Convite**: Owner define role, permissões extras e quais dados pessoais quer expor.
5. **Timeline**: feed com filtros. Entrada do tipo “Edson pagou R$ 120 no mercado e rateou entre 3 membros” inclui chips para cada membro, botão “ver rateio”.
6. **Equilíbrio**: lista “Você deve / Você tem a receber”. Botões “Registrar Pix” e “Gerar lembrete”.
7. **Configurações**: tela para ajustar políticas (quem vota, limites, modos).

## Observabilidade & Alertas

- Métricas principais: `% de despesas rateadas automaticamente`, `fundos ativos`, `tempo médio de votação`, `valor em aberto no Equilibrium`, `% de membros com contribuições em dia`.
- Logs estruturados por evento (`CELL_EVENT`, `SPLIT_ENGINE_RUN`, `DECISION_EXPIRED`).
- Alertas operacionais quando job de rateio falhar ou quando Equilibrium ultrapassar R$X sem liquidação por Y dias.

## Estratégia De Rollout

1. **Fase 0 – Compatibilidade**: manter `/familia` como proxy para `/cells` com feature flag, garantindo que apps antigos continuem funcionando.
2. **Fase 1 – Dados & Backend**: migrar schema e serviços. Validar via testes de integração + scripts que comparam saldo e ranking antigos vs. novos.
3. **Fase 2 – UX**: liberar novas telas para beta (flag `newCellExperience`).
4. **Fase 3 – Equilibrium & Votos**: ativar motor automático e feed completo.
5. **Fase 4 – Deprecar legado**: remover componentes antigos (`Clan*`) e rotas `/familia` após 2 ciclos mensais.

## Próximos Passos

1. Finalizar diagrama ER e scripts de migração (`clans` → `family_cells`).
2. Definir contratos TypeScript/Prisma para novas entidades (`cell_budgets`, `cell_funds`, etc.).
3. Criar mocks de UX em Figma com foco nos fluxos de orçamentos híbridos, rateio 3 cliques e Equilibrium.
4. Planejar testes automatizados (unitários para motores de rateio/equilíbrio e E2E para convites + votações).
5. Atualizar backlog do time com épicos por fase (backend, frontend, migração de dados, observabilidade).

Este documento servirá como blueprint para implementação incremental das Famílias Financeiras. Ajuste conforme decisões futuras do time de produto e engenharia.

## Feature Flags Planejadas

| Flag | Objetivo | Quem recebe | Observações |
| ---- | -------- | ----------- | ----------- |
| `newCellExperience` | Habilitar novas páginas `/dashboard/cells` e substituir `FamilySummaryCard` no dashboard | Beta interno → grupo de early adopters → 100% | Feature principal; mantém fallback para UI antiga (`/dashboard/clans`). |
| `cellApiV2` | Direcionar o frontend para rotas `/cells` ao invés de `/familia` | Time interno primeiro; clientes com baixo risco | Permite monitorar novos endpoints antes do rollout completo. |
| `equilibriumEngine` | Ativar cálculo automático e tela de equilíbrio | Somente famílias opt-in (Owner ativa) na fase inicial | Requer monitoramento extra de débitos pendentes; fallback manual (Splitwise externo). |
| `decisionWorkflow` | Habilitar votações em 3 cliques e decisões obrigatórias | Owners selecionados / modos REPÚBLICA & NEGOCIO_INFORMAL primeiro | Depende do `cellEvents` estável. |
| `fundsV2` | Nova UX de fundos/caixinhas com metas e regras | Beta curto com casais/famílias | Depende de `cell_funds` e `cell_fund_contributions`. |
| `splitWizard` | Wizard de rateio automático em 3 passos | Quando `SplitEngine` estiver validado | Gera métricas `% de despesas rateadas automaticamente`. |
| `timelineFeed` | Timeline unificada com `cell_events` | Após migração dos audit logs | Necessário para alertas/contexto antes de habilitar votações. |
| `alertsCell` | Novos alertas inteligentes relacionados à família | Paralelo à flag `timelineFeed` | Evita ruído em usuários que ainda não têm família migrada. |

## Checklist de Implementação

### Preparação & Planejamento
- [x] Validar escopo com produto e alinhar critérios de aceite por fase (F0-F4).
- [x] Finalizar diagrama ER, mapear migrações necessárias e revisar impacto em dados existentes.
- [x] Mapear feature flags (`newCellExperience`, `equilibriumEngine`, etc.) para rollout progressivo.
- [x] Atualizar backlog/Jira com épicos e dependências (backend, frontend, migração, QA, observabilidade).

#### Épicos sugeridos (Jira)
- **CELL-BE** – Backend/Core Services  
  - Subtarefas: renomear tabelas e migrar dados, criar `SplitEngine`, `EquilibriumService`, `DecisionService`, expor rotas `/cells`, adicionar observabilidade e logs.
- **CELL-FE** – Frontend/Experiência  
  - Subtarefas: criar navegação `/dashboard/cells`, card “Família Financeira”, tabs Home/Transações/Membros/Relatórios, wizard de convite, UX de orçamentos híbridos/fundos/rateio/timeline/equilibrium.
- **CELL-MIG** – Migração & Compatibilidade  
  - Subtarefas: scripts de backfill (`permissions_json`), proxy `/familia`, verificação pós-migração (saldo/ranking), rollback plan.
- **CELL-QA** – Testes & Qualidade  
  - Subtarefas: unit tests (SplitEngine/Equilibrium), E2E convites e votações, cenários de regressão para orçamentos/fundos, beta plan + feedback loop.
- **CELL-OBS** – Observabilidade & Alertas  
  - Subtarefas: métricas (jobs, equilíbrio aberto), dashboards de monitoramento, alertas operacionais e telemetria de feature flags.

Cada épico inclui dependências explícitas (ex.: CELL-FE depende de CELL-BE/CELL-MIG) e checkpoints de flag para liberar fases (F0-F4).

### Migração de Dados & Infra
- [x] Criar migration Prisma renomeando `clans`/`clan_*` para `family_cells`/`cell_*`.
- [x] Backfill de `permissions_json` com defaults baseados no role atual.
- [x] Migrar `shared_expenses` para `cell_expenses` com histórico de splits.
- [x] Popular `cell_events` a partir de audit logs existentes.
- [x] Configurar jobs/queues necessários (rateio periódico, equilibrium snapshot, alertas).

> Defaults atuais (`permissions_json`):
> - **LEADER/ADMIN**: todos os flags ativos (`manageMembers`, `manageBudgets`, `recordTransactions`, `moveFunds`, `viewPersonalBudget`, `manageFunds`, `vote`, `approveSplits`).
> - **MEMBER**: apenas `recordTransactions` e `vote` como `true`. Os demais ficam `false` até receber permissão específica.

> Migração de despesas: tabelas `SharedExpense` / `SharedExpenseParticipant` foram renomeadas para `cell_expenses` / `cell_expense_splits` via migration dedicada, preservando todo o histórico de splits. Os modelos Prisma agora usam `@@map` para refletir as novas tabelas.
>
> Backfill de `cell_events`: adicionado modelo/migração para a tabela `cell_events` e script `backend/scripts/backfill-cell-events.js` (`npm run events:backfill`). O script:
> - lê `audit_logs` relacionados a `CLAN`, `CLAN_MEMBER`, `CLAN_GOAL`, `CLAN_INVITE` e `SHARED_EXPENSE`;
> - infere o `cellId` a partir dos detalhes ou via lookups (`SharedExpense`, `Goal`, `ClanInvite`);
> - cria eventos com `sourceAuditLogId` para evitar duplicidade (`createMany` com `skipDuplicates`);
> - preenche campos `type`, `title`, `description` e `payload` usando um mapa de ações → eventos e fallback padrão.
>
> Jobs/Queues: configurado um pipeline em BullMQ (Redis) com os seguintes workers (ver `backend/src/queues/cellJobsQueue.js` e workers correspondentes):
> - `SplitEngineJob` (cron diária + disparos manuais): aplica `cell_split_rules` pendentes, gera `cell_expense_splits` e agenda cobranças/reembolsos.
> - `EquilibriumSnapshotJob` (cron semanal e trigger pós-split): consolida débitos/créditos por família e grava `cell_equilibrium_snapshots`, disparando alertas caso valores fiquem em aberto por > X dias.
> - `CellAlertJob` (cron a cada 15min + webhooks): avalia `cell_budgets`, `cell_funds` e `cell_events` recentes para gerar notificações (`CELL_BUDGET_RISK`, `FUND_TARGET_NEAR`, `MEMBER_DELINQUENT`, etc.).
> Cada job emite eventos estruturados para observabilidade (`CELL_JOB_RUN`, `CELL_JOB_ERROR`) e usa telemetry para reportar sucesso/falha, ajudando a monitorar o rollout.
>
> Modelos Prisma: adicionadas as entidades `CellBudget`, `CellFund`, `CellFundContribution`, `CellSplitRule` e `CellEquilibriumSnapshot` (com enums dedicados), além da migration `20251118150000_cell_core_structures` que cria as tabelas `cell_budgets`, `cell_funds`, `cell_fund_contributions`, `cell_split_rules` e `cell_equilibrium_snapshots`. Os relacionamentos já estão disponíveis no client (ex.: `Clan.cellBudgets`, `CellFund.contributions`) para uso nos próximos serviços.
>
> Serviços core criados:
> - `CellBudgetService`: CRUD dos orçamentos híbridos/familiares.
> - `SplitEngineService`: aplica regras (`cell_split_rules`) em despesas compartilhadas e gera splits.
> - `EquilibriumService`: consolida saldos entre membros e persiste `cell_equilibrium_snapshots`.
> - `DecisionService`: registra/atualiza decisões via `cell_events` e gerencia votos.
> - `TimelineService`: helper para registrar/consultar eventos das Famílias.
> - `CellAlertService`: avalia budgets/fundos para gerar alertas (`CELL_BUDGET_RISK`, `FUND_TARGET_NEAR`).
>
> Permissões granulares: middleware `applyCellPermissions` valida `permissions_json`/role antes de acessar budgets, fundos, rateios, decisões, timeline, equilíbrio e alertas (flags como `manageBudgets`, `moveFunds`, `vote`, `viewEquilibrium` etc.).
>
> Proxy temporário: `app.use('/api/familia', cellRoutes)` mantém o endpoint legado funcional enquanto o frontend migra para `/api/cells`. Rotas antigas específicas (`clanRoutes`) foram removidas para evitar divergências duplicadas – todos os acessos agora passam pelo módulo novo.

### Backend/API
- [x] Implementar modelos Prisma novos (`cell_budgets`, `cell_funds`, `cell_split_rules`, etc.).
- [x] Criar serviços (`CellBudgetService`, `SplitEngine`, `EquilibriumService`, `DecisionService`, `TimelineService`, `AlertService`).
- [x] Expor rotas `/cells` equivalentes às antigas `/familia` + novos endpoints (fundos, rateios, decisões, equilibrium).
- [x] Implementar controle granular de permissões por role/flag (visibilidade, movimentação de fundos, votação).
- [x] Garantir compatibilidade temporária via proxy `/familia` → `/cells`.
- [x] Adicionar eventos estruturados (`CELL_EVENT`, `DECISION_CREATED`, etc.) para observabilidade.

### Frontend/UX
- [x] Criar navegação `/dashboard/cells` e card “Família Financeira” substituindo `FamilySummaryCard`.
- [x] Implementar visão da família (tabs Home, Transações & Rateios, Membros, Relatórios).
- [x] Construir wizard de convite com permissões e visibilidade personalizadas.
- [x] Construir fluxo de criação/edição de orçamentos híbridos com seletor Pessoal/Cell/Rateio/Fundo.
- [x] Implementar gestão de fundos (criação, aportes, regras de uso, metas).
- [x] Criar fluxo “rateio em 3 cliques” integrando `cell_split_rules`.
- [x] Implementar Timeline/Feed com filtros e eventos enriquecidos.
- [x] Criar tela Equilibrium com resumo “deve/recebe” e ação “registrar Pix/settle”.
- [x] Ajustar relatórios híbridos (pessoal vs família) e comparativos visuais.

### Segurança & Permissões
- [x] Validar flows de convite/aceite com definição explícita de dados pessoais compartilhados.
- [x] Adicionar validações server-side para cada endpoint seguindo roles/policies definidos.
- [x] Configurar auditoria automática para ações sensíveis (movimentação de fundos, transfer de ownership, decisões).

Notas:
- Convites agora exigem o ID do convidado e armazenam o consentimento solicitado; o convidado aceita/recusa informando quais dados pessoais compartilhar (budget pessoal, contas, dívidas).
- Middleware `applyCellPermissions` + validações nos controllers garantem ownership e limites (inputs positivos, despesa pertence à família). O fluxo de criação de família impede múltipla participação.
- Ações críticas (criar/editar budgets, fundos, rateios, decisões, convites e contribuições) disparam `AuditService.log` e eventos em `TimelineService`.

### Alertas & Observabilidade
- [ ] Implementar novos tipos de alerta (`CELL_BUDGET_RISK`, `FUND_TARGET_NEAR`, etc.) e expor no dashboard.
- [ ] Configurar métricas e logs estruturados para jobs críticos (SplitEngine, Equilibrium, Decision expirations).
- [ ] Criar dashboards/alertas operacionais (ex.: job falhou, equilíbrio desatualizado > X dias).

### Testes & QA
- [ ] Escrever testes unitários para SplitEngine, CellBudgetService e EquilibriumService.
- [ ] Criar testes de integração/E2E cobrindo convites, rateio, fundos, votações, equilíbrio.
- [ ] Planejar beta interno (flag) e monitorar feedback/telemetria antes do rollout completo.

### Rollout & Comunicação
- [ ] Preparar plano de comunicação para usuários (release notes, tooltips explicando Famílias).
- [ ] Monitorar KPIs pós-lançamento (% despesas rateadas, fundos ativos, equilíbrio liquidado).
- [ ] Programar janela para desativar rotas/componentes legados (`Clan*`) após validação.
