import { create } from "zustand";
import { fetchMyPendingRequestCount } from "@service/requestApi";

// So yeu cau cong viec dang duoc GIAO cho nguoi dang nhap ma CHUA hoan thanh -
// hien badge do canh muc "Yêu cầu công việc" tren menu (AdminLayout.tsx). Tach
// rieng store (cung quy uoc voi correspondenceBadgeStore.ts/surveyBadgeStore.ts)
// de RequestListPage.tsx co the goi refresh() ngay sau khi doi trang thai (vd
// "Báo hoàn thành"), thay vi doi den lan poll dinh ky.
interface RequestBadgeState {
    pendingCount: number;
    refresh: () => void;
}

export const useRequestBadgeStore = create<RequestBadgeState>()(set => ({
    pendingCount: 0,
    refresh: () => {
        fetchMyPendingRequestCount()
            .then(res => set({ pendingCount: res.count }))
            .catch(() => {});
    },
}));
