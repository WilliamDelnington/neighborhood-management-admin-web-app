import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Map as MapIcon, MapPinned, Satellite, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@lib/utils";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Checkbox } from "@components/ui/checkbox";
import { AppError, Neighborhood } from "@dts";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import {
    GeoAutocompletePrediction,
    autocompleteNeighborhoodPlaces,
    fetchNeighborhoodPlaceDetails,
} from "@service/neighborhoodGeoApi";
import wardBoundary from "@assets/geo/duongNoiWardBoundary.json";

const GOONG_MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY || "";
const DEFAULT_CENTER: [number, number] = [105.745, 20.98]; // Phường Dương Nội
const DEFAULT_ZOOM = 14;

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

function escapeHtml(value: string): string {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
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
const NeighborhoodZonesMap: React.FC = () => {
    const navigate = useNavigate();
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[] | null>(null);
    const [listError, setListError] = useState(false);
    const [mapVisible, setMapVisible] = useState(false);
    const [mapLoading, setMapLoading] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [mapStyleKey, setMapStyleKey] = useState<MapStyleKey>("street");
    const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
    const [searchText, setSearchText] = useState("");
    const [searchSuggestions, setSearchSuggestions] = useState<
        GeoAutocompletePrediction[]
    >([]);
    const [searching, setSearching] = useState(false);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    // any: @goongmaps/goong-js khong kem type (xem src/types/goong-js.d.ts).
    const mapRef = useRef<any>(null);
    const goongRef = useRef<any>(null);
    const popupRef = useRef<any>(null);
    const searchMarkerRef = useRef<any>(null);
    const searchSessionTokenRef = useRef<string | null>(null);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        fetchNeighborhoods({ limit: 100, active: true })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setListError(true));
    }, []);

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
            const canvas = map.getCanvas();
            canvas.style.cursor = "pointer";
        });
        map.on("mouseleave", "zones-fill", () => {
            const canvas = map.getCanvas();
            canvas.style.cursor = "";
        });
        map.on("click", "zones-fill", (e: any) => {
            const neighborhoodId = e.features?.[0]?.properties?.neighborhoodId;
            if (!neighborhoodId) return;
            setSelectedZoneIds([neighborhoodId]);
        });
    }, []);

    useEffect(() => {
        if (!mapVisible || !neighborhoods) return undefined;
        if (!GOONG_MAPTILES_KEY) {
            setMapError("Chưa cấu hình VITE_GOONG_MAPTILES_KEY");
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
                });
                mapRef.current = map;
                map.addControl(new goongjs.NavigationControl(), "top-right");

                map.on("load", () => {
                    if (cancelled) return;
                    addOverlayLayers(map);
                    bindInteractions(map, goongjs);

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
                    setMapError(
                        (err as AppError | Error).message || "Không tải được bản đồ",
                    );
                }
            } finally {
                if (!cancelled) setMapLoading(false);
            }
        })();

        return () => {
            cancelled = true;
            mapRef.current?.remove();
            mapRef.current = null;
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

    return (
        <section className="rounded-lg border border-divider_01 bg-ui_bg p-4 shadow-sm">
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
                </div>
            </div>

            {mapVisible && (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_280px]">
                    <div className="relative h-[600px] w-full">
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
                    </div>
                    {!mapLoading && !mapError && (
                        <div className="flex flex-col gap-2">
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
                            <div className="max-h-[560px] overflow-y-auto rounded-lg border border-divider_01">
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
                                            <span className="shrink-0 text-text_2">
                                                {zone.houseCount ?? 0} nhà
                                            </span>
                                        </button>
                                    </div>
                                ))}
                                {zonesWithGeometry.length === 0 && (
                                    <div className="px-3 py-6 text-center text-xs text-text_2">
                                        Chưa có tổ dân phố nào được nạp ranh giới.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div className="mt-2 text-right">
                <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() => navigate("/neighborhoods")}
                >
                    Quản lý danh sách Tổ dân phố
                </button>
            </div>
        </section>
    );
};

export default NeighborhoodZonesMap;
