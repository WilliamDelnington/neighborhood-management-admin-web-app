import { DISEASE_STATUS_LABEL } from "@constants/domain";
import { Citizen, Household } from "@dts";

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

// Household populated tren Citizen.householdId (xem citizenService.listCitizens
// o backend) - null khi chua populate (van con la string id) hoac khong co ho.
// Dung cho cac report can doc truong cua Household (vd diseaseStatus).
export const householdOf = (
    householdId: Citizen["householdId"],
): Household | null =>
    householdId && typeof householdId !== "string" ? householdId : null;

export type ReportColumn = {
    label: string;
    width: number;
    value: (c: Citizen) => string;
};

export type ReportItem = {
    key: string;
    label: string;
    // Quyen rieng cho tung danh sach (dang ky trong permissionRegistry.ts o
    // backend, nhom "export_reports") - cho phep phan quyen ai duoc xem/xuat
    // TUNG danh sach cu the thay vi 1 quyen chung cho ca tinh nang.
    permission: string;
    // Khong co "filter" nghia la du lieu chua ho tro loc/xem/xuat muc nay
    // (chua co truong tuong ung trong du lieu nhan khau/ho dan) - hien thi
    // nhan "Sắp có" thay vi cho bam vao xem de khong tao chuc nang gia.
    filter?: (c: Citizen) => boolean;
    // Cot bo sung RIENG cho danh sach nay (vd tinh trang dich benh cua ho dan)
    // - noi them vao 6 cot chung (BASE_REPORT_COLUMNS trong exportExcel.ts),
    // hien thi CA o bang tren man hinh (ExportReportDetailPage.tsx) lan file
    // Excel xuat ra, khong anh huong cac danh sach khac.
    extraColumns?: ReportColumn[];
};

// Danh sach phang, khong chia nhom/tieu de - hien thi thanh luoi cac o dong
// nhat kich thuoc de de quet mat, thay vi gom theo linh vuc (CAP, Van hoa -
// Xa hoi...) nhu ban dau. Bam vao o de xem danh sach chi tiet
// (ExportReportDetailPage.tsx, route /export-reports/:key).
export const REPORT_ITEMS: ReportItem[] = [
    {
        key: "unregistered-residency",
        label: "Xuất danh sách chưa khai báo cư trú",
        permission: "reports.export_citizens.unregistered_residency",
        filter: c => !c.isResidencyDeclared,
    },
    {
        key: "military-age-male",
        label: "Xuất danh sách nam trong độ tuổi nhập ngũ",
        permission: "reports.export_citizens.military_age_male",
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
        label: "Xuất danh sách Phụ nữ",
        permission: "reports.export_citizens.women",
        filter: c => c.gender === "nu",
    },
    {
        key: "elderly",
        label: "Xuất danh sách Người cao tuổi",
        permission: "reports.export_citizens.elderly",
        filter: c => c.isElderly,
    },
    {
        key: "children",
        label: "Xuất danh sách Trẻ em",
        permission: "reports.export_citizens.children",
        filter: c => c.isChild,
    },
    {
        key: "veterans",
        label: "Xuất danh sách Cựu chiến binh",
        permission: "reports.export_citizens.veterans",
        filter: c => c.isVeteran,
    },
    {
        key: "martyrs",
        label: "Xuất danh sách Liệt sĩ/TB/BB",
        permission: "reports.export_citizens.martyrs",
        filter: c => c.isMartyr || c.isMartyrFamily,
    },
    {
        key: "poor-households",
        label: "Xuất danh sách Hộ nghèo/cận nghèo",
        permission: "reports.export_citizens.poor_households",
        // Chua co truong rieng phan biet "ho ngheo" va "ho can ngheo" trong du
        // lieu (chi co Household.isNearPoor) - cung quy uoc voi dashboardService,
        // dung isNearPoor lam tieu chi loc chung cho danh sach nay.
        filter: c => !!householdOf(c.householdId)?.isNearPoor,
    },
    {
        key: "disease-monitoring",
        label: "Xuất danh sách theo dõi dịch bệnh",
        permission: "reports.export_citizens.disease_monitoring",
        // Loc theo Household.diseaseStatus (khong phai cua chinh Citizen) - moi
        // nhan khau thuoc ho dan dang co dich benh duoc ghi nhan/theo doi/da xu
        // ly deu xuat hien trong danh sach nay.
        filter: c => {
            const household = householdOf(c.householdId);
            return !!household && household.diseaseStatus !== "none";
        },
        extraColumns: [
            {
                label: "Tình trạng dịch bệnh",
                width: 20,
                value: c => {
                    const household = householdOf(c.householdId);
                    return household
                        ? DISEASE_STATUS_LABEL[household.diseaseStatus]
                        : "";
                },
            },
            {
                label: "Tên bệnh/dịch bệnh",
                width: 24,
                value: c => householdOf(c.householdId)?.diseaseName || "",
            },
        ],
    },
    {
        key: "unemployed",
        label: "Xuất danh sách Thất nghiệp",
        permission: "reports.export_citizens.unemployed",
        filter: c => c.isUnemployed,
    },
];

export const ALL_REPORT_PERMISSIONS: string[] = REPORT_ITEMS.map(
    item => item.permission,
);

export const fileNameFor = (label: string) =>
    `${label
        .replace(/^Xuất danh sách\s*/i, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/gi, "d")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.xlsx`;
