# Observabilidade e Testes de Carga

## 1. Endpoints de Saúde

| Método | Rota               | Descrição                                |
| ------ | ------------------ | ---------------------------------------- |
| GET    | `/api/health`      | Verifica banco + Redis e retorna status. |
| GET    | `/api/health/metrics` | Retorna métricas em tempo real (requisições, erros, rotas mais lentas, uso de memória, etc.) para integração com dashboards ou alertas. |

### Exemplo

```bash
curl https://seuservidor/api/health/metrics | jq
```

## 2. Métricas coletadas automaticamente

- Total de requisições, erros e requisições ativas.
- Tempo médio/máximo por rota (com corte automático das rotas mais lentas).
- Últimas 10 requisições acima de 1.2s.
- Uso de memória, uptime e `loadavg` do processo Node.

Os dados podem ser consumidos por Prometheus/Grafana via `json_exporter` ou scripts simples de monitoramento.

## 3. Criptografia de dados sensíveis

- Configure `DATA_ENCRYPTION_KEY` (32+ caracteres) no backend.  
  O serviço usa AES-256-GCM para proteger `phoneNumber`, `pushSubscription` e segredos 2FA.
- Sem a chave, os valores permanecem em texto plano (um aviso é logado no boot).
- Regenerar a chave invalida os registros existentes; armazene-a em um cofre seguro (ex.: AWS Secrets Manager, Doppler).

## 4. Testes de Carga

Use **autocannon** ou **k6** para validar o SLA:

```bash
npx autocannon -d 60 -c 50 https://seuservidor/api/health
```

Para rotas autenticadas, gere um token válido e inclua o header:

```bash
TOKEN="..."
npx autocannon -d 60 -c 25 -H "Authorization=Bearer $TOKEN" https://seuservidor/api/transactions?month=2024-11
```

### Checklist após o teste

- Verifique se `totalErrors` e `slowRequests` subiram de forma anormal.
- Gere alarmes (PagerDuty, Slack, Opsgenie) lendo `/api/health/metrics` e disparando alertas quando:
  - `totalErrors` aumentar rapidamente.
  - Houver mais de N requisições > 2s em 5 minutos.
  - `loadavg` > número de CPUs por 3 janelas consecutivas.

## 5. Próximos passos sugeridos

- Integrar `/api/health/metrics` a um coletor (Prometheus, Grafana Cloud).
- Automatizar testes de carga via CI (k6 GitHub Action) antes de releases.
- Mapear tempos de resposta críticos e definir SLO/SLI formais (ex.: P95 < 800 ms para `/api/transactions`).
