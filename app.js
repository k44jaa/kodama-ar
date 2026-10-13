// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA
// Natürliche Ursprungsfarbe, matter Geister-Look & Nahkontakt
// ============================================================

let isAnyKodamaVisitingUser = false;

AFRAME.registerComponent('magic-forest', {
  schema: {
    count: { type: 'int', default: 4 }
  },

  init: function () {
    let sceneEl = this.el.sceneEl;

    sceneEl.addEventListener('enter-vr', () => {
      if (this.spawned) return;
      this.spawned = true;

      // Großzügig verteilte Territorien im Raum
      const ZONES = [
        { name: "Links",       minX: -4.8, maxX: -2.4, minZ: -5.0, maxZ: -2.0, minY: 0.9, maxY: 1.7 },
        { name: "Weit Hinten", minX: -2.2, maxX:  2.2, minZ: -7.5, maxZ: -5.0, minY: 1.1, maxY: 2.0 },
        { name: "Rechts",      minX:  2.4, maxX:  4.8, minZ: -5.0, maxZ: -2.0, minY: 0.8, maxY: 1.6 },
        { name: "Hoch/Mitte",  minX: -2.0, maxX:  2.0, minZ: -4.0, maxZ: -1.8, minY: 1.7, maxY: 2.5 }
      ];

      for (let i = 0; i < this.data.count; i++) {
        let zone = ZONES[i % ZONES.length];
        let kodama = document.createElement('a-entity');

        kodama.setAttribute('gltf-model', '#kodama-model');

        let startPos = {
          x: zone.minX + Math.random() * (zone.maxX - zone.minX),
          y: zone.minY + Math.random() * (zone.maxY - zone.minY),
          z: zone.minZ + Math.random() * (zone.maxZ - zone.minZ)
        };
        kodama.setAttribute('position', startPos);
        kodama.setAttribute('rotation', { x: 0, y: Math.random() * 360, z: 0 });

        let scale = (0.13 + Math.random() * 0.04).toFixed(3);
        kodama.setAttribute('scale', `${scale} ${scale} ${scale}`);

        // --- DEINE URSPRUNGSFARBE & MATTER GEISTER-LOOK ---
        kodama.addEventListener('model-loaded', () => {
          let mesh = kodama.getObject3D('mesh');
          if (mesh) {
            mesh.traverse((node) => {
              if (node.isMesh && node.material) {
                // Behält deine originale Farbgebung & Augen aus Blender bei
                node.material.transparent = true;
                node.material.depthWrite = false; // Verhindert Nahtstellen am Hals
                node.material.opacity = 0.82;      // Sanft geisterhaft durchscheinend

                // ANTI-BALLON-EFFEKT: Matte Oberfläche ohne glänzende Plastik-Highlights
                node.material.roughness = 0.95;
                node.material.metalness = 0.0;

                // Sehr dezenter, organischer Waldgeist-Schimmer im Hintergrund
                node.material.emissive = new THREE.Color(0x182c1e);
                node.material.emissiveIntensity = 0.25;

                node.material.needsUpdate = true;
              }
            });
          }
        });

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
// DYNAMISCHES VERHALTEN & GESICHTSKONTAKT ZUM USER
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

    this.floatSpeed = 1.0 + Math.random() * 0.8;
    this.floatHeight = 0.05 + Math.random() * 0.05;
    this.wobbleSpeed = 1.4 + Math.random() * 1.0;
    this.timeOffset = Math.random() * 100;

    this.state = 'WANDER';
    this.targetPos = new THREE.Vector3();
    this.pickZoneTarget();
    this.targetYRotation = this.el.object3D.rotation.y;

    this.scheduleNextDecision();
  },

  scheduleNextDecision: function () {
    let interval = 3000 + Math.random() * 3500;

    setTimeout(() => {
      this.makeDecision();
      this.scheduleNextDecision();
    }, interval);
  },

  makeDecision: function () {
    let rand = Math.random();

    // 25% Chance: Neugierig direkt zur Kameralinse gleiten
    if (rand < 0.25 && !isAnyKodamaVisitingUser) {
      this.state = 'APPROACH_USER';
      isAnyKodamaVisitingUser = true;

      // Bleibt 8 Sekunden beim User, damit genug Zeit für Besuch & Blickkontakt bleibt
      setTimeout(() => {
        if (this.state === 'APPROACH_USER') {
          this.pickZoneTarget();
          this.state = 'RETURN_TO_ZONE';
        }
      }, 8000);

    } else if (rand < 0.80) {
      // Wandern im eigenen Territorium
      this.state = 'WANDER';
      this.pickZoneTarget();

    } else if (rand < 0.90) {
      // Neugierig umdrehen
      this.state = 'ROTATE';
      this.targetYRotation = this.el.object3D.rotation.y + (Math.PI * (Math.random() > 0.5 ? 0.9 : -0.9));

    } else {
      this.state = 'HOVER';
    }
  },

  pickZoneTarget: function () {
    this.targetPos.set(
      this.data.zoneMinX + Math.random() * (this.data.zoneMaxX - this.data.zoneMinX),
      this.data.baseY + (Math.random() * 0.8 - 0.4),
      this.data.zoneMinZ + Math.random() * (this.data.zoneMaxZ - this.data.zoneMinZ)
    );
  },

  tick: function (time, timeDelta) {
    let deltaSec = timeDelta / 1000;
    this.timeOffset += deltaSec;

    let pos = this.el.object3D.position;
    let rot = this.el.object3D.rotation;

    let hoverY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight;

    if (this.state === 'HOVER') {
      pos.y = this.data.baseY + hoverY;
      rot.z = Math.sin(this.timeOffset * this.wobbleSpeed) * 0.12;

    } else if (this.state === 'WANDER') {
      // Schaut in Flugrichtung
      let flyTarget = new THREE.Vector3().subVectors(pos, this.targetPos).add(pos);
      this.el.object3D.lookAt(flyTarget.x, pos.y, flyTarget.z);

      pos.lerp(this.targetPos, deltaSec * 0.7);
      pos.y += hoverY * 0.2;
      rot.z = Math.sin(this.timeOffset * this.wobbleSpeed) * 0.14;

      if (pos.distanceTo(this.targetPos) < 0.4) {
        this.data.baseY = pos.y;
        this.pickZoneTarget();
      }

    } else if (this.state === 'APPROACH_USER') {
      let camPos = new THREE.Vector3();
      this.cameraEl.object3D.getWorldPosition(camPos);

      // RICHTET DAS GESICHT FRONTAL ZUM USER AUS:
      // Wir spiegeln den Zielvektor, damit die Frontseite (+Z) direkt in deine Handylinse blickt
      let lookTarget = new THREE.Vector3().subVectors(pos, camPos).add(pos);
      this.el.object3D.lookAt(lookTarget.x, camPos.y, lookTarget.z);

      // Neugieriges Neigen des Kopfes während des Blickkontakts
      rot.z = Math.sin(this.timeOffset * this.wobbleSpeed) * 0.15;

      // Gleitet zügig heran und stoppt ganz nah (ca. 35 cm vor der Handylinse)
      let dist = pos.distanceTo(camPos);
      if (dist > 0.35) {
        let dir = new THREE.Vector3().subVectors(camPos, pos).normalize();
        pos.x += dir.x * deltaSec * 1.1;
        pos.z += dir.z * deltaSec * 1.1;
      }

      // Richtet sich exakt auf Linsenhöhe aus
      pos.y = THREE.MathUtils.lerp(pos.y, camPos.y - 0.05, deltaSec * 1.5) + hoverY * 0.15;

    } else if (this.state === 'RETURN_TO_ZONE') {
      let flyTarget = new THREE.Vector3().subVectors(pos, this.targetPos).add(pos);
      this.el.object3D.lookAt(flyTarget.x, pos.y, flyTarget.z);

      pos.lerp(this.targetPos, deltaSec * 0.7);
      pos.y += hoverY * 0.2;

      if (pos.distanceTo(this.targetPos) < 0.6) {
        isAnyKodamaVisitingUser = false;
        this.data.baseY = pos.y;
        this.state = 'WANDER';
      }

    } else if (this.state === 'ROTATE') {
      rot.y = THREE.MathUtils.lerp(rot.y, this.targetYRotation, deltaSec * 2.0);
      pos.y = this.data.baseY + hoverY;
    }
  }
});
