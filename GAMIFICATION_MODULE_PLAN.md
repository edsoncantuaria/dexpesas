# Plano de Implementação — Módulo de Gamificação (Tema RPG) para App de Finanças

**Objetivo:** projetar e documentar um módulo de gamificação robusto, seguro, administrável (Game Master) e Mobile First. Entrego: arquitetura, modelos de dados (Prisma / MySQL), endpoints, eventos, fluxos (missões, guildas, boss), UI/UX Mobile First, lógica de XP/níveis, controle anti-fraude, testes e roteiro de deploy. No final há um **prompt completo** que você pode usar com uma IA para gerar código/documentação automaticamente.

> Antes de começar: vou aplicar sua regra de parceiro intelectual — abaixo há uma seção **Análise Crítica** onde analiso suposições, apresento contrapontos, testo lógica e ofereço perspectivas alternativas.

---

# Sumário (documento gerado)

1. Visão Geral e Requisitos
2. Arquitetura (microserviços / eventos)
3. Modelo de Dados (Prisma / MySQL) — UserProfile, Missões, Items, Guilda, Bosses, Logs
4. Lógica de Atributos e Fórmulas (Força, Resistência, Sabedoria, Sorte)
5. XP, Níveis e Regras (curva de níveis, travas, regras de negativo)
6. Fluxos de Jogo (missão, aventura, guilda, boss) — diagramas textuais + payloads JSON
7. API do Módulo de Gamificação (endpoints + exemplos)
8. Backend: Processamento de Eventos (webhooks / message queue) + pseudocódigo
9. Admin (Game Master) — UI/Permissões/Operações sem código
10. Frontend Mobile-First — estrutura React + exemplos de componentes + animações UX
11. Segurança, Anti-fraude e Auditoria
12. Observabilidade, logs e monitoramento (métricas chave)
13. Roteiro de Deploy e Integração com o App Financeiro
14. Análise Crítica (suposições, riscos, contrapontos, alternativas)
15. Prompt robusto (para IA) — “copy/paste” pronto

---

# 1. Visão Geral e Requisitos

* Separar **lógica financeira** (core do app) da **gamificação** (microserviço). O core emite eventos; o gamification service consome e atualiza estados de jogo.
* Admin (Game Master) precisa criar missões, itens, eventos temporários e monitorar progresso **sem tocar código**.
* Mobile First: UX pensado para telas pequenas; animações sutis e feedback rápido.
* Segurança: usuário não pode manipular XP/itens via frontend. Todas as decisões são calculadas e validadas no backend.
* Persistência: MySQL/MariaDB via Prisma (conforme sua preferência).

---

# 2. Arquitetura (alta-nível)

Clientes (App iOS/Android/React web)
→ API Gateway / Auth Service (JWT + Refresh)
→ Event Bus (ex.: RabbitMQ / Redis Streams / Kafka)
→ **Microservice: Gamification Service** (Node.js/TypeScript, Express/Nest/Koa)
→ **(Fase 2) WebSocket Server** (para chat em tempo real)
→ Banco: MySQL (Prisma)
→ Admin UI (React + Tailwind/shadcn) -> chama Gamification Admin API
→ Observability: logs (morgan), métricas (Prometheus), APM (Elastic/APM)

**Principais motivos da escolha:**

* Event-driven separa responsabilidade e evita latência no core financeiro.
* Gamification service pode ser escalado independentemente.
* Admin UI direto no service facilita mudanças ad-hoc por Game Master.

---

# 3. Modelo de Dados (Prisma — MySQL)

A seguir um **esboço** de `schema.prisma` focado em gamificação. Ajuste nomes de campos conforme seu padrão.

CRIE NO models.json, NUNCA FAÇA DIRETO no `schema.prisma` 


model User {
  id                 Int       @id @default(autoincrement())
  email              String    @unique
  name               String?
  avatarUrl          String?
  isAdmin            Boolean   @default(false)
  // Gamification fields
  level              Int       @default(1)
  xpSinceLevel       Int       @default(0) // pode ser negativo
  xpTotal            BigInt    @default(0) // soma (ganhos - perdas)
  strength           Float     @default(0)
  resilience         Float     @default(0)
  wisdom             Float     @default(0)
  luck               Float     @default(0)
  heroClass          String?   // Protetor/Curador/Mago etc.
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  // relations
  inventoryItems     UserItem[]
  userMissions       UserMission[]
  guildId            Int?
  guild              Guild?    @relation(fields: [guildId], references: [id])
}

model Mission {
  id             Int       @id @default(autoincrement())
  title          String
  description    String
  xpReward       Int
  itemRewardId   Int?
  minLevel       Int       @default(1)
  requiredClass  String?
  triggerSpec    Json      // ex: {"type":"TRANSACTION_COUNT","count":5,"windowDays":7}
  isRepeatable   Boolean   @default(false)
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
}

model UserMission {
  id           Int      @id @default(autoincrement())
  user         User     @relation(fields: [userId], references: [id])
  userId       Int
  mission      Mission  @relation(fields: [missionId], references: [id])
  missionId    Int
  acceptedAt   DateTime @default(now())
  progressJson  Json    // estrutura livre para progresso
  completedAt  DateTime?
  rewardClaimed Boolean @default(false)
}

model Item {
  id           Int      @id @default(autoincrement())
  key          String   @unique
  name         String
  type         String   // "consumable" "cosmetic" "bonus"
  bonusJson    Json?    // e.g. {"xpMultiplier":1.1}
  rarity       String?  // common/rare/epic/legendary
  createdAt    DateTime @default(now())
}

model UserItem {
  id       Int    @id @default(autoincrement())
  user     User   @relation(fields: [userId], references: [id])
  userId   Int
  item     Item   @relation(fields: [itemId], references: [id])
  itemId   Int
  qty      Int    @default(1)
}

model Guild {
  id        Int     @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
  members   User[]
  xpPool    BigInt  @default(0)
}

model Boss {
  id           Int     @id @default(autoincrement())
  name         String
  hp           BigInt
  currentHp    BigInt
  rewardJson   Json
  isActive     Boolean @default(false)
  startAt      DateTime?
  endAt        DateTime?
  createdAt    DateTime @default(now())
}

model AuditLog {
  id          Int      @id @default(autoincrement())
  actorId     Int?
  actorType   String?  // "USER"|"ADMIN"|"SYSTEM"
  action      String
  payload     Json?
  createdAt   DateTime @default(now())
}
```

> Observação: use `Json` para `triggerSpec` e `progressJson` para flexibilidade nas missões.

---

# 4. Fórmulas e Atributos do Herói

## Fórmulas (diretamente implementáveis no backend)

* **Força** = `(RendaMensal / RendaMediaPopulacao) * 100`

  * *Exemplo:* renda 4.000, renda média 2.500 → força = (4000/2500)\*100 = 160
* **Resistência** = `(ValorReserva / MediaGastosMensais) * 10`

  * *Exemplo:* reserva 6.000, gastos 2.000 → resistência = (6000/2000)\*10 = 30
* **Sabedoria** = `(OrcamentosConcluidos / OrcamentosCriados) * 100`

  * *Se nenhum orçamento criado → sabedoria = 0 (evitar divisão por zero).*
* **Sorte** = `(TotalDividasQuitadas / TotalDividasRegistradas) * 100`

  * *Se 0 dívidas registradas → definir sorte = 50 (valor neutro) ou 0 — decida com product.*

> Arredonde para 1 casa decimal no campo exibido; armazene como `Float`.

---

# 5. XP, Níveis e Regras

## Regras importantes (conformes solicitado)

* Níveis vão de **1 a 1000**.
* **XP** pode subir e ficar negativo; porém **nível nunca diminui**.
* XP negativo não faz o usuário descer de nível; o progresso (xpSinceLevel) mostra negativo até que o usuário recupere.
* **Trava anti-roubo**: limitação por evento, verificação de idempotência e detecção heurística (ver seção anti-fraude).

## Função de XP necessária para subir de nível

Uma fórmula escalável (exponencial moderada) para até 1000 níveis:

```text
xpNeeded(level) = floor( base * level^exp )
Onde:
  base = 100
  exp = 1.15
```

* Exemplo primeiros níveis:

  * level 1 -> xpNeeded ≈ 100
  * level 2 -> ≈ 229
  * level 3 -> ≈ 370
  * level 10 -> ≈ 1413
  * level 100 -> ≈ 100 \* 100^1.15 ≈ 100 \* 1412.5 ≈ 141250

(ajuste `base` e `exp` conforme sua curva de progressão desejada; eu recomendo `base 100, exp 1.15` para balancear jogabilidade até 1000)

## Processo de atualização de XP (pseudocódigo)

```ts
function processXpChange(user, deltaXp) {
  user.xpTotal += deltaXp;
  user.xpSinceLevel += deltaXp;

  while (user.xpSinceLevel >= xpNeeded(user.level)) {
    user.xpSinceLevel -= xpNeeded(user.level);
    user.level += 1;
    // registrar evento LEVEL_UP no audit
  }
  // never decrease level even if xpSinceLevel < 0
  save(user);
}
```

> Se `xpSinceLevel` ficar negativo, mantenha o nível. Interface exibe `XP para próximo nível = xpNeeded(level) - max(0, xpSinceLevel)` (se xpSinceLevel negativo, mostra que falta mais).

## Recompensas numéricas de exemplo

* Registrar transação: +5 XP (limite diário 10 transações → 50 XP/dia)
* Criar orçamento: +10 XP
* Cumprir meta (objetivo de economia): +200 XP
* Quitar dívida: +300 XP
* Atraso de pagamento: -50 XP
* Estouro de orçamento: -30 XP
* Gastos em categoria "vício": -10 XP por transação

Esses valores são *sugeridos* e devem ser parametrizáveis no Admin.

---

# 6. Fluxos de Jogo — exemplos detalhados

## Fluxo: Aceitar e completar missão

1. Usuário abre Listagem de Missões (GET `/missions?active=true`).
2. Aceita missão (POST `/user-missions`).
3. Backend cria `UserMission` com `progressJson` inicial e `acceptedAt`.
4. Sistema中心 escuta eventos (ex.: `TRANSACTION_CREATED`) e atualiza `progressJson` conforme `triggerSpec`.
5. Se condição satisfeita → marca `completedAt` e aplica `xpReward` (processXpChange) + itens.
6. Notificação push: "Missão completada — +200 XP".

### Payload de evento (TRANSACTION\_CREATED)

```json
{
  "eventType": "TRANSACTION_CREATED",
  "userId": 123,
  "transaction": {
    "id": "tx_987",
    "amount": 75.60,
    "category": "BaresERestaurantes",
    "date": "2025-08-01T18:00:00Z",
    "accountId": 12,
    "tags": ["noite", "jantar"]
  },
  "timestamp": "2025-08-01T18:00:01Z"
}
```

## Fluxo: Batalha de Boss (evento coletivo)

1. Admin cria `Boss` ativo com HP total = 1.000.000 (representando uma dívida grande).
2. Evento ativado: `BOSS_CREATED` com `startAt`, `endAt`.
3. Usuários “atacam” realizando ações financeiras positivas (pagamentos, economia) que geram **damage**:

   * Damage formula: `damage = Math.floor(baseDamage * (user.strength / 100) * xpMultiplierFromItems)`
   * Ex.: pagamento de dívida de R\$200 → baseDamage=200 => damage \~ 200 \* (strength/100)
4. Gamification service atualiza `Boss.currentHp -= totalDamageFromAction`.
5. Se `currentHp <= 0` → Boss derrotado, recompensa distribuída conforme regras definidas (por contribuição %).

## Fluxo: Guilda — orçamento coletivo

1. Admin cria `GuildGoal` (meta R\$5.000 em mês).
2. Cada usuário pode "contribuir" com economia rastreada; progressos somados em `Guild.xpPool` ou `GuildProgress`.
3. Recompensa: XP e item cosmético distribuído a participantes que atingiram threshold.

## Diário de Bordo / Linha do Tempo (Visual)

* Evento por linha: `2025-08-05 — Missão 'Economize 5 dias' completada — +100 XP`
* Mostrar medalhas, badges, screenshot de avatar com cosmetic equipados.
* Implementar backend endpoint: `GET /users/:id/timeline?limit=50` que junta AuditLog transformado em eventos legíveis.

## **(Fase 2) Chat da Guilda em Tempo Real (WebSocket)**

A implementação atual do chat funciona via *polling* (buscando novas mensagens ao abrir). A próxima fase é torná-lo um chat em tempo real.

1.  **Tecnologia:** Introduzir um servidor WebSocket (usando bibliotecas como `ws` ou `Socket.IO` no Node.js).
2.  **Fluxo de Conexão:**
    *   Quando um usuário abre o painel de chat, o frontend estabelece uma conexão WebSocket com o servidor.
    *   O servidor autentica o usuário via token JWT e o inscreve no "canal" (room) da sua guilda.
3.  **Envio de Mensagens:**
    *   Quando o usuário envia uma mensagem, ela ainda é enviada para a API `POST /api/guilds/:guildId/messages` para ser persistida no banco de dados.
    *   **Após salvar**, o backend emite um evento (ex: `NEW_GUILD_MESSAGE`) para o servidor WebSocket.
    *   O servidor WebSocket, por sua vez, transmite a nova mensagem para todos os clientes conectados no canal daquela guilda.
4.  **Recebimento de Mensagens:**
    *   O frontend de cada membro da guilda estará ouvindo por mensagens do WebSocket. Ao receber uma, ele a adiciona instantaneamente à lista de mensagens na UI, sem necessidade de recarregar.
5.  **Indicador "Está Digitando...":**
    *   Quando um usuário começa a digitar no frontend, ele emite um evento "typing_start" para o WebSocket.
    *   O servidor WebSocket transmite esse status para os outros membros da guilda.
    *   Quando o usuário para de digitar (ou envia a mensagem), um evento "typing_stop" é enviado para remover o indicador.

---

# 7. API do Módulo — Endpoints (exemplos)

## Gamification Public/User (token JWT)

* `GET /v1/missions` — listar missões ativas
* `POST /v1/user-missions` `{ missionId }` — aceitar missão
* `GET /v1/user-missions` — listar missões do usuário
* `POST /v1/user-missions/:id/claim` — pedir recompensa (só se completedAt e !rewardClaimed)
* `GET /v1/users/:id/status` — retorna level, xp, atributos, inventário, timeline
* `GET /v1/bosses` — listar bosses ativos
* `POST /v1/users/:id/equip-item` `{ itemId }` — equipar item (validação backend)

## Admin (Game Master) — (RBAC: isAdmin only)

* `POST /v1/admin/missions` — criar missão (accepts triggerSpec, xpReward, itemReward)
* `PATCH /v1/admin/missions/:id` — editar missão
* `POST /v1/admin/events` — criar evento (XP doble, boss)
* `POST /v1/admin/items` — criar item
* `GET /v1/admin/dashboard` — visão resumo: missão progress, ranking guilda, logs
* `POST /v1/admin/bosses` — criar/ativar boss
* `POST /v1/admin/trigger-event` — simular evento (útil p/ testes)

> Todos os endpoints de admin autenticados e com logs de auditoria.

---

# 8. Backend — Processamento de Eventos (pseudocódigo / patterns)

### Estratégia recomendada

* **Event Bus**: mensagens do core financeiro (TRANSACTION\_CREATED, BUDGET\_CREATED, BUDGET\_BREACHED, DEBT\_PAID) chegam em uma fila.
* Gamification Service consome eventos, valida assinatura HMAC, processa e atualiza estado.

### Exemplo simples (Node.js/TypeScript + RabbitMQ pseudocódigo)

```ts
// consumer
channel.consume("events", async msg => {
  const event = JSON.parse(msg.content.toString());
  if (!verifySignature(msg.properties.headers['x-signature'], msg.content)) {
    log.warn("Invalid signature"); channel.ack(msg); return;
  }
  switch(event.type) {
    case 'TRANSACTION_CREATED':
      await handleTransactionCreated(event);
      break;
    case 'DEBT_PAID':
      await handleDebtPaid(event);
      break;
  }
  channel.ack(msg);
});
```

### handleTransactionCreated

* Atualiza missões com triggers `TRANSACTION_COUNT`, `CATEGORY_SPEND`, etc.
* Calcula xp ganho/perda.
* Salva `AuditLog`.
* Publica `GAME_XP_CHANGED` se apropriado (para analytics/notifications).

---

# 9. Admin (Game Master) — funcionalidades e UI

**Requisitos UI Admin:**

* Painel sem código para criar/editar:

  * Missões (visual builder para `triggerSpec` com presets).
  * Eventos temporários (XP x2, Boss).
  * Itens e conquistas (com upload de ícones).
  * Bestiário (criar monstros, HP, recompensas).
* Ferramentas analíticas:

  * Rankings (top XP, top contribuições boss).
  * Logs (filtráveis por usuário / ação / data).
  * Ferramenta de rollback (revogar XP/impor penalidade) com justificativa e log.

**Design UX (Admin):**

* Componentes reusáveis: List, Form (TRIGGER BUILDER), Modal de confirmação com justificativa.
* Actions guarded: operações que afetam muitos usuários exigem confirmação e autenticação 2FA.

---

# 10. Frontend Mobile-First (React + Vite)

**Estrutura de pastas (sugestão):**

```
src/
  components/
    Dashboard/
      HeroCard.tsx
      MissionList.tsx
      BossBar.tsx
    Common/
      Avatar.tsx
      ProgressBar.tsx
  pages/
    Home.tsx
    Missions.tsx
    Guild.tsx
    Admin/
  hooks/
    useGameState.ts
  services/
    api.ts
```

**Exemplo de `HeroCard` (esqueleto)**

```tsx
export default function HeroCard({ user }) {
  return (
    <div className="p-4 rounded-2xl shadow-md bg-gradient-to-br from-slate-900 to-indigo-900">
      <div className="flex items-center">
        <img src={user.avatarUrl} className="w-16 h-16 rounded-full mr-3" />
        <div>
          <div className="text-lg font-bold">{user.name}</div>
          <div className="text-sm">Nível {user.level} • {user.heroClass}</div>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar value={calcProgress(user)} label="XP" />
      </div>
    </div>
  );
}
```

**Mobile First UX Tips**

* Priorize tap targets >= 44px.
* Barra inferior fixa com acesso rápido a Missões/Guilda/Perfil.
* Gerais: feedback tátil (quando disponível), micro-animations ao ganhar XP (confetti leve), evitar modais grandes — preferir bottom sheets.

---

# 11. Segurança, Anti-fraude e Auditoria

## Princípios

* Toda alteração que concede XP/itens é **server-side**.
* Verificar validade da origem dos eventos: HMAC + idempotency-key.
* Taxas e limites por usuário para evitar “farming”:

  * Limite diário por tipo de ação (ex.: XP por transação limitada a 10 transações/dia).
  * Delays mínimos entre ações que dão XP da mesma natureza.
* Heurísticas e detecção:

  * Fluxos anormais (múltiplas contas com IP parecido, seqüência de micro-transações com XP).
  * Se heurística ativa → marcar `user.suspected` e notificar admin.
* Logs de auditoria imutáveis (append-only) com referência a evento externo (transactionId).

## Controle de Acesso

* Admin endpoints protegidos via JWT + claim `isAdmin`.
* Operações sensíveis exigem 2FA (ex.: ativar boss, distribuir recompensas massivas).
* Regra de privilégios: `isAdmin=true` apenas para perfis aprovados; manter lista de admins no DB.

---


# 12. Observabilidade e Logs

* Logs estruturados (JSON) com `AuditLog` no DB.
* Métricas:

  * `xp_awarded_total`
  * `xp_awarded_per_event_type`
  * `events_processed_per_minute`
  * `mission_completion_rate`
* Alertas:

  * pico de erros no service
  * suspeita de farming (detected\_fraud > threshold)

---

# 13. Deploy e Integração

* Webhook security: registrar IPs/assinaturas, rate-limit e tls.

---

# 14. Análise Crítica (sua regra: suposições/contrapontos/teste de lógica/alternativas)

## 1) Suposições implícitas — o que se está assumindo?

* Assumimos que rastrear métricas financeiras com precisão é possível (transações categorizadas com consistência).

  * **Problema**: transações mal categorizadas podem distorcer atributos (p.ex. "vício" marcado incorretamente).
  * **Mitigação**: permitir feedback do usuário para reclassificação e processo de reavaliação automático.

* Assumimos que gamificação aumenta comportamento desejado (economizar/quitar dívidas).

  * **Contraponto**: pode incentivar práticas que agradam o sistema mas prejudicam finanças (ex.: micro-transações para farmar XP).
  * **Mitigação**: projetar regras de XP que priorizem qualidade (pagamentos de dívida, metas, consistência) sobre quantidade.

## 2) Riscos e harms

* **Privacidade & LGPD**: gamificação usa dados sensíveis financeiros. Deve ser claro consentimento e retenção mínima.
* **Manipulação**: usuários podem tentar burlar com scripts ou criar múltiplas contas.
* **Impacto psicológico**: gerar frustração se penalidades forem severas.

## 3) Teste lógico rápido (falhas potenciais)

* Regra: "nível nunca cai" + "xpSinceLevel pode ficar negativo" → como mostrar progresso para o usuário?

  * **Falha UX**: usuário com xpSinceLevel = -200 e xpNeeded=100 pode ver "faltam 300XP" o que é confuso.
  * **Solução**: exibir como "XP atual: -200; XP para próximo nível: 300 (quando XP >= 0, progressa)". Ou mostrar barra com área negativa em vermelho.

## 4) Alternativas

* Em vez de curva exponencial fixa, usar **rotas de progressão por ‘capas’**: atingir milestones (capas) em intervalos grandes para motivação (p.ex. tier Bronze/Silver/Gold) — facilita percepção de progresso.
* Sistema de micro-achievements com streaks que resetam semanalmente — incentiva engajamento contínuo.

---

# 15. Prompt para IA (Final)

Inclui tudo que pedimos: schemas feito no models.json, endpoints, fluxos e documentação exigida.

```
Você é um engenheiro sênior fullstack + arquiteto de sistemas. Gere um módulo de gamificação com tema RPG para um aplicativo de finanças seguindo estritamente estas especificações:

1) Visão Geral
- Separar o módulo de gamificação como microserviço (Node.js + TypeScript) consumindo eventos do core financeiro (TRANSACTION_CREATED, BUDGET_CREATED, BUDGET_BREACHED, DEBT_PAID).
- Persistir em MySQL/MariaDB via Prisma.
- Fornecer Admin UI em React para um "Game Master" controlar missões, eventos temporários, itens e bestiário.

2) Modelos de dados (Prisma) — incluir modelos: User (com campos gamification), Mission, UserMission, Item, UserItem, Guild, Boss, AuditLog. Gerar schema.prisma completo.

3) Atributos do jogador (UserProfile)
- Implementar fórmulas:
  - Força = (RendaMensal / RendaMediaPopulacao) * 100
  - Resistência = (ValorReserva / MediaGastosMensais) * 10
  - Sabedoria = (OrcamentosConcluidos / OrcamentosCriados) * 100
  - Sorte = (TotalDividasQuitadas / TotalDividasRegistradas) * 100
- Padrões de armazenamento e arredondamento.

4) XP e Níveis
- Níveis 1..1000
- xpNeeded(level) = floor( base * level^exp ) ; sugerir base=100 exp=1.15
- Explicar algoritmo `processXpChange(user, deltaXp)` garantindo que nível nunca decresça.
- Incluir travas anti-farming: limites diários e heurísticas.

5) Regras de recompensa e penalidade (valores default e parametrizáveis)
- Registrar transação: +5 XP (limite diario)
- Criar orçamento: +10 XP
- Quitar dívida: +300 XP
- Atraso: -50 XP
- Estouro budget: -30 XP
- Gastos vício: -10 XP
- Permitir o admin alterar estes valores via UI.

6) Missões, Aventuras, Boss e Guild
- Especificar triggerSpec JSON para missões (ex.: TRANSACTION_COUNT, CATEGORY_SPEND, PAYMENT_MADE, etc.)
- Flow completo pra boss battle: criação, damage calculation, contribuição %, distribuição de recompensas.
- GuildGoal: meta compartilhada e como distribuir recompensa proporcional.

7) API
- Listar endpoints (User + Admin) com método, path, body e exemplos de resposta JSON.
- Incluir header requirements (Authorization: Bearer <jwt>, x-idempotency-key, x-signature para eventos).

8) Event Consumer
- Mostrar pseudocódigo/TypeScript para consumir eventos (RabbitMQ/Redis) e aplicar mudanças idempotentes.
- Validar assinatura HMAC para eventos de origem do core financeiro.

9) Admin UI
- Esboçar telas/classe de componentes (MissionBuilder, EventScheduler, ItemEditor, Bestiary, Dashboard).
- Requisitos UX Mobile-first para Admin (responsive, confirmations, 2FA para ações massivas).

10) Frontend User (mobile-first)
- Componentes principais (HeroCard, MissionList, BossBar, Timeline).
- UX patterns: bottom navigation, bottom-sheet, micro-animations, feedback, acessibilidade.

11) Segurança e Anti-Fraude
- Políticas: eventos server-side, HMAC, rate-limits, heuristics para farming.
- Logs e auditoria append-only.
- Recomendação de 2FA p/ Game Master e logs de rollback.

12) Observabilidade
- Métricas a coletar, exemplos de logs JSON, alertas.

13) Documentação
- Gerar README com arquitetura, instalação (docker), env vars (DATABASE_URL, RABBITMQ_URL, HMAC_SECRET), endpoints e exemplos de payloads.
- Gerar Postman collection ou Swagger/OpenAPI (definição mínima obrigatória).

14) Entregáveis
- Código base do microserviço (estrutura de diretórios), prisma schema, scripts de migration, exemplos de seed (missões, items, boss).
- Admin UI skeleton (React + Tailwind).
- 10 exemplos de missões e 3 exemplos de bosses com triggerSpec e rewards.
- Plano de rollout (feature flags, A/B test para XP rates).

15) Análise Crítica
- Incluir seção que aponte suposições, riscos (LGPD, comportamento do usuário), possíveis formas de burlar e contramedidas.

**Formato de resposta:** gere tudo em Markdown organizado, incluindo:
- models.json
- exemplos de payloads JSON
- pseudocódigo TypeScript para event consumer e actions críticas
- exemplos de testes Jest
- documentação de API (tabelas) e instruções Docker
```

---

# Exemplos práticos (rápidos) — JSONs e Pseudocódigo

## Exemplo de `triggerSpec` de missão

```json
{
  "type": "TRANSACTION_COUNT",
  "count": 5,
  "windowDays": 7,
  "category": null
}
```

## JSON — Missão criada

```json
{
  "id": 1,
  "title": "Registro inicial",
  "description": "Registre 5 transações em 7 dias para ganhar XP",
  "xpReward": 50,
  "triggerSpec": {
    "type": "TRANSACTION_COUNT",
    "count": 5,
    "windowDays": 7
  }
}
```

## Pseudocódigo: aplicar XP quando missão completa

```ts
async function onMissionComplete(userMission) {
  const user = await db.user.findUnique({id: userMission.userId});
  await processXpChange(user, userMission.mission.xpReward);
  userMission.rewardClaimed = true;
  await db.userMission.update(userMission);
  await sendPush(user.id, `Missão ${userMission.mission.title} completada! +${userMission.mission.xpReward} XP`);
}
```

---

# Checklist de Entrega (para você validar)

* [ ] Prisma schema criado e migrado
* [ ] Microservice com consumer de eventos (ex.: RabbitMQ)
* [ ] Admin UI capaz de criar missões e bosses
* [ ] Documentação (README + OpenAPI)
* [ ] Planos de monitoramento e rollback
