const escaparHtml = (valor = "") =>
  String(valor).replace(
    /[&<>"]/g,
    (car) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[car],
  );

export const plantillaRecuperacion = ({ nombre = "", enlace, minutos }) => {
  const nombreLimpio = String(nombre).trim();
  const saludo = nombreLimpio ? `Hola, ${nombreLimpio}:` : "Hola,";
  const enlaceHtml = escaparHtml(enlace);

  const texto = [
    "¿Olvidaste tu contraseña?",
    "",
    saludo,
    "",
    "Recibimos un pedido para restablecer la contraseña de tu cuenta en Pac-COP.",
    "",
    "Para restablecerla ingresá a este enlace:",
    enlace,
    "",
    `El enlace vence en ${minutos} minutos y solo puede usarse una vez. Si el botón no te funciona, copiá y pegá el enlace en tu navegador.`,
    "",
    "¿No pediste este cambio? Ignorá este correo: tu contraseña sigue siendo la misma. Nunca te vamos a pedir tu contraseña por correo.",
    "",
    "Pac-COP",
    "Este es un correo automático, por favor no respondas a este mensaje.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4fbf9;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">El enlace vence en ${minutos} minutos. Si no fuiste vos, ignorá este correo.</div>
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
    <div style="background-color:#1f7a74;padding:22px 28px;">
      <span style="font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:1px;">PAC-COP</span>
    </div>
    <div style="padding:28px;">
      <h1 style="margin:0 0 18px 0;font-size:24px;color:#2c3e50;">¿Olvidaste tu contraseña?</h1>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#2c3e50;">${escaparHtml(saludo)}</p>
      <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#2c3e50;">Recibimos un pedido para restablecer la contraseña de tu cuenta en Pac-COP.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
        <tr>
          <td style="background-color:#1f7a74;border-radius:6px;">
            <a href="${enlaceHtml}" style="display:inline-block;padding:14px 30px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">Restablecer contraseña</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 6px 0;font-size:13px;color:#64748b;">Si el botón no te funciona, copiá y pegá este enlace en tu navegador:</p>
      <p style="margin:0 0 24px 0;font-size:13px;line-height:1.5;color:#1f7a74;word-break:break-all;">${enlaceHtml}</p>
      <div style="background-color:#f4fbf9;border-left:4px solid #1f7a74;padding:14px 16px;font-size:14px;color:#2c3e50;line-height:1.5;"><strong>Vigencia:</strong> el enlace vence en <strong>${minutos} minutos</strong> y solo puede usarse una vez.</div>
      <div style="background-color:#ffffff;border:1px solid #e2e8f0;padding:14px 16px;margin-top:12px;font-size:13px;color:#64748b;line-height:1.5;">¿No pediste este cambio? Ignorá este correo: tu contraseña sigue siendo la misma. Nunca te vamos a pedir tu contraseña por correo.</div>
    </div>
    <div style="background-color:#f4fbf9;padding:18px 28px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;"><strong>Pac-COP</strong><br>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>`;

  return {
    subject: "Restablecé tu contraseña en Pac-COP",
    texto,
    html,
  };
};
