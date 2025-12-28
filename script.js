// DOM Elements
const video = document.getElementById("gameVideo");
const videoUpload = document.getElementById("videoUpload");
const canvas = document.getElementById("pitchCanvas");
const ctx = canvas.getContext("2d");
const playerInput = document.getElementById("playerInput"); // May be null if removed from DOM
const exportBtn = document.getElementById("exportCSV");
const addEventBtn = document.getElementById("addEvent");
const playerList = document.getElementById("playerList");
const eventTableBody = document.querySelector("#eventTable tbody");
const eventCount = document.getElementById("eventCount");

// Lineup Modal
const openModalBtn = document.getElementById("openLineupModal");
const modal = document.getElementById("lineupModal");
const closeModal = modal.querySelector(".close");
const closeModalBtn = modal.querySelector(".close-modal");
const lineupInputsDiv = document.getElementById("lineupInputs");
const saveLineupBtn = document.getElementById("saveLineup");

// State
let events = [];
let tempEvent = null;
let lineup = [];

let selectedEvent = null;
let selectedOutcome = null;
let selectedPossession = "";
let selectedBodyPart = "";

let currentSport = localStorage.getItem("selectedSport") || "soccer";

// Set initial dimensions based on sport
let pitchWidth, pitchHeight;
if (currentSport === "soccer") {
  pitchWidth = 110;
  pitchHeight = 75;
} else if (currentSport === "hockey") {
  pitchWidth = 61; // meters (200 feet)
  pitchHeight = 30; // meters (100 feet)
} else if (currentSport === "basketball") {
  pitchWidth = 28; // meters
  pitchHeight = 15; // meters
} else {
  pitchWidth = 110;
  pitchHeight = 75;
}

// Sport selector
const sportSelect = document.getElementById("sportSelect");

// Category Configuration (defines the button groups)
const defaultCategoryConfig = [
  { key: "event", label: "Event Type" },
  { key: "outcome", label: "Outcome" },
  { key: "possession", label: "Possession Type" },
  { key: "bodypart", label: "Body Part" }
];

// Button Configurations (buttons within each category)
const defaultButtonConfig = {
  event: ["Pass", "Shot", "Tackle", "Clearance", "Error"],
  outcome: ["Success", "Unsuccessful", ""],
  possession: ["", "Throw-in", "Corner", "Free-kick"],
  bodypart: ["", "Head"]
};

let categoryConfig = JSON.parse(localStorage.getItem("categoryConfig")) || defaultCategoryConfig;
let buttonConfig = JSON.parse(localStorage.getItem("buttonConfig")) || defaultButtonConfig;

// Ensure all categories in config have button arrays
categoryConfig.forEach(cat => {
  if (!buttonConfig[cat.key]) {
    buttonConfig[cat.key] = [];
  }
});

// Event Edit Modal
const openEventEditModalBtn = document.getElementById("openEventEditModal");
const eventEditModal = document.getElementById("eventEditModal");
const closeEventModal = eventEditModal.querySelector(".close-event-modal");
const saveEventButtonsBtn = document.getElementById("saveEventButtons");
const buttonEditContent = document.getElementById("buttonEditContent");
const buttonEditTabs = document.getElementById("buttonEditTabs");
let currentEditTab = "event";

// --- Video Upload ---
videoUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    video.src = URL.createObjectURL(file);
    // Show success feedback
    const uploadBtn = videoUpload.closest('.upload-btn');
    if (uploadBtn) {
      uploadBtn.style.background = 'var(--success-color)';
      setTimeout(() => {
        uploadBtn.style.background = 'var(--primary-color)';
      }, 1000);
    }
  }
});

// --- Keyboard Controls ---
document.addEventListener("keydown", (e) => {
  // Don't interfere with input fields
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
    return;
  }

  const skipAmount = e.shiftKey ? 10 : 5;
  if (e.code === "ArrowRight") {
    e.preventDefault();
    video.currentTime = Math.min(video.duration, video.currentTime + skipAmount);
  } else if (e.code === "ArrowLeft") {
    e.preventDefault();
    video.currentTime = Math.max(0, video.currentTime - skipAmount);
  } else if (e.code === "Space") {
    e.preventDefault();
    if (video.paused) video.play();
    else video.pause();
  }
});

// --- Draw Field/Court (Main Function) ---
function drawField() {
  if (currentSport === "soccer") {
    drawSoccerPitch();
  } else if (currentSport === "hockey") {
    drawHockeyRink();
  } else if (currentSport === "basketball") {
    drawBasketballCourt();
  }
}

// --- Draw Soccer Pitch ---
function drawSoccerPitch() {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");

  const scaleX = w / pitchWidth;
  const scaleY = h / pitchHeight;

  // Background
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#007a33";
  ctx.fillRect(0, 0, w, h);

  // Outer lines
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, w, h);

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();

  // Center circle
  const centerCircleRadius = 10 * scaleX;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, centerCircleRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();

  // Penalty & 6-yard boxes
  const penaltyBoxWidth = 45 * scaleY;
  const penaltyBoxDepth = 18 * scaleX;
  const sixYardBoxWidth = 20 * scaleY;
  const sixYardBoxDepth = 6 * scaleX;

  // Left penalty box
  ctx.strokeRect(0, (h - penaltyBoxWidth) / 2, penaltyBoxDepth, penaltyBoxWidth);
  // Right penalty box
  ctx.strokeRect(w - penaltyBoxDepth, (h - penaltyBoxWidth) / 2, penaltyBoxDepth, penaltyBoxWidth);
  // Left 6-yard box
  ctx.strokeRect(0, (h - sixYardBoxWidth) / 2, sixYardBoxDepth, sixYardBoxWidth);
  // Right 6-yard box
  ctx.strokeRect(w - sixYardBoxDepth, (h - sixYardBoxWidth) / 2, sixYardBoxDepth, sixYardBoxWidth);

  // Penalty spots
  const penaltySpotLeft = 12 * scaleX;
  const penaltySpotRight = w - penaltySpotLeft;
  ctx.beginPath();
  ctx.arc(penaltySpotLeft, h / 2, 3, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(penaltySpotRight, h / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Penalty arcs
  const arcRadius = 10 * scaleX;
  ctx.beginPath();
  ctx.arc(penaltySpotLeft, h / 2, arcRadius, -Math.PI / 2 + Math.PI/5, Math.PI / 2 - Math.PI/5, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(penaltySpotRight, h / 2, arcRadius, Math.PI / 2 + Math.PI/5, (3 * Math.PI) / 2 - Math.PI/5, false);
  ctx.stroke();

  // Third lines
  ctx.strokeStyle = "#4a90e2";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w*0.6818, 0);
  ctx.lineTo(w*0.6818, h);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w*0.31818, 0);
  ctx.lineTo(w*0.31818, h);
  ctx.stroke();

  // Reset stroke style
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
}

// --- Draw Hockey Rink ---
function drawHockeyRink() {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");

  const scaleX = w / pitchWidth;
  const scaleY = h / pitchHeight;
  const cornerRadius = 8.5 * scaleX; // Rounded corners

  // Background (ice blue)
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#e0f4ff";
  ctx.fillRect(0, 0, w, h);

  // Draw rounded rectangle for rink
  ctx.strokeStyle = "#c8102e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(w - cornerRadius, 0);
  ctx.quadraticCurveTo(w, 0, w, cornerRadius);
  ctx.lineTo(w, h - cornerRadius);
  ctx.quadraticCurveTo(w, h, w - cornerRadius, h);
  ctx.lineTo(cornerRadius, h);
  ctx.quadraticCurveTo(0, h, 0, h - cornerRadius);
  ctx.lineTo(0, cornerRadius);
  ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
  ctx.closePath();
  ctx.stroke();

  // Blue lines (at 1/3 and 2/3 of rink length, excluding rounded corners)
  const blueLine1 = cornerRadius + (w - 2 * cornerRadius) / 3;
  const blueLine2 = cornerRadius + 2 * (w - 2 * cornerRadius) / 3;
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(blueLine1, cornerRadius);
  ctx.lineTo(blueLine1, h - cornerRadius);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(blueLine2, cornerRadius);
  ctx.lineTo(blueLine2, h - cornerRadius);
  ctx.stroke();

  // Center line (red)
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2, cornerRadius);
  ctx.lineTo(w / 2, h - cornerRadius);
  ctx.stroke();

  // Center circle (radius ~4.5m scaled)
  const centerCircleRadius = 4.5 * Math.min(scaleX, scaleY);
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, centerCircleRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Center face-off dot
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
  ctx.fillStyle = "blue";
  ctx.fill();

  // Face-off circles in offensive/defensive zones (2 circles in each zone)
  const faceOffRadius = 4.5 * Math.min(scaleX, scaleY);
  const centerY = h / 2;
  
  // Calculate positions for end zone face-off circles
  // Left defensive zone (between left end and blue line)
  const leftZoneWidth = blueLine1 - cornerRadius;
  const leftFaceOffX = cornerRadius + leftZoneWidth * 0.35;
  const leftFaceOffY1 = centerY - h * 0.18; // Above center
  const leftFaceOffY2 = centerY + h * 0.18; // Below center
  
  // Right offensive zone (between blue line and right end)
  const rightZoneWidth = w - cornerRadius - blueLine2;
  const rightFaceOffX = blueLine2 + rightZoneWidth * 0.35;
  const rightFaceOffY1 = centerY - h * 0.18; // Above center
  const rightFaceOffY2 = centerY + h * 0.18; // Below center

  // Face-off circles (4 total - 2 in each end zone)
  const faceOffPositions = [
    { x: leftFaceOffX, y: leftFaceOffY1 },  // Left zone, above
    { x: leftFaceOffX, y: leftFaceOffY2 },  // Left zone, below
    { x: rightFaceOffX, y: rightFaceOffY1 }, // Right zone, above
    { x: rightFaceOffX, y: rightFaceOffY2 }  // Right zone, below
  ];

  faceOffPositions.forEach(pos => {
    // Circle
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, faceOffRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Dot
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();
    
    // Hash marks (small lines on circle at 4 positions)
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i;
      const x1 = pos.x + Math.cos(angle) * faceOffRadius;
      const y1 = pos.y + Math.sin(angle) * faceOffRadius;
      const x2 = pos.x + Math.cos(angle) * (faceOffRadius + 3);
      const y2 = pos.y + Math.sin(angle) * (faceOffRadius + 3);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  });

  // Goal creases (semi-circles at ends with rectangular extension)
  const creaseRadius = 1.8 * Math.min(scaleX, scaleY);
  const creaseY = h / 2;
  const creaseWidth = 1.2 * Math.min(scaleX, scaleY);
  const creaseHeight = 3.6 * Math.min(scaleX, scaleY);

  // Left goal crease
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cornerRadius, creaseY, creaseRadius, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // Rectangular part
  ctx.strokeRect(cornerRadius, creaseY - creaseHeight / 2, creaseWidth, creaseHeight);

  // Right goal crease
  ctx.beginPath();
  ctx.arc(w - cornerRadius, creaseY, creaseRadius, Math.PI / 2, -Math.PI / 2);
  ctx.stroke();
  // Rectangular part
  ctx.strokeRect(w - cornerRadius - creaseWidth, creaseY - creaseHeight / 2, creaseWidth, creaseHeight);
}

// --- Draw Basketball Court ---
function drawBasketballCourt() {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d");

  const scaleX = w / pitchWidth;
  const scaleY = h / pitchHeight;

  // Background (wooden court)
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#d2691e";
  ctx.fillRect(0, 0, w, h);

  // Outer lines
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, w, h);

  // Center line
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();

  // Center circle
  const centerCircleRadius = 1.8 * scaleX;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, centerCircleRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 2, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();

  // Free throw circles
  const freeThrowRadius = 1.8 * scaleX;
  const freeThrowY = h / 2;
  const freeThrowX1 = 5.8 * scaleX;
  const freeThrowX2 = w - 5.8 * scaleX;

  // Left free throw circle
  ctx.beginPath();
  ctx.arc(freeThrowX1, freeThrowY, freeThrowRadius, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // Right free throw circle
  ctx.beginPath();
  ctx.arc(freeThrowX2, freeThrowY, freeThrowRadius, Math.PI / 2, -Math.PI / 2);
  ctx.stroke();

  // Free throw lines
  ctx.beginPath();
  ctx.moveTo(freeThrowX1, freeThrowY - freeThrowRadius);
  ctx.lineTo(freeThrowX1, freeThrowY + freeThrowRadius);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(freeThrowX2, freeThrowY - freeThrowRadius);
  ctx.lineTo(freeThrowX2, freeThrowY + freeThrowRadius);
  ctx.stroke();

  // Key (paint area)
  const keyWidth = 4.9 * scaleX;
  const keyHeight = 5.8 * scaleY;

  // Left key
  ctx.strokeRect(0, (h - keyHeight) / 2, keyWidth, keyHeight);
  // Right key
  ctx.strokeRect(w - keyWidth, (h - keyHeight) / 2, keyWidth, keyHeight);

  // Three-point arcs
  const threePointRadius = 6.75 * scaleX;
  const threePointY = h / 2;

  // Left three-point arc
  ctx.beginPath();
  ctx.arc(0, threePointY, threePointRadius, -Math.PI / 2 - 0.5, Math.PI / 2 + 0.5);
  ctx.stroke();

  // Right three-point arc
  ctx.beginPath();
  ctx.arc(w, threePointY, threePointRadius, Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5);
  ctx.stroke();

  // Three-point line extensions
  const threePointExtension = 0.9 * scaleX;
  ctx.beginPath();
  ctx.moveTo(threePointExtension, 0);
  ctx.lineTo(threePointExtension, h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - threePointExtension, 0);
  ctx.lineTo(w - threePointExtension, h);
  ctx.stroke();
}

// Initialize sport selector
if (sportSelect) {
  sportSelect.value = currentSport;
  sportSelect.addEventListener("change", (e) => {
    currentSport = e.target.value;
    localStorage.setItem("selectedSport", currentSport);
    
    // Update dimensions based on sport
    if (currentSport === "soccer") {
      pitchWidth = 110;
      pitchHeight = 75;
    } else if (currentSport === "hockey") {
      pitchWidth = 61; // meters (200 feet)
      pitchHeight = 30; // meters (100 feet)
    } else if (currentSport === "basketball") {
      pitchWidth = 28; // meters
      pitchHeight = 15; // meters
    }
    
    drawField();
  });
}

drawField();

// --- Button Selection ---
function setupButtons(className, callback) {
  document.querySelectorAll(`.${className}`).forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(`.${className}`).forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const dataKey = className.split("-")[0];
      callback(btn.dataset[dataKey]);
    });
  });
}

// --- Render Buttons Dynamically ---
function renderButtons(type, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = "";
  
  const buttons = (buttonConfig[type] || []).filter(v => v !== "" && v !== null && v !== undefined);
  const classMap = {
    event: "event-btn",
    outcome: "outcome-btn",
    possession: "possession-btn",
    bodypart: "bodypart-btn"
  };
  
  buttons.forEach(value => {
    const btn = document.createElement("button");
    btn.className = classMap[type];
    
    // Set display text
    let displayText = value;
    if (!value || value === "") {
      if (type === "outcome") displayText = "N/A";
      else if (type === "possession") displayText = "Open Play";
      else if (type === "bodypart") displayText = "Foot";
      else displayText = "";
    }
    
    // Add prefix for outcome buttons
    if (type === "outcome" && value === "Success") {
      displayText = "✓ " + displayText;
    } else if (type === "outcome" && value === "Unsuccessful") {
      displayText = "✗ " + displayText;
    }
    
    btn.textContent = displayText;
    
    // Set data attribute (use empty string for default values)
    const dataKey = type === "event" ? "event" : type === "outcome" ? "outcome" : type === "possession" ? "possession" : "bodypart";
    btn.dataset[dataKey] = value || "";
    
    // Add special classes for outcome buttons
    if (type === "outcome") {
      if (value === "Success") btn.classList.add("success");
      if (value === "Unsuccessful") btn.classList.add("unsuccessful");
    }
    
    container.appendChild(btn);
  });
  
  // Setup button listeners
  setupButtons(classMap[type], val => {
    if (type === "event") {
      selectedEvent = val;
      if (tempEvent) {
        tempEvent = null;
        clearTempMarkers();
      }
    } else if (type === "outcome") {
      selectedOutcome = val;
    } else if (type === "possession") {
      selectedPossession = val;
    } else if (type === "bodypart") {
      selectedBodyPart = val;
    }
  });
}

// --- Render Control Groups Dynamically ---
function renderControlGroups() {
  const container = document.getElementById("controlsContainer");
  if (!container) return;
  
  container.innerHTML = "";
  
  categoryConfig.forEach(cat => {
    const controlGroup = document.createElement("div");
    controlGroup.className = "control-group";
    controlGroup.id = `controlGroup-${cat.key}`;
    
    const label = document.createElement("label");
    label.className = "control-label";
    label.textContent = cat.label;
    
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "button-group";
    buttonGroup.id = `${cat.key}Buttons`;
    
    controlGroup.appendChild(label);
    controlGroup.appendChild(buttonGroup);
    container.appendChild(controlGroup);
    
    // Render buttons for this category
    renderButtons(cat.key, `${cat.key}Buttons`);
  });
  
  // Add action buttons at the end
  const actionButtons = document.createElement("div");
  actionButtons.className = "action-buttons";
  actionButtons.innerHTML = `
    <button id="addEvent" class="btn-primary">
      <span>➕</span> Add Event
    </button>
    <button id="exportCSV" class="btn-secondary">
      <span>💾</span> Export CSV
    </button>
  `;
  container.appendChild(actionButtons);
  
  // Re-attach event listeners for action buttons
  const addEventBtn = document.getElementById("addEvent");
  const exportBtn = document.getElementById("exportCSV");
  
  // Remove old listeners if they exist and re-attach
  if (addEventBtn) {
    const newAddEventBtn = addEventBtn.cloneNode(true);
    addEventBtn.parentNode.replaceChild(newAddEventBtn, addEventBtn);
    setupAddEventListener();
  }
  
  if (exportBtn) {
    const newExportBtn = exportBtn.cloneNode(true);
    exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
    setupExportListener();
  }
}

// Setup addEvent listener
function setupAddEventListener() {
  const addEventBtn = document.getElementById("addEvent");
  if (!addEventBtn) return;
  
  addEventBtn.addEventListener("click", () => {
    if (!tempEvent) {
      showNotification("Please mark the event on the pitch first!", "warning");
      return;
    }

    if (tempEvent.endX === undefined && selectedEvent !== "Tackle" && selectedEvent !== "Error") {
      showNotification("Please mark both start and end points!", "warning");
      return;
    }

    const player = (playerInput && playerInput.value.trim()) || window.selectedPlayer || "Unknown";
    
    const event = {
      eventType: selectedEvent || tempEvent.type,
      player,
      startX: tempEvent.startX,
      startY: tempEvent.startY,
      endX: tempEvent.endX || "",
      endY: tempEvent.endY || "",
      time: tempEvent.time,
      outcome: selectedOutcome || "",
      possession: selectedPossession || "",
      bodypart: selectedBodyPart || ""
    };

    events.push(event);
    addRowToTable(event, events.length - 1);
    updateEventCount();

    // Clear selections
    tempEvent = null;
    clearTempMarkers();
    clearSelections();
    
    if (playerInput) {
      playerInput.value = "";
    }
    window.selectedPlayer = null;
    showNotification("Event added successfully!", "success");
  });
}

// Setup export listener
function setupExportListener() {
  const exportBtn = document.getElementById("exportCSV");
  if (!exportBtn) return;
  
  exportBtn.addEventListener("click", () => {
    if (events.length === 0) {
      showNotification("No events to export!", "warning");
      return;
    }

    const header = ["eventType","player","startX","startY","endX","endY","time","outcome","possession","bodypart"];
    const rows = events.map(ev => 
      header.map(h => {
        const value = ev[h] !== undefined ? ev[h] : "";
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `soccer-events-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showNotification("CSV exported successfully!", "success");
  });
}

// Initialize control groups and buttons
renderControlGroups();

// Ensure event listeners are set up (they're also set up in renderControlGroups, but this ensures they work on initial load)
setupAddEventListener();
setupExportListener();

// --- Pitch Click Handler ---
canvas.addEventListener("click", (e) => {
  if (!selectedEvent) {
    showNotification("Please select an event type first!", "warning");
    return;
  }

  const rect = canvas.getBoundingClientRect();
  
  // Get the actual displayed size of the canvas (may be different from canvas.width/height due to CSS scaling)
  const displayWidth = rect.width;
  const displayHeight = rect.height;
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  
  // Calculate the scale factors
  const scaleX = canvasWidth / displayWidth;
  const scaleY = canvasHeight / displayHeight;
  
  // Get click position relative to the displayed canvas
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  
  // Convert to actual canvas coordinates (accounting for CSS scaling)
  const canvasX = clickX * scaleX;
  const canvasY = clickY * scaleY;
  
  // Scale to pitch dimensions (for data storage)
  const scaledX = (canvasX / canvasWidth) * pitchWidth;
  const scaledY = (canvasY / canvasHeight) * pitchHeight;

  // Single-point events (Tackle, Error)
  if (selectedEvent === "Tackle" || selectedEvent === "Error") {
    tempEvent = {
      type: selectedEvent,
      startX: scaledX,
      startY: scaledY,
      canvasX: canvasX,
      canvasY: canvasY,
      endX: "",
      endY: "",
      time: video.currentTime.toFixed(2),
    };
    drawMarker(canvasX, canvasY, "#ff6b6b");
    showNotification(`${selectedEvent} marked! Click "Add Event" to save.`, "success");
    return;
  }

  // Two-point events (Pass, Shot, Clearance)
  if (!tempEvent) {
    tempEvent = {
      startX: scaledX,
      startY: scaledY,
      canvasX: canvasX,
      canvasY: canvasY,
      time: video.currentTime.toFixed(2)  
    };
    drawMarker(canvasX, canvasY, "#ffd93d");
    showNotification("Start point marked. Click end point.", "info");
  } else {
    // Second click sets end coordinates
    tempEvent.endX = scaledX;
    tempEvent.endY = scaledY;
    tempEvent.endCanvasX = canvasX;
    tempEvent.endCanvasY = canvasY;
    tempEvent.type = selectedEvent;

    // Draw line and end marker
    const color = selectedEvent === "Pass" ? "#4ecdc4" : selectedEvent === "Shot" ? "#ff6b6b" : "#95a5a6";
    drawLine(tempEvent.canvasX, tempEvent.canvasY, canvasX, canvasY, color);
    drawMarker(canvasX, canvasY, color);
    showNotification("End point marked! Click 'Add Event' to save.", "success");
  }
});

// --- Draw Marker ---
function drawMarker(x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// --- Draw Line ---
function drawLine(x1, y1, x2, y2, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowLength = 10;
  const arrowAngle = Math.PI / 6;
  
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - arrowLength * Math.cos(angle - arrowAngle),
    y2 - arrowLength * Math.sin(angle - arrowAngle)
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - arrowLength * Math.cos(angle + arrowAngle),
    y2 - arrowLength * Math.sin(angle + arrowAngle)
  );
  ctx.stroke();
}

// --- Add Event --- (handled by setupAddEventListener function)

// --- Clear Selections ---
function clearSelections() {
  document.querySelectorAll(".active").forEach(b => b.classList.remove("active"));
  selectedBodyPart = "";
  selectedEvent = null;
  selectedOutcome = null;
  selectedPossession = "";
}

// --- Add Row to Table ---
function addRowToTable(event, index) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${index + 1}</td>
    <td contenteditable="true">${event.player}</td>
    <td contenteditable="true">${event.eventType}</td>
    <td contenteditable="true">${event.startX.toFixed(1)},${event.startY.toFixed(1)}</td>
    <td contenteditable="true">${event.endX ? event.endX.toFixed(1) + "," + event.endY.toFixed(1) : ""}</td>
    <td contenteditable="true">${event.outcome}</td>
    <td contenteditable="true">${event.possession}</td>
    <td contenteditable="true">${event.bodypart}</td>
    <td>${event.time}</td>
    <td><button class="deleteBtn">Delete</button></td>
  `;

  // Delete button
  tr.querySelector(".deleteBtn").addEventListener("click", () => {
    events.splice(index, 1);
    updateTable();
    updateEventCount();
    showNotification("Event deleted", "info");
  });

  // Update events array on edit
  tr.querySelectorAll("td[contenteditable]").forEach((cell, i) => {
    cell.addEventListener("blur", () => {
      switch(i) {
        case 0: break;
        case 1: event.player = cell.textContent.trim(); break;
        case 2: event.eventType = cell.textContent.trim(); break;
        case 3: 
          const [sx, sy] = cell.textContent.split(",");
          if (sx && sy) {
            event.startX = parseFloat(sx.trim()) || event.startX;
            event.startY = parseFloat(sy.trim()) || event.startY;
          }
          break;
        case 4:
          const [ex, ey] = cell.textContent.split(",");
          if (ex && ey) {
            event.endX = parseFloat(ex.trim()) || "";
            event.endY = parseFloat(ey.trim()) || "";
          } else {
            event.endX = "";
            event.endY = "";
          }
          break;
        case 5: event.outcome = cell.textContent.trim(); break;
        case 6: event.possession = cell.textContent.trim(); break;
        case 7: event.bodypart = cell.textContent.trim(); break;
      }
    });
  });

  eventTableBody.appendChild(tr);

  // Auto scroll to new row
  const container = document.querySelector(".event-table-container");
  container.scrollTop = container.scrollHeight;
}

// --- Update Table ---
function updateTable() {
  eventTableBody.innerHTML = "";
  events.forEach((ev, idx) => addRowToTable(ev, idx));
}

// --- Update Event Count ---
function updateEventCount() {
  const count = events.length;
  eventCount.textContent = `${count} ${count === 1 ? 'event' : 'events'}`;
}

// --- Export CSV --- (will be set up by setupExportListener)

// --- Lineup Modal ---
// Create input fields
for (let i = 0; i < 18; i++) {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = `Player ${i+1}`;
  lineupInputsDiv.appendChild(input);
}

openModalBtn.addEventListener("click", () => {
  const inputs = lineupInputsDiv.querySelectorAll("input");
  for (let i = 0; i < 18; i++) {
    inputs[i].value = lineup[i] || "";
  }
  modal.style.display = "block";
});

closeModal.addEventListener("click", () => modal.style.display = "none");
closeModalBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => {
  if (e.target == modal) modal.style.display = "none";
});

saveLineupBtn.addEventListener("click", () => {
  const inputs = lineupInputsDiv.querySelectorAll("input");
  lineup = [];
  inputs.forEach(input => {
    if (input.value.trim() !== "") lineup.push(input.value.trim());
  });

  // Update datalist if it exists
  if (playerList) {
    playerList.innerHTML = "";
    lineup.forEach(player => {
      const option = document.createElement("option");
      option.value = player;
      playerList.appendChild(option);
    });
  }

  // Render player buttons
  renderPlayerButtons();

  modal.style.display = "none";
  showNotification(`Lineup saved! ${lineup.length} players added.`, "success");
});

// --- Render Player Buttons ---
function renderPlayerButtons() {
  const playerButtonsContainer = document.getElementById("playerButtons");
  playerButtonsContainer.innerHTML = "";

  if (lineup.length === 0) {
    return;
  }

  lineup.forEach(player => {
    const btn = document.createElement("button");
    btn.textContent = player;
    btn.className = "player-btn";
    btn.addEventListener("click", () => {
      if (playerInput) {
        playerInput.value = player;
        highlightActiveButton(player);
        playerInput.focus();
      } else {
        // Store selected player for event creation
        window.selectedPlayer = player;
        highlightActiveButton(player);
      }
    });
    playerButtonsContainer.appendChild(btn);
  });
}

function highlightActiveButton(selected) {
  const buttons = document.querySelectorAll(".player-btn");
  buttons.forEach(btn => {
    if (btn.textContent === selected) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Initialize player buttons
renderPlayerButtons();

// --- Clear Temp Markers ---
function clearTempMarkers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawField();
}

// --- Coordinate Display ---
const coordsDisplay = document.getElementById("coordsDisplay");

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  
  // Get the actual displayed size of the canvas
  const displayWidth = rect.width;
  const displayHeight = rect.height;
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  
  // Calculate the scale factors
  const scaleX = canvasWidth / displayWidth;
  const scaleY = canvasHeight / displayHeight;
  
  // Get mouse position relative to the displayed canvas
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  
  // Convert to actual canvas coordinates
  const canvasX = clickX * scaleX;
  const canvasY = clickY * scaleY;
  
  // Scale to pitch dimensions (for display)
  const x = (canvasX / canvasWidth) * pitchWidth;
  const y = (canvasY / canvasHeight) * pitchHeight;
  
  // Use fixed-width formatting to prevent layout shifts
  const xStr = x.toFixed(1).padStart(5, ' ');
  const yStr = y.toFixed(1).padStart(5, ' ');
  coordsDisplay.textContent = `X:${xStr}, Y:${yStr}`;
});

canvas.addEventListener("mouseleave", () => {
  coordsDisplay.textContent = "X: –, Y: –";
});

// --- Notification System ---
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${type === 'success' ? 'var(--success-color)' : type === 'warning' ? 'var(--warning-color)' : 'var(--primary-color)'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    z-index: 2000;
    animation: slideInRight 0.3s ease-out;
    font-weight: 500;
    max-width: 300px;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// --- Render Category List ---
function renderCategoryList() {
  const categoryList = document.getElementById("categoryList");
  if (!categoryList) return;
  
  categoryList.innerHTML = "";
  
  categoryConfig.forEach((cat, index) => {
    const item = document.createElement("div");
    item.className = "button-edit-item";
    item.innerHTML = `
      <input type="text" value="${cat.label}" data-index="${index}" placeholder="Category name" class="category-label-input" />
      <button class="delete-item-btn" data-index="${index}">Delete</button>
    `;
    categoryList.appendChild(item);
  });
  
  // Setup category label inputs
  categoryList.querySelectorAll(".category-label-input").forEach(input => {
    input.addEventListener("input", (e) => {
      const index = parseInt(e.target.dataset.index);
      categoryConfig[index].label = e.target.value;
    });
  });
  
  // Setup category delete buttons
  categoryList.querySelectorAll(".delete-item-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index);
      const catKey = categoryConfig[index].key;
      
      // Don't allow deleting if it's the last category
      if (categoryConfig.length <= 1) {
        showNotification("You must have at least one category!", "warning");
        return;
      }
      
      // Remove category and its buttons
      categoryConfig.splice(index, 1);
      delete buttonConfig[catKey];
      
      renderCategoryList();
      renderEditTabs();
      if (categoryConfig.length > 0) {
        currentEditTab = categoryConfig[0].key;
        renderEditTab(currentEditTab);
      }
    });
  });
}

// --- Render Edit Tabs ---
function renderEditTabs() {
  const tabsContainer = document.getElementById("buttonEditTabs");
  if (!tabsContainer) return;
  
  tabsContainer.innerHTML = "";
  
  categoryConfig.forEach((cat, index) => {
    const tab = document.createElement("button");
    tab.className = `tab-btn ${index === 0 ? 'active' : ''}`;
    tab.dataset.tab = cat.key;
    tab.textContent = cat.label;
    tabsContainer.appendChild(tab);
  });
  
  // Setup tab switching
  tabsContainer.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      tabsContainer.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentEditTab = btn.dataset.tab;
      renderEditTab(currentEditTab);
    });
  });
}

// --- Event Button Edit Modal ---
function renderEditTab(tabType) {
  const buttons = buttonConfig[tabType] || [];
  const category = categoryConfig.find(cat => cat.key === tabType);
  const displayName = category ? category.label : tabType;
  
  let html = `<h3 style="margin-bottom: 1rem; font-size: 1rem;">${displayName} Buttons</h3>`;
  
  buttons.forEach((value, index) => {
    html += `
      <div class="button-edit-item">
        <input type="text" value="${value || ''}" data-index="${index}" placeholder="Button label" />
        <button class="delete-item-btn" data-index="${index}">Delete</button>
      </div>
    `;
  });
  
  html += `<button class="add-item-btn" onclick="addButtonItem('${tabType}')">+ Add Button</button>`;
  
  buttonEditContent.innerHTML = html;
  
  // Setup delete buttons
  buttonEditContent.querySelectorAll(".delete-item-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index);
      buttonConfig[tabType].splice(index, 1);
      renderEditTab(tabType);
    });
  });
  
  // Setup input change handlers
  buttonEditContent.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", (e) => {
      const index = parseInt(e.target.dataset.index);
      buttonConfig[tabType][index] = e.target.value;
    });
  });
}

function addButtonItem(tabType) {
  if (!buttonConfig[tabType]) {
    buttonConfig[tabType] = [];
  }
  buttonConfig[tabType].push("");
  renderEditTab(tabType);
}

// Make addButtonItem globally accessible
window.addButtonItem = addButtonItem;

// Add Category Button
const addCategoryBtn = document.getElementById("addCategoryBtn");
if (addCategoryBtn) {
  addCategoryBtn.addEventListener("click", () => {
    const newKey = `category${Date.now()}`;
    const newCategory = {
      key: newKey,
      label: "New Category"
    };
    categoryConfig.push(newCategory);
    buttonConfig[newKey] = [];
    renderCategoryList();
    renderEditTabs();
    currentEditTab = newKey;
    renderEditTab(newKey);
    
    // Activate the new tab
    if (buttonEditTabs) {
      buttonEditTabs.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.remove("active");
        if (b.dataset.tab === newKey) b.classList.add("active");
      });
    }
  });
}

// Modal open/close
if (openEventEditModalBtn) {
  openEventEditModalBtn.addEventListener("click", () => {
    renderCategoryList();
    renderEditTabs();
    if (categoryConfig.length > 0) {
      currentEditTab = categoryConfig[0].key;
      renderEditTab(currentEditTab);
    }
    eventEditModal.style.display = "block";
  });
}

if (closeEventModal) {
  closeEventModal.addEventListener("click", () => {
    eventEditModal.style.display = "none";
  });
}

if (eventEditModal) {
  eventEditModal.querySelectorAll(".close-event-modal").forEach(btn => {
    btn.addEventListener("click", () => {
      eventEditModal.style.display = "none";
    });
  });

  window.addEventListener("click", e => {
    if (e.target == eventEditModal) eventEditModal.style.display = "none";
  });
}

// Save button configuration
if (saveEventButtonsBtn) {
  saveEventButtonsBtn.addEventListener("click", () => {
    // Remove empty buttons
    Object.keys(buttonConfig).forEach(key => {
      buttonConfig[key] = buttonConfig[key].filter(v => v !== "" && v !== null && v !== undefined);
    });
    
    // Remove categories with empty labels
    categoryConfig = categoryConfig.filter(cat => cat.label && cat.label.trim() !== "");
    
    // Save to localStorage
    localStorage.setItem("categoryConfig", JSON.stringify(categoryConfig));
    localStorage.setItem("buttonConfig", JSON.stringify(buttonConfig));
    
    // Re-render control groups and buttons
    renderControlGroups();
    
    // Re-setup event listeners after re-rendering
    setupAddEventListener();
    setupExportListener();
    
    eventEditModal.style.display = "none";
    showNotification("Configuration saved!", "success");
  });
}