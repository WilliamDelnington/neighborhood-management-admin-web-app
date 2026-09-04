import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, ArrowLeftRight } from "lucide-react";
import { Button } from "@components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@components/ui/sheet";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import { Badge } from "@components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@components/ui/table";
import { AppError, Neighborhood } from "@dts";
import { fetchNeighborhoods } from "@service/neighborhoodApi";
import {
    HouseColumnMapping,
    HouseImportPreviewRow,
    ImportJob,
    uploadHouseImportFile,
    applyHouseImportMapping,
    commitHouseImport,
} from "@service/importApi";

interface HouseImportSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImported: () => void;
}

const NONE_VALUE = "__none__";

// Nhan hien thi cho tung truong co the mapping - "required" chi ap dung cho
// "code" ("Mã căn/hộ"), con lai deu tuy chon (bo qua = khong dung cot nao,
// xem houseImportMappingSchema o backend).
const HOUSE_MAPPING_FIELDS: {
    key: keyof HouseColumnMapping;
    label: string;
    required?: boolean;
}[] = [
    { key: "code", label: "Mã căn/hộ", required: true },
    { key: "subZone", label: "Phân khu/dãy" },
    { key: "ownerName", label: "Chủ sở hữu đứng tên" },
    { key: "ownerPhone", label: "SĐT chủ sở hữu" },
    { key: "headOfHousehold", label: "Chủ hộ/người đang sử dụng" },
    { key: "contactPhone", label: "SĐT/Zalo liên hệ" },
    { key: "usageType", label: "Loại hình sử dụng" },
    { key: "residenceStatus", label: "Tình trạng cư trú" },
    { key: "hasBusiness", label: "Có kinh doanh" },
    { key: "memberCount", label: "Số nhân khẩu" },
    { key: "landStatus", label: "Trạng thái đất" },
    { key: "lotCodeCrossCheck", label: "Đối chiếu mã lô" },
    { key: "note", label: "Ghi chú" },
];

type MappingForm = Record<keyof HouseColumnMapping, string>;

const EMPTY_MAPPING: MappingForm = HOUSE_MAPPING_FIELDS.reduce(
    (acc, f) => ({ ...acc, [f.key]: "" }),
    {} as MappingForm,
);

const HouseImportSheet: React.FC<HouseImportSheetProps> = ({
    open,
    onOpenChange,
    onImported,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [job, setJob] = useState<ImportJob<HouseImportPreviewRow> | null>(
        null,
    );
    const [mapping, setMapping] = useState<MappingForm>(EMPTY_MAPPING);
    const [defaultCluster, setDefaultCluster] = useState("");
    const [neighborhoodId, setNeighborhoodId] = useState("");
    const [createHouseholds, setCreateHouseholds] = useState(false);
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [showMapping, setShowMapping] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [committing, setCommitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        fetchNeighborhoods({ active: true, limit: 200 })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setNeighborhoods([]));
    }, [open]);

    const reset = () => {
        setFile(null);
        setJob(null);
        setMapping(EMPTY_MAPPING);
        setDefaultCluster("");
        setNeighborhoodId("");
        setCreateHouseholds(false);
        setShowMapping(false);
        setUploading(false);
        setApplying(false);
        setCommitting(false);
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setJob(null);
        setMapping(EMPTY_MAPPING);
        setShowMapping(false);
        setFile(e.target.files?.[0] || null);
    };

    const handleUpload = async () => {
        if (!file) return;
        try {
            setUploading(true);
            const result = await uploadHouseImportFile(file);
            setJob(result);
            const suggested = { ...EMPTY_MAPPING };
            HOUSE_MAPPING_FIELDS.forEach(f => {
                suggested[f.key] = result.suggestedMapping[f.key] || "";
            });
            setMapping(suggested);
            setShowMapping(true);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploading(false);
        }
    };

    const handleApplyMapping = async () => {
        if (!job || !mapping.code) return;
        try {
            setApplying(true);
            const payload: Partial<Record<keyof HouseColumnMapping, string>> =
                { code: mapping.code };
            HOUSE_MAPPING_FIELDS.forEach(f => {
                if (f.key === "code") return;
                if (mapping[f.key]) payload[f.key] = mapping[f.key];
            });
            if (defaultCluster.trim()) {
                payload.defaultCluster = defaultCluster.trim();
            }
            if (neighborhoodId) payload.neighborhoodId = neighborhoodId;

            const finalPayload: HouseColumnMapping = {
                ...(payload as HouseColumnMapping),
                ...(createHouseholds ? { createHouseholds: true } : {}),
            };

            const result = await applyHouseImportMapping(
                job._id,
                finalPayload,
            );
            setJob(result);
            setShowMapping(false);
            if (result.rowErrors.length > 0) {
                toast.error(
                    `Có ${result.rowErrors.length} dòng không hợp lệ, vui lòng kiểm tra lại`,
                );
            } else {
                toast.success(
                    `Đã kiểm tra ${result.validRows} dòng, sẵn sàng để nhập`,
                );
            }
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setApplying(false);
        }
    };

    const handleCommit = async () => {
        if (!job) return;
        try {
            setCommitting(true);
            const result = await commitHouseImport(job._id);
            toast.success(`Đã nhập thành công ${result.committedCount} nhà số`);
            reset();
            onOpenChange(false);
            onImported();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setCommitting(false);
        }
    };

    const canApplyMapping = !!mapping.code;
    const canCommit =
        !!job &&
        !showMapping &&
        job.status !== "committed" &&
        job.status !== "awaiting_mapping" &&
        job.rowErrors.length === 0;

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent className="flex w-full flex-col sm:max-w-3xl lg:max-w-[calc(100vw-320px)]">
                <SheetHeader>
                    <SheetTitle>Nhập nhà số từ Excel</SheetTitle>
                </SheetHeader>
                <div className="flex-1 space-y-4 overflow-y-auto py-4">
                    {!job && (
                        <>
                            <div className="rounded-lg border border-divider_01 bg-surface_2 p-3 text-xs text-text_2">
                                Tải lên file Excel bất kỳ có dòng tiêu đề ở
                                hàng đầu tiên. Sau khi tải lên, bạn sẽ chọn cột
                                nào tương ứng với &quot;Mã căn/hộ&quot;,
                                &quot;Chủ sở hữu đứng tên&quot;, &quot;SĐT chủ
                                sở hữu&quot;... — không cần tên cột phải khớp
                                chính xác. Mã căn/hộ được giữ nguyên làm mã
                                nhà (không tự sinh mã). Nếu chủ sở hữu có cả
                                tên và số điện thoại hợp lệ, hệ thống sẽ tạo
                                luôn tài khoản chủ nhà.
                            </div>
                            <div>
                                <input
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-text_1 file:mr-3 file:rounded-lg file:border-0 file:bg-main file:px-3 file:py-2 file:text-sm file:text-white"
                                />
                            </div>
                        </>
                    )}

                    {job && showMapping && (
                        <div className="space-y-4">
                            <div className="rounded-lg border border-divider_01 bg-surface_2 p-3 text-xs text-text_2">
                                Đã đọc {job.totalRows} dòng dữ liệu với các cột:{" "}
                                {job.headers.join(", ")}. Chỉ &quot;Mã
                                căn/hộ&quot; là bắt buộc — các trường khác có
                                thể để &quot;Không dùng&quot; nếu file không
                                có cột tương ứng.
                            </div>

                            {HOUSE_MAPPING_FIELDS.map(f => (
                                <div key={f.key} className="space-y-1">
                                    <label
                                        htmlFor={`mapping-${f.key}`}
                                        className="text-sm font-medium"
                                    >
                                        Cột &quot;{f.label}&quot;
                                        {f.required && (
                                            <span className="text-red-500">
                                                {" "}
                                                *
                                            </span>
                                        )}
                                    </label>
                                    <Select
                                        value={mapping[f.key] || NONE_VALUE}
                                        onValueChange={v =>
                                            setMapping(prev => ({
                                                ...prev,
                                                [f.key]:
                                                    v === NONE_VALUE ? "" : v,
                                            }))
                                        }
                                    >
                                        <SelectTrigger id={`mapping-${f.key}`}>
                                            <SelectValue placeholder="Chọn cột..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {!f.required && (
                                                <SelectItem value={NONE_VALUE}>
                                                    Không dùng
                                                </SelectItem>
                                            )}
                                            {job.headers.map(h => (
                                                <SelectItem key={h} value={h}>
                                                    {h}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}

                            <div className="space-y-1 border-t border-divider_01 pt-4">
                                <Label>Cụm dân cư mặc định (nếu có)</Label>
                                <Input
                                    placeholder="Dùng khi cột 'Phân khu/dãy' để trống ở một số dòng"
                                    value={defaultCluster}
                                    onChange={e =>
                                        setDefaultCluster(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Tổ dân phố (nếu có)</Label>
                                <Select
                                    value={neighborhoodId || NONE_VALUE}
                                    onValueChange={v =>
                                        setNeighborhoodId(
                                            v === NONE_VALUE ? "" : v,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn tổ dân phố..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE_VALUE}>
                                            Không gán
                                        </SelectItem>
                                        {neighborhoods.map(n => (
                                            <SelectItem key={n._id} value={n._id}>
                                                {n.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <label
                                htmlFor="createHouseholds"
                                className="flex items-start gap-2 rounded-lg border border-divider_01 bg-surface_2 p-3 text-sm"
                            >
                                <Checkbox
                                    id="createHouseholds"
                                    checked={createHouseholds}
                                    onCheckedChange={checked =>
                                        setCreateHouseholds(checked === true)
                                    }
                                />
                                <span>
                                    Cũng tạo hộ dân từ dữ liệu này
                                    <span className="mt-0.5 block text-xs font-normal text-text_2">
                                        Với mỗi dòng có &quot;Chủ hộ/người
                                        đang sử dụng&quot;, tạo thêm một hộ
                                        dân liên kết với nhà số đó. Chỉ bật
                                        khi file thực sự có dữ liệu hộ dân
                                        (không chỉ dữ liệu nhà).
                                    </span>
                                </span>
                            </label>
                        </div>
                    )}

                    {job && !showMapping && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span>
                                    Tổng {job.totalRows} dòng — hợp lệ{" "}
                                    {job.validRows} — lỗi{" "}
                                    {job.rowErrors.length}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowMapping(true)}
                                >
                                    <ArrowLeftRight className="mr-1 h-3.5 w-3.5" />
                                    Chọn lại cột
                                </Button>
                            </div>

                            {job.rowErrors.length > 0 && (
                                <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                                    {job.rowErrors.map(e => (
                                        <div key={e.row}>
                                            Dòng {e.row}: {e.message}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {job.previewData.length > 0 && (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12 text-center">STT</TableHead>
                                            <TableHead>Mã nhà</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Cụm dân cư</TableHead>
                                            <TableHead>Chủ sở hữu</TableHead>
                                            <TableHead>SĐT chủ sở hữu</TableHead>
                                            <TableHead>Tạo tài khoản</TableHead>
                                            {createHouseholds && (
                                                <>
                                                    <TableHead>Chủ hộ dân</TableHead>
                                                    <TableHead>SĐT hộ dân</TableHead>
                                                    <TableHead>Có kinh doanh</TableHead>
                                                </>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {job.previewData.map((row, idx) => (
                                            // eslint-disable-next-line react/no-array-index-key
                                            <TableRow key={`${row.code}-${idx}`}>
                                                <TableCell className="text-center text-text_2">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {row.code}
                                                </TableCell>
                                                <TableCell>
                                                    {row.existingHouseId ? (
                                                        <Badge tone="blue">
                                                            Cập nhật
                                                        </Badge>
                                                    ) : (
                                                        <Badge tone="green">
                                                            Mới
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {row.cluster || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {row.ownerName || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {row.ownerPhone || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {row.ownerName &&
                                                    row.ownerPhone
                                                        ? "Có"
                                                        : "Không"}
                                                </TableCell>
                                                {createHouseholds && (
                                                    <>
                                                        <TableCell>
                                                            {row.householdHeadOfHousehold ||
                                                                "—"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {row.householdPhone ||
                                                                "—"}
                                                        </TableCell>
                                                        <TableCell>
                                                            {row.hasBusinessSignal ? (
                                                                <Badge tone="yellow">
                                                                    Có
                                                                </Badge>
                                                            ) : (
                                                                "Không"
                                                            )}
                                                        </TableCell>
                                                    </>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    )}
                </div>
                <SheetFooter className="flex-col gap-2">
                    {!job && (
                        <Button
                            className="w-full"
                            disabled={!file}
                            loading={uploading}
                            onClick={handleUpload}
                        >
                            <UploadCloud className="mr-1 h-4 w-4" />
                            Tải lên
                        </Button>
                    )}
                    {job && showMapping && (
                        <Button
                            className="w-full"
                            disabled={!canApplyMapping}
                            loading={applying}
                            onClick={handleApplyMapping}
                        >
                            Xem trước
                        </Button>
                    )}
                    {job && !showMapping && (
                        <Button
                            className="w-full"
                            disabled={!canCommit}
                            loading={committing}
                            onClick={handleCommit}
                        >
                            Xác nhận nhập {job.validRows} nhà số
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default HouseImportSheet;
