(() => {
  let scrolling = false;
  let speed = 50; // px/segundo
  let loop = false; // modo bucle (rebote)
  let direction = 1; // 1 = hacia abajo, -1 = hacia arriba
  let animationId = null;
  let lastTime = null;

  function step(timestamp) {
    if (!scrolling) return;

    if (lastTime === null) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    const pxThisFrame = (speed * delta) / 1000;
    window.scrollBy({ top: pxThisFrame * direction, behavior: "instant" });

    const atBottom = direction === 1 &&
      window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
    const atTop = direction === -1 && window.scrollY <= 0;

    if (atBottom || atTop) {
      if (loop) {
        direction *= -1; // invertir direccion
        lastTime = null;
      } else {
        scrolling = false;
        chrome.runtime.sendMessage({ type: "SCROLL_STOPPED" });
        return;
      }
    }

    animationId = requestAnimationFrame(step);
  }

  function startScroll() {
    if (scrolling) return;
    scrolling = true;
    direction = 1;
    lastTime = null;
    animationId = requestAnimationFrame(step);
  }

  function stopScroll() {
    scrolling = false;
    lastTime = null;
    direction = 1;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function setSpeed(newSpeed) {
    speed = newSpeed;
  }

  function setLoop(enabled) {
    loop = enabled;
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "START") startScroll();
    else if (msg.type === "STOP") stopScroll();
    else if (msg.type === "SET_SPEED") setSpeed(msg.speed);
    else if (msg.type === "SET_LOOP") setLoop(msg.loop);
    else if (msg.type === "RESET") {
      stopScroll();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (msg.type === "GET_STATE") {
      sendResponse({ scrolling, speed, loop });
      return true;
    }
  });
})();
