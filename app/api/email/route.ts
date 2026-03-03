import { NextRequest, NextResponse } from "next/server";

/**
 * NodeMailer API Route
 * 
 * Sends email notifications for reminders, exports, etc.
 * Requires SMTP credentials in environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * 
 * POST /api/email
 * Body: { to: string, subject: string, html: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 }
      );
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || "587";
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json(
        { error: "SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables." },
        { status: 500 }
      );
    }

    // Dynamic import to avoid bundling nodemailer for client
    const nodemailer = await import("nodemailer");

    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: parseInt(smtpPort, 10) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `MoneyMap <${smtpFrom}>`,
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error: unknown) {
    console.error("Email send error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to send email: ${message}` }, { status: 500 });
  }
}
