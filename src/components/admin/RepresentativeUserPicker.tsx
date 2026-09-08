import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { fetchUsers } from "@service/userApi";
import { User } from "@dts";
import { LoadingState, EmptyState } from "./DataStates";

export interface RepresentativeUserPickerProps {
    label?: string;
    value?: string;
    valueLabel?: string;
    onChange: (userId: string | null, user?: User) => void;
    disabled?: boolean;
    // Vai tro he thong bat buoc (business_representative/company_representative -
    // xem Business/Company.representativeUserId o backend) - bo trong = tim
    // bat ky tai khoan nao (dung cho OrganizationRepresentativePanel.tsx, mot
    // khai niem dai dien KHAC, khong lien quan he thong Role nay). house_owner
    // luon duoc tim kem, tuong thich nguoc voi du lieu cu (xem
    // houseRecordService.validateRepresentativeUser o backend).
    requiredRole?: "business_representative" | "company_representative";
}

/**
 * Chon tai khoan de lien ket lam nguoi dai dien (Business/Company.
 * representativeUserId). Khi co requiredRole: chi tim tai khoan dung vai tro
 * do (hoac house_owner, tuong thich nguoc) - khac truoc day (tim bat ky tai
 * khoan nao, khong kiem tra vai tro).
 */
const RepresentativeUserPicker: React.FC<RepresentativeUserPickerProps> = ({
    label = "Liên kết tài khoản người đại diện (nếu có)",
    value,
    valueLabel,
    onChange,
    disabled,
    requiredRole,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [items, setItems] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        const timer = setTimeout(() => {
            const request = requiredRole
                ? Promise.all([
                      fetchUsers(1, 20, search || undefined, requiredRole),
                      fetchUsers(1, 20, search || undefined, "house_owner"),
                  ]).then(([roleRes, ownerRes]) => {
                      const seen = new Set<string>();
                      return [...roleRes.items, ...ownerRes.items].filter(
                          u => (seen.has(u.id) ? false : (seen.add(u.id), true)),
                      );
                  })
                : fetchUsers(1, 20, search || undefined).then(res => res.items);
            request
                .then(setItems)
                .catch(() => setItems([]))
                .finally(() => setLoading(false));
        }, 250);
        // eslint-disable-next-line consistent-return
        return () => clearTimeout(timer);
    }, [open, search, requiredRole]);

    return (
        <div>
            <Label>{label}</Label>
            <div className="mt-1 flex items-center gap-2">
                <button
                    type="button"
                    disabled={disabled}
                    className={`flex h-9 flex-1 items-center rounded-md border border-input bg-background px-3 text-left text-sm ${
                        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    } ${value ? "" : "text-muted-foreground"}`}
                    onClick={() => setOpen(true)}
                >
                    {value ? valueLabel || value : "Chưa liên kết tài khoản..."}
                </button>
                {value && !disabled && (
                    <button
                        type="button"
                        className="text-text_3"
                        onClick={() => onChange(null)}
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Chọn tài khoản người đại diện</DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text_3" />
                        <Input
                            className="pl-9"
                            placeholder="Tìm theo tên hoặc số điện thoại..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {loading && <LoadingState />}
                        {!loading && items.length === 0 && (
                            <EmptyState label="Không tìm thấy tài khoản phù hợp" />
                        )}
                        {!loading &&
                            items.map(u => (
                                <button
                                    key={u.id}
                                    type="button"
                                    className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-ng_10"
                                    onClick={() => {
                                        onChange(u.id, u);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="font-medium">
                                        {u.displayName}
                                    </div>
                                    {u.phone && (
                                        <div className="text-xs text-text_2">
                                            {u.phone}
                                        </div>
                                    )}
                                </button>
                            ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RepresentativeUserPicker;
