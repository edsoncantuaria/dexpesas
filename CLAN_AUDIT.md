# Auditoria Completa do Modo Clã - Relatório de Funcionalidades

**Versão:** 1.2
**Data:** 28 de Agosto de 2024

Este documento detalha o funcionamento de todas as funcionalidades implementadas para o Modo Clã, servindo como um guia técnico e de validação da lógica de negócios e de gamificação.

---

## 1. 🏠 Estrutura e Governança

A base do clã foi construída com foco em uma hierarquia clara e mecanismos que garantem a continuidade e a ordem.

### Criação e Associação de Membros
*   **Como funciona:** Qualquer usuário pode fundar um clã, tornando-se seu `Líder`. O sistema impede que um usuário que já pertence a um clã (`clanId` não é nulo) crie ou se junte a outro, garantindo a regra de **um clã por usuário**.
*   **Validação:** **Concluído e Robusto.**

### Sistema de Convites
*   **Como funciona:**
    1.  **ID de Jogador:** Cada usuário tem seu ID único (`User.id`) visível na página de Perfil, com um botão para cópia rápida.
    2.  **Envio:** O Líder (ou Admin) usa este ID para enviar um convite através de um modal na página do clã. O backend cria um registro na tabela `ClanInvite` com status `PENDING` e validade de 7 dias.
    3.  **Aceite/Recusa:** O jogador convidado vê os convites pendentes em sua página de Clãs (`/dashboard/guildas`). Ao aceitar, o sistema o adiciona como `MEMBER` no clã e atualiza o status do convite.
*   **Validação:** **Concluído e Funcional.**

### Papéis e Permissões
*   **Como funciona:** O sistema agora diferencia três papéis (`ClanRole`): `LEADER`, `ADMIN`, e `MEMBER`.
    *   **Líder:** Controle total. Pode editar o clã, convidar, gerenciar papéis, remover membros e transferir a liderança.
    *   **Admin:** Papel intermediário. Pode convidar novos membros e aprovar despesas do caixa comum. Não pode editar o clã nem gerenciar outros membros.
    *   **Membro:** Pode visualizar finanças, contribuir e participar das atividades.
*   **Validação:** **Concluído e Funcional.**

### Sucessão de Liderança
*   **Como funciona:** O Líder pode, através do menu de gerenciamento de um membro, iniciar o processo de **transferência de liderança**. Uma transação atômica no backend (`clanController.js`) garante que o antigo líder se torne `ADMIN` e o novo membro se torne `LEADER` de forma segura.
*   **Validação:** **Concluído e Funcional.**

---

## 2. 💰 Finanças & Caixa Comum

A integridade das finanças coletivas é o pilar de confiança do clã.

### Contribuições para o Caixa e Metas
*   **Como funciona:** Quando um membro contribui (seja para o caixa ou para uma meta), o sistema executa uma **transação atômica** (`prisma.$transaction`). Primeiro, ele cria uma **despesa** na conta pessoal do membro. Somente se essa etapa for bem-sucedida, o valor é creditado no saldo do clã/meta.
*   **Validação:** **Concluído e Robusto.** A lógica garante que o dinheiro do clã tenha sempre um lastro financeiro real, prevenindo a criação de fundos "fantasmas".

### Despesas e Rateio Automático
*   **Como funciona:** Líderes e Admins podem registrar despesas pagas pelo caixa comum. A função `splitExpense` no `clanController.js` faz o seguinte:
    1.  Valida se o saldo do clã é suficiente.
    2.  Debita o valor total do caixa do clã.
    3.  Cria a despesa mestre no `SharedExpense`.
    4.  Para **cada membro do clã**, cria uma transação de despesa pessoal no valor rateado.
*   **Validação:** **Concluído.** As despesas do clã agora impactam corretamente o orçamento pessoal de cada membro.

### Correção de Lançamentos (Rollback)
*   **Como funciona:** Líderes e Admins têm um botão "Reverter" no feed de atividades para cada despesa do clã. A função `reverseClanExpense` credita o valor de volta ao caixa e atualiza o `AuditLog` para indicar que a transação foi revertida.
*   **Validação:** **Concluído e Funcional.**

### Proteção de *Overfunding*
*   **Como funciona:** A lógica de `contributeToClanGoal` agora verifica se o `status` da meta é `IN_PROGRESS` antes de permitir uma nova contribuição. Metas concluídas não aceitam mais fundos.
*   **Validação:** **Concluído.**

---

## 3. 🕹️ Gamificação Coletiva

A gamificação foi expandida para incentivar a colaboração e recompensar o sucesso do grupo.

### Nível e EXP do Clã
*   **Como funciona:** O clã ganha EXP por ações financeiras coletivas positivas, principalmente contribuições para o caixa e para as metas. O ganho de EXP é proporcional ao valor contribuído, tornando-o justo e resistente a exploits de microtransações.
*   **Validação:** **Concluído e Balanceado.**

### Missões Coletivas
*   **Como funciona:** O modelo `Mission` agora possui um campo `scope`. Se o `scope` for `GUILD`, o `gamificationService.js` agrega o progresso de todos os membros do clã (ex: soma de transações de todos) para verificar se a missão foi concluída.
*   **Validação:** **Estrutura Concluída.** O sistema está pronto para processar missões de guilda. A criação de missões específicas depende agora do "Game Master".

### Recompensas Coletivas
*   **Como funciona:** Ao completar uma missão de guilda, a função `completeUserMission` foi adaptada para iterar sobre todos os membros do clã e distribuir a recompensa (XP e/ou itens) individualmente para cada um.
*   **Validação:** **Estrutura Concluída.**

---

## 4. 🔒 Integridade e Segurança

*   **Trilha de Auditoria:** **Concluído.** Todas as ações financeiras e de governança do clã (convites, promoções, contribuições, despesas, reversões) geram um registro detalhado no `AuditLog`, garantindo total transparência.
*   **Prevenção de Duplicidade:** **Parcialmente Concluído.** Embora uma `idempotency-key` completa não tenha sido implementada, lógicas de validação no backend (ex: não permitir pagamentos de fatura idênticos no mesmo dia) mitigam o risco de ações duplicadas por cliques repetidos.

---

### **Resumo da Auditoria**

O Modo Clã evoluiu de um MVP para um sistema robusto e funcional, com as principais brechas de governança e integridade financeira resolvidas. A plataforma agora suporta uma experiência cooperativa completa, desde a gestão de membros até a execução de missões coletivas e a manutenção de um caixa comum seguro e auditável. As bases para futuras expansões, como rankings entre clãs e eventos sazonais, estão solidamente estabelecidas.
