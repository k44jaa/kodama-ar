// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA (INDIVIDUEN-VERSION)
// ============================================================

// Relativ berechnete Raumkoordinaten ab NFC-Startpunkt (in Metern)
const PLANT_LOCATIONS = [
  { name: "Fixpunkt 1 (Links Vorne)", x: -3.62, y: 1.05, z: -4.62 },
  { name: "Fixpunkt 2 (Links Hinten)", x: -3.48, y: 0.86, z: -1.42 },
  { name: "Fixpunkt 3 (Rechts Mitte)", x: 0.69, y: 1.95, z: -2.64 }
];

// 1. Zauberwald-Komponente (Erzeugt individuelle Kodamas)
AFRAME.registerComponent('magic-forest', {
  init: function () {
    let sceneEl = this.el.sceneEl;

    // Audio-Entsperrung für Mobilgeräte
    let unlockAudio = () => {
      if (sceneEl.audioListener && sceneEl.audioListener.context && sceneEl.audioListener.context.state === 'suspended') {
        sceneEl.audioListener.context.resume();
      }
      let audioEl = document.querySelector('#kodama-sound');
      if (audioEl) {
        audioEl.play().then(() => {}).catch(() => {});
      }
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    sceneEl.addEventListener('enter-vr', unlockAudio);

    // Spawnen beim AR-Start
    sceneEl.addEventListener('enter-vr', () => {
      PLANT_LOCATIONS.forEach((loc, index) => {
        let kodama = document.createElement('a-entity');

        kodama.setAttribute('gltf-model', '#kodama-model');
        
        // 1. Exakte & getrennte Positionierung
        kodama.setAttribute('position', { x: loc.x, y: loc.y, z: loc.z });

        // 2. Individuelle Blickrichtung (Zufällige Start-Rotation)
        let initialYRotation = Math.floor(Math.random() * 360);
        kodama.setAttribute('rotation', { x: 0, y: initialYRotation, z: 0 });

        // 3. Individuelle Körpergröße (zwischen 0.12 und 0.18)
        let randomScale = (0.12 + Math.random() * 0.06).toFixed(3);
        kodama.setAttribute('scale', `${randomScale} ${randomScale} ${randomScale}`);

        // 4. Individuelles GLB-Animationstempo (kein synchrones Wackeln)
        let randomAnimSpeed = (0.7 + Math.random() * 0.6).toFixed(2);
        kodama.setAttribute('animation-mixer', `clip: *; loop: repeat; timeScale: ${randomAnimSpeed}`);

        // 3D-Sound
        kodama.setAttribute('sound', 'src: #kodama-sound; autoplay: true; loop: true; volume: 0.8; distanceModel: inverse; maxDistance: 5;');
        
        // Individuelle Schwebeparameter übergeben
        kodama.setAttribute('kodama-logic', {
          speed: 0.8 + Math.random() * 0.8,    // Individuelles Schwebetempo
          height: 0.05 + Math.random() * 0.08,  // Individuelle Schwebehöhe
          id: index
        });

        kodama.addEventListener('sound-loaded', () => {
          if (kodama.components.sound) {
            kodama.components.sound.playSound();
          }
        });

        sceneEl.appendChild(kodama);
      });
    });
  }
});

// 2. Erweiterte KI- & Bewegungslogik
AFRAME.registerComponent('kodama-logic', {
  schema: {
    speed: { type: 'number', default: 1 },
    height: { type: 'number', default: 0.08 },
    id: { type: 'number', default: 0 }
  },

  init: function () {
    // Startkoordinaten und Start-Rotation sichern
    setTimeout(() => {
      let currentPos = this.el.object3D.position;
      let currentRot = this.el.object3D.rotation;

      this.startX = currentPos.x;
      this.startY = currentPos.y;
      this.startZ = currentPos.z;
      this.startRotY = THREE.MathUtils.radToDeg(currentRot.y);
    }, 200);

    // Phasierungs-Offset für die Sinus-Schwebebewegung
    this.time = Math.random() * 1000;
    this.isInteracting = false;

    // Zeitlich versetzter Start der Entscheidungslogik
    let initialDelay = 2000 + (Math.random() * 4000);
    setTimeout(() => {
      let randomInterval = 5000 + (Math.random() * 6000);
      setInterval(() => {
        this.checkSpontaneousAction();
      }, randomInterval);
    }, initialDelay);
  },

  // Hilfsfunktion: Dreht den Geist geschmeidig in Flugrichtung
  lookAtTarget: function (targetX, targetZ, duration) {
    let currentPos = this.el.object3D.position;
    let dx = targetX - currentPos.x;
    let dz = targetZ - currentPos.z;
    let angleRad = Math.atan2(dx, dz);
    let angleDeg = THREE.MathUtils.radToDeg(angleRad);

    this.el.setAttribute('animation__rotate', {
      property: 'rotation',
      to: `0 ${angleDeg} 0`,
      dur: Math.min(1000, duration / 2),
      easing: 'easeInOutQuad'
    });
  },

  checkSpontaneousAction: function () {
    if (this.isInteracting) return;

    let roll = Math.random();

    if (roll < 0.30) {
      this.flyToPlant();
    } else if (roll < 0.45) {
      this.flyToUser();
    } else if (roll < 0.65) {
      this.flyToRandomSpotAndIdle();
    } else if (roll < 0.80) {
      this.floatAround();
    }
  },

  flyToPlant: function () {
    this.isInteracting = true;
    let targetPlant = PLANT_LOCATIONS[Math.floor(Math.random() * PLANT_LOCATIONS.length)];
    let flightDur = 4000 + Math.random() * 1500;

    // Erst in Richtung Ziel drehen, dann fliegen
    this.lookAtTarget(targetPlant.x, targetPlant.z, flightDur);

    this.el.setAttribute('animation__fly', {
      property: 'position',
      to: `${targetPlant.x} ${targetPlant.y} ${targetPlant.z}`,
      dur: flightDur,
      easing: 'easeInOutSine'
    });

    setTimeout(() => {
      this.returnHome();
    }, flightDur + 3000 + Math.random() * 2000);
  },

  flyToUser: function () {
    this.isInteracting = true;
    let userX = 0;
    let userZ = -1.0;
    let flightDur = 3000 + Math.random() * 1000;

    this.lookAtTarget(userX, userZ, flightDur);

    this.el.setAttribute('animation__fly', {
      property: 'position',
      to: `${userX} 1.4 ${userZ}`,
      dur: flightDur,
      easing: 'easeInOutSine'
    });

    setTimeout(() => {
      this.returnHome();
    }, flightDur + 2500 + Math.random() * 2000);
  },

  flyToRandomSpotAndIdle: function () {
    this.isInteracting = true;

    let randX = this.startX + (Math.random() - 0.5) * 2.5;
    let randY = this.startY + (Math.random() * 0.5) - 0.25;
    let randZ = this.startZ + (Math.random() - 0.5) * 2.5;
    let flightDur = 3000 + Math.random() * 1000;

    this.lookAtTarget(randX, randZ, flightDur);

    this.el.setAttribute('animation__fly', {
      property: 'position',
      to: `${randX} ${randY} ${randZ}`,
      dur: flightDur,
      easing: 'easeInOutSine'
    });

    setTimeout(() => {
      this.returnHome();
    }, flightDur + 3000 + Math.random() * 2000);
  },

  floatAround: function () {
    this.isInteracting = true;

    let randX = this.startX + (Math.random() - 0.5) * 3.5;
    let randY = this.startY + (Math.random() * 0.6) - 0.3;
    let randZ = this.startZ + (Math.random() - 0.5) * 3.5;
    let flightDur = 5000 + Math.random() * 2000;

    this.lookAtTarget(randX, randZ, flightDur);

    this.el.setAttribute('animation__fly', {
      property: 'position',
      to: `${randX} ${randY} ${randZ}`,
      dur: flightDur,
      easing: 'linear'
    });

    setTimeout(() => {
      this.returnHome();
    }, flightDur);
  },

  returnHome: function () {
    let returnDur = 3500 + Math.random() * 1000;
    this.lookAtTarget(this.startX, this.startZ, returnDur);

    this.el.setAttribute('animation__fly', {
      property: 'position',
      to: `${this.startX} ${this.startY} ${this.startZ}`,
      dur: returnDur,
      easing: 'easeInOutSine'
    });

    setTimeout(() => {
      // Nach der Rückkehr wieder sanft in die ursprüngliche Blickrichtung drehen
      this.el.setAttribute('animation__rotate', {
        property: 'rotation',
        to: `0 ${this.startRotY} 0`,
        dur: 1000,
        easing: 'easeInOutQuad'
      });

      setTimeout(() => {
        this.isInteracting = false;
        this.el.removeAttribute('animation__fly');
        this.el.removeAttribute('animation__rotate');
      }, 1000);
    }, returnDur);
  },

  // Individuelles Sinus-Schweben (Idle)
  tick: function (time, timeDelta) {
    if (!this.isInteracting && this.startY !== undefined) {
      this.time += timeDelta / 1000;
      let newY = this.startY + Math.sin(this.time * this.data.speed) * this.data.height;
      this.el.object3D.position.y = newY;
    }
  }
});
