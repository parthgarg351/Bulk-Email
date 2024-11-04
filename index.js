require("dotenv").config();
const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const xlsx = require("xlsx");
const path = require("path");

const app = express();
const upload = multer(); // multer to handle file uploads

// Set up static file serving for the frontend
app.use(express.static(path.join(__dirname, "public")));

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

// Route to handle email sending
app.post("/send-emails", upload.single("emailFile"), async (req, res) => {
  try {
    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
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
    const failedEmails = []; // Collect emails that failed to send

    // Send emails
    for (const email of emails) {
      const name = extractNameFromEmail(email);
      const personalizedSubject = `Hello ${name}, ${subject}`;
      const personalizedMessage = `Hi ${name},\n\n${message}`;

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: personalizedSubject,
          text: personalizedMessage, // Use personalized message
        });
        console.log(`Email sent to: ${email}`);
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        failedEmails.push(email);
      }
    }

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

// Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});