# Checklist – Melhorias e Modo Opcional da Gamificação

- [x] **Sincronizar cálculo de XP**  
  - Backend expõe `xpToNextLevel` calculado via `xpNeeded(level)` no endpoint `/gamification/profile`.  
  - Frontend atualiza `GamificationProfile` para usar os mesmos valores retornados e remover a constante fixa de 1000 XP.

- [x] **Mostrar progresso das missões**  
  - `FinancialQuests` renderiza barras ou contadores baseados em `progressJson` de `UserMission`.  
  - Missões em andamento exibem “faltam X ações” ou percentual de conclusão.

- [x] **Adicionar novos gatilhos de XP/penalidades**  
  - Incluir eventos sociais (contribuição na guilda, missões coletivas) e de rotina (streaks de reconciliação, check-ins) em `gamificationEvents`.  
  - Definir limites diários/semanais para evitar farming.

- [x] **Carregar gamificação de forma preguiçosa**  
  - Dashboard principal carrega dados financeiros primeiro e busca módulos de gamificação apenas se habilitados.  
  - Componentes como `DailySummaryCard` tratam ausência do perfil sem bloquear renderização.

- [x] **Tornar a gamificação opcional**  
  - Adicionar campo `gamificationMode` (`FULL`, `LITE`, `OFF`) na tabela de usuários e no tipo `User`.  
  - Incluir opção de escolha no onboarding e nas configurações.  
  - Ajustar serviços/rotas para ignorar gamificação quando `OFF` e limitar recursos quando `LITE`.  
  - Atualizar o dashboard para mostrar apenas os cards compatíveis com o modo atual.

- [ ] **Experiência do usuário ao alternar modos**  
  - Salvar layouts diferentes (`dashboardLayout`) por modo.  
  - Exibir um toast/tooltip explicando o que muda ao ativar ou desativar a gamificação.  
  - Garantir que XP e conquistas pausadas sejam retomadas ao voltar para o modo completo.
