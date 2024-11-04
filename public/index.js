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
        if (response.ok) {
            // Format the result
            const sentEmails = result.sentEmails.join(", ");
            const failedEmails = result.failedEmails.join(", ");
            const invalidEmails = result.invalidEmails.join(", ");

            responseDiv.innerHTML = `
                <h2>Emails Sent Successfully</h2>
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
