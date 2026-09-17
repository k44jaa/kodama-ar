// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA
// Autonome, unabhängige KI-Wesen in WebXR (FSM-Architektur)
// ============================================================

AFRAME.registerComponent('magic-forest', {
  schema: {
    count: { type: 'int', default: 4 } // Anzahl der eigenständigen Kodamas
  },

  init: function () {
    let sceneEl = this.el.sceneEl;

    sceneEl.addEventListener('enter-vr', () => {
      if (this.spawned) return;
      this.spawned = true;

      let spawnedPositions = [];

      for (let i = 0; i < this.data.count; i++) {
        let kodama = document.createElement('a-entity');
        kodama.setAttribute('gltf-model', '#kodama-model');

        // 1. Automatische Raumverteilung mit Sicherheitsabstand
        let pos = this.generateSpreadPosition(spawnedPositions);
        spawnedPositions.push(pos);
        kodama.setAttribute('position', pos);

        // 2. Zufällige Blickrichtung beim Start (0-360°)
        kodama.setAttribute('rotation', { x: 0, y: Math.random() * 360, z: 0 });

        // 3. Individuelle Größen
        let scale = (0.12 + Math.random() * 0.05).toFixed(3);
        kodama.setAttribute('scale', `${scale} ${scale} ${scale}`);

        // 4. Asynchrone Blender-Animation
        let animSpeed = (0.6 + Math.random() * 0.6).toFixed(2);
        kodama.setAttribute('animation-mixer', `clip: *; loop: repeat; timeScale: ${animSpeed}`);

        // 5. Autonomer Verhaltens-Agent
        kodama.setAttribute('kodama-agent', {
          id: i,
          baseY: pos.y
        });

        sceneEl.appendChild(kodama);
      }
    });
  },

  // Generiert verteilte Positionen ohne Überlappung
  generateSpreadPosition: function (existingPositions) {
    let valid = false;
    let newPos = { x: 0, y: 1.2, z: -2 };
    let attempts = 0;

    while (!valid && attempts < 50) {
      attempts++;
      // Verteilung im Bereich: Links/Rechts (-3.5m bis +3.5m), Tiefe (-1.5m bis -5.5m), Höhe (0.8m bis 2.1m)
      let x = (Math.random() * 7 - 3.5);
      let z = -(1.5 + Math.random() * 4.0);
      let y = 0.8 + Math.random() * 1.3;

      newPos = { x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)), z: parseFloat(z.toFixed(2)) };

      // Prüfen, ob der Abstand zu anderen Kodamas mindestens 1.5 Meter beträgt
      valid = existingPositions.every(p => {
        let dx = p.x - newPos.x;
        let dz = p.z - newPos.z;
        return Math.sqrt(dx * dx + dz * dz) > 1.5;
      });
    }

    return newPos;
  }
});

// ============================================================
// AUTONOMES VERHALTEN (FINITE STATE MACHINE)
// Jeder Kodama entscheidet selbstständig über seine Aktionen
// ============================================================
AFRAME.registerComponent('kodama-agent', {
  schema: {
    id: { type: 'int' },
    baseY: { type: 'number', default: 1.2 }
  },

  init: function () {
    this.cameraEl = this.el.sceneEl.camera.el;
    
    // Individuelle Schwebeparameter
    this.floatSpeed = 0.8 + Math.random() * 1.2;
    this.floatHeight = 0.05 + Math.random() * 0.08;
    this.timeOffset = Math.random() * 100;

    // Zustände: 'HOVER' (Schweben), 'WANDER' (Wandern), 'APPROACH_USER' (User besuchen), 'ROTATE' (Drehen)
    this.state = 'HOVER';
    this.targetPos = new THREE.Vector3();

    // Startet die autonome Entscheidungs-Schleife
    this.scheduleNextDecision();
  },

  scheduleNextDecision: function () {
    // Alle 5 bis 12 Sekunden trifft das Wesen spontan eine neue Entscheidung
    let interval = 5000 + Math.random() * 7000;

    setTimeout(() => {
      this.makeDecision();
      this.scheduleNextDecision();
    }, interval);
  },

  makeDecision: function () {
    let rand = Math.random();

    if (rand < 0.40) {
      // 40% Chance: Ruhiges Schweben am Ort
      this.state = 'HOVER';
    } else if (rand < 0.68) {
      // 28% Chance: Zu einem neuen Ort im Raum wandern
      this.state = 'WANDER';
      this.targetPos.set(
        (Math.random() * 6 - 3),
        this.data.baseY + (Math.random() * 0.6 - 0.3),
        -(1.8 + Math.random() * 3.5)
      );
    } else if (rand < 0.88) {
      // 20% Chance: Neugierig auf den User / die Kamera zufliegen!
      this.state = 'APPROACH_USER';
    } else {
      // 12% Chance: Sich spontan umsehen / im Kreis drehen
      this.state = 'ROTATE';
      this.targetYRotation = this.el.object3D.rotation.y + (Math.PI * (Math.random() > 0.5 ? 1 : -1));
    }
  },

  tick: function (time, timeDelta) {
    let deltaSec = timeDelta / 1000;
    this.timeOffset += deltaSec;

    let pos = this.el.object3D.position;

    // Organische Grundschwebung (Sinus-Welle)
    let hoverY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight;

    // Zustandsabhängige Logik
    if (this.state === 'HOVER') {
      pos.y = this.data.baseY + hoverY;

    } else if (this.state === 'WANDER') {
      // Sanfte Bewegung zur Zielposition
      pos.lerp(this.targetPos, deltaSec * 0.4);
      pos.y += hoverY * 0.2;

      if (pos.distanceTo(this.targetPos) < 0.4) {
        this.data.baseY = pos.y;
        this.state = 'HOVER';
      }

    } else if (this.state === 'APPROACH_USER') {
      // Position der Handy-Kamera ermitteln
      let camPos = new THREE.Vector3();
      this.cameraEl.object3D.getWorldPosition(camPos);

      let dir = new THREE.Vector3().subVectors(camPos, pos).normalize();

      // Blickkontakt zum User halten
      this.el.object3D.lookAt(camPos.x, pos.y, camPos.z);

      // Sanft annähern, aber vor dem User (1.3m Abstand) anhalten
      if (pos.distanceTo(camPos) > 1.3) {
        pos.x += dir.x * deltaSec * 0.3;
        pos.z += dir.z * deltaSec * 0.3;
      }
      pos.y = this.data.baseY + hoverY;

    } else if (this.state === 'ROTATE') {
      // Drehung ausführen
      this.el.object3D.rotation.y = THREE.MathUtils.lerp(
        this.el.object3D.rotation.y,
        this.targetYRotation,
        deltaSec * 1.5
      );
      pos.y = this.data.baseY + hoverY;
    }
  }
});
