
"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { Skeleton } from '../ui/skeleton';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"

interface IncomeExpensePieChartProps {
    data: { name: string; value: number, fill: string }[];
    total: number;
    isLoading: boolean;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent === 0) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


export function IncomeExpensePieChart({ data, total, isLoading }: IncomeExpensePieChartProps) {

  const chartConfig = {
    value: { label: "Montant" },
    Entrées: { label: "Entrées", color: "hsl(var(--chart-1))" },
    Sorties: { label: "Sorties", color: "hsl(var(--chart-2))" },
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[250px] w-full">
       <Skeleton className="h-[250px] w-[250px] rounded-full" />
    </div>
  }

  if (!data || data.reduce((acc, item) => acc + item.value, 0) === 0) {
      return (
          <div className="flex h-[250px] w-full items-center justify-center text-muted-foreground">
              Aucune donnée pour ce mois.
          </div>
      );
  }

  return (
    <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-[250px]"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel 
              formatter={(value) => Number(value).toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'})}
            />}
          />
           <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            strokeWidth={5}
            labelLine={false}
            label={renderCustomizedLabel}
           >
             <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-3xl font-bold"
                      >
                        {total.toLocaleString('fr-FR', {style:'currency', currency:'XOF'})}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground"
                      >
                        Solde Net
                      </tspan>
                    </text>
                  )
                }
              }}
            />
           </Pie>
           <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-mt-4" />
        </PieChart>
      </ChartContainer>
  )
}
