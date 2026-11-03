/**
 * @file app.js
 * @description Autonomous WebXR Agent Architecture for Markerless AR.
 * Features mobile WebXR touch raycasting, interactive approach mechanics,
 * bioluminescent particle systems, and spatialized acoustic echoes.
 * 
 * @version 24.0.0
 */

const CONFIG = {
  MODEL_FACE_ANGLE_RAD: -Math.PI / 2,
  GREETING_DISTANCE_METERS: 1.10,
  GREETING_DELAY_MS: 2200,
  GREETING_DURATION_MS: 10000,
  HARMONY_INTERVAL_MS: 40000,
  SPORE_COUNT: 95,

  AUDIO: {
    MAX_VOLUME: 0.09,
    BASE_VOLUME_MIN: 0.045,
    BASE_VOLUME_VAR: 0.025,
    FADE_INTERVAL_MS: 35,
    FADE_STEP: 0.005
  },

  PROFILES: [
    { modelId: '#kodama-1', isSitting: false, minX: -4.5, maxX: -2.5, minZ: -5.0, maxZ: -3.5, minY: 1.10, maxY: 1.50, speed: 0.65 },
    { modelId: '#kodama-3', isSitting: true,  minX: -3.8, maxX: -2.2, minZ: -4.5, maxZ: -3.5, minY: 0.45, maxY: 0.45, speed: 0.0 },
    { modelId: '#kodama-2', isSitting: false, minX:  2.5, maxX:  4.5, minZ: -5.0, maxZ: -3.5, minY: 1.00, maxY: 1.40, speed: 0.60 },
    { modelId: '#kodama-5', isSitting: true,  minX:  2.2, maxX:  3.8, minZ: -4.5, maxZ: -3.5, minY: 0.55, maxY: 0.55, speed: 0.0 },
    { modelId: '#kodama-4', isSitting: true,  minX: -1.0, maxX:  1.0, minZ: -6.5, maxZ: -5.0, minY: 0.35, maxY: 0.35, speed: 0.0 },
    { modelId: '#kodama-6', isSitting: false, minX: -3.0, maxX:  3.0, minZ: -9.5, maxZ: -7.5, minY: 2.10, maxY: 2.60, speed: 0.45 }
  ]
};

let isAnyKodamaVisitingUser = false;
let allKodamaEntities = [];

window.playKodamaSound = function (volFactor = 1.0, pitchFactor = 1.0) {
  try {
    const snd = new Audio('./assets/sound.mp3');
    snd.volume = Math.min(
      CONFIG.AUDIO.MAX_VOLUME, 
      (CONFIG.AUDIO.BASE_VOLUME_MIN + Math.random() * CONFIG.AUDIO.BASE_VOLUME_VAR) * volFactor
    );
    snd.playbackRate = (0.90 + Math.random() * 0.20) * pitchFactor;
    
    snd.play().then(() => {
      setTimeout(() => {
        const fade = setInterval(() => {
          if (snd.volume > CONFIG.AUDIO.FADE_STEP) {
            snd.volume -= CONFIG.AUDIO.FADE_STEP;
          } else {
            clearInterval(fade);
            snd.pause();
          }
        }, CONFIG.AUDIO.FADE_INTERVAL_MS);
      }, 700);
    }).catch(() => {});
  } catch (e) {}
};

AFRAME.registerComponent('magic-forest', {
  schema: {
    count: { type: 'int', default: 6 }
  },

  init: function () {
    const sceneEl = this.el.sceneEl;

    sceneEl.addEventListener('enter-vr', () => {
      if (this.spawned) return;
      this.spawned = true;
      allKodamaEntities = [];

      this.createForestSpores(sceneEl);
      this.setupMobileTouchRaycaster(sceneEl);

      const activeProfiles = CONFIG.PROFILES;

      for (let i = 0; i < Math.min(this.data.count, activeProfiles.length); i++) {
        const profile = activeProfiles[i];
        const kodama = document.createElement('a-entity');

        kodama.setAttribute('gltf-model', profile.modelId);
        kodama.classList.add('clickable');

        const animSpeed = (0.45 + Math.random() * 0.30).toFixed(2);
        kodama.setAttribute('animation-mixer', `clip: *; loop: repeat; timeScale: ${animSpeed}`);

        const startPos = {
          x: profile.minX + Math.random() * (profile.maxX - profile.minX),
          y: profile.minY + Math.random() * (profile.maxY - profile.minY),
          z: profile.minZ + Math.random() * (profile.maxZ - profile.minZ)
        };

        kodama.setAttribute('position', startPos);
        kodama.setAttribute('rotation', { x: 0, y: Math.random() * 360, z: 0 });

        const scale = (0.11 + Math.random() * 0.02).toFixed(3);
        kodama.setAttribute('scale', `${scale} ${scale} ${scale}`);

        kodama.addEventListener('model-loaded', () => {
          const mesh = kodama.getObject3D('mesh');
          if (mesh) {
            mesh.traverse((node) => {
              if (node.isMesh) {
                node.userData.parentEntity = kodama;
                
                if (node.geometry && node.geometry.attributes.color) {
                  node.geometry.deleteAttribute('color');
                }

                if (node.material) {
                  node.material.vertexColors = false;

                  if (node.material.map && node.material.map.image) {
                    const processTexture = () => {
                      try {
                        const img = node.material.map.image;
                        const width = img.width || img.videoWidth || 512;
                        const height = img.height || img.videoHeight || 512;

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        const imgData = ctx.getImageData(0, 0, width, height);
                        const data = imgData.data;

                        for (let p = 0; p < data.length; p += 4) {
                          const brightness = (data[p] + data[p+1] + data[p+2]) / 3;

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

                        const newTex = new THREE.CanvasTexture(canvas);
                        newTex.flipY = node.material.map.flipY;
                        newTex.needsUpdate = true;

                        node.material.map = newTex;
                        node.material.needsUpdate = true;
                      } catch (e) {
                        console.warn("Texture processing exception:", e);
                      }
                    };

                    const img = node.material.map.image;
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

      setTimeout(() => {
        if (allKodamaEntities.length > 0) {
          const firstKodama = allKodamaEntities[0];
          const agent = firstKodama ? firstKodama.components['kodama-agent'] : null;
          if (agent) {
            agent.startGreetingApproach();
          }
        }
      }, CONFIG.GREETING_DELAY_MS);

      setInterval(() => {
        this.triggerForestHarmony();
      }, CONFIG.HARMONY_INTERVAL_MS);
    });
  },

  /** Native screen touch raycaster for 100% WebXR touch detection */
  setupMobileTouchRaycaster: function (sceneEl) {
    const handleScreenTouch = (e) => {
      let clientX = 0, clientY = 0;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.clientX !== undefined) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else return;

      const mouse = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
      );

      const camera = sceneEl.camera;
      if (!camera) return;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const meshes = [];
      allKodamaEntities.forEach(el => {
        const m = el.getObject3D('mesh');
        if (m) meshes.push(m);
      });

      const intersects = raycaster.intersectObjects(meshes, true);
      if (intersects.length > 0) {
        let hitObj = intersects[0].object;
        let parentEnt = hitObj.userData.parentEntity;

        while (hitObj && !parentEnt) {
          hitObj = hitObj.parent;
          if (hitObj && hitObj.userData && hitObj.userData.parentEntity) {
            parentEnt = hitObj.userData.parentEntity;
          }
        }

        if (parentEnt) {
          const agent = parentEnt.components['kodama-agent'];
          if (agent) agent.onUserTouch();
        }
      }
    };

    window.addEventListener('touchstart', handleScreenTouch, { passive: true });
    window.addEventListener('click', handleScreenTouch);
  },

  createForestSpores: function (sceneEl) {
    const pCount = CONFIG.SPORE_COUNT;
    const pGeo = new THREE.BufferGeometry();
    const posArr = new Float32Array(pCount * 3);

    for (let p = 0; p < pCount * 3; p += 3) {
      posArr[p]   = (Math.random() - 0.5) * 14;
      posArr[p+1] = 0.3 + Math.random() * 2.8;
      posArr[p+2] = -1.5 - Math.random() * 9;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));

    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32; pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(180, 255, 210, 0.95)');
    grad.addColorStop(0.4, 'rgba(80, 230, 150, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 32, 32);

    const pMat = new THREE.PointsMaterial({
      size: 0.14,
      map: new THREE.CanvasTexture(pCanvas),
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const pMesh = new THREE.Points(pGeo, pMat);
    sceneEl.object3D.add(pMesh);

    sceneEl.addEventListener('tick', (e) => {
      const t = e.detail.time / 1000;
      const pos = pGeo.attributes.position.array;
      for (let i = 1; i < pCount * 3; i += 3) {
        pos[i] += Math.sin(t + i) * 0.0012;
      }
      pGeo.attributes.position.needsUpdate = true;
    });
  },

  triggerForestHarmony: function () {
    allKodamaEntities.forEach((kodamaEl, idx) => {
      setTimeout(() => {
        const agent = kodamaEl.components['kodama-agent'];
        if (agent) {
          agent.triggerSoundAndHeadShake(1.2, 1.20 - idx * 0.05);
          agent.pulseEmissiveGlow(0.70, 1600);
        }
      }, idx * 300);
    });
  }
});

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

  /** Rich touch reaction: bioluminescent burst, double hop & curious flight approach */
  onUserTouch: function () {
    this.shakeTimer = 1.10;
    this.touchJumpTimer = 0.75;
    
    // High-pitched excited rattle
    window.playKodamaSound(1.4, 1.45);
    
    // Bright bioluminescent glow flash
    this.pulseEmissiveGlow(1.20, 1800);

    // Neighboring spirits turn to watch and echo
    const myPos = this.el.object3D.position;
    allKodamaEntities.forEach(otherEl => {
      if (otherEl !== this.el) {
        const otherAgent = otherEl.components['kodama-agent'];
        if (otherAgent) {
          const dist = myPos.distanceTo(otherEl.object3D.position);
          if (dist < 4.5) {
            setTimeout(() => {
              otherAgent.smoothLookAtTarget(myPos, 0.016, 3.0);
              otherAgent.respondToEcho();
            }, 250 + Math.random() * 350);
          }
        }
      }
    });

    // The touched Kodama flies over to investigate the user!
    if (!this.data.isSitting) {
      this.startGreetingApproach();
    }
  },

  pulseEmissiveGlow: function (intensity = 0.6, durationMs = 1200) {
    const mesh = this.el.getObject3D('mesh');
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

  startGreetingApproach: function () {
    this.state = 'APPROACH_USER';
    isAnyKodamaVisitingUser = true;

    this.triggerSoundAndHeadShake(1.3, 1.25);
    this.pulseEmissiveGlow(0.90, 2500);

    setTimeout(() => {
      if (this.state === 'APPROACH_USER') {
        this.pickZoneTarget();
        this.state = 'RETURN_TO_ZONE';
      }
    }, CONFIG.GREETING_DURATION_MS);
  },

  triggerSoundAndHeadShake: function (volFactor = 1.0, pitchStart = 1.25) {
    this.shakeTimer = 0.85;
    window.playKodamaSound(volFactor, pitchStart);
    this.triggerEchoToNeighbors();
  },

  triggerEchoToNeighbors: function () {
    const myPos = this.el.object3D.position;

    allKodamaEntities.forEach(otherEl => {
      if (otherEl !== this.el) {
        const otherAgent = otherEl.components['kodama-agent'];
        if (otherAgent) {
          const dist = myPos.distanceTo(otherEl.object3D.position);
          if (dist < 4.5 && Math.random() < 0.45) {
            const echoDelay = 350 + Math.random() * 550;
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
    const interval = 5500 + Math.random() * 4500;

    setTimeout(() => {
      this.makeDecision();
      this.scheduleNextDecision();
    }, interval);
  },

  makeDecision: function () {
    const rand = Math.random();

    if (Math.random() < 0.22) {
      this.triggerSoundAndHeadShake(1.0, 1.20);
    }

    if (this.data.isSitting) {
      if (rand < 0.85) {
        this.state = 'SIT_LOOK_USER';
      } else {
        this.state = 'SIT_ROTATE';
        const randomAngle = (Math.random() - 0.5) * Math.PI * 0.5;
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
    const camPos = new THREE.Vector3();
    this.cameraEl.object3D.getWorldPosition(camPos);

    const pos = this.el.object3D.position;
    this.dummy.position.copy(pos);
    this.dummy.lookAt(camPos.x, pos.y, camPos.z);
    this.dummy.rotateY(CONFIG.MODEL_FACE_ANGLE_RAD);

    this.el.object3D.quaternion.slerp(this.dummy.quaternion, deltaSec * speed);
  },

  smoothLookAtTarget: function (targetVector, deltaSec, speed = 1.4) {
    const pos = this.el.object3D.position;
    this.dummy.position.copy(pos);
    this.dummy.lookAt(targetVector.x, pos.y, targetVector.z);
    this.dummy.rotateY(CONFIG.MODEL_FACE_ANGLE_RAD);
    this.el.object3D.quaternion.slerp(this.dummy.quaternion, deltaSec * speed);
  },

  tick: function (time, timeDelta) {
    const deltaSec = timeDelta / 1000;
    this.timeOffset += deltaSec;

    const pos = this.el.object3D.position;

    // Head shake rotation
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaSec;
      const shakeJitter = Math.sin(this.shakeTimer * 38) * 0.09;
      this.el.object3D.rotation.y += shakeJitter;
      this.el.object3D.rotation.z += shakeJitter * 0.5;
    }

    // Touch jump height
    let touchJumpY = 0;
    if (this.touchJumpTimer > 0) {
      this.touchJumpTimer -= deltaSec;
      touchJumpY = Math.sin(this.touchJumpTimer * Math.PI * 4) * 0.16;
    }

    if (this.data.isSitting) {
      const breathCycle = Math.sin(this.timeOffset * this.breathSpeed * 1.2);
      const scaleOffset = breathCycle * 0.015;
      const currentScale = this.data.baseScale + scaleOffset;
      this.el.object3D.scale.set(currentScale, currentScale + (scaleOffset * 0.3), currentScale);

      const floatY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight;
      pos.y = this.data.baseY + floatY + touchJumpY;

      if (this.state === 'SIT_LOOK_USER') {
        this.smoothLookAtCamera(deltaSec, 2.0);
      } else if (this.state === 'SIT_ROTATE') {
        this.el.object3D.quaternion.slerp(this.targetQuaternion, deltaSec * 0.8);
      }

      return;
    }

    const hoverY = Math.sin(this.timeOffset * this.floatSpeed) * this.floatHeight + touchJumpY;

    allKodamaEntities.forEach(other => {
      if (other !== this.el) {
        const otherPos = other.object3D.position;
        const dx = pos.x - otherPos.x;
        const dz = pos.z - otherPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 1.6 && dist > 0.05) {
          const push = (1.6 - dist) * deltaSec * 0.30;
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

      const dx = this.targetPos.x - pos.x;
      const dz = this.targetPos.z - pos.z;
      const distXZ = Math.sqrt(dx * dx + dz * dz);

      if (distXZ > 0.05) {
        const step = deltaSec * 0.60 * this.data.moveSpeed;
        pos.x += (dx / distXZ) * Math.min(step, step);
        pos.z += (dz / distXZ) * Math.min(step, step);
      }

      pos.y = THREE.MathUtils.lerp(pos.y, this.targetPos.y + hoverY, deltaSec * 1.5);

      if (distXZ < 0.45) {
        this.data.baseY = pos.y;
        this.state = 'HOVER_LOOK_USER';
      }

    } else if (this.state === 'APPROACH_USER') {
      const camPos = new THREE.Vector3();
      const camDir = new THREE.Vector3();
      this.cameraEl.object3D.getWorldPosition(camPos);
      this.cameraEl.object3D.getWorldDirection(camDir);

      const targetFront = new THREE.Vector3()
        .copy(camPos)
        .addScaledVector(camDir, -CONFIG.GREETING_DISTANCE_METERS);

      this.smoothLookAtCamera(deltaSec, 2.5);

      pos.lerp(targetFront, deltaSec * 1.3 * this.data.moveSpeed);
      pos.y += hoverY * 0.08;

    } else if (this.state === 'RETURN_TO_ZONE') {
      this.smoothLookAtCamera(deltaSec, 1.4);

      const dx = this.targetPos.x - pos.x;
      const dz = this.targetPos.z - pos.z;
      const distXZ = Math.sqrt(dx * dx + dz * dz);

      if (distXZ > 0.05) {
        const step = deltaSec * 0.60 * this.data.moveSpeed;
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
