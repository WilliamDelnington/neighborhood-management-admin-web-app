// @ts-nocheck
// Sao chep nguyen trang tu test-map/src/lib/rectangleMode.js - xem
// NeighborhoodZonesMap.tsx (che do "Tự vẽ ranh giới"). Boc lai
// mapbox-gl-draw-rectangle-mode: ban goc co loi go nham ten option khi chuyen
// mode sau khi ve xong ("featuresId" thay vi "featureIds"), khien hinh chu
// nhat KHONG duoc chon san - nguoi dung phai tu click them 1-2 lan moi vao
// duoc che do keo tung goc (direct_select). Sua lai: sau khi chot goc thu 2,
// vao thang direct_select cho dung hinh do.
import DrawRectangleMode from "mapbox-gl-draw-rectangle-mode";

const PatchedRectangleMode = Object.assign({}, DrawRectangleMode, {
    onClick(state, e) {
        const isSecondClick =
            state.startPoint &&
            state.startPoint[0] !== e.lngLat.lng &&
            state.startPoint[1] !== e.lngLat.lat;

        if (isSecondClick) {
            this.updateUIClasses({ mouse: "pointer" });
            state.endPoint = [e.lngLat.lng, e.lngLat.lat];
            this.changeMode("direct_select", { featureId: state.rectangle.id });
            return;
        }

        state.startPoint = [e.lngLat.lng, e.lngLat.lat];
    },
});

export default PatchedRectangleMode;
