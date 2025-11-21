# Dexpesas - Sistema Completo de Gestão Financeira Gamificada

**Versão:** 3.0  
**Última Atualização:** Novembro de 2024

Bem-vindo ao **Dexpesas**, uma plataforma full-stack de gestão financeira pessoal e familiar com gamificação, projetada para transformar o controle financeiro em uma experiência engajadora e intuitiva.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Arquitetura e Tecnologias](#-arquitetura-e-tecnologias)
- [Módulos do Sistema](#-módulos-do-sistema)
- [Gamificação](#-gamificação)
- [Modo Família](#-modo-família)
- [Privacidade e Segurança](#-privacidade-e-segurança)
- [Como Rodar o Projeto](#-como-rodar-o-projeto)
- [Estrutura do Projeto](#-estrutura-do-projeto)

---

## 🎯 Visão Geral

O Dexpesas transforma a gestão financeira em uma jornada de RPG, onde suas conquistas financeiras se traduzem em evolução de personagem, desbloqueio de conquistas e progressão em missões. Com foco em **precisão**, **usabilidade** e **engajamento**, o sistema oferece controle completo sobre finanças pessoais e familiares.

### Diferenciais

✨ **Gamificação Completa** - Sistema de XP, níveis, classes de herói e missões  
👨‍👩‍👧‍👦 **Modo Família** - Orçamentos compartilhados, caixinhas coletivas e divisão de despesas  
🏦 **Reconciliação Bancária** - Importação e conciliação de extratos OFX  
📊 **Relatórios Avançados** - Análises detalhadas de gastos, fluxo de caixa e patrimônio  
🔒 **Privacidade Total** - Oculte valores financeiros com um clique  
🎨 **Interface Premium** - Design moderno com animações fluidas e UX excepcional

---

## ⚡ Funcionalidades Principais

### 💰 Gestão Financeira

- **Contas Bancárias** - Controle de saldo dinâmico e múltiplas contas
- **Cartões de Crédito** - Gestão de faturas, parcelamentos e limites
- **Transações** - Registro completo de receitas e despesas
- **Orçamentos** - Planejamento mensal por categoria
- **Metas de Economia** - Acompanhamento visual de objetivos
- **Investimentos** - Registro de carteiras e projeções

### 🏦 Reconciliação Bancária

- **Importação OFX** - Upload de extratos bancários
- **Conciliação Automática** - Matching inteligente de transações
- **Histórico Completo** - Rastreamento de todas as reconciliações
- **Validação de Saldo** - Conferência automática de valores

### 📊 Relatórios e Análises

- **Visão Geral Mensal** - Dashboard completo do mês
- **Análise de Fluxo** - Entradas, saídas e projeções
- **Relatórios por Categoria** - Identificação de padrões de gasto
- **Evolução Patrimonial** - Acompanhamento de crescimento

### 👨‍👩‍👧‍👦 Modo Família

- **Orçamentos Compartilhados** - Gestão colaborativa de finanças
- **Caixinhas Coletivas** - Fundos para objetivos comuns
- **Despesas Rateadas** - Divisão proporcional de gastos
- **Convites e Permissões** - Sistema de roles (Leader, Admin, Member)
- **Equilíbrio de Contribuições** - Visualização e acerto de valores

### 🎮 Sistema de Gamificação

- **Perfil de Herói** - Avatar personalizado com atributos dinâmicos
- **Sistema de XP e Níveis** - Progressão baseada em ações financeiras
- **Árvore de Classes** - Evolução automática baseada em comportamento
- **Conquistas** - Marcos fixos e desafios
- **Missões Dinâmicas** - Objetivos temporários com recompensas
- **Batalhas de Chefe** - Eventos coletivos contra desafios financeiros
- **Linha do Tempo** - Histórico visual de ações e conquistas

### 🔐 Privacidade

- **Toggle Sincronizado** - Oculte todos os valores com um clique
- **Estado Compartilhado** - Sincronização automática entre componentes
- **Valores Mascarados** - Proteção visual de informações sensíveis

---

## 🛠 Arquitetura e Tecnologias

### Stack Completa

#### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes acessíveis e customizáveis
- **Framer Motion** - Animações fluidas
- **Recharts** - Gráficos e visualizações
- **React Hook Form + Zod** - Validação de formulários

#### Backend
- **Node.js + Express** - API RESTful
- **TypeScript** - Tipagem em todo backend
- **Prisma ORM** - Gerenciamento de banco de dados
- **MySQL** - Banco de dados relacional
- **Redis + BullMQ** - Filas assíncronas
- **JWT** - Autenticação e autorização

#### Serviços
- **MinIO** - Armazenamento de arquivos (S3-compatible)
- **Google AI (Genkit)** - Categorização inteligente e análises
- **Firebase Auth** - Autenticação de usuários

#### Infraestrutura
- **Docker** - Containerização (Redis, MinIO, MySQL)
- **Monorepo** - Frontend e Backend no mesmo repositório

### Arquitetura Orientada a Eventos

```
Ação Financeira → Evento (BullMQ) → Worker de Gamificação → Atualização de XP/Missões
```

Essa abordagem garante que a gamificação não impacte a performance das operações financeiras críticas.

---

## 📦 Módulos do Sistema

### 1. Dashboard Principal

Interface dinâmica com:
- Resumo financeiro do mês
- Perfil de herói (em modo gamificação)
- Cards de missões (Livro de Contas, Mapa de Jornada, Pacto de Crédito, Torre de Desafios)
- Linha do tempo de atividades
- Ações rápidas

### 2. Transações

- Listagem com filtros avançados
- Criação rápida de receitas/despesas
- Suporte a anexos
- Categorização automática via IA
- Edição e exclusão com auditoria

### 3. Contas e Cartões

- Gestão de múltiplas contas
- Cálculo dinâmico de saldo
- Faturas de cartão com lógica precisa
- Transferências entre contas

### 4. Orçamentos

- Criação por categoria
- Acompanhamento visual de gasto
- Alertas de limite
- Comparação mês a mês

### 5. Metas

- Definição de objetivos financeiros
- Progress tracking visual
- Vinculação com investimentos
- Upload de imagem de objetivo

### 6. Investimentos

- Registro de carteiras
- Plano de investimentos
- Projeções e análises
- Métricas de performance

### 7. Reconciliação

- Upload de arquivos OFX
- Interface de conciliação drag-and-drop
- Histórico de reconciliações
- Relatórios de discrepâncias

### 8. Relatórios

- Visão geral consolidada
- Análise por período
- Gráficos interativos
- Exportação de dados

### 9. Modo Família

- Dashboard familiar
- Gestão de membros
- Orçamentos e caixinhas compartilhados
- Timeline de atividades
- Equilíbrio financeiro entre membros

### 10. Perfil

- Dados pessoais e financeiros
- Upload de avatar
- Configurações de segurança
- Troféus e conquistas

---

## 🎮 Gamificação

### Sistema de Progressão

**Atributos do Herói:**
- **Força** - Poder de renda
- **Resistência** - Capacidade de poupança  
- **Sabedoria** - Disciplina com orçamentos
- **Sorte** - Habilidade de quitar dívidas

**Árvore de Classes:**
Evolução automática a cada 6 níveis baseada nos atributos dominantes:
```
Aventureiro Novato → Barão da Renda / Guardião da Poupança / Sábio do Equilíbrio / Caçador de Dívidas
```

### Mecânicas de Jogo

- **XP por Ações** - Cada ação financeira concede ou remove XP
- **Conquistas** - Marcos fixos (primeira transação, primeiro orçamento, etc.)
- **Missões** - Desafios temporários com recompensas
- **Batalhas de Chefe** - Eventos onde jogadores se unem contra desafios
- **Itens Colecionáveis** - Recompensas especiais com bônus

### Modos de Gamificação

- **Full RPG** - Experiência completa com todas as mecânicas
- **Lite** - Apenas XP e níveis
- **Classic** - Interface sem gamificação

---

## 👨‍👩‍👧‍👦 Modo Família

### Funcionalidades Colaborativas

**Orçamentos Compartilhados:**
- Limites definidos pelo líder
- Contribuições de todos os membros
- Visualização de progresso coletivo

**Caixinhas Coletivas (Fundos):**
- Objetivos financeiros compartilhados
- Aportes individuais rastreados
- Regras de saque configuráveis

**Despesas Rateadas:**
- Registro de gastos compartilhados
- Divisão automática ou proporcional
- Rastreamento de contribuições

**Equilíbrio Financeiro:**
- Visualização de credores e devedores
- Registro de acertos
- Histórico de transações

### Sistema de Permissões

- **Leader** - Controle total, pode deletar família
- **Admin** - Gerencia membros, orçamentos e fundos
- **Member** - Registra despesas e contribuições

---

## 🔒 Privacidade e Segurança

### Toggle de Privacidade

Sistema sincronizado que permite ocultar todos os valores financeiros:
- **Context Global** - Estado compartilhado via React Context
- **8 Componentes Sincronizados** - Um clique oculta valores em todo dashboard
- **Placeholders Consistentes** - Valores mascarados como "R$ ••••••"

### Segurança

- **Autenticação JWT** - Tokens seguros
- **Criptografia AES-256-GCM** - Dados sensíveis criptografados
- **Validação em Camadas** - Frontend e backend
- **CORS Configurado** - Proteção contra requisições não autorizadas
- **Rate Limiting** - Proteção contra abuso de API

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- MySQL 8+
- npm ou yarn

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/dexpesas.git
cd dexpesas
```

### 2. Configure Variáveis de Ambiente

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:6090
NEXT_PUBLIC_FIREBASE_API_KEY=sua-chave-firebase
# ... outras variáveis do Firebase
```

#### Backend (backend/.env)
```env
DATABASE_URL="mysql://user:password@localhost:3306/dexpesas"
JWT_SECRET=seu-secret-jwt
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost
# ... outras configurações
```

### 3. Inicie os Serviços Docker

```bash
cd backend
docker-compose up -d  # Inicia MySQL, Redis, MinIO
```

### 4. Configure o Banco de Dados

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed  # Opcional: dados de exemplo
```

### 5. Inicie o Backend

```bash
cd backend
npm run dev  # Roda em http://localhost:6090
```

### 6. Inicie o Frontend

```bash
# Na raiz do projeto
npm install
npm run dev  # Roda em http://localhost:9002
```

### 7. Acesse a Aplicação

Abra [http://localhost:9002](http://localhost:9002) no navegador.

---

## 📁 Estrutura do Projeto

```
dexpesas/
├── src/                          # Frontend (Next.js)
│   ├── app/                      # App Router
│   │   ├── dashboard/            # Módulos do dashboard
│   │   │   ├── cells/            # Modo Família
│   │   │   ├── contas/           # Contas e Cartões
│   │   │   ├── investimentos/    # Investimentos
│   │   │   ├── metas/            # Metas
│   │   │   ├── orcamentos/       # Orçamentos
│   │   │   ├── perfil/           # Perfil do Usuário
│   │   │   ├── reconcile/        # Reconciliação
│   │   │   ├── relatorios/       # Relatórios
│   │   │   └── transacoes/       # Transações
│   │   └── (auth)/               # Autenticação
│   ├── components/               # Componentes React
│   │   ├── dashboard/            # Componentes do dashboard
│   │   │   ├── family/           # Modo Família
│   │   │   ├── mission-cards/    # Cards gamificados
│   │   │   ├── overview/         # Cards de resumo
│   │   │   └── ...
│   │   ├── ui/                   # UI primitivos (shadcn)
│   │   └── brand/                # Branding Cloudive
│   ├── contexts/                 # React Contexts
│   │   ├── PrivacyContext.tsx    # Contexto de privacidade
│   │   └── UserContext.tsx       # Contexto do usuário
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Utilitários e configs
│   └── styles/                   # Estilos globais
│
├── backend/                      # Backend (Express + Prisma)
│   ├── src/
│   │   ├── controllers/          # Controladores da API
│   │   ├── services/             # Lógica de negócio
│   │   ├── workers/              # Workers assíncronos
│   │   ├── middleware/           # Middlewares
│   │   ├── routes/               # Rotas da API
│   │   └── utils/                # Utilitários
│   ├── prisma/                   # Schema e migrations
│   └── uploads/                  # Arquivos temporários
│
├── public/                       # Assets estáticos
├── docs/                         # Documentação adicional
└── README.md                     # Este arquivo
```

---

## 📚 Documentação Adicional

- **[Backend README](./backend/README.md)** - Guia completo do backend
- **[API Documentation](./docs/api.md)** - Documentação de endpoints
- **[Gamification Guide](./docs/gamification.md)** - Sistema de gamificação
- **[Database Schema](./docs/schema.md)** - Estrutura do banco de dados

---

## 🎨 Design System

### Identidade Visual Cloudive

- **Logo e Ícones** - `/public/cloudive-*`
- **Cores** - Tokens Tailwind customizados
- **Tipografia** - Inter e Inter Tight
- **Componentes** - Biblioteca modular e reutilizável

### Princípios de UX

1. **Mobile-First** - Responsivo em todas as telas
2. **Feedback Visual** - Animações e transições fluidas
3. **Acessibilidade** - ARIA labels e navegação por teclado
4. **Consistência** - Padrões repetidos em toda aplicação

---

## 🔧 Scripts Úteis

### Frontend
```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Produção
npm run lint         # Verificar erros de lint
```

### Backend
```bash
npm run dev          # Desenvolvimento com nodemon
npm run build        # Build TypeScript
npm run start        # Produção
npx prisma studio    # Interface visual do banco
npx prisma migrate   # Criar migration
```

---

## 📈 Roadmap

- [ ] Open Finance - Integração bancária automática
- [ ] App Mobile - React Native
- [ ] Modo Offline - PWA completo
- [ ] IA Financeira - Assistente com análises preditivas
- [ ] Multi-idioma - i18n completo
- [ ] Temas Customizáveis - Dark/Light/Custom

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

## 👥 Suporte

Para dúvidas, sugestões ou relatar bugs, entre em contato através dos canais oficiais Cloudive.

---

**Desenvolvido com ❤️ pela equipe Cloudive**
