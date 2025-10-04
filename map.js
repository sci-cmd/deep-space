/* ==============================
   INITIAL SETUP
============================== */
let universe = JSON.parse(localStorage.getItem("universe")) || [];
const canvas = document.getElementById("solarCanvas");
const ctx = canvas.getContext("2d");

let stars = [];
let drawObjects = [];

let spaceship = { x: 100, y: 100, targetX: 100, targetY: 100 };
const arrivalThreshold = 1;
let autoMoving = true;

let currentSystemIndex = 0;

const prevBtn = document.getElementById("prevSystem");
const nextBtn = document.getElementById("nextSystem");
const systemNav = document.querySelector(".system-nav");
const mapContent = document.getElementById("mapContent");

/* ==============================
   STARS
============================== */
function generateStars() {
  stars = [];
  const numStars = 500;
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.7 + 0.3,
      twinkleSpeed: (Math.random() * 0.02 + 0.01) * (Math.random() < 0.5 ? 1 : -1),
      color: getStarColor()
    });
  }
}

function getStarColor() {
  const colors = ['255,255,255','150,180,255','255,220,150','255,150,150'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function drawStars() {
  stars.forEach(star => {
    const parallaxX = (spaceship.x - canvas.width / 2) * 0.02 * star.size;
    const parallaxY = (spaceship.y - canvas.height / 2) * 0.02 * star.size;

    star.opacity += star.twinkleSpeed;
    if (star.opacity > 1) { star.opacity = 1; star.twinkleSpeed *= -1; }
    if (star.opacity < 0.3) { star.opacity = 0.3; star.twinkleSpeed *= -1; }

    ctx.fillStyle = `rgba(${star.color}, ${star.opacity.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(star.x + parallaxX, star.y + parallaxY, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* ==============================
   PLANETS
============================== */
function draw3DPlanet(x, y, radius, planet) {
  if (!planet._image) {
    planet._image = new Image();
    planet._image.crossOrigin = "anonymous";

    const textures = {
      rocky: ['rocky1.jpg', 'rocky2.jpg', 'rocky3.png'],
      gas: ['gas1.jpg', 'gas2.jpg', 'gas3.jpg'],
      ice: ['ice1.jpg', 'ice2.jpg']
    };

    const typeTextures = textures[planet._type];
    const textureIndex = Math.floor(Math.random() * typeTextures.length);
    planet._image.src = typeTextures[textureIndex];
    planet._imageLoaded = false;

    planet._image.onload = () => planet._imageLoaded = true;
    planet._image.onerror = () => planet._imageLoaded = false;
  }

  ctx.save();
  ctx.fillStyle = `hsl(${planet._hue}, 60%, 50%)`;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  if (planet._imageLoaded) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(planet._image, x - radius, y - radius, radius * 2, radius * 2);
  }
  ctx.restore();
}

/* ==============================
   INITIALIZE PLANETS
============================== */
function assignPlanetTypes() {
  universe.forEach(system => {
    system.planets.forEach(planet => {
      if (!planet._type) {
        const types = ["rocky", "gas", "ice"];
        planet._type = types[Math.floor(Math.random() * types.length)];
        planet._hue = Math.random() * 360;
      }
    });
  });
}

/* ==============================
   SPACESHIP
============================== */
function setSpaceshipTarget(x, y) {
  spaceship.targetX = x;
  spaceship.targetY = y;
}

function updateSpaceship() {
  spaceship.x += (spaceship.targetX - spaceship.x) * 0.05;
  spaceship.y += (spaceship.targetY - spaceship.y) * 0.05;
}

/* ==============================
   DRAW CURRENT UNIVERSE
============================== */
function drawUniverse() {
  assignPlanetTypes();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (stars.length === 0) generateStars();
  drawStars();

  drawObjects = [];

  if (universe.length === 0) {
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🚀 Universe is empty — add some planets", canvas.width / 2, canvas.height / 2);
    return;
  }

  const system = universe[currentSystemIndex];

  // Assign radius based on type
  system.planets.forEach(planet => {
    switch (planet._type) {
      case "rocky": planet.radius = 60; break;
      case "gas": planet.radius = 50; break;
      case "ice": planet.radius = 55; break;
      default: planet.radius = 60;
    }
  });

  // Calculate centering
  let totalWidth = system.planets.reduce((sum, p) => sum + p.radius * 2, 0) + (system.planets.length - 1) * 30;
  let xStart = (canvas.width - totalWidth) / 2;

  let x = xStart;
  let y = canvas.height / 2;

  system.planets.forEach((planet, planetIndex) => {
    planet.x = x + planet.radius;
    planet.y = y;

    draw3DPlanet(planet.x, planet.y, planet.radius, planet);

    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(planet.name, planet.x, planet.y + planet.radius + 15);

    drawObjects.push({
      type: "planet",
      systemIndex: currentSystemIndex,
      planetIndex: planetIndex,
      x: planet.x,
      y: planet.y,
      radius: planet.radius
    });

    x += planet.radius * 2 + 30;
  });

  // Draw spaceship
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(spaceship.x, spaceship.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.fillText("🚀", spaceship.x, spaceship.y - 20);

  updateSpaceship();
}

/* ==============================
   AUTO-MOVE SPACESHIP
============================== */
function findNextTarget() {
  if (universe.length === 0) return null;
  const system = universe[currentSystemIndex];
  for (let p = 0; p < system.planets.length; p++) {
    const planet = system.planets[p];
    const incomplete = planet.missions.filter(m => !m.completed);
    if (incomplete.length > 0) return { x: planet.x, y: planet.y };
  }
  return null;
}

function autoMoveSpaceship() {
  if (!autoMoving) return;
  if (!spaceship.targetX && !spaceship.targetY) {
    const target = findNextTarget();
    if (target) setSpaceshipTarget(target.x, target.y);
  }
  const dx = Math.abs(spaceship.x - spaceship.targetX);
  const dy = Math.abs(spaceship.y - spaceship.targetY);
  if (dx < arrivalThreshold && dy < arrivalThreshold) {
    const target = findNextTarget();
    if (target) setSpaceshipTarget(target.x, target.y);
  }
}

/* ==============================
   SYSTEM NAVIGATION BUTTONS
============================== */
let isAnimating = false;

function updateNavButtons() {
  if (universe.length === 0) {
    systemNav.style.display = "none";
  } else if (universe.length === 1) {
    systemNav.style.display = "flex";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  } else {
    systemNav.style.display = "flex";
    prevBtn.disabled = currentSystemIndex === 0;
    nextBtn.disabled = currentSystemIndex === universe.length - 1;
  }
}

function animateSystemChange(direction) {
  if (isAnimating || universe.length <= 1) return;
  isAnimating = true;

  const distance = canvas.height;
  mapContent.style.transition = "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
  mapContent.style.transform = direction === "up" ? `translateY(${distance}px)` : `translateY(-${distance}px)`;

  setTimeout(() => {
    if (direction === "up") {
      currentSystemIndex = (currentSystemIndex - 1 + universe.length) % universe.length;
    } else {
      currentSystemIndex = (currentSystemIndex + 1) % universe.length;
    }
    updateNavButtons();
    drawUniverse();

    mapContent.style.transition = "none";
    mapContent.style.transform = direction === "up" ? `translateY(-${distance}px)` : `translateY(${distance}px)`;

    void mapContent.offsetWidth;

    mapContent.style.transition = "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
    mapContent.style.transform = "translateY(0)";

    setTimeout(() => { isAnimating = false; }, 600);
  }, 600);
}

prevBtn.addEventListener("click", () => {
  if (currentSystemIndex > 0) animateSystemChange("up");
});
nextBtn.addEventListener("click", () => {
  if (currentSystemIndex < universe.length - 1) animateSystemChange("down");
});

updateNavButtons();

/* ==============================
   CLICK HANDLING / SIDEBAR
============================== */
const sidebar = document.getElementById("sidebar");
const sidebarContent = document.getElementById("sidebarContent");
const closeBtn = document.getElementById("closeSidebar");

function showPlanetInfo(planet) {
  autoMoving = false; // stop spaceship
  let completed = planet.missions.filter(m => m.completed).length;
  let total = planet.missions.length;
  let percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  let missionsHTML = planet.missions.map(m => {
    const emoji = m.completed ? "✔️" : "⏳";
    const color = m.completed ? "green" : "white";
    return `<li style="color:${color}">${emoji} ${m.name}</li>`;
  }).join("");

  sidebarContent.innerHTML = `
    <h2>${planet.name}</h2>
    <p>Type: ${planet._type}</p>
    <p>Missions:</p>
    <ul>${missionsHTML}</ul>
    <div style="background:#333; border-radius:6px; height:20px; width:100%; margin-top:10px; overflow:hidden;">
      <div style="background:green; height:100%; width:${percent}%; transition: width 0.3s;"></div>
    </div>
    <p style="text-align:right; margin:2px 0 0 0;">${percent}% completed</p>
  `;
  sidebar.classList.remove("hidden");
  sidebar.setAttribute("aria-hidden", "false");
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  for (let obj of drawObjects) {
    const distance = Math.sqrt((clickX - obj.x) ** 2 + (clickY - obj.y) ** 2);
    if (distance <= obj.radius) {
      const planet = universe[obj.systemIndex].planets[obj.planetIndex];
      showPlanetInfo(planet);
      break;
    }
  }
});

closeBtn.addEventListener("click", () => {
  sidebar.classList.add("hidden");
  sidebar.setAttribute("aria-hidden", "true");
});

document.addEventListener("click", (event) => {
  if (!sidebar.contains(event.target) && !event.target.classList.contains("nav-btn") && !event.target.closest("canvas")) {
    sidebar.classList.add("hidden");
    sidebar.setAttribute("aria-hidden", "true");
  }
});

/* ==============================
   MAIN LOOP
============================== */
function loop() {
  drawUniverse();
  autoMoveSpaceship();
  requestAnimationFrame(loop);
}

loop();
