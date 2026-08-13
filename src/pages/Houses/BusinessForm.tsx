import React, { useEffect, useState } from "react";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import RepresentativeUserPicker from "@components/admin/RepresentativeUserPicker";
import { BusinessType, User } from "@dts";
import { BusinessInput } from "@service/businessApi";
import { fetchBusinessTypes } from "@service/businessTypeApi";

const NONE_BUSINESS_TYPE = "__none__";

export interface BusinessFormValues {
    name: string;
    businessType: string;
    ownerName: string;
    taxCode: string;
    representativeUserId: string;
    representativeUserLabel: string;
    phone: string;
    active: boolean;
    note: string;
}

export const EMPTY_BUSINESS_FORM: BusinessFormValues = {
    name: "",
    businessType: "",
    ownerName: "",
    taxCode: "",
    representativeUserId: "",
    representativeUserLabel: "",
    phone: "",
    active: true,
    note: "",
};

export function toBusinessInput(
    values: BusinessFormValues,
    houseId: string,
): BusinessInput {
    return {
        name: values.name.trim(),
        houseId,
        businessType: values.businessType || null,
        ownerName: values.ownerName.trim() || undefined,
        taxCode: values.taxCode.trim() || undefined,
        representativeUserId: values.representativeUserId || null,
        phone: values.phone.trim() || undefined,
        active: values.active,
        note: values.note.trim() || undefined,
    };
}

export function isBusinessFormValid(values: BusinessFormValues): boolean {
    return !!values.name.trim();
}

interface BusinessFormProps {
    values: BusinessFormValues;
    onChange: (values: BusinessFormValues) => void;
}

/**
 * Bo truong dung chung cho tao moi/chinh sua ho kinh doanh trong mot nha so.
 */
const BusinessForm: React.FC<BusinessFormProps> = ({ values, onChange }) => {
    const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

    const set = <K extends keyof BusinessFormValues>(
        key: K,
        value: BusinessFormValues[K],
    ) => onChange({ ...values, [key]: value });

    useEffect(() => {
        fetchBusinessTypes({ active: true, limit: 100 })
            .then(res => setBusinessTypes(res.items))
            .catch(() => setBusinessTypes([]));
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
                <Label>Tên hộ kinh doanh</Label>
                <Input
                    placeholder="VD: Tạp hóa Cô Lan"
                    value={values.name}
                    onChange={e => set("name", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Loại hình kinh doanh</Label>
                <Select
                    value={values.businessType || NONE_BUSINESS_TYPE}
                    onValueChange={v =>
                        set(
                            "businessType",
                            v === NONE_BUSINESS_TYPE ? "" : v,
                        )
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Chọn loại hình kinh doanh" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={NONE_BUSINESS_TYPE}>
                            Chưa phân loại
                        </SelectItem>
                        {businessTypes.map(bt => (
                            <SelectItem key={bt._id} value={bt._id}>
                                {bt.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label>Chủ hộ kinh doanh</Label>
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
                <Label>Số điện thoại</Label>
                <Input
                    value={values.phone}
                    onChange={e => set("phone", e.target.value)}
                />
            </div>
            <label
                htmlFor="businessActive"
                className="flex items-center gap-2 text-sm"
            >
                <Checkbox
                    id="businessActive"
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

export default BusinessForm;
