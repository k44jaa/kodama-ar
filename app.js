// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA (v17 - Ghibli Magic Edition)
// Touch-Interaktion, magische Waldsporen, kollektiver Wald-Akkord,
// Echo-Kettenreaktion & synchrone Kopfbewegung
// ============================================================

let isAnyKodamaVisitingUser = false;
let allKodamaEntities = [];

// Sound-Funktion mit sanftem Fade-Out
window.playKodamaSound = function (volFactor = 1.0, pitchFactor = 1.0) {
  try {
    let snd = new Audio('./assets/sound.mp3');
    snd.volume = Math.min(0.08, (0.04 + Math.random() * 0.025) * volFactor);
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

      // 1. MAGISCHE WALDSPOREN (Leuchtender Partikelstaub im Raum)
      this.createForestSpores(sceneEl);

      // 2. PAAR- & RAUM-ANORDNUNG
      const PROFILES = [
        { modelId: '#kodama-1', isSitting: false, minX: -5.0, maxX: -3.0, minZ: -5.5, maxZ: -4.0, minY: 1.10, maxY: 1.50, speed: 0.50 },
        { modelId: '#kodama-3', isSitting: true,  minX: -4.2, maxX: -2.8, minZ: -5.0, maxZ: -3.8, minY: 0.45, maxY: 0.45, speed: 0.0 },
        { modelId: '#kodama-2', isSitting: false, minX:  3.0, maxX:  5.0, minZ: -5.5, maxZ: -4.0, minY: 1.00, maxY: 1.40, speed: 0.50 },
        { modelId: '#kodama-5', isSitting: true,  minX:  2.8, maxX:  4.2, minZ: -5.0, maxZ: -3.8, minY: 0.55, maxY: 0.55, speed: 0.0 },
        { modelId: '#kodama-4', isSitting: true,  minX: -1.0, maxX:  1.0, minZ: -7.0, maxZ: -5.5, minY: 0.35, maxY: 0.35, speed: 0.0 },
        { modelId: '#kodama-6', isSitting: false, minX: -3.5, maxX:  3.5, minZ: -10.5, maxZ: -8.0, minY: 2.10, maxY: 2.60, speed: 0.40 }
      ];

      for (let i = 0; i < Math.min(this.data.count, PROFILES.length); i++) {
        let profile = PROFILES[i];
        let kodama = document.createElement('a-entity');

        kodama.setAttribute('gltf-model', profile.modelId);
        kodama.classList.add('clickable'); // Ermöglicht Touch-Klicks

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

        // Material-Anpassung
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

        // Event-Listener für direktes Antippen auf dem Bildschirm
        kodama.addEventListener('click', () => {
          let agent = kodama.components['kodama-agent'];
          if (agent) agent.onUserTouch();
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

      // Begrüßung nach 3,5 Sekunden
      setTimeout(() => {
        if (allKodamaEntities.length > 0) {
          let agent = allKodamaEntities[0].components['kodama-agent'];
          if (agent) agent.startGreetingApproach();
        }
      }, 3500);

      // 3. KOLLEKTIVER "WALD-AKKORD" (Alle 45 Sekunden ein magisches Konzert)
      setInterval(() => {
        this.triggerForestHarmony();
      }, 45000);
    });
  },

  // ERZEUGT DIE SCHWEBENDEN WALDSPOREN
  createForestSpores: function (sceneEl) {
    let pCount = 90;
    let pGeo = new THREE.BufferGeometry();
    let posArr = new Float32Array(pCount * 3);

    for (let p = 0; p < pCount * 3; p += 3) {
      posArr[p]   = (Math.random() - 0.5) * 14;
      posArr[p+1] = 0.4 + Math.random() * 2.8;
      posArr[p+2] = -2 - Math.random() * 9;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));

    let pCanvas = document.createElement('canvas');
    pCanvas.width = 32; pCanvas.height = 32;
    let pCtx = pCanvas.getContext('2d');
    let grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(180, 255, 210, 0.95)');
    grad.addColorStop(0.4, 'rgba(80, 230, 150, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 32, 32);

    let pMat = new THREE.PointsMaterial({
      size: 0.14,
      map: new THREE.CanvasTexture(pCanvas),
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    let pMesh = new THREE.Points(pGeo, pMat);
    sceneEl.object3D.add(pMesh);

    sceneEl.addEventListener('tick', (e) => {
      let t = e.detail.time / 1000;
      let pos = pGeo.attributes.position.array;
      for (let i = 1; i < pCount * 3; i += 3) {
        pos[i] += Math.sin(t + i) * 0.0012;
      }
      pGeo.attributes.position.needsUpdate = true;
    });
  },

  // RUF DIE KOLLEKTIVE MELODIE AB
  triggerForestHarmony: function () {
    allKodamaEntities.forEach((kodamaEl, idx) => {
      setTimeout(() => {
        let agent = kodamaEl.components['kodama-agent'];
        if (agent) {
          agent.triggerSoundAndHeadShake(1.2, 0.95 + idx * 0.08);
          agent.pulseEmissiveGlow(0.65, 1600);
        }
      }, idx * 320); // Kaskadierendes Klappern von Links nach Rechts
    });
  }
});

// ============================================================
// AGENTEN-LOGIK: TOUCH-INTERAKTION & INDIVIDUELLE REAKTIONEN
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

    this.shakeTimer = 0;
    this.touchJumpTimer = 0; // Für den Touch-Freudensprung
    this.targetQuaternion = new THREE.Quaternion();
    this.dummy = new THREE.Object3D();

    this.state = this.data.isSitting ? 'SIT_MA_STILL' : 'HOVER_MA_STILL';
    this.targetPos = new THREE.Vector3();
    this.pickZoneTarget();

    this.scheduleNextDecision();
  },

  // TOUCH-REAKTION BEIM ANTIPPEN AUF DEM HANDY-BILDSCHIRM
  onUserTouch: function () {
    this.shakeTimer = 0.85;
    this.touchJumpTimer = 0.60; // 0.6 Sek. Freuden-Hüpfen
    window.playKodamaSound(1.3, 1.35); // Höhere, aufgeregte Tonhöhe
    this.pulseEmissiveGlow(0.85, 1400);

    // Nachbar-Kodamas drehen sich neugierig um
    let myPos = this.el.object3D.position;
    allKodamaEntities.forEach(otherEl => {
      if (otherEl !== this.el) {
        let otherAgent = otherEl.components['kodama-agent'];
        if (otherAgent && myPos.distanceTo(otherEl.object3D.position) < 4.5) {
          setTimeout(() => {
            otherAgent.triggerSoundAndHeadShake(0.7, 1.15);
          }, 300 + Math.random() * 400);
        }
      }
    });
  },

  pulseEmissiveGlow: function (intensity = 0.6, durationMs = 1200) {
    let mesh = this.el.getObject3D('mesh');
    if (mesh) {
      mesh.traverse((node) => {
        if (node.isMesh && node.material) {
          node.material.emissiveIntensity = intensity;
          setTimeout(() => {
            if (node.material) node.material.emissiveIntensity = 0.22;
          }, durationMs);
        }
      });
    }
  },

  startGreetingApproach: function () {
    this.state = 'APPROACH_USER';
    isAnyKodamaVisitingUser = true;

    this.triggerSoundAndHeadShake(1.2, 1.25);
    this.pulseEmissiveGlow(0.60, 1500);

    setTimeout(() => {
      if (this.state === 'APPROACH_USER') {
        this.pickZoneTarget();
        this.state = 'RETURN_TO_ZONE';
      }
    }, 9500);
  },

  triggerSoundAndHeadShake: function (volFactor = 1.0, pitchFactor = 1.0) {
    this.shakeTimer = 0.75;
    window.playKodamaSound(volFactor, pitchFactor);
    this.triggerEchoToNeighbors();
  },

  triggerEchoToNeighbors: function () {
    let myPos = this.el.object3D.position;

    allKodamaEntities.forEach(otherEl => {
      if (otherEl !== this.el) {
        let otherAgent = otherEl.components['kodama-agent'];
        if (otherAgent) {
          let dist = myPos.distanceTo(otherEl.object3D.position);
          if (dist < 4.5 && Math.random() < 0.40) {
            let echoDelay = 400 + Math.random() * 600;
            setTimeout(() => {
              otherAgent.respondToEcho();
            }, echoDelay);
          }
        }
      }
    });
  },

  respondToEcho: function () {
    this.shakeTimer = 0.50;
    window.playKodamaSound(0.6, 1.15);
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

    if (Math.random() < 0.22) {
      this.triggerSoundAndHeadShake(1.0, 1.0);
    }

    if (this.data.isSitting) {
      if (rand < 0.65) {
        this.state = 'SIT_MA_STILL';
      } else {
        this.state = 'SIT_ROTATE';
        let randomAngle = (Math.random() - 0.5) * Math.PI * 0.7;
        this.dummy.position.copy(this.el.object3D.position);
        this.dummy.rotation.copy(this.el.object3D.rotation);
        this.dummy.rotation.y += randomAngle;
        this.targetQuaternion.copy(this.dummy.quaternion);
      }
    } else {
      if (rand < 0.35) {
        this.state = 'HOVER_MA_STILL';

      } else if (rand < 0.70) {
        this.state = 'WANDER_ZONE';
        this.pickZoneTarget();

      } else if (rand < 0.90 && allKodamaEntities.length > 1) {
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
      let shakeJitter = Math.sin(this.shakeTimer * 35) * 0.08;
      this.el.object3D.rotation.y += shakeJitter;
      this.el.object3D.rotation.z += shakeJitter * 0.5;
    }

    // --- FREUDEN-HÜPFEN BEIM ANTIPPEN ---
    let touchJumpY = 0;
    if (this.touchJumpTimer > 0) {
      this.touchJumpTimer -= deltaSec;
      touchJumpY = Math.sin(this.touchJumpTimer * Math.PI * 3) * 0.12;
    }

    // --- SITZENDE KODAMAS (3, 4, 5) ---
    if (this.data.isSitting) {
      let breathCycle = Math.sin(this.timeOffset * this.breathSpeed * 1.2);
      let scaleOffset = breathCycle * 0.015;
      let currentScale = this.data.baseScale + scaleOffset;
      this.el.object3D.scale.set(currentScale, currentScale + (scaleOffset * 0.3), currentScale);

      let floatY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight;
      pos.y = this.data.baseY + floatY + touchJumpY;

      if (this.state === 'SIT_ROTATE') {
        this.el.object3D.quaternion.slerp(this.targetQuaternion, deltaSec * 0.8);
      }

      return;
    }

    // --- FLIEGENDE KODAMAS (1, 2, 6) ---
    let hoverY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight + touchJumpY;

    // Kollisionsschutz
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
