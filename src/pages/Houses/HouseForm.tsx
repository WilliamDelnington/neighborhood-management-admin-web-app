import React, { useEffect } from "react";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { HouseInput } from "@service/houseApi";
import { useAuthStore } from "@store/authStore";

export interface HouseFormValues {
    cluster: string;
    address: string;
    note: string;
    residenceDeclarationNumber: string;
}

export const EMPTY_HOUSE_FORM: HouseFormValues = {
    cluster: "",
    address: "",
    note: "",
    residenceDeclarationNumber: "",
};

export function toHouseInput(values: HouseFormValues): HouseInput {
    return {
        cluster: values.cluster.trim(),
        address: values.address.trim(),
        note: values.note.trim() || undefined,
        residenceDeclarationNumber:
            values.residenceDeclarationNumber.trim() || undefined,
    };
}

export function isHouseFormValid(values: HouseFormValues): boolean {
    return !!(values.cluster.trim() && values.address.trim());
}

interface HouseFormProps {
    values: HouseFormValues;
    onChange: (values: HouseFormValues) => void;
}

/**
 * Bo truong dung chung cho tao moi/chinh sua nha so.
 */
const HouseForm: React.FC<HouseFormProps> = ({ values, onChange }) => {
    // Nguoi dung duoc phan cong cum (vd to truong) chi duoc chon trong cac cum
    // cua minh, tuong tu HouseholdForm.
    const assignedClusters = useAuthStore(state => state.user?.assignedClusters) || [];

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

    return (
        <div className="flex flex-col gap-4">
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
            <div className="space-y-1.5">
                <Label>Địa chỉ</Label>
                <Input
                    placeholder="Số nhà, ngõ, đường..."
                    value={values.address}
                    onChange={e => set("address", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Số khai báo cư trú</Label>
                <Input
                    placeholder="Số khai báo tạm trú/thường trú do công an cấp (nếu có)"
                    value={values.residenceDeclarationNumber}
                    onChange={e =>
                        set("residenceDeclarationNumber", e.target.value)
                    }
                />
            </div>
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
