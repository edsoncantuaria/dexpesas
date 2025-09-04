# Histórico de Alterações - A Evolução da Jornada Financeira

Este documento detalha as principais mudanças, melhorias e novas funcionalidades implementadas no aplicativo, transformando-o de um protótipo inicial em uma ferramenta financeira completa e robusta.

## Fase 9: Reconciliação Bancária com Importação de Extratos

[Added] **Módulo de Reconciliação Bancária:**
-   Implementada a funcionalidade de importação de extratos bancários no formato **OFX**.
-   O processamento do arquivo OFX é feito de forma assíncrona usando a fila **BullMQ** e um novo **reconciliationWorker**, garantindo que a interface do usuário não seja bloqueada durante a análise.
-   Criada uma nova página (`/dashboard/reconcile`) onde o usuário pode fazer o upload do extrato, definir o período e os saldos.

[Added] **Interface de Conciliação:**
-   Desenvolvida uma nova interface que exibe, lado a lado, as transações importadas do extrato e os lançamentos manuais do usuário.
-   O sistema agora **sugere automaticamente os pares** de transações com base na proximidade de data e valor, facilitando o processo de conciliação.
-   O usuário pode **confirmar o par** sugerido ou **descartar** uma transação importada que não seja relevante.

[Added] **Estrutura de Banco de Dados:**
-   Adicionados os modelos `Reconciliation` e `ImportedTransaction` ao schema do Prisma para armazenar os dados dos extratos e o histórico de conciliação.
-   O modelo `Transaction` foi atualizado com um campo `isReconciled` para rastrear o status da conciliação de cada lançamento manual.

[Changed] **Navegação e Usabilidade:**
-   Adicionado um novo item "Reconciliação Bancária" na página de "Serviços" para fácil acesso à nova funcionalidade.
-   O backend agora possui endpoints dedicados (`/api/reconcile/*`) para gerenciar o upload, o status e as ações de conciliação.

---

## Fase 8: Arquitetura Assíncrona com Filas e Cache

[Added] **Filas de Processamento em Background com BullMQ:**
-   Integrado o **BullMQ** e **Redis** para criar um sistema de processamento de tarefas assíncrono.
-   Criado um processo de **worker** dedicado (`worker.js`) que roda em paralelo com a API, responsável por executar tarefas pesadas sem bloquear a interface do usuário.
-   Refatorado o sistema de notificações: agora, a verificação de contas a vencer/vencidas e o envio de notificações push são adicionados como jobs a uma fila (`notificationQueue`), processados em background pelo `notificationWorker`.

[Added] **Cache Inteligente com Redis:**
-   Implementado um serviço de cache (`cacheService.js`) utilizando **Redis** para armazenar dados de leitura frequente.
-   Adicionado cache à rota que busca as categorias de transações (`/api/categories`). Isso reduz significativamente a carga no banco de dados para dados que raramente mudam. O cache tem um TTL (Time To Live) de 1 hora.

[Changed] **Melhoria de Performance e Responsividade:**
-   A experiência do usuário foi aprimorada, pois a API agora responde instantaneamente, enquanto as tarefas demoradas são executadas em segundo plano.
-   A arquitetura agora é mais resiliente e escalável, preparada para futuras funcionalidades complexas como OCR e geração de relatórios.

[Changed] **Ambiente de Desenvolvimento:**
-   Adicionado o pacote `concurrently` para permitir que o servidor da API e os workers de background sejam iniciados com um único comando (`npm run dev`), simplificando o fluxo de trabalho de desenvolvimento.

---

## Fase 7: OCR de Recibos com IA

[Added] **Leitura Inteligente de Recibos com Gemini:**
-   Implementada a funcionalidade de OCR (Reconhecimento Óptico de Caracteres) para extrair dados de notas fiscais e recibos.
-   Utiliza o modelo multimodal **Google Gemini 1.5 Flash** através de um novo fluxo Genkit no backend (`receipt-ocr-flow.js`) para analisar a imagem e extrair o nome do estabelecimento, a data da transação e o valor total.
-   Adicionado um novo endpoint na API (`/api/ai/scan-receipt`) para processar as imagens enviadas pelo frontend.

[Added] **Interface de Upload e Pré-preenchimento:**
-   No formulário de "Nova Transação", um novo ícone de câmera permite ao usuário iniciar o processo de digitalização.
-   Um modal de upload (`ocr-upload-dialog.tsx`) foi criado, usando `react-dropzone` para o envio de imagens.
-   Após a análise da IA, os campos de "Descrição", "Valor" e "Data" no formulário de transação são preenchidos automaticamente.

[Added] **Configuração de Usuário:**
-   Adicionada a opção "Ativar Leitura de Recibos com IA" na página de "Configurações" (`Preferências`).
-   A funcionalidade só é visível e utilizável para os usuários que a ativarem, garantindo controle e consentimento.
-   Incluído um novo campo `enableOcr` no modelo `User` do Prisma para persistir essa preferência.

---

## Fase 6: Automação Avançada de Categorias

[Added] **Regras de Categorização Automática:**
-   Criada a página "Regras de Categorização" no menu de Serviços.
-   Usuários agora podem criar regras simples baseadas em palavras-chave. Por exemplo: se a descrição de uma transação contiver "Uber", ela será automaticamente categorizada como "Transporte".
-   Implementado o backend completo com um novo modelo `CategorizationRule` no Prisma para armazenar as regras.
-   Criado um `categorizationRuleController` para gerenciar o CRUD das regras via API.
-   Adicionado um `categorizationService` no backend que é invocado durante a criação de uma nova transação. Se a transação não tiver uma categoria definida, o serviço busca e aplica a primeira regra correspondente.
-   O formulário de criação de transação foi ajustado para permitir o envio sem uma categoria, delegando a responsabilidade para as automações.

---

## Fase 5: Automação Inteligente

[Added] **Rollover de Orçamentos (Budget Rollover):**
-   Implementada a opção de "rollover" (acumulação) para os orçamentos mensais.
-   O usuário agora pode configurar, por categoria, se o saldo não utilizado (ou o déficit) de um orçamento deve ser transportado para o limite do mês seguinte.
-   A lógica da API no backend (`budgetController.js`) foi atualizada para calcular dinamicamente o limite ajustado com base nos dados do mês anterior.
-   O formulário de criação/edição de orçamentos no frontend foi atualizado com um `Switch` para habilitar a funcionalidade.

[Added] **Guardar o Troco (Cofrinho Digital - Round-up Savings):**
-   Criada uma nova página de "Automações" no frontend.
-   Implementada a lógica de backend para arredondar cada despesa elegível (débito/pix) para o próximo real.
-   Os valores de "troco" são armazenados em um novo modelo `RoundUpEntry` até serem processados.
-   O usuário pode ativar/desativar a automação, escolher uma conta de poupança/investimento como "Cofrinho" de destino e executar a transferência dos trocos acumulados manualmente.
-   O `automationService.js` no backend lida com a criação das transações de débito e crédito para efetivar a poupança.
-   Adicionados novos modelos `Automation` e `RoundUpEntry` ao schema do Prisma.

---

## Fase 4: Inteligência, Automação e Notificações Push

[Added] **Notificações Push com Firebase Cloud Messaging:**
-   Integração com a SDK do Firebase Admin no backend e SDK do cliente no frontend.
-   O usuário agora recebe notificações push nativas em seu dispositivo para alertas de pagamento, conquistas e outras informações importantes, mesmo com o aplicativo fechado.
-   Criado um service worker (`firebase-messaging-sw.js`) para gerenciar a exibição de notificações em background.

[Added] **Upload de Comprovantes:**
-   Agora é possível anexar arquivos (PDF, JPG, PNG) a cada transação.
-   Implementado um backend de storage usando **MinIO** (S3-compatível).
-   A API agora possui um endpoint `/api/storage/upload` para lidar com o upload de arquivos de forma segura.
-   O formulário de transação no frontend foi atualizado com um componente de upload drag-and-drop.

[Changed] **Estrutura de Notificações:**
-   O `NotificationService` foi aprimorado para disparar não apenas uma notificação no banco de dados, mas também um evento push via FCM.
-   O frontend agora possui um `NotificationProvider` para gerenciar as permissões e o token de registro do dispositivo.

---

## Fase 3: Refinamento de Fluxos e Experiência do Usuário

[Changed] **Edição de Transações Aprimorada:**
-   A lógica de edição no backend foi refatorada. Ao editar uma transação parcelada ou recorrente, o sistema agora oferece opções para atualizar apenas a ocorrência atual ou toda a série futura, garantindo maior flexibilidade e consistência.

[Added] **Navegação Acessível para Novos Módulos:**
-   Adicionados cards na página de "Serviços" para "Orçamentos" e "Metas", garantindo que todas as funcionalidades sejam facilmente acessíveis a partir de um hub central.
-   Incluído um link direto para "Orçamentos" na barra de navegação principal (lateral/inferior) para acesso rápido.

---

## Fase 2: Orçamentos Inteligentes e Notificações Proativas

[Added] **Budget Rollover:**
-   A funcionalidade de orçamento foi aprimorada com a opção de "rollover".
-   O usuário pode configurar se o saldo não utilizado (ou o déficit) de um orçamento de categoria deve ser transportado para o limite do mês seguinte.
-   A lógica da API no backend (`budgetController.js`) foi atualizada para calcular dinamicamente o limite ajustado.

[Added] **Sistema de Notificação Acionável:**
-   As notificações de pagamento vencido agora vêm com ações: "Marcar como Paga" e "Manter Pendente".
-   A ação "Manter Pendente" cancela a recorrência futura daquela conta específica para evitar alertas repetitivos indesejados.
-   O painel de notificações no frontend foi atualizado para exibir e processar essas ações.

[Added] **Gamificação na Criação de Orçamento:**
-   Criar o primeiro orçamento agora desbloqueia uma conquista, incentivando o planejamento financeiro.

---

## Fase 1: A Grande Separação (Reestruturação da Arquitetura)

A mudança mais fundamental foi a separação completa entre o frontend e o backend.

-   **Backend Dedicado:** Foi criada a pasta `/backend` para abrigar um servidor **Express.js** independente, responsável por toda a lógica de negócio, interações com o banco de dados (Prisma) e a API.
-   **Frontend Focado:** O diretório `/src` (Next.js) foi purificado, removendo todo o acesso direto ao banco de dados e lógica de servidor. Agora, ele consome dados exclusivamente através da API do backend.
-   **Cliente de API:** Foi implementado um cliente `axios` centralizado (`/src/lib/api.ts`) para gerenciar as requisições HTTP e a injeção de tokens de autenticação.

**Impacto:** Maior escalabilidade, segurança e uma clara separação de responsabilidades, facilitando o desenvolvimento futuro.

---

Esta série de atualizações transformou a "Jornada Financeira" em uma plataforma coesa, precisa e rica em funcionalidades, pronta para guiar o usuário em suas aventuras financeiras.
```