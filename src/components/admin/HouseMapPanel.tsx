import React, { useEffect, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Map as MapIcon } from "lucide-react";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { AppError } from "@dts";
import {
    fetchHouseGisOverview,
    HouseGisOverview,
} from "@service/houseApi";
import { loadGoogleMapsScript } from "@lib/loadGoogleMaps";

const DEFAULT_CENTER = { lat: 21.028511, lng: 105.804817 }; // Ha Noi
const DEFAULT_ZOOM = 13;
const POINTS_ZOOM = 16;

/**
 * Ban do tong hop vi tri nha so trong pham vi cua nhan vien. So lieu thong ke
 * (N/M nha co toa do) tai NGAY luc mount (chi 1 request backend, khong ton
 * chi phi Google) nhung script Maps JavaScript API + hien thi ban do CHI nap
 * khi bam "Xem bản đồ" - muc tieu la giam toi da so request Google Maps thuc
 * te phat sinh (xem ke hoach: uu tien cost-saving).
 */
const HouseMapPanel: React.FC = () => {
    const [overview, setOverview] = useState<HouseGisOverview | null>(null);
    const [statsError, setStatsError] = useState(false);
    const [mapVisible, setMapVisible] = useState(false);
    const [mapLoading, setMapLoading] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const clustererRef = useRef<MarkerClusterer | null>(null);

    useEffect(() => {
        fetchHouseGisOverview()
            .then(setOverview)
            .catch(() => setStatsError(true));
    }, []);

    // Chi khoi tao ban do khi CA HAI dieu kien deu san sang: nguoi dung da bam
    // "Xem bản đồ" (mapVisible) VA container div da duoc render (chi render
    // khi mapVisible=true) - tach thanh effect rieng thay vi goi truc tiep
    // trong onClick de khong phu thuoc vao thu tu re-render cua React.
    useEffect(() => {
        if (!mapVisible || !overview) return undefined;
        let cancelled = false;

        (async () => {
            try {
                setMapLoading(true);
                setMapError(null);
                const googleMaps = await loadGoogleMapsScript();
                if (cancelled || !mapContainerRef.current) return;

                const { points } = overview;
                const center = points.length
                    ? {
                          lat:
                              points.reduce((sum, p) => sum + p.latitude, 0) /
                              points.length,
                          lng:
                              points.reduce((sum, p) => sum + p.longitude, 0) /
                              points.length,
                      }
                    : DEFAULT_CENTER;

                const map = new googleMaps.maps.Map(mapContainerRef.current, {
                    center,
                    zoom: points.length ? POINTS_ZOOM : DEFAULT_ZOOM,
                });

                const markers = points.map(
                    point =>
                        new googleMaps.maps.Marker({
                            position: {
                                lat: point.latitude,
                                lng: point.longitude,
                            },
                            title: `${point.code} - ${point.address}`,
                        }),
                );

                clustererRef.current?.clearMarkers();
                clustererRef.current = new MarkerClusterer({ map, markers });
            } catch (err) {
                if (!cancelled) {
                    setMapError(
                        (err as AppError | Error).message ||
                            "Không tải được bản đồ",
                    );
                }
            } finally {
                if (!cancelled) setMapLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapVisible, overview]);

    const showMap = () => setMapVisible(true);

    let statsContent: React.ReactNode;
    if (overview) {
        statsContent = (
            <span className="text-sm text-text_2">
                <Badge tone="green">{overview.housesWithCoordinates}</Badge>{" "}
                / <Badge tone="gray">{overview.totalHouses}</Badge> nhà số đã
                có tọa độ ({overview.scopeLabel})
            </span>
        );
    } else if (statsError) {
        statsContent = (
            <span className="text-sm text-red-500">
                Không tải được số liệu tọa độ
            </span>
        );
    } else {
        statsContent = (
            <span className="text-sm text-text_3">
                Đang tải số liệu tọa độ...
            </span>
        );
    }

    return (
        <div className="mb-4 rounded-2xl border border-divider_01 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <MapIcon className="h-4 w-4 text-main" />
                    {statsContent}
                </div>
                {!mapVisible && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={showMap}
                        disabled={!overview}
                    >
                        <MapIcon className="mr-1 h-4 w-4" />
                        Xem bản đồ
                    </Button>
                )}
            </div>
            {mapVisible && (
                <div className="mt-3">
                    {mapLoading && (
                        <p className="text-sm text-text_3">Đang tải bản đồ...</p>
                    )}
                    {mapError && (
                        <p className="text-sm text-red-500">{mapError}</p>
                    )}
                    <div
                        ref={mapContainerRef}
                        className="h-96 w-full rounded-xl"
                        style={{ display: mapLoading || mapError ? "none" : "block" }}
                    />
                </div>
            )}
        </div>
    );
};

export default HouseMapPanel;
