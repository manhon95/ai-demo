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

// Disable record button by default
recordBtn.disabled = true;

apiPrefixInput.addEventListener("input", () => {
  const value = apiPrefixInput.value.trim();
  // Google API keys are typically 39 characters (AIza...)
  if (value.length >= 30) {
    apiPrefixStatus.textContent = "";
    recordBtn.disabled = false;
  } else {
    apiPrefixStatus.textContent = "Enter valid Google API key.";
    recordBtn.disabled = true;
  }
});

const GOOGLE_SPEECH_URL = "https://speech.googleapis.com/v1/speech:recognize";

recordBtn.onclick = async () => {
  audioChunks = [];
  transcriptInput.value = "";
  statusDiv.textContent = "Recording...";
  recordBtn.disabled = true;
  stopBtn.disabled = false;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  // Try to use audio/wav if supported, else fallback to webm
  let options = { mimeType: "audio/wav" };
  if (!MediaRecorder.isTypeSupported("audio/wav")) {
    options = { mimeType: "audio/webm" };
  }
  mediaRecorder = new MediaRecorder(stream, options);
  mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
  mediaRecorder.onstop = async () => {
    statusDiv.textContent = "Processing audio...";
    const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
    try {
      const base64Audio = await blobToBase64(audioBlob);
      statusDiv.textContent = "Transcribing...";
      const transcript = await transcribeWithGoogle(
        base64Audio,
        mediaRecorder.mimeType
      );
      transcriptInput.value = transcript || "Transcription failed.";
      statusDiv.textContent = "Done.";
    } catch (e) {
      transcriptInput.value = "Audio processing failed.";
      statusDiv.textContent = "Audio processing failed.";
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

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove the data:...;base64, prefix
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function transcribeWithGoogle(base64Audio, mimeType) {
  // Determine encoding and sample rate
  let encoding = "WEBM_OPUS";
  let sampleRateHertz = 48000; // default for webm/opus
  if (mimeType === "audio/wav") {
    encoding = "LINEAR16";
    sampleRateHertz = 44100; // or 16000, but 44100 is common for wav
  }
  const apiKey = apiPrefixInput.value.trim();
  const body = {
    config: {
      encoding,
      sampleRateHertz,
      languageCode: "yue-Hant-HK", // Cantonese (Hong Kong)
      enableAutomaticPunctuation: true,
    },
    audio: {
      content: base64Audio,
    },
  };
  const url = `${GOOGLE_SPEECH_URL}?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) return null;
  const data = await response.json();
  if (data.results && data.results.length > 0) {
    return data.results.map((r) => r.alternatives[0].transcript).join("\n");
  }
  return null;
}
// ... existing code ...
