"use client"

import React from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";

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
} satisfies ChartConfig;

export function RevenueChart() {
    return (
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
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
                    content={<ChartTooltipContent 
                        indicator="dot"
                        formatter={(value, name) => {
                            const currencyValue = Number(value).toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'});
                            const label = chartConfig[name as keyof typeof chartConfig]?.label || name;
                            return [currencyValue, label];
                        }}
                    />} 
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
