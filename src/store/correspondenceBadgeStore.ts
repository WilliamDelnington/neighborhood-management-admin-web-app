import { create } from "zustand";
import { fetchUnreadCorrespondenceCount } from "@service/correspondenceApi";

// So van ban (Cong van/Bao cao/De xuat/Kien nghi...) chua doc cua nguoi dang
// nhap - hien badge do canh muc "Văn bản" tren menu (AdminLayout.tsx). Tach
// rieng store (giong surveyBadgeStore.ts) de trang chi tiet van ban co the
// goi refresh() ngay sau khi mo (backend tu danh dau da doc khi GET chi tiet
// - xem markRelatedNotificationsRead), thay vi doi den lan poll dinh ky.
interface CorrespondenceBadgeState {
    unreadCount: number;
    refresh: () => void;
}

export const useCorrespondenceBadgeStore = create<CorrespondenceBadgeState>()(
    set => ({
        unreadCount: 0,
        refresh: () => {
            fetchUnreadCorrespondenceCount()
                .then(res => set({ unreadCount: res.count }))
                .catch(() => {});
        },
    }),
);
