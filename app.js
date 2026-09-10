const PLANT_LOCATIONS = [
  { name: "Fixpunkt 1", x: 0.35, y: 1.86, z: -0.40 },
  { name: "Fixpunkt 2", x: 0.49, y: 1.67, z: -3.60 },
  { name: "Fixpunkt 3", x: 4.66, y: 2.76, z: -2.38 }
];

// 1. Zauberwald-Komponente (Spawnt Kodamas & löst Audio-Sperre)
AFRAME.registerComponent('magic-forest', {
  init: function () {
    let sceneEl = this.el.sceneEl;

    // Funktion zum aktiven Entsperren des Web-Audio-Kontexts auf Mobilgeräten
    let unlockAudio = () => {
      if (sceneEl.audioListener && sceneEl.audioListener.context && sceneEl.audioListener.context.state === 'suspended') {
        sceneEl.audioListener.context.resume();
      }
      
      let audioEl = document.querySelector('#kodama-sound');
      if (audioEl) {
        audioEl.play().then(() => {
          // Erfolgreich entsperrt
        }).catch(() => {});
      }
    };

    // Beim ersten Klick/Touch ODER beim AR-Start Audio freischalten
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    sceneEl.addEventListener('enter-vr', unlockAudio);

    // Spawnen der Kodamas beim Aufruf des AR-Modus
    sceneEl.addEventListener('enter-vr', () => {
      PLANT_LOCATIONS.forEach((loc) => {
        let kodama = document.createElement('a-entity');

        // 3D-Modell & Position
        kodama.setAttribute('gltf-model', '#kodama-model');
        kodama.setAttribute('position', `${loc.x} ${loc.y} ${loc.z}`);

        // Skalierung & Skelett-Animationen
        kodama.setAttribute('scale', '0.15 0.15 0.15');
        kodama.setAttribute('animation-mixer', 'clip: *; loop: repeat');

        // Räumlicher 3D-Sound
        kodama.setAttribute('sound', 'src: #kodama-sound; autoplay: true; loop: true; volume: 0.8; distanceModel: inverse; maxDistance: 5;');
        
        // Verhaltenslogik anhängen
        kodama.setAttribute('kodama-logic', '');

        // Sound explizit nach dem Laden abspielen
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

// 2. Kodama-Verhaltenslogik & Bewegungsmuster
AFRAME.registerComponent('kodama-logic', {
  schema: {
    speed: { type: 'number', default: 1 },
    height: { type: 'number', default: 0.08 }
  },

  init: function () {
    // Startkoordinaten des jeweiligen Kodamas nach dem Laden sichern
    setTimeout(() => {
      this.startX = this.el.object3D.position.x;
      this.startY = this.el.object3D.position.y;
      this.startZ = this.el.object3D.position.z;
    }, 150);

    this.time = Math.random() * 100;
    this.isInteracting = false;

    // Asynchroner Rhythmus: Alle 6 bis 12 Sekunden eine zufällige Aktion
    let randomInterval = 6000 + (Math.random() * 6000);
    setInterval(() => {
      this.checkSpontaneousAction();
    }, randomInterval);
  },

  checkSpontaneousAction: function () {
    if (this.isInteracting) return;

    let roll = Math.random();

    if (roll < 0.25) {
      // 25% Chance: Zu einer der anderen Pflanzen/Fixpunkte fliegen
      this.flyToPlant();
    } else if (roll < 0.40) {
      // 15% Chance: Zum Besucher fliegen
      this.flyToUser();
    } else if (roll < 0.55) {
      // 15% Chance: Zu einem zufälligen Ort fliegen & verweilen
      this.flyToRandomSpotAndIdle();
    } else if (roll < 0.70) {
      // 15% Chance: Sanft umhergleiten
      this.floatAround();
    }
    // 30% Chance: In Ruhe an der Startposition schwebend verharren
  },

  // Fliegt zu einem zufälligen Fixpunkt im Raum
  flyToPlant: function () {
    this.isInteracting = true;
    let targetPlant = PLANT_LOCATIONS[Math.floor(Math.random() * PLANT_LOCATIONS.length)];

    this.el.setAttribute('animation__fly', {
      property: 'position',
      to: `${targetPlant.x} ${targetPlant.y} ${targetPlant.z}`,
      dur: 4500,
      easing: 'easeInOutSine'
    });

    setTimeout(() => {
      this.returnHome();
    }, 8500);
  },

  // Fliegt ca. 1 Meter vor das Gesicht des Nutzers
  flyToUser: function () {
    this.isInteracting = true;

    this.el.setAttribute('animation__fly', {
      property: 'position',
      to: '0 1.5 -1.0',
      dur: 3500,
      easing: 'easeInOutSine'
    });

    setTimeout(() => {
      this.returnHome();
    }, 6500);
  },

  // Fliegt an einen zufälligen Punkt in der Nähe
  flyToRandomSpotAndIdle: function () {
    this.isInteracting = true;

    let randX = this.startX + (Math.random() - 0.5) * 2.5;
    let randY = this.startY + (Math.random() * 0.6);
    let randZ = this.startZ + (Math.random() - 0.5) * 2.5;

    this.el.setAttribute('animation__fly', {
      property: 'position',
      to: `${randX} ${randY} ${randZ}`,
      dur: 3000,
      easing: 'easeInOutSine'
    });

    setTimeout(() => {
      this.returnHome();
    }, 7000);
  },

  // Sanftes Umhergleiten
  floatAround: function () {
    this.isInteracting = true;

    let randX = this.startX + (Math.random() - 0.5) * 3.5;
    let randY = this.startY + (Math.random() * 0.8);
    let randZ = this.startZ + (Math.random() - 0.5) * 3.5;

    this.el.setAttribute('animation__fly', {
      property: 'position',
      to: `${randX} ${randY} ${randZ}`,
      dur: 6000,
      easing: 'linear'
    });

    setTimeout(() => {
      this.returnHome();
    }, 6000);
  },

  // Rückflug zur Heimatposition
  returnHome: function () {
    this.el.setAttribute('animation__fly', {
      property: 'position',
      to: `${this.startX} ${this.startY} ${this.startZ}`,
      dur: 3500,
      easing: 'easeInOutSine'
    });

    setTimeout(() => {
      this.isInteracting = false;
      this.el.removeAttribute('animation__fly');
    }, 3500);
  },

  // Kontinuierliche Schwebebewegung (Idle)
  tick: function (time, timeDelta) {
    if (!this.isInteracting && this.startY !== undefined) {
      this.time += timeDelta / 1000;
      let newY = this.startY + Math.sin(this.time * this.data.speed) * this.data.height;
      this.el.object3D.position.y = newY;
    }
  }
});
