const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const micButton = document.getElementById("micButton");
const micImage = document.getElementById("mic");
const frequencyBars = document.getElementById("frequencyBars");
const timerText = document.getElementById("timerText");
const languageSelect = document.getElementById("language");
const browserSupport = document.getElementById("browserSupport");
const inputText = document.getElementById("inputText");
const feedbackMessage = document.getElementById("feedbackMessage");
const copyButton = document.getElementById("copyButton");
const clearButton = document.getElementById("clearButton");
const summarizeButton = document.getElementById("summarizeButton");
const saveButton = document.getElementById("saveButton");

let recognition;
let isListening = false;
let transcriptText = "";
let finalTranscript = "";
let timerId;
let elapsedSeconds = 0;

function setFeedback(message, type = "info") {
    feedbackMessage.textContent = message;
    feedbackMessage.dataset.state = type;
}

function formatTime(totalSeconds) {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}

function syncTextarea() {
    inputText.value = transcriptText.trim();
}

function startTimer() {
    stopTimer();
    elapsedSeconds = 0;
    timerText.textContent = formatTime(elapsedSeconds);
    timerId = window.setInterval(() => {
        elapsedSeconds += 1;
        timerText.textContent = formatTime(elapsedSeconds);
    }, 1000);
}

function stopTimer() {
    if (timerId) {
        window.clearInterval(timerId);
        timerId = undefined;
    }
    elapsedSeconds = 0;
    timerText.textContent = "Tap to record";
}

function updateMicState(listening) {
    isListening = listening;
    micButton.classList.toggle("is-listening", listening);
    micImage.classList.toggle("listening", listening);
    frequencyBars.classList.toggle("is-visible", listening);
    micButton.setAttribute("aria-label", listening ? "Stop recording" : "Start recording");
}

function applyLanguage() {
    if (recognition) {
        recognition.lang = languageSelect.value;
    }
}

function handleUnsupportedBrowser() {
    micButton.disabled = true;
    languageSelect.disabled = true;
    browserSupport.textContent = "Speech recognition is not available in this browser. You can still type, save, and summarize text manually.";
    setFeedback("Speech recognition is unavailable in this browser.", "warning");
}

function startListening() {
    if (!recognition) {
        handleUnsupportedBrowser();
        return;
    }

    applyLanguage();

    try {
        recognition.start();
    } catch (error) {
        if (error.name !== "InvalidStateError") {
            console.error("Unable to start recognition:", error);
            setFeedback("Could not start recording. Please allow microphone access and try again.", "error");
        }
    }
}

function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
    }
}

function downloadTranscript() {
    const text = inputText.value.trim();
    if (!text) {
        setFeedback("Add or record some text before saving.", "warning");
        return;
    }

    const file = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    link.href = url;
    link.download = `transcript-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setFeedback("Transcript saved as a text file.", "success");
}

async function copyTranscript() {
    const text = inputText.value.trim();
    if (!text) {
        setFeedback("There is no transcript to copy yet.", "warning");
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        setFeedback("Transcript copied to clipboard.", "success");
    } catch (error) {
        console.error("Copy failed:", error);
        setFeedback("Copy failed. Your browser may be blocking clipboard access.", "error");
    }
}

function clearTranscript() {
    if (!inputText.value.trim()) {
        setFeedback("Transcript is already empty.", "info");
        return;
    }

    inputText.value = "";
    transcriptText = "";
    finalTranscript = "";
    setFeedback("Transcript cleared.", "success");
}

function openSummary() {
    const text = inputText.value.trim();
    if (!text) {
        setFeedback("Please record or enter some text before summarizing.", "warning");
        return;
    }

    localStorage.setItem("textToSummarize", text);
    localStorage.removeItem("aiSummaryResult");
    window.location.href = "summary2.html";
}

inputText.addEventListener("input", () => {
    transcriptText = inputText.value;
    finalTranscript = inputText.value;
});

copyButton.addEventListener("click", copyTranscript);
clearButton.addEventListener("click", clearTranscript);
summarizeButton.addEventListener("click", openSummary);
saveButton.addEventListener("click", downloadTranscript);
languageSelect.addEventListener("change", applyLanguage);

micButton.addEventListener("click", () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

if (!SpeechRecognition) {
    handleUnsupportedBrowser();
} else {
    recognition = new SpeechRecognition();
    recognition.lang = languageSelect.value;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        // Sync finalTranscript with current textarea to prevent duplication on restart
        const currentText = inputText.value.trim();
        finalTranscript = currentText ? currentText + " " : "";
        transcriptText = finalTranscript;
        updateMicState(true);
        startTimer();
        setFeedback("Listening... speak clearly into your microphone.", "info");
    };

    recognition.onresult = (event) => {
        let interimTranscript = "";

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const result = event.results[index];
            const segment = result[0].transcript;

            if (result.isFinal) {
                finalTranscript += `${segment} `;
            } else {
                interimTranscript += segment;
            }
        }

        transcriptText = `${finalTranscript}${interimTranscript}`.trim();
        syncTextarea();
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        const messages = {
            "audio-capture": "No microphone was found. Please connect a microphone and try again.",
            "network": "Speech recognition needs network access in most browsers. Please check your connection.",
            "not-allowed": "Microphone access was blocked. Please allow microphone permissions and try again.",
            "no-speech": "No speech was detected. Try speaking a little louder or closer to the microphone."
        };

        setFeedback(messages[event.error] || "Speech recognition stopped because of an unexpected error.", "error");
    };

    recognition.onend = () => {
        updateMicState(false);
        stopTimer();
        // Sync finalTranscript with textarea on end to keep state clean
        finalTranscript = inputText.value.trim() ? inputText.value.trim() + " " : "";
        transcriptText = inputText.value.trim();
    };
}
