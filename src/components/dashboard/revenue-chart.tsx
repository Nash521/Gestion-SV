"use client"

import React from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartData = [
  { month: "Janvier", revenue: 18600 },
  { month: "Février", revenue: 30500 },
  { month: "Mars", revenue: 23700 },
  { month: "Avril", revenue: 7300 },
  { month: "Mai", revenue: 20900 },
  { month: "Juin", revenue: 21400 },
];

const chartConfig = {
  revenue: {
    label: "Revenu",
    color: "hsl(var(--chart-1))",
  },
};

export function RevenueChart() {
    return (
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent formatter={(value, name) => [`${Number(value).toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}`, chartConfig.revenue.label]} />}
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
            </BarChart>
        </ChartContainer>
    );
}
