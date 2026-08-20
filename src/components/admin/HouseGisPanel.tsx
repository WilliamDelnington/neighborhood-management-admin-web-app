import React, { useEffect, useState } from "react";
import { Crosshair, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Badge } from "@components/ui/badge";
import { House, AppError, HouseGisSource } from "@dts";
import { updateHouseGis } from "@service/houseApi";
import { usePermission } from "@store/authStore";

const GIS_SOURCE_SHORT_LABEL: Partial<Record<HouseGisSource, string>> = {
    device_gps: "GPS thiết bị",
    address_lookup: "Tra cứu địa chỉ",
    manual: "Nhập tay",
};

type Props = {
    house: House;
    onUpdated: (house: House) => void;
};

const HouseGisPanel: React.FC<Props> = ({ house, onUpdated }) => {
    const canUpdate = usePermission("houses.update_gis");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [accuracy, setAccuracy] = useState("");
    const [saving, setSaving] = useState(false);
    const [locating, setLocating] = useState(false);

    useEffect(() => {
        setLatitude(house.gisLatitude ? String(house.gisLatitude) : "");
        setLongitude(house.gisLongitude ? String(house.gisLongitude) : "");
        setAccuracy(
            house.gisAccuracyMeters !== null &&
                house.gisAccuracyMeters !== undefined
                ? String(house.gisAccuracyMeters)
                : "",
        );
    }, [house]);

    const save = async (
        lat: number | null,
        lng: number | null,
        source: "manual" | "device_gps" | "unavailable",
        accuracyMeters?: number | null,
    ) => {
        try {
            setSaving(true);
            const updated = await updateHouseGis(house._id, {
                gisLatitude: lat,
                gisLongitude: lng,
                gisAccuracyMeters: accuracyMeters ?? null,
                gisSource: source,
                gisCapturedAt:
                    source === "unavailable" ? null : new Date().toISOString(),
            });
            onUpdated(updated);
            toast.success(
                source === "unavailable"
                    ? "Đã đánh dấu Nhà số chưa có tọa độ"
                    : "Đã cập nhật tọa độ GIS",
            );
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const captureFromDevice = () => {
        if (!navigator.geolocation) {
            toast.error("Thiết bị/trình duyệt không hỗ trợ định vị");
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const acc = position.coords.accuracy;
                setLatitude(String(lat));
                setLongitude(String(lng));
                setAccuracy(String(Math.round(acc)));
                setLocating(false);
                void save(lat, lng, "device_gps", acc);
            },
            error => {
                setLocating(false);
                toast.error(
                    error.code === error.PERMISSION_DENIED
                        ? "Bạn chưa cấp quyền vị trí cho trình duyệt"
                        : "Không lấy được vị trí hiện tại",
                );
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
    };

    const hasCoordinates = Boolean(
        house.gisLatitude && house.gisLongitude && house.location,
    );

    return (
        <section className="rounded-xl border border-divider_01 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-main" />
                    <h3 className="font-semibold">Định danh GIS</h3>
                </div>
                <Badge tone={hasCoordinates ? "green" : "gray"}>
                    {hasCoordinates ? "Đã có tọa độ" : "Chưa có tọa độ"}
                </Badge>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
                Chưa tích hợp nền bản đồ bên thứ ba. Hệ thống chỉ lưu tọa độ;
                null hoặc 0/0 được hiểu là chưa có GIS.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                    <Label>Vĩ độ</Label>
                    <Input
                        className="mt-1"
                        type="number"
                        step="any"
                        value={latitude}
                        disabled={!canUpdate}
                        onChange={event => setLatitude(event.target.value)}
                        placeholder="10.7769"
                    />
                </div>
                <div>
                    <Label>Kinh độ</Label>
                    <Input
                        className="mt-1"
                        type="number"
                        step="any"
                        value={longitude}
                        disabled={!canUpdate}
                        onChange={event => setLongitude(event.target.value)}
                        placeholder="106.7009"
                    />
                </div>
                <div>
                    <Label>Sai số (m)</Label>
                    <Input
                        className="mt-1"
                        type="number"
                        min="0"
                        step="any"
                        value={accuracy}
                        disabled={!canUpdate}
                        onChange={event => setAccuracy(event.target.value)}
                    />
                </div>
            </div>
            {house.gisCapturedAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                    Cập nhật lúc {new Date(house.gisCapturedAt).toLocaleString("vi-VN")}
                    {" · "}
                    {GIS_SOURCE_SHORT_LABEL[house.gisSource] || "Nhập tay"}
                </p>
            )}
            {canUpdate && (
                <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                        type="button"
                        size="sm"
                        loading={locating}
                        onClick={captureFromDevice}
                    >
                        <Crosshair className="mr-1 h-4 w-4" />
                        Lấy vị trí thiết bị
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        loading={saving}
                        disabled={!latitude || !longitude}
                        onClick={() =>
                            void save(
                                Number(latitude),
                                Number(longitude),
                                "manual",
                                accuracy ? Number(accuracy) : null,
                            )
                        }
                    >
                        Lưu tọa độ nhập tay
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        loading={saving}
                        onClick={() => void save(null, null, "unavailable")}
                    >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Đánh dấu chưa có
                    </Button>
                </div>
            )}
        </section>
    );
};

export default HouseGisPanel;

