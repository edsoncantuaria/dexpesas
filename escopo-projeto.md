
# Escopo e Análise do Projeto: Jornada Financeira

**Versão:** 1.0
**Data:** 24 de Agosto de 2024

## 1. Visão Geral da Aplicação

A **Jornada Financeira** é uma aplicação web full-stack projetada para ser um assistente financeiro pessoal completo, com um forte apelo à gamificação. O objetivo é transformar a gestão de finanças, muitas vezes vista como uma tarefa tediosa, em uma experiência engajadora e motivadora, onde o usuário evolui e desbloqueia conquistas à medida que melhora sua saúde financeira.

A arquitetura moderna, baseada em um monorepo, separa claramente as responsabilidades:

-   **Frontend:** Construído com **Next.js** e **React**, utiliza a biblioteca de componentes **ShadCN/UI** para uma interface moderna e responsiva, e o **Tailwind CSS** para estilização.
-   **Backend:** Um servidor **Express.js** robusto que centraliza toda a lógica de negócio, servindo uma API RESTful para o frontend.
-   **Banco de Dados:** Utiliza o **Prisma ORM** para interagir com um banco de dados relacional (ex: PostgreSQL/MySQL), garantindo tipagem e segurança nas operações.
-   **Arquitetura Assíncrona:** A integração com **Redis** e **BullMQ** permite o processamento de tarefas em background (notificações, relatórios, etc.), garantindo que a API permaneça ágil e a experiência do usuário, fluida.
-   **Inteligência Artificial:** O **Google AI (via Genkit)** é o cérebro por trás das funcionalidades inteligentes, como categorização automática, análise de hábitos e OCR de recibos.
-   **Armazenamento de Arquivos:** O **MinIO** (compatível com S3) é utilizado para o armazenamento seguro de anexos, como comprovantes e imagens.

## 2. Funcionalidades Implementadas

A aplicação já possui um conjunto robusto e funcional de funcionalidades que cobrem o ciclo completo da gestão financeira pessoal:

-   **Autenticação e Segurança:** Sistema de registro e login com JWT. A integração com o Firebase para notificações push também adiciona uma camada de serviço robusta.
-   **Onboarding de Usuário:** Um fluxo inicial guia o usuário na configuração de suas primeiras contas, cartões e perfil, melhorando a adesão inicial.
-   **Dashboard Principal:** Oferece uma visão consolidada e imediata da saúde financeira, incluindo saldo total, resumo de receitas e despesas, e o perfil gamificado.
-   **Gestão de Contas e Cartões:** CRUD completo para contas bancárias e cartões de crédito, incluindo a funcionalidade de transferência entre contas e pagamento de faturas.
-   **Módulo de Transações Avançado:**
    -   Suporte a transações simples (débito, crédito, pix).
    -   Criação de transações **parceladas**, com ou sem juros.
    -   Criação de transações **recorrentes** com frequência flexível (semanal, quinzenal, mensal, etc.), com projeção futura configurável pelo usuário.
-   **Módulo de Orçamentos:** Permite ao usuário definir limites de gastos mensais por categoria, com tracking de progresso em tempo real e a opção de **rollover** (acumular saldo para o mês seguinte).
-   **Módulo de Metas Financeiras:** Criação de metas de economia (ex: viagem, compra de um bem) com registro de contribuições, cálculo de progresso e projeção de conclusão.
-   **Sistema de Notificações Proativo:** Alertas para contas a vencer, pagamentos vencidos, conquistas desbloqueadas e orçamentos excedidos, entregues via Push (Firebase Cloud Messaging) e no painel da aplicação.
-   **Inteligência Artificial (Genkit):**
    -   **Sugestão de Categoria:** Análise da descrição de transações para sugerir a categoria mais apropriada.
    -   **Análise de Hábitos:** Geração de insights sobre padrões de consumo.
    -   **OCR de Recibos:** Extração de dados (valor, data, estabelecimento) de imagens de notas fiscais.
    -   **Busca Inteligente:** Tradução de linguagem natural em filtros de busca estruturados.
    -   **Sugestão de Orçamento:** Análise do histórico de gastos para propor valores de orçamento realistas.
-   **Reconciliação Bancária:**
    -   Importação de extratos bancários nos formatos **OFX** e **CSV**.
    -   Processamento assíncrono dos arquivos para não bloquear a UI.
    -   Interface de comparação lado a lado com sugestão automática de pares de transações.
-   **Automações:**
    -   **Cofrinho Digital (Round-up):** Arredonda o valor de transações e guarda a diferença.
    -   **Pagamento Automático de Contas:** Permite configurar o pagamento de despesas recorrentes.
-   **Regras de Categorização:** Permite que o usuário crie regras baseadas em palavras-chave para automatizar a categorização de despesas.
-   **Trilha de Auditoria:** Registro detalhado de todas as ações sensíveis realizadas pelo usuário, garantindo segurança e rastreabilidade.

## 3. Análise Técnica

-   **Pontos Fortes:**
    -   **Arquitetura Sólida:** A separação frontend/backend é excelente para escalabilidade, manutenção e desenvolvimento paralelo. O uso de uma arquitetura de serviços (filas, cache, storage) é um grande diferencial.
    -   **Base de Dados Bem Modelada:** O schema do Prisma está bem estruturado e normalizado. A decisão de usar um arquivo `models.json` como "fonte da verdade" e um script para gerar o `schema.prisma` é uma estratégia inteligente para evitar conflitos e manter a consistência.
    -   **Tecnologias Modernas:** A escolha de Next.js, Express, Prisma, BullMQ e Genkit posiciona a aplicação na vanguarda do desenvolvimento web, garantindo performance e uma boa experiência de desenvolvimento.
    -   **Segurança da API:** O uso de `authMiddleware` em todas as rotas sensíveis é a prática correta. O tratamento de erros centralizado no `errorHandler` também é um ponto positivo.
-   **Pontos de Melhoria:**
    -   **Testes:** Não há uma estrutura visível de testes automatizados (unitários, integração, E2E). A ausência de testes representa o maior risco técnico, podendo levar a regressões e bugs em produção.
    -   **Validação de Entrada (Backend):** Embora o frontend tenha validação (Zod), é crucial que o backend também valide 100% dos dados recebidos na API. Nunca se deve confiar na validação do cliente. O Zod pode ser facilmente integrado ao Express para validar o `req.body` em cada rota.
    -   **Observabilidade:** Faltam ferramentas de logging estruturado (ex: Winston, Pino) e monitoramento de performance (APM - ex: New Relic, Datadog). Em produção, é vital saber o que está acontecendo no servidor e nos workers.
    -   **Gestão de Migrations:** O fluxo atual com `prisma migrate dev` é perfeito para desenvolvimento, mas para produção, o ideal é usar `prisma migrate deploy` em um pipeline de CI/CD para evitar prompts interativos e garantir a aplicação segura das migrações.

## 4. Análise Funcional (Experiência do Usuário e Financeira)

-   **Pontos Fortes:**
    -   **Fluxo Completo:** A aplicação cobre desde o registro básico de uma despesa até funcionalidades avançadas como reconciliação e automação. O usuário tem um ecossistema completo à disposição.
    -   **Gamificação e IA:** A integração desses elementos é o grande diferencial. Eles transformam a gestão financeira em algo menos intimidante e mais proativo, oferecendo insights que o usuário não teria facilmente.
    -   **Flexibilidade:** A recorrência customizável e o parcelamento com juros são funcionalidades de alto valor que muitos aplicativos concorrentes não oferecem com a mesma flexibilidade.
    -   **Controle do Usuário:** A capacidade de configurar preferências de notificação, projeções e funcionalidades de IA dá ao usuário um sentimento de controle sobre sua experiência.
-   **Pontos de Melhoria:**
    -   **Visão de Futuro (Projeções):** Atualmente, as projeções são reativas (baseadas em recorrências já criadas). Falta uma área dedicada a "Simulações", onde o usuário pudesse perguntar: "Se eu cortar R$200 de lazer por mês, quando atinjo minha meta de R$10.000?".
    -   **Relatórios:** Os relatórios atuais são bons, mas focados no passado ("o que aconteceu"). Poderiam ser enriquecidos com visões futuras, como um **fluxo de caixa projetado** para os próximos 30/60/90 dias, considerando receitas e despesas recorrentes.
    -   **Complexidade da Fatura:** A fatura do cartão de crédito é uma das maiores dores do usuário final. A visualização poderia ser mais detalhada, mostrando claramente o valor total, pagamento mínimo, juros de rotativo projetados, etc.

## 5. Inconsistências e Pontos de Atenção

-   **Risco Técnico - Performance em Larga Escala:** Algumas consultas no Prisma, especialmente em relatórios e dashboards, podem se tornar lentas com um grande volume de transações (ex: vários anos de dados). A criação de **índices** explícitos no `schema.prisma` em campos frequentemente usados em `WHERE` clauses (como `userId`, `data`, `categoryId`) é essencial.
-   **Inconsistência Funcional - Saldo de Contas:** O saldo da conta (`Account.saldo`) é atualizado em tempo real. Isso é bom para simplicidade, mas pode levar a inconsistências se uma transação antiga for editada. O modelo ideal é ter um **saldo inicial** e calcular o saldo atual dinamicamente (`saldoInicial + somatório de transações`), utilizando cache (Redis) para garantir a performance. A abordagem atual é um débito técnico aceitável para o estágio do projeto, mas precisa ser revisitada.
-   **Segurança - Variáveis de Ambiente:** É crucial garantir que o arquivo `.env` do backend, que contém segredos, **NUNCA** seja versionado no Git. O `.gitignore` deve conter a entrada `/backend/.env`.

## 6. Sugestões de Melhorias Técnicas

1.  **Implementar Testes com Vitest/Jest:**
    -   **Testes Unitários:** Para serviços críticos (`automationService`, `gamificationService`).
    -   **Testes de Integração:** Para os endpoints da API, simulando requisições e verificando as respostas e o estado do banco de dados.
2.  **Adicionar Validação de API com Zod:** Em cada rota do Express, usar um middleware para validar o `req.body` contra um schema Zod, retornando um erro 400 claro em caso de falha.
3.  **Refatorar o Saldo da Conta:** Mudar o campo `saldo` no modelo `Account` para `saldoInicial`. O saldo atual deve ser calculado sob demanda e cacheado. Isso torna o sistema mais resiliente a edições e exclusões de transações passadas.
4.  **Adicionar Índices no Prisma Schema:** Adicionar `@@index([userId, data])` no modelo `Transaction` e índices similares em outros modelos para otimizar as consultas mais comuns.
5.  **Logging Estruturado:** Integrar `Winston` ou `Pino` para logs em formato JSON, facilitando a busca e análise em uma plataforma de observabilidade.

## 7. Sugestões de Novas Funcionalidades

1.  **Módulo de Investimentos:** Uma área para o usuário registrar ativos (Ações, Fundos, Cripto) e acompanhar a rentabilidade, com integração a APIs de mercado para atualização de cotações.
2.  **Planejamento Tributário:** Uma ferramenta para ajudar o usuário a estimar o Imposto de Renda devido com base em suas receitas e despesas dedutíveis.
3.  **Compartilhamento de Contas:** Funcionalidade para contas conjuntas (casais, famílias), onde duas ou mais pessoas podem gerenciar as mesmas contas e orçamentos.
4.  **Relatório de Fluxo de Caixa Projetado:** Um gráfico que mostra a projeção do saldo do usuário para os próximos meses, com base em suas transações recorrentes. Isso é extremamente valioso para evitar surpresas com a conta no vermelho.
5.  **Scanner de Boleto:** Utilizar a câmera do celular para ler o código de barras de um boleto e pré-preencher uma transação de despesa com o valor e a data de vencimento.

## 8. Escopo Futuro do Projeto

A "Jornada Financeira" tem uma base sólida para se tornar uma referência no mercado de fintechs pessoais. O foco futuro deve ser em:

-   **Curto Prazo (Próximos 3 meses):**
    -   Implementar a suíte de testes e a validação de API com Zod para solidificar a base técnica.
    -   Refatorar o cálculo de saldo de contas para maior resiliência.
    -   Lançar o relatório de **Fluxo de Caixa Projetado**.
-   **Médio Prazo (3-6 meses):**
    -   Desenvolver o **Módulo de Investimentos (Fase 1)**, com registro manual de ativos.
    -   Implementar o **Compartilhamento de Contas**, um grande diferencial competitivo.
    -   Aprimorar a IA com análises de fatura de cartão de crédito, identificando taxas e juros abusivos.
-   **Longo Prazo (6+ meses):**
    -   Desenvolver um aplicativo móvel nativo (React Native/Flutter) para uma experiência mobile superior.
    -   Explorar integrações com **Open Banking/Finance** para importação automática de transações, eliminando a necessidade de extratos manuais.
    -   Expandir a IA para atuar como um "conselheiro financeiro", oferecendo recomendações personalizadas de investimentos e otimização de gastos.
