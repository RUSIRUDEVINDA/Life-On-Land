import nodemailer from "nodemailer";
import { AppError } from "./appError.js";

const isTestEnv =
    process.env.NODE_ENV === "test" ||
    process.env.JEST_WORKER_ID !== undefined ||
    process.env.npm_lifecycle_event === "test";

const stripTrailingSlashes = (value) => String(value || "").trim().replace(/\/+$/, "");

const originFromCandidate = (raw) => {
    const configured = stripTrailingSlashes(raw);
    if (!configured) return null;
    try {
        const parsed = new URL(configured);
        return parsed.origin;
    } catch {
        // Host without protocol (e.g. "localhost:5173") — best-effort for reset links
        return configured;
    }
};

const getFrontendOrigin = () => {
    const fromFrontendEnv = originFromCandidate(process.env.FRONTEND_ORIGIN);
    if (fromFrontendEnv) return fromFrontendEnv;

    // Keep tests hermetic: do not require FRONTEND_ORIGIN just to build a reset URL
    if (isTestEnv) {
        return "http://localhost:5173";
    }

    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
        return "http://localhost:5173";
    }

    // Production: many deployments set CORS_ORIGIN but forget FRONTEND_ORIGIN
    const corsFirst = (process.env.CORS_ORIGIN || "")
        .split(",")
        .map((s) => s.trim())
        .find(Boolean);
    const fromCors = originFromCandidate(corsFirst);
    if (fromCors) return fromCors;

    throw new AppError(
        "Email service misconfigured: set FRONTEND_ORIGIN or CORS_ORIGIN to your frontend base URL",
        500
    );
};

const getSmtpConfig = () => {
    const host = String(process.env.SMTP_HOST || "").trim();
    const user = String(process.env.SMTP_USER || "").trim();
    const pass = String(process.env.SMTP_PASS || "").trim();
    const portRaw = String(process.env.SMTP_PORT || "").trim();
    const port = portRaw ? Number(portRaw) : 587;

    const secureRaw = String(process.env.SMTP_SECURE || "").trim().toLowerCase();
    const secure =
        secureRaw === "true" ||
        secureRaw === "1" ||
        (secureRaw === "" && Number.isFinite(port) && port === 465);

    const from = String(process.env.SMTP_FROM || user || "").trim();

    if (!host || !user || !pass || !from) {
        throw new AppError(
            "Email service misconfigured: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM",
            500
        );
    }

    return { host, port, secure, user, pass, from };
};

let transporterPromise = null;

const getTransporter = async () => {
    if (transporterPromise) return transporterPromise;

    transporterPromise = (async () => {
        const { host, port, secure, user, pass } = getSmtpConfig();
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
        });

        // verify() often fails on hosted platforms (timeouts, TLS) even when sendMail works
        if (process.env.NODE_ENV !== "production") {
            await transporter.verify();
        }
        return transporter;
    })();

    return transporterPromise;
};

export const sendPasswordResetEmail = async ({ to, name, resetToken }) => {
    if (isTestEnv) {
        return {
            skipped: true,
            resetUrl: `${getFrontendOrigin()}/reset-password?token=${encodeURIComponent(resetToken)}`,
        };
    }

    const { from } = getSmtpConfig();
    const transporter = await getTransporter();
    const resetUrl = `${getFrontendOrigin()}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const safeName = String(name || "").trim();
    const greeting = safeName ? `Hi ${safeName},` : "Hi,";

    const subject = "Reset your password";
    const text =
        `${greeting}\n\n` +
        `We received a request to reset your password.\n\n` +
        `Reset link (valid for 1 hour):\n${resetUrl}\n\n` +
        `If you didn't request this, you can ignore this email.\n`;

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1f2937">
        <p>${greeting}</p>
        <p>We received a request to reset your password.</p>
        <p><strong>This link is valid for 1 hour.</strong></p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 14px;background:#2a5a45;color:#fff;border-radius:8px;text-decoration:none">
            Reset password
          </a>
        </p>
        <p style="font-size:12px;color:#6b7280">If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="font-size:12px;color:#374151;word-break:break-all">${resetUrl}</p>
        <p style="font-size:12px;color:#6b7280">If you didn't request this, you can ignore this email.</p>
      </div>
    `;

    await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
    });

    return { skipped: false, resetUrl };
};
