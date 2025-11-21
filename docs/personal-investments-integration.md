# Integração de Investimentos Pessoais

## Por que agora

- Usuários em modo solo ainda lidam apenas com **contas, metas e orçamentos**, sem uma visão clara do que sobra para investir ou reservar para lazer.
- Embora exista a categoria `Investimentos` e contas do tipo `investimento`, o produto não sugere aportes, não rastreia rentabilidade e não valida se o plano está funcionando.
- A ausência de um fluxo dedicado mantém usuários dependentes de planilhas e impede diferenciação frente a concorrentes como Mobills+, que já entregam envelopes para “Sonhos” mas não unem orçamentação, automações e IA.

## Objetivos do módulo

1. **Planejamento pessoal**: oferecer uma aba “Investimentos” totalmente separada de células familiares.
2. **Análise de excedente inteligente**: calcular mensalmente quanto do orçamento pode ir para investimentos x lazer sem quebrar compromissos essenciais.
3. **Execução guiada**: permitir aportes manuais ou automatizados (via contas internas) e registrar o destino (CDB, Tesouro, ETF, etc.).
4. **Validação contínua**: acompanhar rentabilidade e sinalizar se vale a pena manter ou rebalancear.
5. **Transparência acionável**: mostrar uma linha do tempo que comprove que o plano está sendo seguido, com nudges gerados pela camada de IA já existente.

## Escopo & exclusões

| Incluído | Fora do escopo inicial |
| --- | --- |
| Usuários individuais (sem `cellBudgetId`) | Integrações de custódia em corretoras externas |
| Contas `investimento` internas, metas e automações | Famílias compartilhando carteiras |
| Registro manual de rentabilidade e aportes | Sugestões de ativos específicas (limitar a classes) |

## Arquitetura proposta

### Modelos (Prisma)

| Modelo | Campos essenciais | Observações |
| --- | --- | --- |
| `InvestmentPlan` | `id`, `userId`, `priority` (`investir` ou `lazer`), `targetPercent`, `targetAmount`, `leisureFloor`, `status` | Guarda estratégia do usuário (ex.: “20% em investimentos, mínimo R$ 400 de lazer”). |
| `InvestmentAccount` (reuso de `Account`, `tipo = investimento`) | adicionar `riskLevel`, `goal`, `institution`, `autoSync` | Mantém compatibilidade com contas existentes; novos campos via `AccountMetadata`. |
| `InvestmentHolding` | `id`, `investmentAccountId`, `assetClass`, `ticker`, `currentAmount`, `expectedReturn`, `createdAt` | Permite rastrear rentabilidade por ativo. |
| `InvestmentContribution` | `id`, `planId`, `accountId`, `holdingId?`, `amount`, `fromAccountId`, `leisureImpact`, `status`, `source` (`manual`, `automation`, `windfall`, `aiSuggestion`) | Histório de aportes com vínculo ao excedente calculado. |
| `InvestmentSnapshot` | `id`, `planId`, `month`, `totalInvested`, `totalReturns`, `leisureSpent`, `deltaVsPlan`, `commentaryJson` | Base para análises e gráficos. |

> **Implementação**: adicionar os modelos ao prisma, regenerar Prisma e criar migration. Reaproveitar enums existentes (`AccountType`, `AutomationType`, etc.).

### Backend

1. **Serviço de planejamento (`investmentPlannerService.js`)**
   - Função `calculateFreeToInvest(userId, month)` coleta:
     - Receitas confirmadas (`transaction.tipo = receita`, pago true).
     - Orçamentos pessoais aprovados (`budget` sem `cellBudgetId`).
     - Gastos essenciais (categorias marcadas como essenciais).
   - Aplica hierarquia:
     1. Reserva mínima para despesas fixas.
     2. Reserva de emergência (configurável).
     3. Quota de lazer (pode ser percentual ou piso em reais).
     4. Saldo restante sugerido para investimento.
   - Expõe resultado como `InvestmentAnalysisDTO`.
2. **Controller `/investments`**
   - `GET /investments/plan` → retorna plano + análise do mês.
   - `POST /investments/plan` → cria/atualiza prioridades, percentuais e limites.
   - `POST /investments/contributions` → registra aporte (cria 2 transações contábeis e vincula a `InvestmentContribution`).
   - `GET /investments/performance?month=YYYY-MM` → alimenta gráfico com `InvestmentSnapshot`.
3. **Jobs**
   - `investment-monthly-rollup`: roda no D+1 de cada mês, gera snapshot usando dados reais.
   - `investment-smart-nudge`: usa `AiAnalysis` com tipo `OPPORTUNITY_ANALYSIS` para detectar quando o usuário desviou da estratégia.

### Frontend (Next.js)

Nova rota `src/app/dashboard/investimentos/page.tsx` com 3 seções:
1. **Analisador Inteligente**: cards “Receita do mês”, “Essenciais”, “Sobra para investir”, “Lazer recomendado”. Mostra sliders alimentados pelo Planner.
2. **Carteiras & Aportes**: tabela de contas `investimento`, aportes recentes e botão “Registrar aporte”.
3. **Rentabilidade**: gráfico (linha + barras) usando `InvestmentSnapshot`.

Componentes auxiliares:
- `InvestmentPlannerCard` (mostra recomendações e permite ajustar percentuais).
- `InvestmentHoldingList` (por classe: Renda Fixa, Fundos, Cripto).
- `LeisureVsInvestmentGauge` (stack bar comparando gasto real x plano).

## Fluxos principais

1. **Onboarding do plano**
   - Usuário responde: renda fixa mensal, percentual alvo para investimentos, mínimo de lazer e tolerância de risco.
   - Cria `InvestmentPlan` com defaults sugeridos (ex.: 50/30/20 adaptado).
2. **Cálculo mensal do excedente**
   - Cron job chama `calculateFreeToInvest`.
   - Resultado aparece no dashboard como “Você tem R$ X livres, sugerimos investir R$ Y e reservar R$ Z para lazer”.
3. **Registro de aporte**
   - Usuário escolhe conta de origem (corrente/poupança) e destino (investimento/holding).
   - Backend cria duas transações (saída + entrada) usando categoria `Investimentos` para manter consistência com relatórios.
   - `InvestmentContribution` guarda se o aporte afeta a cota de lazer.
4. **Validação de rentabilidade**
   - Usuário informa rendimento (manual) ou usa taxa predefinida por classe (Tesouro Selic, CDI, etc.).
   - Job `investment-monthly-rollup` calcula `totalReturns` e marca `deltaVsPlan`.
5. **Rebalanceamento**
   - Se `deltaVsPlan` ficar negativo por 2 meses, `investment-smart-nudge` cria notificação e sugestão de ajuste (ex.: reduzir lazer temporariamente ou pausar aportes).

## Algoritmo de sobra inteligente

Pseudo-etapas usadas pelo Planner:

1. `netIncome = receitasConfirmadas - impostosRetidos`.
2. `essentials = soma(orçamentos essenciais)`.
3. `safetyBuffer = max(emergencyFundTarget / 12, fixedMonthlyIncome * 0.1)`.
4. `leisureFloor = max(plan.leisureFloor, netIncome * plan.leisurePercentualMin)`.
5. `available = netIncome - essentials - safetyBuffer`.
6. `suggestedInvestment = clamp(available * plan.targetPercent, plan.targetAmountMin, available - leisureFloor)`.
7. `leisureSuggested = available - suggestedInvestment`.

Se `available <= 0`, o Planner sugere cortar categorias supérfluas antes de aportar e gera insight via IA.

## UX e conteúdo

- Microcópias destacam que o módulo **não movimenta dinheiro real**, apenas planeja/aponta decisões.
- “Modo Projeção”: campo hipotético “E se eu reduzir lazer em R$ 200?” reaproveita componente de metas (`goal-projection.tsx`).
- Lista de ativos pré-configurados (Renda Fixa, Renda Variável, Cripto) com descrições educativas curtas.
- Badge “Plano em dia” sincronizado com gamificação (recompensa XP quando 3 aportes consecutivos respeitarem a estratégia).

## Métricas de sucesso

- `% de usuários solo que criam um plano de investimento em 30 dias`.
- `Valor médio aportado / receita mensal`.
- `Taxa de aderência ao plano` (aporte >= 80% do sugerido por 3 meses).
- `Nudges convertidos` (usuário ajusta lazer ou aporte após sugestão da IA).
- `Churn vs. adopção do módulo`.

## Roadmap sugerido

| Fase | Itens | Tempo estimado |
| --- | --- | --- |
| 0 - Fundamentos | Models + endpoints `GET/POST /investments/plan`, cálculo do planner, UI com cards estáticos | 1 sprint |
| 1 - Execução | Registro de aportes, gráficos, job `monthly-rollup`, integração com automação Round-Up | 1 sprint |
| 2 - Inteligência | Nudges com IA, projeções “what-if”, badges de gamificação | 1 sprint |
| 3 - Evolução | Classes de ativos configuráveis, importação CSV de investimentos externos, API pública | backlog |

## Riscos & mitigação

- **Dados inconsistentes**: transações ou orçamentos podem estar incompletos → guardar `confidenceScore` em `InvestmentSnapshot` e avisar o usuário.
- **Complexidade para leigos**: demasiadas opções → usar presets (Conservador, Balanceado, Agressivo).
- **Duplicidade com metas**: metas financeiras já guardam dinheiro → permitir ligar meta ↔ holding para não duplicar aportes.

## Como validar se “vale a pena”

- Mostrar rentabilidade acumulada por plano e comparar com CDI no período.
- Se `totalReturns < CDI` por 3 meses, criar insight “Considere migrar para Tesouro Direto / CDB 110% CDI”.
- Para lazer: se gasto real < piso, sugerir mover sobra para investimentos. Se gasto real > teto, recomendar ajuste e exibir impacto no prazo dos objetivos.

> Resultado: um módulo pessoal inteligente, alinhado ao restante da plataforma, que analisa gastos, define sobras para investir/lazer e permite validar continuamente se o plano está entregando valor.
