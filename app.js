// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA (v16 - Ghibli "Ma" & Echo Edition)
// Synchronisiertes Kopf-Wackeln + Sound, Kettenreaktion (Echo),
// Paar-Gruppierung, sanfte Stille & Anflug nach wenigen Sekunden ("Hallo sagen")
// ============================================================

let isAnyKodamaVisitingUser = false;
let allKodamaEntities = [];

// Warmes, geschmeidiges Klappern mit sanftem Fade-Out
window.playKodamaSound = function (volFactor = 1.0, pitchFactor = 1.0) {
  try {
    let snd = new Audio('./assets/sound.mp3');
    snd.volume = Math.min(0.07, (0.035 + Math.random() * 0.025) * volFactor);
    snd.playbackRate = (0.90 + Math.random() * 0.18) * pitchFactor;
    
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
      }, 700);
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

      // PAAR- & GRUPPEN-ANORDNUNG (Ghibli-Ökosystem mit "Ma")
      const PROFILES = [
        // PAAR 1 (Links): Kodama 1 (fliegend) & Kodama 3 (sitzend/schwebend nahebei)
        { modelId: '#kodama-1', isSitting: false, minX: -5.0, maxX: -3.0, minZ: -5.5, maxZ: -4.0, minY: 1.10, maxY: 1.50, speed: 0.50 },
        { modelId: '#kodama-3', isSitting: true,  minX: -4.2, maxX: -2.8, minZ: -5.0, maxZ: -3.8, minY: 0.45, maxY: 0.45, speed: 0.0 },
        
        // PAAR 2 (Rechts): Kodama 2 (fliegend) & Kodama 5 (sitzend/schwebend nahebei)
        { modelId: '#kodama-2', isSitting: false, minX:  3.0, maxX:  5.0, minZ: -5.5, maxZ: -4.0, minY: 1.00, maxY: 1.40, speed: 0.50 },
        { modelId: '#kodama-5', isSitting: true,  minX:  2.8, maxX:  4.2, minZ: -5.0, maxZ: -3.8, minY: 0.55, maxY: 0.55, speed: 0.0 },

        // EINZELGÄNGER TIEF IM RAUM: Kodama 4 (sitzend zentriert) & Kodama 6 (Hüter ganz tief)
        { modelId: '#kodama-4', isSitting: true,  minX: -1.0, maxX:  1.0, minZ: -7.0, maxZ: -5.5, minY: 0.35, maxY: 0.35, speed: 0.0 },
        { modelId: '#kodama-6', isSitting: false, minX: -3.5, maxX:  3.5, minZ: -10.5, maxZ: -8.0, minY: 2.10, maxY: 2.60, speed: 0.40 }
      ];

      for (let i = 0; i < Math.min(this.data.count, PROFILES.length); i++) {
        let profile = PROFILES[i];
        let kodama = document.createElement('a-entity');

        kodama.setAttribute('gltf-model', profile.modelId);

        let animSpeed = (0.45 + Math.random() * 0.30).toFixed(2);
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

        // Material-Anpassung: Milchig-weiße Körper & dunkle Gesichtszüge
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

      // NACH WENIGEN SEKUNDEN (3,5 Sek.): KODAMA 1 FLIEGT AUF DEN USER ZU & SAGT "HALLO"
      setTimeout(() => {
        if (allKodamaEntities.length > 0) {
          let agent = allKodamaEntities[0].components['kodama-agent'];
          if (agent) {
            agent.startGreetingApproach();
          }
        }
      }, 3500);
    });
  }
});

// ============================================================
// AGENTEN-LOGIK: KOPF-WACKELN, ECHO-KETTENREAKTION & BEGRÜSSUNG
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

    this.breathSpeed = 0.35 + Math.random() * 0.35;
    this.floatSpeed = 0.45 + Math.random() * 0.45;
    this.floatHeight = 0.035 + Math.random() * 0.025;
    this.timeOffset = Math.random() * 100;

    this.shakeTimer = 0; // Für das synchrone Kopf-Wackeln beim Klappern
    this.targetQuaternion = new THREE.Quaternion();
    this.dummy = new THREE.Object3D();

    this.state = this.data.isSitting ? 'SIT_MA_STILL' : 'HOVER_MA_STILL';
    this.targetPos = new THREE.Vector3();
    this.pickZoneTarget();

    this.scheduleNextDecision();
  },

  // STARTET DEN BEGRÜSSUNGS-ANFLUG ("HALLO SAGEN")
  startGreetingApproach: function () {
    this.state = 'APPROACH_USER';
    isAnyKodamaVisitingUser = true;

    // Spielt Ton & löst das synchrone Kopf-Wackeln aus!
    this.triggerSoundAndHeadShake(1.2, 1.25);

    setTimeout(() => {
      if (this.state === 'APPROACH_USER') {
        this.pickZoneTarget();
        this.state = 'RETURN_TO_ZONE';
      }
    }, 9500);
  },

  // KOPF-WACKELN & SOUND SYNCHRONISIEREN
  triggerSoundAndHeadShake: function (volFactor = 1.0, pitchFactor = 1.0) {
    this.shakeTimer = 0.75; // 0.75 Sekunden Kopf-Zucken
    window.playKodamaSound(volFactor, pitchFactor);

    // KETTENREAKTION: Nachbar-Kodama reagiert verzögert mit Echo!
    this.triggerEchoToNeighbors();
  },

  // ECHOSEQUENZ: NACHBAR-KODAMAS REAGIEREN MIT LEISEM ECHO
  triggerEchoToNeighbors: function () {
    let myPos = this.el.object3D.position;

    allKodamaEntities.forEach(otherEl => {
      if (otherEl !== this.el) {
        let otherAgent = otherEl.components['kodama-agent'];
        if (otherAgent) {
          let otherPos = otherEl.object3D.position;
          let dist = myPos.distanceTo(otherPos);

          // Wenn ein Nachbar innerhalb von 4.5m Reichweite steht: 40% Chance auf Echo-Antwort
          if (dist < 4.5 && Math.random() < 0.40) {
            let echoDelay = 400 + Math.random() * 600; // 0.4s bis 1.0s Verzögerung
            setTimeout(() => {
              otherAgent.respondToEcho();
            }, echoDelay);
          }
        }
      }
    });
  },

  respondToEcho: function () {
    // Leises Echo-Antwortklappern + leichtes Kopfwackeln
    this.shakeTimer = 0.50;
    window.playKodamaSound(0.6, 1.15);
  },

  scheduleNextDecision: function () {
    // Mehr "Ma" (Innehalten): Längere Pausen voller Stille (5.5 bis 10 Sekunden)
    let interval = 5500 + Math.random() * 4500;

    setTimeout(() => {
      this.makeDecision();
      this.scheduleNextDecision();
    }, interval);
  },

  makeDecision: function () {
    let rand = Math.random();

    // 22% Chance für Klappern & Kopf-Wackeln
    if (Math.random() < 0.22) {
      this.triggerSoundAndHeadShake(1.0, 1.0);
    }

    if (this.data.isSitting) {
      // SITZENDE KODAMAS (3, 4, 5): "MA"-STILLE ODER SANFTES DREHEN
      if (rand < 0.65) {
        this.state = 'SIT_MA_STILL'; // Verharren in friedlicher Stille
      } else {
        this.state = 'SIT_ROTATE';   // Sanfte Drehung im Raum
        let randomAngle = (Math.random() - 0.5) * Math.PI * 0.7;
        this.dummy.position.copy(this.el.object3D.position);
        this.dummy.rotation.copy(this.el.object3D.rotation);
        this.dummy.rotation.y += randomAngle;
        this.targetQuaternion.copy(this.dummy.quaternion);
      }
    } else {
      // FLIEGENDE KODAMAS (1, 2, 6): VERHALTEN ZWISCHEN GLEITEN & "MA"-PAUSEN
      if (rand < 0.35) {
        this.state = 'HOVER_MA_STILL'; // Verharren schwebend am Ort

      } else if (rand < 0.70) {
        this.state = 'WANDER_ZONE';   // Sanfter Flug in der Zone
        this.pickZoneTarget();

      } else if (rand < 0.90 && allKodamaEntities.length > 1) {
        // Besuch beim Nachbarn im Paar
        let otherIndex = (this.data.id + 1 + Math.floor(Math.random() * (allKodamaEntities.length - 1))) % allKodamaEntities.length;
        let otherPos = allKodamaEntities[otherIndex].object3D.position;
        this.targetPos.set(
          otherPos.x + (Math.random() - 0.5) * 2.2,
          otherPos.y + (Math.random() - 0.5) * 0.6,
          otherPos.z + (Math.random() - 0.5) * 2.2
        );
        this.state = 'VISIT_OTHER_KODAMA';

      } else if (this.data.id === 1 && !isAnyKodamaVisitingUser) {
        this.startGreetingApproach();
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

  smoothLookAtTarget: function (targetVector, deltaSec, speed = 1.4) {
    let pos = this.el.object3D.position;
    this.dummy.position.copy(pos);
    this.dummy.lookAt(targetVector.x, pos.y, targetVector.z);
    this.el.object3D.quaternion.slerp(this.dummy.quaternion, deltaSec * speed);
  },

  tick: function (time, timeDelta) {
    let deltaSec = timeDelta / 1000;
    this.timeOffset += deltaSec;

    let pos = this.el.object3D.position;

    // --- SYNCHRONES KOPF-WACKELN BEI KLAPPERSOUND ---
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaSec;
      // Schnelles, feines Zucken um die Y- & Z-Achse (Kopfklappern)
      let shakeJitter = Math.sin(this.shakeTimer * 35) * 0.08;
      this.el.object3D.rotation.y += shakeJitter;
      this.el.object3D.rotation.z += shakeJitter * 0.5;
    }

    // --- SITZENDE KODAMAS (3, 4, 5): SCHWEBEN AN ORT UND STELLE X/Z ---
    if (this.data.isSitting) {
      let breathCycle = Math.sin(this.timeOffset * this.breathSpeed * 1.2);
      let scaleOffset = breathCycle * 0.015;
      let currentScale = this.data.baseScale + scaleOffset;
      this.el.object3D.scale.set(currentScale, currentScale + (scaleOffset * 0.3), currentScale);

      let floatY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight;
      pos.y = this.data.baseY + floatY;

      if (this.state === 'SIT_ROTATE') {
        this.el.object3D.quaternion.slerp(this.targetQuaternion, deltaSec * 0.8);
      }

      return;
    }

    // --- FLIEGENDE KODAMAS (1, 2, 6) ---
    let hoverY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight;

    // Weicher Anti-Kollisions-Schutz
    allKodamaEntities.forEach(other => {
      if (other !== this.el) {
        let otherPos = other.object3D.position;
        let dx = pos.x - otherPos.x;
        let dz = pos.z - otherPos.z;
        let dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 1.6 && dist > 0.05) {
          let push = (1.6 - dist) * deltaSec * 0.30;
          pos.x += (dx / dist) * push;
          pos.z += (dz / dist) * push;
        }
      }
    });

    if (this.state === 'HOVER_MA_STILL') {
      pos.y = THREE.MathUtils.lerp(pos.y, this.data.baseY + hoverY, deltaSec * 1.2);

    } else if (this.state === 'WANDER_ZONE' || this.state === 'VISIT_OTHER_KODAMA') {
      this.smoothLookAtTarget(this.targetPos, deltaSec, 1.4);

      let dx = this.targetPos.x - pos.x;
      let dz = this.targetPos.z - pos.z;
      let distXZ = Math.sqrt(dx * dx + dz * dz);

      if (distXZ > 0.05) {
        let step = deltaSec * 0.60 * this.data.moveSpeed;
        pos.x += (dx / distXZ) * Math.min(step, distXZ);
        pos.z += (dz / distXZ) * Math.min(step, distXZ);
      }

      pos.y = THREE.MathUtils.lerp(pos.y, this.targetPos.y + hoverY, deltaSec * 1.5);

      if (distXZ < 0.45) {
        this.data.baseY = pos.y;
        this.state = 'HOVER_MA_STILL';
      }

    } else if (this.state === 'APPROACH_USER') {
      let camPos = new THREE.Vector3();
      this.cameraEl.object3D.getWorldPosition(camPos);

      this.smoothLookAtTarget(camPos, deltaSec, 1.8);

      let dist = pos.distanceTo(camPos);
      if (dist > 2.2) {
        let dir = new THREE.Vector3().subVectors(camPos, pos).normalize();
        pos.x += dir.x * deltaSec * 0.55 * this.data.moveSpeed;
        pos.z += dir.z * deltaSec * 0.55 * this.data.moveSpeed;
      }

      pos.y = THREE.MathUtils.lerp(pos.y, camPos.y - 0.1, deltaSec * 0.8) + hoverY * 0.08;

    } else if (this.state === 'RETURN_TO_ZONE') {
      this.smoothLookAtTarget(this.targetPos, deltaSec, 1.4);

      let dx = this.targetPos.x - pos.x;
      let dz = this.targetPos.z - pos.z;
      let distXZ = Math.sqrt(dx * dx + dz * dz);

      if (distXZ > 0.05) {
        let step = deltaSec * 0.60 * this.data.moveSpeed;
        pos.x += (dx / distXZ) * Math.min(step, distXZ);
        pos.z += (dz / distXZ) * Math.min(step, distXZ);
      }

      pos.y = THREE.MathUtils.lerp(pos.y, this.targetPos.y + hoverY, deltaSec * 1.5);

      if (distXZ < 0.50) {
        isAnyKodamaVisitingUser = false;
        this.data.baseY = pos.y;
        this.state = 'HOVER_MA_STILL';
      }
    }
  }
});
