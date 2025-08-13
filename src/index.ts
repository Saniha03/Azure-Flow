import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer"; // TypeScript types are included in nodemailer

// Interface for sendPartnerEmail data
interface EmailData {
  to: string;
  subject: string;
  text: string;
}

// Create transporter outside the functions
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().gmail.user, // set via firebase functions:config:set
    pass: functions.config().gmail.pass,
  },
});

// Example callable function
export const myFunction = functions.https.onCall(
  (data: any, context: functions.https.CallableContext) => {
    // your logic for myFunction
    return { message: "Hello from myFunction" };
  }
);

// Send email function (exported at top-level)
export const sendPartnerEmail = functions.https.onCall(
  async (data: EmailData, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }

    const { to, subject, text } = data;

    // Validate email data
    if (!to || !subject || !text) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required fields: to, subject, or text.");
    }

    try {
      await transporter.sendMail({
        from: '"AzureFlow💙" <your-email@gmail.com>', // Replace with your actual email
        to,
        subject,
        text,
      });
      return { message: "Email sent successfully" };
    } catch (error) {
      console.error("Error sending email:", error);
      throw new functions.https.HttpsError("internal", "Failed to send email");
    }
  }
);
