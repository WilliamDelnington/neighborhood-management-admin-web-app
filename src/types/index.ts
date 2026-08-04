export type ApiResponse<T = unknown> = {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
};

export type PaginatedData<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type AppError = {
    status?: number;
    message: string;
};

// ---------------------------------------------------------------------------
// Nguoi dung / vai tro
// ---------------------------------------------------------------------------
// Vai tro gio la du lieu dong (xem RoleRecord) - Role chi con la alias string,
// khong con la union tinh liet ke het cac vai tro hop le.
export type Role = string;

export type UserStatus = "active" | "pending" | "locked";

export type User = {
    id: string;
    zaloUserId?: string;
    displayName: string;
    avatarUrl?: string;
    phone?: string;
    email?: string;
    address?: string;
    roles: Role[];
    primaryRole: Role;
    permissions: string[];
    roleLabels: Record<string, string>;
    status: UserStatus;
    householdId?: string;
    citizenId?: string;
    neighborhoodId?: string;
    assignedNeighborhoodIds: string[];
    assignedClusters: string[];
    notificationPermission: boolean;
    createdAt?: string;
    allowedComplaintCategories: NhomPhanAnh[] | null;
};

export type AssignableStaff = {
    id: string;
    displayName: string;
};

// ---------------------------------------------------------------------------
// Vai tro & phan quyen (dong, quan ly qua man hinh /roles)
// ---------------------------------------------------------------------------
export type PermissionDef = {
    key: string;
    label: string;
};

export type ModulePermissionGroup = {
    key: string;
    label: string;
    permissions: PermissionDef[];
};

export type RoleRecord = {
    _id: string;
    key: string;
    name: string;
    description?: string;
    permissions: string[];
    allowedComplaintCategories?: NhomPhanAnh[];
    system: boolean;
    active: boolean;
    sortOrder: number;
    assignedUserCount: number;
    createdAt: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Ho dan / nhan khau
// ---------------------------------------------------------------------------
export type LoaiSoHuu = "chinh_chu" | "cho_thue";
export type GioiTinh = "nam" | "nu" | "khac";
export type LoaiCuTru = "thuong_tru" | "tam_tru";

export type DocumentType = {
    _id: string;
    name: string;
    code: string;
    description?: string;
    hasIssueDate: boolean;
    hasExpiryDate: boolean;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

export type BusinessTypeDocumentRule = {
    _id?: string;
    documentTypeId: string | DocumentType;
    isRequired: boolean;
    warningBeforeDays?: number;
    // Rong = fallback ve permission "businesses.verify" khi duyet giay to nay.
    reviewerRoles: string[];
};

export type BusinessType = {
    _id: string;
    name: string;
    description?: string;
    active: boolean;
    sortOrder: number;
    requiredDocuments: BusinessTypeDocumentRule[];
    createdAt: string;
    updatedAt: string;
};

export type HouseStatus = "unverified" | "pending" | "verified" | "denied" | "locked";

// ---------------------------------------------------------------------------
// Chu so huu (nha so co the thuoc ca nhan hoac to chuc)
// ---------------------------------------------------------------------------
export type OwnerType = "user" | "organization";

export type OrganizationType = "cong_ty" | "hop_tac_xa" | "co_quan_nha_nuoc" | "khac";

export const ORGANIZATION_TYPE_LABEL: Record<OrganizationType, string> = {
    cong_ty: "Công ty",
    hop_tac_xa: "Hợp tác xã",
    co_quan_nha_nuoc: "Cơ quan nhà nước",
    khac: "Khác",
};

export type Organization = {
    _id: string;
    name: string;
    taxCode: string;
    organizationType: OrganizationType;
    representativeUserId: string | { _id: string; displayName: string; phone?: string };
    representativeRole?: string;
    phone?: string;
    email?: string;
    address?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

// Trang thai xac thuc ho kinh doanh - TINH tu ket qua duyet tung giay to bat
// buoc (xem RequiredDocumentsResult), khong con la mot hanh dong duyet/tu choi
// thu cong nhu HouseStatus. Xem businessDocumentService.recomputeBusinessStatus
// o backend.
export type BusinessStatus =
    | "unverified"
    | "pending_approval"
    | "need_supplement"
    | "verified";

export type BusinessDocumentStatus = "pending" | "approved" | "rejected";

// ownerId khong duoc backend populate (van la id tho) - khi ownerType la
// "organization", frontend tu goi fetchOrganizationById de biet
// representativeUserId (xem HouseDetailPage.tsx).
export type House = {
    _id: string;
    code: string;
    cluster: string;
    streetId?: string | Street | null;
    neighborhoodId?: string | Neighborhood | null;
    address: string;
    status: HouseStatus;
    ownerType?: OwnerType;
    ownerId?: string | { _id: string; displayName: string } | null;
    note?: string;
    residenceDeclarationNumber?: string;
    createdAt: string;
    updatedAt: string;
};

export type Neighborhood = {
    _id: string;
    name: string;
    code: string;
    sequence: number;
    active: boolean;
    address?: string;
    description?: string;
    contactPhone?: string;
    notes?: string;
    leaderUserId?: {
        _id: string;
        displayName: string;
        phone?: string;
        status: UserStatus;
    } | null;
    createdAt: string;
    updatedAt: string;
};

export type Street = {
    _id: string;
    name: string;
    code: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

export type NeighborhoodLeaderAssignment = {
    _id: string;
    neighborhoodId: string;
    leaderUserId?: { _id: string; displayName: string; phone?: string } | null;
    assignedBy?: { _id: string; displayName: string } | null;
    assignedAt: string;
    unassignedAt?: string;
    unassignedBy?: { _id: string; displayName: string } | null;
    note?: string;
};

export type Household = {
    _id: string;
    code: string;
    cluster: string;
    streetId?: string | Street | null;
    address: string;
    headOfHousehold: string;
    headOfHouseholdUserId?: string | { _id: string; displayName: string } | null;
    phone?: string;
    memberCount: number;
    ownershipType: LoaiSoHuu;
    needsSupport: boolean;
    houseId?: string | House;
    note?: string;
    createdAt: string;
    updatedAt: string;
};

export type Business = {
    _id: string;
    name: string;
    houseId: string | House | null;
    cluster: string;
    businessType?: { _id: string; name: string } | null;
    ownerName?: string;
    phone?: string;
    active: boolean;
    status: BusinessStatus;
    note?: string;
    createdAt: string;
    updatedAt: string;
};

type PopulatedFileAssetSummary = {
    _id: string;
    name: string;
    url: string;
    mimeType?: string;
    sizeBytes?: number;
};
type PopulatedActor = { _id: string; displayName: string };

export type BusinessDocument = {
    _id: string;
    businessId: string;
    documentTypeId: string | DocumentType;
    fileAssetId: string | PopulatedFileAssetSummary;
    docNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    status: BusinessDocumentStatus;
    rejectionReason?: string;
    uploadedBy: string | PopulatedActor;
    reviewedBy?: string | PopulatedActor;
    reviewedAt?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

export type RequiredDocumentItem = {
    rule: BusinessTypeDocumentRule;
    activeDocument: BusinessDocument | null;
    history: BusinessDocument[];
    missing: boolean;
    expired: boolean;
};

export type RequiredDocumentsResult = {
    business: Business;
    items: RequiredDocumentItem[];
};

export type Citizen = {
    _id: string;
    fullName: string;
    phone?: string;
    cccd?: string;
    birthDate?: string;
    gender: GioiTinh;
    relationToHead?: string;
    householdId: string | Household;
    residenceType: LoaiCuTru;
    isElderly: boolean;
    isChild: boolean;
    isDisabledOrSupportNeeded: boolean;
    isPartyMember: boolean;
    isUnionMember: boolean;
    createdAt: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Phan anh kien nghi
// ---------------------------------------------------------------------------
export type NhomPhanAnh =
    | "an_ninh_trat_tu"
    | "pccc"
    | "ve_sinh_moi_truong"
    | "ha_tang_dien_nuoc"
    | "chieu_sang"
    | "tranh_chap_dan_cu"
    | "tam_tru_nha_cho_thue"
    | "gop_y_chung"
    | "khac";

export type TrangThaiPhanAnh =
    | "moi_tiep_nhan"
    | "da_tiep_nhan"
    | "dang_xu_ly"
    | "da_chuyen_ubnd"
    | "da_xu_ly"
    | "dong";

export type Complaint = {
    _id: string;
    code: string;
    category: NhomPhanAnh;
    title: string;
    content: string;
    area?: string;
    images: string[];
    status: TrangThaiPhanAnh;
    createdByUserId:
        | string
        | { _id: string; displayName: string; phone?: string };
    assigneeId?: string | { _id: string; displayName: string };
    expectedCompletionDate?: string;
    actualCompletionDate?: string;
    escalatedToCommittee: boolean;
    internalNotes?: string;
    createdAt: string;
    updatedAt: string;
};

export type ComplaintTimelineEntry = {
    _id: string;
    complaintId: string;
    status: TrangThaiPhanAnh;
    note?: string;
    isPublic: boolean;
    actorId: string;
    createdAt: string;
};

export type ComplaintDetail = {
    complaint: Complaint;
    timeline: ComplaintTimelineEntry[];
};

// ---------------------------------------------------------------------------
// Ho tro (Mini App - Ho so ca nhan)
// ---------------------------------------------------------------------------
export type LoaiYeuCauHoTro = "bao_loi" | "gop_y";

export type TrangThaiYeuCauHoTro = "moi" | "dang_xu_ly" | "da_xu_ly" | "dong";

export type SupportTicket = {
    _id: string;
    code: string;
    type: LoaiYeuCauHoTro;
    title: string;
    content: string;
    images: string[];
    deviceInfo?: string;
    status: TrangThaiYeuCauHoTro;
    createdByUserId:
        | string
        | { _id: string; displayName: string; phone?: string };
    adminResponse?: string;
    respondedByUserId?: string | { _id: string; displayName: string };
    resolvedAt?: string;
    createdAt: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Thong bao / cuoc hop / khao sat
// ---------------------------------------------------------------------------
export type LoaiThongBao =
    | "chung"
    | "hop_dan"
    | "pccc"
    | "ve_sinh_moi_truong"
    | "an_ninh_trat_tu"
    | "khac";

export type TrangThaiThongBao = "nhap" | "da_dang";

export type Announcement = {
    _id: string;
    title: string;
    content: string;
    category: LoaiThongBao;
    status: TrangThaiThongBao;
    priority: boolean;
    pinned: boolean;
    audienceAll?: boolean;
    targetRoles?: Role[];
    targetClusters?: string[];
    publishedAt?: string;
    createdAt: string;
};

export type DangKyHop = "co" | "khong" | "uy_quyen";

export type Meeting = {
    _id: string;
    title: string;
    startTime: string;
    location: string;
    content: string;
    minutes?: string;
    attachments: string[];
    published: boolean;
    eligibleAll?: boolean;
    eligibleRoles?: Role[];
    eligibleStreetIds?: (string | { _id: string; name: string })[];
    eligibleNeighborhoodIds?: (string | { _id: string; name: string })[];
    eligibleBusinessTypeIds?: (string | { _id: string; name: string })[];
    createdAt: string;
};

export type MeetingRegistration = {
    _id: string;
    meetingId: string;
    userId: string | { _id: string; displayName: string; phone?: string };
    answer: DangKyHop;
    delegateName?: string;
    createdAt: string;
};

export type LoaiCauHoiKhaoSat =
    | "dong_y_khong_dong_y"
    | "chon_mot"
    | "chon_nhieu"
    | "y_kien_khac";

export type SurveyQuestion = {
    _id?: string;
    question: string;
    type: LoaiCauHoiKhaoSat;
    options: string[];
    required: boolean;
};

export type TrangThaiKhaoSat = "nhap" | "dang_mo" | "da_dong";

export type Survey = {
    _id: string;
    title: string;
    description?: string;
    questions: SurveyQuestion[];
    status: TrangThaiKhaoSat;
    eligibleAll?: boolean;
    eligibleRoles?: Role[];
    eligibleClusters?: string[];
    eligibleStreetIds?: (string | { _id: string; name: string })[];
    eligibleNeighborhoodIds?: (string | { _id: string; name: string })[];
    eligibleBusinessTypeIds?: (string | { _id: string; name: string })[];
    openDate?: string;
    closeDate?: string;
    createdAt: string;
};

export type SurveyResults = {
    surveyId: string;
    title: string;
    totalResponses: number;
    results: {
        questionId: string;
        question: string;
        type: LoaiCauHoiKhaoSat;
        optionCounts: Record<string, number>;
        otherTexts: string[];
    }[];
};

// ---------------------------------------------------------------------------
// PCCC / an ninh
// ---------------------------------------------------------------------------
export type MucNguyCoPccc = "xanh" | "vang" | "do";
export type MucDoAnNinh = "binh_thuong" | "can_theo_doi" | "khan_cap";
export type TinhTrangTheoDoiAnNinh =
    | "binh_thuong"
    | "dang_theo_doi"
    | "da_bao_cong_an"
    | "da_ket_thuc";
export type TinhTrangTheoDoiPccc =
    | "chua_khac_phuc"
    | "dang_khac_phuc"
    | "da_khac_phuc";

type PopulatedHouse = {
    _id: string;
    code: string;
    address: string;
    cluster: string;
    residenceDeclarationNumber?: string;
};
type PopulatedInspector = { _id: string; displayName: string };

export type PcccCheck = {
    _id: string;
    houseId: string | PopulatedHouse | null;
    hasFireExtinguisher: boolean;
    hasEmergencyExit: boolean;
    hasIndoorEvCharging: boolean;
    hasGasStoveOrStorageOrBusiness: boolean;
    isCrowdedRental: boolean;
    riskLevel: MucNguyCoPccc;
    remediationNeeded?: string;
    inspectionDate: string;
    inspectorId?: string | PopulatedInspector;
    followUpStatus?: TinhTrangTheoDoiPccc;
    deadline?: string;
    assigneeId?: string | PopulatedInspector | null;
    createdAt: string;
    updatedAt: string;
};

export type PcccAttachment = {
    _id: string;
    name: string;
    url: string;
    mimeType?: string;
    sizeBytes?: number;
    uploadedBy?: string | { _id: string; displayName: string };
    createdAt: string;
};

export type SecurityRecord = {
    _id: string;
    houseId: string | PopulatedHouse | null;
    ownershipType: LoaiSoHuu;
    renterCount?: number;
    hasCamera: boolean;
    hasSecurityComplaint: boolean;
    level: MucDoAnNinh;
    reportedToPolice: boolean;
    monitoringStatus: TinhTrangTheoDoiAnNinh;
    note?: string;
    inspectionDate?: string;
    createdBy?: string | PopulatedInspector;
    assigneeId?: string | PopulatedInspector | null;
    updatedBy?: string | PopulatedInspector;
    createdAt: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Tai chinh
// ---------------------------------------------------------------------------
export type LoaiGiaoDichTaiChinh = "thu" | "chi";
export type TrangThaiGiaoDich = "nhap" | "da_duyet" | "da_huy";

export type FinanceTransaction = {
    _id: string;
    type: LoaiGiaoDichTaiChinh;
    partyName: string;
    amount: number;
    transactionDate: string;
    content: string;
    status: TrangThaiGiaoDich;
    createdAt: string;
    updatedAt: string;
};

export type FinanceSummary = {
    totalIncome: number;
    totalExpense: number;
    net: number;
};

// ---------------------------------------------------------------------------
// Bieu mau / tep tin
// ---------------------------------------------------------------------------
export type FileAssetCategory = "form" | "attachment" | "minutes" | "other";

export type FileAsset = {
    _id: string;
    name: string;
    description?: string;
    url: string;
    mimeType?: string;
    sizeBytes?: number;
    category: FileAssetCategory;
    relatedModel?: string;
    relatedId?: string;
    isPublic: boolean;
    targetRoles: Role[];
    audienceAll: boolean;
    uploadedBy: string | { _id: string; displayName: string };
    createdAt: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Cai dat he thong
// ---------------------------------------------------------------------------
export type Setting = {
    _id: string;
    key: string;
    value: unknown;
    description?: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Bao cao tong quan (dashboard)
// ---------------------------------------------------------------------------
export type DashboardTask = { label: string; count: number; link?: string };

export type DashboardSummary = {
    totalHouseholds: number;
    totalCitizens: number;
    rentalHouseholds: number;
    householdsNeedingSupport: number;
    scopedToCluster: boolean;
    newComplaints: number;
    inProgressComplaints: number;
    highRiskPcccCount: number;
    upcomingMeetings: {
        id: string;
        title: string;
        startTime: string;
        location: string;
    }[];
    financeSummary: {
        monthIncome: number;
        monthExpense: number;
        monthNet: number;
        allTimeNet: number;
    };
    surveyParticipation: {
        openSurveys: number;
        totalResponses: number;
    };
    taskList: DashboardTask[];
};

// ---------------------------------------------------------------------------
// Nhat ky he thong (audit log)
// ---------------------------------------------------------------------------
export type AuditLogRecord = {
    _id: string;
    actorId?: string | { _id: string; displayName: string; phone?: string; email?: string } | null;
    action: string;
    targetModel?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    createdAt: string;
};

// ---------------------------------------------------------------------------
// Thong bao (chuong thong bao tren admin)
// ---------------------------------------------------------------------------
export type NotificationItem = {
    _id: string;
    title: string;
    body: string;
    type: string;
    relatedModel?: string;
    relatedId?: string;
    createdAt: string;
};

export type NotificationDeliveryItem = {
    deliveryId: string;
    notification: NotificationItem | null;
    readAt?: string | null;
    sentAt?: string;
};

// ---------------------------------------------------------------------------
// Import / export
// ---------------------------------------------------------------------------
export type ImportJobType = "household" | "citizen" | "party_member";
export type ImportJobStatus = "previewing" | "validated" | "committed" | "failed";

export type ImportJob = {
    _id: string;
    type: ImportJobType;
    status: ImportJobStatus;
    fileName: string;
    totalRows: number;
    validRows: number;
    rowErrors: { row: number; message: string }[];
    committedCount?: number;
    createdAt: string;
};
