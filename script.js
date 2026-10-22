"use strict";

const wizard = document.querySelector("#wizard");
const character = document.querySelector("#character");
const head = document.querySelector("#head");
const pupils = document.querySelector("#pupils");
const button = document.querySelector("#spell-button");
const message = document.querySelector("#spell-message");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const target = { x: 0, y: 0, rotation: 0, pupilX: 0, pupilY: 0 };
const current = { ...target };

let frameId = null;
let lastTime = 0;
let spellTimer;
let spellIndex = 0;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Calculate direction and distance in the SVG's coordinate system.
function trackCursor(event) {
  if (event.pointerType === "touch") return;

  const matrix = wizard.getScreenCTM();
  if (!matrix) return;

  const cursor = new DOMPoint(event.clientX, event.clientY)
    .matrixTransform(matrix.inverse());

  const dx = cursor.x - 180;
  const dy = cursor.y - 195;
  const angle = Math.atan2(dy, dx);
  const distance = Math.hypot(dx, dy);
  const strength = clamp(distance / 180, 0, 1);

  const horizontal = Math.cos(angle) * strength;
  const vertical = Math.sin(angle) * strength;

  target.x = horizontal * 5;
  target.y = vertical * 3;
  target.rotation = horizontal * 7;
  target.pupilX = horizontal * 5;
  target.pupilY = vertical * 5;

  scheduleFrame();
}

// Return to a relaxed pose when the pointer or window leaves.
function resetPose() {
  for (const key of Object.keys(target)) target[key] = 0;
  scheduleFrame();
}

function scheduleFrame() {
  if (frameId !== null) return;
  lastTime = 0;
  frameId = requestAnimationFrame(animate);
}

// Time-based easing keeps movement smooth across refresh rates.
function animate(time) {
  const delta = lastTime ? Math.min(time - lastTime, 50) : 16.67;
  lastTime = time;

  const easing = reducedMotion.matches ? 1 : 1 - Math.exp(-delta / 95);
  let moving = false;

  for (const key of Object.keys(current)) {
    current[key] += (target[key] - current[key]) * easing;

    if (Math.abs(target[key] - current[key]) < 0.005) {
      current[key] = target[key];
    } else {
      moving = true;
    }
  }

  head.setAttribute(
    "transform",
    `translate(${current.x} ${current.y}) rotate(${current.rotation} 180 195)`
  );
  pupils.setAttribute(
    "transform",
    `translate(${current.pupilX} ${current.pupilY})`
  );

  frameId = moving ? requestAnimationFrame(animate) : null;
}

window.addEventListener("pointermove", trackCursor, { passive: true });
document.documentElement.addEventListener("pointerleave", resetPose);
window.addEventListener("pointercancel", resetPose);
window.addEventListener("blur", resetPose);
window.addEventListener("resize", resetPose);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) resetPose();
});

// A tiny spell, available by mouse, keyboard, or touch.
const spells = [
  "✦ Poof! A little extra courage for your next adventure.",
  "✦ One pocket-sized moment of happiness, just for you.",
  "✦ Your kindness has been enchanted. Pass it on.",
  "✦ A tiny reminder: you’re allowed to start small."
];

button.addEventListener("click", () => {
  message.textContent = spells[spellIndex];
  spellIndex = (spellIndex + 1) % spells.length;

  clearTimeout(spellTimer);
  character.classList.remove("casting");
  void character.getBoundingClientRect(); // Restart the sparkle animation.
  character.classList.add("casting");

  spellTimer = setTimeout(() => {
    character.classList.remove("casting");
  }, 1100);
});