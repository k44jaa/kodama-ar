// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA
// Satte grüne Waldgeister mit extremer Nah-Interaktion
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

      // Weit gestreute Zonen im Raum
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

        // --- SATTES, MAGISCHES WALDGRÜN OHNE WEISS-AUSWASCHUNG ---
        kodama.addEventListener('model-loaded', () => {
          let mesh = kodama.getObject3D('mesh');
          if (mesh) {
            mesh.traverse((node) => {
              if (node.isMesh && node.material) {
                // Eventuelle weiße Texturen entfernen, damit das Grün zu 100% greift
                node.material.map = null;

                // Echte Transparenz statt überbelichtetem AdditiveBlending
                node.material.transparent = true;
                node.material.blending = THREE.NormalBlending;
                node.material.opacity = 0.72;
                node.material.depthWrite = false; // Verhindert Nahtstellen am Hals

                // Tiefes, leuchtendes Wald-Smaragdgrün
                node.material.color = new THREE.Color(0x00d044);
                node.material.emissive = new THREE.Color(0x008828);
                node.material.emissiveIntensity = 0.55;

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
// DYNAMISCHES VERHALTEN MIT NAHKONTAKT VOR DER LINSE
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

    this.floatSpeed = 1.0 + Math.random() * 1.0;
    this.floatHeight = 0.05 + Math.random() * 0.05;
    this.wobbleSpeed = 1.4 + Math.random() * 1.2;
    this.timeOffset = Math.random() * 100;

    this.state = 'WANDER';
    this.targetPos = new THREE.Vector3();
    this.pickZoneTarget();
    this.targetYRotation = this.el.object3D.rotation.y;

    this.scheduleNextDecision();
  },

  scheduleNextDecision: function () {
    let interval = 2500 + Math.random() * 3000;

    setTimeout(() => {
      this.makeDecision();
      this.scheduleNextDecision();
    }, interval);
  },

  makeDecision: function () {
    let rand = Math.random();

    // 25% Chance: Neugierig direkt vor die Linse fliegen
    if (rand < 0.25 && !isAnyKodamaVisitingUser) {
      this.state = 'APPROACH_USER';
      isAnyKodamaVisitingUser = true;

      // Bleibt 6.5 Sekunden direkt vor der Kamera neugierig stehen
      setTimeout(() => {
        if (this.state === 'APPROACH_USER') {
          this.pickZoneTarget();
          this.state = 'RETURN_TO_ZONE';
        }
      }, 6500);

    } else if (rand < 0.80) {
      this.state = 'WANDER';
      this.pickZoneTarget();

    } else if (rand < 0.90) {
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

    // Auf- und Abschweben
    let hoverY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight;

    // Sanftes Neigen / Wackeln
    rot.z = Math.sin(this.timeOffset * this.wobbleSpeed) * 0.14;

    if (this.state === 'HOVER') {
      pos.y = this.data.baseY + hoverY;

    } else if (this.state === 'WANDER') {
      pos.lerp(this.targetPos, deltaSec * 0.7);
      pos.y += hoverY * 0.2;

      if (pos.distanceTo(this.targetPos) < 0.4) {
        this.data.baseY = pos.y;
        this.pickZoneTarget();
      }

    } else if (this.state === 'APPROACH_USER') {
      let camPos = new THREE.Vector3();
      this.cameraEl.object3D.getWorldPosition(camPos);

      let dir = new THREE.Vector3().subVectors(camPos, pos).normalize();

      // Schaut direkt in die Kamera
      this.el.object3D.lookAt(camPos.x, pos.y, camPos.z);

      // Fliegt ganz nah heran: Stoppt erst bei ca. 28 cm direkt vor der Linse!
      if (pos.distanceTo(camPos) > 0.28) {
        pos.x += dir.x * deltaSec * 0.8;
        pos.z += dir.z * deltaSec * 0.8;
      }

      // Richtet sich exakt auf die Augen-/Linsenhöhe der Kamera aus
      pos.y = THREE.MathUtils.lerp(pos.y, camPos.y - 0.05, deltaSec * 1.5) + hoverY * 0.2;

    } else if (this.state === 'RETURN_TO_ZONE') {
      pos.lerp(this.targetPos, deltaSec * 0.65);
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
