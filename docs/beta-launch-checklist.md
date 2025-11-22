# Versão Beta – Checklist Completo

Este documento reúne o que falta para lançar uma versão beta estável do *dexpesas* como um PWA de controle financeiro (sem integrações Open Finance neste momento). Agrupei por áreas para facilitar planejamento e acompanhamento.

## 1. Produto & Experiência do Usuário
- [ ] Definir proposta clara da beta (público-alvo, objetivos, métricas de sucesso).
- [x] Finalizar fluxo de onboarding (landing, cadastro/login, recuperação de senha, confirmação por e-mail).
- [x] Garantir responsividade mobile-first em todas as telas (dashboard, transações, relatórios, perfil).
- [x] Revisar microcopy, traduções e mensagens de erro em português consistente.
- [x] Implementar walkthrough ou tutorial inicial opcional no primeiro acesso.
- [ ] Adicionar seção “Novidades/Changelog” no app para comunicar atualizações beta.
- [ ] Criar área de feedback/suporte diretamente no app (formulário ou link para canal oficial).
- [ ] Validar acessibilidade básica (contraste, navegação por teclado, labels em inputs).
- [ ] Implementar preferências do usuário (tema claro/escuro, moeda, categorias favoritas).

## 2. PWA & Mobile
- [ ] Configurar `manifest.json` completo (nome curto/long, ícones em múltiplos tamanhos, theme/background color, display standalone, orientation).
- [ ] Criar service worker robusto (cache estático, cache first/network first conforme tela, estratégia de atualização com skipWaiting + notificação).
- [ ] Implementar fluxo de “App atualizado disponível” com botão para recarregar.
- [ ] Testar instalação em Android/iOS (Chrome, Safari) e garantir que ícones e splash funcionam.
- [ ] Ajustar meta tags para PWA (apple-touch-icon, status bar style, etc.).
- [ ] Configurar fallback/offline page para ações críticas (lista de transações, criação offline com fila de sync).

## 3. Backend & Funcionalidades
- [ ] Mapear e automatizar preenchimento de dados iniciais (categorias padrão, contas de exemplo).
- [ ] Revisar validações de transações (tipos, valores, datas) para impedir inconsistências.
- [ ] Implementar histórico/auditoria de alterações em transações (quem, quando, o que mudou).
- [ ] Incluir tags e filtros avançados (busca por descrição, valor, período, tags múltiplas).
- [ ] Adicionar exportação (CSV/Excel) e importação básica (CSV) para migração manual.
- [ ] Criar dashboards de resumo (gastos por categoria, receitas x despesas, tendências).
- [ ] Configurar notificações por e-mail para eventos importantes (ex.: lembrete de pendências de pagamento, resumo semanal).
- [ ] Revisar estrutura de permissões caso haja múltiplos usuários por conta (opcional).

## 4. Infraestrutura & DevOps
- [ ] Configurar pipeline CI/CD (lint, testes, build, deploy) para ambiente beta/homolog.
- [ ] Habilitar pré-visualização por PR (ex.: Vercel Preview) e validação automática de qualidade.
- [ ] Definir estratégia de versionamento (semver ou release tags) e changelog público.
- [ ] Política de backup e restauração da base de dados (scripts + rotina automatizada).
- [ ] Monitoramento e alertas (uptime, erros, consumo de recursos) com Sentry/Datadog ou equivalente.
- [ ] Análises de performance (Lighthouse, Web Vitals) com metas mínimas definidas.
- [ ] Revisar custos de infraestrutura e orçar a fase beta (hosting, e-mail, logs, etc.).

## 5. Segurança & Compliance
- [ ] Realizar revisão LGPD: base legal, consentimentos, direitos do titular, política de privacidade atualizada.
- [ ] Implementar banner/consentimento de cookies/analytics (opt-in).
- [ ] Criptografar dados sensíveis em repouso e trânsito (HTTPS obrigatório, secrets no vault).
- [ ] Estabelecer política de senhas fortes + MFA opcional para usuários.
- [ ] Criar plano de resposta a incidentes (contatos, passos, SLAs).
- [ ] Revisar logs (PII mínima, guarda segura, controle de acesso).
- [ ] Documentar rotinas de exclusão/anonimização de dados quando solicitado.

## 6. Conteúdo & Comunicação
- [ ] Atualizar site/landing com mensagem de beta, instruções para instalação do PWA.
- [ ] Preparar FAQ, guia rápido e vídeos curtos de onboarding.
- [ ] Definir canais de suporte (e-mail, Discord, WhatsApp Business) e tempos de resposta.
- [ ] Construir ciclo de feedback (surveys in-app, formulário, NPS simples).
- [ ] Planejar roadmap público ou “lista de próximos” para engajar usuários beta.

## 7. Testes & Qualidade
- [ ] Testes funcionais cobrindo fluxos críticos (login, criação/edição de transação, filtros, relatórios, preferências).
- [ ] Testes E2E automatizados em cenários mobile view.
- [ ] Testes de regressão visual (Storybook + Chromatic ou Percy).
- [ ] Testes de carga simples para endpoints mais usados.
- [ ] Beta fechado com grupo limitado antes do beta público (coleta de feedback).
- [ ] Checklist manual de publicação (versões, configs, links) aprovado antes de cada release.

## 8. Operação Pós-Lançamento Beta
- [ ] Criar painel interno com métricas essenciais (MAU, retenção, transações registradas).
- [ ] Definir cadência de releases beta (ex.: quinzenal) e processo de bugfix rápido.
- [ ] Estabelecer canal privado para beta testers (Telegram/Discord/Slack).
- [ ] Planejar migração de dados beta -> produção caso necessário.
- [ ] Preparar plano de escalonamento de suporte (horários, quem responde, templates).

---

Use esta checklist como guia vivo; marque cada item conforme for concluído e ajuste prioridades conforme o feedback dos testers e stakeholders. Quando todos os itens críticos estiverem completos, o PWA estará pronto para ser liberado em versão beta controlada.***
