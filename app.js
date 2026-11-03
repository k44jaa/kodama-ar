// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA (v12)
// 6 Autonome Geister: Entferntere Zonen (kein Aufdringen),
// direkter Blick ZUM USER (180°-Blickkorrektur), ortsfeste Sitzer (3, 4 & 5)
// & langsame Interaktion zwischen den Geistern
// ============================================================

let isAnyKodamaVisitingUser = false;
let allKodamaEntities = [];

// Weiches, warmes Holzklappern mit sanftem Fade-Out
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

      // ZONEN MIT REICHLICH ABSTAND (Tiefe Z von -3.5m bis -7.5m)
      const PROFILES = [
        // Kodama 1: Fliegend (Weit Links Hinten)
        { modelId: '#kodama-1', isSitting: false, minX: -4.5, maxX: -2.5, minZ: -5.5, maxZ: -4.0, minY: 1.10, maxY: 1.50, speed: 0.25 },
        
        // Kodama 2: Fliegend (Weit Rechts Hinten)
        { modelId: '#kodama-2', isSitting: false, minX:  2.0, maxX:  4.0, minZ: -5.5, maxZ: -4.0, minY: 1.00, maxY: 1.40, speed: 0.30 },
        
        // Kodama 3: SITZEND (Aufsitzer Links im Raum auf 3.8m Abstand)
        { modelId: '#kodama-3', isSitting: true,  minX: -2.8, maxX: -1.8, minZ: -4.2, maxZ: -3.5, minY: 0.45, maxY: 0.45, speed: 0.0 },
        
        // Kodama 4: SITZEND (Aufsitzer Mitte im Raum auf 4.8m Abstand)
        { modelId: '#kodama-4', isSitting: true,  minX: -0.8, maxX:  0.8, minZ: -5.2, maxZ: -4.5, minY: 0.25, maxY: 0.25, speed: 0.0 },
        
        // Kodama 5: SITZEND (Aufsitzer Rechts im Raum auf 3.8m Abstand)
        { modelId: '#kodama-5', isSitting: true,  minX:  1.8, maxX:  2.8, minZ: -4.2, maxZ: -3.5, minY: 0.55, maxY: 0.55, speed: 0.0 },
        
        // Kodama 6: Fliegend (Hoher Hüter tief im Raum unter der Decke)
        { modelId: '#kodama-6', isSitting: false, minX: -2.0, maxX:  2.0, minZ: -7.5, maxZ: -6.0, minY: 1.90, maxY: 2.30, speed: 0.20 }
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

        // Material & Texturverarbeitung (Weißer Körper + schwarze Gesichter)
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
// AGENTEN-LOGIK: DIREKTE BLICKKORREKTUR ZUM USER & SANFTE DYNAMIK
// ============================================================
AFRAME.registerComponent('kodama-agent', {
  schema: {
    id: { type: 'int' },
    isSitting: { type: 'boolean', default: false },
    baseScale: { type: 'number', default: 0.12 },
    moveSpeed: { type: 'number', default: 0.3 },
    zoneMinX: { type: 'number' },
    zoneMaxX: { type: 'number' },
    zoneMinZ: { type: 'number' },
    zoneMaxZ: { type: 'number' },
    baseY: { type: 'number', default: 1.2 }
  },

  init: function () {
    this.cameraEl = this.el.sceneEl.camera.el;

    this.breathSpeed = 0.3 + Math.random() * 0.3;
    this.floatSpeed = 0.4 + Math.random() * 0.4;
    this.floatHeight = 0.02 + Math.random() * 0.02;
    this.timeOffset = Math.random() * 100;

    this.targetQuaternion = new THREE.Quaternion();
    this.dummy = new THREE.Object3D();

    this.state = this.data.isSitting ? 'SIT_LOOK_USER' : 'HOVER_IN_PLACE';
    this.targetPos = new THREE.Vector3();
    this.pickZoneTarget();

    this.scheduleNextDecision();
  },

  scheduleNextDecision: function () {
    let interval = 5500 + Math.random() * 4500;

    setTimeout(() => {
      this.makeDecision();
      this.scheduleNextDecision();
    }, interval);
  },

  makeDecision: function () {
    let rand = Math.random();

    // 18% Chance für ein leises Klappern
    if (Math.random() < 0.18) {
      window.playKodamaSound(1.0, 1.0);
    }

    if (this.data.isSitting) {
      // SITZENDE KODAMAS (3, 4, 5): BLEIBEN AN ORT UND STELLE SCHWEBEN/ATMEN
      if (rand < 0.85) {
        this.state = 'SIT_LOOK_USER'; // Blicken zu 85% direkt zum Besucher
        if (Math.random() < 0.20) {
          window.playKodamaSound(0.8, 1.1);
        }
      } else {
        this.state = 'SIT_LOOK_AWAY';
        let randomAngle = (Math.random() - 0.5) * Math.PI * 0.3;
        this.dummy.position.copy(this.el.object3D.position);
        this.dummy.rotation.copy(this.el.object3D.rotation);
        this.dummy.rotation.y += randomAngle;
        this.targetQuaternion.copy(this.dummy.quaternion);
      }
    } else {
      // FLIEGENDE KODAMAS (1, 2, 6)
      if (rand < 0.40) {
        // 40% Chance: Bleiben am Ort schwebend verharren & schauen dich an
        this.state = 'HOVER_IN_PLACE';

      } else if (rand < 0.70) {
        // 30% Chance: Langsamer Flug zu neuem Ziel in ihrer Zone
        this.state = 'WANDER_ZONE';
        this.pickZoneTarget();

      } else if (rand < 0.88 && allKodamaEntities.length > 1) {
        // 18% Chance: Fliegen langsam in die Nähe eines anderen Kodamas
        let otherIndex = (this.data.id + 1 + Math.floor(Math.random() * (allKodamaEntities.length - 1))) % allKodamaEntities.length;
        let otherPos = allKodamaEntities[otherIndex].object3D.position;
        this.targetPos.set(
          otherPos.x + (Math.random() - 0.5) * 1.8,
          otherPos.y + (Math.random() - 0.5) * 0.6,
          otherPos.z + (Math.random() - 0.5) * 1.8
        );
        this.state = 'VISIT_OTHER_KODAMA';

      } else if (this.data.id === 1 && !isAnyKodamaVisitingUser) {
        // 12% Chance: Kommt sanft näher, hält aber bei min. 2.2 Meter Anstand an!
        this.state = 'APPROACH_USER';
        isAnyKodamaVisitingUser = true;

        window.playKodamaSound(1.0, 1.2);

        setTimeout(() => {
          if (this.state === 'APPROACH_USER') {
            this.pickZoneTarget();
            this.state = 'RETURN_TO_ZONE';
          }
        }, 10000);
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

  // GARANTIERT KORREKTE AUSRICHTUNG DES GESICHTS ZUR KAMERA (+ Math.PI)
  smoothLookAtUser: function (deltaSec, speed = 1.5) {
    let camPos = new THREE.Vector3();
    this.cameraEl.object3D.getWorldPosition(camPos);
    
    let pos = this.el.object3D.position;
    this.dummy.position.copy(pos);
    this.dummy.lookAt(camPos.x, pos.y, camPos.z);
    
    // 180 Grad Drehung: Richtet die Vorderseite des 3D-Modells zur Kamera aus!
    this.dummy.rotation.y += Math.PI;
    
    this.el.object3D.quaternion.slerp(this.dummy.quaternion, deltaSec * speed);
  },

  tick: function (time, timeDelta) {
    let deltaSec = timeDelta / 1000;
    this.timeOffset += deltaSec;

    let pos = this.el.object3D.position;

    // --- SITZENDE KODAMAS (3, 4, 5): FEST VERANKERT, NUR ATMEN & SCHWEBEN ---
    if (this.data.isSitting) {
      let breathCycle = Math.sin(this.timeOffset * this.breathSpeed * 1.2);
      let scaleOffset = breathCycle * 0.015;
      let currentScale = this.data.baseScale + scaleOffset;
      this.el.object3D.scale.set(currentScale, currentScale + (scaleOffset * 0.3), currentScale);

      pos.y = this.data.baseY + (breathCycle * 0.003);

      if (this.state === 'SIT_LOOK_USER') {
        this.smoothLookAtUser(deltaSec, 1.8);
      } else if (this.state === 'SIT_LOOK_AWAY') {
        this.el.object3D.quaternion.slerp(this.targetQuaternion, deltaSec * 0.8);
      }

      return; // Keine Ortsveränderung!
    }

    // --- FLIEGENDE KODAMAS (1, 2, 6): LANGSAME, ENTSPANNTE BEWEGUNG ---
    let hoverY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight;

    if (this.state === 'HOVER_IN_PLACE') {
      // Am Ort verharren, sanft auf und ab schweben & den User anschauen
      this.smoothLookAtUser(deltaSec, 1.4);
      pos.y = this.data.baseY + hoverY;

    } else if (this.state === 'WANDER_ZONE' || this.state === 'VISIT_OTHER_KODAMA') {
      this.smoothLookAtUser(deltaSec, 1.2);

      pos.lerp(this.targetPos, deltaSec * 0.22 * this.data.moveSpeed);
      pos.y += hoverY * 0.08;

      if (pos.distanceTo(this.targetPos) < 0.60) {
        this.data.baseY = pos.y;
        this.state = 'HOVER_IN_PLACE';
      }

    } else if (this.state === 'APPROACH_USER') {
      this.smoothLookAtUser(deltaSec, 1.8);

      let camPos = new THREE.Vector3();
      this.cameraEl.object3D.getWorldPosition(camPos);

      let dist = pos.distanceTo(camPos);
      // Hält bei angenehmen 2.2 Metern Abstand an!
      if (dist > 2.2) {
        let dir = new THREE.Vector3().subVectors(camPos, pos).normalize();
        pos.x += dir.x * deltaSec * 0.35 * this.data.moveSpeed;
        pos.z += dir.z * deltaSec * 0.35 * this.data.moveSpeed;
      }

      pos.y = THREE.MathUtils.lerp(pos.y, camPos.y - 0.1, deltaSec * 0.6) + hoverY * 0.08;

    } else if (this.state === 'RETURN_TO_ZONE') {
      this.smoothLookAtUser(deltaSec, 1.2);

      pos.lerp(this.targetPos, deltaSec * 0.22 * this.data.moveSpeed);
      pos.y += hoverY * 0.08;

      if (pos.distanceTo(this.targetPos) < 0.70) {
        isAnyKodamaVisitingUser = false;
        this.data.baseY = pos.y;
        this.state = 'HOVER_IN_PLACE';
      }
    }
  }
});
