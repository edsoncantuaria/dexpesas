# Backend do Dexpesas (Express.js + Prisma)

Este diretório contém a aplicação de backend completa para o projeto Dexpesas. Ele é construído com Express.js e utiliza o Prisma como ORM para se comunicar com um banco de dados MySQL e o MinIO para armazenamento de arquivos.

A arquitetura foi recentemente atualizada para incluir **BullMQ** e **Redis**, permitindo o processamento de tarefas pesadas (como notificações) em background, melhorando a performance e a escalabilidade.

## 1. Pré-requisitos

Antes de começar, garanta que você tenha as seguintes ferramentas instaladas na sua máquina:

*   **Node.js**: `v18.x` ou superior.
*   **npm** ou **yarn**: Gerenciador de pacotes Node.js.
*   **Git**: Para clonar e gerenciar o código-fonte.
*   **Docker** e **Docker Compose**: Essencial para rodar os serviços de banco de dados (MySQL), filas/cache (Redis) e armazenamento (MinIO) de forma isolada e sem a necessidade de instalação manual.

---

## 2. Guia de Instalação e Execução

Siga estes passos para configurar e rodar o servidor de backend localmente.

### Passo 1: Clonar o Repositório

Se ainda não o fez, clone o repositório para sua máquina local e navegue até a pasta do projeto.

```bash
git clone <URL_DO_REPOSITORIO>
cd <NOME_DO_PROJETO>/
```

### Passo 2: Configurar Serviços Externos com Docker

Para simplificar o setup, usamos o Docker para gerenciar nossos serviços.

1.  **Inicie os Contêineres de Serviço**:
    No terminal, a partir da raiz do diretório `/backend`, execute o seguinte comando:

    ```bash
    docker-compose up -d
    ```
    Este comando irá ler o arquivo `docker-compose.yml` e iniciar os contêineres para o **MySQL**, **Redis** e **MinIO** em segundo plano (`-d`).

2.  **Verifique os Contêineres**:
    Você pode verificar se os contêineres estão rodando com `docker ps`.

### Passo 3: Configurar Variáveis de Ambiente

As chaves de acesso e URLs de conexão são gerenciadas através de um arquivo `.env`.

1.  **Crie o arquivo `.env`**:
    Na pasta `/backend`, crie uma cópia do arquivo de exemplo:
    ```bash
    cp .env.example .env
    ```

2.  **Preencha as Variáveis**:
    Abra o arquivo `/backend/.env` e preencha as variáveis. A maioria já estará configurada para funcionar com o Docker Compose.
    *   `DATABASE_URL`: A URL de conexão com o banco MySQL. O valor no `.env.example` já deve funcionar com o Docker.
    *   `JWT_SECRET`: Crie uma chave secreta forte para a autenticação JWT.
    *   `DATA_ENCRYPTION_KEY`: **Obrigatório para produção.** Uma string de no mínimo 32 caracteres usada para criptografar `phoneNumber`, `pushSubscription` e segredos 2FA. Caso não seja definida, o backend emitirá um aviso e armazenará esses campos em texto plano.
    *   `GEMINI_API_KEY`: Sua chave de API para o Google AI Studio.
    *   `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Já configurados para o contêiner Redis.
    *   `MINIO_*`: Já configurados para o contêiner MinIO.
    
3.  **Configurar Chaves VAPID para Notificações Push**:
    Para que o envio de notificações funcione, você precisa gerar e configurar as chaves VAPID (Voluntary Application Server Identification). Elas garantem que apenas o seu servidor possa enviar notificações para os seus usuários.

    *   **Gere as chaves**: No seu terminal, execute o seguinte comando:
        ```bash
        npx web-push generate-vapid-keys
        ```
        *Se você não tiver o `web-push` instalado globalmente, o `npx` o baixará e executará temporariamente.*

    *   **Copie os resultados**: O comando acima irá gerar uma Chave Pública (Public Key) e uma Chave Privada (Private Key).

    *   **Configure no `.env`**: No seu arquivo `/backend/.env`, preencha as seguintes variáveis com os valores gerados:
        *   `VAPID_PUBLIC_KEY`: Cole o valor da "Public Key".
        *   `VAPID_PRIVATE_KEY`: Cole o valor da "Private Key".
        *   `VAPID_SUBJECT`: **Importante!** Este campo deve ser um link `mailto:` com seu e-mail de contato ou a URL `https:` do seu site. Isso é usado pelos serviços de push para identificar quem está enviando a notificação.
            *   **Exemplo:** `mailto:seu-email@exemplo.com`
4.  **Configurar SendGrid para e-mails transacionais**:
    *   `SENDGRID_API_KEY`: API key da sua conta SendGrid.
    *   `SENDGRID_FROM_EMAIL`: Remetente verificado no SendGrid (ex.: `no-reply@seu-dominio.com`).
    *   `SENDGRID_FROM_NAME` (opcional): Nome amigável do remetente (ex.: `Dexpesas`).
    *   `APP_URL`: URL base usada nos links de verificação e reset de senha (ex.: `http://localhost:3000` em desenvolvimento).

### Passo 4: Instalar Dependências do Backend

Navegue até o diretório `backend` no seu terminal e instale todas as dependências.

```bash
cd backend
npm install
```

### Passo 5: Aplicar Migrações do Banco de Dados

Com o contêiner do MySQL rodando, aplique o schema do banco de dados usando o Prisma.

```bash
npx prisma migrate dev --name init
```
Este comando irá:
1.  Ler seu `schema.prisma`.
2.  Criar todas as tabelas e colunas no banco de dados.
3.  Gerar o Prisma Client, que é o conjunto de tipos e funções para interagir com o banco de forma segura.

---

## 3. Executando a Aplicação

### Iniciando o Backend e os Workers

O script de desenvolvimento utiliza o `concurrently` para iniciar o servidor da API e os processos de worker (para filas) simultaneamente.

```bash
# A partir da pasta /backend
npm run dev
```

Seu backend estará rodando na porta especificada no `.env` (ex: `http://localhost:3001`), e os workers estarão processando jobs em background.

### Opcional: Popular com Dados de Exemplo

Para facilitar os testes, você pode popular o banco com dados iniciais (como categorias de transação).

```bash
# A partir da pasta /backend
npx prisma db seed
```

---

## 4. Fluxo de Dados e Arquitetura

### Chat da Guilda

A funcionalidade de bate-papo da guilda foi projetada para ser persistente e segura.

*   **Envio de Mensagem:** Quando um usuário envia uma mensagem no chat do frontend, uma requisição `POST` é enviada para o endpoint `/api/guilds/:guildId/messages`.
*   **Processamento no Backend:** O `guildController` recebe a requisição, valida se o usuário pertence à guilda e, em seguida, usa o Prisma para criar um novo registro na tabela `GuildMessage`.
*   **Armazenamento:** Cada mensagem é armazenada no banco de dados MySQL, vinculada ao `userId` de quem enviou e ao `guildId` da guilda.
*   **Recuperação:** Ao abrir o chat, o frontend faz uma requisição `GET` ao mesmo endpoint para buscar o histórico de mensagens, que são então exibidas na interface.

---

## 5. Aprimorando a Inteligência de Categorização

O sistema possui uma lógica de categorização automática baseada em palavras-chave. As regras padrão para todos os novos usuários estão centralizadas e podem ser facilmente expandidas.

### Como Adicionar Novas Regras de Categorização

1.  **Abra o Arquivo de Dados**:
    Navegue até `backend/src/config/seedData.js`.

2.  **Encontre o Array `defaultRules`**:
    Este array contém a lista de todas as regras padrão do sistema.

3.  **Adicione um Novo Objeto**:
    Para adicionar uma nova regra, insira um novo objeto no array `defaultRules`, seguindo o formato:
    ```javascript
    { termo: "NomeDoServico", categoriaNome: "NomeDaCategoria" },
    ```
    -   `termo`: A palavra-chave que será buscada na descrição da transação (ex: "Netflix", "iFood", "Uber").
    -   `categoriaNome`: O **nome interno (camelCase)** da categoria para a qual a despesa deve ser atribuída (ex: `AssinaturasEServicos`, `BaresERestaurantes`, `Transporte`). Você pode encontrar todos os nomes de categoria no mesmo arquivo, no array `defaultCategories`.

4.  **Exemplo**:
    Para fazer com que todas as transações que contenham "Cobasi" sejam automaticamente categorizadas como "Pets", você adicionaria a seguinte linha ao array:
    ```javascript
    { termo: "Cobasi", categoriaNome: "Pets" },
    ```
Esta alteração será aplicada automaticamente a todos os novos usuários e também será usada como fallback para usuários existentes que não tenham uma regra personalizada para a palavra-chave.

---

Agora, com o backend totalmente funcional, você pode proceder para configurar e iniciar o [frontend do Next.js](../README.md).
