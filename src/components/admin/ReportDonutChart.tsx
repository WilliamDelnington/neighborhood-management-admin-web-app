import React from "react";
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

export interface ReportDonutChartProps {
    data: Array<Record<string, unknown>>;
    labelKey: string;
    valueKey: string;
    colors?: string[];
}

// Bang mau categorical co dinh thu tu, da kiem tra an toan cho nguoi mu mau
// (xem dataviz skill) - thay the bang cu chi toan sac xanh gay kho phan biet.
const DEFAULT_COLORS = [
    "#2a78d6", // blue
    "#eb6834", // orange
    "#1baf7a", // aqua
    "#eda100", // yellow
    "#e87ba4", // magenta
    "#008300", // green
    "#4a3aa7", // violet
    "#e34948", // red
];

/** Biểu đồ donut dành cho cơ cấu trạng thái, chỉ vẽ các lát có giá trị. */
const ReportDonutChart: React.FC<ReportDonutChartProps> = ({
    data,
    labelKey,
    valueKey,
    colors = DEFAULT_COLORS,
}) => {
    const visibleData = data.filter(item => Number(item[valueKey]) > 0);
    if (visibleData.length === 0) return null;

    return (
        <ResponsiveContainer width="100%" height={260}>
            <PieChart>
                <Pie
                    data={visibleData}
                    dataKey={valueKey}
                    nameKey={labelKey}
                    cx="50%"
                    cy="45%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke="none"
                >
                    {visibleData.map((item, index) => (
                        <Cell
                            key={`${String(item[labelKey])}-${String(
                                item[valueKey],
                            )}`}
                            fill={colors[index % colors.length]}
                        />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        borderColor: "#DFE5EB",
                    }}
                />
                <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: 12 }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default ReportDonutChart;
