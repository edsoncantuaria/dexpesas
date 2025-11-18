# Operações do Modo Família

## Atualização obrigatória após este patch

1. Rode o migration e regenere o Prisma Client:
   ```bash
   cd backend
   npx prisma migrate dev --name add_last_synced_at_to_cell_budget
   npx prisma generate
   ```
2. Reinicie o worker BullMQ (`node backend/src/workers/cellJobsWorker.js` ou serviço equivalente) para que a tarefa `budget-mirror-rollup` passe a sincronizar os meses atual e seguinte e registre `lastSyncedAt`.
3. Um job diário (`family-budget-resync`) agora roda às 03h30 para ressincronizar automaticamente todas as famílias (útil quando alguém é removido manualmente). O script abaixo só é necessário se quiser adiantar a correção sem esperar o job.

## Resync após remover um membro manualmente

- Quando um administrador remover um membro fora do fluxo “Sair do Modo Família” (por exemplo via painel interno ou SQL), execute:
  ```bash
  cd backend
  node scripts/resync-family-budgets.js <familyId>
  ```
- Isso garante que os espelhos pessoais ligados àquele membro sejam limpos e recriados conforme as novas permissões.

## Dicas

- Use o job `budget-mirror-rollup` (agenda diária padrão às 05h) para forçar replicação para o mês seguinte sempre que ajustar limites recorrentes.
- O campo `lastSyncedAt` aparece no dashboard para que os usuários saibam quando o limite familiar foi aplicado pela última vez. Se notar defasagem, rode o script acima.*** End Patch
