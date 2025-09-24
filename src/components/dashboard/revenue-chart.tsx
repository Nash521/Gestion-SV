
"use client"

import React from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";
import { Skeleton } from '../ui/skeleton';

const chartConfig = {
  revenue: {
    label: "Revenu",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface RevenueChartProps {
    data: { month: string; revenue: number }[];
    isLoading: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
    
     if (isLoading) {
        return <Skeleton className="h-[300px] w-full" />
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
                Pas assez de données pour afficher le graphique.
            </div>
        );
    }

    return (
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={data}>
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
                 <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                <Bar dataKey="revenue" fill="url(#fillRevenue)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
