// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA
// Exakt berechnete Raumkoordinaten relativ zum NFC-Chip
// ============================================================

const PLANT_LOCATIONS = [
  { name: "Fixpunkt 1 (Links Vorne)", x: -3.62, y: 1.05, z: -4.62 },
  { name: "Fixpunkt 2 (Links Hinten)", x: -3.48, y: 0.86, z: -1.42 },
  { name: "Fixpunkt 3 (Rechts Mitte)", x: 0.69, y: 1.95, z: -2.64 }
];

AFRAME.registerComponent('magic-forest', {
  init: function () {
    let sceneEl = this.el.sceneEl;

    sceneEl.addEventListener('enter-vr', () => {
      let audioEl = document.querySelector('#kodama-sound');
      if (audioEl && audioEl.paused) {
        audioEl.play().catch(() => {});
      }

      if (this.spawned) return;
      this.spawned = true;

      PLANT_LOCATIONS.forEach((loc) => {
        let kodama = document.createElement('a-entity');

        kodama.setAttribute('gltf-model', '#kodama-model');
        kodama.setAttribute('position', { x: loc.x, y: loc.y, z: loc.z });

        // Zufällige Blickrichtung (0° bis 360°)
        let initialYRotation = Math.floor(Math.random() * 360);
        kodama.setAttribute('rotation', { x: 0, y: initialYRotation, z: 0 });

        // Individuelle Skalierung (Größe)
        let randomScale = (0.13 + Math.random() * 0.04).toFixed(3);
        kodama.setAttribute('scale', `${randomScale} ${randomScale} ${randomScale}`);

        // Animation aus Blender
        let randomAnimSpeed = (0.8 + Math.random() * 0.4).toFixed(2);
        kodama.setAttribute('animation-mixer', `clip: *; loop: repeat; timeScale: ${randomAnimSpeed}`);

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
