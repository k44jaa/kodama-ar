// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA
// 6 Autonome Geister: Traditionell milchig-weiß (undurchsichtig),
// beibehaltene Gesichter (Texture Map), entschleunigte Bewegung
// & ortsfeste Sitzer (Kodamas 3, 4 & 5)
// ============================================================

let isAnyKodamaVisitingUser = false;

// Subtile Sound-Funktion für spontanes, leises Klappern
window.playKodamaSound = function (volFactor = 1.0, pitchFactor = 1.0) {
  try {
    let snd = new Audio('./assets/sound.mp3');
    snd.volume = Math.min(0.08, (0.02 + Math.random() * 0.04) * volFactor);
    snd.playbackRate = (0.85 + Math.random() * 0.35) * pitchFactor;
    snd.play().catch(() => {});
  } catch (e) {}
};

AFRAME.registerComponent('magic-forest', {
  schema: {
    count: { type: 'int', default: 6 }
  },

  init: function () {
    let sceneEl = this.el.sceneEl;

    sceneEl.addEventListener('enter-vr', () => {
      if (this.spawned) return;
      this.spawned = true;

      // 6 weit getrennte Zonen im Raum
      // Kodamas 1, 2, 6 = fliegend | Kodamas 3, 4, 5 = ortsfest sitzend
      const PROFILES = [
        // Kodama 1: Fliegend (Weit Links Vorne, sehr ruhig)
        { modelId: '#kodama-1', isSitting: false, minX: -4.8, maxX: -2.8, minZ: -3.5, maxZ: -2.0, minY: 1.10, maxY: 1.50, speed: 0.45 },
        
        // Kodama 2: Fliegend (Mitte/Rechts, kommt sanft zu Besuch)
        { modelId: '#kodama-2', isSitting: false, minX:  1.0, maxX:  3.2, minZ: -3.8, maxZ: -2.2, minY: 1.00, maxY: 1.40, speed: 0.50 },
        
        // Kodama 3: SITZEND (Sockel/Tisch-Höhe Links - 0.45m)
        { modelId: '#kodama-3', isSitting: true,  minX: -2.5, maxX: -1.2, minZ: -2.8, maxZ: -1.8, minY: 0.45, maxY: 0.45, speed: 0.0 },
        
        // Kodama 4: SITZEND (Boden-Höhe Mitte - 0.25m)
        { modelId: '#kodama-4', isSitting: true,  minX: -0.8, maxX:  0.8, minZ: -4.2, maxZ: -3.2, minY: 0.25, maxY: 0.25, speed: 0.0 },
        
        // Kodama 5: SITZEND (Fensterbank/Tisch-Höhe Rechts - 0.55m)
        { modelId: '#kodama-5', isSitting: true,  minX:  2.2, maxX:  3.8, minZ: -3.2, maxZ: -2.2, minY: 0.55, maxY: 0.55, speed: 0.0 },
        
        // Kodama 6: Fliegend (Hoher Hüter tief im Raum unter der Decke)
        { modelId: '#kodama-6', isSitting: false, minX: -2.0, maxX:  2.0, minZ: -7.0, maxZ: -4.8, minY: 1.90, maxY: 2.30, speed: 0.35 }
      ];

      for (let i = 0; i < Math.min(this.data.count, PROFILES.length); i++) {
        let profile = PROFILES[i];
        let kodama = document.createElement('a-entity');

        kodama.setAttribute('gltf-model', profile.modelId);

        let animSpeed = (0.50 + Math.random() * 0.35).toFixed(2);
        kodama.setAttribute('animation-mixer', `clip: *; loop: repeat; timeScale: ${animSpeed}`);

        let startPos = {
          x: profile.minX + Math.random() * (profile.maxX - profile.minX),
          y: profile.minY + Math.random() * (profile.maxY - profile.minY),
          z: profile.minZ + Math.random() * (profile.maxZ - profile.minZ)
        };

        kodama.setAttribute('position', startPos);
        kodama.setAttribute('rotation', { x: 0, y: Math.random() * 360, z: 0 });

        let scale = (0.11 + Math.random() * 0.02).toFixed(3);
        kodama.setAttribute('scale', `${scale} ${scale} ${scale}`);

        // Material-Anpassung: TRADITIONELL WEISS + BEIBEHALTENE GESICHTER
        kodama.addEventListener('model-loaded', () => {
          let mesh = kodama.getObject3D('mesh');
          if (mesh) {
            mesh.traverse((node) => {
              if (node.isMesh && node.material) {
                // 1. Transparenz & innere Überlappungen komplett deaktivieren
                node.material.transparent = false;
                node.material.depthWrite = true;
                node.material.opacity = 1.0;
                
                // 2. Traditionelle milchig-weiße Porzellan-Farbe setzen
                node.material.color = new THREE.Color(0xf0f5f0);
                node.material.roughness = 0.85; // Mattes Finish
                node.material.metalness = 0.0;
                node.material.emissive = new THREE.Color(0x122016); // Dezent magischer Waldschimmer
                node.material.emissiveIntensity = 0.18;
                
                // 3. WICHTIG: Deine gemalte Textur (Augen & Mund) bleibt aktiv!
                node.material.needsUpdate = true;
              }
            });
          }
        });

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
// AGENTEN-LOGIK: ENTSCHLEUNIGT & STRIKT ORTSFESTE SITZER
// ============================================================
AFRAME.registerComponent('kodama-agent', {
  schema: {
    id: { type: 'int' },
    isSitting: { type: 'boolean', default: false },
    baseScale: { type: 'number', default: 0.12 },
    moveSpeed: { type: 'number', default: 0.5 },
    zoneMinX: { type: 'number' },
    zoneMaxX: { type: 'number' },
    zoneMinZ: { type: 'number' },
    zoneMaxZ: { type: 'number' },
    baseY: { type: 'number', default: 1.2 }
  },

  init: function () {
    this.cameraEl = this.el.sceneEl.camera.el;

    this.breathSpeed = 0.4 + Math.random() * 0.4;
    this.floatSpeed = 0.5 + Math.random() * 0.5;
    this.floatHeight = 0.02 + Math.random() * 0.02;
    this.timeOffset = Math.random() * 100;

    this.targetQuaternion = new THREE.Quaternion();
    this.dummy = new THREE.Object3D();

    this.state = this.data.isSitting ? 'SIT_BREATHE' : 'WANDER';
    this.targetPos = new THREE.Vector3();
    this.pickZoneTarget();

    this.scheduleNextDecision();
  },

  scheduleNextDecision: function () {
    let interval = 6000 + Math.random() * 5000;

    setTimeout(() => {
      this.makeDecision();
      this.scheduleNextDecision();
    }, interval);
  },

  makeDecision: function () {
    let rand = Math.random();

    if (Math.random() < 0.15) {
      window.playKodamaSound(0.7, 1.0);
    }

    if (this.data.isSitting) {
      if (rand < 0.50) {
        this.state = 'SIT_LOOK_AT_USER';
        window.playKodamaSound(0.6, 1.1);
      } else if (rand < 0.85) {
        this.state = 'SIT_ROTATE';
        let randomAngle = (Math.random() - 0.5) * Math.PI * 0.7;
        this.dummy.position.copy(this.el.object3D.position);
        this.dummy.rotation.copy(this.el.object3D.rotation);
        this.dummy.rotation.y += randomAngle;
        this.targetQuaternion.copy(this.dummy.quaternion);
      } else {
        this.state = 'SIT_BREATHE';
      }
    } else {
      if (this.data.id === 1 && rand < 0.20 && !isAnyKodamaVisitingUser) {
        this.state = 'APPROACH_USER';
        isAnyKodamaVisitingUser = true;
        window.playKodamaSound(1.0, 1.2);

        setTimeout(() => {
          if (this.state === 'APPROACH_USER') {
            this.pickZoneTarget();
            this.state = 'RETURN_TO_ZONE';
          }
        }, 9000);

      } else if (rand < 0.75) {
        this.state = 'WANDER';
        this.pickZoneTarget();

      } else {
        this.state = 'ROTATE';
        let randomAngle = (Math.random() - 0.5) * Math.PI * 0.8;
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
      this.data.baseY + (Math.random() * 0.4 - 0.20),
      this.data.zoneMinZ + Math.random() * (this.data.zoneMaxZ - this.data.zoneMinZ)
    );
  },

  smoothLookAt: function (targetVector, deltaSec, speed = 1.2) {
    this.dummy.position.copy(this.el.object3D.position);
    this.dummy.lookAt(targetVector.x, this.el.object3D.position.y, targetVector.z);
    this.el.object3D.quaternion.slerp(this.dummy.quaternion, deltaSec * speed);
  },

  tick: function (time, timeDelta) {
    let deltaSec = timeDelta / 1000;
    this.timeOffset += deltaSec;

    let pos = this.el.object3D.position;

    // --- SITZENDE KODAMAS (3, 4, 5): ORTSFEST & ATMEND ---
    if (this.data.isSitting) {
      let breathCycle = Math.sin(this.timeOffset * this.breathSpeed * 1.2);
      let scaleOffset = breathCycle * 0.015;
      let currentScale = this.data.baseScale + scaleOffset;
      this.el.object3D.scale.set(currentScale, currentScale + (scaleOffset * 0.3), currentScale);

      pos.y = this.data.baseY + (breathCycle * 0.003);

      if (this.state === 'SIT_LOOK_AT_USER') {
        let camPos = new THREE.Vector3();
        this.cameraEl.object3D.getWorldPosition(camPos);
        let lookTarget = new THREE.Vector3().subVectors(pos, camPos).add(pos);
        this.smoothLookAt(lookTarget, deltaSec, 1.2);

      } else if (this.state === 'SIT_ROTATE') {
        this.el.object3D.quaternion.slerp(this.targetQuaternion, deltaSec * 0.8);
      }

      return;
    }

    // --- FLIEGENDE KODAMAS (1, 2, 6): SANFTES GLEITEN ---
    let hoverY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight;

    if (this.state === 'WANDER') {
      let flyTarget = new THREE.Vector3().subVectors(pos, this.targetPos).add(pos);
      this.smoothLookAt(flyTarget, deltaSec, 1.5);

      pos.lerp(this.targetPos, deltaSec * 0.28 * this.data.moveSpeed);
      pos.y += hoverY * 0.10;

      if (pos.distanceTo(this.targetPos) < 0.50) {
        this.data.baseY = pos.y;
        this.pickZoneTarget();
      }

    } else if (this.state === 'APPROACH_USER') {
      let camPos = new THREE.Vector3();
      this.cameraEl.object3D.getWorldPosition(camPos);

      let lookTarget = new THREE.Vector3().subVectors(pos, camPos).add(pos);
      this.smoothLookAt(lookTarget, deltaSec, 1.8);

      let dist = pos.distanceTo(camPos);
      if (dist > 1.0) {
        let dir = new THREE.Vector3().subVectors(camPos, pos).normalize();
        pos.x += dir.x * deltaSec * 0.45 * this.data.moveSpeed;
        pos.z += dir.z * deltaSec * 0.45 * this.data.moveSpeed;
      }

      pos.y = THREE.MathUtils.lerp(pos.y, camPos.y - 0.05, deltaSec * 0.8) + hoverY * 0.1;

    } else if (this.state === 'RETURN_TO_ZONE') {
      let flyTarget = new THREE.Vector3().subVectors(pos, this.targetPos).add(pos);
      this.smoothLookAt(flyTarget, deltaSec, 1.4);

      pos.lerp(this.targetPos, deltaSec * 0.28 * this.data.moveSpeed);
      pos.y += hoverY * 0.10;

      if (pos.distanceTo(this.targetPos) < 0.65) {
        isAnyKodamaVisitingUser = false;
        this.data.baseY = pos.y;
        this.state = 'WANDER';
      }

    } else if (this.state === 'ROTATE') {
      this.el.object3D.quaternion.slerp(this.targetQuaternion, deltaSec * 1.0);
      pos.y = this.data.baseY + hoverY;
    }
  }
});
