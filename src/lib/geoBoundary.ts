export type BoundaryGeometry = {
    type: "Polygon" | "MultiPolygon";
    coordinates: unknown[];
};

/**
 * Chap nhan file GeoJSON o nhieu dang khac nhau ma nguoi dung co the co trong
 * tay: mot Geometry tran, mot Feature don, hoac mot FeatureCollection (lay
 * Feature dau tien co geometry Polygon/MultiPolygon) - dung cho ca file xuat
 * tu QGIS lan file xuat tu tinh nang "Vẽ ranh giới tổ" cua du an thu nghiem
 * (xuat dang FeatureCollection 1 feature).
 */
export function extractBoundaryGeometry(raw: unknown): BoundaryGeometry {
    if (!raw || typeof raw !== "object") {
        throw new Error("File không phải JSON hợp lệ");
    }
    const obj = raw as Record<string, unknown>;

    let geometry: unknown = obj;
    if (obj.type === "FeatureCollection") {
        const features = obj.features as Array<Record<string, unknown>> | undefined;
        const match = features?.find(
            f =>
                (f.geometry as Record<string, unknown> | undefined)?.type === "Polygon" ||
                (f.geometry as Record<string, unknown> | undefined)?.type === "MultiPolygon",
        );
        if (!match) {
            throw new Error("Không tìm thấy vùng (Polygon/MultiPolygon) nào trong FeatureCollection");
        }
        geometry = match.geometry;
    } else if (obj.type === "Feature") {
        geometry = obj.geometry;
    }

    const geometryObj = geometry as Record<string, unknown> | null;
    if (
        !geometryObj ||
        (geometryObj.type !== "Polygon" && geometryObj.type !== "MultiPolygon") ||
        !Array.isArray(geometryObj.coordinates)
    ) {
        throw new Error("Chỉ hỗ trợ geometry dạng Polygon hoặc MultiPolygon");
    }

    return {
        type: geometryObj.type as "Polygon" | "MultiPolygon",
        coordinates: geometryObj.coordinates as unknown[],
    };
}

function forEachRing(
    geometry: BoundaryGeometry,
    callback: (ring: number[][]) => void,
) {
    if (geometry.type === "MultiPolygon") {
        (geometry.coordinates as number[][][][]).forEach(polygon =>
            polygon.forEach(callback),
        );
    } else {
        (geometry.coordinates as number[][][]).forEach(callback);
    }
}

export function countBoundaryPoints(geometry: BoundaryGeometry): number {
    let count = 0;
    forEachRing(geometry, ring => {
        count += ring.length;
    });
    return count;
}

/**
 * Ve phac thao hinh dang ranh gioi trong khung 0-100 (khong dung nen ban do
 * ben thu ba) - chi de nguoi nhap lieu kiem tra nhanh hinh dang vua nhap co
 * hop ly khong, giong cach GisOverviewMap.tsx dang lam voi diem toa do.
 */
export function buildBoundaryPreviewPath(geometry: BoundaryGeometry): string | null {
    const allPoints: number[][] = [];
    forEachRing(geometry, ring => allPoints.push(...ring));
    if (allPoints.length === 0) return null;

    const lngs = allPoints.map(p => p[0]);
    const lats = allPoints.map(p => p[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const lngRange = maxLng - minLng || 0.001;
    const latRange = maxLat - minLat || 0.001;

    const project = ([lng, lat]: number[]) => [
        6 + ((lng - minLng) / lngRange) * 88,
        94 - ((lat - minLat) / latRange) * 88,
    ];

    const parts: string[] = [];
    forEachRing(geometry, ring => {
        const projected = ring.map(project);
        if (projected.length === 0) return;
        parts.push(
            `M ${projected.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" L ")} Z`,
        );
    });
    return parts.join(" ");
}
