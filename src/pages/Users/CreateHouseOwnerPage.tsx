import React, { useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { AppError } from "@dts";
import { createHouseOwner } from "@service/userApi";

type FormState = {
    phone: string;
    displayName: string;
    address: string;
};

const EMPTY_FORM: FormState = {
    phone: "",
    displayName: "",
    address: "",
};

const CreateHouseOwnerPage: React.FC = () => (
    <AdminGuard permissions={["users.create"]}>
        <CreateHouseOwnerContent />
    </AdminGuard>
);

/**
 * Man rieng (khong dung chung UserListPage - trang do doi hoi quyen
 * "users.read", von liet ke TOAN BO tai khoan he thong khong loc theo to dan
 * pho) de to truong tao tai khoan chu ho ma khong bi cap them quyen xem het
 * moi nguoi dung. Chu ho mo Mini App va cho phep Zalo chia se so dien thoai;
 * backend se lien ket Zalo identity voi tai khoan duoc tao truoc o day.
 */
const CreateHouseOwnerContent: React.FC = () => {
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [lastCreatedPhone, setLastCreatedPhone] = useState<string | null>(null);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const isValid =
        form.phone.trim().length > 0 &&
        form.displayName.trim().length > 0;

    const handleCreate = async () => {
        if (!isValid) {
            toast.error(
                "Vui lòng nhập đầy đủ số điện thoại và họ tên",
            );
            return;
        }
        try {
            setSaving(true);
            await createHouseOwner({
                phone: form.phone.trim(),
                displayName: form.displayName.trim(),
                address: form.address.trim() || undefined,
            });
            toast.success("Đã tạo tài khoản chủ hộ mới");
            setLastCreatedPhone(form.phone.trim());
            setForm(EMPTY_FORM);
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-lg">
            <h1 className="mb-4 text-lg font-semibold">Tạo tài khoản chủ hộ</h1>

            {lastCreatedPhone && (
                <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    Đã tạo tài khoản với số điện thoại <strong>{lastCreatedPhone}</strong>.
                    Chủ hộ có thể mở Mini App và cho phép Zalo chia sẻ số điện thoại
                    này để đăng nhập; không cần mật khẩu.
                </div>
            )}

            <div className="rounded-2xl border border-divider_01 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                        <Label>Số điện thoại</Label>
                        <Input
                            placeholder="VD: 0912345678"
                            value={form.phone}
                            onChange={e => set("phone", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Họ tên chủ hộ</Label>
                        <Input
                            placeholder="VD: Nguyễn Văn A"
                            value={form.displayName}
                            onChange={e => set("displayName", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Địa chỉ (tùy chọn)</Label>
                        <Input
                            value={form.address}
                            onChange={e => set("address", e.target.value)}
                        />
                    </div>
                </div>
                <Button
                    className="mt-5 w-full"
                    loading={saving}
                    disabled={!isValid}
                    onClick={handleCreate}
                >
                    Tạo tài khoản
                </Button>
            </div>
        </div>
    );
};

export default CreateHouseOwnerPage;
