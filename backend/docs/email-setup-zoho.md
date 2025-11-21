# Configuração de E-mail - Zoho SMTP

## Variáveis de Ambiente Necessárias

Adicione estas variáveis ao seu arquivo `.env` do backend:

```bash
# Escolha o provedor de e-mail
EMAIL_PROVIDER=smtp

# Configurações SMTP do Zoho
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@seudominio.com
SMTP_PASS=sua-senha-de-app-zoho
SMTP_FROM_EMAIL=noreply@seudominio.com
SMTP_FROM_NAME=Dexpesas

# URL do app (para links nos e-mails)
APP_URL=http://localhost:9004
```

## Como Obter a Senha de App do Zoho

1. Acesse: https://accounts.zoho.com/home#security/2fa
2. Em "Application-Specific Passwords", clique em "Generate New Password"
3. Escolha um nome (ex: "Dexpesas Backend")
4. Copie a senha gerada e use como `SMTP_PASS`

⚠️ **Importante:** Nunca use sua senha principal do Zoho! Use sempre uma senha de aplicativo.

## Testando

Após configurar, teste registrando um novo usuário ou solicitando recuperação de senha. Os e-mails devem ser enviados pelo seu domínio Zoho.

## Fallback SendGrid

Se preferir voltar ao SendGrid no futuro, basta mudar:

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=sua-chave-sendgrid
SENDGRID_FROM_EMAIL=noreply@seudominio.com
```

O sistema detecta automaticamente qual provedor usar.
