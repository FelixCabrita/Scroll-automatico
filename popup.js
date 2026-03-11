const toggleBtn = document.getElementById("toggleBtn");
const speedSlider = document.getElementById("speedSlider");
const speedVal = document.getElementById("speedVal");
const resetBtn = document.getElementById("resetBtn");
const slowBtn = document.getElementById("slowBtn");
const fastBtn = document.getElementById("fastBtn");
const loopToggle = document.getElementById("loopToggle");
const title = document.getElementById("title");

let isRunning = false;

async function getTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendMsg(msg) {
  const tab = await getTab();
  try {
    return await chrome.tabs.sendMessage(tab.id, msg);
  } catch (_) {
    // content script no inyectado aun; inyectar manualmente
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    return await chrome.tabs.sendMessage(tab.id, msg);
  }
}

function setUI(running) {
  isRunning = running;
  if (running) {
    toggleBtn.textContent = "⏸ Pausar";
    toggleBtn.classList.add("running");
    title.classList.add("active");
  } else {
    toggleBtn.textContent = "▶ Iniciar";
    toggleBtn.classList.remove("running");
    title.classList.remove("active");
  }
}

// Leer estado actual al abrir el popup
(async () => {
  try {
    const state = await sendMsg({ type: "GET_STATE" });
    if (state) {
      setUI(state.scrolling);
      speedSlider.value = state.speed;
      speedVal.textContent = state.speed;
      loopToggle.checked = state.loop;
    }
  } catch (_) {}
})();

toggleBtn.addEventListener("click", async () => {
  if (isRunning) {
    await sendMsg({ type: "STOP" });
    setUI(false);
  } else {
    await sendMsg({ type: "SET_SPEED", speed: Number(speedSlider.value) });
    await sendMsg({ type: "START" });
    setUI(true);
  }
});

speedSlider.addEventListener("input", async () => {
  const v = Number(speedSlider.value);
  speedVal.textContent = v;
  await sendMsg({ type: "SET_SPEED", speed: v });
});

resetBtn.addEventListener("click", async () => {
  await sendMsg({ type: "RESET" });
  setUI(false);
});

slowBtn.addEventListener("click", () => {
  speedSlider.value = Math.max(5, Number(speedSlider.value) - 10);
  speedSlider.dispatchEvent(new Event("input"));
});

fastBtn.addEventListener("click", () => {
  speedSlider.value = Math.min(300, Number(speedSlider.value) + 10);
  speedSlider.dispatchEvent(new Event("input"));
});

loopToggle.addEventListener("change", async () => {
  await sendMsg({ type: "SET_LOOP", loop: loopToggle.checked });
});

// Escuchar cuando el scroll llega al fondo
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SCROLL_STOPPED") setUI(false);
});
