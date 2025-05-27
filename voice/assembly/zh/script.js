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

const TRIMMED_KEY = "2841c64df4a6a21b2480cf97fc";

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

const BASE_URL = "https://api.assemblyai.com/v2";

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
    const audioUrl = await uploadAudio(audioBlob);
    if (audioUrl) {
      statusDiv.textContent = "Transcribing...";
      const transcript = await transcribeAudio(audioUrl);
      transcriptInput.value = transcript || "Transcription failed.";
      statusDiv.textContent = "Done.";
    } else {
      transcriptInput.value = "Upload failed.";
      statusDiv.textContent = "Upload failed.";
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

async function uploadAudio(blob) {
  const response = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: {
      authorization: apiPrefixInput.value.trim() + TRIMMED_KEY,
    },
    body: blob,
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.upload_url;
}

async function transcribeAudio(audioUrl) {
  // Start transcription
  const response = await fetch(`${BASE_URL}/transcript`, {
    method: "POST",
    headers: {
      authorization: apiPrefixInput.value.trim() + TRIMMED_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      language_code: "zh",
      speech_model: "universal",
    }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  const transcriptId = data.id;
  // Poll for result
  let status = "";
  let text = "";
  for (let i = 0; i < 30; i++) {
    // up to ~1.5 min
    await new Promise((r) => setTimeout(r, 3000));
    const pollRes = await fetch(`${BASE_URL}/transcript/${transcriptId}`, {
      headers: {
        authorization: apiPrefixInput.value.trim() + TRIMMED_KEY,
      },
    });
    const pollData = await pollRes.json();
    status = pollData.status;
    if (status === "completed") {
      text = pollData.text;
      break;
    } else if (status === "error") {
      text = null;
      break;
    }
    statusDiv.textContent = `Transcribing... (${status})`;
  }
  return text;
}
// ... existing code ...
