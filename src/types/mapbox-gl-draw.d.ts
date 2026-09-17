// Cac thu vien vi mapbox-gl-draw khong kem san .d.ts phu hop (hoac ta phien
// ban cu) - khai bao module dang `any`, giong cach xu ly @goongmaps/goong-js
// (xem goong-js.d.ts). Ban than mapbox-gl-draw tuong thich voi goong-js vi
// goong-js la mot ban fork cua mapbox-gl-js.
declare module "@mapbox/mapbox-gl-draw" {
    const MapboxDraw: any;
    export default MapboxDraw;
}

declare module "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

declare module "mapbox-gl-draw-freehand-mode" {
    const FreehandMode: any;
    export default FreehandMode;
}

declare module "mapbox-gl-draw-rectangle-mode" {
    const RectangleMode: any;
    export default RectangleMode;
}
