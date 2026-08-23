// import dotenv from "dotenv";
// dotenv.config();

// import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

// export const sendResetOtpEmail = async (toEmail, otp) => {
//   const { data, error } = await resend.emails.send({
//     from: process.env.EMAIL_FROM || "TaskPulse <onboarding@resend.dev>",
//     to: toEmail,
//     subject: "Reset your TaskPulse password",
//     html: `
//       <div
//         style="
//           font-family: Arial, sans-serif;
//           max-width: 480px;
//           margin: 40px auto;
//           padding: 30px;
//           border: 1px solid #e2e8f0;
//           border-radius: 12px;
//           background-color: #ffffff;
//         "
//       >
//         <h2 style="color: #4f46e5; margin-bottom: 10px;">
//           Reset your password
//         </h2>

//         <p style="color: #475569;">
//           We received a request to reset your TaskPulse password.
//         </p>

//         <p style="color: #475569;">
//           Use the following verification code:
//         </p>

//         <div
//           style="
//             margin: 25px 0;
//             padding: 18px;
//             background-color: #f8fafc;
//             border-radius: 8px;
//             text-align: center;
//           "
//         >
//           <span
//             style="
//               font-size: 32px;
//               font-weight: 700;
//               letter-spacing: 8px;
//               color: #4f46e5;
//             "
//           >
//             ${otp}
//           </span>
//         </div>

//         <p style="color: #64748b; font-size: 13px;">
//           This code expires in
//           ${process.env.OTP_EXPIRY_MINUTES || 10}
//           minutes.
//         </p>

//         <p style="color: #64748b; font-size: 13px;">
//           If you didn't request a password reset, you can safely ignore
//           this email.
//         </p>

//         <hr
//           style="
//             margin: 25px 0;
//             border: none;
//             border-top: 1px solid #e2e8f0;
//           "
//         />

//         <p
//           style="
//             color: #94a3b8;
//             font-size: 12px;
//             text-align: center;
//           "
//         >
//           © ${new Date().getFullYear()} TaskPulse
//         </p>
//       </div>
//     `,
//   });

//   if (error) {
//     console.error("Failed to send reset OTP email:", error);
//     throw new Error(error.message || "Failed to send email");
//   }

//   console.log(`Password reset OTP sent to ${toEmail}:`, data.id);

//   return data;
// };

// export const sendWorkspaceInviteEmail = async (
//   toEmail,
//   { workspaceName, inviterName, inviteLink, expiryDays = 7 },
// ) => {
//   const { data, error } = await resend.emails.send({
//     from: process.env.EMAIL_FROM || "TaskPulse <onboarding@resend.dev>",
//     to: toEmail,
//     subject: `${inviterName} invited you to join "${workspaceName}" on TaskPulse`,
//     html: `
//       <div
//         style="
//           font-family: Arial, sans-serif;
//           max-width: 480px;
//           margin: 40px auto;
//           padding: 30px;
//           border: 1px solid #e2e8f0;
//           border-radius: 12px;
//           background-color: #ffffff;
//         "
//       >
//         <h2 style="color: #4f46e5; margin-bottom: 10px;">
//           You've been invited to a workspace
//         </h2>

//         <p style="color: #475569;">
//           <strong>${inviterName}</strong> invited you to join
//           <strong>${workspaceName}</strong> on TaskPulse.
//         </p>

//         <div style="margin: 25px 0; text-align: center;">
//           <a 
//             href="${inviteLink}"
//             style="
//               display: inline-block;
//               background-color: #4f46e5;
//               color: #ffffff;
//               text-decoration: none;
//               font-weight: 600;
//               padding: 12px 28px;
//               border-radius: 8px;
//               font-size: 14px;
//             "
//           >
//             View Invitation
//           </a>
//         </div>

//         <p style="color: #64748b; font-size: 13px;">
//           This invite expires in ${expiryDays} days. If you weren't
//           expecting this, you can safely ignore this email.
//         </p>

//         <hr style="margin: 25px 0; border: none; border-top: 1px solid #e2e8f0;" />

//         <p style="color: #94a3b8; font-size: 12px; text-align: center;">
//           © ${new Date().getFullYear()} TaskPulse
//         </p>
//       </div>
//     `,
//   });

//   if (error) {
//     console.error("Failed to send workspace invite email:", error);
//     throw new Error(error.message || "Failed to send email");
//   }

//   console.log(`Workspace invite sent to ${toEmail}:`, data.id);

//   return data;
// };

// export const verifyEmailTransport = async () => {
//   if (!process.env.RESEND_API_KEY) {
//     console.error("❌ RESEND_API_KEY is not set");
//     return;
//   }
//   console.log("✅ Resend configured");
// };


import dotenv from "dotenv";
dotenv.config();

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// EMAIL_FROM format expected: "TaskPulse <youraddress@example.com>"
// The address must be a "Verified Sender" in your Brevo account.
const parseSender = () => {
  const raw = process.env.EMAIL_FROM || "TaskPulse <youraddress@example.com>";
  const match = raw.match(/^(.*)<(.+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: "TaskPulse", email: raw.trim() };
};

const sendBrevoEmail = async ({ to, subject, html }) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not set");
  }

  const sender = parseSender();

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Brevo error payloads look like: { code: "invalid_parameter", message: "..." }
    const message = data?.message || `Brevo request failed with status ${response.status}`;
    const err = new Error(message);
    err.code = data?.code;
    err.status = response.status;
    throw err;
  }

  // Success payload: { messageId: "<...>" }
  return data;
};

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

  let data;
  try {
    data = await sendBrevoEmail({
      to: toEmail,
      subject: "Reset your TaskPulse password",
      html,
    });
  } catch (error) {
    console.error("Failed to send reset OTP email:", error.message);
    throw new Error(error.message || "Failed to send email");
  }

  console.log(`Password reset OTP sent to ${toEmail}:`, data.messageId);

  return data;
};

export const sendWorkspaceInviteEmail = async (
  toEmail,
  { workspaceName, inviterName, inviteLink, expiryDays = 7 },
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

        <hr style="margin: 25px 0; border: none; border-top: 1px solid #e2e8f0;" />

        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} TaskPulse
        </p>
      </div>
    `;

  let data;
  try {
    data = await sendBrevoEmail({
      to: toEmail,
      subject: `${inviterName} invited you to join "${workspaceName}" on TaskPulse`,
      html,
    });
  } catch (error) {
    console.error("Failed to send workspace invite email:", error.message);
    throw new Error(error.message || "Failed to send email");
  }

  console.log(`Workspace invite sent to ${toEmail}:`, data.messageId);

  return data;
};

export const verifyEmailTransport = async () => {
  if (!process.env.BREVO_API_KEY) {
    console.error("❌ BREVO_API_KEY is not set");
    return;
  }
  console.log("✅ Brevo configured");
};