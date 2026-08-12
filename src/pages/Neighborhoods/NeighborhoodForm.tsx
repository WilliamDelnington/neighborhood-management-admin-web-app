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
import FilterableSelect from "@components/admin/FilterableSelect";
import {
    NeighborhoodInput,
    UpdateNeighborhoodInput,
} from "@service/neighborhoodApi";
import {
    fetchProvinces,
    fetchWardsByProvince,
} from "@service/administrativeDivisionApi";
import { NeighborhoodStatus, Province, Street, Ward } from "@dts";
import { fetchStreets } from "@service/streetApi";

export interface NeighborhoodFormValues {
    name: string;
    code: string;
    sequence: string;
    active: boolean;
    status: NeighborhoodStatus;
    effectiveFrom: string;
    effectiveTo: string;
    // Bat buoc luc tao (moi to dan pho phai thuoc mot phuong/xa) - xem
    // validators/neighborhood.ts o backend.
    provinceCode: string;
    provinceName: string;
    wardCode: string;
    wardName: string;
    address: string;
    description: string;
    contactPhone: string;
    notes: string;
    streetIds: string[];
    alleyDescriptions: string;
    boundaryType: "NONE" | "DOCUMENT" | "GEOJSON";
}

export const EMPTY_NEIGHBORHOOD_FORM: NeighborhoodFormValues = {
    name: "",
    code: "",
    sequence: "",
    active: true,
    status: "ACTIVE",
    effectiveFrom: "",
    effectiveTo: "",
    provinceCode: "",
    provinceName: "",
    wardCode: "",
    wardName: "",
    address: "",
    description: "",
    contactPhone: "",
    notes: "",
    streetIds: [],
    alleyDescriptions: "",
    boundaryType: "NONE",
};

export function toNeighborhoodInput(
    values: NeighborhoodFormValues,
): NeighborhoodInput {
    return {
        name: values.name.trim(),
        code: values.code.trim(),
        sequence: Number(values.sequence),
        active: values.status === "ACTIVE",
        status: values.status,
        effectiveFrom: values.effectiveFrom || undefined,
        effectiveTo: values.effectiveTo || undefined,
        provinceCode: values.provinceCode
            ? Number(values.provinceCode)
            : undefined,
        provinceName: values.provinceName || undefined,
        wardCode: values.wardCode ? Number(values.wardCode) : undefined,
        wardName: values.wardName || undefined,
        address: values.address.trim() || undefined,
        description: values.description.trim() || undefined,
        contactPhone: values.contactPhone.trim() || undefined,
        notes: values.notes.trim() || undefined,
        streetIds: values.streetIds,
        alleyDescriptions: values.alleyDescriptions
            .split("\n")
            .map(value => value.trim())
            .filter(Boolean),
        boundaryType: values.boundaryType,
    };
}

// code/sequence la bat bien sau khi tao - khong gui len khi cap nhat (API se
// bo qua neu co gui, nhung tot hon la khong dua vao payload).
export function toUpdateNeighborhoodInput(
    values: NeighborhoodFormValues,
): UpdateNeighborhoodInput {
    return {
        name: values.name.trim(),
        active: values.status === "ACTIVE",
        status: values.status,
        effectiveFrom: values.effectiveFrom || undefined,
        effectiveTo: values.effectiveTo || undefined,
        provinceCode: values.provinceCode
            ? Number(values.provinceCode)
            : undefined,
        provinceName: values.provinceName || undefined,
        wardCode: values.wardCode ? Number(values.wardCode) : undefined,
        wardName: values.wardName || undefined,
        address: values.address.trim() || undefined,
        description: values.description.trim() || undefined,
        contactPhone: values.contactPhone.trim() || undefined,
        notes: values.notes.trim() || undefined,
        streetIds: values.streetIds,
        alleyDescriptions: values.alleyDescriptions
            .split("\n")
            .map(value => value.trim())
            .filter(Boolean),
        boundaryType: values.boundaryType,
    };
}

export function isNeighborhoodFormValid(
    values: NeighborhoodFormValues,
    mode: "create" | "edit",
): boolean {
    if (!values.name.trim()) return false;
    if (mode === "create") {
        if (!values.code.trim()) return false;
        const sequence = Number(values.sequence);
        if (!Number.isInteger(sequence) || sequence <= 0) return false;
        // Chi bat buoc luc tao - to dan pho da co tu truoc co the chua co
        // phuong/xa, khong chan sua cac truong khac cua ho (xem
        // validators/neighborhood.ts o backend).
        if (!values.provinceCode || !values.wardCode) return false;
    }
    return true;
}

interface NeighborhoodFormProps {
    values: NeighborhoodFormValues;
    onChange: (values: NeighborhoodFormValues) => void;
    mode?: "create" | "edit";
}

/**
 * Bo truong dung chung cho tao moi/chinh sua to dan pho. Ma va so thu tu chi
 * duoc nhap luc tao moi - bat bien sau do (khoa o che do edit).
 */
const NeighborhoodForm: React.FC<NeighborhoodFormProps> = ({
    values,
    onChange,
    mode = "create",
}) => {
    const set = <K extends keyof NeighborhoodFormValues>(
        key: K,
        value: NeighborhoodFormValues[K],
    ) => onChange({ ...values, [key]: value });

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [streets, setStreets] = useState<Street[]>([]);

    useEffect(() => {
        fetchProvinces()
            .then(setProvinces)
            .catch(() => setProvinces([]));
    }, []);

    useEffect(() => {
        fetchStreets({ active: true, limit: 200 })
            .then(result => setStreets(result.items))
            .catch(() => setStreets([]));
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

    return (
        <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
                <Label>Tên tổ dân phố</Label>
                <Input
                    placeholder="VD: Tổ dân phố 01"
                    value={values.name}
                    onChange={e => set("name", e.target.value)}
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Mã tổ dân phố</Label>
                    <Input
                        placeholder="VD: TDP-01"
                        value={values.code}
                        disabled={mode === "edit"}
                        onChange={e => set("code", e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Số thứ tự</Label>
                    <Input
                        type="number"
                        placeholder="1"
                        value={values.sequence}
                        disabled={mode === "edit"}
                        onChange={e => set("sequence", e.target.value)}
                    />
                </div>
            </div>
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
                disabled={!values.provinceCode}
            />
            <div className="space-y-1.5">
                <Label>Địa chỉ</Label>
                <Input
                    placeholder="Địa chỉ nhà văn hóa / trụ sở tổ dân phố"
                    value={values.address}
                    onChange={e => set("address", e.target.value)}
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Hiệu lực từ</Label>
                    <Input
                        type="date"
                        value={values.effectiveFrom}
                        onChange={e => set("effectiveFrom", e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Hiệu lực đến</Label>
                    <Input
                        type="date"
                        value={values.effectiveTo}
                        onChange={e => set("effectiveTo", e.target.value)}
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select
                    value={values.status}
                    onValueChange={value =>
                        set("status", value as NeighborhoodStatus)
                    }
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                        <SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem>
                        <SelectItem value="MERGED">Đã sáp nhập</SelectItem>
                        <SelectItem value="CLOSED">Đã giải thể</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Tuyến đường phụ trách</Label>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-divider_01 p-3">
                    {streets.length === 0 && (
                        <p className="text-xs text-text_2">Chưa có tuyến đường để chọn</p>
                    )}
                    {streets.map(street => (
                        <label key={street._id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={values.streetIds.includes(street._id)}
                                onCheckedChange={checked =>
                                    set(
                                        "streetIds",
                                        checked === true
                                            ? [...values.streetIds, street._id]
                                            : values.streetIds.filter(id => id !== street._id),
                                    )
                                }
                            />
                            {street.name} ({street.code})
                        </label>
                    ))}
                </div>
            </div>
            <div className="space-y-1.5">
                <Label>Hẻm/ngõ phụ trách</Label>
                <Textarea
                    placeholder="Mỗi hẻm/ngõ một dòng"
                    value={values.alleyDescriptions}
                    onChange={e => set("alleyDescriptions", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Dữ liệu ranh giới</Label>
                <Select
                    value={values.boundaryType}
                    onValueChange={value =>
                        set(
                            "boundaryType",
                            value as NeighborhoodFormValues["boundaryType"],
                        )
                    }
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="NONE">Chưa có</SelectItem>
                        <SelectItem value="DOCUMENT">Theo hồ sơ đính kèm</SelectItem>
                        {values.boundaryType === "GEOJSON" && (
                            <SelectItem value="GEOJSON">Đã có dữ liệu GIS</SelectItem>
                        )}
                    </SelectContent>
                </Select>
                <p className="text-xs text-text_2">
                    Hiện chưa cần GIS: có thể dùng danh sách tuyến, hẻm/ngõ và hồ sơ ranh giới đính kèm.
                </p>
            </div>
            <div className="space-y-1.5">
                <Label>Số điện thoại liên hệ</Label>
                <Input
                    value={values.contactPhone}
                    onChange={e => set("contactPhone", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Mô tả</Label>
                <Textarea
                    value={values.description}
                    onChange={e => set("description", e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label>Ghi chú</Label>
                <Textarea
                    value={values.notes}
                    onChange={e => set("notes", e.target.value)}
                />
            </div>
        </div>
    );
};

export default NeighborhoodForm;
