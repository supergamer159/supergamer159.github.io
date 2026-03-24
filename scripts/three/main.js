import { ThreeRuntime } from "./runtime.js";

function bootThreeRuntime() {
  const root = document.getElementById("three-root");
  const bridge = window.Inscryption3DBridge;
  if (!root || !bridge) return;
  const runtime = new ThreeRuntime({ root, bridge });
  runtime.init();
  window.InscryptionThreeRuntime = runtime;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootThreeRuntime, { once: true });
} else {
  bootThreeRuntime();
}
