// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA
// Autonome Wesen, Zonen-Territorien & Ätherischer Geister-Look
// ============================================================

// Stellt sicher, dass immer nur maximal 1 Geist zur gleichen Zeit zum User fliegt
let isAnyKodamaVisitingUser = false;

AFRAME.registerComponent('magic-forest', {
  schema: {
    count: { type: 'int', default: 4 } // 4 eigenständige Geister
  },

  init: function () {
    let sceneEl = this.el.sceneEl;

    sceneEl.addEventListener('enter-vr', () => {
      if (this.spawned) return;
      this.spawned = true;

      // 4 weit gestreute Raum-Territorien (Links, Weit Hinten, Rechts, Oben/Mitte)
      const ZONES = [
        { name: "Links",       minX: -4.5, maxX: -2.8, minZ: -4.5, maxZ: -2.5, minY: 1.0, maxY: 1.6 },
        { name: "Weit Hinten", minX: -1.8, maxX:  1.8, minZ: -7.5, maxZ: -5.5, minY: 1.2, maxY: 1.9 },
        { name: "Rechts",      minX:  2.8, maxX:  4.5, minZ: -4.5, maxZ: -2.5, minY: 0.9, maxY: 1.5 },
        { name: "Hoch/Mitte",  minX: -1.5, maxX:  2.0, minZ: -3.5, maxZ: -2.0, minY: 1.8, maxY: 2.4 }
      ];

      for (let i = 0; i < this.data.count; i++) {
        let zone = ZONES[i % ZONES.length];
        let kodama = document.createElement('a-entity');

        kodama.setAttribute('gltf-model', '#kodama-model');

        // Startposition innerhalb der zugewiesenen Zone
        let startPos = {
          x: zone.minX + Math.random() * (zone.maxX - zone.minX),
          y: zone.minY + Math.random() * (zone.maxY - zone.minY),
          z: zone.minZ + Math.random() * (zone.maxZ - zone.minZ)
        };
        kodama.setAttribute('position', startPos);

        // Zufällige Start-Blickrichtung (0-360°)
        kodama.setAttribute('rotation', { x: 0, y: Math.random() * 360, z: 0 });

        // Individuelle Skalierung
        let scale = (0.13 + Math.random() * 0.04).toFixed(3);
        kodama.setAttribute('scale', `${scale} ${scale} ${scale}`);

        // --- ÄTHERISCHER GEISTER-EFFEKT (Löst Ballon-Look & Überlappungsnähte) ---
        kodama.addEventListener('model-loaded', () => {
          let mesh = kodama.getObject3D('mesh');
          if (mesh) {
            mesh.traverse((node) => {
              if (node.isMesh && node.material) {
                // Additives Blending lässt den Geist wie reines Licht leuchten
                node.material.transparent = true;
                node.material.blending = THREE.AdditiveBlending;
                node.material.opacity = 0.75;
                node.material.depthWrite = false; // Verhindert Kanten-Flackern & Nahtlinien
                
                // Sanftes, übernatürliches Eigenleuchten (blasses Mintgrün / Weiß)
                node.material.emissive = new THREE.Color(0x99ffdd);
                node.material.emissiveIntensity = 0.45;
                node.material.needsUpdate = true;
              }
            });
          }
        });

        // Autonome Agenten-Steuerung
        kodama.setAttribute('kodama-agent', {
          id: i,
          zoneMinX: zone.minX,
          zoneMaxX: zone.maxX,
          zoneMinZ: zone.minZ,
          zoneMaxZ: zone.maxZ,
          baseY: startPos.y
        });

        sceneEl.appendChild(kodama);
      }
    });
  }
});

// ============================================================
// FINITE STATE MACHINE (AUTONOMES VERHALTEN PRO KODAMA)
// ============================================================
AFRAME.registerComponent('kodama-agent', {
  schema: {
    id: { type: 'int' },
    zoneMinX: { type: 'number' },
    zoneMaxX: { type: 'number' },
    zoneMinZ: { type: 'number' },
    zoneMaxZ: { type: 'number' },
    baseY: { type: 'number', default: 1.2 }
  },

  init: function () {
    this.cameraEl = this.el.sceneEl.camera.el;

    // Individuelle Rhythmen für Schwebung und Kopfwackeln
    this.floatSpeed = 0.8 + Math.random() * 0.8;
    this.floatHeight = 0.05 + Math.random() * 0.06;
    this.wobbleSpeed = 1.2 + Math.random() * 1.0;
    this.timeOffset = Math.random() * 100;

    // Zustände: 'HOVER', 'WANDER', 'APPROACH_USER', 'RETURN_TO_ZONE', 'ROTATE'
    this.state = 'HOVER';
    this.targetPos = new THREE.Vector3();
    this.targetYRotation = this.el.object3D.rotation.y;

    this.scheduleNextDecision();
  },

  scheduleNextDecision: function () {
    // Alle 6 bis 14 Sekunden trifft das Wesen spontan eine neue Entscheidung
    let interval = 6000 + Math.random() * 8000;

    setTimeout(() => {
      this.makeDecision();
      this.scheduleNextDecision();
    }, interval);
  },

  makeDecision: function () {
    let rand = Math.random();

    // 20% Chance: Neugierig zum User fliegen (nur wenn kein anderer gerade dort ist)
    if (rand < 0.20 && !isAnyKodamaVisitingUser) {
      this.state = 'APPROACH_USER';
      isAnyKodamaVisitingUser = true;

      // Nach 7 Sekunden Neugier kehrt das Wesen automatisch in sein Territorium zurück
      setTimeout(() => {
        if (this.state === 'APPROACH_USER') {
          this.pickZoneTarget();
          this.state = 'RETURN_TO_ZONE';
        }
      }, 7000);

    } else if (rand < 0.65) {
      // 45% Chance: Im eigenen Territorium umherwandern
      this.state = 'WANDER';
      this.pickZoneTarget();

    } else if (rand < 0.85) {
      // 20% Chance: Ruhig am Platz schweben
      this.state = 'HOVER';

    } else {
      // 15% Chance: Neugierig im Kreis drehen
      this.state = 'ROTATE';
      this.targetYRotation = this.el.object3D.rotation.y + (Math.PI * (Math.random() > 0.5 ? 0.8 : -0.8));
    }
  },

  pickZoneTarget: function () {
    this.targetPos.set(
      this.data.zoneMinX + Math.random() * (this.data.zoneMaxX - this.data.zoneMinX),
      this.data.baseY + (Math.random() * 0.5 - 0.25),
      this.data.zoneMinZ + Math.random() * (this.data.zoneMaxZ - this.data.zoneMinZ)
    );
  },

  tick: function (time, timeDelta) {
    let deltaSec = timeDelta / 1000;
    this.timeOffset += deltaSec;

    let pos = this.el.object3D.position;
    let rot = this.el.object3D.rotation;

    // 1. Organisches Auf-und-Ab-Schweben
    let hoverY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight;

    // 2. Niedliches, geisterhaftes Neigen / Kopfwackeln
    rot.z = Math.sin(this.timeOffset * this.wobbleSpeed) * 0.12;

    // 3. Ausführung der autonomen Zustände
    if (this.state === 'HOVER') {
      pos.y = this.data.baseY + hoverY;

    } else if (this.state === 'WANDER') {
      pos.lerp(this.targetPos, deltaSec * 0.35);
      pos.y += hoverY * 0.1;

      if (pos.distanceTo(this.targetPos) < 0.5) {
        this.data.baseY = pos.y;
        this.state = 'HOVER';
      }

    } else if (this.state === 'APPROACH_USER') {
      let camPos = new THREE.Vector3();
      this.cameraEl.object3D.getWorldPosition(camPos);

      let dir = new THREE.Vector3().subVectors(camPos, pos).normalize();

      // Blickkontakt zur Smartphone-Kamera halten
      this.el.object3D.lookAt(camPos.x, pos.y, camPos.z);

      // Sanft heranfliegen, hält bei 1,8m Abstand respektvoll an
      if (pos.distanceTo(camPos) > 1.8) {
        pos.x += dir.x * deltaSec * 0.4;
        pos.z += dir.z * deltaSec * 0.4;
      }
      pos.y = this.data.baseY + hoverY;

    } else if (this.state === 'RETURN_TO_ZONE') {
      pos.lerp(this.targetPos, deltaSec * 0.4);
      pos.y += hoverY * 0.1;

      if (pos.distanceTo(this.targetPos) < 0.6) {
        isAnyKodamaVisitingUser = false;
        this.data.baseY = pos.y;
        this.state = 'HOVER';
      }

    } else if (this.state === 'ROTATE') {
      rot.y = THREE.MathUtils.lerp(rot.y, this.targetYRotation, deltaSec * 1.5);
      pos.y = this.data.baseY + hoverY;
    }
  }
});
