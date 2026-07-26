import type {
    DangKyHop,
    FileAssetCategory,
    GioiTinh,
    HouseStatus,
    LoaiCauHoiKhaoSat,
    LoaiCuTru,
    LoaiGiaoDichTaiChinh,
    LoaiSoHuu,
    LoaiThongBao,
    LoaiYeuCauHoTro,
    MucDoAnNinh,
    MucNguyCoPccc,
    NhomPhanAnh,
    Role,
    TinhTrangTheoDoiAnNinh,
    TinhTrangTheoDoiPccc,
    TrangThaiGiaoDich,
    TrangThaiKhaoSat,
    TrangThaiPhanAnh,
    TrangThaiThongBao,
    TrangThaiYeuCauHoTro,
    UserStatus,
} from "@dts";
import type { BadgeTone } from "@components/ui/badge";

export const ROLE_LABEL: Record<Role, string> = {
    resident: "Người dân",
    neighborhood_leader: "Tổ trưởng",
    secretary: "Bí thư",
    regional_police: "Công an khu vực",
    people_committee_official: "Cán bộ UBND",
    admin: "Quản trị viên",
};

export const NHOM_PHAN_ANH_LABEL: Record<NhomPhanAnh, string> = {
    an_ninh_trat_tu: "An ninh trật tự",
    pccc: "PCCC",
    ve_sinh_moi_truong: "Vệ sinh môi trường",
    ha_tang_dien_nuoc: "Hạ tầng điện nước",
    chieu_sang: "Chiếu sáng",
    tranh_chap_dan_cu: "Tranh chấp dân cư",
    tam_tru_nha_cho_thue: "Tạm trú / nhà cho thuê",
    gop_y_chung: "Góp ý chung",
    khac: "Khác",
};

export const TRANG_THAI_PHAN_ANH_LABEL: Record<TrangThaiPhanAnh, string> = {
    moi_tiep_nhan: "Mới tiếp nhận",
    da_tiep_nhan: "Đã tiếp nhận",
    dang_xu_ly: "Đang xử lý",
    da_chuyen_ubnd: "Đã chuyển UBND phường",
    da_xu_ly: "Đã xử lý",
    dong: "Đóng",
};

export const TRANG_THAI_PHAN_ANH_TONE: Record<TrangThaiPhanAnh, BadgeTone> = {
    moi_tiep_nhan: "gray",
    da_tiep_nhan: "blue",
    dang_xu_ly: "yellow",
    da_chuyen_ubnd: "blue",
    da_xu_ly: "green",
    dong: "gray",
};

export const LOAI_YEU_CAU_HO_TRO_LABEL: Record<LoaiYeuCauHoTro, string> = {
    bao_loi: "Báo lỗi",
    gop_y: "Góp ý",
};

export const TRANG_THAI_YEU_CAU_HO_TRO_LABEL: Record<
    TrangThaiYeuCauHoTro,
    string
> = {
    moi: "Mới",
    dang_xu_ly: "Đang xử lý",
    da_xu_ly: "Đã xử lý",
    dong: "Đóng",
};

export const TRANG_THAI_YEU_CAU_HO_TRO_TONE: Record<
    TrangThaiYeuCauHoTro,
    BadgeTone
> = {
    moi: "gray",
    dang_xu_ly: "yellow",
    da_xu_ly: "green",
    dong: "gray",
};

export const LOAI_SO_HUU_LABEL: Record<LoaiSoHuu, string> = {
    chinh_chu: "Chính chủ",
    cho_thue: "Cho thuê",
};

export const HOUSE_STATUS_LABEL: Record<HouseStatus, string> = {
    unverified: "Chưa xác thực",
    pending: "Chờ duyệt",
    verified: "Đã duyệt",
    denied: "Bị từ chối",
    locked: "Bị khóa",
};

export const HOUSE_STATUS_TONE: Record<HouseStatus, BadgeTone> = {
    unverified: "gray",
    pending: "yellow",
    verified: "green",
    denied: "red",
    locked: "red",
};

// Nhan hien thi cho cac action ghi trong AuditLog voi targetModel = "HouseRecord"
// (xem services/houseRecordService.ts) - dung cho khu vuc lich su chinh sua o
// man chi tiet nha so. Action la chuoi tu do nen fallback ve chinh no neu chua
// co trong danh sach (vd action moi duoc them sau nay).
export const HOUSE_AUDIT_ACTION_LABEL: Record<string, string> = {
    "house.create": "Tạo mới nhà số",
    "house.update": "Cập nhật thông tin",
    "house.status_change": "Đổi trạng thái",
    "house.delete": "Xóa nhà số",
};

// Cac nhan hien thi cho khu vuc "Lich su chinh sua" cua tung module - xem
// RecordHistorySection/RecordHistoryPage (src/components/admin). Action la
// chuoi tu do nen fallback ve chinh no neu chua co trong danh sach.
export const PCCC_AUDIT_ACTION_LABEL: Record<string, string> = {
    "pccc.create": "Tạo đợt kiểm tra",
    "pccc.update": "Cập nhật thông tin",
    "pccc.assign": "Phân công xử lý",
    "pccc.attachment.upload": "Tải lên file đính kèm",
    "pccc.attachment.delete": "Xóa file đính kèm",
    "pccc.delete": "Xóa đợt kiểm tra",
};

export const SECURITY_AUDIT_ACTION_LABEL: Record<string, string> = {
    "security.create": "Tạo hồ sơ an ninh",
    "security.update": "Cập nhật thông tin",
    "security.assign": "Phân công theo dõi",
    "security.delete": "Xóa hồ sơ an ninh",
};

export const MEETING_AUDIT_ACTION_LABEL: Record<string, string> = {
    "meeting.create": "Tạo cuộc họp",
    "meeting.update": "Cập nhật thông tin",
    "meeting.delete": "Xóa cuộc họp",
};

export const SURVEY_AUDIT_ACTION_LABEL: Record<string, string> = {
    "survey.create": "Tạo khảo sát",
    "survey.update": "Cập nhật thông tin",
    "survey.open": "Mở khảo sát",
    "survey.close": "Đóng khảo sát",
    "survey.delete": "Xóa khảo sát",
};

export const GIOI_TINH_LABEL: Record<GioiTinh, string> = {
    nam: "Nam",
    nu: "Nữ",
    khac: "Khác",
};

export const LOAI_CU_TRU_LABEL: Record<LoaiCuTru, string> = {
    thuong_tru: "Thường trú",
    tam_tru: "Tạm trú",
};

export const MUC_NGUY_CO_PCCC_LABEL: Record<MucNguyCoPccc, string> = {
    xanh: "Xanh",
    vang: "Vàng",
    do: "Đỏ",
};

export const MUC_NGUY_CO_PCCC_TONE: Record<MucNguyCoPccc, BadgeTone> = {
    xanh: "green",
    vang: "yellow",
    do: "red",
};

export const TINH_TRANG_THEO_DOI_PCCC_LABEL: Record<
    TinhTrangTheoDoiPccc,
    string
> = {
    chua_khac_phuc: "Chưa khắc phục",
    dang_khac_phuc: "Đang khắc phục",
    da_khac_phuc: "Đã khắc phục",
};

export const TINH_TRANG_THEO_DOI_PCCC_TONE: Record<
    TinhTrangTheoDoiPccc,
    BadgeTone
> = {
    chua_khac_phuc: "gray",
    dang_khac_phuc: "yellow",
    da_khac_phuc: "green",
};

export const FILE_ASSET_CATEGORY_LABEL: Record<FileAssetCategory, string> = {
    form: "Biểu mẫu",
    attachment: "Tệp đính kèm",
    minutes: "Biên bản",
    other: "Khác",
};

export const FILE_ASSET_CATEGORY_TONE: Record<FileAssetCategory, BadgeTone> = {
    form: "blue",
    attachment: "gray",
    minutes: "yellow",
    other: "gray",
};

export const MUC_DO_AN_NINH_LABEL: Record<MucDoAnNinh, string> = {
    binh_thuong: "Bình thường",
    can_theo_doi: "Cần theo dõi",
    khan_cap: "Khẩn cấp",
};

export const MUC_DO_AN_NINH_TONE: Record<MucDoAnNinh, BadgeTone> = {
    binh_thuong: "green",
    can_theo_doi: "yellow",
    khan_cap: "red",
};

export const TINH_TRANG_THEO_DOI_AN_NINH_LABEL: Record<
    TinhTrangTheoDoiAnNinh,
    string
> = {
    binh_thuong: "Bình thường",
    dang_theo_doi: "Đang theo dõi",
    da_bao_cong_an: "Đã báo Công an",
    da_ket_thuc: "Đã kết thúc",
};

export const TINH_TRANG_THEO_DOI_AN_NINH_TONE: Record<
    TinhTrangTheoDoiAnNinh,
    BadgeTone
> = {
    binh_thuong: "gray",
    dang_theo_doi: "yellow",
    da_bao_cong_an: "red",
    da_ket_thuc: "green",
};

export const LOAI_THONG_BAO_LABEL: Record<LoaiThongBao, string> = {
    chung: "Thông báo chung",
    hop_dan: "Họp dân",
    pccc: "PCCC",
    ve_sinh_moi_truong: "Vệ sinh môi trường",
    an_ninh_trat_tu: "An ninh trật tự",
    khac: "Khác",
};

export const TRANG_THAI_THONG_BAO_LABEL: Record<TrangThaiThongBao, string> = {
    nhap: "Nháp",
    da_dang: "Đã đăng",
};

export const DANG_KY_HOP_LABEL: Record<DangKyHop, string> = {
    co: "Có",
    khong: "Không",
    uy_quyen: "Ủy quyền",
};

export const LOAI_CAU_HOI_KHAO_SAT_LABEL: Record<LoaiCauHoiKhaoSat, string> = {
    dong_y_khong_dong_y: "Đồng ý / Không đồng ý",
    chon_mot: "Chọn một",
    chon_nhieu: "Chọn nhiều",
    y_kien_khac: "Ý kiến khác",
};

export const TRANG_THAI_KHAO_SAT_LABEL: Record<TrangThaiKhaoSat, string> = {
    nhap: "Nháp",
    dang_mo: "Đang mở",
    da_dong: "Đã đóng",
};

export const TRANG_THAI_KHAO_SAT_TONE: Record<TrangThaiKhaoSat, BadgeTone> = {
    nhap: "gray",
    dang_mo: "green",
    da_dong: "blue",
};

export const LOAI_GIAO_DICH_TAI_CHINH_LABEL: Record<
    LoaiGiaoDichTaiChinh,
    string
> = {
    thu: "Khoản thu",
    chi: "Khoản chi",
};

export const TRANG_THAI_GIAO_DICH_LABEL: Record<TrangThaiGiaoDich, string> = {
    nhap: "Nháp",
    da_duyet: "Đã duyệt",
    da_huy: "Đã hủy",
};

export const TRANG_THAI_GIAO_DICH_TONE: Record<TrangThaiGiaoDich, BadgeTone> = {
    nhap: "gray",
    da_duyet: "green",
    da_huy: "red",
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
    active: "Đang hoạt động",
    pending: "Chờ duyệt",
    locked: "Đã khóa",
};

export const USER_STATUS_TONE: Record<UserStatus, BadgeTone> = {
    active: "green",
    pending: "yellow",
    locked: "red",
};
