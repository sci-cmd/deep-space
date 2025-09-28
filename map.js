// map.js — Spaceship Auto-Movement Only

let universe = JSON.parse(localStorage.getItem("universe")) || [];

const canvas = document.getElementById("solarCanvas");
const ctx = canvas.getContext("2d");

let spaceship = { x: 100, y: 100, targetX: 100, targetY: 100 };
let drawObjects = [];

let currentTarget = null; // The current target spaceship is moving to
let autoMoving = true;    // Auto-move enabled
const arrivalThreshold = 1; // Consider "arrived" if within 1px

// -------------------- DRAW UNIVERSE --------------------
function drawUniverse() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawObjects = [];

  if (universe.length === 0) {
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "🚀 Universe is empty — add some missions",
      canvas.width / 2,
      canvas.height / 2
    );
    return;
  }

  let x = 200, y = 200;

  universe.forEach((system, sysIndex) => {
    // Draw solar system star
    ctx.fillStyle = "lightblue";
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText(system.name, x, y + 60);

    drawObjects.push({
      type: "system",
      systemIndex: sysIndex,
      x: x,
      y: y,
      radius: 40,
    });

    // Draw planets
    let px = x + 150;
    system.planets.forEach((planet, planetIndex) => {
      planet.x = px;
      planet.y = y;

      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(planet.name, planet.x, planet.y + 40);

      drawObjects.push({
        type: "planet",
        systemIndex: sysIndex,
        planetIndex: planetIndex,
        x: planet.x,
        y: planet.y,
        radius: 25,
      });

      px += 150;
    });

    y += 200; // next row
  });

  // Draw spaceship
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(spaceship.x, spaceship.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText("🚀", spaceship.x, spaceship.y - 20);

  updateSpaceship();
}

// -------------------- SPACESHIP MOVEMENT --------------------
function updateSpaceship() {
  // Smooth movement
  spaceship.x += (spaceship.targetX - spaceship.x) * 0.05;
  spaceship.y += (spaceship.targetY - spaceship.y) * 0.05;
}

function setSpaceshipTarget(x, y){
  spaceship.targetX = x;
  spaceship.targetY = y;
}

// -------------------- FIND NEXT TARGET --------------------
function findNextTarget() {
  console.log("=== Finding next target ===");
  
  for (let s = 0; s < universe.length; s++) {
    const system = universe[s];
    console.log(`Checking system ${s}: ${system.name}`);
    
    // Check if ANY mission in this system has been completed
    let hasAnyCompletedMission = false;
    for (let p = 0; p < system.planets.length; p++) {
      const completedMissions = system.planets[p].missions.filter(m => m.completed);
      if (completedMissions.length > 0) {
        hasAnyCompletedMission = true;
        break;
      }
    }
    
    console.log(`  System has completed missions: ${hasAnyCompletedMission}`);
    
    // If no missions completed yet, stay at the star
    if (!hasAnyCompletedMission) {
      const starY = 200 + 200 * s;
      console.log(`  -> Staying at star of ${system.name}`);
      return { systemIndex: s, planetIndex: null, x: 200, y: starY };
    }
    
    // If some missions are completed, find next incomplete planet
    for (let p = 0; p < system.planets.length; p++) {
      const planet = system.planets[p];
      const incompleteMissions = planet.missions.filter(m => !m.completed);
      
      if (incompleteMissions.length > 0) {
        console.log(`  -> Moving to planet ${planet.name} with incomplete missions`);
        return { systemIndex: s, planetIndex: p, x: planet.x, y: planet.y };
      }
    }
    
    console.log(`  System ${system.name} is complete, checking next system`);
  }
  
  console.log("All systems complete!");
  return null;
}

// -------------------- AUTO-MOVE LOGIC --------------------
function autoMoveSpaceship() {
  if (!autoMoving) return;

  if (!currentTarget) currentTarget = findNextTarget();
  if (!currentTarget) return;

  const dx = Math.abs(spaceship.x - currentTarget.x);
  const dy = Math.abs(spaceship.y - currentTarget.y);

  // Check if arrived
  if (dx < arrivalThreshold && dy < arrivalThreshold) {
    currentTarget = findNextTarget(); // move to next target
  }

  // Always move toward current target
  setSpaceshipTarget(currentTarget.x, currentTarget.y);
}

// -------------------- MAIN LOOP --------------------
function loop() {
  drawUniverse();
  autoMoveSpaceship();
  requestAnimationFrame(loop);
}

loop();
