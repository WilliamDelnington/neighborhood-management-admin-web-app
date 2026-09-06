import React, { useState } from "react";
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
import { AppError } from "@dts";
import {
    BusinessColumnMapping,
    BusinessImportPreviewRow,
    ImportJob,
    uploadBusinessImportFile,
    applyBusinessImportMapping,
    commitBusinessImport,
} from "@service/importApi";

interface BusinessImportSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImported: () => void;
}

const NONE_VALUE = "__none__";

// Nhan hien thi cho tung truong co the mapping - "required" chi ap dung cho
// "name" ("Tên hộ kinh doanh") va "houseCode" ("Mã nhà" - phai khop mot nha
// da ton tai trong he thong), con lai deu tuy chon (bo qua = khong dung cot
// nao, xem businessImportMappingSchema o backend).
const BUSINESS_MAPPING_FIELDS: {
    key: keyof BusinessColumnMapping;
    label: string;
    required?: boolean;
}[] = [
    { key: "name", label: "Tên hộ kinh doanh", required: true },
    { key: "houseCode", label: "Mã nhà", required: true },
    { key: "businessTypeName", label: "Loại hình kinh doanh" },
    { key: "ownerName", label: "Chủ hộ kinh doanh" },
    { key: "taxCode", label: "Mã số thuế" },
    { key: "phone", label: "Số điện thoại" },
    { key: "active", label: "Trạng thái" },
    { key: "note", label: "Ghi chú" },
];

type MappingForm = Record<keyof BusinessColumnMapping, string>;

const EMPTY_MAPPING: MappingForm = BUSINESS_MAPPING_FIELDS.reduce(
    (acc, f) => ({ ...acc, [f.key]: "" }),
    {} as MappingForm,
);

const BusinessImportSheet: React.FC<BusinessImportSheetProps> = ({
    open,
    onOpenChange,
    onImported,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [job, setJob] = useState<ImportJob<BusinessImportPreviewRow> | null>(
        null,
    );
    const [mapping, setMapping] = useState<MappingForm>(EMPTY_MAPPING);
    const [showMapping, setShowMapping] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [committing, setCommitting] = useState(false);

    const reset = () => {
        setFile(null);
        setJob(null);
        setMapping(EMPTY_MAPPING);
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
            const result = await uploadBusinessImportFile(file);
            setJob(result);
            const suggested = { ...EMPTY_MAPPING };
            BUSINESS_MAPPING_FIELDS.forEach(f => {
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
        if (!job || !mapping.name || !mapping.houseCode) return;
        try {
            setApplying(true);
            const payload: Partial<
                Record<keyof BusinessColumnMapping, string>
            > = {
                name: mapping.name,
                houseCode: mapping.houseCode,
            };
            BUSINESS_MAPPING_FIELDS.forEach(f => {
                if (f.required) return;
                if (mapping[f.key]) payload[f.key] = mapping[f.key];
            });

            const result = await applyBusinessImportMapping(
                job._id,
                payload as BusinessColumnMapping,
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
            const result = await commitBusinessImport(job._id);
            toast.success(
                `Đã nhập thành công ${result.committedCount} hộ kinh doanh`,
            );
            reset();
            onOpenChange(false);
            onImported();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setCommitting(false);
        }
    };

    const canApplyMapping = !!mapping.name && !!mapping.houseCode;
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
                    <SheetTitle>Nhập hộ kinh doanh từ Excel</SheetTitle>
                </SheetHeader>
                <div className="flex-1 space-y-4 overflow-y-auto py-4">
                    {!job && (
                        <>
                            <div className="rounded-lg border border-divider_01 bg-surface_2 p-3 text-xs text-text_2">
                                Tải lên file Excel bất kỳ có dòng tiêu đề ở
                                hàng đầu tiên. Sau khi tải lên, bạn sẽ chọn cột
                                nào tương ứng với &quot;Tên hộ kinh
                                doanh&quot;, &quot;Mã nhà&quot;... — không cần
                                tên cột phải khớp chính xác. Cột &quot;Mã
                                nhà&quot; phải khớp với mã một nhà số ĐÃ có
                                sẵn trong hệ thống (hệ thống không tự tạo nhà
                                mới từ import này).
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
                                {job.headers.join(", ")}. &quot;Tên hộ kinh
                                doanh&quot; và &quot;Mã nhà&quot; là bắt buộc —
                                các trường khác có thể để &quot;Không dùng&quot;
                                nếu file không có cột tương ứng.
                            </div>

                            {BUSINESS_MAPPING_FIELDS.map(f => (
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
                                            <TableHead>Tên hộ kinh doanh</TableHead>
                                            <TableHead>Mã nhà</TableHead>
                                            <TableHead>Loại hình</TableHead>
                                            <TableHead>Mã số thuế</TableHead>
                                            <TableHead>SĐT</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {job.previewData.map((row, idx) => (
                                            // eslint-disable-next-line react/no-array-index-key
                                            <TableRow key={`${row.houseCode}-${idx}`}>
                                                <TableCell className="text-center text-text_2">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {row.name}
                                                </TableCell>
                                                <TableCell>
                                                    {row.houseCode}
                                                </TableCell>
                                                <TableCell>
                                                    {row.businessTypeName || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {row.taxCode || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {row.phone || "—"}
                                                </TableCell>
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
                            Xác nhận nhập {job.validRows} hộ kinh doanh
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default BusinessImportSheet;
