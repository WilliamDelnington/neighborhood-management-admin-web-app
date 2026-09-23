import { create } from "zustand";
import { fetchPendingComplaintCount } from "@service/complaintApi";

// So phan anh dang cho xu ly (pham vi "Nhận từ cư dân") cua nguoi dang nhap -
// hien badge do canh muc "Phản ánh" tren menu (AdminLayout.tsx), cung quy uoc
// voi requestBadgeStore.ts/correspondenceBadgeStore.ts.
interface ComplaintBadgeState {
    pendingCount: number;
    refresh: () => void;
}

export const useComplaintBadgeStore = create<ComplaintBadgeState>()(set => ({
    pendingCount: 0,
    refresh: () => {
        fetchPendingComplaintCount()
            .then(res => set({ pendingCount: res.count }))
            .catch(() => {});
    },
}));
