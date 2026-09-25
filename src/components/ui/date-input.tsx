import * as React from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@lib/utils";

// input[type=date|datetime-local|month] native hien thi theo ngon ngu cua
// TRINH DUYET (vd Chrome tieng Anh -> mm/dd/yyyy), khong the doi bang
// thuoc tinh/CSS. DateInput thay phan hien thi bang o text dd/mm/yyyy (co
// the go truc tiep), nut lich mo picker native cua mot input an ben duoi.
// Gia tri (value/onChange) van la chuoi ISO y het input native
// (yyyy-mm-dd, yyyy-mm-ddTHH:mm, yyyy-mm) nen noi goi khong can doi gi.

export type DateInputType = "date" | "datetime-local" | "month";

export const DATE_INPUT_TYPES: readonly string[] = [
    "date",
    "datetime-local",
    "month",
];

const TEMPLATE: Record<DateInputType, string> = {
    date: "dd/mm/yyyy",
    "datetime-local": "dd/mm/yyyy HH:MM",
    month: "mm/yyyy",
};

const PLACEHOLDER: Record<DateInputType, string> = {
    date: "dd/mm/yyyy",
    "datetime-local": "dd/mm/yyyy hh:mm",
    month: "mm/yyyy",
};

const DIGIT_COUNT: Record<DateInputType, number> = {
    date: 8,
    "datetime-local": 12,
    month: 6,
};

// Chen dau phan cach theo TEMPLATE khi nguoi dung go so (vd "24092026" ->
// "24/09/2026"); ky tu phan cach chi duoc them khi con so phia sau.
function applyMask(digits: string, type: DateInputType): string {
    const template = TEMPLATE[type];
    let out = "";
    let i = 0;
    for (const ch of template) {
        if (i >= digits.length) break;
        if (/[a-zA-Z]/.test(ch)) {
            out += digits[i];
            i += 1;
        } else {
            out += ch;
        }
    }
    return out;
}

function isoToDisplay(iso: string | undefined, type: DateInputType): string {
    if (!iso) return "";
    if (type === "month") {
        const m = /^(\d{4})-(\d{2})$/.exec(iso);
        return m ? `${m[2]}/${m[1]}` : "";
    }
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso);
    if (!m) return "";
    const date = `${m[3]}/${m[2]}/${m[1]}`;
    if (type === "datetime-local") {
        return `${date} ${m[4] ?? "00"}:${m[5] ?? "00"}`;
    }
    return date;
}

// Tra ve ISO khi da go DU va HOP LE, nguoc lai null (chua phat onChange).
function displayToIso(text: string, type: DateInputType): string | null {
    const digits = text.replace(/\D/g, "");
    if (digits.length !== DIGIT_COUNT[type]) return null;
    const pad = (n: number) => String(n).padStart(2, "0");
    if (type === "month") {
        const month = Number(digits.slice(0, 2));
        const year = Number(digits.slice(2, 6));
        if (month < 1 || month > 12 || year < 1) return null;
        return `${String(year).padStart(4, "0")}-${pad(month)}`;
    }
    const day = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));
    const year = Number(digits.slice(4, 8));
    if (month < 1 || month > 12 || year < 1 || day < 1) return null;
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) return null;
    const date = `${String(year).padStart(4, "0")}-${pad(month)}-${pad(day)}`;
    if (type !== "datetime-local") return date;
    const hour = Number(digits.slice(8, 10));
    const minute = Number(digits.slice(10, 12));
    if (hour > 23 || minute > 59) return null;
    return `${date}T${pad(hour)}:${pad(minute)}`;
}

// Gan gia tri vao input native an roi phat su kien "input" de React goi
// onChange voi mot ChangeEvent that (target.value/name dung nhu cu).
function emitNativeChange(input: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
    )?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
}

export interface DateInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    type: DateInputType;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
    (
        {
            type,
            className,
            value,
            defaultValue,
            onChange,
            onBlur,
            onFocus,
            min,
            max,
            name,
            disabled,
            readOnly,
            placeholder,
            ...rest
        },
        ref,
    ) => {
        const nativeRef = React.useRef<HTMLInputElement>(null);
        const isControlled = value !== undefined;
        const [uncontrolledValue, setUncontrolledValue] = React.useState(
            String(defaultValue ?? ""),
        );
        const isoValue = isControlled ? String(value ?? "") : uncontrolledValue;

        const [text, setText] = React.useState(() =>
            isoToDisplay(isoValue, type),
        );
        const focusedRef = React.useRef(false);

        // Chi dong bo tu ngoai vao khi o text khong duoc focus, tranh ghi de
        // len chuoi nguoi dung dang go do.
        React.useEffect(() => {
            if (!focusedRef.current) setText(isoToDisplay(isoValue, type));
        }, [isoValue, type]);

        const commit = (next: string) => {
            if (next === isoValue) return;
            if (!isControlled) setUncontrolledValue(next);
            if (nativeRef.current) emitNativeChange(nativeRef.current, next);
        };

        const openPicker = () => {
            const input = nativeRef.current;
            if (!input || disabled || readOnly) return;
            try {
                input.showPicker();
            } catch {
                // Trinh duyet khong ho tro picker cho loai nay (vd Firefox
                // voi type=month) - van go tay duoc o o text.
            }
        };

        return (
            <div className={cn("relative w-full", className)}>
                <input
                    {...rest}
                    ref={ref}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={text}
                    disabled={disabled}
                    readOnly={readOnly}
                    placeholder={placeholder || PLACEHOLDER[type]}
                    onFocus={e => {
                        focusedRef.current = true;
                        onFocus?.(e);
                    }}
                    onChange={e => {
                        const digits = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, DIGIT_COUNT[type]);
                        const masked = applyMask(digits, type);
                        setText(masked);
                        if (!digits) {
                            commit("");
                            return;
                        }
                        const iso = displayToIso(masked, type);
                        if (iso) commit(iso);
                    }}
                    onBlur={e => {
                        focusedRef.current = false;
                        // Go chua du/khong hop le -> tra lai gia tri dang co.
                        setText(isoToDisplay(isoValue, type));
                        onBlur?.(e);
                    }}
                    onKeyDown={e => {
                        if (e.altKey && e.key === "ArrowDown") {
                            e.preventDefault();
                            openPicker();
                        }
                        rest.onKeyDown?.(e);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background py-1 pl-3 pr-10 text-sm shadow-sm transition-all duration-150 ease-out placeholder:text-muted-foreground hover:border-text_3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <input
                    ref={nativeRef}
                    type={type}
                    name={name}
                    value={isoValue}
                    min={min}
                    max={max}
                    disabled={disabled}
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={e => {
                        if (!isControlled) setUncontrolledValue(e.target.value);
                        onChange?.(e);
                    }}
                    className="pointer-events-none absolute bottom-0 left-0 h-full w-full opacity-0"
                />
                <button
                    type="button"
                    tabIndex={-1}
                    aria-label="Chọn ngày"
                    disabled={disabled || readOnly}
                    onClick={openPicker}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-text_2 hover:text-text_1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <CalendarDays className="h-4 w-4" />
                </button>
            </div>
        );
    },
);
DateInput.displayName = "DateInput";

export { DateInput };
