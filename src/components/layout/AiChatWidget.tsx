import React, { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore, usePermission } from "@store/authStore";
import { sendAiChatMessage, AiChatHistoryItem } from "@service/aiChatApi";
import { AppError } from "@dts";
import { cn } from "@lib/utils";
import { Button } from "@components/ui/button";
import { Textarea } from "@components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@components/ui/sheet";
import happyIcon from "@assets/happy.png";

type ChatMessage = {
    id: string;
    role: "user" | "model";
    text: string;
};

// Chi giu tren so 20 tin gan nhat lam history gui kem (khop gioi han backend -
// xem validators/aiChat.ts) - danh sach hien thi tren man hinh khong bi cat,
// chi phan gui kem request moi bi gioi han.
const MAX_HISTORY_TURNS = 20;

// Cau hoi goi y bam-la-gui, giup nguoi dung moi chua biet hoi gi cung bat dau
// duoc ngay (hien khi chua co tin nhan nao) - noi dung khac nhau theo CAP BAC
// tai khoan (admin/Phuong/To dan pho/Nguoi dan), vi cau hoi kieu "nha tôi có
// mấy nhân khẩu" vo nghia voi mot tai khoan quan ly cap Phuong/He thong. Nhom
// vai tro khop voi WARD_ROLE_KEYS/NEIGHBORHOOD_ROLE_KEYS o SYSTEM_ROLE_SCOPE_CONFIG
// phia backend (lib/systemRoles.ts) - xem resolveChatTier ben duoi.
type ChatTier = "admin" | "ward" | "neighborhood" | "citizen";

const WARD_ROLE_KEYS = [
    "secretary",
    "regional_police",
    "people_committee_official",
    "social_affairs_official",
    "health_official",
    "education_official",
    "economy_labor_official",
];
const NEIGHBORHOOD_ROLE_KEYS = [
    "neighborhood_leader",
    "neighborhood_coleader",
    "neighborhood_collaborator",
];

function resolveChatTier(roles: string[] = []): ChatTier {
    if (roles.includes("admin")) return "admin";
    if (roles.some(r => WARD_ROLE_KEYS.includes(r))) return "ward";
    if (roles.some(r => NEIGHBORHOOD_ROLE_KEYS.includes(r))) return "neighborhood";
    return "citizen";
}

const QUICK_PROMPTS_BY_TIER: Record<ChatTier, string[]> = {
    admin: [
        "Toàn hệ thống có bao nhiêu tổ dân phố?",
        "Tổ dân phố nào có nhiều hộ kinh doanh nhất?",
        "Thống kê số hộ dân theo từng tổ dân phố",
    ],
    ward: [
        "Phường có bao nhiêu tổ dân phố?",
        "Tổ dân phố nào có nhiều hộ kinh doanh nhất?",
        "Người dân gửi phản ánh mới bằng cách nào?",
    ],
    neighborhood: [
        "Tổ tôi có bao nhiêu hộ dân?",
        "Danh sách hộ kinh doanh trong tổ tôi",
        "Tổ tôi hiện có bao nhiêu công ty hoạt động?",
    ],
    citizen: [
        "Nhà tôi có mấy nhân khẩu?",
        "Muốn phản ánh về rác thải thì làm sao?",
        "Hộ kinh doanh của tôi thuộc loại hình nào?",
    ],
};

// Bong thoai "moi chao" xuat hien canh nut noi de chu dong goi y - lan luot
// doi cau, tu dong an sau mot luc, roi lap lai sau mot khoang nghi (xem 2
// useEffect dieu khien lich hien/an ben duoi).
const TEASER_MESSAGES = [
    "Bạn cần mình giúp gì không? 👋",
    "Có thắc mắc gì cứ hỏi mình, trả lời nhanh lắm!",
    "Tra cứu nhà số, hộ dân, phản ánh... bấm vào đây nhé!",
];
const TEASER_FIRST_DELAY_MS = 6_000;
const TEASER_REPEAT_DELAY_MS = 45_000;
const TEASER_VISIBLE_MS = 7_000;

let messageIdSeq = 0;
function nextMessageId(): string {
    messageIdSeq += 1;
    return `${Date.now()}-${messageIdSeq}`;
}

/**
 * Widget noi (floating action button + panel truot) cho Tro ly AI (Gemini) -
 * chi hien voi tai khoan co quyen "ai_chat.use" (xem lib/permissionRegistry.ts
 * o backend). Khong luu lich su hoi thoai qua lan tai lai trang (khop thiet
 * ke stateless o backend) - state chi ton tai trong bo nho component.
 */
const AiChatWidget: React.FC = () => {
    const canUseAiChat = usePermission("ai_chat.use");
    const roles = useAuthStore(state => state.user?.roles);
    const quickPrompts = QUICK_PROMPTS_BY_TIER[resolveChatTier(roles)];
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollEndRef = useRef<HTMLDivElement>(null);

    const [teaserVisible, setTeaserVisible] = useState(false);
    const [teaserDismissed, setTeaserDismissed] = useState(false);
    const [teaserText, setTeaserText] = useState(TEASER_MESSAGES[0]);
    const hasShownTeaserRef = useRef(false);
    const teaserIndexRef = useRef(0);

    useEffect(() => {
        scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Lich HIEN bong thoai: lan dau sau TEASER_FIRST_DELAY_MS, cac lan sau
    // cach nhau TEASER_REPEAT_DELAY_MS - chi khi chat dang dong, chua bi
    // nguoi dung tat han, va hien tai khong hien (tranh chong lich voi effect
    // dieu khien AN ben duoi).
    useEffect(() => {
        if (!canUseAiChat || open || teaserDismissed || teaserVisible) {
            return undefined;
        }
        const delay = hasShownTeaserRef.current
            ? TEASER_REPEAT_DELAY_MS
            : TEASER_FIRST_DELAY_MS;
        const timer = setTimeout(() => {
            hasShownTeaserRef.current = true;
            setTeaserText(
                TEASER_MESSAGES[teaserIndexRef.current % TEASER_MESSAGES.length],
            );
            teaserIndexRef.current += 1;
            setTeaserVisible(true);
        }, delay);
        return () => clearTimeout(timer);
    }, [canUseAiChat, open, teaserDismissed, teaserVisible]);

    // Lich AN bong thoai sau khi da hien du TEASER_VISIBLE_MS.
    useEffect(() => {
        if (!teaserVisible) return undefined;
        const timer = setTimeout(() => setTeaserVisible(false), TEASER_VISIBLE_MS);
        return () => clearTimeout(timer);
    }, [teaserVisible]);

    if (!canUseAiChat) return null;

    const openChat = () => {
        setTeaserVisible(false);
        setOpen(true);
    };

    const dismissTeaser = () => {
        setTeaserVisible(false);
        setTeaserDismissed(true);
    };

    const handleNewConversation = () => {
        setMessages([]);
        setInput("");
    };

    const sendMessage = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        const history: AiChatHistoryItem[] = messages
            .slice(-MAX_HISTORY_TURNS)
            .map(m => ({ role: m.role, text: m.text }));
        const userMessage: ChatMessage = {
            id: nextMessageId(),
            role: "user",
            text: trimmed,
        };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await sendAiChatMessage(trimmed, history);
            setMessages(prev => [
                ...prev,
                { id: nextMessageId(), role: "model", text: res.reply },
            ]);
        } catch (err) {
            toast.error(
                (err as AppError).message ||
                    "Không gửi được câu hỏi cho trợ lý AI, vui lòng thử lại",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
                {teaserVisible && !open && (
                    <div className="relative max-w-[240px] animate-in fade-in slide-in-from-bottom-2 rounded-2xl rounded-br-sm border border-divider_01 bg-ui_bg p-3 pr-7 text-sm text-text_1 shadow-xl">
                        <button
                            type="button"
                            onClick={dismissTeaser}
                            title="Đóng"
                            className="absolute right-1.5 top-1.5 rounded-full p-0.5 text-text_3 hover:bg-ng_10 hover:text-text_1"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={openChat}
                            className="text-left"
                        >
                            {teaserText}
                        </button>
                    </div>
                )}

                <button
                    type="button"
                    onClick={openChat}
                    title="Trợ lý AI"
                    className={cn(
                        "relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-main to-indigo-600 text-white shadow-xl shadow-main/40 ring-4 ring-white/20 transition-transform duration-200 hover:scale-110 active:scale-95",
                        open && "hidden",
                    )}
                >
                    {/* Vong pulse lan toa - thu hut chu y ma khong lam nguoi
                        dung kho chiu bang cach lam nhay ca nut (chi lan toa mo
                        dan). */}
                    <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-main/50" />
                    <img
                        src={happyIcon}
                        alt="Trợ lý AI"
                        className="h-11 w-11 animate-bounce object-contain drop-shadow-sm"
                    />
                </button>
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="right"
                    className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
                >
                    <SheetHeader className="shrink-0 space-y-0 border-b border-divider_01 bg-ui_bg py-4 pl-4 pr-12">
                        <div className="flex items-center gap-3">
                            <img
                                src={happyIcon}
                                alt="Trợ lý AI"
                                className="h-10 w-10 shrink-0 object-contain"
                            />
                            <div className="min-w-0 flex-1">
                                <SheetTitle>Trợ lý AI</SheetTitle>
                            </div>
                            {messages.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleNewConversation}
                                    title="Xóa hội thoại, bắt đầu mới"
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-rose-500 transition-colors hover:bg-rose-500/10 hover:text-rose-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </SheetHeader>

                    <div className="flex-1 space-y-4 overflow-y-auto bg-ng_10/40 px-4 py-4">
                        {messages.length === 0 && (
                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <img
                                        src={happyIcon}
                                        alt=""
                                        className="h-7 w-7 shrink-0 object-contain"
                                    />
                                    <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-divider_01 bg-ui_bg px-3 py-2 text-sm text-text_1 shadow-sm">
                                        Chào bạn! Tôi có thể giúp tra cứu nhà
                                        số, hộ dân, nhân khẩu, hộ kinh doanh,
                                        công ty, cách gửi phản ánh... trong
                                        phạm vi bạn được phân quyền. Thử hỏi
                                        gì đó bên dưới nhé.
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pl-9">
                                    {quickPrompts.map(prompt => (
                                        <button
                                            key={prompt}
                                            type="button"
                                            onClick={() => sendMessage(prompt)}
                                            className="flex items-center gap-1 rounded-full border border-main/30 bg-main/5 px-3 py-1.5 text-xs font-medium text-main transition-colors hover:bg-main/10"
                                        >
                                            <Sparkles className="h-3 w-3" />
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {messages.map(m => (
                            <div
                                key={m.id}
                                className={cn(
                                    "flex items-start gap-2",
                                    m.role === "user" && "flex-row-reverse",
                                )}
                            >
                                {m.role === "model" && (
                                    <img
                                        src={happyIcon}
                                        alt=""
                                        className="h-7 w-7 shrink-0 object-contain"
                                    />
                                )}
                                <div
                                    className={cn(
                                        "max-w-[80%] whitespace-pre-wrap px-3 py-2 text-sm shadow-sm",
                                        m.role === "user"
                                            ? "rounded-2xl rounded-br-sm bg-gradient-to-br from-main to-indigo-600 text-white"
                                            : "rounded-2xl rounded-bl-sm border border-divider_01 bg-ui_bg text-text_1",
                                    )}
                                >
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-start gap-2">
                                <img
                                    src={happyIcon}
                                    alt=""
                                    className="h-7 w-7 shrink-0 object-contain"
                                />
                                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-divider_01 bg-ui_bg px-3 py-2 text-sm text-text_2 shadow-sm">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Đang trả lời...
                                </div>
                            </div>
                        )}
                        <div ref={scrollEndRef} />
                    </div>

                    <div className="shrink-0 border-t border-divider_01 bg-ui_bg p-3">
                        <div className="flex items-end gap-2 rounded-2xl border border-divider_01 bg-background p-1.5 focus-within:ring-1 focus-within:ring-main">
                            <Textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập câu hỏi..."
                                className="min-h-[36px] flex-1 resize-none border-0 shadow-none focus-visible:ring-0"
                                rows={1}
                                disabled={loading}
                            />
                            <Button
                                size="icon"
                                onClick={() => sendMessage(input)}
                                disabled={loading || !input.trim()}
                                title="Gửi"
                                className="shrink-0 rounded-full bg-gradient-to-br from-main to-indigo-600 hover:from-main hover:to-indigo-700"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
};

export default AiChatWidget;
