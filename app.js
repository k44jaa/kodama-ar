// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA (v14)
// 6 Autonome Geister: Flüssige Gleitbewegung, schwebende Sitzer,
// weite Raumverteilung & konfigurierbarer Modell-Blickwinkel
// ============================================================

// HIER KANNST DU DIE BLICKRICHTUNG DEINER BLENDER-MODELLE ANPASSEN:
// 0 = Standard Three.js Vorwärts (-Z)
// Math.PI = 180° Drehung (falls das Modell andersherum schaut)
// Math.PI / 2 = 90° Drehung (falls das Modell seitlich schaut)
const MODEL_FACE_OFFSET = 0;

let isAnyKodamaVisitingUser = false;
let allKodamaEntities = [];

// Warmes, geschmeidiges Klappern mit Fade-Out
window.playKodamaSound = function (volFactor = 1.0, pitchFactor = 1.0) {
  try {
    let snd = new Audio('./assets/sound.mp3');
    snd.volume = Math.min(0.07, (0.04 + Math.random() * 0.025) * volFactor);
    snd.playbackRate = (0.92 + Math.random() * 0.16) * pitchFactor;
    
    snd.play().then(() => {
      setTimeout(() => {
        let fade = setInterval(() => {
          if (snd.volume > 0.005) {
            snd.volume -= 0.005;
          } else {
            clearInterval(fade);
            snd.pause();
          }
        }, 35);
      }, 750);
    }).catch(() => {});
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
      allKodamaEntities = [];

      // WEITLÄUFIGE ZONEN IM RAUM (X von -5.5m bis +5.5m, Z von -3.5m bis -9.0m)
      const PROFILES = [
        // Kodama 1: Fliegend (Weit Links)
        { modelId: '#kodama-1', isSitting: false, minX: -5.5, maxX: -2.8, minZ: -6.5, maxZ: -4.0, minY: 1.10, maxY: 1.60, speed: 0.55 },
        
        // Kodama 2: Fliegend (Weit Rechts)
        { modelId: '#kodama-2', isSitting: false, minX:  2.8, maxX:  5.5, minZ: -6.5, maxZ: -4.0, minY: 1.00, maxY: 1.50, speed: 0.60 },
        
        // Kodama 3: SITZEND (Links auf 4.0m Tiefe - schwebt geschmeidig am Ort)
        { modelId: '#kodama-3', isSitting: true,  minX: -3.2, maxX: -1.8, minZ: -4.8, maxZ: -3.8, minY: 0.50, maxY: 0.50, speed: 0.0 },
        
        // Kodama 4: SITZEND (Mitte Tief auf 5.5m Tiefe - schwebt am Ort)
        { modelId: '#kodama-4', isSitting: true,  minX: -1.0, maxX:  1.0, minZ: -6.5, maxZ: -5.0, minY: 0.35, maxY: 0.35, speed: 0.0 },
        
        // Kodama 5: SITZEND (Rechts auf 4.0m Tiefe - schwebt am Ort)
        { modelId: '#kodama-5', isSitting: true,  minX:  1.8, maxX:  3.2, minZ: -4.8, maxZ: -3.8, minY: 0.60, maxY: 0.60, speed: 0.0 },
        
        // Kodama 6: Fliegend (Hoher Hüter ganz tief im Raum unter der Decke)
        { modelId: '#kodama-6', isSitting: false, minX: -2.5, maxX:  2.5, minZ: -9.0, maxZ: -7.0, minY: 2.00, maxY: 2.50, speed: 0.45 }
      ];

      for (let i = 0; i < Math.min(this.data.count, PROFILES.length); i++) {
        let profile = PROFILES[i];
        let kodama = document.createElement('a-entity');

        kodama.setAttribute('gltf-model', profile.modelId);

        let animSpeed = (0.50 + Math.random() * 0.30).toFixed(2);
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

        // Material-Anpassung: Porzellan-Weißer Körper & dunkle Gesichtszüge
        kodama.addEventListener('model-loaded', () => {
          let mesh = kodama.getObject3D('mesh');
          if (mesh) {
            mesh.traverse((node) => {
              if (node.isMesh) {
                if (node.geometry && node.geometry.attributes.color) {
                  node.geometry.deleteAttribute('color');
                }

                if (node.material) {
                  node.material.vertexColors = false;

                  if (node.material.map && node.material.map.image) {
                    let processTexture = () => {
                      try {
                        let img = node.material.map.image;
                        let width = img.width || img.videoWidth || 512;
                        let height = img.height || img.videoHeight || 512;

                        let canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        let ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        let imgData = ctx.getImageData(0, 0, width, height);
                        let data = imgData.data;

                        for (let p = 0; p < data.length; p += 4) {
                          let r = data[p];
                          let g = data[p+1];
                          let b = data[p+2];
                          let brightness = (r + g + b) / 3;

                          if (brightness < 110) {
                            data[p]   = Math.min(r, 30);
                            data[p+1] = Math.min(g, 30);
                            data[p+2] = Math.min(b, 30);
                            data[p+3] = 255;
                          } else {
                            data[p]   = 245;
                            data[p+1] = 250;
                            data[p+2] = 245;
                            data[p+3] = 255;
                          }
                        }
                        ctx.putImageData(imgData, 0, 0);

                        let newTex = new THREE.CanvasTexture(canvas);
                        newTex.flipY = node.material.map.flipY;
                        newTex.needsUpdate = true;

                        node.material.map = newTex;
                        node.material.needsUpdate = true;
                      } catch (e) {
                        console.warn("Texturverarbeitung Hinweis:", e);
                      }
                    };

                    let img = node.material.map.image;
                    if (img instanceof HTMLImageElement && !img.complete) {
                      img.onload = processTexture;
                    } else {
                      processTexture();
                    }
                  }

                  node.material.transparent = false;
                  node.material.depthWrite = true;
                  node.material.opacity = 1.0;

                  node.material.color = new THREE.Color(0xffffff);
                  node.material.roughness = 0.80;
                  node.material.metalness = 0.0;

                  node.material.emissive = new THREE.Color(0x183320);
                  node.material.emissiveIntensity = 0.22;

                  node.material.needsUpdate = true;
                }
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

        allKodamaEntities.push(kodama);
        sceneEl.appendChild(kodama);
      }
    });
  }
});

// ============================================================
// AGENTEN-LOGIK: DYNAMISCHE FLUGDYNAMIK, SCHWEBENDE SITZER & BLICKFOKUS
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
    this.floatHeight = 0.03 + Math.random() * 0.025; // Geschmeidiges Auf-und-Ab-Schweben
    this.timeOffset = Math.random() * 100;

    this.targetQuaternion = new THREE.Quaternion();
    this.dummy = new THREE.Object3D();

    this.state = this.data.isSitting ? 'SIT_LOOK_USER' : 'WANDER_ZONE';
    this.targetPos = new THREE.Vector3();
    this.pickZoneTarget();

    this.scheduleNextDecision();
  },

  scheduleNextDecision: function () {
    let interval = 4500 + Math.random() * 4000;

    setTimeout(() => {
      this.makeDecision();
      this.scheduleNextDecision();
    }, interval);
  },

  makeDecision: function () {
    let rand = Math.random();

    if (Math.random() < 0.18) {
      window.playKodamaSound(1.0, 1.0);
    }

    if (this.data.isSitting) {
      // SITZENDE KODAMAS (3, 4, 5): BLEIBEN AN ORT UND STELLE X/Z, SCHWEBEN AUF & AB
      if (rand < 0.70) {
        this.state = 'SIT_LOOK_USER'; // Schauen zu 70% direkt zum Besucher
        if (Math.random() < 0.20) {
          window.playKodamaSound(0.8, 1.1);
        }
      } else {
        this.state = 'SIT_LOOK_AWAY'; // Schauen kurz verträumt im Raum umher
        let randomAngle = (Math.random() - 0.5) * Math.PI * 0.6;
        this.dummy.position.copy(this.el.object3D.position);
        this.dummy.rotation.copy(this.el.object3D.rotation);
        this.dummy.rotation.y += randomAngle;
        this.targetQuaternion.copy(this.dummy.quaternion);
      }
    } else {
      // FLIEGENDE KODAMAS (1, 2, 6): KONTINUIERLICHE, NEUGIERIGE BEWEGUNG
      if (rand < 0.50) {
        // 50% Chance: Seidenweicher Flug zu neuem Ziel in ihrer Zone
        this.state = 'WANDER_ZONE';
        this.pickZoneTarget();

      } else if (rand < 0.78 && allKodamaEntities.length > 1) {
        // 28% Chance: Fliegen langsam und neugierig in die Nähe eines anderen Kodamas
        let otherIndex = (this.data.id + 1 + Math.floor(Math.random() * (allKodamaEntities.length - 1))) % allKodamaEntities.length;
        let otherPos = allKodamaEntities[otherIndex].object3D.position;
        this.targetPos.set(
          otherPos.x + (Math.random() - 0.5) * 2.4,
          otherPos.y + (Math.random() - 0.5) * 0.8,
          otherPos.z + (Math.random() - 0.5) * 2.4
        );
        this.state = 'VISIT_OTHER_KODAMA';

      } else if (this.data.id === 1 && !isAnyKodamaVisitingUser) {
        // 22% Chance: Besucht den User schüchtern, hält bei ca. 2.2 Meter Sicherheitsabstand an!
        this.state = 'APPROACH_USER';
        isAnyKodamaVisitingUser = true;

        window.playKodamaSound(1.0, 1.2);

        setTimeout(() => {
          if (this.state === 'APPROACH_USER') {
            this.pickZoneTarget();
            this.state = 'RETURN_TO_ZONE';
          }
        }, 9000);
      }
    }
  },

  pickZoneTarget: function () {
    this.targetPos.set(
      this.data.zoneMinX + Math.random() * (this.data.zoneMaxX - this.data.zoneMinX),
      this.data.baseY + (Math.random() * 0.5 - 0.25),
      this.data.zoneMinZ + Math.random() * (this.data.zoneMaxZ - this.data.zoneMinZ)
    );
  },

  // SAUBERE AUSRICHTUNGS-LOGIK ZUR KAMERA
  smoothLookAtUser: function (deltaSec, speed = 1.6) {
    let camPos = new THREE.Vector3();
    this.cameraEl.object3D.getWorldPosition(camPos);
    
    let pos = this.el.object3D.position;
    this.dummy.position.copy(pos);
    this.dummy.lookAt(camPos.x, pos.y, camPos.z);
    
    // Wendet die konfigurierte Modell-Rotation an
    if (MODEL_FACE_OFFSET !== 0) {
      this.dummy.rotateY(MODEL_FACE_OFFSET);
    }
    
    this.el.object3D.quaternion.slerp(this.dummy.quaternion, deltaSec * speed);
  },

  tick: function (time, timeDelta) {
    let deltaSec = timeDelta / 1000;
    this.timeOffset += deltaSec;

    let pos = this.el.object3D.position;

    // --- SITZENDE KODAMAS (3, 4, 5): ORTSFEST X/Z, ABER SCHWEBEN AUF UND AB ---
    if (this.data.isSitting) {
      let breathCycle = Math.sin(this.timeOffset * this.breathSpeed * 1.2);
      let scaleOffset = breathCycle * 0.015;
      let currentScale = this.data.baseScale + scaleOffset;
      this.el.object3D.scale.set(currentScale, currentScale + (scaleOffset * 0.3), currentScale);

      // Schweben sanft auf und ab an ihrem Ort
      let floatY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight;
      pos.y = this.data.baseY + floatY;

      if (this.state === 'SIT_LOOK_USER') {
        this.smoothLookAtUser(deltaSec, 1.8);
      } else if (this.state === 'SIT_LOOK_AWAY') {
        this.el.object3D.quaternion.slerp(this.targetQuaternion, deltaSec * 0.8);
      }

      return;
    }

    // --- FLIEGENDE KODAMAS (1, 2, 6): DYNAMISCHER, FLÜSSIGER FLUG ---
    let hoverY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight;

    // Sanfter Kollisionsschutz (verhindert Überschneidungen)
    allKodamaEntities.forEach(other => {
      if (other !== this.el) {
        let otherPos = other.object3D.position;
        let dx = pos.x - otherPos.x;
        let dz = pos.z - otherPos.z;
        let dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 1.4 && dist > 0.05) {
          let push = (1.4 - dist) * deltaSec * 0.25;
          pos.x += (dx / dist) * push;
          pos.z += (dz / dist) * push;
        }
      }
    });

    if (this.state === 'WANDER_ZONE' || this.state === 'VISIT_OTHER_KODAMA') {
      this.smoothLookAtUser(deltaSec, 1.4);

      // Flüssige Fortbewegung zum Ziel
      let dx = this.targetPos.x - pos.x;
      let dz = this.targetPos.z - pos.z;
      let distXZ = Math.sqrt(dx * dx + dz * dz);

      if (distXZ > 0.05) {
        let step = deltaSec * 0.55 * this.data.moveSpeed;
        pos.x += (dx / distXZ) * Math.min(step, distXZ);
        pos.z += (dz / distXZ) * Math.min(step, distXZ);
      }

      pos.y = THREE.MathUtils.lerp(pos.y, this.targetPos.y + hoverY, deltaSec * 1.5);

      if (distXZ < 0.40) {
        this.data.baseY = pos.y;
        this.pickZoneTarget();
      }

    } else if (this.state === 'APPROACH_USER') {
      this.smoothLookAtUser(deltaSec, 1.8);

      let camPos = new THREE.Vector3();
      this.cameraEl.object3D.getWorldPosition(camPos);

      let dist = pos.distanceTo(camPos);
      if (dist > 2.2) {
        let dir = new THREE.Vector3().subVectors(camPos, pos).normalize();
        pos.x += dir.x * deltaSec * 0.50 * this.data.moveSpeed;
        pos.z += dir.z * deltaSec * 0.50 * this.data.moveSpeed;
      }

      pos.y = THREE.MathUtils.lerp(pos.y, camPos.y - 0.1, deltaSec * 0.8) + hoverY * 0.08;

    } else if (this.state === 'RETURN_TO_ZONE') {
      this.smoothLookAtUser(deltaSec, 1.4);

      let dx = this.targetPos.x - pos.x;
      let dz = this.targetPos.z - pos.z;
      let distXZ = Math.sqrt(dx * dx + dz * dz);

      if (distXZ > 0.05) {
        let step = deltaSec * 0.55 * this.data.moveSpeed;
        pos.x += (dx / distXZ) * Math.min(step, distXZ);
        pos.z += (dz / distXZ) * Math.min(step, distXZ);
      }

      pos.y = THREE.MathUtils.lerp(pos.y, this.targetPos.y + hoverY, deltaSec * 1.5);

      if (distXZ < 0.50) {
        isAnyKodamaVisitingUser = false;
        this.data.baseY = pos.y;
        this.state = 'WANDER_ZONE';
      }
    }
  }
});
