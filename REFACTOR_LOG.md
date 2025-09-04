# Log de Refatoração: Separação do Backend

Este documento resume a reestruturação dos arquivos para separar completamente o backend (Express.js + Prisma) do frontend (Next.js).

O objetivo foi mover toda a lógica do servidor para uma pasta dedicada `backend/`, tornando o projeto um monorepo com duas aplicações distintas e independentes.

## Mapeamento de Arquivos: De Onde Veio e Para Onde Foi

A tabela abaixo mostra o mapeamento dos arquivos que foram movidos ou criados para formar a nova estrutura do backend.

| Arquivo/Pasta Original (Localização Anterior) | Nova Localização (Após a Refatoração)    | Descrição da Mudança                                                                                              |
| --------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `N/A (criado agora)`                          | `/backend/package.json`                    | Um novo `package.json` exclusivo para o backend, contendo dependências como `express`, `prisma`, `cors`, etc. |
| `N/A (criado agora)`                          | `/backend/server.js`                       | Ponto de entrada principal do servidor Express, responsável por iniciar o servidor e conectar ao banco de dados.  |
| `N/A (criado agora)`                          | `/backend/.env`                            | Arquivo de variáveis de ambiente para o backend, contendo a `DATABASE_URL` e `JWT_SECRET`.                      |
| `N/A (criado agora)`                          | `/backend/src/app.js`                      | Arquivo central de configuração do Express (middlewares, rotas).                                                  |
| `N/A (criado agora)`                          | `/backend/src/config/config.js`            | Lógica para carregar as variáveis de ambiente do `.env`.                                                          |
| `N/A (criado agora)`                          | `/backend/src/controllers/*`               | Contém toda a lógica de negócio para cada rota da API (ex: `userController.js`, `transactionController.js`).     |
| `N/A (criado agora)`                          | `/backend/src/middlewares/*`               | Contém middlewares, como o `authMiddleware.js` para proteger rotas.                                               |
| `N/A (criado agora)`                          | `/backend/src/routes/*`                    | Define os endpoints da API (ex: `/api/auth`, `/api/accounts`) e os associa aos seus respectivos controllers.    |
| `/prisma/schema.prisma`                       | `/backend/prisma/schema.prisma`            | O schema do Prisma foi movido para dentro da pasta do backend, pois pertence à camada de dados.                   |
| `N/A (criado agora)`                          | `/backend/README.md`                       | Um guia completo com instruções para instalar, configurar e rodar o servidor backend.                             |

### Arquivos do Frontend que foram **Removidos**

Os seguintes arquivos, que antes continham lógica de backend simulada no Next.js, foram **removidos** do frontend, pois sua funcionalidade foi transferida para o servidor Express:

-   `src/backend/controllers/actions.ts`
-   `src/backend/models/definitions.ts`
-   `src/backend/services/` (toda a pasta e seu conteúdo)

Essa reestruturação garante uma separação clara de responsabilidades, onde o Next.js cuida exclusivamente da interface do usuário (frontend) e o Express.js cuida de toda a lógica de servidor, banco de dados e API (backend).
