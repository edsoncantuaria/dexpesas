# Mudanças Prioritárias (Inspirado em Mobills, Dezpesas)

## Cadastro e Validações
- Adicionar confirmação de e-mail/senha.
- Validar força de senha (letras, números).
- Incluir validação de CPF/CNPJ antes de ativar a conta.

## Onboarding e Categorias
- Fluxo guiado pós-cadastro para definir renda fixa, categorias favoritas e metas principais.
- Sugestão de categorias por perfil para facilitar leitura do dashboard.

## Resumo do Mês
- Incluir indicadores “saldo por conta” e “gastos x orçamento por categoria”.
- Adicionar mini gráfico de evolução mensal ou card “Categorias do mês” com barras clicáveis.

## Alertas Básicos
- Card “Alertas” no dashboard mostrando: contas atrasadas, limite de cartão acima de 85%, orçamento estourado.
- Cada alerta deve apontar diretamente para a tela correspondente.

## Modo Família Compartilhado
- Mostrar saldo consolidado da família no topo quando ativo.
- Permitir ver rapidamente quem gastou o quê, com opção de “Orçamento da família”.

## Validações de Entrada
- Validar campos no front: impedir valores negativos ou datas inconsistentes.
- Mostrar sugestões de categoria/tags enquanto o usuário digita (antes do submit).

## Experiência Mobile
- Incluir botão flutuante (FAB) para “Nova transação” ou “Scan de fatura”.
- CTA fixo logo abaixo do hero caso o FAB não seja viável.

## Exportações Rápidas
- Acesso “Exportar mês atual” dentro do `MonthlyOverviewCard`.

## Relatórios e Insights Interativos
- Permitir comparação com mês anterior diretamente do card (exibir variação %).
- Adicionar gráfico/barras de categorias clicáveis no dashboard (sem precisar abrir Relatórios).
- Implementar gráficos comparativos interativos (linhas/barras) com filtros rápidos.

## CTAs para Metas e Orçamentos
- Incluir botões “Criar orçamento” / “Nova meta” nos próprios cards de resumo.
- Mostrar cards “meta incompleta” com link direto para contribuir.
- CTA também para reconciliação quando houver extratos pendentes.

## Personalização Simples
- Oferecer opção de esconder/mostrar blocos principais sem o antigo builder complexo.
- Salvar preferências rapidamente (ex.: “Não mostrar Modo Família”).

## Modo Família Mais Completo
- Mostrar saldo total compartilhado e ranking de gastos por membro.
- Adicionar ações rápidas (“Aprovar gasto”, “Ver orçamento familiar”) na home.

## Segurança e Recuperação
- Solicitar telefone/2FA após cadastro para recuperar senha.
- Avisar quando alguém entrar via novo dispositivo.

## Alertas Visuais
- Usar cores e ícones fortes para orçamentos estourados ou faturas vencidas.
- Mostrar badges em cartões relevantes (ex.: “+2 alertas”).
- Reforçar visualmente alertas críticos com destaque mais chamativo.

## Otimizações de UX
- Reduzir debounce do autocompletar ou cachear últimas sugestões.
- Garantir CTA para OCR/Scan direto do dashboard.

## Qualidade (QA)
- Adicionar suíte de testes para evitar erros de hooks/keys em produção.

## Modo Família Consolidado
- Exibir saldo total compartilhado e resumo por membro direto no dashboard.
- Permitir ações rápidas (aprovar gastos, ver orçamento familiar) sem sair da home.

## Segurança e Cadastro
- Incluir confirmações adicionais no cadastro (senha forte, verificação em dois fatores).
- Destacar alertas de segurança (login em novo dispositivo, reset de senha) no dashboard.

## Conectar Banco / Open Finance
- Manter qualquer integração bancária/offline desativada por enquanto; priorizar as melhorias acima antes de investir em Open Finance por ser uma implementação cara e lenta.