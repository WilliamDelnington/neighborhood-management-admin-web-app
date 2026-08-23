/* global google */
/**
 * Nap script Maps JavaScript API MOT LAN duy nhat, CHI khi nguoi dung bam
 * "Xem bản đồ" (xem HouseMapPanel.tsx) - khong bao gio tu dong nap luc vao
 * trang danh sach nha so, de tranh phat sinh chi phi Google khong can thiet.
 * Promise duoc cache o module-scope nen bam nut nhieu lan khong chen lai
 * script nhieu lan.
 */
let loadPromise: Promise<typeof google> | null = null;

const CALLBACK_NAME = "__adminHouseMapInit";

export function loadGoogleMapsScript(): Promise<typeof google> {
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_API_KEY as
            | string
            | undefined;
        if (!apiKey) {
            reject(
                new Error(
                    "Chưa cấu hình VITE_GOOGLE_MAPS_BROWSER_API_KEY",
                ),
            );
            return;
        }
        (window as unknown as Record<string, () => void>)[CALLBACK_NAME] =
            () => resolve(window.google);
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&callback=${CALLBACK_NAME}`;
        script.async = true;
        script.onerror = () =>
            reject(new Error("Không tải được Google Maps"));
        document.head.appendChild(script);
    });

    return loadPromise;
}
