// Remove Node.js imports and use browser APIs
// ... existing code ...
const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");
const transcriptInput = document.getElementById("transcript");
const statusDiv = document.getElementById("status");
const apiPrefixInput = document.getElementById("apiPrefix");
const apiPrefixStatus = document.getElementById("apiPrefixStatus");

let mediaRecorder;
let audioChunks = [];

const TRIMMED_KEY = "mJKOjBvDdqpAWW4jdrUR2OOGtzZmxkT7J0cFYsv8GLvMW";

// Disable record button by default
recordBtn.disabled = true;

apiPrefixInput.addEventListener("input", () => {
  const value = apiPrefixInput.value.trim();
  if (value.length === 6) {
    recordBtn.disabled = false;
  } else {
    apiPrefixStatus.textContent = "Enter 6 characters.";
    recordBtn.disabled = true;
  }
});

const BASE_URL = "https://api.tu-zi.com/v1/audio/transcriptions";

recordBtn.onclick = async () => {
  audioChunks = [];
  transcriptInput.value = "";
  statusDiv.textContent = "Recording...";
  recordBtn.disabled = true;
  stopBtn.disabled = false;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
  mediaRecorder.onstop = async () => {
    statusDiv.textContent = "Uploading audio...";
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const transcript = await transcribeWithWhisper(audioBlob);
    if (transcript) {
      transcriptInput.value = transcript;
      statusDiv.textContent = "Done.";
    } else {
      transcriptInput.value = "Transcription failed.";
      statusDiv.textContent = "Transcription failed.";
    }
    recordBtn.disabled = false;
    stopBtn.disabled = true;
  };
  mediaRecorder.start();
};

stopBtn.onclick = () => {
  statusDiv.textContent = "Stopping...";
  mediaRecorder.stop();
  recordBtn.disabled = false;
  stopBtn.disabled = true;
};

async function transcribeWithWhisper(audioBlob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-1");
  formData.append("language", "cantonese");
  // You can add 'language' param if you want to force a language, e.g. formData.append('language', 'en');
  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiPrefixInput.value.trim() + TRIMMED_KEY,
      },
      body: formData,
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.text;
  } catch (e) {
    return null;
  }
}
// ... existing code ...
