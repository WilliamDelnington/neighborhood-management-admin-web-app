// @ts-nocheck
// Sao chep nguyen trang tu test-map/src/lib/freehandLineMode.js - xem
// NeighborhoodZonesMap.tsx (che do "Tự vẽ ranh giới"). Che do ve duong thang
// TU DO: giu chuot trai + keo de ve (giong polygon freehand cua
// mapbox-gl-draw-freehand-mode), thay vi click tung diem. Duong ve ra duoc
// lam muot (turf/simplify) theo zoom de bot "ngoang ngoeo".
import MapboxGlDraw from "@mapbox/mapbox-gl-draw";
import simplify from "@turf/simplify";

const { cursors, types, modes, geojsonTypes } = MapboxGlDraw.constants;

const FreehandLineMode = Object.assign({}, MapboxGlDraw.modes.draw_line_string);

FreehandLineMode.onSetup = function onSetup() {
    const line = this.newFeature({
        type: geojsonTypes.FEATURE,
        properties: {},
        geometry: { type: geojsonTypes.LINE_STRING, coordinates: [] },
    });
    this.addFeature(line);
    this.clearSelectedFeatures();

    setTimeout(() => {
        if (!this.map) return;
        this.map.dragPan?.disable();
        this.map.dragRotate?.disable();
        this.map.touchZoomRotate?.disableRotation();
    }, 0);

    this.updateUIClasses({ mouse: cursors.ADD });
    this.activateUIButton(types.LINE);
    this.setActionableState({ trash: true });

    return { line, currentVertexPosition: 0, dragMoving: false };
};

FreehandLineMode.onDrag = FreehandLineMode.onTouchMove = function onDrag(state, e) {
    state.dragMoving = true;
    this.updateUIClasses({ mouse: cursors.ADD });
    state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    state.currentVertexPosition++;
    state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
};

FreehandLineMode.onMouseUp = function onMouseUp(state) {
    if (state.dragMoving) {
        this.simplify(state.line);
        this.changeMode(modes.SIMPLE_SELECT, { featureIds: [state.line.id] });
    }
};

FreehandLineMode.onTouchEnd = function onTouchEnd(state, e) {
    this.onMouseUp(state, e);
};

FreehandLineMode.simplify = function simplifyLine(line) {
    const tolerance = 1 / Math.pow(1.05, 10 * this.map.getZoom());
    simplify(line, { mutate: true, tolerance, highQuality: true });
};

// Khong ke thua draw_line_string.onStop: no cat bot toa do cuoi cung de bo
// diem "bam theo chuot" cua che do click-tung-diem - nhung o freehand khong
// co diem bam do, cat vao se mat luon diem cuoi vua ve.
FreehandLineMode.onStop = function onStop(state) {
    this.activateUIButton();
    setTimeout(() => {
        if (!this.map) return;
        this.map.dragPan?.enable();
        this.map.dragRotate?.enable();
        this.map.touchZoomRotate?.enableRotation();
    }, 0);

    if (this.getFeature(state.line.id) === undefined) return;

    if (state.line.isValid()) {
        this.map.fire("draw.create", { features: [state.line.toGeoJSON()] });
    } else {
        this.deleteFeature([state.line.id], { silent: true });
        this.changeMode(modes.SIMPLE_SELECT, {}, { silent: true });
    }
};

export default FreehandLineMode;
