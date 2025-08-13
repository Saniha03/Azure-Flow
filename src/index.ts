import * as functions from "firebase-functions";
    import * as nodemailer from "nodemailer";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "saniharumc@gmail.com", // Replace with your Gmail address
        pass: "tydo znjg wfih ldrp", // Replace with your Gmail App Password
      },
    });

    export const sendPartnerEmail = functions.https.onCall(async (data, context) => {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
      }

      const { to, subject, text } = data;

      try {
        await transporter.sendMail({
          from: '"AzureFlow💙" <saniharumc@gmail.com>',
          to,
          subject,
          text,
        });
        return { message: "Email sent successfully" };
      } catch (error) {
        console.error("Error sending email:", error);
        throw new functions.https.HttpsError("internal", "Failed to send email");
      }
    });
