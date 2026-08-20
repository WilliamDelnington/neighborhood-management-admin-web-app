import React from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

export interface ReportBarChartSeries {
    key: string;
    name: string;
    color: string;
}

export interface ReportBarChartProps {
    data: Array<Record<string, unknown>>;
    labelKey: string;
    series: ReportBarChartSeries[];
    /**
     * "categories-y" (mac dinh): danh muc nam tren truc Y, phu hop voi so
     * luong danh muc bat ky va nhan dai (vd ten cum dan cu, loai hinh kinh
     * doanh). "categories-x": danh muc nam tren truc X theo thu tu co san
     * (vd thang/nam) - phu hop du lieu co tinh thoi gian.
     */
    orientation?: "categories-y" | "categories-x";
}

/**
 * Bieu do cot don gian dung chung cho cac bao cao (theo trang thai/cum dan
 * cu/loai hinh...). Chi mot mau accent cho bieu do 1 chuoi so lieu (vi truc +
 * nhan da the hien danh tinh danh muc); 2 mau cho bieu do so sanh 2 chuoi
 * (vd so ho vs so nhan khau, thu vs chi) - thu tu mau co dinh, da kiem tra an
 * toan cho nguoi mu mau (xem dataviz skill).
 */
const ReportBarChart: React.FC<ReportBarChartProps> = ({
    data,
    labelKey,
    series,
    orientation = "categories-y",
}) => {
    if (data.length === 0) return null;

    const isHorizontalBars = orientation === "categories-y";
    const height = isHorizontalBars
        ? Math.max(140, data.length * 36 + 40)
        : 260;

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                layout={isHorizontalBars ? "vertical" : "horizontal"}
                margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#DFE5EB"
                    horizontal={!isHorizontalBars}
                    vertical={isHorizontalBars}
                />
                {isHorizontalBars ? (
                    <>
                        <XAxis
                            type="number"
                            allowDecimals={false}
                            tick={{ fontSize: 12, fill: "#898781" }}
                        />
                        <YAxis
                            type="category"
                            dataKey={labelKey}
                            width={140}
                            tick={{ fontSize: 12, fill: "#52514e" }}
                        />
                    </>
                ) : (
                    <>
                        <XAxis
                            dataKey={labelKey}
                            tick={{ fontSize: 12, fill: "#52514e" }}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 12, fill: "#898781" }}
                        />
                    </>
                )}
                <Tooltip
                    contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        borderColor: "#DFE5EB",
                    }}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                {series.length > 1 && (
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                )}
                {series.map(s => (
                    <Bar
                        key={s.key}
                        dataKey={s.key}
                        name={s.name}
                        fill={s.color}
                        radius={isHorizontalBars ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                        maxBarSize={24}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
};

export default ReportBarChart;
