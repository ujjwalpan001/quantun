declare module 'leaflet-side-by-side' {
  import * as L from 'leaflet';

  namespace L {
    namespace control {
      function sideBySide(leftLayers: L.LayerGroup, rightLayers: L.LayerGroup, options?: any): L.Control;
    }
  }
}
