import { Citizen } from "@dts";

// Do tuoi nghia vu quan su ap dung cho nam gioi (Luat NVQS) - dung de loc
// danh sach "Nam trong do tuoi nhap ngu" tu ngay sinh nhan khau, vi du lieu
// khong co san co truong rieng danh dau doi tuong nay.
const MILITARY_AGE_MIN = 18;
const MILITARY_AGE_MAX = 25;

export const ageOf = (birthDate?: string): number | undefined => {
    if (!birthDate) return undefined;
    const dob = new Date(birthDate);
    if (Number.isNaN(dob.getTime())) return undefined;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
        age -= 1;
    }
    return age;
};

// Cung dinh dang voi householdLabelOf trong CitizenListPage.tsx (ma ho - dia
// chi) de nguoi xem nhan ra ngay ho nao, vi mot dia chi co the co nhieu ho.
export const householdLabelOf = (householdId: Citizen["householdId"]): string => {
    if (!householdId) return "";
    return typeof householdId === "string"
        ? householdId
        : `${householdId.code} — ${householdId.address}`;
};

export type ReportItem = {
    key: string;
    order: number;
    label: string;
    // Khong co "filter" nghia la du lieu chua ho tro loc/xem/xuat muc nay
    // (chua co truong tuong ung trong du lieu nhan khau/ho dan) - hien thi
    // nhan "Sắp có" thay vi cho bam vao xem de khong tao chuc nang gia.
    filter?: (c: Citizen) => boolean;
};

// Danh sach phang, khong chia nhom/tieu de - hien thi thanh luoi cac o dong
// nhat kich thuoc de de quet mat, thay vi gom theo linh vuc (CAP, Van hoa -
// Xa hoi...) nhu ban dau. Bam vao o de xem danh sach chi tiet
// (ExportReportDetailPage.tsx, route /export-reports/:key).
export const REPORT_ITEMS: ReportItem[] = [
    {
        key: "unregistered-residency",
        order: 1,
        label: "Xuất danh sách chưa khai báo cư trú",
    },
    {
        key: "military-age-male",
        order: 2,
        label: "Xuất danh sách nam trong độ tuổi nhập ngũ",
        filter: c => {
            const age = ageOf(c.birthDate);
            return (
                c.gender === "nam" &&
                age !== undefined &&
                age >= MILITARY_AGE_MIN &&
                age <= MILITARY_AGE_MAX
            );
        },
    },
    {
        key: "women",
        order: 3,
        label: "Xuất danh sách Phụ nữ",
        filter: c => c.gender === "nu",
    },
    {
        key: "elderly",
        order: 4,
        label: "Xuất danh sách Người cao tuổi",
        filter: c => c.isElderly,
    },
    {
        key: "children",
        order: 5,
        label: "Xuất danh sách Trẻ em",
        filter: c => c.isChild,
    },
    {
        key: "veterans",
        order: 6,
        label: "Xuất danh sách Cựu chiến binh",
        filter: c => c.isVeteran,
    },
    {
        key: "martyrs",
        order: 7,
        label: "Xuất danh sách Liệt sĩ/TB/BB",
        filter: c => c.isMartyr || c.isMartyrFamily,
    },
    {
        key: "poor-households",
        order: 8,
        label: "Xuất danh sách Hộ nghèo/cận nghèo",
    },
    {
        key: "disease-monitoring",
        order: 9,
        label: "Xuất danh sách theo dõi dịch bệnh",
    },
    {
        key: "unemployed",
        order: 10,
        label: "Xuất danh sách Thất nghiệp",
    },
];

export const fileNameFor = (label: string) =>
    `${label
        .replace(/^Xuất danh sách\s*/i, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/gi, "d")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.xlsx`;
