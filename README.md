# Jornada Financeira - Documentação Completa do Projeto

**Versão:** 2.0
**Data:** 28 de Agosto de 2024

Bem-vindo à documentação completa da **Jornada Financeira**, uma aplicação full-stack projetada para ser um assistente financeiro pessoal completo, com um forte apelo à gamificação.

---

## 1. Visão Geral e Filosofia

O objetivo é transformar a gestão de finanças, muitas vezes vista como uma tarefa tediosa, em uma experiência engajadora e motivadora, onde o usuário evolui como um herói em uma jornada de RPG, desbloqueando conquistas e subindo de nível à medida que melhora sua saúde financeira.

A aplicação é dividida em dois pilares principais: um **Módulo Financeiro** robusto e preciso, e um **Módulo de Gamificação** rico e reativo que se alimenta das ações do primeiro.

---

## 2. Arquitetura e Tecnologias

O projeto é um monorepo com uma separação clara de responsabilidades, utilizando tecnologias modernas para garantir performance, escalabilidade e uma ótima experiência de desenvolvimento.

-   **Frontend:** Construído com **Next.js** e **React**, utiliza **ShadCN/UI** para componentes e **Tailwind CSS** para estilização.
-   **Backend:** Um servidor **Express.js** que serve uma API RESTful e centraliza toda a lógica de negócio.
-   **Banco de Dados:** **MySQL** gerenciado pelo **Prisma ORM**.
-   **Arquitetura Assíncrona:** **Redis** e **BullMQ** para processar tarefas pesadas em background (notificações, reconciliação bancária, etc.), garantindo que a API permaneça ágil.
-   **Inteligência Artificial:** **Google AI (via Genkit)** para funcionalidades como categorização, análise de hábitos e OCR.
-   **Armazenamento de Arquivos:** **MinIO** (compatível com S3) para armazenamento de anexos.

---

## 3. O Vínculo: Financeiro <> Gamificação (A Lógica Central)

A genialidade da aplicação reside na sua **arquitetura orientada a eventos**, que conecta o mundo financeiro ao universo do RPG de forma desacoplada e eficiente.

**Como funciona?**

1.  **Ação Financeira (O Gatilho):** O usuário realiza uma ação no módulo financeiro. Por exemplo:
    *   Cria uma nova transação.
    *   Paga uma fatura de cartão de crédito.
    *   Completa uma meta de economia.
    *   Cria um orçamento para o mês.

2.  **Publicação do Evento:** A lógica de negócio no backend, após processar a ação financeira com sucesso, **publica um evento** em uma fila de mensagens (BullMQ). Este evento é um pacote de dados simples, como `TRANSACTION_CREATED` ou `BILL_PAID`.

3.  **Consumo pelo Gamification Service (A Reação):** O `gamificationService.js`, que opera em um processo worker separado, está constantemente "ouvindo" esses eventos. Ao receber um evento, ele age como o "Mestre do Jogo":
    *   **Concede XP:** Um evento `TRANSACTION_CREATED` pode conceder +5 XP.
    *   **Aplica Penalidades:** Um evento `PAYMENT_DUE` (conta vencida) pode aplicar -50 XP.
    *   **Atualiza Missões:** Verifica se a ação (ex: criar 5 transações) completa alguma missão ativa do jogador.
    *   **Causa Dano ao Chefe:** Se uma batalha de chefe estiver ativa, uma ação positiva (como pagar uma dívida) se transforma em dano contra o chefe.

Essa arquitetura garante que a lógica de jogo **não interfira na performance** das operações financeiras críticas, ao mesmo tempo que cria um feedback imediato e engajador para o usuário.

---

## 4. Módulo Financeiro: Precisão e Resiliência

A base de toda a jornada é um sistema financeiro construído com princípios de precisão e resiliência.

-   **Cálculo de Saldo de Contas:** O saldo nunca é um valor fixo. Ele é **sempre calculado dinamicamente** (`Saldo Atual = saldoInicial + Σ(Receitas) - Σ(Despesas)`). Isso garante 100% de precisão, mesmo que transações antigas sejam editadas ou excluídas, e torna o sistema imune a *race conditions*.
-   **Lógica de Fatura de Cartão:** O sistema simula com precisão o comportamento dos bancos. A função `getInvoicePeriod()` calcula as datas de início e fim da fatura com base no `diaFechamento` do cartão, não no mês calendário, garantindo que os valores batam com a fatura real.
-   **Cálculo de Juros:** Para compras parceladas, é utilizada a **Tabela Price**, o padrão de mercado para amortização, garantindo que o valor da parcela calculado seja idêntico ao que o usuário verá na sua fatura.
-   **Segurança e Atomicidade:** Operações complexas, como transferências, são envoltas em `prisma.$transaction()`, garantindo que a operação só seja concluída se todas as suas etapas (débito e crédito) forem bem-sucedidas.

---

## 5. Módulo de Gamificação: A Aventura

Esta é a camada que transforma a gestão financeira em uma experiência de RPG.

-   **O Herói Financeiro:** Cada usuário é um herói com atributos dinâmicos:
    *   **Força:** Poder de renda.
    *   **Resistência:** Capacidade de poupança.
    *   **Sabedoria:** Disciplina com orçamentos.
    *   **Sorte:** Habilidade de quitar dívidas.
-   **XP e Níveis:** Ações financeiras concedem ou removem XP. Acumular XP suficiente aumenta o nível do herói.
-   **Árvore de Classes:** A cada 6 níveis, o sistema reavalia os atributos do jogador e o promove para uma nova classe mais especializada (ex: de "Aventureiro Novato" para "Barão da Renda"), refletindo seu estilo de jogo.
-   **Painel do Game Master (Admin):** Usuários com a flag `isAdmin` têm acesso a um painel para gerenciar o jogo:
    *   **Conquistas:** Definir as recompensas para marcos fixos (ex: criar o primeiro orçamento).
    *   **Missões:** Criar desafios dinâmicos com gatilhos em JSON (ex: `{"type": "TRANSACTION_CREATED", "count": 5}`).
    *   **Itens:** Criar itens colecionáveis ou com bônus (`bonusJson`) que podem ser dados como recompensa.
    *   **Chefes:** Criar e ativar batalhas de chefe, que são eventos coletivos onde os jogadores se unem para derrotar um desafio financeiro.

---

## 6. Design System e Filosofia de UI/UX

A interface é guiada por três pilares: **Fluidez Absoluta**, **Consistência Intuitiva** e **Feedback Sensorial Agradável**.

-   **Mobile-First:** Todo componente é construído para funcionar perfeitamente em telas pequenas e depois adaptado para telas maiores.
-   **Componentes:** **ShadCN/UI** oferece a base de componentes acessíveis e customizáveis.
-   **Estilização:** **Tailwind CSS** é a única fonte para estilização, garantindo consistência.
-   **Identidade Visual:**
    *   **Cor Primária (Verde):** `hsl(var(--primary))` - Crescimento, prosperidade.
    *   **Cor de Destaque (Azul):** `hsl(var(--accent))` - Confiança, inteligência.
    *   **Tipografia:** **Inter**, por sua excelente legibilidade.
    *   **Iconografia:** **Lucide React**, por seu estilo minimalista e consistente.

---

## 7. Status e Próximos Passos (Auditoria)

-   **Status de Prontidão:** **Necessita de Ajustes Críticos**.
-   **Principal Risco:** A autenticação de usuário (`authMiddleware`) está desativada para fins de depuração. **Isso DEVE ser reativado antes da produção.**
-   **Recomendações Chave:**
    1.  **Reativar Autenticação:** A prioridade máxima é reativar a validação de token JWT no backend e a proteção de rotas no frontend.
    2.  **Implementar Testes:** A falta de testes automatizados é o maior risco técnico do projeto. Iniciar com testes de integração para os fluxos da API é crucial.
    3.  **Criptografar Dados Sensíveis:** O campo `pushSubscription` no banco de dados deve ser criptografado.

---

## 8. Como Rodar o Projeto

Este projeto requer a execução simultânea do backend e do frontend.

### 8.1. Rodando o Backend (Express.js)

O backend é responsável pela API, lógica de negócio e comunicação com os serviços (Banco de Dados, Filas, etc.).

**Para instruções detalhadas, veja o README específico do backend:**
➡️ **[backend/README.md](./backend/README.md)**

### 8.2. Rodando o Frontend (Next.js)

O frontend é a interface com a qual o usuário interage.

```bash
# 1. (Na raiz do projeto) Instale as dependências do Next.js
npm install

# 2. Configure seu arquivo .env.local com as chaves do Firebase e a URL da API

# 3. Inicie o servidor de desenvolvimento do Next.js
npm run dev
```
Por padrão, o servidor do frontend rodará em `http://localhost:9002`.
