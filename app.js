// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA (v22 - Perfect Touch & Distance)
// Korrigierter Begrüßungsabstand (1,20m), voll funktionsfähige
// Touch-Klick-Interaktion mit Leuchten, Sprung & Klapper-Echo
// ============================================================

const MODEL_FACE_ANGLE_RAD = -Math.PI / 2; // -90 Grad Drehung für Frontalblick

let isAnyKodamaVisitingUser = false;
let allKodamaEntities = [];

// Sound-Funktion mit geschmeidigem Ausblenden
window.playKodamaSound = function (volFactor = 1.0, pitchFactor = 1.0) {
  try {
    let snd = new Audio('./assets/sound.mp3');
    snd.volume = Math.min(0.09, (0.045 + Math.random() * 0.025) * volFactor);
    snd.playbackRate = (0.90 + Math.random() * 0.20) * pitchFactor;
    
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

      this.createForestSpores(sceneEl);

      const PROFILES = [
        { modelId: '#kodama-1', isSitting: false, minX: -4.5, maxX: -2.5, minZ: -5.0, maxZ: -3.5, minY: 1.10, maxY: 1.50, speed: 0.65 },
        { modelId: '#kodama-3', isSitting: true,  minX: -3.8, maxX: -2.2, minZ: -4.5, maxZ: -3.5, minY: 0.45, maxY: 0.45, speed: 0.0 },
        { modelId: '#kodama-2', isSitting: false, minX:  2.5, maxX:  4.5, minZ: -5.0, maxZ: -3.5, minY: 1.00, maxY: 1.40, speed: 0.60 },
        { modelId: '#kodama-5', isSitting: true,  minX:  2.2, maxX:  3.8, minZ: -4.5, maxZ: -3.5, minY: 0.55, maxY: 0.55, speed: 0.0 },
        { modelId: '#kodama-4', isSitting: true,  minX: -1.0, maxX:  1.0, minZ: -6.5, maxZ: -5.0, minY: 0.35, maxY: 0.35, speed: 0.0 },
        { modelId: '#kodama-6', isSitting: false, minX: -3.0, maxX:  3.0, minZ: -9.5, maxZ: -7.5, minY: 2.10, maxY: 2.60, speed: 0.45 }
      ];

      for (let i = 0; i < Math.min(this.data.count, PROFILES.length); i++) {
        let profile = PROFILES[i];
        let kodama = document.createElement('a-entity');

        kodama.setAttribute('gltf-model', profile.modelId);
        kodama.classList.add('clickable');

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

        // Material-Anpassung & Touch-Vorbereitung aller Sub-Meshes
        kodama.addEventListener('model-loaded', () => {
          let mesh = kodama.getObject3D('mesh');
          if (mesh) {
            mesh.traverse((node) => {
              if (node.isMesh) {
                node.el = kodama; // Verknüpft Untermesh direkt mit der Kodama-Entity für Touch-Klicks
                
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

                          if (brightness < 120) {
                            data[p]   = 10;
                            data[p+1] = 10;
                            data[p+2] = 10;
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
                  node.material.roughness = 0.75;
                  node.material.metalness = 0.0;

                  node.material.emissive = new THREE.Color(0x183822);
                  node.material.emissiveIntensity = 0.25;

                  node.material.needsUpdate = true;
                }
              }
            });
          }
        });

        // Touch-Interaction (Sowohl Klick-Event als auch Raycast-Fallback)
        let handleTouch = () => {
          let agent = kodama.components['kodama-agent'];
          if (agent) agent.onUserTouch();
        };

        kodama.addEventListener('click', handleTouch);
        kodama.addEventListener('mousedown', handleTouch);

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

      // GARANTIERTER BEGRÜSSUNGS-ANFLUG NACH 2,2 SEKUNDEN
      setTimeout(() => {
        if (allKodamaEntities.length > 0) {
          let firstKodama = allKodamaEntities[0];
          let agent = firstKodama ? firstKodama.components['kodama-agent'] : null;
          if (agent) {
            agent.startGreetingApproach();
          }
        }
      }, 2200);

      setInterval(() => {
        this.triggerForestHarmony();
      }, 40000);
    });
  },

  createForestSpores: function (sceneEl) {
    let pCount = 95;
    let pGeo = new THREE.BufferGeometry();
    let posArr = new Float32Array(pCount * 3);

    for (let p = 0; p < pCount * 3; p += 3) {
      posArr[p]   = (Math.random() - 0.5) * 14;
      posArr[p+1] = 0.3 + Math.random() * 2.8;
      posArr[p+2] = -1.5 - Math.random() * 9;
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

  triggerForestHarmony: function () {
    allKodamaEntities.forEach((kodamaEl, idx) => {
      setTimeout(() => {
        let agent = kodamaEl.components['kodama-agent'];
        if (agent) {
          agent.triggerSoundAndHeadShake(1.2, 1.20 - idx * 0.05);
          agent.pulseEmissiveGlow(0.70, 1600);
        }
      }, idx * 300);
    });
  }
});

// ============================================================
// AGENTEN-LOGIK: TOUCH-REAKTION & BEGRÜSSUNGS-ANFLUG (1,20m ABSTAND)
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
    this.touchJumpTimer = 0;
    this.targetQuaternion = new THREE.Quaternion();
    this.dummy = new THREE.Object3D();

    this.state = this.data.isSitting ? 'SIT_LOOK_USER' : 'HOVER_LOOK_USER';
    this.targetPos = new THREE.Vector3();
    this.pickZoneTarget();

    this.scheduleNextDecision();
  },

  // TOUCH-REAKTION BEIM ANTIPPEN DEM DISPLAY
  onUserTouch: function () {
    this.shakeTimer = 0.90;
    this.touchJumpTimer = 0.60;
    window.playKodamaSound(1.3, 1.35); // Höheres, fröhliches Klappern
    this.pulseEmissiveGlow(0.95, 1600); // Intensiver smaragdgrüner Lichtimpuls

    // Nachbarn in der Nähe reagieren mit leisem Echo
    let myPos = this.el.object3D.position;
    allKodamaEntities.forEach(otherEl => {
      if (otherEl !== this.el) {
        let otherAgent = otherEl.components['kodama-agent'];
        if (otherAgent) {
          let dist = myPos.distanceTo(otherEl.object3D.position);
          if (dist < 4.5 && Math.random() < 0.50) {
            let echoDelay = 300 + Math.random() * 450;
            setTimeout(() => {
              otherAgent.respondToEcho();
            }, echoDelay);
          }
        }
      }
    });

    if (!this.data.isSitting && !isAnyKodamaVisitingUser) {
      this.startGreetingApproach();
    }
  },

  pulseEmissiveGlow: function (intensity = 0.6, durationMs = 1200) {
    let mesh = this.el.getObject3D('mesh');
    if (mesh) {
      mesh.traverse((node) => {
        if (node.isMesh && node.material) {
          node.material.emissiveIntensity = intensity;
          setTimeout(() => {
            if (node.material) node.material.emissiveIntensity = 0.25;
          }, durationMs);
        }
      });
    }
  },

  // BEGRÜSSUNGS-ANFLUG: HÄLT JETZT BEI ANGENEHMEN 1,20 METER ABSTAND AN!
  startGreetingApproach: function () {
    this.state = 'APPROACH_USER';
    isAnyKodamaVisitingUser = true;

    this.triggerSoundAndHeadShake(1.3, 1.25);
    this.pulseEmissiveGlow(0.85, 2500);

    setTimeout(() => {
      if (this.state === 'APPROACH_USER') {
        this.pickZoneTarget();
        this.state = 'RETURN_TO_ZONE';
      }
    }, 10000);
  },

  triggerSoundAndHeadShake: function (volFactor = 1.0, pitchStart = 1.25) {
    this.shakeTimer = 0.85;
    window.playKodamaSound(volFactor, pitchStart);
    this.triggerEchoToNeighbors();
  },

  triggerEchoToNeighbors: function () {
    let myPos = this.el.object3D.position;

    allKodamaEntities.forEach(otherEl => {
      if (otherEl !== this.el) {
        let otherAgent = otherEl.components['kodama-agent'];
        if (otherAgent) {
          let dist = myPos.distanceTo(otherEl.object3D.position);
          if (dist < 4.5 && Math.random() < 0.45) {
            let echoDelay = 350 + Math.random() * 550;
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
    window.playKodamaSound(0.6, 1.10);
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
      this.triggerSoundAndHeadShake(1.0, 1.20);
    }

    if (this.data.isSitting) {
      if (rand < 0.85) {
        this.state = 'SIT_LOOK_USER';
      } else {
        this.state = 'SIT_ROTATE';
        let randomAngle = (Math.random() - 0.5) * Math.PI * 0.5;
        this.dummy.position.copy(this.el.object3D.position);
        this.dummy.rotation.copy(this.el.object3D.rotation);
        this.dummy.rotation.y += randomAngle;
        this.targetQuaternion.copy(this.dummy.quaternion);
      }
    } else {
      if (rand < 0.50) {
        this.state = 'HOVER_LOOK_USER';

      } else if (rand < 0.85) {
        this.state = 'WANDER_ZONE';
        this.pickZoneTarget();

      } else if (this.data.id === 0 && !isAnyKodamaVisitingUser) {
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

  smoothLookAtCamera: function (deltaSec, speed = 2.4) {
    let camPos = new THREE.Vector3();
    this.cameraEl.object3D.getWorldPosition(camPos);

    let pos = this.el.object3D.position;
    this.dummy.position.copy(pos);
    this.dummy.lookAt(camPos.x, pos.y, camPos.z);
    this.dummy.rotateY(MODEL_FACE_ANGLE_RAD);

    this.el.object3D.quaternion.slerp(this.dummy.quaternion, deltaSec * speed);
  },

  smoothLookAtTarget: function (targetVector, deltaSec, speed = 1.4) {
    let pos = this.el.object3D.position;
    this.dummy.position.copy(pos);
    this.dummy.lookAt(targetVector.x, pos.y, targetVector.z);
    this.dummy.rotateY(MODEL_FACE_ANGLE_RAD);
    this.el.object3D.quaternion.slerp(this.dummy.quaternion, deltaSec * speed);
  },

  tick: function (time, timeDelta) {
    let deltaSec = timeDelta / 1000;
    this.timeOffset += deltaSec;

    let pos = this.el.object3D.position;

    // Kopfwackeln
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaSec;
      let shakeJitter = Math.sin(this.shakeTimer * 38) * 0.09;
      this.el.object3D.rotation.y += shakeJitter;
      this.el.object3D.rotation.z += shakeJitter * 0.5;
    }

    // Touch-Hüpfen
    let touchJumpY = 0;
    if (this.touchJumpTimer > 0) {
      this.touchJumpTimer -= deltaSec;
      touchJumpY = Math.sin(this.touchJumpTimer * Math.PI * 3) * 0.12;
    }

    // SITZENDE KODAMAS (3, 4, 5)
    if (this.data.isSitting) {
      let breathCycle = Math.sin(this.timeOffset * this.breathSpeed * 1.2);
      let scaleOffset = breathCycle * 0.015;
      let currentScale = this.data.baseScale + scaleOffset;
      this.el.object3D.scale.set(currentScale, currentScale + (scaleOffset * 0.3), currentScale);

      let floatY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight;
      pos.y = this.data.baseY + floatY + touchJumpY;

      if (this.state === 'SIT_LOOK_USER') {
        this.smoothLookAtCamera(deltaSec, 2.0);
      } else if (this.state === 'SIT_ROTATE') {
        this.el.object3D.quaternion.slerp(this.targetQuaternion, deltaSec * 0.8);
      }

      return;
    }

    // FLIEGENDE KODAMAS (1, 2, 6)
    let hoverY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight + touchJumpY;

    // Anti-Kollision
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

    if (this.state === 'HOVER_LOOK_USER') {
      this.smoothLookAtCamera(deltaSec, 1.8);
      pos.y = THREE.MathUtils.lerp(pos.y, this.data.baseY + hoverY, deltaSec * 1.2);

    } else if (this.state === 'WANDER_ZONE') {
      this.smoothLookAtCamera(deltaSec, 1.6);

      let dx = this.targetPos.x - pos.x;
      let dz = this.targetPos.z - pos.z;
      let distXZ = Math.sqrt(dx * dx + dz * dz);

      if (distXZ > 0.05) {
        let step = deltaSec * 0.60 * this.data.moveSpeed;
        pos.x += (dx / distXZ) * Math.min(step, step);
        pos.z += (dz / distXZ) * Math.min(step, step);
      }

      pos.y = THREE.MathUtils.lerp(pos.y, this.targetPos.y + hoverY, deltaSec * 1.5);

      if (distXZ < 0.45) {
        this.data.baseY = pos.y;
        this.state = 'HOVER_LOOK_USER';
      }

    } else if (this.state === 'APPROACH_USER') {
      let camPos = new THREE.Vector3();
      let camDir = new THREE.Vector3();
      this.cameraEl.object3D.getWorldPosition(camPos);
      this.cameraEl.object3D.getWorldDirection(camDir);

      // Schwebt auf genau 1,20 Meter Abstand zentral vor deine Linse
      let targetFront = new THREE.Vector3()
        .copy(camPos)
        .addScaledVector(camDir, -1.20);

      this.smoothLookAtCamera(deltaSec, 2.5);

      pos.lerp(targetFront, deltaSec * 1.3 * this.data.moveSpeed);
      pos.y += hoverY * 0.08;

    } else if (this.state === 'RETURN_TO_ZONE') {
      this.smoothLookAtCamera(deltaSec, 1.4);

      let dx = this.targetPos.x - pos.x;
      let dz = this.targetPos.z - pos.z;
      let distXZ = Math.sqrt(dx * dx + dz * dz);

      if (distXZ > 0.05) {
        let step = deltaSec * 0.60 * this.data.moveSpeed;
        pos.x += (dx / distXZ) * Math.min(step, step);
        pos.z += (dz / distXZ) * Math.min(step, step);
      }

      pos.y = THREE.MathUtils.lerp(pos.y, this.targetPos.y + hoverY, deltaSec * 1.5);

      if (distXZ < 0.50) {
        isAnyKodamaVisitingUser = false;
        this.data.baseY = pos.y;
        this.state = 'HOVER_LOOK_USER';
      }
    }
  }
});
