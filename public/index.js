// Establish WebSocket connection
const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("message", function(event) {
    const logDiv = document.getElementById("log");
    logDiv.innerHTML += `<div>${event.data}</div>`; // Append log messages
});

document.getElementById("emailForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value;
    const emailFile = document.getElementById("emailFile").files[0];

    // Check if file is selected
    if (!emailFile) {
        alert("Please upload an Excel file with emails.");
        return;
    }

    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("message", message);
    formData.append("emailFile", emailFile);

    try {
        // Send the request to the server
        const response = await fetch("/send-emails", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        // Display the response in the 'response' div
        const responseDiv = document.getElementById("response");
        const progressDiv = document.getElementById("progress");

        if (response.ok) {
            // Total emails count
            const totalEmails = result.sentEmails.length + result.failedEmails.length + result.invalidEmails.length;
            let emailsSent = 0;

            // Simulate sending each email for progress update
            for (const email of result.sentEmails) {
                emailsSent++;
                // Update the progress message
                progressDiv.innerHTML = `Sending... ${emailsSent} of ${totalEmails} emails sent.`;
                await new Promise(resolve => setTimeout(resolve, 500)); // Simulate sending delay
            }

            // Clear progress message after sending all emails
            progressDiv.innerHTML = "";

            // Display final results
            const sentEmails = result.sentEmails.join(", ");
            const failedEmails = result.failedEmails.join(", ");
            const invalidEmails = result.invalidEmails.join(", ");

            responseDiv.innerHTML = `
                <h2>Emails Process Completed</h2>
                <p><strong>Sent Emails:</strong> ${sentEmails}</p>
                <p><strong>Failed Emails:</strong> ${failedEmails.length > 0 ? failedEmails : "None"}</p>
                <p><strong>Invalid Emails:</strong> ${invalidEmails.length > 0 ? invalidEmails : "None"}</p>
            `;
            responseDiv.style.color = "green";
        } else {
            // Display error message
            responseDiv.innerHTML = `<p>Error: ${result.message}</p>`;
            responseDiv.style.color = "red";
        }
    } catch (error) {
        console.error("Error sending emails:", error);
        const responseDiv = document.getElementById("response");
        responseDiv.innerHTML = "<p>Error sending emails. Please try again later.</p>";
        responseDiv.style.color = "red";
    }
});
