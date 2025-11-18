# Open Finance Integration Roadmap

Este documento descreve uma visão inicial de como o projeto _dexpesas_ pode evoluir para suportar integrações de Open Finance, seja via provedores regulados diretamente ou por meio de plataformas agregadoras como Belvo, Pluggy ou Gerencianet.

## Objetivos

- Sincronizar automaticamente contas, saldos e transações provenientes de instituições financeiras.
- Permitir que o usuário conceda, renove e revogue consentimentos de compartilhamento de dados.
- Garantir compliance com requisitos regulatórios e boas práticas de segurança dos provedores de dados.

## Componentes De Arquitetura

| Camada | Responsabilidades | Mudanças Principais |
| --- | --- | --- |
| **Frontend (Web App)** | UX para conectar bancos, exibir consentimentos, notificar erros de sincronização, reconciliação com lançamentos manuais. | Novas telas para onboarding de conectores, visão das contas sincronizadas, indicadores de expiração de consentimento. |
| **Backend API** | Orquestrar consentimentos, armazenar tokens/perfis de conexão, importar dados financeiros, conciliar com o modelo atual de transações. | Novos módulos para provedores, filas e jobs de coleta, endpoints para gerenciar status das integrações e eventos de webhook. |
| **Integração com provedores** | SDK/API de parceiros (Belvo, Pluggy, Gerencianet, Open Finance direto) encapsulados em serviços específicos. | Criação de drivers, mapeamento de dados para `accounts`, `cards`, `transactions`, tratamento de erros específicos. |
| **Persistência** | Armazenar credenciais cifradas, consentimentos, logs de sincronização e dados importados. | Novas tabelas: `financial_connections`, `financial_accounts`, `external_transactions`, `sync_runs`, além de migrações para relacionar com o modelo atual de transações. |
| **Observabilidade & Compliance** | Logs auditáveis, alertas de falha, trilha de consentimentos, retention policies. | Dashboard de monitoramento, trilhas de auditoria e ajustes em políticas de segurança/privacidade. |

## Fluxo De Alto Nível

1. **Conexão**: o usuário escolhe um provedor (ex.: Belvo) e inicia o fluxo de consentimento. O frontend redireciona para o widget do parceiro ou inicia o processo OAuth/OpenID no caso de regulados.
2. **Consentimento**: após autenticação no banco, o provedor retorna um `access_token`/`link_token`. O backend armazena os dados criptografados e cria um registro em `financial_connections`.
3. **Importação**: jobs agendados (ou webhooks) solicitam contas, saldos e transações. Cada lote gera registros em `financial_accounts` e `external_transactions`.
4. **Reconciliação**: serviços backend cruzam dados importados com o modelo de transações atual. O usuário pode confirmar/ajustar lançamentos automaticamente criados.
5. **Monitoramento**: quando o consentimento expira ou ocorre erro (MFA necessário, senha expirada, etc.), o sistema notifica o usuário e solicita nova autorização.

## Modelos De Aplicação

- **Microserviço de integração** (opcional): separar um serviço dedicado às integrações financeiras, entregando eventos para a API principal. Útil para isolamento de dependências pesadas (SDKs, certificados, filas).
- **Jobs assíncronos**: uso de um worker (BullMQ, Agenda, etc.) para agendar sincronizações por conexão, respeitando limites de provedores.
- **Event-driven updates**: suporte a webhooks que os provedores oferecem, disparando atualizações em tempo real.

## Mudanças Necessárias No Sistema Atual

### Backend

- **Novos módulos**:
  - `financial-connections`: CRUD de conexões e consentimentos.
  - `provider-drivers`: um driver por parceiro (BelvoDriver, PluggyDriver, etc.).
  - `sync-jobs`: agendador para importação incremental.
  - `reconciliation-service`: vincula `external_transactions` a `transactions`.
- **Novos endpoints**:
  - `POST /integrations/:provider/connect`: inicia processo de conexão.
  - `GET /integrations`: lista conexões e status.
  - `POST /integrations/:id/sync`: força sincronização.
  - Webhooks por provedor (ex.: `/webhooks/belvo`).
- **Segurança**:
  - Armazenar tokens cifrados (KMS, Vault ou libs como `node-jose`).
  - Rotacionar certificados/client secrets e logar acessos.

### Frontend

- **Fluxo de onboarding**:
  - Modal/listagem de provedores com informações de segurança.
  - Estado da conexão (conectado, expirado, erro).
- **Configurações**:
  - Visão de consentimentos ativos, data de expiração, botões de renovar/desconectar.
- **Dashboard de transações**:
  - Identificador visual para lançamentos importados automaticamente.
  - Ações para reconciliar/ignorar importações duplicadas.

### Infraestrutura & DevOps

- **Secrets management** integrado (Vault, AWS KMS, GCP Secret Manager).
- **Filas** (Redis + BullMQ, AWS SQS) para orquestrar coletas.
- **Monitoramento**: métricas de sucesso/falha de sincronização, tempo médio de coleta, alertas proativos.

## Considerações Regulatórias & Operacionais

- Adequar política de privacidade e termos de uso para refletir o compartilhamento de dados via terceiros.
- Registrar consentimentos, mantendo trilha audível (timestamp, escopo, provedor, contas vinculadas).
- Implementar mecanismos de deleção/anonimização quando o usuário revoga consentimento.
- Preparar respostas para incidentes de segurança (planos de contingência, relatórios).

## Próximos Passos Sugeridos

1. **Descoberta detalhada**: escolher provedores prioritários e mapear requisitos técnicos/contratuais.
2. **Prova de conceito**: integrar uma única instituição via Belvo/Pluggy e validar fluxo fim a fim.
3. **Modelagem de dados**: desenhar schema definitivo para conexões e transações externas.
4. **UX/Produto**: prototipar telas de conexão/monitoramento e validar com usuários.
5. **Planejamento de segurança**: definir estratégia de criptografia, armazenamento e auditoria.
6. **Roadmap incremental**: priorizar bancos/provedores com maior demanda e escalar a partir da prova de conceito.

---

Este documento deve ser evoluído conforme definições legais, escolha de provedores e necessidades do produto. Adapte as seções para refletir decisões finais de arquitetura e operações.***
