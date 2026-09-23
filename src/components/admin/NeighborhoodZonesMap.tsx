import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
    Award,
    Crosshair,
    Flame,
    HeartHandshake,
    Home,
    Map as MapIcon,
    MapPin,
    MapPinned,
    Maximize2,
    Minimize2,
    Phone,
    Satellite,
    Search,
    Trash2,
    UserRound,
    Users,
    Wallet,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@lib/utils";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Checkbox } from "@components/ui/checkbox";
import { AppError, EmergencyComplaintGisPoint, Household, Neighborhood } from "@dts";
import {
    HOUSEHOLD_STATE_LIST,
    HouseholdStateKey,
    TRANG_THAI_PHAN_ANH_LABEL,
    TRANG_THAI_PHAN_ANH_TONE,
} from "@constants/domain";
import { POI_CATEGORY_LIST, PoiCategoryMeta } from "@constants/poi";
import {
    fetchNeighborhoods,
    updateNeighborhoodGeometry,
} from "@service/neighborhoodApi";
import {
    GeoAutocompletePrediction,
    autocompleteNeighborhoodPlaces,
    fetchNeighborhoodPlaceDetails,
} from "@service/neighborhoodGeoApi";
import {
    HouseholdGisOverview,
    HouseholdGisOverviewPoint,
    fetchHouseholdGisOverview,
    fetchHouseholds,
} from "@service/householdApi";
import { Poi, createPoi, fetchPois } from "@service/poiApi";
import { fetchEmergencyComplaintGisOverview } from "@service/complaintApi";
import { useAuthStore } from "@store/authStore";
import wardBoundary from "@assets/geo/duongNoiWardBoundary.json";

const GOONG_MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY || "";
const DEFAULT_CENTER: [number, number] = [105.745, 20.98]; // Phường Dương Nội
const DEFAULT_ZOOM = 14;
// Bien phuong Duong Noi (tu wardBoundary) mo rong them mot bien do, dung lam
// maxBounds cho ban do - "chỉ khoanh vùng trong phường thôi", tranh nguoi dung
// keo/zoom ra qua xa khoi khu vuc quan ly.
//
// 0.08 (khong phai 0.02) - ranh gioi phuong la mot khoi CHEO DAI (~3.5km
// ngang x ~4.6km doc), trong khi khung ban do tren Dashboard rat DET NGANG
// (vd ~2.7:1). maxBounds luon uu tien khong cho lo ra ngoai CA HAI chieu, nen
// zoom-ra-xa-nhat bi CHIEU NGANG khong che truoc (vi khung det ngang can
// nhieu do-kinh-do hon do-vi-do o cung 1 muc zoom) - luc do chieu doc chi con
// hien duoc mot phan nho cua bien, cat mat phan tren/duoi cac To (da xay ra
// voi 0.02: chi hien ~30% chieu cao bien). Tang dem len 0.08 de khi zoom ra
// het co theo maxBounds, chieu doc van con du cho hien TRON VEN bien phuong.
const WARD_BOUNDS_PADDING_DEG = 0.08;

// Chi lay 4 trang thai NGUOI DUNG TU BAT/TAT (auto=false) - "Có trẻ em/người
// khuyết tật" la tu tinh (xem HOUSEHOLD_STATE_LIST trong constants/domain.ts),
// khong phu hop lam bo loc "hien trang thai tren ban do" o day.
const HOUSEHOLD_STATUS_FILTERS = HOUSEHOLD_STATE_LIST.filter(state => !state.auto);
const HOUSEHOLD_TONE_COLOR: Record<string, string> = {
    yellow: "#f59e0b",
    red: "#dc2626",
    blue: "#2563eb",
    green: "#16a34a",
    gray: "#6b7280",
};
const HOUSEHOLD_NEUTRAL_COLOR = "#2563eb";
const HOUSEHOLD_MULTI_MATCH_COLOR = "#1f2937";
const HOUSEHOLD_STATE_ICON: Record<string, typeof Users> = {
    needsSupport: HeartHandshake,
    isNearPoor: Wallet,
    isMartyrFamilyHousehold: Award,
    isLonelyElderly: UserRound,
};

// "Bản đồ tiện ích" - doc tu database (bang Poi, quan tri o trang /pois),
// KHONG con goi Goong Autocomplete truc tiep luc xem Dashboard nua (chi dung
// luc "Quét" o trang quan tri, xem PoiListPage.tsx) - vi ket qua Autocomplete
// co the sai/thieu (khong phai tim theo danh muc that), nen phai qua buoc
// admin duyet (verified=true) truoc khi hien cho moi nguoi xem.
const POI_MARKER_COLOR = "#dc2626";

/**
 * Tao phan tu marker rieng (icon lucide tren nen tron mau) thay vi pin mac
 * dinh cua goong-js (chi doi mau, khong doi hinh dang) - giong kieu hien thi
 * tren Google Maps, giup phan biet nhanh danh muc/trang thai nao voi danh
 * muc/trang thai nao chi bang mat thuong (dung chung cho marker Poi va marker
 * Ho dan - xem buildPoiMarkerElement/buildHouseholdMarkerElement ben duoi).
 * Dung renderToStaticMarkup vi day la Icon component cua lucide-react (React),
 * can chuyen thanh chuoi SVG truoc khi gan vao innerHTML cua phan tu DOM thuan
 * (goong-js Marker nhan mot HTMLElement, khong nhan JSX).
 */
function buildIconMarkerElement(
    icon: typeof Users | undefined,
    color: string,
    size = 28,
): HTMLDivElement {
    const el = document.createElement("div");
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = "50%";
    el.style.background = color;
    el.style.border = "2px solid #fff";
    el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.45)";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    if (icon) {
        const Icon = icon;
        el.innerHTML = renderToStaticMarkup(
            <Icon size={Math.round(size * 0.54)} color="#fff" strokeWidth={2.5} />,
        );
    }
    return el;
}

function buildPoiMarkerElement(category?: PoiCategoryMeta): HTMLDivElement {
    return buildIconMarkerElement(category?.icon, category?.color || POI_MARKER_COLOR);
}

// "Nha" mac dinh (khong khop trang thai nao, hoac khop nhieu hon 1 trang thai
// - xem HOUSEHOLD_MULTI_MATCH_COLOR) - dung icon rieng cua trang thai do khi
// CHI khop dung 1, giong cach cac the loc trang thai ben duoi ban do da hien
// icon rieng cho tung trang thai (xem HOUSEHOLD_STATE_ICON).
function buildHouseholdMarkerElement(
    matched: (typeof HOUSEHOLD_STATUS_FILTERS)[number][],
    color: string,
): HTMLDivElement {
    const icon = matched.length === 1 ? HOUSEHOLD_STATE_ICON[matched[0].key] : Home;
    return buildIconMarkerElement(icon || Home, color, 26);
}

type MapStyleKey = "street" | "satellite";
type MapStyleGroup = "Mặc định" | "Vệ tinh";
const MAP_STYLES: Record<
    MapStyleKey,
    {
        label: string;
        group: MapStyleGroup;
        url: string;
        icon: typeof MapIcon;
        thumbClassName: string;
    }
> = {
    street: {
        label: "Đường phố",
        group: "Mặc định",
        url: `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAPTILES_KEY}`,
        icon: MapIcon,
        thumbClassName: "bg-gradient-to-br from-slate-100 to-blue-100 text-blue-600",
    },
    satellite: {
        label: "Vệ tinh",
        group: "Vệ tinh",
        url: `https://tiles.goong.io/assets/goong_satellite.json?api_key=${GOONG_MAPTILES_KEY}`,
        icon: Satellite,
        thumbClassName: "bg-gradient-to-br from-emerald-800 to-slate-900 text-white",
    },
};
const MAP_STYLE_GROUPS: MapStyleGroup[] = ["Mặc định", "Vệ tinh"];

// Bang mau phan biet toi da 21 to - lap lai theo chu ky neu co nhieu to hon.
const ZONE_PALETTE = [
    "#4f8ef7", "#f2994a", "#27ae60", "#eb5757", "#9b51e0",
    "#2d9cdb", "#f2c94c", "#219653", "#bb6bd9", "#56ccf2",
    "#f2994a", "#6fcf97", "#e67e22", "#2f80ed", "#c0392b",
    "#8e44ad", "#16a085", "#d35400", "#2c3e50", "#f39c12",
    "#7f8c8d",
];

/**
 * Nut "phóng to/thu nhỏ" duoi dang IControl cua goong-js (them qua
 * map.addControl, giong NavigationControl) thay vi mot button React dinh vi
 * absolute voi offset px doan chung (truoc day la top-[92px], doan theo chieu
 * cao NavigationControl) - cach lam cu bi lech/xau vi offset doan khong khop
 * chinh xac chieu cao thuc te cua nhom nut zoom/compass. Them vao cung vi tri
 * "top-right" ngay sau NavigationControl, goong-js se tu xep vao chung mot
 * cot va dung san class CSS mapboxgl-ctrl-group nen luon thang hang, dong bo
 * kieu dang (bo vien, do rong, khoang cach) voi cac nut zoom co san.
 */
class ExpandMapControl {
    private container: HTMLDivElement | null = null;

    private button: HTMLButtonElement | null = null;

    private expanded = false;

    private onToggle: () => void;

    constructor(onToggle: () => void) {
        this.onToggle = onToggle;
    }

    onAdd() {
        this.container = document.createElement("div");
        this.container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        this.button = document.createElement("button");
        this.button.type = "button";
        this.button.className = "mapboxgl-ctrl-icon";
        this.button.style.display = "flex";
        this.button.style.alignItems = "center";
        this.button.style.justifyContent = "center";
        this.button.addEventListener("click", e => {
            e.stopPropagation();
            this.onToggle();
            // Bo focus ngay - nut nay la phan tu DOM ON DINH (goong-js
            // khong tao lai control luc resize), khi ancestor cua no nhay tu
            // fixed inset-0 (phu toan man hinh) ve lai vi tri binh thuong
            // (thap hon nhieu, sau cac the thong ke/bo loc), mot so trinh
            // duyet se tu dong cuon trang de "giu" phan tu dang focus trong
            // khung nhin - khien trang bi cuon lech xuong duoi, trong nhu
            // "vỡ layout" ngay sau khi thu nho ban do lai.
            this.button?.blur();
        });
        this.renderIcon();
        this.container.appendChild(this.button);
        return this.container;
    }

    onRemove() {
        this.container?.parentNode?.removeChild(this.container);
        this.container = null;
        this.button = null;
    }

    setExpanded(expanded: boolean) {
        this.expanded = expanded;
        this.renderIcon();
    }

    private renderIcon() {
        if (!this.button) return;
        this.button.title = this.expanded ? "Thu nhỏ bản đồ" : "Phóng to bản đồ";
        const Icon = this.expanded ? Minimize2 : Maximize2;
        this.button.innerHTML = renderToStaticMarkup(
            <Icon size={16} strokeWidth={2.25} />,
        );
    }
}

type LngLatBounds = {
    extend: (coord: [number, number]) => LngLatBounds;
    getCenter: () => { lng: number; lat: number };
};

// GeoJSON Polygon/MultiPolygon - duyet toan bo diem de mo rong bounds, khong
// phu thuoc thu vien nao (goong-js khong co san ham fitBounds tu geometry).
function extendBoundsWithGeometry(
    bounds: LngLatBounds,
    geometry: { type: string; coordinates: unknown },
) {
    const rings =
        geometry.type === "MultiPolygon"
            ? (geometry.coordinates as number[][][][])
            : [(geometry.coordinates as number[][][])];
    rings.forEach(polygon =>
        polygon.forEach(ring =>
            ring.forEach(coord => bounds.extend(coord as [number, number])),
        ),
    );
}

// Tinh bien do bao quanh ranh gioi Phuong (co dem them WARD_BOUNDS_PADDING_DEG)
// mot lan duy nhat luc module nap, dung lam maxBounds cho ban do - "chỉ khoanh
// vùng trong phường thôi", khong cho pan/zoom ra qua xa khoi khu vuc quan ly.
function computeWardMaxBounds(padding: number): [[number, number], [number, number]] {
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    const accumulator: LngLatBounds = {
        extend(coord) {
            const [lng, lat] = coord;
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            return accumulator;
        },
        getCenter: () => ({ lng: (minLng + maxLng) / 2, lat: (minLat + maxLat) / 2 }),
    };
    const feature = (
        wardBoundary as { features: Array<{ geometry: { type: string; coordinates: unknown } }> }
    ).features[0];
    extendBoundsWithGeometry(accumulator, feature.geometry);
    return [
        [minLng - padding, minLat - padding],
        [maxLng + padding, maxLat + padding],
    ];
}
const WARD_MAX_BOUNDS = computeWardMaxBounds(WARD_BOUNDS_PADDING_DEG);

// Tim ancestor thuc su cuon trang (vd <main class="overflow-y-auto"> cua
// AdminLayout.tsx, KHONG phai luon la window/body) - dung de luu/phuc hoi lai
// vi tri cuon truoc/sau che do "phóng to" ban do (xem toggleMapExpanded), vi
// che do nay dat mot phan tu con position:fixed inset-0 - khi thu nho lai,
// mot so trinh duyet tu dong cuon ancestor nay de "giu" nut bam (dang
// focus, xem ExpandMapControl) trong khung nhin, khien trang bi giat/cuon
// lech xuong duoi so voi truoc khi phong to.
function findScrollParent(el: HTMLElement | null): HTMLElement | null {
    let node = el?.parentElement || null;
    while (node && node !== document.body) {
        const style = getComputedStyle(node);
        if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
            return node;
        }
        node = node.parentElement;
    }
    return null;
}

// Chan noi bot su kien tu marker (the DOM de len canvas) xuong
// canvasContainer - noi goong-js/mapbox-gl-js gan listener tinh "click" cho ca
// map (dua tren cap mousedown/mouseup, xem bindHandlers trong goong-js). Neu
// khong chan tu mousedown/touchstart (khong chi "click"), click/cham vao
// marker de bi tinh nham thanh click vao layer "zones-fill" ben duoi, chon
// nham ca To dan pho thay vi mo popup cua marker.
function preventMapClickThrough(el: HTMLElement) {
    el.addEventListener("mousedown", e => e.stopPropagation());
    el.addEventListener("touchstart", e => e.stopPropagation(), { passive: true });
}

function escapeHtml(value: string): string {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Mot dong thong tin trong popup ban do (icon xam nho + text) - dung chung
// cho dia chi/SDT o ca popup Poi va popup Ho dan, thay vi chi la text tron
// (xem buildPoiPopupHTML/buildHouseholdPopupHTML) de de phan biet tung dong
// bang mat thuong hon la doc chu.
function popupInfoRow(icon: typeof Users, text: string): string {
    const Icon = icon;
    const svg = renderToStaticMarkup(
        <Icon size={13} color="#94a3b8" strokeWidth={2} />,
    );
    return `
        <div style="display:flex;align-items:flex-start;gap:6px;margin-top:4px;color:#64748b;line-height:1.45">
            <span style="flex-shrink:0;margin-top:2px">${svg}</span>
            <span>${text}</span>
        </div>
    `;
}

// Nhan danh muc dang "badge" (icon + chu tren nen mau nhat cua danh muc) -
// dung o dau popup Poi de nhan biet nhanh loai dia diem, dong bo voi mau cua
// marker tren ban do (xem buildIconMarkerElement).
function popupCategoryBadge(icon: typeof Users, label: string, color: string): string {
    const Icon = icon;
    const svg = renderToStaticMarkup(
        <Icon size={11} color={color} strokeWidth={2.5} />,
    );
    return `
        <div style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px 3px 7px;border-radius:999px;background:${color}17;margin-bottom:7px">
            ${svg}
            <span style="font-size:11px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;color:${color}">${escapeHtml(label)}</span>
        </div>
    `;
}

function buildZonePopupHTML(zone: Neighborhood): string {
    return `
        <div style="font-size:13px;line-height:1.5">
            <strong>${escapeHtml(zone.name)}</strong><br/>
            Mã: ${escapeHtml(zone.code)}<br/>
            Số nhà đã ghi nhận: ${zone.houseCount ?? 0}
            ${zone.leaderUserId?.displayName ? `<br/>Tổ trưởng: ${escapeHtml(zone.leaderUserId.displayName)}` : ""}
        </div>
    `;
}

function matchedHouseholdStates(point: HouseholdGisOverviewPoint) {
    return HOUSEHOLD_STATUS_FILTERS.filter(state => point[state.key]);
}

// data-household-detail: doc lai o listener click marker (xem effect ve
// marker Ho dan) de dieu huong sang trang chi tiet ho dan - giong cach lam
// voi popup Poi (buildPoiPopupHTML), Popup cua goong-js chi nhan HTML thuan.
function buildHouseholdPopupHTML(point: HouseholdGisOverviewPoint): string {
    const matched = matchedHouseholdStates(point);
    const stateTags = matched.length
        ? `
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
                ${matched
                    .map(state => {
                        const color =
                            HOUSEHOLD_TONE_COLOR[state.tone] || HOUSEHOLD_NEUTRAL_COLOR;
                        return `<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;background:${color}1A;color:${color};font-size:11px;font-weight:500">${escapeHtml(state.label)}</span>`;
                    })
                    .join("")}
            </div>
        `
        : "";
    return `
        <div style="min-width:190px;max-width:250px;font-size:13px">
            <div style="font-weight:600;color:#0f172a;line-height:1.4">${escapeHtml(point.headOfHousehold)} <span style="font-weight:400;color:#94a3b8">(${escapeHtml(point.code)})</span></div>
            ${popupInfoRow(MapPin, escapeHtml(point.address))}
            ${point.phone ? popupInfoRow(Phone, escapeHtml(point.phone)) : ""}
            ${stateTags}
            <button
                type="button"
                data-household-detail="${escapeHtml(point.householdId)}"
                style="margin-top:10px;width:100%;padding:6px 12px;border-radius:7px;border:none;background:#0891b2;color:#fff;font-size:12px;font-weight:600;cursor:pointer"
            >Xem chi tiết hộ dân</button>
        </div>
    `;
}

// data-household-detail: doc lai o listener click marker (xem effect ve marker
// POI) de dieu huong sang trang chi tiet ho dan - Popup cua goong-js chi nhan
// HTML thuan, khong the gan onClick truc tiep nhu JSX duoc.
function buildPoiPopupHTML(poi: Poi): string {
    const categoryMeta = POI_CATEGORY_LIST.find(c => c.key === poi.category);
    const categoryTag = categoryMeta
        ? popupCategoryBadge(categoryMeta.icon, categoryMeta.label, categoryMeta.color)
        : "";

    const household =
        poi.category === "household" && poi.householdId && typeof poi.householdId === "object"
            ? poi.householdId
            : null;
    if (!household) {
        return `
            <div style="min-width:190px;max-width:250px;font-size:13px">
                ${categoryTag}
                <div style="font-weight:600;color:#0f172a;line-height:1.4">${escapeHtml(poi.name)}</div>
                ${poi.address ? popupInfoRow(MapPin, escapeHtml(poi.address)) : ""}
            </div>
        `;
    }
    return `
        <div style="min-width:190px;max-width:250px;font-size:13px">
            ${categoryTag}
            <div style="font-weight:600;color:#0f172a;line-height:1.4">${escapeHtml(household.headOfHousehold)} <span style="font-weight:400;color:#94a3b8">(${escapeHtml(household.code)})</span></div>
            ${popupInfoRow(MapPin, escapeHtml(household.address))}
            ${household.phone ? popupInfoRow(Phone, escapeHtml(household.phone)) : ""}
            <button
                type="button"
                data-household-detail="${escapeHtml(household._id)}"
                style="margin-top:10px;width:100%;padding:6px 12px;border-radius:7px;border:none;background:#0891b2;color:#fff;font-size:12px;font-weight:600;cursor:pointer"
            >Xem chi tiết hộ dân</button>
        </div>
    `;
}

const EMERGENCY_MARKER_COLOR = "#dc2626";

// Marker "khan cap" tren Ban do - pattern "animate-ping": 2 vong tron lan toa
// so le mo dan LIEN TUC (xem .complaint-pulse-marker__ring trong index.css)
// phia sau icon tron dac dung yen, de nhan ra giua cac marker Ho dan/Poi khac.
function buildEmergencyMarkerElement(size = 30): HTMLDivElement {
    const wrapper = document.createElement("div");
    wrapper.className = "complaint-pulse-marker";
    wrapper.style.width = `${size}px`;
    wrapper.style.height = `${size}px`;
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";

    const ring1 = document.createElement("div");
    ring1.className = "complaint-pulse-marker__ring";
    wrapper.appendChild(ring1);

    const ring2 = document.createElement("div");
    ring2.className = "complaint-pulse-marker__ring complaint-pulse-marker__ring--delay";
    wrapper.appendChild(ring2);

    const dot = buildIconMarkerElement(Flame, EMERGENCY_MARKER_COLOR, size);
    dot.classList.add("complaint-pulse-marker__dot");
    wrapper.appendChild(dot);

    return wrapper;
}

function relativeTimeFromNow(iso: string): string {
    const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.round(hours / 24)} ngày trước`;
}

// data-complaint-detail: doc lai o listener click marker (xem effect ve
// marker phan anh khan cap) de dieu huong sang trang chi tiet phan anh -
// Popup cua goong-js chi nhan HTML thuan, khong the gan onClick truc tiep nhu
// JSX duoc (cung quy uoc voi buildHouseholdPopupHTML/buildPoiPopupHTML).
function buildEmergencyComplaintPopupHTML(point: EmergencyComplaintGisPoint): string {
    const statusColor =
        HOUSEHOLD_TONE_COLOR[TRANG_THAI_PHAN_ANH_TONE[point.status]] ||
        HOUSEHOLD_NEUTRAL_COLOR;
    return `
        <div style="min-width:200px;max-width:260px;font-size:13px">
            <div style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;background:${statusColor}1A;color:${statusColor};font-size:11px;font-weight:600;margin-bottom:6px">${escapeHtml(TRANG_THAI_PHAN_ANH_LABEL[point.status])}</div>
            <div style="font-weight:600;color:#0f172a;line-height:1.4">${escapeHtml(point.title)}</div>
            <div style="color:#64748b;font-size:11px;margin-top:2px">${escapeHtml(point.categoryLabel)} · ${escapeHtml(point.code)}</div>
            ${point.area ? popupInfoRow(MapPin, escapeHtml(point.area)) : ""}
            <div style="color:#94a3b8;font-size:11px;margin-top:4px">${escapeHtml(relativeTimeFromNow(point.createdAt))}</div>
            <button
                type="button"
                data-complaint-detail="${escapeHtml(point._id)}"
                style="margin-top:10px;width:100%;padding:6px 12px;border-radius:7px;border:none;background:${EMERGENCY_MARKER_COLOR};color:#fff;font-size:12px;font-weight:600;cursor:pointer"
            >Xem chi tiết phản ánh</button>
        </div>
    `;
}

/**
 * Goong-js xu ly source "satellite" trong style goong_satellite.json sai (ep
 * ve host tiles.goong.io + doi sang .webp), phai tu fetch style roi thay the
 * bang tile URL truc tiep tu satellite.goong.io - dung y het cach test-map/
 * src/components/MapView.jsx da lam. Style "street" khong dinh loi nay nen
 * chi can tra ve URL de goong-js tu fetch.
 */
async function resolveMapStyle(key: MapStyleKey): Promise<string | object> {
    const config = MAP_STYLES[key];
    if (key !== "satellite") return config.url;

    const res = await fetch(config.url);
    const styleJson = await res.json();
    if (styleJson.sources?.satellite) {
        styleJson.sources.satellite = {
            type: "raster",
            tiles: [`https://satellite.goong.io/{z}/{x}/{y}.png?api_key=${GOONG_MAPTILES_KEY}`],
            tileSize: 256,
        };
    }
    return styleJson;
}

/**
 * Ban do ranh gioi 21 To dan pho phuong Duong Noi tren Dashboard, dung Goong
 * Maps JS SDK (@goongmaps/goong-js) - cung nen tang ban do da dung o du an thu
 * nghiem ve ranh gioi to (xem test-map/src/components/MapView.jsx), tan dung
 * lai key Goong san co thay vi xin them key Google Maps rieng. Thu vien duoc
 * import DONG (dynamic import) va chi khoi tao ban do khi nguoi dung bam "Xem
 * bản đồ" - giu dung quy uoc cost-saving cua HouseMapPanel.tsx.
 *
 * Ho tro 2 kieu nen ban do (duong pho/ve tinh - "chon da map") va chon nhieu
 * To cung luc trong danh sach de zoom/noi bat dong thoi nhieu vung tren ban do.
 */
interface NeighborhoodZonesMapProps {
    // Mac dinh true: luon tu hien ban do ngay (khong can bam "Xem bản đồ" nua,
    // ke ca o widget Dashboard) - khac quy uoc bam-de-tai cua HouseMapPanel.tsx
    // (nha so) vi widget nay it duoc dat o nhieu trang cung luc hon. Truyen
    // autoShow={false} neu can quay lai hanh vi bam-de-tai o mot noi cu the.
    autoShow?: boolean;
    mapHeightClassName?: string;
    // Mac dinh AN muc "Tự vẽ ranh giới" - tinh nang nay chi bat o trang rieng
    // "/map-boundary" (MapBoundaryPage.tsx), tach khoi trang "/map" (xem chi)
    // va widget Dashboard de nguoi chi can XEM ban do khong bi roi voi cong cu
    // ve chi danh cho nguoi co quyen neighborhoods.manage/update_gis.
    showDrawTools?: boolean;
    // Mac dinh false: widget Dashboard va trang "/map" (xem) giu nguyen bo cuc
    // nho, nhung nhu HouseMapPanel.tsx. CHI trang "/map-boundary" truyen true -
    // luon chiem toan man hinh (khong doi theo drawModeOn nua) de co khong
    // gian ve du, danh sach To cung an bot cot "so nha" cho gon (xem
    // isFullscreenLayout ben duoi).
    alwaysFullscreen?: boolean;
}

const NeighborhoodZonesMap: React.FC<NeighborhoodZonesMapProps> = ({
    autoShow = true,
    mapHeightClassName = "h-[600px]",
    showDrawTools = false,
    alwaysFullscreen = false,
}) => {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    // neighborhoods.manage la quyen rong hon, mac nhien bao gom duoc quyen
    // hep neighborhoods.update_gis (xem PATCH /api/neighborhoods/:id/geometry).
    const canDrawBoundary = Boolean(
        user?.permissions?.includes("neighborhoods.manage") ||
            user?.permissions?.includes("neighborhoods.update_gis"),
    );
    const canViewHouseholds = Boolean(user?.permissions?.includes("households.read"));
    const canViewComplaints = Boolean(user?.permissions?.includes("complaints.read"));
    // "Bản đồ tiện ích" + "Gắn hộ dân lên bản đồ": theo yeu cau, KHONG con kiem
    // tra quyen pois.read/pois.manage rieng nua - ai vao duoc trang ban do (da
    // qua AdminGuard cua MapPage/MapBoundaryPage) la dung duoc luon.
    const canViewPois = true;
    const canPinHouseholds = true;
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[] | null>(null);
    const [listError, setListError] = useState(false);
    const [mapVisible, setMapVisible] = useState(false);
    const [mapLoading, setMapLoading] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [mapStyleKey, setMapStyleKey] = useState<MapStyleKey>("street");
    // Che do "phóng to" ban do - CSS position:fixed thuan (khong dung native
    // Fullscreen API, xem ghi chu o cho khoi tao goongjs.Map ben duoi).
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
    const [searchText, setSearchText] = useState("");
    const [searchSuggestions, setSearchSuggestions] = useState<
        GeoAutocompletePrediction[]
    >([]);
    const [searching, setSearching] = useState(false);
    const [drawModeOn, setDrawModeOn] = useState(false);
    const [drawnFeatures, setDrawnFeatures] = useState<
        { id: string | number; name: string; neighborhoodId?: string }[]
    >([]);
    const [assignSelection, setAssignSelection] = useState<Record<string, string>>({});
    const [savingFeatureId, setSavingFeatureId] = useState<string | number | null>(null);
    const [mapInstanceReady, setMapInstanceReady] = useState(false);
    const [householdOverview, setHouseholdOverview] = useState<HouseholdGisOverview | null>(
        null,
    );
    const [householdOverviewError, setHouseholdOverviewError] = useState(false);
    const [selectedHouseholdStates, setSelectedHouseholdStates] = useState<
        HouseholdStateKey[]
    >([]);
    // "Tất cả hộ dân" - che do rieng hien TAT CA ho dan da co toa do (tu GIS
    // cua nha lien ket, xem HouseholdGisOverviewPoint) len ban do, KHONG can
    // loc theo trang thai dac biet nao (khac 4 the loc ben tren, chi hien khi
    // co chon). Doc lap voi selectedHouseholdStates - co the bat ca hai cung
    // luc (xem effect ve marker o duoi).
    const [showAllHouseholds, setShowAllHouseholds] = useState(false);
    const [selectedPoiCategoryKey, setSelectedPoiCategoryKey] = useState<string | null>(null);
    const [poiResults, setPoiResults] = useState<Poi[]>([]);
    const [poiLoading, setPoiLoading] = useState(false);
    const [poiError, setPoiError] = useState(false);
    // Marker "khan cap" (phan anh danh muc isUrgent, dang moi_tiep_nhan/dang_xu_ly)
    // - LUON hien khi co du lieu, khong co nut bat/tat rieng (da bo nut "Khẩn
    // cấp" de do choi giao dien) vi day la thong tin can duoc chu y ngay khi
    // mo trang Ban do.
    const [emergencyComplaints, setEmergencyComplaints] = useState<
        EmergencyComplaintGisPoint[]
    >([]);
    const [emergencyComplaintsError, setEmergencyComplaintsError] = useState(false);
    // "Gắn hộ dân lên bản đồ" - bat che do chi tren "/map-boundary"
    // (showDrawTools=true), xem toggle button va cac effect lien quan ben duoi.
    const [pinModeOn, setPinModeOn] = useState(false);
    const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);
    const [pinHouseholdSearch, setPinHouseholdSearch] = useState("");
    const [pinHouseholdResults, setPinHouseholdResults] = useState<Household[]>([]);
    const [pinHouseholdSearching, setPinHouseholdSearching] = useState(false);
    const [pinSelectedHousehold, setPinSelectedHousehold] = useState<Household | null>(null);
    const [pinSubmitting, setPinSubmitting] = useState(false);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    // any: @goongmaps/goong-js khong kem type (xem src/types/goong-js.d.ts).
    const mapRef = useRef<any>(null);
    const goongRef = useRef<any>(null);
    const popupRef = useRef<any>(null);
    const householdPopupRef = useRef<any>(null);
    const householdMarkersRef = useRef<any[]>([]);
    const poiPopupRef = useRef<any>(null);
    const poiMarkersRef = useRef<any[]>([]);
    const emergencyPopupRef = useRef<any>(null);
    const emergencyMarkersRef = useRef<any[]>([]);
    const searchMarkerRef = useRef<any>(null);
    const searchSessionTokenRef = useRef<string | null>(null);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Doc gia tri moi nhat cua pinModeOn trong cac handler duoc bind mot lan
    // (vd click "zones-fill" trong bindInteractions) - state thuong bi "stale"
    // trong closure cua goong-js event handler.
    const pinModeOnRef = useRef(false);
    // Doc gia tri moi nhat cua mapStyleKey trong handler click "zones-fill"
    // (bind mot lan, cung ly do can pinModeOnRef o tren) - o che do "Vệ tinh",
    // bam vao vung To KHONG hien popup/chon To nua (chi de nhin ro nha tren
    // anh ve tinh), chi marker Ho dan/tien ich moi phan hoi khi bam.
    const mapStyleKeyRef = useRef<MapStyleKey>("street");
    const pendingPinMarkerRef = useRef<any>(null);
    const pinHouseholdDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // any: @mapbox/mapbox-gl-draw khong kem type (xem src/types/mapbox-gl-draw.d.ts).
    const drawRef = useRef<any>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const expandControlRef = useRef<ExpandMapControl | null>(null);
    // Luu lai center/zoom NGAY TRUOC luc bam "phóng to" (xem toggleMapExpanded)
    // de phuc hoi chinh xac sau khi thu nho lai - goong-js/mapbox-gl tu dieu
    // chinh (clamp) zoom theo maxBounds moi khi container doi kich thuoc dot
    // ngot (o day la tu box nho len toan man hinh roi nguoc lai), neu khong
    // luu/phuc hoi thi luc thu nho lai ban do co the bi nhay lech
    // center/zoom so voi truoc khi phong to - dung "vỡ layout" ma nguoi dung
    // gap phai.
    const preExpandCameraRef = useRef<{ center: [number, number]; zoom: number } | null>(
        null,
    );
    // Luu lai ancestor cuon trang thuc su + vi tri cuon cua no NGAY TRUOC luc
    // phong to (xem toggleMapExpanded/findScrollParent) - phong ngua truong
    // hop trinh duyet tu cuon trang de giu nut ExpandMapControl (dang focus)
    // trong khung nhin luc thu nho lai (da chan bang button.blur(), nhung giu
    // them lop nay de phuc hoi dut diem neu van co le lech nao khac).
    const preExpandScrollRef = useRef<{ parent: HTMLElement | null; top: number } | null>(
        null,
    );

    useEffect(() => {
        fetchNeighborhoods({ limit: 100, active: true })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setListError(true));
    }, []);

    // Tai truoc so lieu Ho dan (de hien so luong tren tung the trang thai)
    // ngay khi widget mount, khong doi bam gi them - marker CHI ve khi admin
    // chon it nhat 1 trang thai (xem effect ve marker ben duoi).
    useEffect(() => {
        if (!canViewHouseholds) return;
        fetchHouseholdGisOverview()
            .then(setHouseholdOverview)
            .catch(() => setHouseholdOverviewError(true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canViewHouseholds]);

    // Marker "khan cap" - tai ngay luc mount (khong doi bam gi, khac Ho dan/Poi)
    // roi lam moi dinh ky 30s, de trang thai phan anh doi o noi khac (vd nhan
    // vien khac tiep nhan/dong) phan anh len ban do ma khong can F5 thu cong.
    useEffect(() => {
        if (!canViewComplaints) return undefined;
        let cancelled = false;
        const load = () => {
            fetchEmergencyComplaintGisOverview()
                .then(res => {
                    if (!cancelled) setEmergencyComplaints(res.points);
                })
                .catch(() => {
                    if (!cancelled) setEmergencyComplaintsError(true);
                });
        };
        load();
        const interval = setInterval(load, 30000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [canViewComplaints]);

    useEffect(() => {
        if (autoShow) setMapVisible(true);
    }, [autoShow]);

    const zonesWithGeometry = useMemo(
        () =>
            (neighborhoods || []).filter(
                (n): n is Neighborhood & { geometry: NonNullable<Neighborhood["geometry"]> } =>
                    Boolean(n.geometry),
            ),
        [neighborhoods],
    );

    const zonesGeoJson = useMemo(
        () => ({
            type: "FeatureCollection",
            features: zonesWithGeometry.map((zone, index) => ({
                type: "Feature",
                properties: {
                    neighborhoodId: zone._id,
                    color: ZONE_PALETTE[index % ZONE_PALETTE.length],
                },
                geometry: zone.geometry,
            })),
        }),
        [zonesWithGeometry],
    );

    const addOverlayLayers = useCallback(
        (map: any) => {
            if (map.getSource("ward-boundary")) map.removeSource("ward-boundary");
            map.addSource("ward-boundary", { type: "geojson", data: wardBoundary });
            map.addLayer({
                id: "ward-boundary-line",
                type: "line",
                source: "ward-boundary",
                paint: { "line-color": "#dc2626", "line-width": 2, "line-dasharray": [2, 1] },
            });

            map.addSource("zones", { type: "geojson", data: zonesGeoJson });
            map.addLayer({
                id: "zones-fill",
                type: "fill",
                source: "zones",
                paint: { "fill-color": ["get", "color"], "fill-opacity": 0.45 },
            });
            map.addLayer({
                id: "zones-line",
                type: "line",
                source: "zones",
                paint: { "line-color": "#333333", "line-width": 1.5 },
            });
        },
        [zonesGeoJson],
    );

    const bindInteractions = useCallback((map: any, goongjs: any) => {
        const popup = new goongjs.Popup({ offset: 8 });
        popupRef.current = popup;
        map.on("mouseenter", "zones-fill", () => {
            if (mapStyleKeyRef.current === "satellite") return;
            const canvas = map.getCanvas();
            canvas.style.cursor = "pointer";
        });
        map.on("mouseleave", "zones-fill", () => {
            const canvas = map.getCanvas();
            canvas.style.cursor = "";
        });
        map.on("click", "zones-fill", (e: any) => {
            // Dang bat che do "Gắn hộ dân lên bản đồ" - nhuong click cho
            // handler chấm điểm (xem effect pinModeOn ben duoi), khong chon Tổ.
            if (pinModeOnRef.current) return;
            // Che do "Vệ tinh": khong hien popup/chon To khi bam vao vung To -
            // chi bam dung marker Ho dan/tien ich moi co phan hoi (xem yeu cau
            // nguoi dung), tranh popup To che mat anh ve tinh luc do tim nha.
            if (mapStyleKeyRef.current === "satellite") return;
            const neighborhoodId = e.features?.[0]?.properties?.neighborhoodId;
            if (!neighborhoodId) return;
            setSelectedZoneIds([neighborhoodId]);
        });
    }, []);

    useEffect(() => {
        if (!mapVisible || !neighborhoods) return undefined;
        if (!GOONG_MAPTILES_KEY) {
            // eslint-disable-next-line no-console
            console.error("Chưa cấu hình VITE_GOONG_MAPTILES_KEY");
            setMapError("Chưa có bản đồ");
            return undefined;
        }
        let cancelled = false;

        (async () => {
            try {
                setMapLoading(true);
                setMapError(null);
                const [{ default: goongjs }] = await Promise.all([
                    import("@goongmaps/goong-js"),
                    import("@goongmaps/goong-js/dist/goong-js.css"),
                ]);
                if (cancelled || !mapContainerRef.current) return;
                goongRef.current = goongjs;

                goongjs.accessToken = GOONG_MAPTILES_KEY;
                const style = await resolveMapStyle(mapStyleKey);
                if (cancelled || !mapContainerRef.current) return;

                const map = new goongjs.Map({
                    container: mapContainerRef.current,
                    style,
                    center: DEFAULT_CENTER,
                    zoom: DEFAULT_ZOOM,
                    maxBounds: WARD_MAX_BOUNDS,
                });
                mapRef.current = map;
                map.addControl(new goongjs.NavigationControl(), "top-right");
                // Them ngay sau NavigationControl, cung vi tri "top-right" -
                // goong-js tu xep vao chung mot cot voi nut zoom/compass (xem
                // ExpandMapControl o tren), tranh phai tu doan offset px nhu
                // cach lam cu (button React rieng, de bi lech/xau).
                const expandControl = new ExpandMapControl(() => toggleMapExpanded());
                expandControl.setExpanded(isMapExpanded);
                expandControlRef.current = expandControl;
                map.addControl(expandControl, "top-right");
                // KHONG dung goongjs.FullscreenControl/native Fullscreen API o
                // day - da thu va bi loi vo layout dai dai (container bi ket o
                // kich thuoc fullscreen cu sau khi thoat, gay tran ngang ca
                // trang) trong moi truong nhung trang nay chay (vd webview),
                // Fullscreen API khong hoat dong dang tin cay. Thay bang che do
                // "phóng to" tu lam (CSS position:fixed thuan, xem
                // isMapExpanded/nut Maximize2 ben duoi) - khong phu thuoc trinh
                // duyet nen luon resize dung.

                // goong-js (fork mapbox-gl-js cu) khong tu resize canvas khi
                // container doi kich thuoc (vd chuyen giua bo cuc 2 cot/3 cot
                // luc bat/tat che do ve, hoac container do dac tai thoi diem
                // khoi tao ngan hon kich thuoc cuoi cung) - canvas se bi "ket"
                // o kich thuoc luc tao, chi ve duoc mot phan nho roi de trong
                // phan con lai. Dung ResizeObserver de tu resize() moi khi
                // container thuc su doi kich thuoc, xu ly dut diem ca lop loi
                // nay (khong chi mot truong hop rieng le).
                const resizeObserver = new ResizeObserver(() => map.resize());
                resizeObserver.observe(mapContainerRef.current);
                resizeObserverRef.current = resizeObserver;

                map.on("load", () => {
                    if (cancelled) return;
                    addOverlayLayers(map);
                    bindInteractions(map, goongjs);
                    setMapInstanceReady(true);

                    if (zonesWithGeometry.length > 0) {
                        const bounds = new goongjs.LngLatBounds();
                        zonesWithGeometry.forEach(zone =>
                            extendBoundsWithGeometry(bounds as LngLatBounds, zone.geometry),
                        );
                        map.fitBounds(bounds, { padding: 40, duration: 0 });
                    }
                });

                map.on("error", (e: any) => {
                    // eslint-disable-next-line no-console
                    console.error("[goong-js] map error:", e?.error || e);
                });
            } catch (err) {
                if (!cancelled) {
                    // eslint-disable-next-line no-console
                    console.error("[goong-js] không tải được bản đồ:", err);
                    setMapError("Chưa có bản đồ");
                }
            } finally {
                if (!cancelled) setMapLoading(false);
            }
        })();

        return () => {
            cancelled = true;
            resizeObserverRef.current?.disconnect();
            resizeObserverRef.current = null;
            householdMarkersRef.current.forEach(marker => marker.remove());
            householdMarkersRef.current = [];
            poiMarkersRef.current.forEach(marker => marker.remove());
            poiMarkersRef.current = [];
            emergencyMarkersRef.current.forEach(marker => marker.remove());
            emergencyMarkersRef.current = [];
            pendingPinMarkerRef.current?.remove();
            pendingPinMarkerRef.current = null;
            mapRef.current?.remove();
            mapRef.current = null;
            drawRef.current = null;
            expandControlRef.current = null;
            preExpandCameraRef.current = null;
            preExpandScrollRef.current = null;
            setMapInstanceReady(false);
            setDrawModeOn(false);
            setDrawnFeatures([]);
            setPinModeOn(false);
            setPendingPin(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapVisible, neighborhoods]);

    const switchMapStyle = useCallback(
        async (key: MapStyleKey) => {
            setMapStyleKey(key);
            const map = mapRef.current;
            const goongjs = goongRef.current;
            if (!map || !goongjs) return;
            const style = await resolveMapStyle(key);
            map.once("style.load", () => addOverlayLayers(map));
            map.setStyle(style);
        },
        [addOverlayLayers],
    );

    // To bat noi bat/zoom toi cac To dang duoc chon (chon da) - chay lai moi
    // khi danh sach chon thay doi hoac sau khi doi nen ban do (layer bi tao
    // lai tu dau boi setStyle).
    useEffect(() => {
        const map = mapRef.current;
        const goongjs = goongRef.current;
        if (!map || !goongjs || !map.getLayer?.("zones-fill")) return;

        if (selectedZoneIds.length === 0) {
            map.setPaintProperty("zones-fill", "fill-opacity", 0.45);
            map.setPaintProperty("zones-line", "line-width", 1.5);
            popupRef.current?.remove();
            return;
        }

        map.setPaintProperty("zones-fill", "fill-opacity", [
            "case",
            ["in", ["get", "neighborhoodId"], ["literal", selectedZoneIds]],
            0.8,
            0.12,
        ]);
        map.setPaintProperty("zones-line", "line-width", [
            "case",
            ["in", ["get", "neighborhoodId"], ["literal", selectedZoneIds]],
            3,
            1,
        ]);

        const selectedZones = zonesWithGeometry.filter(z =>
            selectedZoneIds.includes(z._id),
        );
        if (selectedZones.length === 0) return;
        const bounds = new goongjs.LngLatBounds();
        selectedZones.forEach(zone =>
            extendBoundsWithGeometry(bounds as LngLatBounds, zone.geometry),
        );
        map.fitBounds(bounds, { padding: 60, duration: 500 });

        if (selectedZones.length === 1) {
            popupRef.current
                ?.setLngLat((bounds as LngLatBounds).getCenter())
                .setHTML(buildZonePopupHTML(selectedZones[0]))
                .addTo(map);
        } else {
            popupRef.current?.remove();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedZoneIds, mapStyleKey]);

    const toggleZoneSelected = useCallback((zoneId: string) => {
        setSelectedZoneIds(prev =>
            prev.includes(zoneId) ? prev.filter(id => id !== zoneId) : [...prev, zoneId],
        );
    }, []);

    const toggleHouseholdState = useCallback((key: HouseholdStateKey) => {
        setSelectedHouseholdStates(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
        );
    }, []);

    // Ve lai marker Ho dan moi khi ban do san sang, du lieu tai xong, hoac bo
    // loc trang thai thay doi. Chua chon trang thai nao thi KHONG ve gi (tranh
    // ban do day marker mac dinh) - giong cach cac the trang thai o tren ban do
    // hoat dong (bam de loc, khong co nut bat/tat rieng). Marker (khac layer
    // GeoJSON cua zones-fill) KHONG bi mat khi doi nen ban do (setStyle), nen
    // khong can phu thuoc mapStyleKey.
    useEffect(() => {
        const map = mapRef.current;
        const goongjs = goongRef.current;
        if (!map || !goongjs || !mapInstanceReady) return;

        householdMarkersRef.current.forEach(marker => marker.remove());
        householdMarkersRef.current = [];

        if (
            (selectedHouseholdStates.length === 0 && !showAllHouseholds) ||
            !householdOverview
        )
            return;
        if (!householdPopupRef.current) {
            householdPopupRef.current = new goongjs.Popup({ offset: 8 });
        }

        householdOverview.points.forEach(point => {
            const matched = HOUSEHOLD_STATUS_FILTERS.filter(
                state => selectedHouseholdStates.includes(state.key) && point[state.key],
            );
            // "Tất cả hộ dân" dang bat: van hien ho khong khop trang thai nao
            // (mau trung tinh) - chi bo qua khi ca hai deu tat.
            if (matched.length === 0 && !showAllHouseholds) return;

            let color = HOUSEHOLD_NEUTRAL_COLOR;
            if (matched.length > 1) {
                color = HOUSEHOLD_MULTI_MATCH_COLOR;
            } else if (matched.length === 1) {
                color = HOUSEHOLD_TONE_COLOR[matched[0].tone] || HOUSEHOLD_NEUTRAL_COLOR;
            }

            const marker = new goongjs.Marker({
                element: buildHouseholdMarkerElement(matched, color),
            })
                .setLngLat([point.longitude, point.latitude])
                .addTo(map);
            const markerEl = marker.getElement();
            markerEl.style.cursor = "pointer";
            preventMapClickThrough(markerEl);
            markerEl.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation();
                householdPopupRef.current
                    ?.setLngLat([point.longitude, point.latitude])
                    .setHTML(buildHouseholdPopupHTML(point))
                    .addTo(map);
                // Popup cua goong-js chi nhan HTML thuan (xem
                // buildHouseholdPopupHTML) nen phai tu gan lai su kien click cho
                // nut "Xem chi tiết hộ dân" sau moi lan mo popup, giong cach lam
                // voi popup Poi ben duoi.
                const popupEl = householdPopupRef.current?.getElement?.();
                const detailBtn = popupEl?.querySelector?.(
                    "[data-household-detail]",
                ) as HTMLElement | null;
                detailBtn?.addEventListener("click", () => {
                    const householdId = detailBtn.getAttribute("data-household-detail");
                    if (householdId) navigate(`/households/${householdId}`);
                });
            });
            householdMarkersRef.current.push(marker);
        });
    }, [mapInstanceReady, householdOverview, selectedHouseholdStates, showAllHouseholds, navigate]);

    // "Bản đồ tiện ích" - doc tu database (bang Poi, chi lay verified=true) -
    // chi 1 danh muc tai 1 thoi diem (bam lai chinh danh muc dang chon se tat
    // di). Du lieu da duoc admin duyet o trang /pois (xem PoiListPage.tsx),
    // khong con goi Goong Autocomplete truc tiep o day nua.
    const selectPoiCategory = useCallback(
        async (category: (typeof POI_CATEGORY_LIST)[number]) => {
            if (selectedPoiCategoryKey === category.key) {
                setSelectedPoiCategoryKey(null);
                setPoiResults([]);
                return;
            }
            setSelectedPoiCategoryKey(category.key);
            setPoiResults([]);
            setPoiError(false);
            setPoiLoading(true);
            try {
                const results = await fetchPois({
                    category: category.key,
                    verified: true,
                });
                setPoiResults(results);
            } catch {
                setPoiError(true);
            } finally {
                setPoiLoading(false);
            }
        },
        [selectedPoiCategoryKey],
    );

    useEffect(() => {
        const map = mapRef.current;
        const goongjs = goongRef.current;
        if (!map || !goongjs || !mapInstanceReady) return;

        poiMarkersRef.current.forEach(marker => marker.remove());
        poiMarkersRef.current = [];

        if (poiResults.length === 0) return;
        if (!poiPopupRef.current) {
            poiPopupRef.current = new goongjs.Popup({ offset: 8 });
        }

        poiResults.forEach(place => {
            const categoryMeta = POI_CATEGORY_LIST.find(
                c => c.key === place.category,
            );
            const marker = new goongjs.Marker({
                element: buildPoiMarkerElement(categoryMeta),
            })
                .setLngLat([place.lng, place.lat])
                .addTo(map);
            const markerEl = marker.getElement();
            markerEl.style.cursor = "pointer";
            preventMapClickThrough(markerEl);
            markerEl.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation();
                poiPopupRef.current
                    ?.setLngLat([place.lng, place.lat])
                    .setHTML(buildPoiPopupHTML(place))
                    .addTo(map);
                // Popup cua goong-js chi nhan HTML thuan (xem buildPoiPopupHTML)
                // nen phai tu gan lai su kien click cho nut "Xem chi tiết hộ
                // dân" sau moi lan mo popup, khong the dung onClick nhu JSX.
                const popupEl = poiPopupRef.current?.getElement?.();
                const detailBtn = popupEl?.querySelector?.(
                    "[data-household-detail]",
                ) as HTMLElement | null;
                detailBtn?.addEventListener("click", () => {
                    const householdId = detailBtn.getAttribute("data-household-detail");
                    if (householdId) navigate(`/households/${householdId}`);
                });
            });
            poiMarkersRef.current.push(marker);
        });
    }, [mapInstanceReady, poiResults, navigate]);

    // Ve lai marker "khan cap" moi khi ban do san sang hoac du lieu tai xong -
    // cung quy uoc "clear roi ve lai" voi marker Ho dan/Poi o tren (marker
    // khong bi mat khi doi nen ban do nen khong can phu thuoc mapStyleKey).
    useEffect(() => {
        const map = mapRef.current;
        const goongjs = goongRef.current;
        if (!map || !goongjs || !mapInstanceReady) return;

        emergencyMarkersRef.current.forEach(marker => marker.remove());
        emergencyMarkersRef.current = [];

        if (emergencyComplaints.length === 0) return;
        if (!emergencyPopupRef.current) {
            emergencyPopupRef.current = new goongjs.Popup({ offset: 8 });
        }

        emergencyComplaints.forEach(point => {
            const marker = new goongjs.Marker({
                element: buildEmergencyMarkerElement(),
            })
                .setLngLat([point.gisLongitude, point.gisLatitude])
                .addTo(map);
            const markerEl = marker.getElement();
            markerEl.style.cursor = "pointer";
            preventMapClickThrough(markerEl);
            markerEl.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation();
                emergencyPopupRef.current
                    ?.setLngLat([point.gisLongitude, point.gisLatitude])
                    .setHTML(buildEmergencyComplaintPopupHTML(point))
                    .addTo(map);
                // Popup cua goong-js chi nhan HTML thuan (xem
                // buildEmergencyComplaintPopupHTML) nen phai tu gan lai su kien
                // click cho nut "Xem chi tiết phản ánh" sau moi lan mo popup,
                // cung quy uoc voi marker Ho dan/Poi o tren.
                const popupEl = emergencyPopupRef.current?.getElement?.();
                const detailBtn = popupEl?.querySelector?.(
                    "[data-complaint-detail]",
                ) as HTMLElement | null;
                detailBtn?.addEventListener("click", () => {
                    const complaintId = detailBtn.getAttribute("data-complaint-detail");
                    if (complaintId) navigate(`/complaints/${complaintId}`);
                });
            });
            emergencyMarkersRef.current.push(marker);
        });
    }, [mapInstanceReady, emergencyComplaints, navigate]);

    // Dong bo pinModeOn/mapStyleKey vao ref de doc duoc gia tri moi nhat trong
    // handler click "zones-fill" (bind mot lan trong bindInteractions, xem o
    // tren).
    useEffect(() => {
        pinModeOnRef.current = pinModeOn;
    }, [pinModeOn]);

    useEffect(() => {
        mapStyleKeyRef.current = mapStyleKey;
    }, [mapStyleKey]);

    // Che do "phóng to": container doi kich thuoc dot ngot (position:fixed
    // phu toan man hinh) - phai tu goi map.resize() vi ResizeObserver quan sat
    // mapContainerRef (con cua wrapper vua doi vi tri/kich thuoc), doi khi bat
    // kip ngay lan render dau nhung can 1 frame de chac chan CSS da ap dung
    // xong (giong cach tung xu ly Fullscreen API truoc day, nhung o day KHONG
    // con phu thuoc trinh duyet nen luon dang tin cay hon). Phim Esc de thoat
    // nhanh, giong quy uoc fullscreen thong thuong.
    //
    // Luc thu nho lai (isMapExpanded false), ngoai resize() con phai jumpTo()
    // lai dung center/zoom da luu truoc khi phong to (preExpandCameraRef):
    // goong-js/mapbox-gl tu clamp lai zoom theo maxBounds moi khi container
    // resize (o day tu box nho -> toan man hinh -> box nho), nen neu khong
    // phuc hoi thu cong thi ban do co the dung lai o mot center/zoom khac so
    // voi truoc khi phong to (trong nhu bi "nhay"/vỡ bo cuc).
    useEffect(() => {
        const map = mapRef.current;
        expandControlRef.current?.setExpanded(isMapExpanded);
        if (!map) return undefined;
        const raf = requestAnimationFrame(() => {
            map.resize();
            if (!isMapExpanded && preExpandCameraRef.current) {
                map.jumpTo({
                    center: preExpandCameraRef.current.center,
                    zoom: preExpandCameraRef.current.zoom,
                });
                preExpandCameraRef.current = null;
            }
            if (!isMapExpanded && preExpandScrollRef.current) {
                const { parent, top } = preExpandScrollRef.current;
                if (parent) parent.scrollTop = top;
                else window.scrollTo({ top });
                preExpandScrollRef.current = null;
            }
        });

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsMapExpanded(false);
        };
        if (isMapExpanded) document.addEventListener("keydown", handleKeyDown);

        return () => {
            cancelAnimationFrame(raf);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMapExpanded]);

    // Ham bam duy nhat cho nut "phóng to" (dung chung cho ca ExpandMapControl
    // tren ban do va co the goi lai o noi khac) - luu lai center/zoom hien tai
    // truoc khi chuyen sang che do phong to, de effect ve isMapExpanded ben
    // duoi phuc hoi lai dung vi tri sau khi thu nho (xem preExpandCameraRef).
    const toggleMapExpanded = useCallback(() => {
        setIsMapExpanded(prev => {
            const next = !prev;
            const map = mapRef.current;
            if (!prev && map) {
                const center = map.getCenter();
                preExpandCameraRef.current = {
                    center: [center.lng, center.lat],
                    zoom: map.getZoom(),
                };
                const scrollParent = findScrollParent(mapContainerRef.current);
                preExpandScrollRef.current = {
                    parent: scrollParent,
                    top: scrollParent ? scrollParent.scrollTop : window.scrollY,
                };
            }
            return next;
        });
    }, []);

    const togglePinMode = useCallback(() => {
        setPinModeOn(prev => {
            if (prev) {
                setPendingPin(null);
                setPinSelectedHousehold(null);
                setPinHouseholdSearch("");
                setPinHouseholdResults([]);
            }
            return !prev;
        });
    }, []);

    const cancelHouseholdPin = useCallback(() => {
        setPendingPin(null);
        setPinSelectedHousehold(null);
        setPinHouseholdSearch("");
        setPinHouseholdResults([]);
    }, []);

    // Bat/tat con tro crosshair + lang nghe click chung tren ban do (khac
    // click rieng cua layer "zones-fill") khi bat/tat che do chấm điểm. Chi
    // gan/go listener nay theo pinModeOn thay vi kiem tra ben trong mot
    // listener duy nhat, tranh phai lo lang closure cu (giong ly do can
    // pinModeOnRef o tren cho handler "zones-fill" da bind san tu truoc).
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapInstanceReady) return undefined;
        if (!pinModeOn) {
            map.getCanvas().style.cursor = "";
            return undefined;
        }
        map.getCanvas().style.cursor = "crosshair";
        const handleMapClick = (e: any) => {
            setPendingPin({ lat: e.lngLat.lat, lng: e.lngLat.lng });
            setPinSelectedHousehold(null);
            setPinHouseholdSearch("");
            setPinHouseholdResults([]);
        };
        map.on("click", handleMapClick);
        return () => {
            map.off("click", handleMapClick);
            map.getCanvas().style.cursor = "";
        };
    }, [pinModeOn, mapInstanceReady]);

    // Ve/xoa marker cho diem VUA CHAM (chua luu) - keo duoc (draggable) de
    // chinh lai vi tri truoc khi xac nhan gan ho dan.
    useEffect(() => {
        const map = mapRef.current;
        const goongjs = goongRef.current;
        if (!map || !goongjs) return undefined;

        pendingPinMarkerRef.current?.remove();
        pendingPinMarkerRef.current = null;
        if (!pendingPin) return undefined;

        const marker = new goongjs.Marker({ color: "#0891b2", draggable: true })
            .setLngLat([pendingPin.lng, pendingPin.lat])
            .addTo(map);
        marker.on("dragend", () => {
            const lngLat = marker.getLngLat();
            setPendingPin({ lat: lngLat.lat, lng: lngLat.lng });
        });
        pendingPinMarkerRef.current = marker;
        return () => {
            marker.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingPin?.lat, pendingPin?.lng]);

    // Tim ho dan theo tu khoa (dung chung fetchHouseholds({ search }) voi
    // trang /households) sau 400ms ngung go, chi khi da chấm 1 diem tren ban do.
    useEffect(() => {
        if (!pendingPin) return undefined;
        if (pinHouseholdDebounceRef.current) clearTimeout(pinHouseholdDebounceRef.current);
        const query = pinHouseholdSearch.trim();
        if (query.length < 2) {
            setPinHouseholdResults([]);
            return undefined;
        }
        pinHouseholdDebounceRef.current = setTimeout(async () => {
            try {
                setPinHouseholdSearching(true);
                const res = await fetchHouseholds({ search: query, limit: 8 });
                setPinHouseholdResults(res.items);
            } catch {
                setPinHouseholdResults([]);
            } finally {
                setPinHouseholdSearching(false);
            }
        }, 400);
        return () => {
            if (pinHouseholdDebounceRef.current) clearTimeout(pinHouseholdDebounceRef.current);
        };
    }, [pinHouseholdSearch, pendingPin]);

    const confirmHouseholdPin = useCallback(async () => {
        if (!pendingPin || !pinSelectedHousehold) return;
        setPinSubmitting(true);
        try {
            await createPoi({
                name: pinSelectedHousehold.headOfHousehold || pinSelectedHousehold.code,
                category: "household",
                lat: pendingPin.lat,
                lng: pendingPin.lng,
                address: pinSelectedHousehold.address,
                verified: true,
                householdId: pinSelectedHousehold._id,
            });
            toast.success(`Đã gắn hộ ${pinSelectedHousehold.code} lên bản đồ`);
            cancelHouseholdPin();
            if (selectedPoiCategoryKey === "household") {
                const results = await fetchPois({ category: "household", verified: true });
                setPoiResults(results);
            }
        } catch (err) {
            toast.error((err as AppError).message || "Không gắn được hộ dân lên bản đồ");
        } finally {
            setPinSubmitting(false);
        }
    }, [pendingPin, pinSelectedHousehold, selectedPoiCategoryKey, cancelHouseholdPin]);

    const emitDrawnFeatures = useCallback(() => {
        const draw = drawRef.current;
        if (!draw) return;
        const collection = draw.getAll();
        setDrawnFeatures(
            collection.features.map((f: any) => ({
                id: f.id,
                name: f.properties?.name || "",
                neighborhoodId: f.properties?.neighborhoodId,
            })),
        );
    }, []);

    // Bat/tat che do "Tự vẽ ranh giới" (MapboxDraw + 3 mode ve tay dang duoc
    // dung o test-map, xem lib/mapDraw/*) - nap dong (dynamic import), chi tai
    // khi admin thuc su bam bat, tranh tang bundle/chi phi khong can thiet cho
    // nguoi chi xem ban do. LUU Y: doi nen ban do (switchMapStyle) trong luc
    // dang bat che do nay se lam mat hien thi cac vung dang ve (MapboxDraw tu
    // quan ly layer rieng, khong duoc addOverlayLayers nap lai sau setStyle) -
    // du lieu dang ve khong mat, chi can tat/bat lai che do ve la thay lai.
    const toggleDrawMode = useCallback(async () => {
        const map = mapRef.current;
        const goongjs = goongRef.current;
        if (!map || !goongjs) return;

        if (drawModeOn) {
            const draw = drawRef.current;
            if (draw) {
                map.off("draw.create", emitDrawnFeatures);
                map.off("draw.update", emitDrawnFeatures);
                map.off("draw.delete", emitDrawnFeatures);
                map.removeControl(draw);
                drawRef.current = null;
            }
            setDrawnFeatures([]);
            setAssignSelection({});
            setDrawModeOn(false);
            return;
        }

        const [{ default: MapboxDraw }, [{ default: FreehandPolygonMode }, { default: FreehandLineMode }, { default: DrawRectangleMode }]] =
            await Promise.all([
                import("@mapbox/mapbox-gl-draw").then(async mod => {
                    await import("@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css");
                    return mod;
                }),
                Promise.all([
                    import("@lib/mapDraw/freehandPolygonMode"),
                    import("@lib/mapDraw/freehandLineMode"),
                    import("@lib/mapDraw/rectangleMode"),
                ]),
            ]);

        const draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: { polygon: true, line_string: true, trash: true },
            modes: {
                ...MapboxDraw.modes,
                draw_polygon: FreehandPolygonMode,
                draw_line_string: FreehandLineMode,
                draw_rectangle: DrawRectangleMode,
            },
        });
        drawRef.current = draw;
        map.addControl(draw, "bottom-right");
        map.on("draw.create", emitDrawnFeatures);
        map.on("draw.update", emitDrawnFeatures);
        map.on("draw.delete", emitDrawnFeatures);
        setDrawModeOn(true);
    }, [drawModeOn, emitDrawnFeatures]);

    const startDrawRectangle = useCallback(() => {
        drawRef.current?.changeMode("draw_rectangle");
    }, []);

    const renameDrawnFeature = useCallback(
        (id: string | number, name: string) => {
            drawRef.current?.setFeatureProperty(id, "name", name);
            emitDrawnFeatures();
        },
        [emitDrawnFeatures],
    );

    const deleteDrawnFeature = useCallback(
        (id: string | number) => {
            drawRef.current?.delete([id]);
            emitDrawnFeatures();
            setAssignSelection(prev => {
                const next = { ...prev };
                delete next[String(id)];
                return next;
            });
        },
        [emitDrawnFeatures],
    );

    // Nap ranh gioi mot To dan pho DA CO vao cong cu ve de sua lai - giong
    // tinh nang "Sửa tổ đã có" cua test-map (DrawPanel.tsx).
    const editZoneBoundary = useCallback(
        (zone: Neighborhood & { geometry: NonNullable<Neighborhood["geometry"]> }) => {
            const draw = drawRef.current;
            if (!draw) return;
            const existing = draw
                .getAll()
                .features.find((f: any) => f.properties?.neighborhoodId === zone._id);
            let featureId = existing?.id;
            if (!featureId) {
                [featureId] = draw.add({
                    type: "Feature",
                    properties: { name: zone.name, neighborhoodId: zone._id },
                    geometry: zone.geometry,
                });
            }
            draw.changeMode("direct_select", { featureId });
            emitDrawnFeatures();
            setAssignSelection(prev => ({ ...prev, [String(featureId)]: zone._id }));
        },
        [emitDrawnFeatures],
    );

    const saveDrawnFeature = useCallback(
        async (featureId: string | number) => {
            const draw = drawRef.current;
            if (!draw) return;
            const targetId = assignSelection[String(featureId)];
            if (!targetId) {
                toast.error("Chọn Tổ dân phố cần gán trước khi lưu");
                return;
            }
            const feature = draw.get(featureId);
            if (!feature) return;

            setSavingFeatureId(featureId);
            try {
                await updateNeighborhoodGeometry(targetId, {
                    boundaryType: "GEOJSON",
                    geometry: feature.geometry,
                });
                toast.success("Đã lưu ranh giới vào Tổ dân phố");
                draw.delete([featureId]);
                emitDrawnFeatures();
                const res = await fetchNeighborhoods({ limit: 100, active: true });
                setNeighborhoods(res.items);
            } catch (err) {
                toast.error((err as AppError).message || "Không lưu được ranh giới");
            } finally {
                setSavingFeatureId(null);
            }
        },
        [assignSelection, emitDrawnFeatures],
    );

    const getSearchSessionToken = () => {
        if (!searchSessionTokenRef.current) {
            searchSessionTokenRef.current = crypto.randomUUID();
        }
        return searchSessionTokenRef.current;
    };

    // Goi Place Autocomplete (qua proxy backend, xem neighborhoodGeoApi.ts) sau
    // 400ms ngung go, giong quy uoc cua HouseLocationPicker o resident-web-app.
    useEffect(() => {
        if (!mapVisible) return undefined;
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        const query = searchText.trim();
        if (query.length < 3) {
            setSearchSuggestions([]);
            return undefined;
        }
        searchDebounceRef.current = setTimeout(async () => {
            try {
                setSearching(true);
                const results = await autocompleteNeighborhoodPlaces(
                    query,
                    getSearchSessionToken(),
                );
                setSearchSuggestions(results);
            } catch {
                setSearchSuggestions([]);
            } finally {
                setSearching(false);
            }
        }, 400);
        return () => {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchText, mapVisible]);

    const pickSearchSuggestion = async (prediction: GeoAutocompletePrediction) => {
        const map = mapRef.current;
        const goongjs = goongRef.current;
        if (!map || !goongjs) return;
        try {
            const details = await fetchNeighborhoodPlaceDetails(
                prediction.placeId,
                getSearchSessionToken(),
            );
            searchSessionTokenRef.current = null; // session ket thuc sau Place Details
            setSearchSuggestions([]);
            setSearchText(details.formattedAddress || prediction.text);

            searchMarkerRef.current?.remove();
            searchMarkerRef.current = new goongjs.Marker({ color: "#dc2626" })
                .setLngLat([details.lng, details.lat])
                .addTo(map);
            map.flyTo({ center: [details.lng, details.lat], zoom: 17 });
            popupRef.current
                ?.setLngLat([details.lng, details.lat])
                .setHTML(
                    `<div style="font-size:13px">${escapeHtml(details.formattedAddress)}</div>`,
                )
                .addTo(map);
        } catch {
            setSearchSuggestions([]);
        }
    };

    const clearSearch = () => {
        setSearchText("");
        setSearchSuggestions([]);
        searchSessionTokenRef.current = null;
        searchMarkerRef.current?.remove();
        searchMarkerRef.current = null;
    };

    const showMap = () => setMapVisible(true);

    let statsContent: React.ReactNode;
    if (neighborhoods) {
        statsContent = (
            <span className="text-sm text-text_2">
                <Badge tone="green">{zonesWithGeometry.length}</Badge> /{" "}
                <Badge tone="gray">{neighborhoods.length}</Badge> tổ dân phố đã có
                ranh giới
            </span>
        );
    } else if (listError) {
        statsContent = (
            <span className="text-sm text-red-500">
                Không tải được danh sách tổ dân phố
            </span>
        );
    } else {
        statsContent = (
            <span className="text-sm text-text_3">Đang tải danh sách tổ dân phố...</span>
        );
    }

    // showDrawPanel: co panel "Vẽ ranh giới tổ" o cot thu 3 hay khong - chi khi
    // dang thuc su bat che do ve. isFullscreenLayout: co chiem toan man hinh
    // hay khong - "/map-boundary" luon toan man hinh (alwaysFullscreen), con
    // widget Dashboard/trang "/map" chi toan man hinh khi dang ve (khong bao
    // gio xay ra vi showDrawTools=false o 2 noi do).
    const showDrawPanel = showDrawTools && drawModeOn;
    const isFullscreenLayout = alwaysFullscreen || showDrawPanel;
    const loadedNeighborhoodIds = new Set(
        drawnFeatures.map(f => f.neighborhoodId).filter((id): id is string => Boolean(id)),
    );

    return (
        <section
            className={cn(
                isFullscreenLayout
                    ? "fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ui_bg p-4"
                    : "rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm",
            )}
        >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <MapPinned className="h-4 w-4 text-main" />
                    <h2 className="text-sm font-semibold">Bản đồ ranh giới Tổ dân phố</h2>
                </div>
                <div className="flex items-center gap-3">
                    {statsContent}
                    {!mapVisible && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={showMap}
                            disabled={!neighborhoods}
                        >
                            <MapIcon className="mr-1 h-4 w-4" />
                            Xem bản đồ
                        </Button>
                    )}
                    {isFullscreenLayout && (
                        <Button
                            size="sm"
                            variant="outline"
                            title="Thoát"
                            onClick={() => navigate(-1)}
                        >
                            <X className="mr-1 h-4 w-4" />
                            Thoát
                        </Button>
                    )}
                </div>
            </div>

            {mapVisible && (
                <div
                    className={cn(
                        "grid grid-cols-1 gap-3",
                        isFullscreenLayout ? "min-w-0 overflow-hidden" : undefined,
                        !isFullscreenLayout && "lg:grid-cols-[1fr_280px]",
                        isFullscreenLayout &&
                            !showDrawPanel &&
                            "min-h-0 flex-1 lg:grid-cols-[260px_minmax(0,1fr)]",
                        showDrawPanel &&
                            "min-h-0 flex-1 lg:grid-cols-[260px_minmax(0,1fr)_320px]",
                    )}
                >
                    <div
                        className={cn(
                            "flex min-h-0 w-full min-w-0 flex-col gap-2",
                            isFullscreenLayout
                                ? "order-2 h-[calc(100vh-140px)]"
                                : mapHeightClassName,
                        )}
                    >
                        {canViewHouseholds && (
                            <div className="flex flex-wrap gap-2 rounded-lg border border-divider_01 bg-ui_bg p-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAllHouseholds(prev => !prev)}
                                    className={cn(
                                        "flex min-w-[150px] flex-1 items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition",
                                        showAllHouseholds
                                            ? "border-transparent"
                                            : "border-divider_01 bg-ui_bg hover:bg-ng_10",
                                    )}
                                    style={
                                        showAllHouseholds
                                            ? { background: HOUSEHOLD_NEUTRAL_COLOR }
                                            : undefined
                                    }
                                >
                                    <span
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                        style={{
                                            background: showAllHouseholds
                                                ? "rgba(255,255,255,0.2)"
                                                : `${HOUSEHOLD_NEUTRAL_COLOR}1A`,
                                        }}
                                    >
                                        <Home
                                            className="h-[18px] w-[18px]"
                                            style={{
                                                color: showAllHouseholds
                                                    ? "#fff"
                                                    : HOUSEHOLD_NEUTRAL_COLOR,
                                            }}
                                        />
                                    </span>
                                    <span className="min-w-0">
                                        <span
                                            className={cn(
                                                "block truncate text-sm font-semibold",
                                                showAllHouseholds ? "text-white" : "text-text_1",
                                            )}
                                        >
                                            Tất cả hộ dân
                                        </span>
                                        <span
                                            className={cn(
                                                "block text-xs",
                                                showAllHouseholds
                                                    ? "text-white/80"
                                                    : "text-text_2",
                                            )}
                                        >
                                            {householdOverview === null
                                                ? "Đang tải..."
                                                : `${householdOverview.householdsWithCoordinates}/${householdOverview.totalHouseholds} hộ có toạ độ`}
                                        </span>
                                    </span>
                                </button>
                                {HOUSEHOLD_STATUS_FILTERS.map(state => {
                                    const active = selectedHouseholdStates.includes(state.key);
                                    const color =
                                        HOUSEHOLD_TONE_COLOR[state.tone] || HOUSEHOLD_NEUTRAL_COLOR;
                                    const Icon = HOUSEHOLD_STATE_ICON[state.key] || Users;
                                    const count = householdOverview
                                        ? householdOverview.points.filter(p => p[state.key]).length
                                        : null;
                                    return (
                                        <button
                                            key={state.key}
                                            type="button"
                                            onClick={() => toggleHouseholdState(state.key)}
                                            className={cn(
                                                "flex min-w-[150px] flex-1 items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition",
                                                active
                                                    ? "border-transparent"
                                                    : "border-divider_01 bg-ui_bg hover:bg-ng_10",
                                            )}
                                            style={active ? { background: color } : undefined}
                                        >
                                            <span
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                                style={{
                                                    background: active
                                                        ? "rgba(255,255,255,0.2)"
                                                        : `${color}1A`,
                                                }}
                                            >
                                                <Icon
                                                    className="h-[18px] w-[18px]"
                                                    style={{ color: active ? "#fff" : color }}
                                                />
                                            </span>
                                            <span className="min-w-0">
                                                <span
                                                    className={cn(
                                                        "block truncate text-sm font-semibold",
                                                        active ? "text-white" : "text-text_1",
                                                    )}
                                                >
                                                    {state.label}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "block text-xs",
                                                        active ? "text-white/80" : "text-text_2",
                                                    )}
                                                >
                                                    {count === null ? "Đang tải..." : `${count} hộ`}
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                                {(selectedHouseholdStates.length > 0 || showAllHouseholds) && (
                                    <button
                                        type="button"
                                        className="shrink-0 self-center px-2 text-xs font-medium text-primary hover:underline"
                                        onClick={() => {
                                            setSelectedHouseholdStates([]);
                                            setShowAllHouseholds(false);
                                        }}
                                    >
                                        Bỏ lọc
                                    </button>
                                )}
                                {householdOverviewError && (
                                    <p className="w-full text-xs text-red-500">
                                        Không tải được số liệu hộ dân
                                    </p>
                                )}
                            </div>
                        )}
                        {canViewComplaints && emergencyComplaintsError && (
                            <p className="text-xs text-red-500">
                                Không tải được phản ánh khẩn cấp
                            </p>
                        )}
                        {canViewPois && (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 rounded-lg border border-divider_01 bg-ui_bg p-2">
                            {/* An bot vai danh muc theo yeu cau (chi o thanh loc tren ban
                                do nay, KHONG dung POI_CATEGORY_LIST) - "household" trung
                                nhan hien thi voi "apartment" (2 nut giong het nhau, gay
                                roi) va khong the "quet" duoc (chi tao qua cong cu Gắn hộ
                                dân o /map-boundary, xem PoiListPage.tsx da an tuong tu o
                                Select danh muc); "restaurant"/"cafe" (Quán ăn ngon/Quán
                                cafe) khong can hien tren ban do nay.

                                Dung CSS grid (thay vi flex-wrap + flex-1 truoc day) de cac
                                nut o HANG CUOI (khi so luong danh muc khong chia het cho so
                                nut/hang) van rong DUNG BANG cac nut o hang tren - flex-wrap
                                truoc day khien vai nut cuoi tu gian ra chiem het phan con
                                trong cua hang, to nho khong deu nhau. */}
                            {POI_CATEGORY_LIST.filter(
                                category => !["household", "restaurant", "cafe"].includes(category.key),
                            ).map(category => {
                                    const active = selectedPoiCategoryKey === category.key;
                                    const Icon = category.icon;
                                    return (
                                        <button
                                            key={category.key}
                                            type="button"
                                            onClick={() => selectPoiCategory(category)}
                                            className={cn(
                                                "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition",
                                                active
                                                    ? "border-transparent"
                                                    : "border-divider_01 bg-ui_bg hover:bg-ng_10",
                                            )}
                                            style={active ? { background: category.color } : undefined}
                                        >
                                            <span
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                                style={{
                                                    background: active
                                                        ? "rgba(255,255,255,0.2)"
                                                        : `${category.color}1A`,
                                                }}
                                            >
                                                <Icon
                                                    className="h-[18px] w-[18px]"
                                                    style={{ color: active ? "#fff" : category.color }}
                                                />
                                            </span>
                                            <span
                                                className={cn(
                                                    "truncate text-sm font-semibold",
                                                    active ? "text-white" : "text-text_1",
                                                )}
                                            >
                                                {category.label}
                                            </span>
                                        </button>
                                    );
                                })}
                                {poiLoading && (
                                    <p className="col-span-full text-xs text-text_2">
                                        Đang tải điểm tiện ích...
                                    </p>
                                )}
                                {poiError && (
                                    <p className="col-span-full text-xs text-red-500">
                                        Không tải được điểm tiện ích cho danh mục này
                                    </p>
                                )}
                                {selectedPoiCategoryKey &&
                                    !poiLoading &&
                                    !poiError &&
                                    poiResults.length === 0 && (
                                        <p className="col-span-full text-xs text-text_2">
                                            Chưa có điểm tiện ích nào được duyệt cho danh mục này
                                        </p>
                                    )}
                        </div>
                        )}
                        <div
                            className={cn(
                                "relative min-h-0 w-full flex-1",
                                isMapExpanded && "fixed inset-0 z-[100] bg-ui_bg p-2",
                            )}
                        >
                        <div ref={mapContainerRef} className="h-full w-full rounded-xl" />
                        {!mapLoading && !mapError && (
                            <div className="absolute left-3 right-14 top-3 z-20 max-w-sm">
                                <div className="flex items-center gap-2 rounded-2xl bg-ui_bg px-4 py-2.5 shadow-lg">
                                    <Search className="h-4 w-4 shrink-0 text-text_3" />
                                    <input
                                        type="text"
                                        value={searchText}
                                        onChange={e => setSearchText(e.target.value)}
                                        placeholder="Tìm địa chỉ trên bản đồ..."
                                        disabled={mapLoading || !!mapError}
                                        className="w-full bg-transparent text-sm outline-none disabled:opacity-50"
                                    />
                                    {searchText && (
                                        <button
                                            type="button"
                                            className="shrink-0 text-text_3 hover:text-text_1"
                                            onClick={clearSearch}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                {searching && (
                                    <p className="mt-1 pl-2 text-xs text-text_3">Đang tìm...</p>
                                )}
                                {searchSuggestions.length > 0 && (
                                    <div className="mt-1.5 overflow-hidden rounded-2xl bg-ui_bg shadow-lg">
                                        {searchSuggestions.map(prediction => (
                                            <button
                                                key={prediction.placeId}
                                                type="button"
                                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-ng_10"
                                                onClick={() => pickSearchSuggestion(prediction)}
                                            >
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ng_10 text-text_2">
                                                    <MapPinned className="h-4 w-4" />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-semibold text-text_1">
                                                        {prediction.mainText}
                                                    </span>
                                                    {prediction.secondaryText && (
                                                        <span className="block truncate text-xs text-text_2">
                                                            {prediction.secondaryText}
                                                        </span>
                                                    )}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {!mapLoading && !mapError && (
                            <div className="absolute bottom-3 left-3 z-10 space-y-2 rounded-lg border border-divider_01 bg-ui_bg p-2 shadow-sm">
                                {MAP_STYLE_GROUPS.map(group => {
                                    const entries = (
                                        Object.entries(MAP_STYLES) as Array<
                                            [MapStyleKey, (typeof MAP_STYLES)[MapStyleKey]]
                                        >
                                    ).filter(([, config]) => config.group === group);
                                    if (entries.length === 0) return null;
                                    return (
                                        <div key={group}>
                                            <p className="mb-1 text-[11px] font-semibold text-text_1">
                                                {group}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {entries.map(([key, config]) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        title={config.label}
                                                        onClick={() => switchMapStyle(key)}
                                                        className={cn(
                                                            "flex h-11 w-11 items-center justify-center rounded-md ring-2 ring-offset-1 transition",
                                                            config.thumbClassName,
                                                            mapStyleKey === key
                                                                ? "ring-main"
                                                                : "ring-transparent hover:ring-divider_01",
                                                        )}
                                                    >
                                                        <config.icon className="h-5 w-5" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {(mapLoading || mapError) && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-ui_bg/80">
                                <p
                                    className={
                                        mapError ? "text-sm text-red-500" : "text-sm text-text_3"
                                    }
                                >
                                    {mapError || "Đang tải bản đồ..."}
                                </p>
                            </div>
                        )}
                        {pendingPin && !mapLoading && !mapError && (
                            <div className="absolute bottom-3 right-3 z-20 w-80 max-w-[calc(100%-1.5rem)] space-y-2 rounded-2xl border border-divider_01 bg-ui_bg p-3 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-text_1">
                                        Gắn hộ dân vào điểm vừa chấm
                                    </p>
                                    <button
                                        type="button"
                                        className="text-text_3 hover:text-text_1"
                                        onClick={cancelHouseholdPin}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="text-[11px] text-text_2">
                                    Toạ độ: {pendingPin.lat.toFixed(6)}, {pendingPin.lng.toFixed(6)}
                                    {" — "}có thể kéo điểm đánh dấu trên bản đồ để chỉnh vị trí.
                                </p>
                                {!pinSelectedHousehold ? (
                                    <>
                                        <input
                                            type="text"
                                            value={pinHouseholdSearch}
                                            onChange={e => setPinHouseholdSearch(e.target.value)}
                                            placeholder="Tìm hộ dân theo mã, tên chủ hộ, địa chỉ..."
                                            className="w-full rounded-lg border border-divider_01 px-2.5 py-1.5 text-xs outline-none"
                                        />
                                        {pinHouseholdSearching && (
                                            <p className="text-[11px] text-text_3">Đang tìm...</p>
                                        )}
                                        {!pinHouseholdSearching && pinHouseholdResults.length > 0 && (
                                            <div className="max-h-48 space-y-1 overflow-y-auto">
                                                {pinHouseholdResults.map(hh => (
                                                    <button
                                                        key={hh._id}
                                                        type="button"
                                                        className="flex w-full flex-col items-start rounded-lg px-2 py-1.5 text-left text-xs hover:bg-ng_10"
                                                        onClick={() => setPinSelectedHousehold(hh)}
                                                    >
                                                        <span className="font-semibold text-text_1">
                                                            {hh.code} — {hh.headOfHousehold}
                                                        </span>
                                                        <span className="text-text_2">{hh.address}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {!pinHouseholdSearching &&
                                            pinHouseholdSearch.trim().length >= 2 &&
                                            pinHouseholdResults.length === 0 && (
                                                <p className="text-[11px] text-text_2">
                                                    Không tìm thấy hộ dân phù hợp
                                                </p>
                                            )}
                                    </>
                                ) : (
                                    <>
                                        <div className="rounded-lg bg-ng_10 px-2.5 py-2 text-xs">
                                            <p className="font-semibold text-text_1">
                                                {pinSelectedHousehold.code} —{" "}
                                                {pinSelectedHousehold.headOfHousehold}
                                            </p>
                                            <p className="text-text_2">{pinSelectedHousehold.address}</p>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <Button
                                                size="sm"
                                                className="flex-1"
                                                loading={pinSubmitting}
                                                onClick={confirmHouseholdPin}
                                            >
                                                Xác nhận gắn
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setPinSelectedHousehold(null)}
                                            >
                                                Chọn lại
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        </div>
                    </div>
                    {!mapLoading && !mapError && (
                        <div
                            className={cn(
                                "flex flex-col gap-2",
                                isFullscreenLayout && "order-1",
                            )}
                        >
                            <div className="flex items-center justify-between text-xs text-text_2">
                                <span>Đã chọn {selectedZoneIds.length}/{zonesWithGeometry.length}</span>
                                {selectedZoneIds.length > 0 && (
                                    <button
                                        type="button"
                                        className="font-medium text-primary hover:underline"
                                        onClick={() => setSelectedZoneIds([])}
                                    >
                                        Bỏ chọn tất cả
                                    </button>
                                )}
                            </div>
                            <div
                                className={cn(
                                    "min-h-0 overflow-y-auto rounded-lg border border-divider_01",
                                    isFullscreenLayout
                                        ? "max-h-[calc(100vh-260px)]"
                                        : "flex-1",
                                )}
                            >
                                {zonesWithGeometry.map((zone, index) => (
                                    <div
                                        key={zone._id}
                                        className="flex w-full items-center gap-2 border-b border-divider_01 px-2 py-1.5 text-xs last:border-0 hover:bg-ng_10"
                                    >
                                        <Checkbox
                                            checked={selectedZoneIds.includes(zone._id)}
                                            onCheckedChange={() => toggleZoneSelected(zone._id)}
                                        />
                                        <button
                                            type="button"
                                            className="flex flex-1 items-center gap-2 text-left"
                                            onClick={() => setSelectedZoneIds([zone._id])}
                                        >
                                            <span
                                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                style={{
                                                    background: ZONE_PALETTE[index % ZONE_PALETTE.length],
                                                }}
                                            />
                                            <span className="flex-1 truncate">{zone.name}</span>
                                            {!isFullscreenLayout && (
                                                <span className="shrink-0 text-text_2">
                                                    {zone.houseCount ?? 0} nhà
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                ))}
                                {zonesWithGeometry.length === 0 && (
                                    <div className="px-3 py-6 text-center text-xs text-text_2">
                                        Chưa có tổ dân phố nào được nạp ranh giới.
                                    </div>
                                )}
                            </div>


                            {showDrawTools && canDrawBoundary && (
                                <div className="rounded-lg border border-divider_01 p-2">
                                    <p className="mb-2 text-xs font-semibold text-text_1">
                                        Tự vẽ ranh giới
                                    </p>
                                    <Button
                                        size="sm"
                                        variant={drawModeOn ? "default" : "outline"}
                                        className="w-full"
                                        onClick={toggleDrawMode}
                                    >
                                        {drawModeOn ? "Đang vẽ — bấm để tắt" : "Bật chế độ vẽ tổ"}
                                    </Button>
                                </div>
                            )}

                            {showDrawTools && canPinHouseholds && (
                                <div className="rounded-lg border border-divider_01 p-2">
                                    <p className="mb-2 text-xs font-semibold text-text_1">
                                        Gắn hộ dân lên bản đồ
                                    </p>
                                    <Button
                                        size="sm"
                                        variant={pinModeOn ? "default" : "outline"}
                                        className="w-full"
                                        onClick={togglePinMode}
                                    >
                                        <Crosshair className="mr-1 h-4 w-4" />
                                        {pinModeOn ? "Đang chấm điểm — bấm để tắt" : "Bật chế độ chấm điểm"}
                                    </Button>
                                    {pinModeOn && (
                                        <p className="mt-1.5 text-[11px] leading-relaxed text-text_2">
                                            Click vào vị trí ngôi nhà trên bản đồ để chấm toạ độ,
                                            rồi chọn hộ dân cần gắn ở góc bản đồ.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {showDrawPanel && !mapLoading && !mapError && (
                        <div className="order-3 flex h-full flex-col gap-2 overflow-hidden rounded-lg border border-divider_01 p-3">
                            <p className="text-xs font-semibold text-text_1">
                                Vẽ ranh giới tổ ({drawnFeatures.length})
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={startDrawRectangle}
                            >
                                ▭ Vẽ hình chữ nhật
                            </Button>
                            <p className="text-[11px] leading-relaxed text-text_2">
                                Hình chữ nhật: click 1 điểm đầu, rê chuột rồi click điểm đối
                                diện để chốt — sau đó click vào hình để chọn, rồi kéo từng góc
                                cho khít với tổ. Ngoài ra công cụ ở góc dưới-phải bản đồ còn 2
                                chế độ vẽ tự do (giữ chuột + kéo): vùng và đường.
                            </p>

                            <div>
                                <p className="mb-1 text-[11px] font-semibold text-text_1">
                                    Sửa tổ đã có ({zonesWithGeometry.length})
                                </p>
                                <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-divider_01 p-1.5">
                                    {zonesWithGeometry.map((zone, index) => {
                                        const isLoaded = loadedNeighborhoodIds.has(zone._id);
                                        return (
                                            <div
                                                key={zone._id}
                                                className="flex items-center gap-2 text-xs"
                                            >
                                                <span
                                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                    style={{
                                                        background:
                                                            ZONE_PALETTE[index % ZONE_PALETTE.length],
                                                    }}
                                                />
                                                <span className="flex-1 truncate">{zone.name}</span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={isLoaded}
                                                    onClick={() => editZoneBoundary(zone)}
                                                >
                                                    {isLoaded ? "Đang sửa" : "Sửa"}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex-1 space-y-2 overflow-y-auto">
                                {drawnFeatures.length === 0 && (
                                    <p className="text-xs text-text_2">Chưa có vùng nào.</p>
                                )}
                                {drawnFeatures.map(feature => (
                                    <div
                                        key={feature.id}
                                        className="space-y-1.5 rounded-md border border-divider_01 p-2"
                                    >
                                        <input
                                            type="text"
                                            value={feature.name}
                                            placeholder="Tên (tùy chọn)..."
                                            onChange={e =>
                                                renameDrawnFeature(feature.id, e.target.value)
                                            }
                                            className="w-full rounded border border-divider_01 px-2 py-1 text-xs"
                                        />
                                        <select
                                            value={
                                                assignSelection[String(feature.id)] ||
                                                feature.neighborhoodId ||
                                                ""
                                            }
                                            onChange={e =>
                                                setAssignSelection(prev => ({
                                                    ...prev,
                                                    [String(feature.id)]: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded border border-divider_01 px-2 py-1 text-xs"
                                        >
                                            <option value="">-- Chọn Tổ dân phố --</option>
                                            {(neighborhoods || []).map(n => (
                                                <option key={n._id} value={n._id}>
                                                    {n.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="flex gap-1.5">
                                            <Button
                                                size="sm"
                                                className="flex-1"
                                                disabled={savingFeatureId === feature.id}
                                                onClick={() => saveDrawnFeature(feature.id)}
                                            >
                                                {savingFeatureId === feature.id
                                                    ? "Đang lưu..."
                                                    : "Lưu vào Tổ"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => deleteDrawnFeature(feature.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {!showDrawPanel && (
                <div className="mt-2 text-right">
                    <button
                        type="button"
                        className="text-xs font-medium text-primary hover:underline"
                        onClick={() => navigate("/neighborhoods")}
                    >
                        Quản lý danh sách Tổ dân phố
                    </button>
                </div>
            )}
        </section>
    );
};

export default NeighborhoodZonesMap;
