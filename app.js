const PLANT_LOCATIONS = [
  { name: "Pflanze 1 (Fenster)", x: 1.8, y: 0.9, z: -2.0 },
  { name: "Pflanze 2 (Eingang)", x: -2.2, y: 1.1, z: -1.5 },
  { name: "Pflanze 3 (Leseecke)", x: 0.5, y: 1.3, z: -3.0 }
];

AFRAME.registerComponent('magic-forest', {
  schema: {
    count: { type: 'number', default: 4 } // Anzahl der Geister
  },

  init: function () {
    this.el.sceneEl.addEventListener('enter-vr', () => {
      
      let audioEl = document.querySelector('#kodama-sound');
      if (audioEl) {
        audioEl.play().then(() => audioEl.pause()).catch(() => {});
      }

      for (let i = 0; i < this.data.count; i++) {
        let kodama = document.createElement('a-entity');

        kodama.setAttribute('gltf-model', '#kodama-model');

        let randX = (Math.random() - 0.5) * 5;
        let randY = 0.6 + (Math.random() * 1.2);
        let randZ = (Math.random() - 0.5) * 5;
        kodama.setAttribute('position', `${randX} ${randY} ${randZ}`);

        kodama.setAttribute('scale', '0.15 0.15 0.15');
        kodama.setAttribute('animation-mixer', 'clip: *; loop: repeat');

        kodama.setAttribute('sound', 'src: #kodama-sound; autoplay: true; loop: true; volume: 0.7; distanceModel: inverse; maxDistance: 4;');

        kodama.setAttribute('kodama-logic', '');

        this.el.sceneEl.appendChild(kodama);
      }
    });
  }
});

AFRAME.registerComponent('kodama-logic', {
  schema: {
    speed: { type: 'number', default: 1 },
    height: { type: 'number', default: 0.08 }
  },

  init: function () {
    setTimeout(() => {
      this.startX = this.el.object3D.position.x;
      this.startY = this.el.object3D.position.y;
      this.startZ = this.el.object3D.position.z;
    }, 150);

    this.time = Math.random() * 100;
    this.isInteracting = false;

    let randomInterval = 6000 + (Math.random() * 6000);
    setInterval(() => {
      this.checkSpontaneousAction();
    }, randomInterval);
  },

  checkSpontaneousAction: function () {
    if (this.isInteracting) return;

    let roll = Math.random();

    if (roll < 0.25) {
      this.flyToPlant();
    } else if (roll < 0.40) {
      this.flyToUser();
    } else if (roll < 0.55) {
      this.flyToRandomSpotAndIdle();
    } else if (roll < 0.70) {
      this.floatAround();
    }
  },

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

  tick: function (time, timeDelta) {
    if (!this.isInteracting && this.startY !== undefined) {
      this.time += timeDelta / 1000;
      let newY = this.startY + Math.sin(this.time * this.data.speed) * this.data.height;
      this.el.object3D.position.y = newY;
    }
  }
});
