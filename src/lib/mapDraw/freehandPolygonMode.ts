// @ts-nocheck
// Sao chep nguyen trang tu du an thu nghiem ve ranh gioi to (test-map/src/lib/
// freehandPolygonMode.js) - xem NeighborhoodZonesMap.tsx (che do "Tự vẽ ranh
// giới"). Boc lai mapbox-gl-draw-freehand-mode: thu vien goc chi tat dragPan
// khi ve, nhung dragRotate van bat nen keo chuot co the vo tinh xoay ban do
// thay vi ve. Tat them dragRotate/touchZoomRotate trong luc ve, bat lai khi
// xong.
import FreehandPolygonMode from "mapbox-gl-draw-freehand-mode";

const baseOnSetup = FreehandPolygonMode.onSetup;
const baseOnStop = FreehandPolygonMode.onStop;

const PatchedFreehandPolygonMode = Object.assign({}, FreehandPolygonMode, {
    onSetup(...args) {
        const state = baseOnSetup.apply(this, args);
        setTimeout(() => {
            if (!this.map) return;
            this.map.dragRotate?.disable();
            this.map.touchZoomRotate?.disableRotation();
        }, 0);
        return state;
    },
    onStop(...args) {
        const result = baseOnStop.apply(this, args);
        setTimeout(() => {
            if (!this.map) return;
            this.map.dragRotate?.enable();
            this.map.touchZoomRotate?.enableRotation();
        }, 0);
        return result;
    },
});

export default PatchedFreehandPolygonMode;
