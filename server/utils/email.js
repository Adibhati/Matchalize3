/**
 * 📧 "Your college is live" — sent ONLY when an operator presses Notify on a
 * college request group. Never automatically, and never at request time.
 *
 * ⚠️ Why that restraint matters: this is the one email we ever send to an
 * address that arrived from a public, unauthenticated web form. Sending it
 * automatically on college-creation would mean a single typo in a college name
 * emails every student who requested it — including a typo that silently splits
 * one campus's requests across two names. An explicit press means the operator
 * has looked at the grouped list and confirmed the spelling first.
 *
 * There is deliberately NO sign-in or verification link in this email. A link
 * would turn the request form into an account-takeover primitive: submit
 * someone else's address, have a link sent to them, click it.
 */
/**
 * 📧 EMAIL TRANSPORT — Resend.
 *
 * ── WHY RESEND_SENDER_EMAIL MUST BE A BARE ADDRESS ──────────────────────────
 * The `from` header is composed as `${senderName} <${senderEmail}>`, so
 * RESEND_SENDER_EMAIL must be ONLY the address — `otp@huh.app`. Setting it to
 * the full display form (`huh? <otp@huh.app>`) produces
 *
 *     from: "huh? <huh? <otp@huh.app>>"
 *
 * which Resend rejects with a validation error, and the failure surfaces only
 * as an OTP that never arrives. The default below is deliberately bare for the
 * same reason.
 */
const senderEmail = () => process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
const senderName = () => process.env.RESEND_SENDER_NAME || 'huh?';

// ⚠️ `onboarding@resend.dev` is Resend's sandbox sender. It delivers ONLY to
// the email address that owns the Resend account. Every real student is
// silently unreachable while it is in use, and nothing errors — Resend accepts
// the send and delivers it to the wrong place. Set a verified domain.
const brand = () => senderName();

export const sendCollegeLive = async (email, collegeName) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[DEV MODE] College-live email for ${email}: ${collegeName} is now on ${brand()}`);
    return true;
  }

  // Escape before interpolation into HTML — the name comes from user input.
  const safeName = String(collegeName || 'your college').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );

  const htmlContent = `
    <div style="font-family: 'Inter', sans-serif; background-color: #0A0A0C; color: #F5F5F7; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);">
      <h1 style="color: #D4A853; font-size: 28px; margin-bottom: 8px; font-weight: 700; letter-spacing: 2px;">${brand().toUpperCase()}</h1>
      <p style="color: #6E6E80; font-size: 14px; margin-bottom: 24px;">Your Campus. Your People.</p>
      <div style="background-color: #141418; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.03);">
        <p style="font-size: 18px; color: #F5F5F7; margin: 0 0 8px 0; font-weight: 600;">${safeName} is live</p>
        <p style="font-size: 14px; color: #6E6E80; margin: 0; line-height: 1.5;">
          You asked us to add your campus, and we have. You can now sign up and start matching with students there.
        </p>
      </div>
      <p style="font-size: 12px; color: #6E6E80; line-height: 1.5;">
        ${brand()} is for verified students only. You will need your campus email address to sign up.
      </p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${senderName()} <${senderEmail()}>`,
      to: [email],
      subject: `${collegeName} is now on ${brand()}`,
      html: htmlContent,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend API error:', err);
    throw new Error(`Resend API error: ${err}`);
  }

  return true;
};

export const sendOTP = async (email, otp) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is required to send OTP emails in production');
    }
    console.log(`\n----------------------------------------`);
    console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    console.log(`----------------------------------------\n`);
    return true;
  }

  const htmlContent = `
    <div style="font-family: 'Inter', sans-serif; background-color: #0A0A0C; color: #F5F5F7; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);">
      <h1 style="color: #D4A853; font-size: 28px; margin-bottom: 8px; font-weight: 700; letter-spacing: 2px;">${brand().toUpperCase()}</h1>
      <p style="color: #6E6E80; font-size: 14px; margin-bottom: 24px;">Your Campus. Your People.</p>
      <div style="background-color: #141418; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.03);">
        <p style="font-size: 16px; color: #F5F5F7; margin-top: 0;">Here is your verification code:</p>
        <div style="font-size: 36px; font-weight: 700; color: #D4A853; letter-spacing: 6px; margin: 16px 0;">${otp}</div>
        <p style="font-size: 12px; color: #6E6E80; margin-bottom: 0;">This code is valid for 10 minutes and can only be used once.</p>
      </div>
      <p style="font-size: 12px; color: #6E6E80; line-height: 1.5;">If you did not request this code, you can safely ignore this email.</p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${senderName()} <${senderEmail()}>`,
      to: [email],
      subject: `Your ${brand()} Login Code`,
      html: htmlContent,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend API error:', err);
    throw new Error(`Resend API error: ${err}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n----------------------------------------`);
    console.log(`[OTP] For ${email}: ${otp}`);
    console.log(`----------------------------------------\n`);
  }

  return true;
};
