import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
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
    HouseImportPreviewRow,
    ImportJob,
    uploadHouseImportFile,
    commitHouseImport,
} from "@service/importApi";

interface HouseImportSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImported: () => void;
}

const NONE_VALUE = "__none__";

const HouseImportSheet: React.FC<HouseImportSheetProps> = ({
    open,
    onOpenChange,
    onImported,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [defaultCluster, setDefaultCluster] = useState("");
    const [neighborhoodId, setNeighborhoodId] = useState("");
    const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
    const [job, setJob] = useState<ImportJob<HouseImportPreviewRow> | null>(
        null,
    );
    const [uploading, setUploading] = useState(false);
    const [committing, setCommitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        fetchNeighborhoods({ active: true, limit: 200 })
            .then(res => setNeighborhoods(res.items))
            .catch(() => setNeighborhoods([]));
    }, [open]);

    const reset = () => {
        setFile(null);
        setDefaultCluster("");
        setNeighborhoodId("");
        setJob(null);
        setUploading(false);
        setCommitting(false);
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setJob(null);
        setFile(e.target.files?.[0] || null);
    };

    const handleUpload = async () => {
        if (!file) return;
        try {
            setUploading(true);
            const result = await uploadHouseImportFile(file, {
                defaultCluster: defaultCluster.trim() || undefined,
                neighborhoodId: neighborhoodId || undefined,
            });
            setJob(result);
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
            setUploading(false);
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

    const canCommit =
        !!job && job.status !== "committed" && job.rowErrors.length === 0;

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Nhập nhà số từ Excel</SheetTitle>
                </SheetHeader>
                <div className="flex-1 space-y-4 overflow-y-auto py-4">
                    {!job && (
                        <>
                            <div className="rounded-lg border border-divider_01 bg-surface_2 p-3 text-xs text-text_2">
                                Dùng cho file theo mẫu &quot;Phiếu thu thập
                                thông tin hộ gia đình/căn hộ/cơ sở kinh
                                doanh&quot; (cột &quot;Mã căn/hộ&quot;,
                                &quot;Chủ sở hữu đứng tên&quot;, &quot;SĐT chủ
                                sở hữu&quot;...). Mã căn/hộ được giữ nguyên làm
                                mã nhà (không tự sinh mã). Nếu chủ sở hữu có cả
                                tên và số điện thoại hợp lệ, hệ thống sẽ tạo
                                luôn tài khoản chủ nhà.
                            </div>

                            <div className="space-y-1">
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

                            <div>
                                <Label>File Excel (.xlsx)</Label>
                                <input
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    className="mt-1 block w-full text-sm text-text_1 file:mr-3 file:rounded-lg file:border-0 file:bg-main file:px-3 file:py-2 file:text-sm file:text-white"
                                />
                            </div>
                        </>
                    )}

                    {job && (
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
                                    onClick={reset}
                                >
                                    Tải file khác
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
                                            <TableHead>Cụm dân cư</TableHead>
                                            <TableHead>Chủ sở hữu</TableHead>
                                            <TableHead>SĐT</TableHead>
                                            <TableHead>Tạo tài khoản</TableHead>
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
                                                    {row.cluster}
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
                            Tải lên và kiểm tra
                        </Button>
                    )}
                    {job && (
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
