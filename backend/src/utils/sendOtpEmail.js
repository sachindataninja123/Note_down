import "dotenv/config";
import sendGmailEmail from "./sendGmailEmail.js";

// ==========================================
// 1. SEND PASSWORD RESET OTP EMAIL
// ==========================================

export const sendResetOtpEmail = async (toEmail, otp) => {
  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 480px;
        margin: 40px auto;
        padding: 30px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background-color: #ffffff;
      "
    >
      <h2 style="color: #4f46e5; margin-bottom: 10px;">
        Reset your password
      </h2>

      <p style="color: #475569;">
        We received a request to reset your TaskPulse password.
      </p>

      <p style="color: #475569;">
        Use the following verification code:
      </p>

      <div
        style="
          margin: 25px 0;
          padding: 18px;
          background-color: #f8fafc;
          border-radius: 8px;
          text-align: center;
        "
      >
        <span
          style="
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 8px;
            color: #4f46e5;
          "
        >
          ${otp}
        </span>
      </div>

      <p style="color: #64748b; font-size: 13px;">
        This code expires in
        ${process.env.OTP_EXPIRY_MINUTES || 10}
        minutes.
      </p>

      <p style="color: #64748b; font-size: 13px;">
        If you didn't request a password reset, you can safely ignore
        this email.
      </p>

      <hr
        style="
          margin: 25px 0;
          border: none;
          border-top: 1px solid #e2e8f0;
        "
      />

      <p
        style="
          color: #94a3b8;
          font-size: 12px;
          text-align: center;
        "
      >
        © ${new Date().getFullYear()} TaskPulse
      </p>
    </div>
  `;

  try {
    const data = await sendGmailEmail({
      to: toEmail,
      subject: "Reset your TaskPulse password",
      html,
    });

    console.log(
      `Password reset OTP sent to ${toEmail}:`,
      data.id
    );

    return data;
  } catch (error) {
    console.error(
      "Failed to send reset OTP email:",
      error.message
    );

    throw new Error(error.message || "Failed to send email");
  }
};


// ==========================================
// 2. SEND WORKSPACE INVITATION EMAIL
// ==========================================

export const sendWorkspaceInviteEmail = async (
  toEmail,
  {
    workspaceName,
    inviterName,
    inviteLink,
    expiryDays = 7,
  }
) => {
  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 480px;
        margin: 40px auto;
        padding: 30px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background-color: #ffffff;
      "
    >
      <h2 style="color: #4f46e5; margin-bottom: 10px;">
        You've been invited to a workspace
      </h2>

      <p style="color: #475569;">
        <strong>${inviterName}</strong> invited you to join
        <strong>${workspaceName}</strong> on TaskPulse.
      </p>

      <div style="margin: 25px 0; text-align: center;">
        <a
          href="${inviteLink}"
          style="
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff;
            text-decoration: none;
            font-weight: 600;
            padding: 12px 28px;
            border-radius: 8px;
            font-size: 14px;
          "
        >
          View Invitation
        </a>
      </div>

      <p style="color: #64748b; font-size: 13px;">
        This invite expires in ${expiryDays} days. If you weren't
        expecting this, you can safely ignore this email.
      </p>

      <hr
        style="
          margin: 25px 0;
          border: none;
          border-top: 1px solid #e2e8f0;
        "
      />

      <p
        style="
          color: #94a3b8;
          font-size: 12px;
          text-align: center;
        "
      >
        © ${new Date().getFullYear()} TaskPulse
      </p>
    </div>
  `;

  try {
    const data = await sendGmailEmail({
      to: toEmail,
      subject: `${inviterName} invited you to join "${workspaceName}" on TaskPulse`,
      html,
    });

    console.log(
      `Workspace invite sent to ${toEmail}:`,
      data.id
    );

    return data;
  } catch (error) {
    console.error(
      "Failed to send workspace invite email:",
      error.message
    );

    throw new Error(error.message || "Failed to send email");
  }
};


// ==========================================
// 3. VERIFY GMAIL CONFIGURATION
// ==========================================

export const verifyEmailTransport = async () => {
  const requiredVariables = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GMAIL_USER",
    "GMAIL_REFRESH_TOKEN",
  ];

  const missingVariables = requiredVariables.filter(
    (variable) => !process.env[variable]
  );

  if (missingVariables.length > 0) {
    console.error(
      "❌ Missing Gmail environment variables:",
      missingVariables.join(", ")
    );

    return false;
  }

  console.log("✅ Gmail API environment configured");

  return true;
};