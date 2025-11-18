## Prisma Migrations – Boas práticas para evitar dores de cabeça

Quando começamos a mexer com novas features (como o Modo Família), é comum sair editando o `schema.prisma`, rodar um `prisma migrate dev` localmente e depois descobrir que a migration não “bate” com o banco remoto. A seguir está o fluxo recomendado para evitar P3009/P3018 e outros traumas:

### 1. Prepare o ambiente local
1. Garanta que `DATABASE_URL` local aponte para um banco **só seu** (docker ou MySQL local).
2. Sempre rode `npx prisma generate` após alterar o schema.

### 2. Crie migrations incrementalmente
1. Após um conjunto de alterações no schema, execute:
   ```bash
   npx prisma migrate dev --name nome_descritivo
   ```
2. Revise o SQL gerado em `prisma/migrations/<timestamp_nome>/migration.sql`. Ajuste manualmente nomes de índices/tabelas se necessário (MySQL tem limites de tamanho).
3. Faça `git add` tanto do `schema.prisma` quanto da pasta `prisma/migrations`.

### 3. Teste a migration em um banco limpo
1. Use `npx prisma migrate reset --force --skip-seed` **no seu ambiente local** para confirmar que todas as migrations aplicam desde zero.
2. Suba o backend e confira se os novos modelos funcionam.

### 4. Aplicando em staging/produção
1. Antes de rodar `npx prisma migrate deploy`, faça backup do banco ou confira se há snapshot automatizado.
2. Execute:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```
3. Se o deploy falhar:
   - Use `npx prisma migrate status` para ver a migration travada.
   - Ajuste o SQL e rode:
     ```bash
     npx prisma migrate resolve --rolled-back <migration_name>
     ```
   - Em seguida `npx prisma migrate deploy` novamente.

### 5. Nunca edite migrations já aplicadas
Se a migration já foi aplicada no banco remoto, não altere o SQL dela. Em vez disso:
- crie uma nova migration com o fix, **ou**
- se for crítico, resolva com `migrate resolve --rolled-back`, ajuste o arquivo e reaplique.

### 6. Dicas extras
- Nomeie migrations de forma clara (ex: `add_cell_budget_mirrors`).
- Prefira nomes curtos em índices/constraints (`@@unique(..., map: "Budget_user_cat_month_key")`).
- Documente no PR quais comandos devem ser executados após merge (`migrate deploy`, `generate`, `seed`).

Seguindo esse checklist, reduzimos bastante o risco de travar o deploy por causa de migrations corrompidas.
