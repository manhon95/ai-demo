document.getElementById("testBtn").addEventListener("click", function () {
  // Show loading
  const loading = document.getElementById("loading1");
  const btn = document.getElementById("testBtn");
  loading.classList.remove("hidden");
  btn.disabled = true;
  // Get token from input
  const token = document.getElementById("apiTokenInput").value.trim();
  if (!token) {
    alert("Please enter your API token first.");
    loading.classList.add("hidden");
    btn.disabled = false;
    return;
  }
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      stream: true,
      model: "gpt-4o-mini",
      messages: [
        {
          content:
            "問：你是一個口語考試練習助手，專門為教師生成「情境描述文本」和「對應的圖片生成提示詞」。請根據用戶提供的情境主題和語言，執行以下步驟：1. **生成情境文本**：- 語言：{{用戶指定的語言（如中文）}}- 內容：一段3-5 句的簡潔情境描述，適合學生口語練習（如描述場景、情緒、動作）。- 場景格數：一張圖片內生成四格漫畫，人物角色需要連貫。- 範例（中文）：> '你被困在電梯裡，燈光忽明忽暗，空氣悶熱。你聽到外面有模糊的說話聲，但按緊急按鈕後無人回應。你感到有些慌張，開始思考下一步該怎麼辦。'2. **生成圖片提示詞**：- 格式：美文，清晰描述場景關鍵元素（適合Stable Diffusion）。- 包含：場景、主體、風格、光影等細節。- 範例：> 'A person trapped in a dimly lit elevator, flickering lights, tense atmosphere, realistic style,muted colors, close-up view showing anxious expression, highly detailed.'3. **輸出格式**：- 嚴格按照以下JSON 格式回應，方便後續程式解析：```json{'text': '生成的情境文本','image_prompt': '生成的圖片提示詞'}```",
          role: "system",
        },
        {
          content: [
            {
              type: "text",
              text:
                document.getElementById("promptInput").value.trim() ||
                "以用以下兩張圖片作人物藍本，生成『我曾參與一次活動，當中的經歷令我覺醒過來，明白到『己所不欲，勿施於人』這道理』的漫畫",
            },
            {
              type: "image_url",
              image_url: {
                url: "https://manhon95.github.io/ai-demo/assets/sample_boy.jpg",
              },
            },
            {
              type: "image_url",
              image_url: {
                url: "https://manhon95.github.io/ai-demo/assets/sample_girl.jpg",
              },
            },
          ],
          role: "user",
        },
      ],
    }),
  };
  fetch("https://api.tu-zi.com/v1/chat/completions", requestOptions)
    .then((response) => response.body)
    .then((rb) => {
      const reader = rb.getReader();

      return new ReadableStream({
        start(controller) {
          // The following function handles each data chunk
          function push() {
            // "done" is a Boolean and value a "Uint8Array"
            reader.read().then(({ done, value }) => {
              // If there is no more data to read
              if (done) {
                console.log("done", done);
                controller.close();
                return;
              }
              // Get the data and send it to the browser via the controller
              controller.enqueue(value);
              // Decode the chunk to string and log it
              const chunkStr = new TextDecoder("utf-8").decode(value);
              const chunkArray = chunkStr.split("\n\n");
              console.log(chunkArray);
              for (const chunkItem of chunkArray) {
                if (
                  !chunkItem ||
                  chunkItem === "" ||
                  chunkItem === "data: [DONE]"
                )
                  continue;
                const chunkJson = JSON.parse(chunkItem.slice(6));
                const content = chunkJson.choices[0].delta.content;
                console.log(content);
                // Find or create the textarea
                let textarea = document.getElementById("streamedContent");
                if (!textarea) {
                  textarea = document.createElement("textarea");
                  textarea.id = "streamedContent";
                  textarea.className = "w-full mt-4 p-2 border rounded";
                  textarea.rows = 10;
                  document.body.appendChild(textarea);
                }
                // Append the new content
                if (content) textarea.value += content;
              }
              push();
            });
          }

          push();
        },
      });
    })
    .then((stream) =>
      // Respond with our stream
      new Response(stream, { headers: { "Content-Type": "text/html" } }).text()
    )
    .then((result) => {
      // Do things with result
      console.log(result);
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      loading.classList.add("hidden");
      btn.disabled = false;
    });
});

document.getElementById("testBtn2").addEventListener("click", function () {
  // Show loading
  const loading = document.getElementById("loading2");
  const btn = document.getElementById("testBtn2");
  loading.classList.remove("hidden");
  btn.disabled = true;
  // Get token from input
  const token = document.getElementById("apiTokenInput").value.trim();
  if (!token) {
    alert("Please enter your API token first.");
    loading.classList.add("hidden");
    btn.disabled = false;
    return;
  }
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-image-vip",
      prompt:
        document.getElementById("promptInput").value.trim() ||
        "請根據以下描述繪畫一張4格漫畫，「我曾參與一次活動，當中的經歷令我覺醒過來，明白到『己所不欲，勿施於人』這道理。」",
      n: 1,
      size: "1024x1024",
    }),
  };
  fetch("https://api.tu-zi.com/v1/images/generations", requestOptions)
    .then((response) => response.body)
    .then((rb) => {
      const reader = rb.getReader();

      return new ReadableStream({
        start(controller) {
          // The following function handles each data chunk
          function push() {
            // "done" is a Boolean and value a "Uint8Array"
            reader.read().then(({ done, value }) => {
              // If there is no more data to read
              if (done) {
                console.log("done", done);
                controller.close();
                return;
              }
              // Get the data and send it to the browser via the controller
              controller.enqueue(value);
              push();
            });
          }

          push();
        },
      });
    })
    .then((stream) =>
      // Respond with our stream
      new Response(stream, { headers: { "Content-Type": "text/html" } }).json()
    )
    .then((result) => {
      // Do things with result
      const img = document.getElementById("target");
      img.src = result.data[0].url;
      if (img.src) {
        img.style.display = "";
      } else {
        img.style.display = "none";
      }
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      loading.classList.add("hidden");
      btn.disabled = false;
    });
});
