// Configuration du mode Madame
const config = {
  maxHearts: 30,
  heartColors: ["#ff69b4", "#ff1493", "#ff69b4"],
  heartSizes: {
    min: 15,
    max: 30,
  },
  heartOpacity: {
    min: 0.2,
    max: 0.6,
  },
  animationDuration: {
    min: 3,
    max: 6,
  },
  explosionParticles: 8,
  explosionDistance: 100,
};

// État du mode Madame
const state = {
  isActive: localStorage.getItem("madameMode") === "true",
  activeHearts: 0,
  cursorHeart: null,
  heartInterval: null,
};

// Création du cœur du curseur
function createCursorHeart() {
  const heart = document.createElement("div");
  heart.className = "cursor-heart";
  heart.innerHTML = "❤";
  heart.style.display = "none";
  document.body.appendChild(heart);
  return heart;
}

// Création d'un cœur avec des propriétés aléatoires
function createHeart(x, y) {
  const heart = document.createElement("div");
  heart.className = "floating-heart";
  heart.innerHTML = "❤";
  heart.style.position = "fixed";
  heart.style.color =
    config.heartColors[Math.floor(Math.random() * config.heartColors.length)];
  heart.style.fontSize = `${
    Math.random() * (config.heartSizes.max - config.heartSizes.min) +
    config.heartSizes.min
  }px`;
  heart.style.opacity =
    Math.random() * (config.heartOpacity.max - config.heartOpacity.min) +
    config.heartOpacity.min;
  heart.style.pointerEvents = "none";

  if (x && y) {
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
  } else {
    heart.style.left = `${Math.random() * window.innerWidth}px`;
    heart.style.top = `${Math.random() * window.innerHeight}px`;
  }

  const duration =
    Math.random() *
      (config.animationDuration.max - config.animationDuration.min) +
    config.animationDuration.min;
  const delay = Math.random() * 2;
  heart.style.animation = `float ${duration}s infinite`;
  heart.style.animationDelay = `${delay}s`;

  return heart;
}

// Création des particules d'explosion
function createExplosionParticles(heart) {
  for (let i = 0; i < config.explosionParticles; i++) {
    const particle = document.createElement("div");
    particle.innerHTML = "❤";
    particle.style.position = "fixed";
    particle.style.color =
      config.heartColors[Math.floor(Math.random() * config.heartColors.length)];
    particle.style.fontSize = "12px";
    particle.style.opacity = "0.8";
    particle.style.pointerEvents = "none";
    particle.style.left = heart.style.left;
    particle.style.top = heart.style.top;

    const angle = (i / config.explosionParticles) * Math.PI * 2;
    const x = Math.cos(angle) * config.explosionDistance;
    const y = Math.sin(angle) * config.explosionDistance;

    particle.style.animation = `explode 0.5s ease-out forwards`;
    particle.style.setProperty("--x", `${x}px`);
    particle.style.setProperty("--y", `${y}px`);

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 500);
  }
}

// Explosion d'un cœur
function explodeHeart(heart) {
  createExplosionParticles(heart);
  heart.remove();
}

// Création de cœurs flottants
function createFloatingHearts() {
  const hearts = Array.from(document.querySelectorAll(".floating-heart"));

  if (hearts.length >= config.maxHearts) {
    // Calculer combien de cœurs sont en trop
    const heartsToRemove = hearts.length - config.maxHearts;

    // Mélanger le tableau des cœurs
    for (let i = hearts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hearts[i], hearts[j]] = [hearts[j], hearts[i]];
    }

    // Supprimer les cœurs en trop
    for (let i = 0; i < heartsToRemove; i++) {
      explodeHeart(hearts[i]);
      state.activeHearts--;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (state.activeHearts >= config.maxHearts) break;

    const heart = createHeart();
    document.body.appendChild(heart);
    state.activeHearts++;

    heart.addEventListener("animationend", () => {
      heart.remove();
      state.activeHearts--;
      if (state.isActive) {
        createFloatingHearts();
      }
    });
  }
}

// Création de cœurs au clic
function createClickHearts(e) {
  if (!state.isActive) return;

  // Cœur principal au point de clic
  const mainHeart = createHeart(e.clientX, e.clientY);
  document.body.appendChild(mainHeart);
  state.activeHearts++;

  // Cœurs supplémentaires dans un rayon
  for (let i = 0; i < 5; i++) {
    if (state.activeHearts >= config.maxHearts) break;

    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 100;
    const x = e.clientX + Math.cos(angle) * radius;
    const y = e.clientY + Math.sin(angle) * radius;

    const heart = createHeart(x, y);
    document.body.appendChild(heart);
    state.activeHearts++;
  }

  // Gestion de la limite de cœurs
  const hearts = Array.from(document.querySelectorAll(".floating-heart"));
  if (hearts.length > config.maxHearts) {
    const heartsToRemove = hearts.length - config.maxHearts;

    // Mélanger le tableau des cœurs
    for (let i = hearts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hearts[i], hearts[j]] = [hearts[j], hearts[i]];
    }

    // Supprimer les cœurs en trop
    for (let i = 0; i < heartsToRemove; i++) {
      explodeHeart(hearts[i]);
      state.activeHearts--;
    }
  }
}

// Mise à jour de la position du cœur du curseur
function updateCursorHeart(e) {
  if (state.isActive) {
    state.cursorHeart.style.display = "block";
    state.cursorHeart.style.left = `${e.clientX}px`;
    state.cursorHeart.style.top = `${e.clientY}px`;
  } else {
    state.cursorHeart.style.display = "none";
  }
}

// Activation/désactivation du mode Madame
function toggleMadameMode() {
  state.isActive = !state.isActive;
  document.body.classList.toggle("madame-mode", state.isActive);
  localStorage.setItem("madameMode", state.isActive);

  state.cursorHeart.style.display = state.isActive ? "block" : "none";

  if (state.isActive) {
    state.heartInterval = setInterval(createFloatingHearts, 2000);
    createFloatingHearts();
  } else {
    clearInterval(state.heartInterval);
    // Supprimer tous les cœurs existants avec effet d'explosion
    const hearts = document.querySelectorAll(".floating-heart");
    hearts.forEach(explodeHeart);
    state.activeHearts = 0;
  }
}

// Initialisation du mode Madame
function initMadameMode() {
  state.cursorHeart = createCursorHeart();

  if (state.isActive) {
    document.body.classList.add("madame-mode");
    state.cursorHeart.style.display = "block";
    createFloatingHearts();
  }

  // Événements
  document.addEventListener("mousemove", updateCursorHeart);
  document.addEventListener("click", createClickHearts);
  document
    .getElementById("madame-mode")
    .addEventListener("click", toggleMadameMode);
}

// Gestion du mode plein écran
function handleFullscreenChange() {
  const isFullscreen =
    document.fullscreenElement ||
    document.mozFullScreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement;

  if (isFullscreen) {
    document.getElementById("video-player").appendChild(state.cursorHeart);
  } else {
    document.body.appendChild(state.cursorHeart);
  }
}

// Initialisation
document.addEventListener("DOMContentLoaded", initMadameMode);

// Événements de plein écran
document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("mozfullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
document.addEventListener("MSFullscreenChange", handleFullscreenChange);
