import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { LoadingState, ErrorState } from "@components/admin/DataStates";
import { usePermission } from "@store/authStore";
import { AppError, Street } from "@dts";
import { fetchStreetById, updateStreet } from "@service/streetApi";
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
                <div className="rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
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
                            <div className="mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditing(true)}
                                >
                                    Chỉnh sửa
                                </Button>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default StreetDetailPage;
