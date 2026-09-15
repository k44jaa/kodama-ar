// Raumkoordinaten relativ zum NFC-Chip
// Mit local-floor entspricht Y der exakten Höhe über dem Boden!
const PLANT_LOCATIONS = [
  { name: "Fixpunkt 1 (Links Vorne)", x: -3.62, y: 1.86, z: -4.62 },
  { name: "Fixpunkt 2 (Links Hinten)", x: -3.48, y: 1.67, z: -1.42 },
  { name: "Fixpunkt 3 (Rechts Mitte)", x: 0.69, y: 2.76, z: -2.64 }
];

AFRAME.registerComponent('magic-forest', {
  init: function () {
    let sceneEl = this.el.sceneEl;

    // Triggert erst, wenn der AR-Modus aktiv ist
    sceneEl.addEventListener('enter-vr', () => {
      // Audio Listener sicherstellen
      if (sceneEl.audioListener && sceneEl.audioListener.context) {
        sceneEl.audioListener.context.resume();
      }

      // Nur einmalig erzeugen
      if (this.spawned) return;
      this.spawned = true;

      PLANT_LOCATIONS.forEach((loc) => {
        let kodama = document.createElement('a-entity');

        kodama.setAttribute('gltf-model', '#kodama-model');
        
        // Feste Position (Y = Höhe über dem Boden)
        kodama.setAttribute('position', { x: loc.x, y: loc.y, z: loc.z });

        // Zufällige Start-Blickrichtung (0° bis 360°)
        let initialYRotation = Math.floor(Math.random() * 360);
        kodama.setAttribute('rotation', { x: 0, y: initialYRotation, z: 0 });

        // Skalierung
        let randomScale = (0.13 + Math.random() * 0.04).toFixed(3);
        kodama.setAttribute('scale', `${randomScale} ${randomScale} ${randomScale}`);

        // Animation
        let randomAnimSpeed = (0.8 + Math.random() * 0.4).toFixed(2);
        kodama.setAttribute('animation-mixer', `clip: *; loop: repeat; timeScale: ${randomAnimSpeed}`);

        // Räumlicher 3D-Sound
        kodama.setAttribute('sound', 'src: #kodama-sound; autoplay: true; loop: true; volume: 0.8; distanceModel: inverse; maxDistance: 6;');

        // Ortsfeste Schwebelogik
        kodama.setAttribute('kodama-logic', {
          speed: 0.8 + Math.random() * 0.6,
          height: 0.06 + Math.random() * 0.05
        });

        sceneEl.appendChild(kodama);
      });
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
      this.startY = this.el.object3D.position.y;
    }, 150);

    this.time = Math.random() * 100;
  },

  tick: function (time, timeDelta) {
    if (this.startY !== undefined) {
      this.time += timeDelta / 1000;
      let newY = this.startY + Math.sin(this.time * this.data.speed) * this.data.height;
      this.el.object3D.position.y = newY;
    }
  }
});
