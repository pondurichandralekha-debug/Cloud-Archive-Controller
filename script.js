

const LAMBDA_URL = "https://mfqsohwrfthtdgiylytugympqu0bpwje.lambda-url.us-east-1.on.aws/";

let selectedFile = null;
let isArchiving = false;

// Allowed filenames — must match your Lambda Python code
const allowedFiles = [
    "report_2024.pdf",
    "backup_old.zip",
    "student_data.csv"
];

// Select a file
function selectFile(card, fileName) {
    if (isArchiving) return;

    if (!allowedFiles.includes(fileName)) {
        showStatus("❌", "Invalid File", "This file is not allowed.");
        return;
    }

    document.querySelectorAll(".file-card").forEach((item) => {
        item.classList.remove("selected");
    });

    card.classList.add("selected");
    selectedFile = fileName;

    showStatus(
        "📄",
        "File Selected",
        fileName + " is ready to be archived."
    );
}

// Update status panel
function showStatus(icon, title, message) {
    document.getElementById("statusIcon").textContent = icon;
    document.getElementById("statusTitle").textContent = title;
    document.getElementById("statusMessage").textContent = message;
}

// Archive the selected file in S3 using Lambda
async function archiveFile() {
    if (isArchiving) return;

    if (!selectedFile) {
        showStatus("⚠️", "Select a File", "Please select a file first.");
        return;
    }

    if (LAMBDA_URL === "YOUR_LAMBDA_FUNCTION_URL") {
        showStatus(
            "⚠️",
            "URL Missing",
            "Please add your Lambda Function URL in script.js."
        );
        return;
    }

    const button = document.querySelector(".archive-btn");
    const fileBeingArchived = selectedFile;

    try {
        isArchiving = true;
        if (button) button.disabled = true;

        showStatus("⏳", "Archiving...", "Processing " + fileBeingArchived);

        const response = await fetch(LAMBDA_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                filename: fileBeingArchived
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Archive operation failed.");
        }

        showStatus(
            "✅",
            "Archive Successful",
            result.message || fileBeingArchived + " archived successfully."
        );

        // Remove archived file from the visible dashboard
        document.querySelectorAll(".file-card").forEach((card) => {
            const heading = card.querySelector("h3");

            if (heading && heading.textContent.trim() === fileBeingArchived) {
                card.remove();
            }
        });

        selectedFile = null;

        // Update visible file count
        const count = document.querySelectorAll(".file-card").length;
        const countLabel = document.querySelector(".file-count");

        if (countLabel) {
            countLabel.textContent = count + " Files";
        }

        // Activate virtual buzzer
        const buzzerLight = document.getElementById("buzzerLight");
        const buzzerText = document.getElementById("buzzerText");

        if (buzzerLight) buzzerLight.classList.add("active");
        if (buzzerText) buzzerText.textContent = "🔔 Archive confirmed!";

        playBuzzer();

        setTimeout(() => {
            if (buzzerLight) buzzerLight.classList.remove("active");
            if (buzzerText) {
                buzzerText.textContent = "Waiting for archive action";
            }
        }, 2000);

    } catch (error) {
        console.error("Archive error:", error);

        showStatus(
            "❌",
            "Archive Failed",
            error.message || "Unable to connect to AWS Lambda."
        );

    } finally {
        isArchiving = false;
        if (button) button.disabled = false;
    }
}

// Play a short confirmation sound
function playBuzzer() {
    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        const audio = new AudioContextClass();
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();

        oscillator.type = "square";
        oscillator.frequency.value = 800;
        gain.gain.value = 0.08;

        oscillator.connect(gain);
        gain.connect(audio.destination);

        oscillator.onended = () => audio.close();

        oscillator.start();
        oscillator.stop(audio.currentTime + 0.25);
    } catch (error) {
        console.warn("Buzzer sound unavailable:", error);
    }
}
