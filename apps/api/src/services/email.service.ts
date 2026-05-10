import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendSetupPasswordEmail(
  to: string,
  clientName: string,
  setupLink: string
): Promise<void> {
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: 'Tu cuenta en Sarui Studio está lista',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:Arial,sans-serif;background:#FDFFEC;padding:40px 20px">
        <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid rgba(37,79,64,0.1)">
          <div style="text-align:center;margin-bottom:24px">
            <h1 style="color:#254F40;font-size:24px;margin:0">Sarui Studio</h1>
            <p style="color:#749390;font-size:14px">Pilates Studio · Oaxaca</p>
          </div>

          <h2 style="color:#254F40;font-size:18px;margin-top:0">Hola ${clientName},</h2>
          <p style="color:#4a5568;font-size:15px;line-height:1.6">
            Tu solicitud de cuenta en <strong>Sarui Studio</strong> ha sido aprobada.
            Solo falta que crees tu contraseña para empezar a agendar clases.
          </p>

          <div style="text-align:center;margin:28px 0">
            <a href="${setupLink}"
               style="display:inline-block;background:#254F40;color:#F6FFB5;text-decoration:none;
                      font-size:16px;font-weight:600;padding:14px 32px;border-radius:12px">
              Crear mi contraseña
            </a>
          </div>

          <p style="color:#4a5568;font-size:14px;line-height:1.5">
            O copia este enlace en tu navegador:<br>
            <a href="${setupLink}" style="color:#749390;font-size:13px;word-break:break-all">${setupLink}</a>
          </p>

          <p style="color:#a0aec0;font-size:13px;margin-top:24px;border-top:1px solid #edf2f7;padding-top:16px">
            Este enlace expira en <strong>24 horas</strong>.<br>
            Si no solicitaste esta cuenta, ignora este correo.
          </p>

          <p style="color:#749390;font-size:12px;text-align:center;margin-top:20px">
            Sarui Studio · Xoxocotlán, Oaxaca · México
          </p>
        </div>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error('[EMAIL] Failed to send setup email:', error);
    throw error;
  }

  console.log(`[EMAIL] Setup email sent to ${to}`);
}

export async function sendResetPasswordEmail(
  to: string,
  clientName: string,
  resetLink: string
): Promise<void> {
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: 'Restablece tu contraseña — Sarui Studio',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:Arial,sans-serif;background:#FDFFEC;padding:40px 20px">
        <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid rgba(37,79,64,0.1)">
          <div style="text-align:center;margin-bottom:24px">
            <h1 style="color:#254F40;font-size:24px;margin:0">Sarui Studio</h1>
            <p style="color:#749390;font-size:14px">Pilates Studio · Oaxaca</p>
          </div>

          <h2 style="color:#254F40;font-size:18px;margin-top:0">Hola ${clientName},</h2>
          <p style="color:#4a5568;font-size:15px;line-height:1.6">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Sarui Studio</strong>.
          </p>

          <div style="text-align:center;margin:28px 0">
            <a href="${resetLink}"
               style="display:inline-block;background:#254F40;color:#F6FFB5;text-decoration:none;
                      font-size:16px;font-weight:600;padding:14px 32px;border-radius:12px">
              Restablecer contraseña
            </a>
          </div>

          <p style="color:#4a5568;font-size:14px;line-height:1.5">
            O copia este enlace en tu navegador:<br>
            <a href="${resetLink}" style="color:#749390;font-size:13px;word-break:break-all">${resetLink}</a>
          </p>

          <p style="color:#a0aec0;font-size:13px;margin-top:24px;border-top:1px solid #edf2f7;padding-top:16px">
            Este enlace expira en <strong>1 hora</strong>.<br>
            Si no solicitaste esto, ignora este correo.
          </p>

          <p style="color:#749390;font-size:12px;text-align:center;margin-top:20px">
            Sarui Studio · Xoxocotlán, Oaxaca · México
          </p>
        </div>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error('[EMAIL] Failed to send reset email:', error);
    throw error;
  }

  console.log(`[EMAIL] Reset email sent to ${to}`);
}
