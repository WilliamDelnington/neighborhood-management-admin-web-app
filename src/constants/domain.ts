import type {
    DangKyHop,
    GioiTinh,
    LoaiCauHoiKhaoSat,
    LoaiCuTru,
    LoaiGiaoDichTaiChinh,
    LoaiSoHuu,
    LoaiThongBao,
    MucDoAnNinh,
    MucNguyCoPccc,
    NhomPhanAnh,
    Role,
    TrangThaiGiaoDich,
    TrangThaiKhaoSat,
    TrangThaiPhanAnh,
    TrangThaiThongBao,
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

export const LOAI_SO_HUU_LABEL: Record<LoaiSoHuu, string> = {
    chinh_chu: "Chính chủ",
    cho_thue: "Cho thuê",
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
