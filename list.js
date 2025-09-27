let universe = JSON.parse(localStorage.getItem("universe")) || [];

const solarSystemList = document.getElementById("systemsList");
const addSystemBtn = document.getElementById("addSystemBtn");
const newSystemInput = document.getElementById("newSystem");
const clearUniverseBtn = document.getElementById("clearUniverseBtn");

function saveUniverse() {
  localStorage.setItem("universe", JSON.stringify(universe));
  renderUniverse();
}

function createButton(label, className) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.className = className;
  return btn;
}

function renderUniverse() {
  solarSystemList.innerHTML = "";
  if (universe.length === 0) {
    solarSystemList.innerHTML = '<p class="empty-msg">No Solar Systems yet. Add one!</p>';
    return;
  }

  universe.forEach((sys, sysIndex) => {
    const sysDiv = document.createElement("div");
    sysDiv.className = "solar-system";

    const sysHeader = document.createElement("div");
    sysHeader.className = "system-header";
    sysHeader.innerHTML = `<span>🌌 ${sys.name}</span>`;

    const sysControls = document.createElement("div");
    sysControls.style.display = "flex";
    sysControls.style.gap = "6px";

    const addPlanetBtn = createButton("+ Planet", "btn");
    addPlanetBtn.addEventListener("click", () => addPlanet(sysIndex));

    const deleteSysBtn = createButton("X", "delete-btn");
    deleteSysBtn.addEventListener("click", () => {
      universe.splice(sysIndex, 1);
      saveUniverse();
    });

    sysControls.appendChild(addPlanetBtn);
    sysControls.appendChild(deleteSysBtn);
    sysHeader.appendChild(sysControls);

    const planetsContainer = document.createElement("div");
    planetsContainer.className = "planets-container";

    sys.planets.forEach((pl, plIndex) => {
      const plDiv = document.createElement("div");
      plDiv.className = "planet";

      const plHeader = document.createElement("div");
      plHeader.className = "planet-header";
      plHeader.innerHTML = `<span>🪐 ${pl.name}</span>`;

      const plControls = document.createElement("div");
      plControls.style.display = "flex";
      plControls.style.gap = "6px";

      const addMissionBtn = createButton("+ Mission", "btn");
      addMissionBtn.addEventListener("click", () => addMission(sysIndex, plIndex));

      const deletePlBtn = createButton("X", "delete-btn");
      deletePlBtn.addEventListener("click", () => {
        sys.planets.splice(plIndex, 1);
        saveUniverse();
      });

      plControls.appendChild(addMissionBtn);
      plControls.appendChild(deletePlBtn);
      plHeader.appendChild(plControls);

      const missionsContainer = document.createElement("div");
      missionsContainer.className = "missions-container";

      pl.missions.forEach((m, mIndex) => {
        const missionDiv = document.createElement("div");
        missionDiv.className = "mission";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = m.completed;
        checkbox.addEventListener("change", () => {
          m.completed = checkbox.checked;
          saveUniverse();
        });

        const label = document.createElement("span");
        label.textContent = m.name;
        if (m.completed) label.classList.add("completed");

        const deleteMBtn = createButton("X", "delete-btn");
        deleteMBtn.addEventListener("click", () => {
          pl.missions.splice(mIndex, 1);
          saveUniverse();
        });

        const leftDiv = document.createElement("div");
        leftDiv.className = "mission-left";
        leftDiv.appendChild(checkbox);
        leftDiv.appendChild(label);

        missionDiv.appendChild(leftDiv);
        missionDiv.appendChild(deleteMBtn);
        missionsContainer.appendChild(missionDiv);
      });

      plDiv.appendChild(plHeader);
      plDiv.appendChild(missionsContainer);
      planetsContainer.appendChild(plDiv);

      // Collapsible planets
      plHeader.addEventListener("click", () => {
        missionsContainer.classList.toggle("hidden");
      });
    });

    sysDiv.appendChild(sysHeader);
    sysDiv.appendChild(planetsContainer);
    solarSystemList.appendChild(sysDiv);

    // Collapsible systems
    sysHeader.addEventListener("click", () => {
      planetsContainer.classList.toggle("hidden");
    });
  });
}

// Add Solar System
function addSystem() {
  const name = newSystemInput.value.trim();
  if (!name) return;
  universe.push({ name, planets: [] });
  newSystemInput.value = "";
  saveUniverse();
}

// Add Planet
function addPlanet(sysIndex) {
  const name = prompt("Planet name:");
  if (!name) return;
  universe[sysIndex].planets.push({ name, missions: [] });
  saveUniverse();
}

// Add Mission
function addMission(sysIndex, plIndex) {
  const name = prompt("Mission name:");
  if (!name) return;
  universe[sysIndex].planets[plIndex].missions.push({ name, completed: false });
  saveUniverse();
}

// Clear Universe
clearUniverseBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to clear your entire universe?")) {
    universe = [];
    saveUniverse();
  }
});

// Add system via Enter key or button
addSystemBtn.addEventListener("click", addSystem);
newSystemInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addSystem();
});

// Initial render
renderUniverse();
