/**
 * Gera um template HTML responsivo e bonito para e-mails transacionais.
 * @param {Object} options - Opções do e-mail
 * @param {string} options.title - Título principal do e-mail
 * @param {string} options.body - Conteúdo do e-mail (pode conter HTML básico)
 * @param {string} options.buttonText - Texto do botão de ação
 * @param {string} options.buttonUrl - URL do botão de ação
 * @param {string} [options.footerText] - Texto opcional para o rodapé
 * @returns {string} HTML completo do e-mail
 */
export function generateEmailHtml({ title, body, buttonText, buttonUrl, footerText }) {
    // Cores extraídas do globals.css e tailwind.config.ts
    const primaryColor = '#3B82F6'; // Blue-500 (Brand Primary)
    const backgroundColor = '#F8FAFC'; // Slate-50 (App Background)
    const containerColor = '#ffffff';
    const textColor = '#0F172A'; // Slate-900 (Foreground)
    const mutedColor = '#64748B'; // Slate-500 (Muted)

    // SVG Logo convertido para Base64 para melhor compatibilidade (embora alguns clientes bloqueiem)
    // IDs estáticos usados para garantir funcionamento dos gradientes
    const svgString = `
<svg width="180" height="48" viewBox="0 0 360 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="16" y1="16" x2="88" y2="72" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#A5F3D2" />
      <stop offset="1" stop-color="#3B82F6" />
    </linearGradient>
    <radialGradient id="grad2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 28) rotate(45) scale(40 32)">
      <stop offset="0" stop-color="#F8FAFC" stop-opacity="0.85" />
      <stop offset="1" stop-color="#F8FAFC" stop-opacity="0" />
    </radialGradient>
    <mask id="mask1">
      <g fill="white">
        <circle cx="32" cy="48" r="18" />
        <circle cx="52" cy="32" r="18" />
        <circle cx="72" cy="48" r="18" />
      </g>
    </mask>
  </defs>
  <g transform="translate(16,8)">
    <g fill="url(#grad1)">
      <circle cx="32" cy="48" r="18" />
      <circle cx="52" cy="32" r="18" />
      <circle cx="72" cy="48" r="18" />
    </g>
    <rect x="14" y="14" width="60" height="52" fill="url(#grad2)" mask="url(#mask1)" />
    <path d="M24 52 L36 40 L46 44 L60 32 L70 36" fill="none" stroke="#0F172A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />
    <circle cx="70" cy="36" r="3.2" fill="#F8FAFC" opacity="0.95" />
  </g>
  <text x="120" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="600" font-size="32" letter-spacing="0.04em" fill="#0F172A">
    Dexpesas
  </text>
  <text x="120" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="500" font-size="13" letter-spacing="0.16em" fill="#64748B" style="text-transform: uppercase">
    App de Finança
  </text>
</svg>
    `.trim();

    // Codifica o SVG para Base64
    const logoBase64 = Buffer.from(svgString).toString('base64');
    const logoSrc = `data:image/svg+xml;base64,${logoBase64}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: ${backgroundColor};
            color: ${textColor};
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .email-wrapper {
            background-color: ${containerColor};
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            overflow: hidden;
            border: 1px solid #E2E8F0;
        }
        .header {
            background-color: #ffffff;
            padding: 32px 20px 20px;
            text-align: center;
        }
        .content {
            padding: 20px 40px 40px;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }
        .button {
            display: inline-block;
            background-color: ${primaryColor};
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.2s;
            box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
        }
        .button:hover {
            background-color: #2563EB;
        }
        .footer {
            padding: 32px 20px;
            text-align: center;
            font-size: 12px;
            color: ${mutedColor};
            background-color: #F8FAFC;
            border-top: 1px solid #E2E8F0;
        }
        h1 {
            color: ${textColor};
            font-size: 24px;
            margin-bottom: 24px;
            font-weight: 700;
            letter-spacing: -0.02em;
        }
        p {
            margin-bottom: 16px;
            font-size: 16px;
            color: #334155;
        }
        .link {
            color: ${primaryColor};
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <img src="${logoSrc}" alt="Dexpesas" style="height: 48px; width: auto; display: block; margin: 0 auto;">
            </div>
            
            <div class="content">
                <h1 style="text-align: center;">${title}</h1>
                
                <div style="color: ${textColor};">
                    ${body}
                </div>

                ${buttonText && buttonUrl ? `
                <div class="button-container">
                    <a href="${buttonUrl}" class="button" target="_blank">${buttonText}</a>
                </div>
                ` : ''}
                
                <p style="font-size: 14px; color: ${mutedColor}; margin-top: 32px; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 20px;">
                    Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                    <a href="${buttonUrl}" class="link" style="word-break: break-all;">${buttonUrl}</a>
                </p>
            </div>

            <div class="footer">
                <p style="margin: 0;">
                    ${footerText || '© 2024 Dexpesas. Todos os direitos reservados.'}
                </p>
                <p style="margin: 8px 0 0 0;">
                    Este é um e-mail automático, por favor não responda.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}
