// Firebase Analytics
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";

const _app = initializeApp({
  apiKey: "AIzaSyBjdt19pD4M6GRW1y7mSpcZpIyxli2o2Gw",
  authDomain: "translation-27dd4.firebaseapp.com",
  projectId: "translation-27dd4",
  storageBucket: "translation-27dd4.firebasestorage.app",
  messagingSenderId: "1004418405091",
  appId: "1:1004418405091:web:c070939595061b4518ebd6",
  measurementId: "G-LD5BZPG78Z",
});
const analytics = getAnalytics(_app);

// 頁面瀏覽
logEvent(analytics, "page_view", {
  page_path: window.location.pathname,
});

function trackEvent(name, params) {
  logEvent(analytics, name, params);
}

const LANGUAGES = [
  { code: "auto",                   label: "自動偵測" },
  { code: "Chinese (Traditional)",  label: "繁體中文" },
  { code: "Chinese (Simplified)",   label: "簡體中文" },
  { code: "English",                label: "English" },
  { code: "Japanese",               label: "日本語" },
  { code: "Korean",                 label: "한국어" },
  { code: "Vietnamese",             label: "Tiếng Việt" },
  { code: "Thai",                   label: "ภาษาไทย" },
  { code: "Indonesian",             label: "Bahasa Indonesia" },
  { code: "Spanish",                label: "Español" },
  { code: "French",                 label: "Français" },
  { code: "German",                 label: "Deutsch" },
  { code: "Portuguese",             label: "Português" },
  { code: "Arabic",                 label: "العربية" },
  { code: "Hindi",                  label: "हिन्दी" },
];

const SPEECH_LANG = {
  "Chinese (Traditional)": "zh-TW",
  "Chinese (Simplified)":  "zh-CN",
  "Japanese":              "ja-JP",
  "Korean":                "ko-KR",
  "Vietnamese":            "vi-VN",
  "Thai":                  "th-TH",
  "Indonesian":            "id-ID",
  "Spanish":               "es-ES",
  "French":                "fr-FR",
  "German":                "de-DE",
  "Portuguese":            "pt-PT",
  "Arabic":                "ar-SA",
  "Hindi":                 "hi-IN",
  "English":               "en-US",
};

// Firebase Function endpoint
const TRANSLATE_URL = "https://translate-clpehucn2a-uc.a.run.app";

function buildTranslatorUI(container) {
  const defaultFrom = container.dataset.from || "auto";
  const defaultTo   = container.dataset.to   || "Chinese (Traditional)";

  container.innerHTML = `
    <div class="flex items-center gap-2 mb-3">
      <select id="sel-from" class="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"></select>
      <button id="btn-swap" title="交換語言" class="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-30 transition">
        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
        </svg>
      </button>
      <select id="sel-to" class="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"></select>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <textarea id="input-text" placeholder="輸入要翻譯的文字..." rows="8"
          class="w-full p-4 text-base resize-none focus:outline-none"></textarea>
        <div class="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
          <span id="input-count" class="text-xs text-gray-400">0 字</span>
          <div class="flex gap-2">
            <button id="btn-mic" title="語音輸入"
              class="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>
            <button id="btn-clear" title="清除"
              class="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="relative bg-blue-50 rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
        <div id="output-text" class="w-full p-4 text-base min-h-48 whitespace-pre-wrap text-gray-800">
          <span class="text-gray-400">翻譯結果</span>
        </div>
        <div class="flex items-center justify-between px-3 py-2 border-t border-blue-100 bg-blue-50">
          <span id="output-count" class="text-xs text-gray-400">0 字</span>
          <div id="output-actions" class="flex gap-2"></div>
        </div>
      </div>
    </div>

    <div class="mt-4 flex justify-center">
      <button id="btn-translate"
        class="px-10 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold rounded-full shadow-md transition text-sm">
        翻譯
      </button>
    </div>
  `;

  // Populate selects
  const selFrom = container.querySelector("#sel-from");
  const selTo   = container.querySelector("#sel-to");

  LANGUAGES.forEach(({ code, label }) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = label;
    if (code === defaultFrom) opt.selected = true;
    selFrom.appendChild(opt);
  });

  LANGUAGES.filter(l => l.code !== "auto").forEach(({ code, label }) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = label;
    if (code === defaultTo) opt.selected = true;
    selTo.appendChild(opt);
  });

  const inputEl    = container.querySelector("#input-text");
  const outputEl   = container.querySelector("#output-text");
  const inputCount = container.querySelector("#input-count");
  const outputCount= container.querySelector("#output-count");
  const btnSwap    = container.querySelector("#btn-swap");
  const btnMic     = container.querySelector("#btn-mic");
  const btnClear   = container.querySelector("#btn-clear");
  const btnTranslate = container.querySelector("#btn-translate");
  const outputActions = container.querySelector("#output-actions");

  let outputValue = "";

  function setOutput(text, isPlaceholder = false) {
    outputValue = isPlaceholder ? "" : text;
    outputEl.innerHTML = isPlaceholder
      ? `<span class="text-gray-400">${text}</span>`
      : "";
    if (!isPlaceholder) {
      outputEl.textContent = text;
    }
    outputCount.textContent = `${outputValue.length} 字`;
    renderOutputActions();
  }

  function renderOutputActions() {
    outputActions.innerHTML = "";
    if (!outputValue) return;

    const speakBtn = document.createElement("button");
    speakBtn.title = "朗讀";
    speakBtn.className = "p-2 rounded-full hover:bg-blue-200 text-blue-500 transition";
    speakBtn.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>`;
    speakBtn.onclick = () => {
      const utter = new SpeechSynthesisUtterance(outputValue);
      utter.lang = SPEECH_LANG[selTo.value] || "en-US";
      window.speechSynthesis.speak(utter);
    };

    const copyBtn = document.createElement("button");
    copyBtn.title = "複製";
    copyBtn.className = "p-2 rounded-full hover:bg-blue-200 text-blue-500 transition";
    copyBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`;
    copyBtn.onclick = () => navigator.clipboard.writeText(outputValue);

    outputActions.appendChild(speakBtn);
    outputActions.appendChild(copyBtn);
  }

  inputEl.addEventListener("input", () => {
    inputCount.textContent = `${inputEl.value.length} 字`;
  });

  async function doTranslate(text) {
    if (!text.trim()) return;
    btnTranslate.disabled = true;
    btnTranslate.textContent = "翻譯中...";
    setOutput("翻譯中...", true);

    trackEvent("translate", {
      from_lang: selFrom.value,
      to_lang: selTo.value,
      char_count: text.length,
    });

    try {
      const res = await fetch(TRANSLATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, from: selFrom.value, to: selTo.value }),
      });
      const data = await res.json();
      setOutput(data.translated || data.error || "翻譯失敗");
    } catch {
      setOutput("翻譯失敗，請稍後再試", true);
    } finally {
      btnTranslate.disabled = false;
      btnTranslate.textContent = "翻譯";
    }
  }

  btnTranslate.addEventListener("click", () => doTranslate(inputEl.value));

  btnSwap.addEventListener("click", () => {
    if (selFrom.value === "auto") return;
    const tmp = selFrom.value;
    selFrom.value = selTo.value;
    // sel-to has no "auto" option so this is safe
    selTo.value = tmp;
    const tmpText = inputEl.value;
    inputEl.value = outputValue;
    inputCount.textContent = `${inputEl.value.length} 字`;
    setOutput(tmpText || "翻譯結果", !tmpText);
  });

  btnClear.addEventListener("click", () => {
    inputEl.value = "";
    inputCount.textContent = "0 字";
    setOutput("翻譯結果", true);
  });

  btnMic.addEventListener("click", () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("你的瀏覽器不支援語音輸入"); return; }
    const recognition = new SR();
    recognition.lang = SPEECH_LANG[selFrom.value] || "zh-TW";
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      inputEl.value = text;
      inputCount.textContent = `${text.length} 字`;
      trackEvent("voice_input", { from_lang: selFrom.value });
      doTranslate(text);
    };
    btnMic.classList.add("text-red-500", "animate-pulse");
    recognition.onend = () => btnMic.classList.remove("text-red-500", "animate-pulse");
    recognition.start();
  });

  selFrom.addEventListener("change", () => {
    btnSwap.disabled = selFrom.value === "auto";
  });
  btnSwap.disabled = selFrom.value === "auto";
}

// Auto-init on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("translator");
  if (container) buildTranslatorUI(container);
});
