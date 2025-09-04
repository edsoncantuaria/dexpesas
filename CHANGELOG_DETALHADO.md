# Changelog Detalhado de Otimizações e Melhorias

**Versão:** 2.0
**Data:** 25 de Agosto de 2024

Este documento detalha as otimizações de arquitetura, performance e experiência de usuário implementadas no sistema "Jornada Financeira".

---

## Seção 1: Otimizações de Performance e Arquitetura

### 1.1. Otimização de Consultas de Agregação no Backend
-   **O que foi feito:** As funções que buscam os saldos de contas (`getAllAccounts`) e cartões (`getAllCards`) foram refatoradas. Em vez de fazer duas consultas separadas ao banco para somar receitas e despesas, agora é feita uma **única consulta** que agrupa os valores por tipo.
-   **Por que foi feito:** Reduzir o número de "viagens" de rede entre o servidor e o banco de dados. Isso diminui a latência e melhora o tempo de resposta das APIs mais acessadas do sistema.
-   **Locais afetados:** `backend/src/controllers/accountController.js`, `backend/src/controllers/cardController.js`.
-   **Pontos de Atenção para Testes:** Verificar se os saldos de todas as contas e os saldos devedores dos cartões continuam sendo exibidos corretamente nas suas respectivas páginas.

### 1.2. Desacoplamento da Geração de URLs de Imagens
-   **O que foi feito:** A lógica para gerar URLs de acesso para imagens (avatares, imagens de metas) foi removida do backend (`goalController`, `userController`) e movida para o frontend. Foi criado um novo endpoint (`POST /api/storage/get-url`) que o frontend chama sob demanda.
-   **Por que foi feito:** A geração síncrona de múltiplas URLs estava criando um gargalo, deixando o carregamento da página de metas lento. Com essa mudança, a página carrega os dados de texto instantaneamente e as imagens aparecem logo em seguida.
-   **Locais afetados:** `backend/src/controllers/goalController.js`, `backend/src/controllers/userController.js`, `backend/src/routes/storageRoutes.js`, `src/components/dashboard/hero-profile.tsx`, `src/components/dashboard/metas/goal-list.tsx`, `src/components/ui/attachment-previewer.tsx`.
-   **Pontos de Atenção para Testes:** Confirmar que o avatar do usuário no menu e na tela de perfil continua aparecendo. Verificar se as imagens das metas na página de Metas são carregadas corretamente. Testar o upload e a pré-visualização de imagens no formulário de metas.

### 1.3. Otimização do Fluxo de Registro de Usuário
-   **O que foi feito:** Removida a tentativa de criar categorias padrão a cada novo registro de usuário. A lógica de regras padrão agora é gerenciada em memória pelo `categorizationService`.
-   **Por que foi feito:** Tornar o processo de registro de novos usuários mais rápido e leve, eliminando operações de escrita desnecessárias no banco de dados. Centraliza a "fonte da verdade" dos dados padrão.
-   **Locais afetados:** `backend/src/controllers/authController.js`, `backend/src/services/categorizationService.js`, `backend/src/config/seedData.js`.
-   **Pontos de Atenção para Testes:** Criar um novo usuário para garantir que o processo de registro funciona sem erros. Em seguida, criar uma transação para esse novo usuário sem definir uma categoria e verificar se a categoria correta (baseada nas regras padrão) é aplicada automaticamente.

### 1.4. Performance da Edição de Transações Simples
-   **O que foi feito:** O endpoint de atualização de transação foi otimizado. Para transações simples (que não são recorrentes nem parceladas), o sistema agora faz um `update` direto no banco, em vez de deletar e recriar.
-   **Por que foi feito:** Aumentar drasticamente a velocidade de salvamento ao editar as transações mais comuns, tornando a experiência mais fluida.
-   **Locais afetados:** `backend/src/controllers/transactionController.js`.
-   **Pontos de Atenção para Testes:** Editar uma transação simples (que não seja parcela de uma compra) e confirmar que a alteração é salva rapidamente e os dados são refletidos corretamente na lista.

### 1.5. Otimização do Carregamento da Tela de Transações
-   **O que foi feito:** A página de Transações agora carrega por padrão apenas os dados do mês atual. Ao navegar pelo carrossel de meses, ela faz uma nova requisição ao backend buscando apenas os dados daquele mês específico.
-   **Por que foi feito:** Evitar o carregamento de todo o histórico de transações de uma só vez, o que causava lentidão na abertura da página. A navegação entre os meses se torna instantânea.
-   **Locais afetados:** `src/app/dashboard/transacoes/page.tsx`, `backend/src/controllers/transactionController.js`.
-   **Pontos de Atenção para Testes:** Navegar entre diferentes meses usando o carrossel na tela de transações e confirmar que a lista de transações e o resumo do mês são atualizados corretamente e de forma rápida.

---

## Seção 2: Melhorias de Experiência do Usuário (UI/UX)

### 2.1. Refatoração do Painel de Notificações
-   **O que foi feito:** As ações de notificações (como "Marcar como Paga") agora são botões clicáveis diretamente no item da notificação, eliminando o diálogo modal intermediário.
-   **Por que foi feito:** Simplificar o fluxo do usuário e reduzir o número de cliques necessários para executar uma ação, tornando a interação mais direta e rápida.
-   **Locais afetados:** `src/components/dashboard/notifications/notification-panel.tsx`, `src/components/dashboard/notifications/notification-item.tsx`.
-   **Pontos de Atenção para Testes:** Abrir o painel de notificações, encontrar uma notificação de conta vencida e clicar diretamente no botão "Marcar como Paga". Verificar se a ação é executada e a notificação some.

### 2.2. Simplificação do Modal de Criação de Transação
-   **O que foi feito:** O formulário de "Nova Transação" foi redesenhado. As opções complexas como parcelamento e recorrência agora ficam ocultas em seções expansíveis.
-   **Por que foi feito:** Deixar a interface mais limpa e focada no essencial para o registro de transações rápidas, sem remover as funcionalidades avançadas, que agora estão a um clique de distância.
-   **Locais afetados:** `src/components/dashboard/transacoes/add-transaction-form.tsx`.
-   **Pontos de Atenção para Testes:** Abrir o modal para criar uma nova transação. Verificar se a interface está mais limpa. Expandir as seções "Compra Parcelada" e "Repetir Transação" para garantir que todas as opções avançadas ainda estão disponíveis e funcionais.

### 2.3. Melhoria na Lógica de Exclusão de Metas
-   **O que foi feito:** Ao excluir uma meta que já tinha contribuições, o sistema agora também exclui as transações de débito que originaram esses aportes, revertendo completamente a operação.
-   **Por que foi feito:** Garantir a consistência dos dados. Antes, ao deletar a meta, o dinheiro "sumia" do sistema, pois o débito na conta de origem permanecia. Agora, o valor é estornado para a conta de origem, como esperado.
-   **Locais afetados:** `backend/src/controllers/goalController.js`.
-   **Pontos de Atenção para Testes:** Criar uma meta, fazer um aporte de R$ 50 a partir de uma conta. Verificar se o saldo da conta diminuiu. Em seguida, excluir a meta e verificar se o saldo da conta retornou ao valor original.

### 2.4. Resgate de Saldo de Metas
-   **O que foi feito:** Adicionada a funcionalidade de "Resgatar Valor" no menu de opções de uma meta.
-   **Por que foi feito:** Dar ao usuário a flexibilidade de desistir de uma meta e recuperar o dinheiro já poupado, transferindo-o de volta para uma conta corrente sem precisar excluir a meta.
-   **Locais afetados:** `src/components/dashboard/metas/goal-list.tsx`, `src/components/dashboard/metas/rescue-goal-dialog.tsx`, `backend/src/controllers/goalController.js`.
-   **Pontos de Atenção para Testes:** Em uma meta com saldo, usar a opção "Resgatar Valor", selecionar uma conta de destino e confirmar. Verificar se o saldo da meta foi zerado e se o valor foi creditado corretamente na conta escolhida.

---

## Seção 3: Correções de Bugs e Funcionalidades

### 3.1. Correção no Layout do Dashboard
-   **O que foi feito:** Corrigido o bug que impedia o salvamento e carregamento da ordem personalizada dos cards no dashboard.
-   **Por que foi feito:** O sistema não estava salvando ou lendo o formato dos dados corretamente.
-   **Locais afetados:** `src/app/dashboard/customizar/page.tsx`, `src/app/dashboard/page.tsx`, `backend/src/controllers/userController.js`.
-   **Pontos de Atenção para Testes:** Ir para a página de customização, reordenar os cards, voltar para o dashboard e verificar se a nova ordem foi mantida.

### 3.2. Correção na Exclusão de Regras de Categorização
-   **O que foi feito:** Implementada a funcionalidade "Remover Todas as Regras".
-   **Por que foi feito:** Oferecer uma maneira rápida para o usuário resetar suas configurações de regras.
-   **Locais afetados:** `src/app/dashboard/regras/page.tsx`, `backend/src/controllers/categorizationRuleController.js`.
-   **Pontos de Atenção para Testes:** Na página de regras, clicar em "Remover Todas as Regras" e confirmar. Verificar se a lista de regras fica vazia.

### 3.3. Melhoria na Experiência de Upload (Reconciliação)
-   **O que foi feito:** Agora é possível usar templates de mapeamento para arquivos CSV. A interface também foi aprimorada.
-   **Por que foi feito:** Facilitar a importação de extratos CSV, que podem ter formatos diferentes, salvando as configurações de mapeamento do usuário para usos futuros.
-   **Locais afetados:** `src/components/dashboard/reconcile/reconcile-uploader.tsx`, `backend/src/controllers/reconciliationController.js`.
-   **Pontos de Atenção para Testes:** Tentar importar um arquivo CSV, mapear as colunas, salvar como um template e, em uma segunda importação, verificar se é possível selecionar e usar o template salvo para preencher o mapeamento automaticamente.
