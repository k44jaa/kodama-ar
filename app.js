// ============================================================
// KODAMA AR - CREATIVE SPACE LEUPHANA
// Individuelle & weit gestaffelte Verteilung im Raum
// ============================================================

const PLANT_LOCATIONS = [
  {
    name: "Kodama 1 (Nah & Rechts unten)",
    x: 1.40,     // 1,4m nach rechts
    y: 0.95,     // Eher bodennah / tief
    z: -1.60,    // Nah bei dir (1,6m Abstand)
    scale: 0.12  // Etwas kleiner
  },
  {
    name: "Kodama 2 (Mitte-Links & Augenhöhe)",
    x: -1.80,    // Leicht nach links
    y: 1.55,     // Auf Augenhöhe
    z: -3.20,    // Mittlere Distanz (3,2m Abstand)
    scale: 0.15  // Standardgröße
  },
  {
    name: "Kodama 3 (Weit hinten Links)",
    x: -3.80,    // Weit links an der Wand/Pflanze
    y: 1.10,     // Mittlere Höhe
    z: -5.20,    // Weit hinten im Raum (5,2m Abstand)
    scale: 0.17  // Etwas größer, damit er auf Distanz gut sichtbar ist
  },
  {
    name: "Kodama 4 (Rechts oben schwebend)",
    x: 2.20,     // Rechter Raumbereich
    y: 2.35,     // Hoch schwebend
    z: -3.80,    // Nach hinten versetzt (3,8m Abstand)
    scale: 0.14  // Fein skaliert
  }
];

AFRAME.registerComponent('magic-forest', {
  init: function () {
    let sceneEl = this.el.sceneEl;

    sceneEl.addEventListener('enter-vr', () => {
      if (this.spawned) return;
      this.spawned = true;

      PLANT_LOCATIONS.forEach((loc, index) => {
        let kodama = document.createElement('a-entity');

        kodama.setAttribute('gltf-model', '#kodama-model');
        kodama.setAttribute('position', { x: loc.x, y: loc.y, z: loc.z });

        // Jeder Kodama blickt in eine andere, zufällige Richtung
        let randomYRotation = Math.floor(Math.random() * 360);
        kodama.setAttribute('rotation', { x: 0, y: randomYRotation, z: 0 });

        // Individuelle Größe setzen
        kodama.setAttribute('scale', `${loc.scale} ${loc.scale} ${loc.scale}`);

        // Leicht variierende Animationsgeschwindigkeit für individuelle Bewegung
        let animSpeed = (0.7 + Math.random() * 0.5).toFixed(2);
        kodama.setAttribute('animation-mixer', `clip: *; loop: repeat; timeScale: ${animSpeed}`);

        // Einzigartige Schwebefrequenz pro Kodama
        kodama.setAttribute('kodama-logic', {
          speed: 0.6 + Math.random() * 0.8,
          height: 0.05 + Math.random() * 0.05,
          offset: index * 1.5 // Versetzte Schwebeprobe (nicht synchron!)
        });

        sceneEl.appendChild(kodama);
      });
    });
  }
});

// Eigenständige, asynchrone Schwebelogik
AFRAME.registerComponent('kodama-logic', {
  schema: {
    speed: { type: 'number', default: 1 },
    height: { type: 'number', default: 0.08 },
    offset: { type: 'number', default: 0 }
  },

  init: function () {
    setTimeout(() => {
      this.startY = this.el.object3D.position.y;
    }, 150);

    // Individuelle Startphase, damit sie nicht synchron auf und ab wippen
    this.time = this.data.offset + Math.random() * 50;
  },

  tick: function (time, timeDelta) {
    if (this.startY !== undefined) {
      this.time += timeDelta / 1000;
      let newY = this.startY + Math.sin(this.time * this.data.speed) * this.data.height;
      this.el.object3D.position.y = newY;
    }
  }
});
