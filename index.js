require("dotenv").config();
const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const xlsx = require("xlsx");
const path = require("path");
const WebSocket = require("ws"); // Import WebSocket

const app = express();
const upload = multer(); // multer to handle file uploads

// Set up static file serving for the frontend
app.use(express.static(path.join(__dirname, "public")));

// Create a WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Function to broadcast messages to all connected clients
const broadcast = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Upgrade HTTP server to support WebSocket
const server = app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to extract name from email address
function extractNameFromEmail(email) {
  const localPart = email.split("@")[0];
  const nameParts = localPart
    .split(/[._]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));
  return nameParts.join(" ");
}

// Function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Function to send email log summary
async function sendLogEmail(logSummary) {
  const adminEmail = "parthgarg351@gmail.com"; // Replace with the specific email address
  const logSubject = "Bulk Email Process Summary";
  const logMessage = `Here is the summary of the recent bulk email process:\n\n${logSummary}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: logSubject,
    text: logMessage,
  });
}

// Route to handle email sending
app.post("/send-emails", upload.any(), async (req, res) => {
  try {
    // Find the email file
    const emailFile = req.files.find((file) => file.fieldname === "emailFile");
    if (!emailFile) {
      return res
        .status(400)
        .json({ message: "Excel file with emails is missing." });
    }

    // Parse the Excel file
    const workbook = xlsx.read(emailFile.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Extract and validate emails
    const emails = data
      .map((row) => row.email)
      .filter((email) => email && isValidEmail(email));
    const invalidEmails = data
      .map((row) => row.email)
      .filter((email) => email && !isValidEmail(email));

    const { subject, message } = req.body;
    const failedEmails = [];

    // Prepare attachments array from uploaded files
    const attachments = req.files
      .filter((file) => file.fieldname.startsWith("attachment_"))
      .map((file) => ({
        filename: file.originalname,
        content: file.buffer,
      }));

    // Send emails with attachments
    for (const email of emails) {
      const name = extractNameFromEmail(email);
      const personalizedSubject = `Hello ${name}, ${subject}`;
      const personalizedMessage = `Hi ${name},\n\n${message}`;

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: personalizedSubject,
          text: personalizedMessage,
          attachments: attachments, // Attachments array
        });
        console.log(`Email sent to: ${email}`);
        broadcast(`Email sent to: ${email}`);
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        failedEmails.push(email);
        broadcast(`Failed to send email to ${email}: ${error.message}`);
      }
    }

    // Generate log summary
    const logSummary = `
    Emails Process Completed
    Sent Emails: ${
      emails.filter((email) => !failedEmails.includes(email)).join(", ") ||
      "None"
    }
    Failed Emails: ${failedEmails.join(", ") || "None"}
    Invalid Emails: ${invalidEmails.join(", ") || "None"}
        `;

    // Send log summary to the specific email
    await sendLogEmail(logSummary);

    // Respond with details of sent, invalid, and failed emails
    res.json({
      message: "Email process completed.",
      sentEmails: emails.filter((email) => !failedEmails.includes(email)),
      failedEmails,
      invalidEmails,
    });
  } catch (error) {
    console.error("Error processing emails:", error);
    res.status(500).json({
      message: "Error sending emails. Please try again later.",
    });
  }
});
