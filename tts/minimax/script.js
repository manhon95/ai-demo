document.getElementById("tts_btn").onclick = async function () {
  const group_id = "1929081091403026442";
  const api_key =
    document.getElementById("api_key").value.trim() +
    "ciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiLmtbfonrrnlKjmiLdfMzg1NDk1OTI2MDk3NTA2MzEwIiwiVXNlck5hbWUiOiLmtbfonrrnlKjmiLdfMzg1NDk1OTI2MDk3NTA2MzEwIiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE5MjkwODEwOTE0MTE0MTUwNTAiLCJQaG9uZSI6IjEzMTEyNjQ1NzUwIiwiR3JvdXBJRCI6IjE5MjkwODEwOTE0MDMwMjY0NDIiLCJQYWdlTmFtZSI6IiIsIk1haWwiOiJhaXBsYXRmb3JtLmxpcGluZ0BnbWFpbC5jb20iLCJDcmVhdGVUaW1lIjoiMjAyNS0wNi0wNiAwMToyNToxMiIsIlRva2VuVHlwZSI6MSwiaXNzIjoibWluaW1heCJ9.xTzUm110OR556YrIRKkC_fwS2mo0jYBMMM-8gQ-tSIMPQPgT021Btv_-IJJ3rB7J7tRqeyoah7zmww_fy6-PrrRS4gN-vc0Xb5qn_nVj8TvlK3i1H7c1xVCKsqyECaokzn53RPHkEXXB8AXcWZfnWLE4rteTfCDQLt81oODuZCP6s5eR5muSiAGTvgawyklnu9vQaCB2wJpy9Bs4XcFQ_CvtuNl0-zSvSrVlzZkFaYPKIVGQ7lznfOXa0JTpuWwv4JZu2rVYGgrIgkCNq_Z3Xt5HpgiYVNrPNcS9fHmCT7oamXXA1ejXbXbhOGlqebnUqjs6mqrhTKBm2cLIWT3flQ";
  const text = document.getElementById("tts_text").value.trim();
  const model = document.getElementById("model").value;
  const voice_id = document.getElementById("voice_id").value;
  const speed = parseFloat(document.getElementById("speed").value);
  const pitch = parseInt(document.getElementById("pitch").value, 10);
  const vol = parseFloat(document.getElementById("vol").value);
  const language_boost = document.getElementById("language").value;
  const statusDiv = document.getElementById("tts_status");
  const audioElem = document.getElementById("tts_audio");
  const downloadLink = document.getElementById("download_link");

  statusDiv.textContent = "";
  audioElem.style.display = "none";
  downloadLink.style.display = "none";

  if (!group_id || !api_key || !text) {
    statusDiv.textContent = "請填寫所有必需欄位。";
    return;
  }

  const requestBody = {
    model,
    text,
    voice_setting: {
      voice_id,
      speed,
      pitch,
      vol,
      latex_read: false,
    },
    audio_setting: {
      sample_rate: 32000,
      bitrate: 128000,
      format: "mp3",
    },
    language_boost,
  };

  statusDiv.textContent = "正在生成語音...";

  try {
    const response = await fetch(
      `https://api.minimax.chat/v1/t2a_v2?GroupId=${encodeURIComponent(
        group_id
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${api_key}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      statusDiv.textContent = `API 錯誤: ${response.status} ${
        err.message || ""
      }`;
      return;
    }

    const data = await response.json();
    if (!data || !data.data || !data.data.audio) {
      statusDiv.textContent = "API 回應無語音數據。";
      return;
    }

    // The API returns a hex string for the audio
    const audioHex = data.data.audio;
    const audioBlob = hexToBlob(audioHex, "audio/mp3");
    const audioUrl = URL.createObjectURL(audioBlob);
    audioElem.src = audioUrl;
    audioElem.style.display = "";
    downloadLink.href = audioUrl;
    downloadLink.style.display = "";
    statusDiv.textContent = "語音生成成功！";
  } catch (e) {
    statusDiv.textContent = "請求失敗: " + e.message;
  }
};

function hexToBlob(hex, mime) {
  // Remove any non-hex characters (just in case)
  hex = hex.replace(/[^0-9a-fA-F]/g, "");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return new Blob([bytes], { type: mime });
}
