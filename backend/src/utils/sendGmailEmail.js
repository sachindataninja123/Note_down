import gmail from "../config/gmailClient.js";

const sendGmailEmail = async ({ to, subject, html }) => {
  try {
    const encodedSubject = Buffer.from(subject, "utf-8").toString("base64");

    const message = [
      `From: TaskPulse <${process.env.GMAIL_USER}>`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${encodedSubject}?=`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(html, "utf-8").toString("base64"),
    ].join("\r\n");

    const raw = Buffer.from(message)
      .toString("base64url");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
      },
    });

    console.log("Email sent successfully:", response.data.id);

    return response.data;
  } catch (error) {
    console.error(
      "Gmail API Error:",
      error.response?.data || error.message
    );

    throw new Error("Failed to send email");
  }
};

export default sendGmailEmail;