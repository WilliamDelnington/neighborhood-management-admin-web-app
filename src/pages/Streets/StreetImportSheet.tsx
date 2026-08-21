import React, { useState } from "react";
import { toast } from "sonner";
import { UploadCloud, ArrowLeftRight, FileDown } from "lucide-react";
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
import { Badge } from "@components/ui/badge";
import { AppError } from "@dts";
import {
    ImportJob,
    uploadStreetImportFile,
    applyStreetImportMapping,
    commitStreetImport,
    downloadStreetImportTemplate,
} from "@service/importApi";

interface StreetImportSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImported: () => void;
}

const NONE_VALUE = "__none__";

interface MappingForm {
    name: string;
    code: string;
    active: string;
}

const EMPTY_MAPPING: MappingForm = { name: "", code: "", active: "" };

const StreetImportSheet: React.FC<StreetImportSheetProps> = ({
    open,
    onOpenChange,
    onImported,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [job, setJob] = useState<ImportJob | null>(null);
    const [mapping, setMapping] = useState<MappingForm>(EMPTY_MAPPING);
    const [showMapping, setShowMapping] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
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

    const handleDownloadTemplate = async () => {
        try {
            setDownloadingTemplate(true);
            await downloadStreetImportTemplate();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setDownloadingTemplate(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        try {
            setUploading(true);
            const result = await uploadStreetImportFile(file);
            setJob(result);
            setMapping({
                name: result.suggestedMapping.name || "",
                code: result.suggestedMapping.code || "",
                active: result.suggestedMapping.active || "",
            });
            setShowMapping(true);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setUploading(false);
        }
    };

    const handleApplyMapping = async () => {
        if (!job || !mapping.name) return;
        try {
            setApplying(true);
            const result = await applyStreetImportMapping(job._id, {
                name: mapping.name,
                code: mapping.code || undefined,
                active: mapping.active || undefined,
            });
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
            const result = await commitStreetImport(job._id);
            toast.success(
                `Đã nhập thành công ${result.committedCount} đường/phố`,
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

    const canApplyMapping = !!mapping.name;
    const canCommit =
        !!job &&
        !showMapping &&
        job.status !== "committed" &&
        job.status !== "awaiting_mapping" &&
        job.rowErrors.length === 0;

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Nhập đường/phố từ Excel</SheetTitle>
                </SheetHeader>
                <div className="flex-1 space-y-4 overflow-y-auto py-4">
                    {!job && (
                        <>
                            <div className="rounded-lg border border-divider_01 bg-surface_2 p-3 text-xs text-text_2">
                                Tải lên file Excel bất kỳ có dòng tiêu đề ở
                                hàng đầu tiên. Sau khi tải lên, bạn sẽ chọn cột
                                nào tương ứng với tên, mã và trạng thái đường/
                                phố — không cần tên cột phải khớp chính xác.
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                loading={downloadingTemplate}
                                onClick={handleDownloadTemplate}
                            >
                                <FileDown className="mr-1 h-4 w-4" />
                                Tải mẫu Excel
                            </Button>
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
                                {job.headers.join(", ")}. Vui lòng chọn cột
                                tương ứng cho từng trường bên dưới.
                            </div>

                            <div className="space-y-1">
                                <label
                                    htmlFor="mapping-name"
                                    className="text-sm font-medium"
                                >
                                    Cột tên đường/phố{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value={mapping.name}
                                    onValueChange={v =>
                                        setMapping(prev => ({
                                            ...prev,
                                            name: v,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="mapping-name">
                                        <SelectValue placeholder="Chọn cột..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {job.headers.map(h => (
                                            <SelectItem key={h} value={h}>
                                                {h}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label
                                    htmlFor="mapping-code"
                                    className="text-sm font-medium"
                                >
                                    Cột mã đường/phố
                                </label>
                                <Select
                                    value={mapping.code || NONE_VALUE}
                                    onValueChange={v =>
                                        setMapping(prev => ({
                                            ...prev,
                                            code: v === NONE_VALUE ? "" : v,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="mapping-code">
                                        <SelectValue placeholder="Chọn cột..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE_VALUE}>
                                            Không dùng (tự sinh mã)
                                        </SelectItem>
                                        {job.headers.map(h => (
                                            <SelectItem key={h} value={h}>
                                                {h}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label
                                    htmlFor="mapping-active"
                                    className="text-sm font-medium"
                                >
                                    Cột trạng thái
                                </label>
                                <Select
                                    value={mapping.active || NONE_VALUE}
                                    onValueChange={v =>
                                        setMapping(prev => ({
                                            ...prev,
                                            active: v === NONE_VALUE ? "" : v,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="mapping-active">
                                        <SelectValue placeholder="Chọn cột..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NONE_VALUE}>
                                            Không dùng (mặc định đang hoạt động)
                                        </SelectItem>
                                        {job.headers.map(h => (
                                            <SelectItem key={h} value={h}>
                                                {h}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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
                                            <TableHead>Tên</TableHead>
                                            <TableHead>Mã</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {job.previewData.map((row, idx) => (
                                            // eslint-disable-next-line react/no-array-index-key
                                            <TableRow key={`${row.code}-${idx}`}>
                                                <TableCell className="text-center text-text_2">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell>
                                                    {row.name}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {row.code}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        tone={
                                                            row.active
                                                                ? "green"
                                                                : "gray"
                                                        }
                                                    >
                                                        {row.active
                                                            ? "Đang hoạt động"
                                                            : "Ngừng hoạt động"}
                                                    </Badge>
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
                            Xác nhận nhập {job.validRows} đường/phố
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default StreetImportSheet;
