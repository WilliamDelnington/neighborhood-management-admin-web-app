import ExcelJS from "exceljs";

export interface ExcelColumn<T> {
    label: string;
    width?: number;
    value: (row: T) => string | number;
}

// Ten sheet Excel khong duoc chua \ / ? * [ ] : va toi da 31 ky tu - cung quy
// tac voi ExportReports/exportExcel.ts.
const sanitizeSheetName = (label: string) =>
    label.replace(/[\\/?*[\]:]/g, " ").slice(0, 31) || "Danh sach";

/**
 * Xuat 1 danh sach bat ky (Nha so/Ho dan/Ho kinh doanh/Cong ty/Nhan khau...)
 * ra file .xlsx - dung chung cho nut "Xuất Excel" tren cac trang danh sach
 * (khac ExportReports/exportExcel.ts: ham do rieng cho cac bao cao nhan khau
 * theo nhom doi tuong, con ham nay TONG QUAT cho bat ky kieu du liệu T nao,
 * chi can khai bao cot). Cung mot kieu trinh bay (header xanh, dong dau dong
 * bang, auto-filter) de trai nghiem xuat file nhat quan trong toan app.
 */
export async function exportRowsToExcel<T>(
    rows: T[],
    fileName: string,
    sheetLabel: string,
    columns: ExcelColumn<T>[],
): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sanitizeSheetName(sheetLabel), {
        views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = [
        { header: "STT", width: 6 },
        ...columns.map(col => ({ header: col.label, width: col.width })),
    ];

    rows.forEach((row, index) => {
        sheet.addRow([index + 1, ...columns.map(col => col.value(row))]);
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
        to: `${sheet.getColumn(columns.length + 1).letter}1`,
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
}

// Hau to ngay gio dung chung cho ten file xuat (vd "nha-so_20260921-1530.xlsx")
// - tranh de nguoi dung ghi de nham file xuat truoc do cung ten.
export const exportFileTimestamp = (): string => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
};
