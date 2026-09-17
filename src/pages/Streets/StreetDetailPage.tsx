import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@components/ui/dialog";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import { usePermission } from "@store/authStore";
import { AppError, Street } from "@dts";
import { deleteStreet, fetchStreetById, updateStreet } from "@service/streetApi";
import StreetForm, {
    StreetFormValues,
    isStreetFormValid,
    toUpdateStreetInput,
} from "./StreetForm";

const toFormValues = (s: Street): StreetFormValues => ({
    name: s.name,
    code: s.code,
    active: s.active,
});

const StreetDetailPage: React.FC = () => (
    <AdminGuard permissions={["streets.read"]}>
        <StreetDetailContent />
    </AdminGuard>
);

const StreetDetailContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const canManage = usePermission("streets.manage");

    const [street, setStreet] = useState<Street | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<StreetFormValues | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const load = () => {
        if (!id) return;
        setLoading(true);
        setError(false);
        fetchStreetById(id)
            .then(s => {
                setStreet(s);
                setForm(toFormValues(s));
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSave = async () => {
        if (!id || !form) return;
        if (!isStreetFormValid(form, "edit")) {
            toast.error("Vui lòng nhập tên đường/phố");
            return;
        }
        try {
            setSaving(true);
            const updated = await updateStreet(id, toUpdateStreetInput(form));
            setStreet(updated);
            setForm(toFormValues(updated));
            setEditing(false);
            toast.success("Đã cập nhật đường/phố");
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        try {
            setDeleting(true);
            await deleteStreet(id);
            toast.success("Đã xóa đường/phố");
            navigate("/streets");
        } catch (err) {
            toast.error((err as AppError).message);
            setConfirmDelete(false);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/streets")}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">Đường / phố</h1>
            </div>

            {loading && <LoadingState />}
            {!loading && error && <ErrorState onRetry={load} />}

            {!loading && !error && street && form && (
                <div className="rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            {street.code} — {street.name}
                        </h2>
                        <Badge tone={street.active ? "green" : "gray"}>
                            {street.active ? "Đang hoạt động" : "Ngừng hoạt động"}
                        </Badge>
                    </div>

                    {editing ? (
                        <>
                            <StreetForm values={form} onChange={setForm} mode="edit" />
                            <div className="mt-4 flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setForm(toFormValues(street));
                                        setEditing(false);
                                    }}
                                >
                                    Hủy
                                </Button>
                                <Button loading={saving} onClick={handleSave}>
                                    Lưu
                                </Button>
                            </div>
                        </>
                    ) : (
                        canManage && (
                            <div className="mt-4 flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditing(true)}
                                >
                                    Chỉnh sửa
                                </Button>
                                <Button
                                    variant="outline"
                                    className="!text-red-500"
                                    onClick={() => setConfirmDelete(true)}
                                >
                                    Xóa
                                </Button>
                            </div>
                        )
                    )}
                </div>
            )}

            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xóa đường/phố</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc muốn xóa &quot;{street?.name}&quot;?
                            Thao tác này không thể hoàn tác. Đường/phố đang
                            được sử dụng bởi nhà, hộ khẩu, doanh nghiệp hoặc
                            tổ dân phố sẽ không thể xóa được.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDelete(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            loading={deleting}
                            onClick={handleDelete}
                        >
                            Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StreetDetailPage;
