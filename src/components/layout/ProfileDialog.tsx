import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { Badge } from "@components/ui/badge";
import { useAuthStore } from "@store/authStore";
import { ROLE_LABEL, USER_STATUS_LABEL, USER_STATUS_TONE } from "@constants/domain";

export interface ProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({
    label,
    value,
}) => (
    <div className="flex items-start justify-between gap-4 border-b border-divider_02 py-2.5 text-sm last:border-0">
        <span className="text-text_2">{label}</span>
        <span className="text-right font-medium text-text_1">{value}</span>
    </div>
);

/** Xem thong tin tai khoan cua chinh minh - chi doc, dung du lieu da co san
 * trong authStore (khong goi API rieng). */
const ProfileDialog: React.FC<ProfileDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const user = useAuthStore(state => state.user);
    if (!user) return null;

    const roleNames = user.roles
        .map(role => user.roleLabels?.[role] || ROLE_LABEL[role] || role)
        .join(", ");
    const scope =
        user.wardName ||
        (user.assignedNeighborhoodIds.length > 0
            ? `${user.assignedNeighborhoodIds.length} tổ dân phố được phân công`
            : null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Hồ sơ của tôi</DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-3 pb-2">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue_10 text-lg font-semibold text-main">
                        {user.displayName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-text_1">
                            {user.displayName}
                        </p>
                        <p className="text-sm text-text_2">{roleNames}</p>
                    </div>
                </div>
                <div className="rounded-lg border border-divider_01 px-3">
                    <InfoRow
                        label="Số điện thoại"
                        value={user.phone || "Chưa có"}
                    />
                    {user.email && (
                        <InfoRow label="Email" value={user.email} />
                    )}
                    {user.address && (
                        <InfoRow label="Địa chỉ" value={user.address} />
                    )}
                    {scope && <InfoRow label="Phạm vi phụ trách" value={scope} />}
                    <InfoRow
                        label="Trạng thái tài khoản"
                        value={
                            <Badge tone={USER_STATUS_TONE[user.status]}>
                                {USER_STATUS_LABEL[user.status]}
                            </Badge>
                        }
                    />
                    {user.createdAt && (
                        <InfoRow
                            label="Ngày tạo tài khoản"
                            value={new Date(user.createdAt).toLocaleDateString(
                                "vi-VN",
                            )}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileDialog;
