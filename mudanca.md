# Mudanças Prioritárias (Inspirado em Mobills, Dezpesas)

## ✅ Onboarding e Categorias
- Fluxo guiado pós-cadastro agora inclui etapas para definir renda fixa, metas principais e categorias favoritas.
- Sugestões rápidas destacam categorias mais usadas e registram preferências do usuário para o dashboard.

## ✅ Resumo do Mês
- Card `MonthlyOverviewCard` exibe saldo por conta, comparação com o mês anterior e mini gráfico de categorias clicáveis.
- Exportação de “Mês atual” disponível diretamente no card.

## ✅ Alertas Básicos
- Dashboard mostra card “Alertas” com contas atrasadas, limite de cartão acima de 85% e orçamentos estourados, cada um apontando para a tela correspondente.

## ✅ Modo Família Compartilhado
- Saldo consolidado e ranking de gastos por membro exibidos no painel.
- Ações rápidas para “Aprovar gasto” e “Ver orçamento familiar” diretamente da home.
- Preferência “Não mostrar Modo Família” salva pelo usuário.

## ✅ Validações de Entrada
- Formulário de transações valida valores/datas, restringe períodos inválidos e sugere categorias/tags inteligentes antes do submit.

## ✅ Experiência Mobile
- Botão flutuante (FAB) para “Nova transação” disponível na navegação inferior.
- CTA de “Scan de fatura” exposto logo abaixo do hero no dashboard.

## ✅ Relatórios e Insights Interativos
- Comparativo com mês anterior diretamente no card de resumo (variação %).
- Mini gráfico de barras para “Categorias do mês” sem precisar abrir Relatórios.

## ✅ CTAs para Metas e Orçamentos
- Botões “Criar orçamento” e “Nova meta” nos próprios cards de missões (Journey Map e Challenge Tower).
- CTA para reconciliação visível no card de resumo mensal quando exportações estão pendentes.

## ✅ Personalização Simples
- Preferências de layout e “hide family mode” armazenadas rapidamente via endpoint /user/preferences.
- Novo card “Modo de Experiência” nas Configurações permite alternar entre FULL, LITE ou OFF a qualquer momento.

## ✅ Segurança e Recuperação
- Cadastro exige senha forte (letras+números) e coleta telefone/2FA após onboarding.
- Security Service registra novos dispositivos e dispara alertas no dashboard.
- Card “Segurança e acesso” destaca pendências e permite ajustar configurações rápidas.

## ✅ Alertas Visuais
- Badges e cores fortes aplicados a cartas com limite crítico, orçamentos estourados e alertas prioritários.

## ✅ Otimizações de UX
- Autocomplete inteligente reduzido para 800ms com cache de sugestões.
- CTA do scan/OCR disponível diretamente no dashboard.

## ✅ Qualidade (QA)
- Testes automatizados (Node test runner) cobrem utilitários de segurança e novas regras.

## Observações
- Funcionalidades de Open Finance permanecem desativadas até priorização futura, conforme plano original.
