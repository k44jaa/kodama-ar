// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA
// 6 Individuelle Waldgeister mit großem Raumabstand & Autonomie
// ============================================================

let isAnyKodamaVisitingUser = false;

AFRAME.registerComponent('magic-forest', {
  schema: {
    count: { type: 'int', default: 6 }
  },

  init: function () {
    let sceneEl = this.el.sceneEl;

    sceneEl.addEventListener('enter-vr', () => {
      if (this.spawned) return;
      this.spawned = true;

      // 6 weit voneinander getrennte Zonen für maximalen Raumabstand
      const PROFILES = [
        // Kodama 1: Sitzender Geist (Links Vorne auf Tisch/Bank-Höhe)
        { modelId: '#kodama-1', isSitting: true,  minX: -3.8, maxX: -2.2, minZ: -3.0, maxZ: -1.8, minY: 0.45, maxY: 0.70, speed: 0.7 },
        
        // Kodama 2: Neugieriger Flieger (Zentrum Mitte - kommt gerne zu Besuch)
        { modelId: '#kodama-2', isSitting: false, minX: -1.2, maxX:  1.2, minZ: -3.8, maxZ: -2.2, minY: 1.00, maxY: 1.50, speed: 1.1 },
        
        // Kodama 3: Hoher Hüter (Gleitet weit oben unter der Decke)
        { modelId: '#kodama-3', isSitting: false, minX: -2.5, maxX:  2.5, minZ: -5.0, maxZ: -3.0, minY: 1.85, maxY: 2.45, speed: 0.6 },
        
        // Kodama 4: Sitzender Beobachter (Rechts Vorne auf niedriger Höhe)
        { modelId: '#kodama-4', isSitting: true,  minX:  2.2, maxX:  3.8, minZ: -3.0, maxZ: -1.8, minY: 0.30, maxY: 0.55, speed: 0.8 },
        
        // Kodama 5: Tiefer Waldgeist (Far Left Background)
        { modelId: '#kodama-5', isSitting: false, minX: -4.5, maxX: -2.8, minZ: -6.5, maxZ: -4.2, minY: 0.90, maxY: 1.60, speed: 0.95 },
        
        // Kodama 6: Dynamischer Wanderer (Far Right Background)
        { modelId: '#kodama-6', isSitting: false, minX:  2.8, maxX:  4.5, minZ: -6.5, maxZ: -4.2, minY: 1.10, maxY: 1.70, speed: 1.2 }
      ];

      for (let i = 0; i < Math.min(this.data.count, PROFILES.length); i++) {
        let profile = PROFILES[i];
        let kodama = document.createElement('a-entity');

        // 1. Zuweisung des spezifischen 3D-Modells
        kodama.setAttribute('gltf-model', profile.modelId);

        // 2. Aktivierung der in Blender gebackenen Animationen (Kopfwackeln/Atmen)
        let animSpeed = (0.75 + Math.random() * 0.5).toFixed(2);
        kodama.setAttribute('animation-mixer', `clip: *; loop: repeat; timeScale: ${animSpeed}`);

        let startPos = {
          x: profile.minX + Math.random() * (profile.maxX - profile.minX),
          y: profile.minY + Math.random() * (profile.maxY - profile.minY),
          z: profile.minZ + Math.random() * (profile.maxZ - profile.minZ)
        };

        kodama.setAttribute('position', startPos);
        kodama.setAttribute('rotation', { x: 0, y: Math.random() * 360, z: 0 });

        let scale = (0.11 + Math.random() * 0.03).toFixed(3);
        kodama.setAttribute('scale', `${scale} ${scale} ${scale}`);

        // Material: Durchscheinender, geisterhafter Look
        kodama.addEventListener('model-loaded', () => {
          let mesh = kodama.getObject3D('mesh');
          if (mesh) {
            mesh.traverse((node) => {
              if (node.isMesh && node.material) {
                node.material.transparent = true;
                node.material.depthWrite = false;
                node.material.opacity = 0.50;
                node.material.roughness = 0.90;
                node.material.metalness = 0.0;
                node.material.emissive = new THREE.Color(0x1a3322);
                node.material.emissiveIntensity = 0.35;
                node.material.needsUpdate = true;
              }
            });
          }
        });

        // 3. Individuelle Agenten-Logik
        kodama.setAttribute('kodama-agent', {
          id: i,
          isSitting: profile.isSitting,
          baseScale: parseFloat(scale),
          moveSpeed: profile.speed,
          zoneMinX: profile.minX,
          zoneMaxX: profile.maxX,
          zoneMinZ: profile.minZ,
          zoneMaxZ: profile.maxZ,
          baseY: startPos.y
        });

        sceneEl.appendChild(kodama);
      }
    });
  }
});

// ============================================================
// AGENTEN-VERHALTEN MIT INDIVIDUELLEN DYNAMIKEN & SLERP-DREHUNGEN
// ============================================================
AFRAME.registerComponent('kodama-agent', {
  schema: {
    id: { type: 'int' },
    isSitting: { type: 'boolean', default: false },
    baseScale: { type: 'number', default: 0.12 },
    moveSpeed: { type: 'number', default: 1.0 },
    zoneMinX: { type: 'number' },
    zoneMaxX: { type: 'number' },
    zoneMinZ: { type: 'number' },
    zoneMaxZ: { type: 'number' },
    baseY: { type: 'number', default: 1.2 }
  },

  init: function () {
    this.cameraEl = this.el.sceneEl.camera.el;

    this.breathSpeed = 0.7 + Math.random() * 0.6;
    this.floatSpeed = 0.8 + Math.random() * 0.8;
    this.floatHeight = 0.03 + Math.random() * 0.04;
    this.timeOffset = Math.random() * 100;

    this.targetQuaternion = new THREE.Quaternion();
    this.dummy = new THREE.Object3D();

    this.state = this.data.isSitting ? 'SIT_BREATHE' : 'WANDER';
    this.targetPos = new THREE.Vector3();
    this.pickZoneTarget();

    this.scheduleNextDecision();
  },

  scheduleNextDecision: function () {
    let interval = 3500 + Math.random() * 4000;

    setTimeout(() => {
      this.makeDecision();
      this.scheduleNextDecision();
    }, interval);
  },

  makeDecision: function () {
    let rand = Math.random();

    if (this.data.isSitting) {
      if (rand < 0.40) {
        this.state = 'SIT_LOOK_AT_USER';
      } else if (rand < 0.75) {
        this.state = 'SIT_ROTATE';
        let randomAngle = (Math.random() - 0.5) * Math.PI * 0.9;
        this.dummy.position.copy(this.el.object3D.position);
        this.dummy.rotation.copy(this.el.object3D.rotation);
        this.dummy.rotation.y += randomAngle;
        this.targetQuaternion.copy(this.dummy.quaternion);
      } else {
        this.state = 'SIT_BREATHE';
      }
    } else {
      // Nur Kodama 2 und 6 besuchen gelegentlich die Kamera
      if ((this.data.id === 1 || this.data.id === 5) && rand < 0.25 && !isAnyKodamaVisitingUser) {
        this.state = 'APPROACH_USER';
        isAnyKodamaVisitingUser = true;

        setTimeout(() => {
          if (this.state === 'APPROACH_USER') {
            this.pickZoneTarget();
            this.state = 'RETURN_TO_ZONE';
          }
        }, 8500);

      } else if (rand < 0.80) {
        this.state = 'WANDER';
        this.pickZoneTarget();

      } else {
        this.state = 'ROTATE';
        let randomAngle = (Math.random() - 0.5) * Math.PI * 1.2;
        this.dummy.position.copy(this.el.object3D.position);
        this.dummy.rotation.copy(this.el.object3D.rotation);
        this.dummy.rotation.y += randomAngle;
        this.targetQuaternion.copy(this.dummy.quaternion);
      }
    }
  },

  pickZoneTarget: function () {
    this.targetPos.set(
      this.data.zoneMinX + Math.random() * (this.data.zoneMaxX - this.data.zoneMinX),
      this.data.baseY + (Math.random() * 0.6 - 0.30),
      this.data.zoneMinZ + Math.random() * (this.data.zoneMaxZ - this.data.zoneMinZ)
    );
  },

  smoothLookAt: function (targetVector, deltaSec, speed = 2.4) {
    this.dummy.position.copy(this.el.object3D.position);
    this.dummy.lookAt(targetVector.x, this.el.object3D.position.y, targetVector.z);
    this.el.object3D.quaternion.slerp(this.dummy.quaternion, deltaSec * speed);
  },

  tick: function (time, timeDelta) {
    let deltaSec = timeDelta / 1000;
    this.timeOffset += deltaSec;

    let pos = this.el.object3D.position;

    // --- SITZENDE KODAMAS (ATEM-EFFEKT & ORTSFEST) ---
    if (this.data.isSitting) {
      let breathCycle = Math.sin(this.timeOffset * this.breathSpeed * 1.5);
      let scaleOffset = breathCycle * 0.02;
      let currentScale = this.data.baseScale + scaleOffset;
      this.el.object3D.scale.set(currentScale, currentScale + (scaleOffset * 0.4), currentScale);

      pos.y = this.data.baseY + (breathCycle * 0.006);

      if (this.state === 'SIT_LOOK_AT_USER') {
        let camPos = new THREE.Vector3();
        this.cameraEl.object3D.getWorldPosition(camPos);
        let lookTarget = new THREE.Vector3().subVectors(pos, camPos).add(pos);
        this.smoothLookAt(lookTarget, deltaSec, 1.8);

      } else if (this.state === 'SIT_ROTATE') {
        this.el.object3D.quaternion.slerp(this.targetQuaternion, deltaSec * 1.2);
      }

      return;
    }

    // --- FLIEGENDE KODAMAS (RAUM-WANDERUNG) ---
    let hoverY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight;

    if (this.state === 'WANDER') {
      let flyTarget = new THREE.Vector3().subVectors(pos, this.targetPos).add(pos);
      this.smoothLookAt(flyTarget, deltaSec, 2.5);

      pos.lerp(this.targetPos, deltaSec * 0.55 * this.data.moveSpeed);
      pos.y += hoverY * 0.15;

      if (pos.distanceTo(this.targetPos) < 0.50) {
        this.data.baseY = pos.y;
        this.pickZoneTarget();
      }

    } else if (this.state === 'APPROACH_USER') {
      let camPos = new THREE.Vector3();
      this.cameraEl.object3D.getWorldPosition(camPos);

      let lookTarget = new THREE.Vector3().subVectors(pos, camPos).add(pos);
      this.smoothLookAt(lookTarget, deltaSec, 3.0);

      // Angenehme Respekt-Distanz vor dem Handy (ca. 85 cm)
      let dist = pos.distanceTo(camPos);
      if (dist > 0.85) {
        let dir = new THREE.Vector3().subVectors(camPos, pos).normalize();
        pos.x += dir.x * deltaSec * 0.9 * this.data.moveSpeed;
        pos.z += dir.z * deltaSec * 0.9 * this.data.moveSpeed;
      }

      pos.y = THREE.MathUtils.lerp(pos.y, camPos.y - 0.05, deltaSec * 1.2) + hoverY * 0.1;

    } else if (this.state === 'RETURN_TO_ZONE') {
      let flyTarget = new THREE.Vector3().subVectors(pos, this.targetPos).add(pos);
      this.smoothLookAt(flyTarget, deltaSec, 2.2);

      pos.lerp(this.targetPos, deltaSec * 0.55 * this.data.moveSpeed);
      pos.y += hoverY * 0.15;

      if (pos.distanceTo(this.targetPos) < 0.65) {
        isAnyKodamaVisitingUser = false;
        this.data.baseY = pos.y;
        this.state = 'WANDER';
      }

    } else if (this.state === 'ROTATE') {
      this.el.object3D.quaternion.slerp(this.targetQuaternion, deltaSec * 1.8);
      pos.y = this.data.baseY + hoverY;
    }
  }
});
