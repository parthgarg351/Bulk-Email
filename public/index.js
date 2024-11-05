document.getElementById("emailForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value;
    const emailFile = document.getElementById("emailFile").files[0];
    const attachments = document.getElementById("attachments").files; // Get attachments

    if (!emailFile) {
        alert("Please upload an Excel file with emails.");
        return;
    }

    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("message", message);
    formData.append("emailFile", emailFile);

    // Append each attachment to formData
    Array.from(attachments).forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
    });

    try {
        const response = await fetch("/send-emails", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();
        const responseDiv = document.getElementById("response");
        const progressDiv = document.getElementById("progress");

        if (response.ok) {
            const totalEmails = result.sentEmails.length + result.failedEmails.length + result.invalidEmails.length;
            let emailsSent = 0;

            for (const email of result.sentEmails) {
                emailsSent++;
                progressDiv.innerHTML = `Sending... ${emailsSent} of ${totalEmails} emails sent.`;
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            progressDiv.innerHTML = "";
            responseDiv.innerHTML = `
                <h2>Emails Process Completed</h2>
                <p><strong>Sent Emails:</strong> ${result.sentEmails.join(", ")}</p>
                <p><strong>Failed Emails:</strong> ${result.failedEmails.length > 0 ? result.failedEmails.join(", ") : "None"}</p>
                <p><strong>Invalid Emails:</strong> ${result.invalidEmails.length > 0 ? result.invalidEmails.join(", ") : "None"}</p>
            `;
            responseDiv.style.color = "green";
        } else {
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
