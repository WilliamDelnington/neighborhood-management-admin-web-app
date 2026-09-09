import { create } from "zustand";
import { fetchUnansweredSurveyCount } from "@service/surveyApi";

// So khao sat dang mo, dung dieu kien tra loi cua nguoi dang nhap nhung
// chua tra loi - hien thanh badge canh muc "Khảo sát" tren menu (AdminLayout.tsx).
// Tach rieng store nay (thay vi useState cuc bo trong AdminLayout) de
// SurveyListPage/SurveyRespondDialog co the goi refresh() ngay sau khi gui
// cau tra loi thanh cong, thay vi doi den lan poll dinh ky tiep theo.
interface SurveyBadgeState {
    unansweredCount: number;
    refresh: () => void;
}

export const useSurveyBadgeStore = create<SurveyBadgeState>()(set => ({
    unansweredCount: 0,
    refresh: () => {
        fetchUnansweredSurveyCount()
            .then(res => set({ unansweredCount: res.count }))
            .catch(() => {});
    },
}));
