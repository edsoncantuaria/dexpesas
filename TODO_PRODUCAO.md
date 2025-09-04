# Checklist para Produção

Este arquivo documenta as alterações que foram feitas para facilitar a depuração e que **DEVEM SER REVERTIDAS** antes de enviar a aplicação para um ambiente de produção.

## 1. Ativar a Validação de Token JWT no Backend

A validação de token foi desativada para permitir o acesso às rotas protegidas da API sem um token válido.

-   **Arquivo**: `/backend/src/middlewares/authMiddleware.js`
-   **Ação**:
    1.  Comente ou remova a lógica de depuração que define um usuário fixo (ex: `req.user = { ... }`).
    2.  Descomente o bloco de código principal que começa com `const authHeader = req.headers.authorization;` para reativar a validação do token JWT.

## 2. Ativar a Proteção de Rotas no Frontend

A lógica que protege as rotas do frontend (ex: `/dashboard`) e redireciona usuários não autenticados foi desativada.

-   **Arquivo**: `/src/middleware.ts`
-   **Ação**:
    1.  Remova a linha `return NextResponse.next();` que está no topo da função.
    2.  Descomente o bloco de código principal que começa com `const token = request.cookies.get('auth_token')?.value;`.

## 3. Criptografar Dados Sensíveis em Repouso

-   **Arquivo**: `/backend/src/controllers/notificationController.js` (e onde mais for manipulado)
-   **Risco:** O objeto `pushSubscription` contém chaves que permitem o envio de notificações a um usuário. Se o banco de dados for comprometido, esses dados podem ser usados para enviar spam ou notificações maliciosas.
-   **Ação**:
    1.  Implementar funções de criptografia e descriptografia usando o módulo `crypto` nativo do Node.js.
    2.  A chave de criptografia (`ENCRYPTION_KEY`) DEVE ser armazenada de forma segura como uma variável de ambiente no arquivo `/backend/.env`.
    3.  Antes de salvar o `pushSubscription` no banco de dados na rota `/api/notifications/subscribe`, o objeto deve ser **criptografado**.
    4.  Antes de usar o `pushSubscription` para enviar uma notificação no `notificationWorker.js`, ele deve ser **descriptografado**.

Completar estes passos garantirá que sua aplicação esteja segura e funcionando com o fluxo de autenticação e proteção de dados correto em produção.
