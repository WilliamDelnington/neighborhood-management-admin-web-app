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
export type IdentityProvider =
    | "phone_temporary"
    | "manual_declaration"
    | "vneid"
    | "national_population_db";
export type IdentityVerificationStatus =
    | "unverified"
    | "pending"
    | "verified"
    | "failed"
    | "revoked";

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
    identityProvider: IdentityProvider;
    identityVerificationStatus: IdentityVerificationStatus;
    identityVerifiedAt?: string;
    householdId?: string;
    citizenId?: string;
    neighborhoodId?: string;
    assignedNeighborhoodIds: string[];
    assignedClusters: string[];
    // Pham vi phuong/xa cho people_committee_official (Can bo UBND) - xem
    // ghi chu o User.ts (backend).
    provinceCode?: number;
    provinceName?: string;
    wardCode?: number;
    wardName?: string;
    // Chi co trong response cua GET /api/wards/managers - vai tro cap Phuong cu
    // the trong `roles` cua user nay (xem ghi chu o route backend).
    wardRoleKey?: string;
    notificationPermission: boolean;
    createdAt?: string;
    allowedComplaintCategories: NhomPhanAnh[] | null;
};

export type AssignableStaff = {
    id: string;
    displayName: string;
    // Optional: mot so noi dung chung shape nay chi de luu id+displayName
    // (vd AppointmentService.assignedOfficerUserIds), khong goi qua
    // listAssignableStaff nen khong co roles.
    roles?: Role[];
};

export type ResidentSearchResult = {
    id: string;
    displayName: string;
    phone?: string;
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

// Pham vi du lieu (data range) vai tro nay quan ly - xem Role.ts o backend
// (Config-Driven Account Scope System). ALL = khong gioi han (admin).
// WARD/NEIGHBORHOOD = pham vi dia ly, gan qua ScopeAssignment (scopeMechanism
// ="ASSIGNED"). HOUSE/HOUSEHOLD/BUSINESS/COMPANY = pham vi theo thuc the so
// huu (scopeMechanism="OWNED"), suy tu truong so huu san co tren du lieu,
// khong can ScopeAssignment.
export const ACCESS_SCOPE_TIERS = [
    "ALL",
    "WARD",
    "NEIGHBORHOOD",
    "HOUSE",
    "HOUSEHOLD",
    "BUSINESS",
    "COMPANY",
] as const;
export type AccessScopeTier = (typeof ACCESS_SCOPE_TIERS)[number];
export type ScopeAssignmentMechanism = "ASSIGNED" | "OWNED";

// Danh muc so lieu dashboard CO DINH (khac NhomPhanAnh/RequestType - khong co
// collection quan tri duoc tuong ung) - xem Role.dashboardMetrics va
// dashboardService.ts (backend) de biet gia tri nay duoc dung the nao.
export const DASHBOARD_METRIC_KEYS = [
    "neighborhoods_count",
    "houses_count",
    "owners_count",
    "business_units_count",
    "complaints_summary",
    "women_count",
    "elderly_count",
    "children_count",
    "veterans_count",
    "martyrs_count",
    "poor_households_count",
    "unemployed_count",
    "military_age_men_count",
    "undeclared_residency_count",
    "disease_monitored_households_count",
    "registered_houses_count",
    "school_age_children_count",
] as const;
export type DashboardMetricKey = (typeof DASHBOARD_METRIC_KEYS)[number];

export type RoleRecord = {
    _id: string;
    key: string;
    name: string;
    description?: string;
    permissions: string[];
    allowedComplaintCategories?: NhomPhanAnh[];
    allowedRequestTypes?: RequestType[];
    // Cung quy uoc voi 2 truong tren: undefined = khong gioi han (giu nguyen
    // bo so lieu dashboard co dinh theo audience nhu truoc day). Khac 2 truong
    // tren: danh muc CO DINH (DASHBOARD_METRIC_KEYS), khong phai danh muc quan
    // tri duoc rieng.
    dashboardMetrics?: DashboardMetricKey[];
    // Vai tro duoc phep chon khi "Tạo tài khoản" (POST /api/users) - KHAC 2
    // truong tren, khong dung quy uoc undefined = khong gioi han (mac dinh
    // rong la an toan vi day la quyen nhay cam) - xem Role.ts o backend.
    allowedCreatableRoles: string[];
    scopeType: AccessScopeTier;
    scopeMechanism?: ScopeAssignmentMechanism;
    // Chi co y nghia khi scopeMechanism="ASSIGNED". 1 = chi 1 nguoi duoc active
    // tai 1 pham vi cung luc (vd Bi thu/To truong). null/undefined = khong
    // gioi han so nguoi active tai cung 1 pham vi (vd PCO/To pho/Cong tac vien).
    maxActivePerScope?: number | null;
    // Truc doc lap: gioi han so pham vi MA MOT NGUOI duoc active cung luc voi
    // vai tro nay (vd To pho: 1 nguoi chi duoc active o DUY NHAT 1 To dan pho).
    maxActiveScopesPerUser?: number | null;
    // Chi co y nghia voi vai tro dang "Cong tac vien" (scopeType=NEIGHBORHOOD,
    // maxActivePerScope=null): cac kieu pham vi con duoc phep chon khi gan.
    subScopeKinds?: NeighborhoodCollaboratorScope[];
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
export type DiseaseStatus = "none" | "recorded" | "monitoring" | "resolved";

export type DocumentType = {
    _id: string;
    name: string;
    code: string;
    description?: string;
    hasIssueDate: boolean;
    hasExpiryDate: boolean;
    active: boolean;
    // Tep mau minh hoa (khong bat buoc) - giup chu nha/can bo hinh dung ro
    // hon giay to nay ngoai ten/mo ta, xem documentTypeApi.ts.
    sampleFileUrl?: string;
    sampleFileName?: string;
    createdAt: string;
    updatedAt: string;
};

// Dung chung cho BusinessType.requiredDocuments (o cap loai hinh) va
// RequiredDocumentSettings cua House/Household/Company (ap dung chung cho ca
// category, khong phai tung ban ghi rieng - xem backend).
// reviewerRoles rong = fallback ve permission ".verify" tuong ung khi duyet.
export type RequiredDocumentRule = {
    _id?: string;
    documentTypeId: string | DocumentType;
    isRequired: boolean;
    warningBeforeDays?: number;
    reviewerRoles: string[];
};

export type BusinessTypeDocumentRule = RequiredDocumentRule;

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

// Loai hinh doanh nghiep (phap ly) - CHI danh cho Company, khac BusinessType
// (nganh nghe kinh doanh, dung chung voi Business) - khong co requiredDocuments
// rieng, xem ghi chu tren models/Company.ts o backend.
export type CompanyType = {
    _id: string;
    name: string;
    description?: string;
    active: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
};

export type HouseStatus =
    | "unverified"
    | "pending"
    | "verified"
    | "denied"
    | "needs_update"
    | "locked";

// Trang thai xac thuc dung chung cho House/Household/Business - ba thuc the
// nay co trang thai xac thuc DOC LAP voi nhau (chi phu thuoc nhau mot chieu
// qua cascade khi House chuyen sang "verified"), nhung cung dung chung mot bo
// 5 gia tri nhu HouseStatus. Household/Business dung alias nay cho truong
// `status` cua chung thay vi mot enum rieng.
// Doc lap voi HouseStatus (khong con la alias) - Household/Business/Company
// dung chung enum xac thuc 5 trang thai goc; "needs_update" chi ap dung rieng
// cho House (xem HouseStatus o tren).
export type VerificationStatus =
    | "unverified"
    | "pending"
    | "verified"
    | "denied"
    | "locked";

// Tinh trang cong trinh thuc te - doc lap voi HouseStatus (trang thai ho
// so/xac thuc). Optional: nha chua duoc khai se khong co gia tri nay.
export type HousePhysicalStatus =
    | "not_handed_over"
    | "not_renovated"
    | "under_construction"
    | "under_renovation"
    | "completed"
    | "in_use"
    | "vacant"
    | "damaged";

export type HouseGisSource =
    | "unavailable"
    | "device_gps"
    | "manual"
    | "external_gis"
    | "address_lookup";

// ---------------------------------------------------------------------------
// Chu so huu (nha so co the thuoc ca nhan hoac to chuc)
// ---------------------------------------------------------------------------
export type OwnerType = "user" | "organization" | "person";

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
    taxCode?: string;
    organizationType: OrganizationType;
    // Optional: to chuc duoc khai bao luc tao nha so co the chua co nguoi dai
    // dien nao dang nhap duoc (xem HouseForm.tsx - checkbox "Tao tai khoan
    // nguoi dai dien").
    representativeUserId?: string | { _id: string; displayName: string; phone?: string };
    representativeRole?: string;
    phone?: string;
    email?: string;
    address?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

// Danh tinh duoc khai bao (ten/sdt/email) cho chu nha/nguoi dai dien to chuc
// KHONG tao tai khoan dang nhap - xem OwnerType="person" o HouseOwnership.
export type Person = {
    _id: string;
    fullName: string;
    phone?: string;
    email?: string;
    createdAt: string;
    updatedAt: string;
};

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
    // Phuong/xa va tinh/thanh pho - hien thi dia chi day du, khong lien quan
    // RBAC/pham vi (khac cluster/neighborhoodId) - xem administrativeDivisionApi.ts.
    provinceCode?: number;
    provinceName?: string;
    wardCode?: number;
    wardName?: string;
    status: HouseStatus;
    physicalStatus?: HousePhysicalStatus;
    // Muc dich su dung nha do chu nha tu khai bao (co the nhieu gia tri dong
    // thoi) - xem models/HouseRecord.ts o backend. Doc lap voi HouseUsageUnit
    // (lop gan don vi cho tung Household/Business/Company DA TON TAI) - truong
    // nay chi la "y dinh" khai bao, dung de nhac nho khai bao thieu (xem
    // HouseDetailPage.tsx).
    usageTypes: HouseUsageType[];
    otherUsageNote?: string;
    // Cache cua quan he primary_owner dang active trong HouseOwnership (xem
    // ben duoi) - mot nha co the co nhieu chu so huu/nguoi quan ly dong thoi,
    // hai truong nay chi phan anh chu so huu CHINH hien tai.
    ownerType?: OwnerType;
    ownerId?: string | { _id: string; displayName: string } | null;
    note?: string;
    approvalNote?: string;
    denialReason?: string;
    needsUpdateNote?: string;
    residenceDeclarationNumber?: string;
    gisLatitude?: number | null;
    gisLongitude?: number | null;
    gisAccuracyMeters?: number | null;
    gisSource: HouseGisSource;
    gisCapturedAt?: string | null;
    location?: { type: "Point"; coordinates: [number, number] };
    createdAt: string;
    updatedAt: string;
};

export type HouseOwnershipRelationshipType =
    | "primary_owner"
    | "co_owner"
    | "authorized_manager"
    | "legal_representative"
    | "contact_person";

export type HouseOwnershipVerificationStatus =
    | "waiting_verification"
    | "verified"
    | "rejected";

// ownerId luon la id tho (khong duoc backend populate, vi la ref da hinh User/
// Organization) - ownerDisplayName/ownerPhone duoc backend tu resolve rieng
// (xem houseOwnershipService.listHouseOwnerships) de khong phai goi them API.
export type HouseOwnership = {
    _id: string;
    houseId: string;
    ownerType: OwnerType;
    ownerId: string;
    ownerDisplayName?: string;
    ownerPhone?: string;
    relationshipType: HouseOwnershipRelationshipType;
    startDate: string;
    endDate?: string | null;
    active: boolean;
    verificationStatus: HouseOwnershipVerificationStatus;
    reason?: string;
    createdAt: string;
    updatedAt: string;
};

export type OrganizationRepresentativeRole =
    | "legal_representative"
    | "authorized_manager"
    | "contact_person";

// userId luon la User (khong da hinh nhu HouseOwnership.ownerId), nen backend
// populate truc tiep duoc thanh object khi tra ve.
export type OrganizationRepresentative = {
    _id: string;
    organizationId: string;
    userId: string | { _id: string; displayName: string; phone?: string };
    role: OrganizationRepresentativeRole;
    title?: string;
    startDate: string;
    endDate?: string | null;
    active: boolean;
    verificationStatus: HouseOwnershipVerificationStatus;
    reason?: string;
    createdAt: string;
    updatedAt: string;
};

export type Neighborhood = {
    _id: string;
    name: string;
    code: string;
    sequence: number;
    active: boolean;
    status: NeighborhoodStatus;
    effectiveFrom?: string;
    effectiveTo?: string;
    // Bat buoc luc tao (xem NeighborhoodForm.tsx) nhung optional o day vi to
    // dan pho tao truoc khi co truong nay se khong co gia tri (khong backfill).
    provinceCode?: number;
    provinceName?: string;
    wardCode?: number;
    wardName?: string;
    address?: string;
    description?: string;
    contactPhone?: string;
    notes?: string;
    streetIds?: Street[];
    alleyDescriptions?: string[];
    boundaryType?: "NONE" | "DOCUMENT" | "GEOJSON";
    geometry?: {
        type: "Polygon" | "MultiPolygon";
        coordinates: unknown[];
    };
    leaderUserId?: {
        _id: string;
        displayName: string;
        phone?: string;
        status: UserStatus;
    } | null;
    houseCount: number;
    coleaders?: Array<{
        _id: string;
        displayName: string;
        phone?: string;
        status?: UserStatus;
    }>;
    attachmentCount?: number;
    createdAt: string;
    updatedAt: string;
};

export type NeighborhoodStatus = "ACTIVE" | "INACTIVE" | "MERGED" | "CLOSED";

export type NeighborhoodHistory = {
    _id: string;
    neighborhoodId: string;
    action: string;
    actorId?: { _id: string; displayName: string } | null;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    createdAt: string;
};

export type NeighborhoodCollaboratorScope =
    | "WHOLE_NEIGHBORHOOD"
    | "STREET"
    | "HOUSE_GROUP"
    | "CAMPAIGN";

// Backend luu tren ScopeAssignment (roleKey="neighborhood_collaborator") - xem
// models/ScopeAssignment.ts o backend. scopeId/userId/assignedAt/subScope thay
// the neighborhoodId/collaboratorUserId/startAt/(scopeType+streetId+houseIds+
// campaignId phang) cua model NeighborhoodCollaboratorAssignment cu.
export type NeighborhoodCollaboratorAssignment = {
    _id: string;
    scopeId: string;
    userId?: {
        _id: string;
        displayName: string;
        phone?: string;
        status?: UserStatus;
    } | null;
    subScope: {
        kind: NeighborhoodCollaboratorScope;
        streetId?: { _id: string; name: string; code: string } | null;
        houseIds: Array<{ _id: string; code: string; address: string }>;
        campaignId?: {
            _id: string;
            name: string;
            status: InspectionCampaignStatus;
            dueAt: string;
        } | null;
    };
    assignedAt: string;
    endAt?: string;
    assignedBy?: { _id: string; displayName: string } | null;
    note?: string;
};

export type Street = {
    _id: string;
    name: string;
    code: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

// Du lieu don vi hanh chinh cong khai (tinh/thanh pho, phuong/xa) tu
// https://provinces.open-api.vn - khong phai entity quan ly boi backend, chi
// proxy/cache lai (xem administrativeDivisionApi.ts). Shape khop nguyen voi
// API ben ngoai, khong doi ten field.
export type Province = {
    name: string;
    code: number;
    division_type: string;
    codename: string;
    phone_code?: number;
};

export type Ward = {
    name: string;
    code: number;
    division_type: string;
    codename: string;
    province_code: number;
};

// Backend luu tren ScopeAssignment (roleKey="neighborhood_leader") - scopeId/
// userId thay the neighborhoodId/leaderUserId cua model NeighborhoodLeaderAssignment cu.
export type NeighborhoodLeaderAssignment = {
    _id: string;
    scopeId: string;
    userId?: { _id: string; displayName: string; phone?: string } | null;
    assignedBy?: { _id: string; displayName: string } | null;
    assignedAt: string;
    unassignedAt?: string;
    unassignedBy?: { _id: string; displayName: string } | null;
    note?: string;
};

// Backend luu tren ScopeAssignment (roleKey="neighborhood_coleader") - scopeId/
// userId thay the neighborhoodId/coleaderUserId cua model NeighborhoodColeaderAssignment cu.
export type NeighborhoodColeaderAssignment = {
    _id: string;
    scopeId: string;
    userId?: { _id: string; displayName: string; phone?: string } | null;
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
    isNearPoor: boolean;
    isMartyrFamilyHousehold: boolean;
    isLonelyElderly: boolean;
    // Tu tinh (backend tu dong dong bo tu Citizen cua ho dan) - chi doc.
    hasDisabledChild: boolean;
    hasDisabledPerson: boolean;
    diseaseStatus: DiseaseStatus;
    diseaseName?: string;
    houseId?: string | House;
    status: VerificationStatus;
    approvalNote?: string;
    denialReason?: string;
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
    // Khong bat buoc - khong phai ho kinh doanh nao cung da dang ky ma so
    // thue (xem models/Business.ts o backend).
    taxCode?: string;
    representativeUserId?: { _id: string; displayName: string; phone?: string } | string | null;
    phone?: string;
    active: boolean;
    status: VerificationStatus;
    approvalNote?: string;
    denialReason?: string;
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

// Mirror cua Business nhung khong co quy trinh giay to rieng (khong co
// CompanyDocument) - xem models/Company.ts o backend.
export type Company = {
    _id: string;
    name: string;
    houseId: string | House | null;
    cluster: string;
    ownerName?: string;
    // Bat buoc o Company (khac Business) - xem models/Company.ts o backend.
    taxCode: string;
    representativeUserId?: { _id: string; displayName: string; phone?: string } | string | null;
    // Lien ket tuy chon toi mot Organization co san (khong bat buoc) - xem
    // ghi chu tren models/Company.ts o backend.
    organizationId?: { _id: string; name: string } | string | null;
    // Nhieu loai hinh kinh doanh cung luc (khac Business.businessType - mot
    // gia tri duy nhat) - xem ghi chu tren models/Company.ts o backend.
    businessTypeIds?: ({ _id: string; name: string } | string)[];
    // Loai hinh doanh nghiep (phap ly) - mot gia tri duy nhat, khac
    // businessTypeIds - xem ghi chu tren models/Company.ts o backend.
    companyTypeId?: { _id: string; name: string } | string | null;
    phone?: string;
    active: boolean;
    status: VerificationStatus;
    approvalNote?: string;
    denialReason?: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
};

export type HouseUsageType = "household" | "business" | "company";

// Lop bo sung ghi nhan mot nha so duoc chia thanh nhieu don vi su dung (vd
// tang/phong) cho Household/Business/Company - KHONG thay the houseId truc
// tiep tren ba thuc the do, xem models/HouseUsageUnit.ts o backend. Chi dung
// DUNG MOT trong ba truong tham chieu, khop voi usageType.
export type HouseUsageUnit = {
    _id: string;
    houseId: string | House;
    unitLabel: string;
    usageType: HouseUsageType;
    householdId?: string | Household | null;
    businessId?: string | Business | null;
    companyId?: string | Company | null;
    note?: string;
    createdAt: string;
    updatedAt: string;
};

// Dung chung cho BusinessDocument/HouseDocument/HouseholdDocument/
// CompanyDocument - cac model backend deu cung mot hinh dang, chi khac ten
// truong tham chieu ve entity cha (businessId/houseId/...), truong ma khong
// component/service phia frontend nao can doc truc tiep.
export type RequiredDocumentRecord = {
    _id: string;
    documentTypeId: string | DocumentType;
    fileAssetId: string | PopulatedFileAssetSummary;
    docNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    status: BusinessDocumentStatus;
    rejectionReason?: string;
    approvalNote?: string;
    uploadedBy: string | PopulatedActor;
    reviewedBy?: string | PopulatedActor;
    reviewedAt?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

export type BusinessDocument = RequiredDocumentRecord & { businessId: string };

export type RequiredDocumentItem = {
    rule: RequiredDocumentRule;
    activeDocument: RequiredDocumentRecord | null;
    history: RequiredDocumentRecord[];
    missing: boolean;
    expired: boolean;
};

export type RequiredDocumentsResult = {
    business: Business;
    items: RequiredDocumentItem[];
};

export type EntityRequiredDocumentsResult = {
    entity: unknown;
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
    occupation?: string;
    householdId: string | Household;
    residenceType: LoaiCuTru;
    temporaryResidenceStartsAt?: string;
    temporaryResidenceExpiresAt?: string;
    isResidencyDeclared: boolean;
    isUnemployed: boolean;
    isElderly: boolean;
    isChild: boolean;
    isDisabledOrSupportNeeded: boolean;
    isDisabledChild: boolean;
    isPartyMember: boolean;
    isUnionMember: boolean;
    isMartyr: boolean;
    isMartyrFamily: boolean;
    isVeteran: boolean;
    isOtherSpecial: boolean;
    otherSpecialLabel?: string;
    createdAt: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Phan anh kien nghi
// ---------------------------------------------------------------------------
// Truoc la mot union co dinh (danh sach 10 nhom cu) - nay category la key cua
// mot ComplaintTypeDefinition quan tri duoc qua man Loai phan anh, cung quy
// uoc voi RequestType.
export type NhomPhanAnh = string;

export type TrangThaiPhanAnh =
    | "moi_tiep_nhan"
    | "da_tiep_nhan"
    | "dang_xu_ly"
    | "da_chuyen_ubnd"
    | "da_xu_ly"
    | "hoan_thanh"
    | "dong"
    | "can_bo_sung";

export type ComplaintTimelineAction =
    | "status_update"
    | "edited"
    | "reevaluation_request";

export type Complaint = {
    _id: string;
    code: string;
    category: NhomPhanAnh;
    title: string;
    content: string;
    area?: string;
    status: TrangThaiPhanAnh;
    neighborhoodId?: string | { _id: string; name: string; code?: string };
    wardCode?: number;
    targetHouseId?: string | { _id: string; code: string; address?: string };
    createdByUserId:
        | string
        | { _id: string; displayName: string; phone?: string };
    assigneeId?: string | { _id: string; displayName: string };
    expectedCompletionDate?: string;
    actualCompletionDate?: string;
    escalatedToCommittee: boolean;
    internalNotes?: string;
    rating?: number;
    ratingNote?: string;
    createdAt: string;
    updatedAt: string;
    // Chi co tren response chi tiet (getComplaintDetailForOwnerOrStaff), va
    // chi tinh cho staff - xem canReceiveOrChooseAssignee o backend
    // complaintService.ts. False/undefined o cac response khac (vd list).
    canReceiveOrChooseAssignee?: boolean;
};

export type ComplaintTypeDefinition = {
    _id?: string;
    key: string;
    name: string;
    description?: string;
    // Thu tu mang the hien uu tien dieu huong nguoi nhan (xem
    // resolveComplaintTypeRecipientIds trong backend complaintService.ts).
    allowedReceiverRoles: string[];
    isBuiltIn?: boolean;
    active?: boolean;
    wardCode?: number;
    wardName?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type ComplaintTimelineEntry = {
    _id: string;
    complaintId: string;
    status: TrangThaiPhanAnh;
    action: ComplaintTimelineAction;
    note?: string;
    patch?: Record<string, unknown>;
    previousSnapshot?: Record<string, unknown>;
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
export type LoaiYeuCauHoTro = "bao_loi" | "gop_y" | "ho_tro_ho_dan";

export type TrangThaiYeuCauHoTro =
    | "moi"
    | "dang_xu_ly"
    | "can_bo_sung"
    | "da_xu_ly"
    | "dong";

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
// Yeu cau dat lai mat khau (public, khong dang nhap)
// ---------------------------------------------------------------------------
export type TrangThaiYeuCauDatLaiMatKhau = "moi" | "da_xu_ly" | "dong";

export type PasswordResetRequest = {
    _id: string;
    phone: string;
    note?: string;
    status: TrangThaiYeuCauDatLaiMatKhau;
    matchedUser?: {
        _id: string;
        displayName: string;
        roles: Role[];
    };
    resolvedByUserId?: string | { _id: string; displayName: string };
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

export type AnnouncementAttachment = {
    _id: string;
    name: string;
    url: string;
    mimeType?: string;
    sizeBytes?: number;
    uploadedBy?: string | { _id: string; displayName: string };
    createdAt: string;
};

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
    targetUserIds?: string[];
    targetNeighborhoodIds?: string[];
    isUrgent?: boolean;
    publishedAt?: string;
    createdAt: string;
};

export type LoaiTinTuc = "chung" | "hoat_dong" | "an_ninh_trat_tu" | "khac";

export type TrangThaiTinTuc = "nhap" | "da_dang";

export type News = {
    _id: string;
    title: string;
    content: string;
    category: LoaiTinTuc;
    status: TrangThaiTinTuc;
    pinned: boolean;
    coverImageUrl?: string;
    images: string[];
    // Chua chac chan backend co tra ve truong nay cho moi ban ghi cu - khai
    // bao optional de UI an di neu thieu thay vi loi (xem NewsListPage).
    createdBy?: string | { _id: string; displayName: string };
    publishedAt?: string;
    createdAt: string;
};

export type ChangeRequestTargetModel = "HouseRecord" | "HouseOwnership" | "User";
export type ChangeRequestType = "update" | "unlink" | "transfer_neighborhood" | "data_discrepancy";
export type ChangeRequestStatus = "pending" | "approved" | "rejected" | "cancelled";
// "data_discrepancy" can dung 2 vong duyet (To dan pho xac nhan truoc, roi
// Phuong xac nhan cuoi) thay vi mot vong nhu 3 loai con lai - xem
// changeRequestService.ts (decideChangeRequest) o backend.
export type ChangeRequestReviewStage = "neighborhood_review" | "ward_review";
export type ChangeRequestStageDecision = {
    stage: ChangeRequestReviewStage;
    decidedBy: string | { _id: string; displayName: string };
    decidedAt: string;
    outcome: string;
    note?: string;
};

export type ChangeRequest = {
    _id: string;
    targetModel: ChangeRequestTargetModel;
    targetId: string;
    requestedBy: string | { _id: string; displayName: string; phone?: string };
    changeType: ChangeRequestType;
    patch?: Record<string, unknown>;
    previousSnapshot?: Record<string, unknown>;
    reason?: string;
    status: ChangeRequestStatus;
    reviewStage?: ChangeRequestReviewStage;
    stageDecisions?: ChangeRequestStageDecision[];
    decidedBy?: string | { _id: string; displayName: string };
    decidedAt?: string;
    decisionNote?: string;
    createdAt: string;
};

export type CorrespondenceType = {
    _id: string;
    name: string;
    code: string;
    description?: string;
    allowedSenderRoles: Role[];
    allowedReceiverRoles: Role[];
    requireDocumentNumber: boolean;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

export type CorrespondenceStatus = "nhap" | "da_gui";

export type Correspondence = {
    _id: string;
    correspondenceTypeId: string | Pick<CorrespondenceType, "_id" | "name" | "code">;
    documentNumber?: string;
    title: string;
    content: string;
    issuedAt: string;
    status: CorrespondenceStatus;
    isUrgent: boolean;
    senderId: string;
    targetNeighborhoodIds: string[];
    targetUserIds: string[];
    sentAt?: string;
    createdAt: string;
    // Chi co gia tri o tab "Đã nhận" (xem correspondenceService.listCorrespondences) -
    // van ban con thong bao chua doc doi voi nguoi dang dang nhap.
    isUnread?: boolean;
};

export type CorrespondenceReply = {
    _id: string;
    correspondenceId: string;
    content: string;
    actorId: { _id: string; displayName: string; roles: Role[] } | string;
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
    resultSummary?: string;
    createdBy?: string | { _id: string; displayName: string };
    coEditorUserIds?: (string | { _id: string; displayName: string })[];
    createdAt: string;
    // Nguoi dang dang nhap da gui cau tra loi khao sat nay chua (xem
    // surveyService.listSurveys) - dung de hien "Đã trả lời"/"Chưa trả lời"
    // trong SurveyListPage.tsx.
    hasResponded?: boolean;
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

export type SurveyIndividualResponse = {
    responseId: string;
    userId: string;
    displayName: string;
    phone?: string;
    submittedAt: string;
    answers: {
        questionId: string;
        selectedOptions: string[];
        otherText?: string;
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
    note?: string;
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

export type ResidentRecord = {
    _id: string;
    houseId: string | PopulatedHouse | null;
    ownershipType: LoaiSoHuu;
    renterCount?: number;
    inspectionDate?: string;
    createdBy?: string | PopulatedInspector;
    updatedBy?: string | PopulatedInspector;
    createdAt: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Yeu cau cong viec (Request) - thay the cac luong "giao viec" rieng le cua
// PCCC/An ninh. Mo rong duoc cho cac loai yeu cau khac sau nay chi bang cach
// them gia tri vao REQUEST_TYPES.
// ---------------------------------------------------------------------------
export const REQUEST_TYPES = ["pccc", "security", "other", "task"] as const;
export type RequestType = string;

export type RequestFormField = {
    key: string;
    label: string;
    type:
        | "text"
        | "long_text"
        | "number"
        | "date"
        | "boolean"
        | "single_select"
        | "multi_select";
    required: boolean;
    options: string[];
    classification: "internal" | "personal" | "sensitive";
};

export type RequestTypeDefinition = {
    _id?: string;
    key: string;
    name: string;
    description?: string;
    builtIn?: boolean;
    fields: RequestFormField[];
    allowedSenderRoles?: string[];
    allowedReceiverRoles?: string[];
    dataEntryMode: "sender" | "recipient";
    version: number;
    active?: boolean;
    wardCode?: number;
    wardName?: string;
    createdAt?: string;
    updatedAt?: string;
};

export const REQUEST_HOUSE_ROLES = [
    "house_owner",
    "household_head",
    "business_head",
    "company_rep",
] as const;
export type RequestHouseRole = typeof REQUEST_HOUSE_ROLES[number];

export const REQUEST_STATUSES = [
    "pending",
    "acknowledged",
    "in_progress",
    "needs_info",
    "awaiting_confirmation",
    "resolved",
] as const;
export type RequestStatus = typeof REQUEST_STATUSES[number];

export const REQUEST_PRIORITIES = ["normal", "high", "urgent"] as const;
export type RequestPriority = typeof REQUEST_PRIORITIES[number];

export type RequestRecipientItem = {
    _id: string;
    userId: string;
    displayName: string;
    status: RequestStatus;
    note?: string;
    respondedAt?: string;
    resolvedAt?: string;
    isOverdue: boolean;
    // Chuyen tiep yeu cau - chi co gia tri khi dang co de nghi chuyen dang cho
    // xu ly tren chinh nguoi nhan nay. Xem RequestDetailSheet.tsx.
    transferStatus?: "pending";
    transferToUserId?: string;
    transferToDisplayName?: string;
    transferReason?: string;
    transferInitiatedAt?: string;
};

export type RequestAttachment = {
    _id: string;
    name: string;
    url: string;
    mimeType?: string;
    sizeBytes?: number;
    uploadedBy?: string | { _id: string; displayName: string };
    createdAt: string;
};

export type RequestItem = {
    _id: string;
    type: RequestType;
    title: string;
    description?: string;
    note?: string;
    priority: RequestPriority;
    relatedModel?: string;
    relatedId?: string;
    houseId?: string | PopulatedHouse | null;
    dueDate?: string;
    targetRoles: string[];
    recipients: RequestRecipientItem[];
    typeDefinitionId?: string;
    formSchemaVersion?: number;
    formDefinitionSnapshot?: {
        name: string;
        dataEntryMode: "sender" | "recipient";
        fields: RequestFormField[];
    };
    formData?: Record<string, unknown>;
    formDataUpdatedAt?: string;
    createdBy?: string | PopulatedInspector;
    createdAt: string;
    updatedAt: string;
};

export type MyRequestItem = {
    _id: string;
    requestId: string;
    type: RequestType;
    title: string;
    description?: string;
    formDefinitionSnapshot?: {
        name: string;
        dataEntryMode: "sender" | "recipient";
        fields: RequestFormField[];
    };
    formSchemaVersion?: number;
    formData?: Record<string, unknown>;
    priority: RequestPriority;
    houseId?: string | PopulatedHouse | null;
    dueDate?: string;
    createdBy?: string | PopulatedInspector;
    createdAt: string;
    status: RequestStatus;
    note?: string;
    respondedAt?: string;
    resolvedAt?: string;
    isOverdue: boolean;
};

export type RequestMeta = {
    allowedTypes: RequestType[];
    eligibleRolesByType: Record<string, string[]>;
    typeDefinitions: RequestTypeDefinition[];
};

// Dung chung cho trao doi tren Request VA SupportTicket (C12) - cung mo hinh
// Comment o backend, chi khac entityType.
export type RequestComment = {
    _id: string;
    entityType: "Request" | "SupportTicket";
    entityId: string;
    authorId: string | { _id: string; displayName: string };
    content: string;
    createdAt: string;
};

// ---------------------------------------------------------------------------
// Dat lich hen (Appointment) - dat lich voi can bo phuong/to dan pho theo
// khung gio, co check-in/hoan thanh va danh gia sau khi xong.
// ---------------------------------------------------------------------------
export type AppointmentStatus =
    | "cho_xac_nhan"
    | "da_xac_nhan"
    | "da_check_in"
    | "hoan_thanh"
    | "tu_choi"
    | "da_huy"
    | "vang_mat";

export type Appointment = {
    _id: string;
    code: string;
    serviceId: string | { _id: string; name: string };
    timeSlotId: string;
    houseId: string | { _id: string; code: string; address?: string };
    citizenUserId?: string | { _id: string; displayName: string; phone?: string };
    proxyName?: string;
    proxyPhone?: string;
    bookedByUserId: string | { _id: string; displayName: string };
    appointedDate: string;
    startTime: string;
    endTime: string;
    note?: string;
    status: AppointmentStatus;
    cancelReason?: string;
    rejectReason?: string;
    checkinTime?: string;
    completedTime?: string;
    officerUserId?: string | { _id: string; displayName: string };
    rating?: number;
    ratingNote?: string;
    wardCode?: number;
    neighborhoodId?: string;
    createdAt: string;
    updatedAt: string;
};

export type AppointmentTimeSlot = {
    _id: string;
    dayOfWeek: number; // 1-7, Thu 2 - Chu nhat
    startTime: string;
    endTime: string;
    maxCapacity: number;
    active: boolean;
};

export type AppointmentHouseRequirement = "none" | "optional" | "required";
export type AppointmentHouseStatusRequirement = "any" | "in_scope" | "verified";

export type AppointmentService = {
    _id: string;
    key: string;
    name: string;
    description?: string;
    locationAddress: string;
    scope: "ward" | "neighborhood";
    wardCode?: number;
    wardName?: string;
    neighborhoodId?: string;
    houseRequirement: AppointmentHouseRequirement;
    houseStatusRequirement: AppointmentHouseStatusRequirement;
    slotDurationMinutes: number;
    autoApprove: boolean;
    active: boolean;
    assignedOfficerUserIds: Array<{ _id: string; displayName: string }>;
    timeSlots: AppointmentTimeSlot[];
    createdAt?: string;
    updatedAt?: string;
};

export type AppointmentHolidayType = "le" | "tam_ngung";

export type AppointmentHoliday = {
    _id: string;
    date: string;
    name: string;
    type: AppointmentHolidayType;
    // Khong dat = ap dung cho TOAN BO cac phuong/xa (ngay le co dinh quoc gia).
    wardCode?: number;
    note?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type AppointmentReportServiceRow = {
    serviceId: string;
    serviceName: string;
    total: number;
    completed: number;
    noShow: number;
    cancelled: number;
    onTimeRate: number;
    avgRating: number | null;
};

export type AppointmentReportSummary = {
    byService: AppointmentReportServiceRow[];
    overall: {
        total: number;
        completed: number;
        noShow: number;
        cancelled: number;
        onTimeRate: number;
        avgRating: number | null;
    };
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

export type FinanceMonthSummary = {
    year: number;
    month: number;
    income: number;
    expense: number;
};

export type FinanceSummary = {
    totalIncome: number;
    totalExpense: number;
    net: number;
    byMonth: FinanceMonthSummary[];
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
// So ha tang To dan pho (InfrastructureAsset - B11)
// ---------------------------------------------------------------------------
export const INFRASTRUCTURE_ASSET_TYPES = [
    "den",
    "duong",
    "cong",
    "cay",
    "diem_rac",
    "nha_sinh_hoat",
] as const;
export type InfrastructureAssetType =
    typeof INFRASTRUCTURE_ASSET_TYPES[number];

export const INFRASTRUCTURE_ASSET_CONDITIONS = [
    "binh_thuong",
    "hu_hong",
    "can_kiem_tra",
] as const;
export type InfrastructureAssetCondition =
    typeof INFRASTRUCTURE_ASSET_CONDITIONS[number];

export type InfrastructureAsset = {
    _id: string;
    name: string;
    type: InfrastructureAssetType;
    neighborhoodId: string | { _id: string; code: string; name: string };
    location?: string;
    condition: InfrastructureAssetCondition;
    note?: string;
    createdAt: string;
    updatedAt: string;
};

// ---------------------------------------------------------------------------
// Bao cao dinh ky To/nhan vien nop len Phuong (PeriodicReport - B12)
// ---------------------------------------------------------------------------
export const PERIODIC_REPORT_TYPES = [
    "weekly",
    "monthly",
    "quarterly",
    "yearly",
    "ad_hoc",
] as const;
export type PeriodicReportType = typeof PERIODIC_REPORT_TYPES[number];

export const PERIODIC_REPORT_STATUS = [
    "draft",
    "submitted",
    "received",
    "accepted",
    "revision_required",
    "recalled",
    "revision_requested",
    "resubmitted",
] as const;
export type PeriodicReportStatus = typeof PERIODIC_REPORT_STATUS[number];

export type PeriodicReportSections = {
    generalSituation?: string;
    highlights?: string;
    recommendations?: string;
    proposals?: string;
};

export type PeriodicReportAutoSummary = {
    tasks: { received: number; completed: number; overdue: number };
    feedback: { received: number; verified: number; forwarded: number; pending: number };
    inspections: {
        total: number;
        completed: number;
        passed: number;
        failed: number;
        pending: number;
        revisionRequired: number;
        fieldCheckRequired: number;
    };
    cases: { total: number; open: number; resolved: number };
    generatedAt: string;
};

export type PeriodicReportVersionSummary = {
    _id: string;
    version: number;
    submittedAt: string;
    submittedByUserId?: string | { _id: string; displayName: string };
};

export type PeriodicReport = {
    _id: string;
    type: PeriodicReportType;
    periodStart: string;
    periodEnd: string;
    authorUserId: string | { _id: string; displayName: string; phone?: string };
    neighborhoodId?: string | {
        _id: string;
        code: string;
        name: string;
        wardCode?: number;
        wardName?: string;
    } | null;
    sections: PeriodicReportSections;
    autoSummary: PeriodicReportAutoSummary;
    status: PeriodicReportStatus;
    submittedToUserId?: string | {
        _id: string;
        displayName: string;
        roles?: string[];
        wardCode?: number;
        wardName?: string;
    } | null;
    submittedAt?: string;
    currentVersion: number;
    receivedAt?: string;
    acceptedAt?: string;
    recalledAt?: string;
    revisionNote?: string;
    attachments?: FileAsset[];
    versions?: PeriodicReportVersionSummary[];
    createdAt: string;
    updatedAt: string;
};

export type KpiFormulaType = "ratio" | "count" | "average";
export type KpiDataSource =
    | "task_completion"
    | "task_on_time"
    | "feedback_sla"
    | "inspection_completion"
    | "house_response"
    | "notification_read";
export type KpiPeriod = "weekly" | "monthly" | "quarterly" | "yearly";

export type KpiDefinition = {
    _id: string;
    code: string;
    name: string;
    description?: string;
    formulaType: KpiFormulaType;
    dataSource: KpiDataSource;
    targetValue: number;
    targetDirection: "gte" | "lte";
    unit: string;
    period: KpiPeriod;
    wardCode?: number;
    active: boolean;
    version: number;
    createdAt: string;
    updatedAt: string;
};

export type KpiEvaluationItem = {
    definition: KpiDefinition;
    fromDate: string;
    toDate: string;
    value: number | null;
    targetMet: boolean | null;
    numerator: number;
    denominator: number;
    detail: string;
};

// ---------------------------------------------------------------------------
// Rà soát / chiến dịch (B07)
// ---------------------------------------------------------------------------
export type InspectionCampaignStatus = "DRAFT" | "ACTIVE" | "LOCKED" | "CLOSED";
export type InspectionSelfDeclarationStatus = "NOT_SENT" | "SENT" | "SUBMITTED";
export type InspectionResultStatus =
    | "PENDING"
    | "DRAFT"
    | "SUBMITTED"
    | "VERIFIED"
    | "REQUEST_REVISION"
    | "FIELD_CHECK_REQUIRED";
export type InspectionOutcome = "PASS" | "FAIL" | "NEEDS_SUPPLEMENT";
export type InspectionChecklistInputType =
    | "BOOLEAN"
    | "TEXT"
    | "NUMBER"
    | "SINGLE_SELECT"
    | "MULTI_SELECT";

export type InspectionChecklistItem = {
    itemId: string;
    label: string;
    inputType: InspectionChecklistInputType;
    required: boolean;
    options?: string[];
};

export type InspectionSummary = {
    totalHouses: number;
    pass: number;
    fail: number;
    unchecked: number;
    needsSupplement: number;
    pending: number;
    draft: number;
    submitted: number;
    verified: number;
};

export type InspectionCampaign = {
    _id: string;
    name: string;
    purpose: string;
    checklistTemplate: InspectionChecklistItem[];
    allowSelfDeclaration: boolean;
    requiredEvidence: boolean;
    startAt: string;
    dueAt: string;
    status: InspectionCampaignStatus;
    wardCode?: number;
    wardName?: string;
    createdByWardUserId: string | { _id: string; displayName: string };
    neighborhoodSubmissions?: Array<{
        neighborhoodId: string;
        submittedByUserId: string | { _id: string; displayName: string };
        submittedAt: string;
        summary: InspectionSummary;
    }>;
    submissionDestination?: {
        wardCode?: number;
        wardName?: string;
        recipients: Array<{
            _id: string;
            displayName: string;
            roles: string[];
            wardCode?: number;
            wardName?: string;
        }>;
    };
    summary?: InspectionSummary;
    availableNeighborhoods?: Array<{ _id: string; code: string; name: string }>;
    createdAt: string;
    updatedAt: string;
};

export type InspectionCreationOptions = {
    neighborhoods: Array<{
        _id: string;
        code: string;
        name: string;
        sequence: number;
        wardCode?: number;
        wardName?: string;
    }>;
    houses: Array<{
        _id: string;
        code: string;
        address: string;
        cluster?: string;
        neighborhoodId: string;
    }>;
};

export type InspectionHouseRef = {
    _id: string;
    code: string;
    address: string;
    cluster?: string;
    neighborhoodId?: string;
};

export type InspectionTarget = {
    _id: string;
    campaignId: string;
    houseId: string | InspectionHouseRef;
    neighborhoodId: string;
    assignedCollaboratorUserId?: string | { _id: string; displayName: string; phone?: string };
    selfDeclarationStatus: InspectionSelfDeclarationStatus;
    resultStatus: InspectionResultStatus;
    selfDeclarationSentAt?: string;
    openedAt?: string;
    result?: { _id: string; status: InspectionResultStatus; outcome?: InspectionOutcome } | null;
    campaign?: InspectionCampaign;
};

export type InspectionAnswer = {
    _id: string;
    checklistItemId: string;
    value: unknown;
};

export type InspectionResult = {
    _id: string;
    targetId: string;
    submittedBy: "HOUSE" | "NEIGHBORHOOD";
    submittedByUserId: string | { _id: string; displayName: string };
    gpsLat?: number;
    gpsLng?: number;
    note?: string;
    outcome?: InspectionOutcome;
    verifiedByUserId?: string | { _id: string; displayName: string };
    verifiedAt?: string;
    reviewNote?: string;
    status: InspectionResultStatus;
    submittedAt?: string;
    target: InspectionTarget;
    campaign: InspectionCampaign;
    answers: InspectionAnswer[];
    attachments: FileAsset[];
};

// ---------------------------------------------------------------------------
// Bao cao tong quan (dashboard)
// ---------------------------------------------------------------------------
export type DashboardTask = { label: string; count: number; link?: string };

export type DashboardRequestItem = {
    _id: string;
    requestId: string;
    type: RequestType;
    title: string;
    priority: RequestPriority;
    status: RequestStatus;
    dueDate?: string;
    isOverdue: boolean;
};

export type DashboardSummary = {
    audience:
        | "system_admin"
        | "ward"
        | "neighborhood"
        | "police"
        | "social_affairs"
        | "health"
        | "education"
        | "economy_labor"
        | "staff";
    scopeLabel: string;
    generatedAt: string;
    capabilities: {
        population: boolean;
        complaints: boolean;
        pccc: boolean;
        security: boolean;
        requests: boolean;
        inspections: boolean;
        finance: boolean;
        surveys: boolean;
        meetings: boolean;
    };
    totalHouseholds: number;
    totalHouses: number;
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
    attention: {
        newComplaints: number;
        overdueRequests: number;
        highRiskPccc: number;
        urgentSecurity: number;
        activeInspectionCampaigns: number;
        overdueInspectionTargets: number;
    };
    charts: {
        populationByArea: {
            label: string;
            households: number;
            citizens: number;
        }[];
        complaintStatus: {
            status: string;
            label: string;
            count: number;
        }[];
        requestStatus: {
            status: string;
            label: string;
            count: number;
        }[];
        inspectionProgress: {
            campaignId: string;
            label: string;
            verified: number;
            submitted: number;
            requiresAction: number;
            pending: number;
        }[];
        riskByArea: {
            label: string;
            highRiskPccc: number;
            urgentSecurity: number;
            needsSupport: number;
        }[];
        financeByMonth: {
            label: string;
            income: number;
            expense: number;
        }[];
    };
    gisOverview: {
        provider: "internal_coordinates";
        totalHouses: number;
        housesWithCoordinates: number;
        points: Array<{
            houseId: string;
            code: string;
            address: string;
            latitude: number;
            longitude: number;
            accuracyMeters?: number | null;
            citizenCount: number;
            openComplaintCount: number;
            highRiskPccc: boolean;
            urgentSecurity: boolean;
        }>;
    };
    taskList: DashboardTask[];
    myRequests: DashboardRequestItem[];
    myRequestCounts: {
        inProgress: number;
        dueSoon: number;
        overdue: number;
    };
    myComplaintCounts: {
        inProgress: number;
        overdue: number;
    };
    neighborhoodOverview?: NeighborhoodOverview;
    wardOverview?: WardOverview;
    departmentOverview?: DepartmentOverview;
    // Duong di MOI (low-code): chi co gia tri khi CO IT NHAT 1 vai tro cua
    // actor da cau hinh Role.dashboardMetrics (khac null) - xem
    // dashboardService.computeFlatDashboardMetrics (backend). Khi
    // allowedDashboardMetrics != null, uu tien hien thi metrics (mot grid so
    // lieu chung, khong theo audience co dinh) thay vi neighborhoodOverview/
    // wardOverview/departmentOverview.
    metrics?: Partial<Record<DashboardMetricKey, number | ComplaintSummary>>;
    allowedDashboardMetrics: DashboardMetricKey[] | null;
};

export type ComplaintSummary = {
    unprocessed: number;
    inProgress: number;
    processed: number;
    total: number;
};

// Khoi rieng cho tung "phong ban" cap Phuong - chi field ung voi audience hien
// tai duoc dien (xem summary.audience), cac field con lai la undefined.
export type DepartmentOverview = {
    police?: {
        undeclaredResidency: number;
        militaryAgeMen: number;
    };
    socialAffairs?: {
        women: number;
        elderly: number;
        children: number;
        veterans: number;
        martyrs: number;
        poorHouseholds: number;
    };
    health?: {
        diseaseMonitoredHouseholds: number;
    };
    education?: {
        schoolAgeChildren: number;
    };
    economyLabor?: {
        businessUnits: number;
        unemployed: number;
    };
};

// Chi tra ve khi audience === "neighborhood" (to truong/to pho). Cong tac
// vien khong nhan duoc khoi nay - xem ghi chu dashboardAreaContext o backend.
export type NeighborhoodOverview = {
    houses: {
        total: number;
        verified: number;
        unverified: number;
        pending: number;
        needsAttention: number;
        occupied: number;
        business: number;
        vacant: number;
    };
    population: {
        households: number;
        citizens: number;
        permanentResidents: number;
        temporaryResidents: number;
        renters: number;
        elderly: number;
        children: number;
        needsSupport: number;
        women: number;
        veterans: number;
        martyrs: number;
        poorHouseholds: number;
        unemployed: number;
        militaryAgeMen: number;
        undeclaredResidency: number;
        diseaseMonitoredHouseholds: number;
        registeredHouses: number;
    };
    business: {
        dataAvailable: boolean;
        total: number;
        totalCompanies: number;
        byIndustry: { label: string; count: number }[];
        missingLicense: number;
        expiringLicenses: number;
        needsReview: number;
    };
    safety: {
        dataAvailable: boolean;
        housesNotInspected: number;
        highRiskPccc: number;
        urgentSecurity: number;
        unresolvedRecommendations: number;
        openComplaints: number;
    };
    tasks: {
        newComplaints: number;
        inProgressComplaints: number;
        overdueRequestAssignments: number;
        resolvedRequestAssignments: number;
        totalRequestAssignments: number;
        onTimeCompletionRate: number | null;
        averageSatisfaction: number | null;
        ratedComplaintCount: number;
    };
    complaintSummary: ComplaintSummary;
};

export type WardNeighborhoodRow = {
    neighborhoodId: string;
    name: string;
    totalHouses: number;
    verifiedHouses: number;
    verificationRate: number;
    lastUpdatedAt: string | null;
    isSlow: boolean;
    highAlertCount: number;
    isHighAlert: boolean;
};

// Chi tra ve khi audience === "ward" (bi thu/can bo UBND/vai tro Phuong tuy
// chinh duoc gan wardCode).
export type WardOverview = {
    neighborhoods: WardNeighborhoodRow[];
    houseSummary: {
        neighborhoods: number;
        houses: number;
        owners: number;
        businessUnits: number;
    };
    complaintSummary: ComplaintSummary;
    dataQuality: {
        duplicateAddressGroups: number;
        duplicateAddressHouses: number;
        otherChecksAvailable: boolean;
    };
    population: {
        households: number;
        citizens: number;
        renters: number;
        elderly: number;
        childrenApprox: number;
        needsSupport: number;
    };
    economy: {
        dataAvailable: boolean;
        total: number;
        totalCompanies: number;
        byIndustry: { label: string; count: number }[];
        expiringLicenses: number;
        newInPeriod: number;
        inactive: number;
    };
    safety: {
        dataAvailable: boolean;
        highRiskPccc: number;
        urgentSecurity: number;
        housesNotInspected: number;
        byNeighborhood: {
            neighborhoodId: string;
            name: string;
            highRiskPccc: number;
            urgentSecurity: number;
            openComplaints: number;
        }[];
    };
    digitalServicesAvailable: boolean;
    systemSafetyAvailable: boolean;
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
    userAgent?: string;
    device?: string;
    browser?: string;
    os?: string;
    sessionId?: string;
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

export type UtilityApp = {
    _id: string;
    name: string;
    icon: string;
    url: string;
    active: boolean;
    sortOrder: number;
    createdAt: string;
};
