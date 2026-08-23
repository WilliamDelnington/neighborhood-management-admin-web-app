import React from "react";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import RepresentativeUserPicker from "@components/admin/RepresentativeUserPicker";
import OrganizationPicker from "@components/admin/OrganizationPicker";
import { Organization, User } from "@dts";
import { CompanyInput } from "@service/companyApi";

export interface CompanyFormValues {
    name: string;
    ownerName: string;
    taxCode: string;
    representativeUserId: string;
    representativeUserLabel: string;
    // Lien ket tuy chon toi mot Organization co san (khong bat buoc) - xem
    // ghi chu tren models/Company.ts o backend.
    organizationId: string;
    organizationLabel: string;
    phone: string;
    active: boolean;
    note: string;
}

export const EMPTY_COMPANY_FORM: CompanyFormValues = {
    name: "",
    ownerName: "",
    taxCode: "",
    representativeUserId: "",
    representativeUserLabel: "",
    organizationId: "",
    organizationLabel: "",
    phone: "",
    active: true,
    note: "",
};

export function toCompanyInput(
    values: CompanyFormValues,
    houseId: string,
): CompanyInput {
    return {
        name: values.name.trim(),
        houseId,
        ownerName: values.ownerName.trim() || undefined,
        taxCode: values.taxCode.trim(),
        representativeUserId: values.representativeUserId || null,
        organizationId: values.organizationId || null,
        phone: values.phone.trim() || undefined,
        active: values.active,
        note: values.note.trim() || undefined,
    };
}

export function isCompanyFormValid(values: CompanyFormValues): boolean {
    return !!values.name.trim() && !!values.taxCode.trim();
}

interface CompanyFormProps {
    values: CompanyFormValues;
    onChange: (values: CompanyFormValues) => void;
}

/**
 * Bo truong dung chung cho tao moi/chinh sua cong ty trong mot nha so - mirror
 * BusinessForm.tsx nhung khong co loai hinh kinh doanh.
 */
const CompanyForm: React.FC<CompanyFormProps> = ({ values, onChange }) => {
    const set = <K extends keyof CompanyFormValues>(
        key: K,
        value: CompanyFormValues[K],
    ) => onChange({ ...values, [key]: value });

    return (
        <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
                <Label>Tên công ty</Label>
                <Input
                    placeholder="VD: Công ty TNHH ABC"
                    value={values.name}
                    onChange={e => set("name", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Người đại diện</Label>
                <Input
                    value={values.ownerName}
                    onChange={e => set("ownerName", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Mã số thuế</Label>
                <Input
                    value={values.taxCode}
                    onChange={e => set("taxCode", e.target.value)}
                />
            </div>
            <RepresentativeUserPicker
                value={values.representativeUserId}
                valueLabel={values.representativeUserLabel}
                onChange={(userId, user: User | undefined) => {
                    onChange({
                        ...values,
                        representativeUserId: userId || "",
                        representativeUserLabel: user
                            ? `${user.displayName}${user.phone ? ` · ${user.phone}` : ""}`
                            : "",
                    });
                }}
            />
            <div className="space-y-1.5">
                <Label>Tổ chức liên kết (nếu có)</Label>
                <OrganizationPicker
                    value={values.organizationId}
                    valueLabel={values.organizationLabel}
                    onChange={(organizationId, organization?: Organization) => {
                        onChange({
                            ...values,
                            organizationId: organizationId || "",
                            organizationLabel: organization?.name || "",
                        });
                    }}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Số điện thoại</Label>
                <Input
                    value={values.phone}
                    onChange={e => set("phone", e.target.value)}
                />
            </div>
            <label
                htmlFor="companyActive"
                className="flex items-center gap-2 text-sm"
            >
                <Checkbox
                    id="companyActive"
                    checked={values.active}
                    onCheckedChange={checked =>
                        set("active", checked === true)
                    }
                />
                Đang hoạt động
            </label>
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

export default CompanyForm;
