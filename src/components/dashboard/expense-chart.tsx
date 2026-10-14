
"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { Skeleton } from '../ui/skeleton';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart"


const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface ExpenseChartProps {
    data: { category: string; expenses: number }[];
    isLoading: boolean;
    emptyMessage?: string;
}

export function ExpenseChart({ data, isLoading, emptyMessage = 'Aucune dépense pour cette période.' }: ExpenseChartProps) {
  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: chartColors[index % chartColors.length]
    }))
  }, [data]);

  const chartConfig = React.useMemo(() => {
    const config: any = {
      expenses: {
        label: "Dépenses",
      },
    };
    chartData.forEach(item => {
      config[item.category] = {
        label: item.category,
        color: item.fill,
      }
    });
    return config;
  }, [chartData]);


  const totalExpenses = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.expenses, 0)
  }, [chartData])

  if (isLoading) {
    return <div className="flex items-center justify-center h-[300px] w-full">
       <Skeleton className="h-[250px] w-[250px] rounded-full" />
    </div>
  }

  if (!chartData || chartData.length === 0) {
      return (
          <div className="flex h-[300px] w-full items-center justify-center text-muted-foreground">
              {emptyMessage}
          </div>
      );
  }

  return (
    <div className="w-full min-w-0">
      <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[260px] w-full max-w-[300px]"
        >
          <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel 
              formatter={(value, name, props) => {
                const currencyValue = Number(value).toLocaleString('fr-FR', {style: 'currency', currency: 'XOF'});
                const label = props.payload.category;
                return [currencyValue, label];
              }}
            />}
          />
           <Pie
            data={chartData}
            dataKey="expenses"
            nameKey="category"
            innerRadius={60}
            strokeWidth={5}
            activeIndex={0}
            activeShape={({ outerRadius = 0, ...props }) => (
              <g>
                <Sector {...props} outerRadius={outerRadius + 5} />
                <Sector {...props} outerRadius={outerRadius + 15} innerRadius={outerRadius + 7} />
              </g>
            )}
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
                        {totalExpenses.toLocaleString('fr-FR', {style:'currency', currency:'XOF'})}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground"
                      >
                        Total Dépenses
                      </tspan>
                    </text>
                  )
                }
              }}
            />
           </Pie>
          </PieChart>
        </ChartContainer>
      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs" aria-label="Légende des dépenses">
        {chartData.map(item => (
          <li key={item.category} className="flex min-w-0 items-start gap-2">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: item.fill }} aria-hidden="true" />
            <span className="min-w-0 break-words leading-tight" title={item.category}>{item.category}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
