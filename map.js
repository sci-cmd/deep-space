let universe = JSON.parse(localStorage.getItem("universe")) || [];

const canvas = document.getElementById("solarCanvas");
const ctx = canvas.getContext("2d");

let stars = [];

function generateStars() {
  stars = [];
  const numStars = 500;

  for (let i = 0; i < numStars; i++){
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random(), 
      opacity: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      color: getStarColor()
    })
  }
}

function getStarColor(){
  const colors = [
    '255, 255, 255',      // Just RGB values, no rgba wrapper
    '255, 255, 255',
    '200, 220, 255',
    '255, 240, 200',
    '255, 200, 200'
  ]; 
  return colors[Math.floor(Math.random() * colors.length)];
}


function drawStars() {
  stars.forEach(star => {
    star.opacity += star.twinkleSpeed;
    if (star.opacity > 1){
      star.opacity = 1;
      star.twinkleSpeed = -Math.abs(star.twinkleSpeed);
    } else if (star.opacity < 0.3) {
      star.opacity = 0.3;
      star.twinkleSpeed = Math.abs(star.twinkleSpeed);
    }

ctx.fillStyle = `rgba(${star.color}, ${star.opacity})`;    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  })
}

let spaceship = { x: 100, y: 100, targetX: 100, targetY: 100 };
let drawObjects = [];

let currentTarget = null; // The current target spaceship is moving to
let autoMoving = true;    // Auto-move enabled
const arrivalThreshold = 1; // Consider "arrived" if within 1px

// -------------------- DRAW UNIVERSE --------------------
function drawUniverse() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (stars.length === 0) generateStars();
  drawStars();
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

// -------------------- CLICK HANDLING --------------------
canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  
  console.log("Clicked at:", clickX, clickY);
  
  // Check if we clicked on any object
  for (let obj of drawObjects) {
    const distance = Math.sqrt(
      (clickX - obj.x) ** 2 + (clickY - obj.y) ** 2
    );
    
    if (distance <= obj.radius) {
      console.log("Clicked on:", obj.type, obj);
      
      if (obj.type === "system") {
        showSystemSidebar(obj.systemIndex);
      } else if (obj.type === "planet") {
        showPlanetSidebar(obj.systemIndex, obj.planetIndex);
      }
      break; // Stop after first match
    }
  }
});

// -------------------- SIDEBAR FUNCTIONS --------------------
function showSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.remove("hidden");
  sidebar.setAttribute("aria-hidden", "false");
}

function hideSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.add("hidden");
  sidebar.setAttribute("aria-hidden", "true");
}

function showSystemSidebar(systemIndex) {
  const system = universe[systemIndex];
  const totalMissions = system.planets.reduce((sum, planet) => sum + planet.missions.length, 0);
  const completedMissions = system.planets.reduce((sum, planet) => 
    sum + planet.missions.filter(m => m.completed).length, 0
  );
  const completionPercentage = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;
  
  const content = `
    <h2>🌌 ${system.name}</h2>
    <p><strong>Planets:</strong> ${system.planets.length}</p>
    <p><strong>Total Missions:</strong> ${totalMissions}</p>
    <p><strong>Completed:</strong> ${completedMissions}/${totalMissions} (${completionPercentage}%)</p>
    <div style="background: #333; border-radius: 4px; height: 10px; margin: 10px 0;">
      <div style="background: var(--accent); height: 100%; width: ${completionPercentage}%; border-radius: 4px;"></div>
    </div>
  `;
  
  document.getElementById("sidebarContent").innerHTML = content;
  showSidebar();
}

function showPlanetSidebar(systemIndex, planetIndex) {
  const system = universe[systemIndex];
  const planet = system.planets[planetIndex];
  const totalMissions = planet.missions.length;
  const completedMissions = planet.missions.filter(m => m.completed).length;
  const completionPercentage = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;
  
  const content = `
    <h2>🪐 ${planet.name}</h2>
    <p><strong>System:</strong> ${system.name}</p>
    <p><strong>Total Missions:</strong> ${totalMissions}</p>
    <p><strong>Completed:</strong> ${completedMissions}/${totalMissions} (${completionPercentage}%)</p>
    <div style="background: #333; border-radius: 4px; height: 10px; margin: 10px 0;">
      <div style="background: var(--accent); height: 100%; width: ${completionPercentage}%; border-radius: 4px;"></div>
    </div>
    
    <h3>Missions:</h3>
    <ul style="margin: 0; padding-left: 20px;">
      ${planet.missions.map(mission => 
        `<li style="color: ${mission.completed ? '#4ade80' : 'var(--muted)'};">
          ${mission.completed ? '✅' : '⏳'} ${mission.name}
         </li>`
      ).join('')}
    </ul>
  `;
  
  document.getElementById("sidebarContent").innerHTML = content;
  showSidebar();
}

// Close sidebar button
document.getElementById("closeSidebar").addEventListener("click", hideSidebar);

function loop() {
  drawUniverse();
  autoMoveSpaceship();
  requestAnimationFrame(loop);
}

loop();
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

// -------------------- CLICK HANDLING --------------------
canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  
  console.log("Clicked at:", clickX, clickY);
  
  // Check if we clicked on any object
  for (let obj of drawObjects) {
    const distance = Math.sqrt(
      (clickX - obj.x) ** 2 + (clickY - obj.y) ** 2
    );
    
    if (distance <= obj.radius) {
      console.log("Clicked on:", obj.type, obj);
      
      if (obj.type === "system") {
        showSystemSidebar(obj.systemIndex);
      } else if (obj.type === "planet") {
        showPlanetSidebar(obj.systemIndex, obj.planetIndex);
      }
      break; // Stop after first match
    }
  }
});

// -------------------- SIDEBAR FUNCTIONS --------------------
function showSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.remove("hidden");
  sidebar.setAttribute("aria-hidden", "false");
}

function hideSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.add("hidden");
  sidebar.setAttribute("aria-hidden", "true");
}

function showSystemSidebar(systemIndex) {
  const system = universe[systemIndex];
  const totalMissions = system.planets.reduce((sum, planet) => sum + planet.missions.length, 0);
  const completedMissions = system.planets.reduce((sum, planet) => 
    sum + planet.missions.filter(m => m.completed).length, 0
  );
  const completionPercentage = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;
  
  const content = `
    <h2>🌌 ${system.name}</h2>
    <p><strong>Planets:</strong> ${system.planets.length}</p>
    <p><strong>Total Missions:</strong> ${totalMissions}</p>
    <p><strong>Completed:</strong> ${completedMissions}/${totalMissions} (${completionPercentage}%)</p>
    <div style="background: #333; border-radius: 4px; height: 10px; margin: 10px 0;">
      <div style="background: var(--accent); height: 100%; width: ${completionPercentage}%; border-radius: 4px;"></div>
    </div>
  `;
  
  document.getElementById("sidebarContent").innerHTML = content;
  showSidebar();
}

function showPlanetSidebar(systemIndex, planetIndex) {
  const system = universe[systemIndex];
  const planet = system.planets[planetIndex];
  const totalMissions = planet.missions.length;
  const completedMissions = planet.missions.filter(m => m.completed).length;
  const completionPercentage = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;
  
  const content = `
    <h2>🪐 ${planet.name}</h2>
    <p><strong>System:</strong> ${system.name}</p>
    <p><strong>Total Missions:</strong> ${totalMissions}</p>
    <p><strong>Completed:</strong> ${completedMissions}/${totalMissions} (${completionPercentage}%)</p>
    <div style="background: #333; border-radius: 4px; height: 10px; margin: 10px 0;">
      <div style="background: var(--accent); height: 100%; width: ${completionPercentage}%; border-radius: 4px;"></div>
    </div>
    
    <h3>Missions:</h3>
    <ul style="margin: 0; padding-left: 20px;">
      ${planet.missions.map(mission => 
        `<li style="color: ${mission.completed ? '#4ade80' : 'var(--muted)'};">
          ${mission.completed ? '✅' : '⏳'} ${mission.name}
         </li>`
      ).join('')}
    </ul>
  `;
  
  document.getElementById("sidebarContent").innerHTML = content;
  showSidebar();
}

// Close sidebar button
document.getElementById("closeSidebar").addEventListener("click", hideSidebar);

loop();

