import React, { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@components/ui/dialog";
import { AppError, Survey } from "@dts";
import { closeSurvey, openSurvey } from "@service/surveyApi";

export const idOf = (ref?: string | { _id: string } | null): string | undefined => {
    if (!ref) return undefined;
    return typeof ref === "string" ? ref : ref._id;
};

const nameOf = (ref: string | { name?: string; displayName?: string }): string | null => {
    if (typeof ref === "string") return null;
    return ref.displayName || ref.name || null;
};

/**
 * true neu user la CHINH nguoi tao hoac dong chu bien - khong dac cach admin
 * (khac quyen sua): admin/nguoi quan ly khong gioi han mo/dong khao sat cua
 * nguoi khac se bi canh bao va nguoi tao/dong chu bien duoc thong bao.
 */
export const isSurveyCreatorOrCoEditor = (
    survey: Survey,
    userId?: string,
): boolean => {
    if (!userId) return false;
    if (idOf(survey.createdBy) === userId) return true;
    return (survey.coEditorUserIds || []).some(u => idOf(u) === userId);
};

export const surveyCreatorName = (survey: Survey): string =>
    (survey.createdBy && nameOf(survey.createdBy)) || "—";

export const surveyCoEditorNames = (survey: Survey): string[] =>
    (survey.coEditorUserIds || [])
        .map(nameOf)
        .filter((n): n is string => !!n);

export type SurveyTargetGroup = { label: string; values: string[] };

/**
 * Doi tuong tra loi cua khao sat, nhom theo loai - vai tro la dieu kien bat
 * buoc, con Tổ dân phố/Tuyến đường/Loại hình kinh doanh la "khop mot trong
 * cac nhom" (cung ngu nghia voi backend isSurveyEligible).
 */
export const surveyTargetGroups = (survey: Survey): SurveyTargetGroup[] => {
    if (survey.eligibleAll) return [];
    const names = (refs?: (string | { name: string })[]) =>
        (refs || []).map(nameOf).filter((n): n is string => !!n);
    const groups: SurveyTargetGroup[] = [
        {
            label: "Vai trò",
            values: survey.eligibleRoleNames || survey.eligibleRoles || [],
        },
        { label: "Tổ dân phố", values: names(survey.eligibleNeighborhoodIds) },
        { label: "Tuyến đường", values: names(survey.eligibleStreetIds) },
        {
            label: "Loại hình kinh doanh",
            values: names(survey.eligibleBusinessTypeIds),
        },
    ];
    return groups.filter(g => g.values.length > 0);
};

const MAX_VALUES_SHOWN = 2;

/** Tom tat doi tuong gon cho 1 o trong bang danh sach. */
export const SurveyTargetSummary: React.FC<{ survey: Survey }> = ({ survey }) => {
    if (survey.eligibleAll) return <span>Tất cả người dùng</span>;
    const groups = surveyTargetGroups(survey);
    if (groups.length === 0) return <span className="text-text_3">—</span>;
    return (
        <div className="space-y-0.5 text-sm">
            {groups.map(g => {
                const shown = g.values.slice(0, MAX_VALUES_SHOWN);
                const rest = g.values.length - shown.length;
                return (
                    <div key={g.label} title={`${g.label}: ${g.values.join(", ")}`}>
                        <span className="text-text_2">{g.label}: </span>
                        {shown.join(", ")}
                        {rest > 0 && <span className="text-text_2"> +{rest}</span>}
                    </div>
                );
            })}
        </div>
    );
};

export interface SurveyStatusToggleButtonProps {
    survey: Survey;
    // Nguoi bam co phai nguoi tao/dong chu bien khong - neu khong, hien canh
    // bao truoc khi mo/dong (nguoi tao/dong chu bien se nhan thong bao).
    isCreatorOrCoEditor: boolean;
    onChanged: () => void;
    size?: "sm" | "default";
}

/**
 * Nut Mở/Đóng khao sat dung chung cho danh sach va trang chi tiet. Khao sat
 * da dong khong mo lai duoc (giu nguyen quy uoc cu cua danh sach).
 */
export const SurveyStatusToggleButton: React.FC<SurveyStatusToggleButtonProps> = ({
    survey,
    isCreatorOrCoEditor,
    onChanged,
    size = "sm",
}) => {
    const [acting, setActing] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    if (survey.status === "da_dong") return null;
    const willClose = survey.status === "dang_mo";
    const actionLabel = willClose ? "Đóng" : "Mở";

    const run = async () => {
        try {
            setActing(true);
            if (willClose) {
                await closeSurvey(survey._id);
                toast.success("Đã đóng khảo sát");
            } else {
                await openSurvey(survey._id);
                toast.success("Đã mở khảo sát");
            }
            setConfirmOpen(false);
            onChanged();
        } catch (err) {
            toast.error((err as AppError).message);
        } finally {
            setActing(false);
        }
    };

    return (
        <>
            <Button
                size={size}
                loading={acting && !confirmOpen}
                onClick={e => {
                    e.stopPropagation();
                    if (isCreatorOrCoEditor) {
                        run();
                    } else {
                        setConfirmOpen(true);
                    }
                }}
            >
                {size === "sm" ? actionLabel : `${actionLabel} khảo sát`}
            </Button>
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent onClick={e => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            {actionLabel} khảo sát của người khác?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 text-sm text-text_2">
                        <p>
                            Bạn không phải người tạo hoặc đồng chủ biên của
                            khảo sát <strong>&ldquo;{survey.title}&rdquo;</strong>.
                        </p>
                        <p>
                            Nếu tiếp tục, người tạo ({surveyCreatorName(survey)})
                            {surveyCoEditorNames(survey).length > 0 &&
                                " và các đồng chủ biên"}{" "}
                            sẽ nhận được thông báo rằng bạn đã{" "}
                            {willClose ? "đóng" : "mở"} khảo sát này.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button loading={acting} onClick={run}>
                            Vẫn {willClose ? "đóng" : "mở"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
