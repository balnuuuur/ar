// Camera-relative preview until GPS arrives; then a fixed nearby GPS anchor.
(function () {
  'use strict';
  AFRAME.registerComponent('nearby-anchor', {
    init: function () {
      this.anchored = false;
      this.direction = new THREE.Vector3();
      this.model = document.getElementById('magnemite');
      this.preview = document.getElementById('preview');
      this.cameraEl = document.querySelector('[gps-camera]');
      document.documentElement.dataset.arMode = 'preview';
    },
    tick: function () {
      if (this.anchored) return;
      const gps = this.cameraEl.components['gps-camera'];
      const camera = this.el.camera;
      if (!gps || !gps.originCoords || !gps.currentCoords || !camera) return;
      // Do not freeze an assumed north before the phone's compass has started.
      if (!Number.isFinite(gps.heading)) return;
      if (!this.compassReadyAt) this.compassReadyAt = performance.now() + 500;
      if (performance.now() < this.compassReadyAt) return;
      if (!this.model.getObject3D('mesh') || !this.preview.getObject3D('mesh')) return;
      camera.updateMatrixWorld(true);
      camera.getWorldDirection(this.direction);
      const horizontal = Math.hypot(this.direction.x, this.direction.z);
      // A phone pointing down needs a preview until the user raises it.
      if (horizontal < 0.35) return;
      const latitude = gps.currentCoords.latitude - 8 * this.direction.z / horizontal / 111320;
      const longitude = gps.currentCoords.longitude + 8 * this.direction.x / horizontal /
        (111320 * Math.max(0.01, Math.cos(gps.currentCoords.latitude * Math.PI / 180)));
      this.model.setAttribute('gps-entity-place', { latitude, longitude });
      const place = this.model.components['gps-entity-place'];
      if (!place || !place._cameraGps) return;
      place._updatePosition();
      // Centre the model on the viewing ray, rather than above eye level.
      const box = new THREE.Box3().setFromObject(this.model.getObject3D('mesh'));
      const height = box.getCenter(new THREE.Vector3()).y;
      const cameraPosition = camera.getWorldPosition(new THREE.Vector3());
      const position = this.model.getAttribute('position');
      position.y = cameraPosition.y + 8 * this.direction.y / horizontal - height;
      this.model.setAttribute('position', position);
      this.model.setAttribute('visible', true);
      this.preview.setAttribute('visible', false);
      this.anchored = true;
      document.documentElement.dataset.arMode = 'gps';
    }
  });
  window.addEventListener('DOMContentLoaded', function () {
    document.querySelector('a-scene').setAttribute('nearby-anchor', '');
  });
}());
