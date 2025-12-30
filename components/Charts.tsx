"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface ChartProps {
    data: {
        name: string;
        receitas: number;
        despesas: number;
    }[];
}

export default function OverviewChart({ data }: ChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={data}
                margin={{
                    top: 5,
                    right: 10,
                    left: -20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                    dataKey="name"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", borderRadius: "8px", border: "none" }}
                    itemStyle={{ color: "#F3F4F6" }}
                    cursor={{ fill: "transparent" }}
                />
                <Bar dataKey="receitas" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
