// Feste Raumkoordinaten relativ zum NFC-Chip (in Metern)
const PLANT_LOCATIONS = [
  { name: "Pflanze 1 (Links Vorne)", x: -3.62, y: 1.05, z: -4.62 },
  { name: "Pflanze 2 (Links Hinten)", x: -3.48, y: 0.86, z: -1.42 },
  { name: "Pflanze 3 (Rechts Mitte)", x: 0.69, y: 1.95, z: -2.64 }
];

// 1. Zauberwald-Komponente (Setzt Kodamas fest an ihre Plätze)
AFRAME.registerComponent('magic-forest', {
  init: function () {
    let sceneEl = this.el.sceneEl;

    // Erzeugen der Kodamas an ihren festen Orten
    PLANT_LOCATIONS.forEach((loc, index) => {
      let kodama = document.createElement('a-entity');

      kodama.setAttribute('gltf-model', '#kodama-model');
      
      // Feste Position zuweisen
      kodama.setAttribute('position', { x: loc.x, y: loc.y, z: loc.z });

      // Individuelle Blickrichtung (0° bis 360°)
      let initialYRotation = Math.floor(Math.random() * 360);
      kodama.setAttribute('rotation', { x: 0, y: initialYRotation, z: 0 });

      // Skalierung (Größe)
      let randomScale = (0.13 + Math.random() * 0.04).toFixed(3);
      kodama.setAttribute('scale', `${randomScale} ${randomScale} ${randomScale}`);

      // Animationen (Kopfwackeln & Bewegungslauf aus Blender)
      let randomAnimSpeed = (0.8 + Math.random() * 0.4).toFixed(2);
      kodama.setAttribute('animation-mixer', `clip: *; loop: repeat; timeScale: ${randomAnimSpeed}`);

      // Räumlicher 3D-Sound
      kodama.setAttribute('sound', 'src: #kodama-sound; autoplay: true; loop: true; volume: 0.8; distanceModel: inverse; maxDistance: 6;');

      // Ortsfeste Schwebelogik anhängen
      kodama.setAttribute('kodama-logic', {
        speed: 0.8 + Math.random() * 0.6,    // Individuelles Schwebetempo
        height: 0.06 + Math.random() * 0.05   // Sanfte Schwebehöhe
      });

      sceneEl.appendChild(kodama);
    });
  }
});

// 2. Ortsfeste Schwebelogik (Keine Ausflüge mehr – bleiben an Ort und Stelle)
AFRAME.registerComponent('kodama-logic', {
  schema: {
    speed: { type: 'number', default: 1 },
    height: { type: 'number', default: 0.08 }
  },

  init: function () {
    // Start-Y-Höhe für das sanfte Auf-und-Ab-Schweben speichern
    setTimeout(() => {
      this.startY = this.el.object3D.position.y;
    }, 150);

    // Phasierungs-Offset, damit sie nicht synchron schweben
    this.time = Math.random() * 100;
  },

  // Kontinuierliches, sanftes Schweben exakt an ihrer Pflanze
  tick: function (time, timeDelta) {
    if (this.startY !== undefined) {
      this.time += timeDelta / 1000;
      let newY = this.startY + Math.sin(this.time * this.data.speed) * this.data.height;
      this.el.object3D.position.y = newY;
    }
  }
});
