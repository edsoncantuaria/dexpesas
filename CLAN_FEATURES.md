# Modo Clã: A Aventura Financeira Cooperativa - Documentação de Funcionalidades

**Versão:** 1.0
**Data:** 28 de Agosto de 2024

Este documento detalha a implementação completa do **Modo Clã**, uma expansão que transforma a "Jornada Financeira" de uma experiência individual para uma aventura cooperativa, permitindo que famílias, casais ou amigos gerenciem finanças coletivas de forma gamificada e transparente.

---

## 1. 🏠 Estrutura e Governança do Clã

A base do modo cooperativo é a entidade `Clan`, que possui uma estrutura de governança clara para garantir organização e controle.

### Criação e Gerenciamento
-   **Criação de Clã:** Qualquer usuário que não pertença a um clã pode fundar um novo, tornando-se automaticamente o **Líder**.
-   **Edição de Clã:** O Líder pode editar o nome, a descrição e o ícone do clã a qualquer momento.
-   **Dissolução de Clã:** Apenas o Líder pode dissolver o clã, uma ação que remove todos os membros e apaga a entidade.

### Sistema de Convites
-   **ID de Jogador:** Cada usuário possui um ID único e imutável, visível em sua página de **Perfil**, que pode ser copiado e compartilhado.
-   **Envio de Convites:** O Líder do clã pode usar o ID de outro jogador para enviar um convite de adesão.
-   **Aceitar/Recusar:** O jogador convidado recebe uma notificação na tela de "Clãs" e pode aceitar ou recusar o convite. Ao aceitar, ele se torna um **Membro** do clã.

### Papéis e Permissões
-   **Líder:** Tem controle total sobre o clã. Pode editar informações, gerenciar membros, convidar novos jogadores e registrar despesas coletivas.
-   **Membro:** Pode visualizar as finanças do clã, contribuir para o caixa comum, participar de metas e interagir no chat.

---

## 2. 💰 Finanças Coletivas: O Tesouro do Clã

O coração do Modo Clã é a capacidade de gerenciar um fundo monetário compartilhado, o **Caixa Comum** (`Clan Bank`).

### Caixa Comum
-   **Contribuições:** Membros podem transferir dinheiro de suas contas pessoais para o Caixa Comum. Essa transação é registrada como uma **despesa** na conta pessoal do membro e um **crédito** no saldo do clã, garantindo a integridade dos saldos.
-   **Despesas Coletivas:** O Líder (ou futuramente, um Admin) pode registrar despesas que são pagas com o saldo do Caixa Comum. O sistema **impede** o registro se o saldo do clã for insuficiente, garantindo que o caixa nunca fique negativo.

### Metas Financeiras do Clã
-   **Criação:** O Líder pode definir metas financeiras para o grupo (ex: "Viagem de Fim de Ano").
-   **Contribuição Coletiva:** Assim como no Caixa Comum, qualquer membro pode contribuir para as metas, com o valor sendo debitado de sua conta pessoal.

### Rateio Automático de Despesas
-   **Funcionalidade Chave:** Uma despesa paga pelo Caixa Comum (ex: "Conta de Internet") pode ser **rateada igualmente** entre todos os membros.
-   **Integração com Orçamento Pessoal:** Ao ser rateada, o sistema **cria automaticamente uma transação de despesa no histórico pessoal de cada membro**. Isso garante que o orçamento individual de cada um reflita sua parcela de responsabilidade nas contas do grupo, cumprindo um dos objetivos centrais do projeto.

---

## 3. 🕹️ Gamificação Coletiva

O progresso do clã é medido e recompensado, incentivando a colaboração.

### Nível e EXP do Clã
-   **Progresso Visível:** O Clã possui seu próprio nível e barra de EXP, exibidos no cabeçalho da página do clã.
-   **Como Ganhar EXP:** O clã ganha pontos de experiência por ações financeiras positivas, principalmente:
    -   Contribuições para o Caixa Comum.
    -   Contribuições para as Metas do Clã.
-   **Base Justa:** O ganho de EXP está diretamente atrelado a ações que têm um lastro financeiro real, prevenindo exploits.

### Feed de Atividade e Ranking
-   **Mural da Guilda:** A página do clã possui um feed de atividades que exibe as últimas ações relevantes (contribuições, registro de despesas, etc.), garantindo transparência.
-   **Ranking:** Uma aba dedicada mostra um ranking com os membros da guilda, ordenados por nível, promovendo uma competição saudável.

---

## 4. 💬 Comunicação em Tempo Real

Para fortalecer os laços sociais, o sistema de comunicação foi otimizado.

-   **Chat do Clã:** Cada clã possui uma sala de chat exclusiva.
-   **Polling Inteligente:** O sistema foi aprimorado para verificar novas mensagens em intervalos regulares **apenas quando o painel de chat está aberto**, otimizando a performance e a eficiência da comunicação. A interface agrupa mensagens consecutivas do mesmo usuário para uma melhor legibilidade.

---

## 5. 🔒 Integridade e Segurança

-   **Transações Atômicas:** Todas as operações financeiras (contribuições, rateios) são realizadas de forma atômica. Se qualquer parte do processo falhar, a operação inteira é revertida.
-   **Validação de Saldo:** O sistema valida rigorosamente os saldos tanto da conta pessoal (ao contribuir) quanto do caixa do clã (ao registrar despesa).
-   **Trilha de Auditoria:** Todas as ações financeiras do clã são registradas no `AuditLog`, garantindo um histórico completo e rastreável.
