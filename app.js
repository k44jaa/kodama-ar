AFRAME.registerComponent('kodama-logic', {
  schema: {
    speed: {type: 'number', default: 1}, 
    height: {type: 'number', default: 0.1},
    visitInterval: {type: 'number', default: 6000} 
  },
  
  init: function () {
    this.startY = this.el.object3D.position.y;
    this.startX = this.el.object3D.position.x;
    this.startZ = this.el.object3D.position.z;
    
    this.time = 0;
    this.isInteracting = false; 

    setInterval(() => {
      this.checkSpontaneousAction();
    }, this.data.visitInterval);
  },

  checkSpontaneousAction: function () {
    if (this.isInteracting) return;

    // Wir würfeln eine Zufallszahl zwischen 0.0 und 1.0
    let randomChance = Math.random();

    if (randomChance < 0.15) {
      // Option 1 (15% Chance): Er fliegt direkt zur Kamera (User)
      this.flyToUser();
    } else if (randomChance < 0.30) {
      // Option 2 (15% Chance): Er fliegt an einen Ort, bleibt dort hängen und wackelt
      this.flyToRandomSpotAndIdle();
    } else if (randomChance < 0.45) {
      // Option 3 (15% Chance): Er schwebt ganz sanft und fließend durch die Gegend
      this.floatAround();
    }
    // Option 4 (55% Chance): Er macht gar nichts und schwebt normal an der Pflanze weiter
  },

  flyToUser: function () {
    this.isInteracting = true;

    if (this.el.components.sound) {
      this.el.components.sound.playSound();
    }

    this.el.setAttribute('animation__fly', {
      property: 'position',
      to: `${this.startX} ${this.startY + 0.3} 1.5`, 
      dur: 4000, 
      easing: 'easeInOutSine'
    });

    // Nach 6 Sekunden (4s Flug + 2s Aufenthalt vor der Kamera) gehts zurück
    setTimeout(() => {
      this.returnHome();
    }, 6000);
  },

  flyToRandomSpotAndIdle: function () {
    this.isInteracting = true;

    // Zufällige Position in der Nähe berechnen
    let randX = this.startX + (Math.random() - 0.5) * 2; 
    let randY = this.startY + (Math.random() * 0.5); 
    let randZ = this.startZ + (Math.random() * 1.5); 

    this.el.setAttribute('animation__fly', {
      property: 'position',
      to: `${randX} ${randY} ${randZ}`,
      dur: 3000, 
      easing: 'easeInOutSine'
    });

    // Er bleibt dort und wackelt, bis er nach 7 Sekunden (3s Flug + 4s Pause) umkehrt
    setTimeout(() => {
      this.returnHome();
    }, 7000); 
  },

  floatAround: function () {
    this.isInteracting = true;

    // Ein etwas weiterer Radius für das Umherschweben
    let randX = this.startX + (Math.random() - 0.5) * 3; 
    let randY = this.startY + (Math.random() * 0.8); 
    let randZ = this.startZ + (Math.random() * 2); 

    // Geisterhaftes, konstantes Gleiten (linear) über 8 Sekunden
    this.el.setAttribute('animation__fly', {
      property: 'position',
      to: `${randX} ${randY} ${randZ}`,
      dur: 8000, 
      easing: 'linear' 
    });

    // Sobald er am Ziel ankommt, gibt es keine Pause. Er gleitet direkt sanft zurück.
    setTimeout(() => {
      this.el.setAttribute('animation__fly', {
        property: 'position',
        to: `${this.startX} ${this.startY} ${this.startZ}`,
        dur: 8000,
        easing: 'linear'
      });

      // Wenn der Rückflug (weitere 8 Sekunden) vorbei ist, ist die Interaktion beendet
      setTimeout(() => {
        this.isInteracting = false;
        this.el.removeAttribute('animation__fly'); 
      }, 8000);

    }, 8000); 
  },

  returnHome: function () {
    this.el.setAttribute('animation__fly', {
      property: 'position',
      to: `${this.startX} ${this.startY} ${this.startZ}`,
      dur: 3000,
      easing: 'easeInOutSine'
    });

    setTimeout(() => {
      this.isInteracting = false;
      this.el.removeAttribute('animation__fly'); 
    }, 3000);
  },

  tick: function (time, timeDelta) {
    // Standard-Auf-und-Ab an der Pflanze
    if (!this.isInteracting) {
      this.time += timeDelta / 1000;
      let newY = this.startY + Math.sin(this.time * this.data.speed) * this.data.height;
      this.el.object3D.position.y = newY;
    }
  }
});