import React, { useState } from "react";
import { toast } from "sonner";
import AdminGuard from "@components/auth/AdminGuard";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@components/ui/select";
import { useAuthStore } from "@store/authStore";
import { ROLE_LABEL } from "@constants/domain";
import { AppError } from "@dts";
import { createHouseOwner, CreatableStaffRole } from "@service/userApi";

type FormState = {
    phone: string;
    displayName: string;
    address: string;
    idNumber: string;
    password: string;
    role: CreatableStaffRole;
};

const EMPTY_FORM: FormState = {
    phone: "",
    displayName: "",
    address: "",
    idNumber: "",
    password: "",
    role: "house_owner",
};

// house_owner mo cho bat ky ai co quyen "users.create"; 3 vai tro con lai chi
// hien voi admin (backend cung tu choi neu khong phai admin - xem
// userService.createHouseOwnerByStaff) - day la cac vai tro pham vi rong (to
// truong/to pho) hoac can gan vao mot To dan pho cu the sau khi tao.
const STAFF_ONLY_ROLES: CreatableStaffRole[] = [
    "neighborhood_leader",
    "neighborhood_coleader",
    "neighborhood_collaborator",
];

const CreateHouseOwnerPage: React.FC = () => (
    <AdminGuard permissions={["users.create"]}>
        <CreateHouseOwnerContent />
    </AdminGuard>
);

/**
 * Man rieng (khong dung chung UserListPage - trang do doi hoi quyen
 * "users.read", von liet ke TOAN BO tai khoan he thong khong loc theo to dan
 * pho) de to truong/admin tao tai khoan chu ho (hoac to truong/to pho/cong
 * tac vien To dan pho, admin-only) ma khong bi cap them quyen xem het moi
 * nguoi dung.
 *
 * Tai khoan dang nhap bang chinh so dien thoai + mat khau duoc dat o day (TAM
 * THOI dung phone+password thay OTP/Zalo - dang nhap Zalo da bi go khoi
 * LoginPage.tsx theo yeu cau kiem duyet Zalo Mini App, con OTP dang cho duyet
 * mau tin eSMS/ZNS - xem LoginPage.tsx o mini app).
 *
 * Voi vai tro to truong/to pho/cong tac vien: tai khoan tao ra o day CHUA
 * duoc gan vao To dan pho nao - can lien ket rieng qua man "Gan to truong/to
 * pho/cong tac vien" tren trang chi tiet To dan pho sau khi tao.
 */
const CreateHouseOwnerContent: React.FC = () => {
    const isAdmin = useAuthStore(state => !!state.user?.roles.includes("admin"));
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [lastCreatedPhone, setLastCreatedPhone] = useState<string | null>(null);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const isValid =
        form.phone.trim().length > 0 &&
        form.displayName.trim().length > 0 &&
        form.idNumber.trim().length > 0 &&
        form.password.trim().length >= 6;

    const handleCreate = async () => {
        if (!isValid) {
            toast.error(
                "Vui lòng nhập đầy đủ số điện thoại, họ tên, số CMND/CCCD và mật khẩu (ít nhất 6 ký tự)",
            );
            return;
        }
        try {
            setSaving(true);
            await createHouseOwner({
                phone: form.phone.trim(),
                displayName: form.displayName.trim(),
                address: form.address.trim() || undefined,
                idNumber: form.idNumber.trim(),
                role: form.role,
                password: form.password.trim(),
            });
            toast.success(`Đã tạo tài khoản ${ROLE_LABEL[form.role]} mới`);
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
            <h1 className="mb-4 text-lg font-semibold">Tạo tài khoản</h1>

            {lastCreatedPhone && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    Đã tạo tài khoản với số điện thoại <strong>{lastCreatedPhone}</strong>.
                    Đăng nhập trong Mini App bằng số điện thoại và mật khẩu
                    vừa đặt.
                    {STAFF_ONLY_ROLES.includes(form.role) && (
                        <>
                            {" "}
                            Vào trang chi tiết Tổ dân phố để gán tài khoản này
                            làm {ROLE_LABEL[form.role]} của một tổ cụ thể.
                        </>
                    )}
                </div>
            )}

            <div className="rounded-lg border border-divider_01 bg-ui_bg p-5 shadow-sm">
                <div className="flex flex-col gap-4">
                    {isAdmin && (
                        <div className="space-y-1.5">
                            <Label>Vai trò</Label>
                            <Select
                                value={form.role}
                                onValueChange={v =>
                                    set("role", v as CreatableStaffRole)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="house_owner">
                                        {ROLE_LABEL.house_owner}
                                    </SelectItem>
                                    {STAFF_ONLY_ROLES.map(role => (
                                        <SelectItem key={role} value={role}>
                                            {ROLE_LABEL[role]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <Label>Số điện thoại</Label>
                        <Input
                            placeholder="VD: 0912345678"
                            autoComplete="off"
                            inputMode="numeric"
                            value={form.phone}
                            onChange={e =>
                                set("phone", e.target.value.replace(/\D/g, ""))
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Họ tên</Label>
                        <Input
                            placeholder="VD: Nguyễn Văn A"
                            autoComplete="off"
                            value={form.displayName}
                            onChange={e => set("displayName", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Địa chỉ (tùy chọn)</Label>
                        <Input
                            autoComplete="off"
                            value={form.address}
                            onChange={e => set("address", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Số CMND/CCCD</Label>
                        <Input
                            autoComplete="off"
                            value={form.idNumber}
                            onChange={e => set("idNumber", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Mật khẩu</Label>
                        <Input
                            type="password"
                            autoComplete="new-password"
                            placeholder="Ít nhất 6 ký tự"
                            value={form.password}
                            onChange={e => set("password", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Sẽ đăng nhập bằng số điện thoại + mật khẩu này.
                        </p>
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
