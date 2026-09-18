// @goongmaps/goong-js khong kem san .d.ts (fork cua mapbox-gl-js) - khai bao
// module dang `any` de import duoc trong TS, giong cach xu ly cac thu vien
// JS thuan khac chua co type trong du an nay.
declare module "@goongmaps/goong-js" {
    const goongjs: any;
    export default goongjs;
}

declare module "@goongmaps/goong-js/dist/goong-js.css";
