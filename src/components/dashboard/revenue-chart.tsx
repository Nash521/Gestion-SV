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
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";

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
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
