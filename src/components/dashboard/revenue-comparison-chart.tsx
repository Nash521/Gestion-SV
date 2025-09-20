"use client"

import React from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from "recharts";

const chartData = [
  { month: "Janvier", revenue: 18600, expenses: 12000 },
  { month: "Février", revenue: 30500, expenses: 18000 },
  { month: "Mars", revenue: 23700, expenses: 20000 },
  { month: "Avril", revenue: 7300, expenses: 9000 },
  { month: "Mai", revenue: 20900, expenses: 15000 },
  { month: "Juin", revenue: 21400, expenses: 17000 },
];

const chartConfig = {
  revenue: {
    label: "Revenu",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Dépenses",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function RevenueComparisonChart() {
    return (
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart accessibilityLayer data={chartData}>
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
                <ChartLegend content={<ChartLegendContent />} />
                <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                <Area
                    dataKey="revenue"
                    type="natural"
                    fill="url(#fillRevenue)"
                    fillOpacity={0.4}
                    stroke="var(--color-revenue)"
                    stackId="a"
                />
                 <Area
                    dataKey="expenses"
                    type="natural"
                    fill="url(#fillExpenses)"
                    fillOpacity={0.4}
                    stroke="var(--color-expenses)"
                    stackId="b"
                />
            </AreaChart>
        </ChartContainer>
    );
}
