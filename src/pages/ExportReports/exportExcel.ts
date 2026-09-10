import ExcelJS from "exceljs";
import { GIOI_TINH_LABEL } from "@constants/domain";
import { Citizen } from "@dts";
import { householdLabelOf } from "./reportItems";

type ReportColumn = {
    label: string;
    width: number;
    value: (c: Citizen) => string;
};

const REPORT_COLUMNS: ReportColumn[] = [
    { label: "STT", width: 6, value: () => "" },
    { label: "Họ tên", width: 26, value: c => c.fullName },
    { label: "Giới tính", width: 10, value: c => GIOI_TINH_LABEL[c.gender] },
    {
        label: "Ngày sinh",
        width: 14,
        value: c =>
            c.birthDate ? new Date(c.birthDate).toLocaleDateString("vi-VN") : "",
    },
    { label: "CCCD", width: 16, value: c => c.cccd || "" },
    {
        label: "Thuộc hộ",
        width: 34,
        value: c => householdLabelOf(c.householdId),
    },
];

// Ten sheet Excel khong duoc chua \ / ? * [ ] va toi da 31 ky tu.
const sanitizeSheetName = (label: string) =>
    label.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Danh sach";

export const downloadExcel = async (
    rows: Citizen[],
    fileName: string,
    sheetLabel: string,
): Promise<void> => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sanitizeSheetName(sheetLabel), {
        views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = REPORT_COLUMNS.map(col => ({
        header: col.label,
        width: col.width,
    }));

    rows.forEach((row, index) => {
        sheet.addRow(
            REPORT_COLUMNS.map((col, colIndex) =>
                colIndex === 0 ? index + 1 : col.value(row),
            ),
        );
    });

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2A78D6" },
    };
    headerRow.height = 20;

    sheet.getColumn(1).alignment = { horizontal: "center" };
    sheet.autoFilter = {
        from: "A1",
        to: `${sheet.getColumn(REPORT_COLUMNS.length).letter}1`,
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
