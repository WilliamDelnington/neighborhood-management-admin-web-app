import React from "react";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ReportBarChartSeries } from "@components/admin/ReportBarChart";

export interface ReportLineChartProps {
    data: Array<Record<string, unknown>>;
    labelKey: string;
    series: ReportBarChartSeries[];
}

const compactNumber = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);

/** Biểu đồ đường cho dữ liệu có trục thời gian như Thu–Chi theo tháng. */
const ReportLineChart: React.FC<ReportLineChartProps> = ({
    data,
    labelKey,
    series,
}) => {
    if (data.length === 0) return null;

    return (
        <ResponsiveContainer width="100%" height={260}>
            <LineChart
                data={data}
                margin={{ top: 8, right: 16, bottom: 4, left: 4 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#DFE5EB" />
                <XAxis
                    dataKey={labelKey}
                    tick={{ fontSize: 12, fill: "#52514e" }}
                />
                <YAxis
                    tickFormatter={compactNumber}
                    tick={{ fontSize: 12, fill: "#898781" }}
                />
                <Tooltip
                    contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        borderColor: "#DFE5EB",
                    }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {series.map(item => (
                    <Line
                        key={item.key}
                        type="monotone"
                        dataKey={item.key}
                        name={item.name}
                        stroke={item.color}
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default ReportLineChart;
