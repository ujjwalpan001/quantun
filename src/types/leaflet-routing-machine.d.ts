declare module 'leaflet-routing-machine' {
  import * as L from 'leaflet';

  namespace L {
    namespace Routing {
      interface ControlOptions {
        waypoints?: L.LatLng[];
        router?: any;
        routeWhileDragging?: boolean;
        addWaypoints?: boolean;
        createMarker?: (i: number, waypoint: any, n: number) => L.Marker;
        lineOptions?: {
          styles?: Array<{ color: string; weight: number; opacity: number }>;
        };
        [key: string]: any;
      }

      interface Control extends L.Control {
        getWaypoints(): L.LatLng[];
        setWaypoints(waypoints: L.LatLng[]): this;
        spliceWaypoints(index: number, waypointsToRemove: number, ...waypoints: L.LatLng[]): L.LatLng[];
        getPlan(): any;
      }

      function control(options?: ControlOptions): Control;
      
      function osrmv1(options?: {
        serviceUrl?: string;
        profile?: string;
        [key: string]: any;
      }): any;
    }
  }

  export = L;
}
