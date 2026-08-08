import React from "react";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import { CompanyInput } from "@service/companyApi";

export interface CompanyFormValues {
    name: string;
    ownerName: string;
    phone: string;
    active: boolean;
    note: string;
}

export const EMPTY_COMPANY_FORM: CompanyFormValues = {
    name: "",
    ownerName: "",
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
        phone: values.phone.trim() || undefined,
        active: values.active,
        note: values.note.trim() || undefined,
    };
}

export function isCompanyFormValid(values: CompanyFormValues): boolean {
    return !!values.name.trim();
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
