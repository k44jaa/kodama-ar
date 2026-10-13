// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA
// 10 autonome Waldgeister, weit gestreut im Raum
// ============================================================

let isAnyKodamaVisitingUser = false;

AFRAME.registerComponent('magic-forest', {
  schema: {
    count: { type: 'int', default: 10 } // Jetzt 10 eigenständige Kodamas!
  },

  init: function () {
    let sceneEl = this.el.sceneEl;

    sceneEl.addEventListener('enter-vr', () => {
      if (this.spawned) return;
      this.spawned = true;

      // 8 weit gestreute Raum-Zonen in Tiefe, Höhe und Breite
      const ZONES = [
        { name: "Weit Links Hinten", minX: -5.0, maxX: -3.0, minZ: -6.5, maxZ: -4.5, minY: 1.0, maxY: 1.6 },
        { name: "Links Vorne",       minX: -4.2, maxX: -2.2, minZ: -3.8, maxZ: -2.0, minY: 0.8, maxY: 1.4 },
        { name: "Zentrum Hinten",    minX: -1.5, maxX:  1.5, minZ: -8.0, maxZ: -6.0, minY: 1.2, maxY: 1.9 },
        { name: "Zentrum Mitte",     minX: -1.8, maxX:  1.8, minZ: -4.8, maxZ: -3.2, minY: 0.9, maxY: 1.5 },
        { name: "Weit Rechts Hinten",minX:  3.0, maxX:  5.0, minZ: -6.5, maxZ: -4.5, minY: 1.1, maxY: 1.7 },
        { name: "Rechts Vorne",      minX:  2.2, maxX:  4.2, minZ: -3.8, maxZ: -2.0, minY: 0.8, maxY: 1.4 },
        { name: "Hoch Oben Links",   minX: -3.0, maxX: -0.5, minZ: -5.0, maxZ: -2.5, minY: 1.8, maxY: 2.5 },
        { name: "Hoch Oben Rechts",  minX:  0.5, maxX:  3.0, minZ: -5.0, maxZ: -2.5, minY: 1.8, maxY: 2.5 }
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

        // Leicht variierende Größen für ein natürliches Völkchen
        let scale = (0.11 + Math.random() * 0.05).toFixed(3);
        kodama.setAttribute('scale', `${scale} ${scale} ${scale}`);

        // Material: Originalfarben beibehalten, matt & sanft durchscheinend
        kodama.addEventListener('model-loaded', () => {
          let mesh = kodama.getObject3D('mesh');
          if (mesh) {
            mesh.traverse((node) => {
              if (node.isMesh && node.material) {
                node.material.transparent = true;
                node.material.depthWrite = false;
                node.material.opacity = 0.82;
                node.material.roughness = 0.95;
                node.material.metalness = 0.0;
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
// INDIVIDUELLE AGENTEN-STEUERUNG
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

    this.floatSpeed = 0.9 + Math.random() * 0.9;
    this.floatHeight = 0.04 + Math.random() * 0.05;
    this.wobbleSpeed = 1.3 + Math.random() * 1.1;
    this.timeOffset = Math.random() * 100;

    this.state = 'WANDER';
    this.targetPos = new THREE.Vector3();
    this.pickZoneTarget();
    this.targetYRotation = this.el.object3D.rotation.y;

    this.scheduleNextDecision();
  },

  scheduleNextDecision: function () {
    let interval = 2800 + Math.random() * 3500;

    setTimeout(() => {
      this.makeDecision();
      this.scheduleNextDecision();
    }, interval);
  },

  makeDecision: function () {
    let rand = Math.random();

    // Bei 10 Wesen senken wir die Chance leicht auf 15%, damit nicht ständig Unruhe am Display herrscht
    if (rand < 0.15 && !isAnyKodamaVisitingUser) {
      this.state = 'APPROACH_USER';
      isAnyKodamaVisitingUser = true;

      setTimeout(() => {
        if (this.state === 'APPROACH_USER') {
          this.pickZoneTarget();
          this.state = 'RETURN_TO_ZONE';
        }
      }, 7500);

    } else if (rand < 0.75) {
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
      this.data.baseY + (Math.random() * 0.7 - 0.35),
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
      let flyTarget = new THREE.Vector3().subVectors(pos, this.targetPos).add(pos);
      this.el.object3D.lookAt(flyTarget.x, pos.y, flyTarget.z);

      pos.lerp(this.targetPos, deltaSec * 0.65);
      pos.y += hoverY * 0.2;
      rot.z = Math.sin(this.timeOffset * this.wobbleSpeed) * 0.14;

      if (pos.distanceTo(this.targetPos) < 0.45) {
        this.data.baseY = pos.y;
        this.pickZoneTarget();
      }

    } else if (this.state === 'APPROACH_USER') {
      let camPos = new THREE.Vector3();
      this.cameraEl.object3D.getWorldPosition(camPos);

      // Schaut frontal in die Handylinse
      let lookTarget = new THREE.Vector3().subVectors(pos, camPos).add(pos);
      this.el.object3D.lookAt(lookTarget.x, camPos.y, lookTarget.z);

      rot.z = Math.sin(this.timeOffset * this.wobbleSpeed) * 0.15;

      // Stoppt ganz nah (ca. 35 cm) vor der Kamera
      let dist = pos.distanceTo(camPos);
      if (dist > 0.35) {
        let dir = new THREE.Vector3().subVectors(camPos, pos).normalize();
        pos.x += dir.x * deltaSec * 1.1;
        pos.z += dir.z * deltaSec * 1.1;
      }

      pos.y = THREE.MathUtils.lerp(pos.y, camPos.y - 0.05, deltaSec * 1.5) + hoverY * 0.15;

    } else if (this.state === 'RETURN_TO_ZONE') {
      let flyTarget = new THREE.Vector3().subVectors(pos, this.targetPos).add(pos);
      this.el.object3D.lookAt(flyTarget.x, pos.y, flyTarget.z);

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
