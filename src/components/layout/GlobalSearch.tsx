import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Building2,
    Home,
    Loader2,
    Search,
    Store,
    User,
    UserRound,
    Users,
} from "lucide-react";
import { Dialog, DialogContent } from "@components/ui/dialog";
import { cn } from "@lib/utils";
import {
    globalSearch,
    GlobalSearchResultItem,
    GlobalSearchResultType,
} from "@service/searchApi";

const TYPE_LABEL: Record<GlobalSearchResultType, string> = {
    house: "Nhà số",
    household: "Hộ dân",
    business: "Hộ kinh doanh",
    company: "Công ty",
    citizen: "Người dân",
    user: "Tài khoản",
};

const TYPE_ICON: Record<
    GlobalSearchResultType,
    React.ComponentType<{ className?: string }>
> = {
    house: Home,
    household: Users,
    business: Store,
    company: Building2,
    citizen: UserRound,
    user: User,
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

/**
 * O tim kiem tong hop tren header - tim theo ten/ma/dia chi/so dien thoai
 * tren nhieu loai du lieu cung luc (Nha so/Ho dan/Ho kinh doanh/Cong ty/
 * Nguoi dan/Tai khoan) thay vi phai vao tung module de tim. Ket qua da duoc
 * backend loc theo dung quyen + pham vi cua nguoi dang dang nhap (xem
 * searchService.ts o backend) nen component nay khong can tu loc them.
 */
const GlobalSearch: React.FC = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen(true);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    useEffect(() => {
        if (!open) {
            setQuery("");
            setResults([]);
            setActiveIndex(0);
            return undefined;
        }
        // Doi 1 tick de Radix hoan tat animation/focus trap cua Dialog truoc
        // khi tu focus vao input tim kiem.
        const timer = setTimeout(() => inputRef.current?.focus(), 0);
        return () => clearTimeout(timer);
    }, [open]);

    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < MIN_QUERY_LENGTH) {
            setResults([]);
            setLoading(false);
            return undefined;
        }
        setLoading(true);
        requestIdRef.current += 1;
        const requestId = requestIdRef.current;
        const timer = setTimeout(() => {
            globalSearch(trimmed)
                .then(res => {
                    if (requestIdRef.current !== requestId) return;
                    setResults(res.items);
                    setActiveIndex(0);
                })
                .catch(() => {
                    if (requestIdRef.current !== requestId) return;
                    setResults([]);
                })
                .finally(() => {
                    if (requestIdRef.current !== requestId) return;
                    setLoading(false);
                });
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [query]);

    const grouped = useMemo(() => {
        const groups = new Map<GlobalSearchResultType, GlobalSearchResultItem[]>();
        results.forEach(item => {
            const list = groups.get(item.type) || [];
            list.push(item);
            groups.set(item.type, list);
        });
        return [...groups.entries()];
    }, [results]);

    const goTo = (item: GlobalSearchResultItem) => {
        setOpen(false);
        navigate(item.href);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (results.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % results.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            const item = results[activeIndex];
            if (item) goTo(item);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="hidden flex-1 items-center gap-2 rounded-md border border-divider_01 bg-app-bg px-3 py-2 text-sm text-text_2 transition-colors hover:border-text_3 hover:text-text_1 md:flex md:max-w-md"
            >
                <Search className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">
                    Tìm nhà, hộ dân, công ty, người dân...
                </span>
                <kbd className="hidden shrink-0 rounded border border-divider_01 bg-ui_bg px-1.5 py-0.5 text-[10px] font-medium text-text_3 lg:inline-block">
                    Ctrl K
                </kbd>
            </button>
            <button
                type="button"
                onClick={() => setOpen(true)}
                title="Tìm kiếm"
                className="flex h-9 w-9 items-center justify-center rounded-full text-text_2 transition-colors hover:bg-ng_10 hover:text-main md:hidden"
            >
                <Search className="h-[18px] w-[18px]" />
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
                    <div className="flex items-center gap-2 border-b border-divider_01 py-3 pl-4 pr-10">
                        <Search className="h-4 w-4 shrink-0 text-text_2" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tìm nhà, hộ dân, công ty, người dân, tài khoản..."
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-text_3"
                        />
                        {loading && (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-text_2" />
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {query.trim().length < MIN_QUERY_LENGTH && (
                            <p className="px-2 py-6 text-center text-sm text-text_2">
                                Nhập ít nhất {MIN_QUERY_LENGTH} ký tự để tìm
                                kiếm.
                            </p>
                        )}
                        {query.trim().length >= MIN_QUERY_LENGTH &&
                            !loading &&
                            results.length === 0 && (
                                <p className="px-2 py-6 text-center text-sm text-text_2">
                                    Không tìm thấy kết quả phù hợp.
                                </p>
                            )}
                        {grouped.map(([type, items]) => {
                            const Icon = TYPE_ICON[type];
                            return (
                                <div key={type} className="mb-2 last:mb-0">
                                    <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-text_3">
                                        {TYPE_LABEL[type]}
                                    </div>
                                    {items.map(item => {
                                        const globalIndex =
                                            results.indexOf(item);
                                        const active =
                                            globalIndex === activeIndex;
                                        return (
                                            <button
                                                key={`${item.type}-${item.id}`}
                                                type="button"
                                                onMouseEnter={() =>
                                                    setActiveIndex(globalIndex)
                                                }
                                                onClick={() => goTo(item)}
                                                className={cn(
                                                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                                                    active
                                                        ? "bg-blue_10"
                                                        : "hover:bg-ng_10",
                                                )}
                                            >
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-icon_bg text-primary">
                                                    <Icon className="h-4 w-4" />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-medium text-text_1">
                                                        {item.title}
                                                    </span>
                                                    {item.subtitle && (
                                                        <span className="block truncate text-xs text-text_2">
                                                            {item.subtitle}
                                                        </span>
                                                    )}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default GlobalSearch;
