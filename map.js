let universe = JSON.parse(localStorage.getItem("universe")) || [];

const canvas = document.getElementById("solarCanvas");
const ctx = canvas.getContext("2d");

let stars = [];
let drawObjects = [];

let spaceship = { x: 100, y: 100, targetX: 100, targetY: 100 };
let currentTarget = null;
let autoMoving = true;
const arrivalThreshold = 1;

// -------------------- STARS --------------------
function generateStars() {
  stars = [];
  const numStars = 500;

  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random(),
      twinkleSpeed: Math.random() * 0.02 + 0.01,
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
    const parallaxX = (spaceship.x - canvas.width/2) * 0.02 * star.size;
    const parallaxY = (spaceship.y - canvas.height/2) * 0.02 * star.size;

    star.opacity += star.twinkleSpeed;

    // Reverse twinkle when hitting bounds
    if (star.opacity > 1) {
      star.opacity = 1;
      star.twinkleSpeed *= -1;
    } else if (star.opacity < 0.3) {
      star.opacity = 0.3;
      star.twinkleSpeed *= -1;
    }

    ctx.fillStyle = `rgba(${star.color}, ${star.opacity})`;
    ctx.beginPath();
    ctx.arc(star.x + parallaxX, star.y + parallaxY, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

// -------------------- PLANETS --------------------
function draw3DPlanet(x, y, radius, type, hue) {
  let gradient = ctx.createRadialGradient(x - radius/3, y - radius/3, radius*0.1, x, y, radius);

  if (type === "rocky") {
    const baseColor = `hsl(${hue}, 70%, 50%)`;
    gradient.addColorStop(0, "#fff");
    gradient.addColorStop(0.5, baseColor);
    gradient.addColorStop(1, "#111");
  } else if (type === "gas") {
    gradient.addColorStop(0, `hsl(${hue}, 60%, 70%)`);
    gradient.addColorStop(0.5, `hsl(${hue}, 70%, 50%)`);
    gradient.addColorStop(1, `hsl(${hue}, 80%, 30%)`);
  } else if (type === "ice") {
    const baseColor = `hsl(${hue}, 50%, 80%)`;
    gradient.addColorStop(0, "#fff");
    gradient.addColorStop(0.5, baseColor);
    gradient.addColorStop(1, "#aaa");
  }

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI*2);
  ctx.fill();

  // Optional rings for gas giants
  if (type === "gas" && Math.random() > 0.5) {
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, radius*1.5, radius*0.5, Math.PI/6, 0, 2*Math.PI);
    ctx.stroke();
  }
}

// -------------------- INITIALIZE PLANETS --------------------
function assignPlanetTypes() {
  universe.forEach(system => {
    system.planets.forEach(planet => {
      if (!planet._type) {
        const types = ["rocky","gas","ice"];
        planet._type = types[Math.floor(Math.random()*types.length)];
        planet._hue = Math.random()*360;
      }
    });
  });
}

// -------------------- SPACESHIP --------------------
function setSpaceshipTarget(x, y) {
  spaceship.targetX = x;
  spaceship.targetY = y;
}

function updateSpaceship() {
  spaceship.x += (spaceship.targetX - spaceship.x) * 0.05;
  spaceship.y += (spaceship.targetY - spaceship.y) * 0.05;
}

// -------------------- DRAW UNIVERSE --------------------
function drawUniverse() {
  assignPlanetTypes();

  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (stars.length===0) generateStars();
  drawStars();
  drawObjects=[];

  if (universe.length === 0) {
    ctx.fillStyle="#fff";
    ctx.font="20px Arial";
    ctx.textAlign="center";
    ctx.fillText("🚀 Universe is empty — add some planets", canvas.width/2, canvas.height/2);
    return;
  }

  let x = 200, y = 200;

  universe.forEach((system, sysIndex) => {
    // Draw solar system star
    ctx.fillStyle="lightblue";
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle="#fff";
    ctx.textAlign="center";
    ctx.fillText(system.name, x, y+60);

    drawObjects.push({type:"system", systemIndex:sysIndex, x:x, y:y, radius:40});

    // Draw planets
    let px = x + 150;
    system.planets.forEach((planet, planetIndex)=>{
      planet.x = px;
      planet.y = y;

      draw3DPlanet(planet.x, planet.y, 25, planet._type, planet._hue);

      ctx.fillStyle="#fff";
      ctx.fillText(planet.name, planet.x, planet.y+40);

      drawObjects.push({
        type:"planet",
        systemIndex:sysIndex,
        planetIndex:planetIndex,
        x:planet.x,
        y:planet.y,
        radius:25
      });

      px += 150;
    });

    y += 200; // next row
  });

  // Draw spaceship
  ctx.fillStyle="white";
  ctx.beginPath();
  ctx.arc(spaceship.x, spaceship.y, 15, 0, Math.PI*2);
  ctx.fill();
  ctx.fillText("🚀", spaceship.x, spaceship.y-20);

  updateSpaceship();
}

// -------------------- AUTO-MOVE --------------------
function findNextTarget() {
  for (let s=0; s<universe.length; s++){
    const system=universe[s];
    let hasAnyCompletedMission=false;
    for (let p=0;p<system.planets.length;p++){
      const completed=system.planets[p].missions.filter(m=>m.completed);
      if(completed.length>0){ hasAnyCompletedMission=true; break;}
    }

    if(!hasAnyCompletedMission){
      const starY=200+200*s;
      return {systemIndex:s, planetIndex:null, x:200, y:starY};
    }

    for(let p=0;p<system.planets.length;p++){
      const planet=system.planets[p];
      const incomplete=planet.missions.filter(m=>!m.completed);
      if(incomplete.length>0) return {systemIndex:s, planetIndex:p, x:planet.x, y:planet.y};
    }
  }
  return null;
}

function autoMoveSpaceship() {
  if(!autoMoving) return;
  if(!currentTarget) currentTarget=findNextTarget();
  if(!currentTarget) return;

  const dx=Math.abs(spaceship.x-currentTarget.x);
  const dy=Math.abs(spaceship.y-currentTarget.y);

  if(dx<arrivalThreshold && dy<arrivalThreshold) currentTarget=findNextTarget();
  setSpaceshipTarget(currentTarget.x,currentTarget.y);
}

// -------------------- CLICK HANDLING --------------------
canvas.addEventListener("click",(event)=>{
  const rect=canvas.getBoundingClientRect();
  const clickX=event.clientX-rect.left;
  const clickY=event.clientY-rect.top;

  for(let obj of drawObjects){
    const distance=Math.sqrt((clickX-obj.x)**2+(clickY-obj.y)**2);
    if(distance<=obj.radius){
      if(obj.type==="system") showSystemSidebar(obj.systemIndex);
      else if(obj.type==="planet") showPlanetSidebar(obj.systemIndex,obj.planetIndex);
      break;
    }
  }
});

// -------------------- SIDEBAR --------------------
function showSidebar(){ const sb=document.getElementById("sidebar"); sb.classList.remove("hidden"); sb.setAttribute("aria-hidden","false");}
function hideSidebar(){ const sb=document.getElementById("sidebar"); sb.classList.add("hidden"); sb.setAttribute("aria-hidden","true");}

function showSystemSidebar(systemIndex){
  const system=universe[systemIndex];
  const total=system.planets.reduce((sum,p)=>sum+p.missions.length,0);
  const completed=system.planets.reduce((sum,p)=>sum+p.missions.filter(m=>m.completed).length,0);
  const perc=total>0?Math.round((completed/total)*100):0;

  const content=`
    <h2>🌌 ${system.name}</h2>
    <p><strong>Planets:</strong> ${system.planets.length}</p>
    <p><strong>Total Missions:</strong> ${total}</p>
    <p><strong>Completed:</strong> ${completed}/${total} (${perc}%)</p>
    <div style="background:#333;border-radius:4px;height:10px;margin:10px 0;">
      <div style="background:var(--accent);height:100%;width:${perc}%;border-radius:4px;"></div>
    </div>
  `;
  document.getElementById("sidebarContent").innerHTML=content;
  showSidebar();
}

function showPlanetSidebar(systemIndex,planetIndex){
  const system=universe[systemIndex];
  const planet=system.planets[planetIndex];
  const total=planet.missions.length;
  const completed=planet.missions.filter(m=>m.completed).length;
  const perc=total>0?Math.round((completed/total)*100):0;

  const content=`
    <h2>🪐 ${planet.name}</h2>
    <p><strong>System:</strong> ${system.name}</p>
    <p><strong>Total Missions:</strong> ${total}</p>
    <p><strong>Completed:</strong> ${completed}/${total} (${perc}%)</p>
    <div style="background:#333;border-radius:4px;height:10px;margin:10px 0;">
      <div style="background:var(--accent);height:100%;width:${perc}%;border-radius:4px;"></div>
    </div>
    <h3>Missions:</h3>
    <ul style="margin:0;padding-left:20px;">
      ${planet.missions.map(m=>`<li style="color:${m.completed?'#4ade80':'var(--muted)'};">${m.completed?'✅':'⏳'} ${m.name}</li>`).join('')}
    </ul>
  `;
  document.getElementById("sidebarContent").innerHTML=content;
  showSidebar();
}

document.getElementById("closeSidebar").addEventListener("click",hideSidebar);

// -------------------- MAIN LOOP --------------------
function loop() {
  drawUniverse();
  autoMoveSpaceship();
  requestAnimationFrame(loop);
}

loop();
