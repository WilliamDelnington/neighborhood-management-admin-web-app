import type {
    AppointmentStatus,
    BusinessDocumentStatus,
    DangKyHop,
    FileAssetCategory,
    GioiTinh,
    House,
    HouseOwnershipRelationshipType,
    HouseOwnershipVerificationStatus,
    HousePhysicalStatus,
    HouseStatus,
    HouseUsageType,
    InfrastructureAssetCondition,
    InfrastructureAssetType,
    LoaiCauHoiKhaoSat,
    PeriodicReportStatus,
    PeriodicReportType,
    LoaiCuTru,
    LoaiGiaoDichTaiChinh,
    LoaiSoHuu,
    LoaiThongBao,
    LoaiYeuCauHoTro,
    MucDoAnNinh,
    MucNguyCoPccc,
    NhomPhanAnh,
    OrganizationRepresentativeRole,
    RequestHouseRole,
    RequestPriority,
    RequestStatus,
    RequestType,
    Role,
    TinhTrangTheoDoiAnNinh,
    TinhTrangTheoDoiPccc,
    TrangThaiGiaoDich,
    TrangThaiKhaoSat,
    TrangThaiPhanAnh,
    TrangThaiThongBao,
    TrangThaiYeuCauHoTro,
    UserStatus,
    VerificationStatus,
} from "@dts";
import type { BadgeTone } from "@components/ui/badge";

export const ROLE_LABEL: Record<Role, string> = {
    house_owner: "Chủ sở hữu",
    household_head: "Chủ hộ",
    neighborhood_leader: "Tổ trưởng",
    neighborhood_coleader: "Tổ phó",
    neighborhood_collaborator: "Cộng tác viên Tổ dân phố",
    secretary: "Bí thư",
    regional_police: "Công an khu vực",
    people_committee_official: "Cán bộ UBND",
    admin: "Quản trị viên",
};

// Danh sach nhom phan anh 10 loai cu (truoc khi co ComplaintTypeDefinition
// quan tri duoc qua man Loai phan anh). Chi con dung lam gia tri khoi tao
// truoc khi goi API xong, va lam fallback nhan cho key khong tim thay trong
// danh sach da fetch - KHONG con la nguon du lieu chinh, xem
// fetchComplaintTypeDefinitions trong @service/complaintTypeApi.
export const NHOM_PHAN_ANH_LABEL: Record<string, string> = {
    an_ninh_trat_tu: "An ninh trật tự",
    pccc: "PCCC",
    ve_sinh_moi_truong: "Vệ sinh môi trường",
    ha_tang_dien_nuoc: "Hạ tầng điện nước",
    chieu_sang: "Chiếu sáng",
    tranh_chap_dan_cu: "Tranh chấp dân cư",
    tam_tru_nha_cho_thue: "Tạm trú / nhà cho thuê",
    gop_y_chung: "Góp ý chung",
    ha_tang: "Hạ tầng (đường, cống, cây, rác...)",
    khac: "Khác",
};

export const INFRASTRUCTURE_ASSET_TYPE_LABEL: Record<
    InfrastructureAssetType,
    string
> = {
    den: "Đèn chiếu sáng",
    duong: "Đường",
    cong: "Cống",
    cay: "Cây xanh",
    diem_rac: "Điểm tập kết rác",
    nha_sinh_hoat: "Nhà sinh hoạt cộng đồng",
};

export const INFRASTRUCTURE_ASSET_CONDITION_LABEL: Record<
    InfrastructureAssetCondition,
    string
> = {
    binh_thuong: "Bình thường",
    hu_hong: "Hư hỏng",
    can_kiem_tra: "Cần kiểm tra",
};

export const INFRASTRUCTURE_ASSET_CONDITION_TONE: Record<
    InfrastructureAssetCondition,
    BadgeTone
> = {
    binh_thuong: "green",
    hu_hong: "red",
    can_kiem_tra: "yellow",
};

export const PERIODIC_REPORT_TYPE_LABEL: Record<PeriodicReportType, string> = {
    weekly: "Hàng tuần",
    monthly: "Hàng tháng",
    quarterly: "Hàng quý",
    yearly: "Hàng năm",
    ad_hoc: "Đột xuất",
};

export const PERIODIC_REPORT_STATUS_LABEL: Record<
    PeriodicReportStatus,
    string
> = {
    draft: "Bản nháp",
    submitted: "Đã nộp",
    received: "Phường đã tiếp nhận",
    accepted: "Phường đã chấp nhận",
    revision_required: "Yêu cầu bổ sung",
    recalled: "Đã thu hồi",
    revision_requested: "Yêu cầu bổ sung",
    resubmitted: "Đã nộp lại",
};

export const PERIODIC_REPORT_STATUS_TONE: Record<
    PeriodicReportStatus,
    BadgeTone
> = {
    draft: "gray",
    submitted: "blue",
    received: "yellow",
    accepted: "green",
    revision_required: "red",
    recalled: "gray",
    revision_requested: "red",
    resubmitted: "green",
};

export const TRANG_THAI_PHAN_ANH_LABEL: Record<TrangThaiPhanAnh, string> = {
    moi_tiep_nhan: "Mới tiếp nhận",
    da_tiep_nhan: "Đã tiếp nhận",
    dang_xu_ly: "Đang xử lý",
    da_chuyen_ubnd: "Đã chuyển UBND phường",
    da_xu_ly: "Đã xử lý",
    hoan_thanh: "Hoàn thành",
    dong: "Đóng",
    can_bo_sung: "Cần bổ sung thông tin",
};

export const TRANG_THAI_PHAN_ANH_TONE: Record<TrangThaiPhanAnh, BadgeTone> = {
    moi_tiep_nhan: "gray",
    da_tiep_nhan: "blue",
    dang_xu_ly: "yellow",
    da_chuyen_ubnd: "blue",
    da_xu_ly: "green",
    hoan_thanh: "green",
    dong: "gray",
    can_bo_sung: "red",
};

export const LOAI_YEU_CAU_HO_TRO_LABEL: Record<LoaiYeuCauHoTro, string> = {
    bao_loi: "Báo lỗi ứng dụng",
    gop_y: "Góp ý ứng dụng",
    ho_tro_ho_dan: "Hỗ trợ hộ dân",
};

export const TRANG_THAI_YEU_CAU_HO_TRO_LABEL: Record<
    TrangThaiYeuCauHoTro,
    string
> = {
    moi: "Mới",
    dang_xu_ly: "Đang xử lý",
    can_bo_sung: "Cần bổ sung thông tin",
    da_xu_ly: "Đã xử lý",
    dong: "Đóng",
};

export const TRANG_THAI_YEU_CAU_HO_TRO_TONE: Record<
    TrangThaiYeuCauHoTro,
    BadgeTone
> = {
    moi: "gray",
    dang_xu_ly: "yellow",
    can_bo_sung: "red",
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
    needs_update: "Cần cập nhật",
    locked: "Bị khóa",
};

export const HOUSE_STATUS_TONE: Record<HouseStatus, BadgeTone> = {
    unverified: "gray",
    pending: "yellow",
    verified: "green",
    denied: "red",
    needs_update: "yellow",
    locked: "red",
};

// Ghep dia chi day du tu cac thanh phan doc lap cua House (so nha/ngo, duong,
// phuong/xa, tinh/thanh pho) - bo qua thanh phan nao chua co (nha cu/chua
// khai bao het). Duong/pho lay tu streetId populated neu co, khong thi bo qua
// (cluster la ten cum dan cu, khong phai ten duong nen khong ghep vao day).
export function formatFullAddress(house: House): string {
    const street =
        house.streetId && typeof house.streetId !== "string"
            ? house.streetId.name
            : undefined;
    return [house.address, street, house.wardName, house.provinceName]
        .filter(Boolean)
        .join(", ");
}

export const HOUSE_PHYSICAL_STATUS_LABEL: Record<HousePhysicalStatus, string> = {
    not_handed_over: "Chưa bàn giao",
    not_renovated: "Chưa sửa",
    under_construction: "Đang hoàn thiện",
    under_renovation: "Đang sửa",
    completed: "Đã hoàn thiện",
    in_use: "Đang sử dụng",
    vacant: "Để trống",
    damaged: "Xuống cấp",
};

export const HOUSE_OWNERSHIP_RELATIONSHIP_TYPE_LABEL: Record<
    HouseOwnershipRelationshipType,
    string
> = {
    primary_owner: "Chủ sở hữu chính",
    co_owner: "Đồng sở hữu",
    authorized_manager: "Người được ủy quyền quản lý",
    legal_representative: "Người đại diện pháp luật",
    contact_person: "Người liên hệ",
};

export const HOUSE_OWNERSHIP_VERIFICATION_STATUS_LABEL: Record<
    HouseOwnershipVerificationStatus,
    string
> = {
    waiting_verification: "Chờ xác thực",
    verified: "Đã xác thực",
    rejected: "Bị từ chối",
};

export const HOUSE_OWNERSHIP_VERIFICATION_STATUS_TONE: Record<
    HouseOwnershipVerificationStatus,
    BadgeTone
> = {
    waiting_verification: "yellow",
    verified: "green",
    rejected: "red",
};

export const ORGANIZATION_REPRESENTATIVE_ROLE_LABEL: Record<
    OrganizationRepresentativeRole,
    string
> = {
    legal_representative: "Người đại diện pháp luật",
    authorized_manager: "Người được ủy quyền quản lý",
    contact_person: "Người liên hệ",
};

// Household/Business/Company dung chung bo trang thai xac thuc 5-gia-tri goc
// (khong co "needs_update" - trang thai do chi rieng cho House, xem @dts
// HouseStatus/VerificationStatus). La object doc lap voi HOUSE_STATUS_LABEL/
// _TONE (khong dung chung tham chieu) de Object.entries() o cac man danh sach
// Household/Business/Company khong bi "lot" them tuy chon needs_update khong
// bao gio khop duoc.
export const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
    unverified: "Chưa xác thực",
    pending: "Chờ duyệt",
    verified: "Đã duyệt",
    denied: "Bị từ chối",
    locked: "Bị khóa",
};
export const VERIFICATION_STATUS_TONE: Record<VerificationStatus, BadgeTone> = {
    unverified: "gray",
    pending: "yellow",
    verified: "green",
    denied: "red",
    locked: "red",
};

export const HOUSE_USAGE_TYPE_LABEL: Record<HouseUsageType, string> = {
    household: "Hộ dân",
    business: "Hộ kinh doanh",
    company: "Công ty",
};

export const BUSINESS_DOCUMENT_STATUS_LABEL: Record<
    BusinessDocumentStatus,
    string
> = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Bị từ chối, cần bổ sung",
};

export const BUSINESS_DOCUMENT_STATUS_TONE: Record<
    BusinessDocumentStatus,
    BadgeTone
> = {
    pending: "yellow",
    approved: "green",
    rejected: "red",
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
    "pccc.status_sync": "Tự động cập nhật tình trạng theo dõi (từ yêu cầu)",
};

export const SECURITY_AUDIT_ACTION_LABEL: Record<string, string> = {
    "security.create": "Tạo hồ sơ an ninh",
    "security.update": "Cập nhật thông tin",
    "security.assign": "Phân công theo dõi",
    "security.delete": "Xóa hồ sơ an ninh",
    "security.status_sync": "Tự động cập nhật tình trạng theo dõi (từ yêu cầu)",
};

export const RESIDENT_AUDIT_ACTION_LABEL: Record<string, string> = {
    "resident.create": "Tạo hồ sơ cư trú",
    "resident.update": "Cập nhật thông tin",
    "resident.delete": "Xóa hồ sơ cư trú",
};

export const REQUEST_TYPE_LABEL: Record<string, string> = {
    pccc: "PCCC",
    security: "An ninh",
    other: "Khác",
    task: "Nhiệm vụ",
};

export const REQUEST_HOUSE_ROLE_LABEL: Record<RequestHouseRole, string> = {
    house_owner: "Chủ nhà",
    household_head: "Chủ hộ",
    business_head: "Chủ hộ kinh doanh",
    company_rep: "Người đại diện công ty",
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
    pending: "Chưa xử lý",
    acknowledged: "Đã tiếp nhận",
    in_progress: "Đang xử lý",
    needs_info: "Yêu cầu bổ sung",
    awaiting_confirmation: "Chờ xác nhận",
    resolved: "Đã hoàn thành",
};

export const REQUEST_STATUS_TONE: Record<RequestStatus, BadgeTone> = {
    pending: "gray",
    acknowledged: "blue",
    in_progress: "yellow",
    needs_info: "yellow",
    awaiting_confirmation: "blue",
    resolved: "green",
};

export const REQUEST_PRIORITY_LABEL: Record<RequestPriority, string> = {
    normal: "Bình thường",
    high: "Cao",
    urgent: "Khẩn cấp",
};

export const REQUEST_PRIORITY_TONE: Record<RequestPriority, BadgeTone> = {
    normal: "gray",
    high: "yellow",
    urgent: "red",
};

export const REQUEST_AUDIT_ACTION_LABEL: Record<string, string> = {
    "request.create": "Gửi yêu cầu",
    "request.update": "Cập nhật yêu cầu",
    "request.cancel": "Hủy yêu cầu",
    "request.update_status": "Cập nhật trạng thái xử lý",
    "request.add_recipients": "Thêm người nhận",
    "request.attachment.upload": "Tải lên file đính kèm",
    "request.attachment.delete": "Xóa file đính kèm",
    request_transfer_initiated: "Đề nghị chuyển yêu cầu",
    request_transfer_accepted: "Đã chấp nhận chuyển yêu cầu",
    request_transfer_rejected: "Đã từ chối chuyển yêu cầu",
};

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
    cho_xac_nhan: "Chờ xác nhận",
    da_xac_nhan: "Đã xác nhận",
    da_check_in: "Đã check-in",
    hoan_thanh: "Hoàn thành",
    tu_choi: "Từ chối",
    da_huy: "Đã hủy",
    vang_mat: "Vắng mặt",
};

export const APPOINTMENT_STATUS_TONE: Record<AppointmentStatus, BadgeTone> = {
    cho_xac_nhan: "yellow",
    da_xac_nhan: "blue",
    da_check_in: "blue",
    hoan_thanh: "green",
    tu_choi: "red",
    da_huy: "gray",
    vang_mat: "red",
};

export const APPOINTMENT_AUDIT_ACTION_LABEL: Record<string, string> = {
    "appointment.create": "Đặt lịch hẹn",
    "appointment.confirm": "Xác nhận lịch hẹn",
    "appointment.reject": "Từ chối lịch hẹn",
    "appointment.cancel": "Hủy lịch hẹn",
    "appointment.checkin": "Check-in",
    "appointment.complete": "Hoàn thành làm việc",
    "appointment.rate": "Đánh giá lịch hẹn",
    "appointment.no_show": "Tự động đánh dấu vắng mặt",
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
    xanh: "Thấp",
    vang: "Trung bình",
    do: "Cao",
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
