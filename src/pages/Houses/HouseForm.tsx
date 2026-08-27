import React, { useEffect, useState } from "react";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import FilterableSelect from "@components/admin/FilterableSelect";
import {
    checkOwnerPhone,
    HouseInput,
    OwnerPhoneCheckResult,
} from "@service/houseApi";
import { fetchStreets } from "@service/streetApi";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import {
    fetchProvinces,
    fetchWardsByProvince,
} from "@service/administrativeDivisionApi";
import {
    HOUSE_PHYSICAL_STATUS_LABEL,
    HOUSE_USAGE_TYPE_LABEL,
} from "@constants/domain";
import {
    HousePhysicalStatus,
    HouseUsageType,
    Neighborhood,
    Province,
    Street,
    Ward,
} from "@dts";
import { useAuthStore, usePermission } from "@store/authStore";

const HOUSE_PHYSICAL_STATUS_KEYS = Object.keys(
    HOUSE_PHYSICAL_STATUS_LABEL,
) as HousePhysicalStatus[];

const HOUSE_USAGE_TYPE_KEYS = Object.keys(
    HOUSE_USAGE_TYPE_LABEL,
) as HouseUsageType[];

// Trung voi isValidVnPhone o backend (src/lib/phone.ts) - chi goi API kiem tra
// khi da nhap du dinh dang, tranh goi API lien tuc tren so dien thoai con dang go.
const VN_PHONE_REGEX = /^0(3|5|7|8|9)\d{8}$/;

/**
 * Kiem tra (debounce 400ms) so dien thoai da co tai khoan trong he thong hay
 * chua - dung tren ownerPhone/repPhone de canh bao ngay tren form truoc khi
 * nop, vi resolveOrCreateHouseOwner/resolveOrCreatePersonOwner o backend se tu
 * dong dung tai khoan co san (khong tao trung) neu so dien thoai da ton tai.
 * Truyen phone="" (field khong ap dung/chua du dinh dang) de tat kiem tra.
 */
function useOwnerPhoneCheck(phone: string): OwnerPhoneCheckResult | null {
    const [result, setResult] = useState<OwnerPhoneCheckResult | null>(null);

    useEffect(() => {
        if (!VN_PHONE_REGEX.test(phone)) {
            setResult(null);
            return;
        }
        let cancelled = false;
        const timer = setTimeout(() => {
            checkOwnerPhone(phone)
                .then(res => {
                    if (!cancelled) setResult(res);
                })
                .catch(() => {
                    if (!cancelled) setResult(null);
                });
        }, 400);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [phone]);

    return result;
}

export type HouseOwnerKind = "individual" | "organization" | "none";

export interface HouseFormValues {
    cluster: string;
    streetId: string;
    neighborhoodId: string;
    address: string;
    // Tinh/thanh pho + phuong/xa - hien thi dia chi day du, khong bat buoc
    // (xem administrativeDivisionApi.ts). provinceCode/wardCode la chuoi de
    // bind vao Select (giong streetId/neighborhoodId), provinceName/wardName
    // luu lai ten hien thi tai thoi diem chon (gui kem len backend, khong tu
    // resolve lai).
    provinceCode: string;
    provinceName: string;
    wardCode: string;
    wardName: string;
    // "" = chua khai bao tinh trang cong trinh - doc lap voi trang thai ho so
    // (HouseStatus), xem HouseForm.tsx.
    physicalStatus: HousePhysicalStatus | "";
    // Muc dich su dung nha do chu nha tu khai bao (co the chon nhieu) - xem
    // models/HouseRecord.ts o backend.
    usageTypes: HouseUsageType[];
    otherUsageNote: string;
    // So khai bao cu tru (cong an cap) - dung de tu dong dien vao ho so cu tru
    // khi chon nha nay (xem ResidentForm.tsx). Nam trong HOUSE_RECORD_PROTECTED_FIELDS
    // o backend nen sau khi nha da "verified" phai sua qua ChangeRequest.
    residenceDeclarationNumber: string;
    note: string;
    // Loai chu nha - chi co y nghia luc tao moi, backend khong ho tro doi loai
    // chu nha sau khi da tao (xem houseRecordService.createHouseRecord).
    ownerKind: HouseOwnerKind;
    // ownerKind="individual": thong tin chu nha luon duoc thu thap (kem du co
    // tick tao tai khoan hay khong - de van khai bao duoc chu nha ma khong bat
    // buoc tao tai khoan dang nhap, xem createOwnerAccount).
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string;
    ownerPassword: string;
    createOwnerAccount: boolean;
    // ownerKind="organization": thong tin to chuc duoc khai bao inline, luon
    // duoc thu thap - backend tim-hoac-tao theo taxCode neu co nhap, khong thi
    // luon tao moi (taxCode khong bat buoc).
    orgName: string;
    orgTaxCode: string;
    orgAddress: string;
    orgPhone: string;
    orgEmail: string;
    // Chi hien them sub-form nguoi dai dien khi tick - to chuc co the khong co
    // ai dang nhap thay duoc.
    createRepresentativeAccount: boolean;
    repName: string;
    repPhone: string;
    repEmail: string;
    repPassword: string;
}

export const EMPTY_HOUSE_FORM: HouseFormValues = {
    cluster: "",
    streetId: "",
    neighborhoodId: "",
    address: "",
    provinceCode: "",
    provinceName: "",
    wardCode: "",
    wardName: "",
    physicalStatus: "",
    usageTypes: ["household"],
    otherUsageNote: "",
    residenceDeclarationNumber: "",
    note: "",
    ownerKind: "none",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ownerPassword: "",
    createOwnerAccount: false,
    orgName: "",
    orgTaxCode: "",
    orgAddress: "",
    orgPhone: "",
    orgEmail: "",
    createRepresentativeAccount: false,
    repName: "",
    repPhone: "",
    repEmail: "",
    repPassword: "",
};

export function toHouseInput(values: HouseFormValues): HouseInput {
    return {
        cluster: values.streetId ? undefined : values.cluster.trim(),
        streetId: values.streetId || undefined,
        neighborhoodId: values.neighborhoodId || null,
        address: values.address.trim(),
        provinceCode: values.provinceCode
            ? Number(values.provinceCode)
            : undefined,
        provinceName: values.provinceName || undefined,
        wardCode: values.wardCode ? Number(values.wardCode) : undefined,
        wardName: values.wardName || undefined,
        physicalStatus: values.physicalStatus || undefined,
        usageTypes: values.usageTypes,
        otherUsageNote: values.otherUsageNote.trim() || undefined,
        residenceDeclarationNumber:
            values.residenceDeclarationNumber.trim() || undefined,
        note: values.note.trim() || undefined,
        ownerKind: values.ownerKind,
        owner:
            values.ownerKind === "individual"
                ? {
                      displayName: values.ownerName.trim(),
                      phone: values.ownerPhone.trim(),
                      email: values.ownerEmail.trim() || undefined,
                      password:
                          values.createOwnerAccount &&
                          values.ownerPassword.trim()
                              ? values.ownerPassword.trim()
                              : undefined,
                  }
                : undefined,
        createOwnerAccount:
            values.ownerKind === "individual"
                ? values.createOwnerAccount
                : undefined,
        organization:
            values.ownerKind === "organization"
                ? {
                      name: values.orgName.trim(),
                      taxCode: values.orgTaxCode.trim() || undefined,
                      address: values.orgAddress.trim() || undefined,
                      phone: values.orgPhone.trim() || undefined,
                      email: values.orgEmail.trim() || undefined,
                  }
                : undefined,
        createRepresentativeAccount:
            values.ownerKind === "organization"
                ? values.createRepresentativeAccount
                : undefined,
        representative:
            values.ownerKind === "organization" &&
            values.createRepresentativeAccount
                ? {
                      displayName: values.repName.trim(),
                      phone: values.repPhone.trim(),
                      email: values.repEmail.trim() || undefined,
                      password: values.repPassword.trim() || undefined,
                  }
                : undefined,
    };
}

export function isHouseFormValid(values: HouseFormValues): boolean {
    if (!(values.cluster.trim() || values.streetId) || !values.address.trim()) {
        return false;
    }
    if (values.usageTypes.length === 0) return false;
    if (values.ownerKind === "individual") {
        if (!(values.ownerName.trim() && values.ownerPhone.trim())) {
            return false;
        }
        if (
            values.createOwnerAccount &&
            values.ownerPassword.trim().length > 0 &&
            values.ownerPassword.trim().length < 6
        ) {
            return false;
        }
    }
    if (values.ownerKind === "organization") {
        if (!values.orgName.trim()) return false;
        if (values.createRepresentativeAccount) {
            if (!(values.repName.trim() && values.repPhone.trim())) {
                return false;
            }
            if (
                values.repPassword.trim().length > 0 &&
                values.repPassword.trim().length < 6
            ) {
                return false;
            }
        }
    }
    return true;
}

interface HouseFormProps {
    values: HouseFormValues;
    onChange: (values: HouseFormValues) => void;
    mode?: "create" | "edit";
}

/**
 * Bo truong dung chung cho tao moi/chinh sua nha so.
 */
const HouseForm: React.FC<HouseFormProps> = ({
    values,
    onChange,
    mode = "create",
}) => {
    // Nguoi dung duoc phan cong cum (vd to truong) chi duoc chon trong cac cum
    // cua minh, tuong tu HouseholdForm.
    const assignedClusters = useAuthStore(state => state.user?.assignedClusters) || [];
    // Chi nguoi dung co quyen "streets.read" (vd admin) moi thay Street picker -
    // house_owner tu khai bao cum dan cu tu do nhu truoc (xem streetSync.ts o backend).
    const canPickStreet = usePermission("streets.read");
    const [streets, setStreets] = useState<Street[]>([]);
    // To dan pho la thuoc tinh rieng cua nha so, KHONG suy ra tu Street (mot
    // duong/pho co the chay qua nhieu to dan pho) - xem models/HouseRecord.ts.
    const canPickNeighborhood = usePermission("neighborhoods.read");
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    // Chi house_owner/admin (nguoi co the la nguoi dai dien to chuc) moi thay
    // lua chon "Tổ chức", va chi luc tao moi - xem ghi chu o HouseFormValues.ownerKind.
    const hasOrganizationPermission = usePermission("organizations.create");
    const canPickOrganization = mode === "create" && hasOrganizationPermission;
    // Chi nhan vien co quyen tao tai khoan chu ho thay (vd to truong - xem
    // trang /users/new-house-owner) moi thay muc nay, va chi luc tao moi nha -
    // ho khong tu so huu nha (khac house_owner tu dang ky), nen can nhap thong
    // tin chu nha ca nhan hoac de trong (chua co chu nha, gan sau).
    const canAttachOwner = mode === "create" && usePermission("users.create");

    // Tinh/thanh pho + phuong/xa - khong gan permission rieng (du lieu tham
    // chieu cong khai, khong nhay cam) - xem administrativeDivisionApi.ts.
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);

    const ownerPhoneCheck = useOwnerPhoneCheck(
        values.ownerKind === "individual" ? values.ownerPhone : "",
    );
    const repPhoneCheck = useOwnerPhoneCheck(
        values.ownerKind === "organization" && values.createRepresentativeAccount
            ? values.repPhone
            : "",
    );

    const set = <K extends keyof HouseFormValues>(
        key: K,
        value: HouseFormValues[K],
    ) => onChange({ ...values, [key]: value });

    useEffect(() => {
        if (!values.cluster && assignedClusters.length === 1) {
            set("cluster", assignedClusters[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignedClusters.length]);

    useEffect(() => {
        if (!canPickStreet) return;
        fetchStreets({ active: true, limit: 200 })
            .then(res => setStreets(res.items))
            .catch(() => setStreets([]));
    }, [canPickStreet]);

    useEffect(() => {
        if (!canPickNeighborhood) return;
        fetchNeighborhoods({ active: true, limit: 200 })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setNeighborhoods([]));
    }, [canPickNeighborhood]);

    useEffect(() => {
        fetchProvinces()
            .then(setProvinces)
            .catch(() => setProvinces([]));
    }, []);

    useEffect(() => {
        if (!values.provinceCode) {
            setWards([]);
            return;
        }
        fetchWardsByProvince(Number(values.provinceCode))
            .then(setWards)
            .catch(() => setWards([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values.provinceCode]);

    const handleProvinceChange = (code: string, province?: Province) => {
        onChange({
            ...values,
            provinceCode: code,
            provinceName: province?.name || "",
            // Doi tinh/thanh pho thi phuong/xa da chon (thuoc tinh cu) khong
            // con hop le nua - xoa de nguoi dung chon lai.
            wardCode: "",
            wardName: "",
        });
    };

    const handleWardChange = (code: string, ward?: Ward) => {
        onChange({
            ...values,
            wardCode: code,
            wardName: ward?.name || "",
        });
    };

    // Neu to dan pho duoc chon co san phuong/xa (bat buoc voi to dan pho MOI,
    // nhung to dan pho cu tao truoc khi co truong nay co the chua co), phuong/xa
    // cua nha so PHAI khop voi to dan pho - tu dien va khoa 2 select tren, giong
    // hanh vi backend (xem houseRecordService.resolveAdministrativeDivisions).
    // Neu to dan pho chua co phuong/xa rieng thi khong khoa, de nguoi dung tu
    // chon nhu binh thuong (doc lap, giong Street/Neighborhood hom nay).
    const selectedNeighborhood = neighborhoods.find(
        n => n._id === values.neighborhoodId,
    );
    const wardLockedByNeighborhood = !!selectedNeighborhood?.wardCode;

    const handleNeighborhoodChange = (id: string) => {
        if (!id) {
            onChange({ ...values, neighborhoodId: "" });
            return;
        }
        const neighborhood = neighborhoods.find(n => n._id === id);
        if (neighborhood?.wardCode) {
            onChange({
                ...values,
                neighborhoodId: id,
                provinceCode: String(neighborhood.provinceCode),
                provinceName: neighborhood.provinceName || "",
                wardCode: String(neighborhood.wardCode),
                wardName: neighborhood.wardName || "",
            });
        } else {
            onChange({ ...values, neighborhoodId: id });
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <FilterableSelect
                label="Tỉnh/Thành phố"
                placeholder="Chọn tỉnh/thành phố"
                searchPlaceholder="Tìm theo tên tỉnh/thành phố..."
                items={provinces}
                getId={p => String(p.code)}
                getLabel={p => p.name}
                value={values.provinceCode}
                valueLabel={values.provinceName}
                onChange={(code, province) =>
                    handleProvinceChange(code || "", province)
                }
                disabled={wardLockedByNeighborhood}
            />
            <FilterableSelect
                label="Phường/Xã"
                placeholder={
                    values.provinceCode
                        ? "Chọn phường/xã"
                        : "Chọn tỉnh/thành phố trước"
                }
                searchPlaceholder="Tìm theo tên phường/xã..."
                items={wards}
                getId={w => String(w.code)}
                getLabel={w => w.name}
                value={values.wardCode}
                valueLabel={values.wardName}
                onChange={(code, ward) => handleWardChange(code || "", ward)}
                disabled={!values.provinceCode || wardLockedByNeighborhood}
                hint={
                    wardLockedByNeighborhood
                        ? "Tự động điền theo tổ dân phố đã chọn."
                        : undefined
                }
            />
            {canPickStreet ? (
                <FilterableSelect
                    label="Đường/phố"
                    placeholder="Chọn đường/phố"
                    searchPlaceholder="Tìm theo tên đường/phố..."
                    items={streets}
                    getId={s => s._id}
                    getLabel={s => s.name}
                    value={values.streetId}
                    valueLabel={
                        streets.find(s => s._id === values.streetId)?.name
                    }
                    onChange={id => set("streetId", id || "")}
                    clearable={false}
                />
            ) : (
                <div className="space-y-1.5">
                    <Label>Cụm dân cư</Label>
                    {assignedClusters.length > 0 ? (
                        <Select
                            value={values.cluster}
                            onValueChange={v => set("cluster", v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn cụm dân cư" />
                            </SelectTrigger>
                            <SelectContent>
                                {assignedClusters.map(c => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input
                            placeholder="VD: Cụm 3"
                            value={values.cluster}
                            onChange={e => set("cluster", e.target.value)}
                        />
                    )}
                </div>
            )}
            {canPickNeighborhood && (
                <FilterableSelect
                    label="Tổ dân phố"
                    placeholder="Chưa gán tổ dân phố"
                    searchPlaceholder="Tìm theo tên tổ dân phố..."
                    items={neighborhoods}
                    getId={n => n._id}
                    getLabel={n => n.name}
                    value={values.neighborhoodId}
                    valueLabel={
                        neighborhoods.find(n => n._id === values.neighborhoodId)
                            ?.name
                    }
                    onChange={id => handleNeighborhoodChange(id || "")}
                />
            )}
            <div className="space-y-1.5">
                <Label>Địa chỉ</Label>
                <Input
                    placeholder="Số nhà, ngõ, đường..."
                    value={values.address}
                    onChange={e => set("address", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Tình trạng công trình</Label>
                <Select
                    value={values.physicalStatus || "__none__"}
                    onValueChange={v =>
                        set(
                            "physicalStatus",
                            v === "__none__" ? "" : (v as HousePhysicalStatus),
                        )
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Chưa cập nhật" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__none__">Chưa cập nhật</SelectItem>
                        {HOUSE_PHYSICAL_STATUS_KEYS.map(key => (
                            <SelectItem key={key} value={key}>
                                {HOUSE_PHYSICAL_STATUS_LABEL[key]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label>Mục đích sử dụng</Label>
                <div className="flex flex-row flex-wrap gap-4">
                    {HOUSE_USAGE_TYPE_KEYS.map(usageType => (
                        <label
                            key={usageType}
                            className="flex items-center gap-2 text-sm"
                        >
                            <Checkbox
                                checked={values.usageTypes.includes(
                                    usageType,
                                )}
                                onCheckedChange={checked =>
                                    set(
                                        "usageTypes",
                                        checked === true
                                            ? [...values.usageTypes, usageType]
                                            : values.usageTypes.filter(
                                                  t => t !== usageType,
                                              ),
                                    )
                                }
                            />
                            {HOUSE_USAGE_TYPE_LABEL[usageType]}
                        </label>
                    ))}
                </div>
                <Input
                    placeholder="Mục đích sử dụng khác (nếu có)"
                    value={values.otherUsageNote}
                    onChange={e => set("otherUsageNote", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Số khai báo cư trú</Label>
                <Input
                    placeholder="Số khai báo cư trú (nếu có)"
                    value={values.residenceDeclarationNumber}
                    onChange={e =>
                        set("residenceDeclarationNumber", e.target.value)
                    }
                />
            </div>
            {(canAttachOwner || canPickOrganization) && (
                <div className="space-y-3 rounded-lg border border-divider_01 p-3">
                    <div className="space-y-1.5">
                        <Label>Loại chủ nhà</Label>
                        <RadioGroup
                            className="flex flex-row flex-wrap gap-4"
                            value={values.ownerKind}
                            onValueChange={v =>
                                set("ownerKind", v as HouseOwnerKind)
                            }
                        >
                            {canAttachOwner && (
                                <label className="flex items-center gap-2 text-sm">
                                    <RadioGroupItem
                                        id="owner-kind-individual"
                                        value="individual"
                                    />
                                    Cá nhân
                                </label>
                            )}
                            {canPickOrganization && (
                                <label className="flex items-center gap-2 text-sm">
                                    <RadioGroupItem
                                        id="owner-kind-organization"
                                        value="organization"
                                    />
                                    Tổ chức
                                </label>
                            )}
                            <label className="flex items-center gap-2 text-sm">
                                <RadioGroupItem
                                    id="owner-kind-none"
                                    value="none"
                                />
                                Chưa khai báo
                            </label>
                        </RadioGroup>
                    </div>

                    {values.ownerKind === "individual" && (
                        <div className="flex flex-col gap-3">
                            <div className="space-y-1.5">
                                <Label>Họ tên chủ nhà</Label>
                                <Input
                                    placeholder="Họ và tên"
                                    value={values.ownerName}
                                    onChange={e =>
                                        set("ownerName", e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Số điện thoại chủ nhà</Label>
                                <Input
                                    placeholder="VD: 0912345678"
                                    value={values.ownerPhone}
                                    onChange={e =>
                                        set("ownerPhone", e.target.value)
                                    }
                                />
                                {ownerPhoneCheck?.exists && (
                                    <p className="text-xs text-amber-600">
                                        Số điện thoại này đã có tài khoản
                                        {ownerPhoneCheck.displayName
                                            ? ` (${ownerPhoneCheck.displayName})`
                                            : ""}{" "}
                                        — tài khoản đó sẽ được thêm nhà số này
                                        để quản lý, thay vì tạo tài khoản mới.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email (không bắt buộc)</Label>
                                <Input
                                    type="email"
                                    placeholder="email@vidu.com"
                                    value={values.ownerEmail}
                                    onChange={e =>
                                        set("ownerEmail", e.target.value)
                                    }
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="house-create-owner-account"
                                    checked={values.createOwnerAccount}
                                    onCheckedChange={checked =>
                                        set(
                                            "createOwnerAccount",
                                            checked === true,
                                        )
                                    }
                                />
                                <Label htmlFor="house-create-owner-account">
                                    Tạo tài khoản Chủ sở hữu
                                </Label>
                            </div>
                            {values.createOwnerAccount && (
                                <div className="space-y-1.5">
                                    <Label>Mật khẩu (không bắt buộc)</Label>
                                    <Input
                                        type="password"
                                        placeholder="Ít nhất 6 ký tự"
                                        value={values.ownerPassword}
                                        onChange={e =>
                                            set(
                                                "ownerPassword",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Đặt mật khẩu để chủ nhà đăng nhập ngay
                                        bằng số điện thoại + mật khẩu này. Để
                                        trống nếu chủ nhà sẽ tự đăng ký sau.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {values.ownerKind === "organization" && (
                        <div className="flex flex-col gap-3">
                            <div className="space-y-1.5">
                                <Label>Tên tổ chức</Label>
                                <Input
                                    placeholder="Tên tổ chức"
                                    value={values.orgName}
                                    onChange={e =>
                                        set("orgName", e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Mã số thuế (không bắt buộc)</Label>
                                <Input
                                    placeholder="Mã số thuế / số đăng ký kinh doanh (nếu có)"
                                    value={values.orgTaxCode}
                                    onChange={e =>
                                        set("orgTaxCode", e.target.value)
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Nếu nhập mã số thuế đã tồn tại, nhà sẽ được
                                    gắn vào tổ chức đó. Để trống nếu tổ chức
                                    chưa có mã số thuế.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Địa chỉ tổ chức</Label>
                                <Input
                                    placeholder="Địa chỉ trụ sở"
                                    value={values.orgAddress}
                                    onChange={e =>
                                        set("orgAddress", e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Số điện thoại tổ chức</Label>
                                <Input
                                    placeholder="VD: 0912345678"
                                    value={values.orgPhone}
                                    onChange={e =>
                                        set("orgPhone", e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email tổ chức (không bắt buộc)</Label>
                                <Input
                                    type="email"
                                    placeholder="email@vidu.com"
                                    value={values.orgEmail}
                                    onChange={e =>
                                        set("orgEmail", e.target.value)
                                    }
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="house-create-representative-account"
                                    checked={values.createRepresentativeAccount}
                                    onCheckedChange={checked =>
                                        set(
                                            "createRepresentativeAccount",
                                            checked === true,
                                        )
                                    }
                                />
                                <Label htmlFor="house-create-representative-account">
                                    Tạo tài khoản người đại diện
                                </Label>
                            </div>
                            {values.createRepresentativeAccount && (
                                <div className="flex flex-col gap-3 rounded-lg border border-divider_01 p-3">
                                    <div className="space-y-1.5">
                                        <Label>Họ tên người đại diện</Label>
                                        <Input
                                            placeholder="Họ và tên"
                                            value={values.repName}
                                            onChange={e =>
                                                set("repName", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>
                                            Số điện thoại người đại diện
                                        </Label>
                                        <Input
                                            placeholder="VD: 0912345678"
                                            value={values.repPhone}
                                            onChange={e =>
                                                set("repPhone", e.target.value)
                                            }
                                        />
                                        {repPhoneCheck?.exists && (
                                            <p className="text-xs text-amber-600">
                                                Số điện thoại này đã có tài
                                                khoản
                                                {repPhoneCheck.displayName
                                                    ? ` (${repPhoneCheck.displayName})`
                                                    : ""}{" "}
                                                — tài khoản đó sẽ trở thành
                                                người đại diện của tổ chức.
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>
                                            Email người đại diện (không bắt
                                            buộc)
                                        </Label>
                                        <Input
                                            type="email"
                                            placeholder="email@vidu.com"
                                            value={values.repEmail}
                                            onChange={e =>
                                                set("repEmail", e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Mật khẩu (không bắt buộc)</Label>
                                        <Input
                                            type="password"
                                            placeholder="Ít nhất 6 ký tự"
                                            value={values.repPassword}
                                            onChange={e =>
                                                set(
                                                    "repPassword",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Đặt mật khẩu để người đại diện đăng
                                            nhập ngay bằng số điện thoại + mật
                                            khẩu này. Để trống nếu họ sẽ tự
                                            đăng ký sau.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            <div className="space-y-1.5">
                <Label>Ghi chú</Label>
                <Textarea
                    placeholder="Ghi chú thêm (nếu có)"
                    value={values.note}
                    onChange={e => set("note", e.target.value)}
                />
            </div>
        </div>
    );
};

export default HouseForm;
