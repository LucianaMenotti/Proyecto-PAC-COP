import "dotenv/config";

const smtpConfigurado = () =>
    Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    );

export const enviarEmail = async ({ to, subject, texto, html, enlace }) => {
    if (!smtpConfigurado()) {
        console.log(
            "[email simulado] SMTP no configurado. Enlace de recuperación:",
            enlace || texto
        );
        return { simulado: true, enlace: enlace || null };
    }

    try {
        const { default: nodemailer } = await import("nodemailer");

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            text: texto,
            html
        });

        return { enviado: true, id: info.messageId };
    } catch (error) {
        console.error("No se pudo enviar el email:", error.message);
        return { error: true };
    }
};
