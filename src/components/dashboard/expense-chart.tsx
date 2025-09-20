"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart, Sector } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"

const chartData = [
  { category: "Bureau", expenses: 27500, fill: "var(--color-office)" },
  { category: "Logiciels", expenses: 20000, fill: "var(--color-software)" },
  { category: "Repas", expenses: 18700, fill: "var(--color-meals)" },
  { category: "Déplacements", expenses: 17500, fill: "var(--color-travel)" },
  { category: "Autre", expenses: 15000, fill: "var(--color-other)" },
]

const chartConfig = {
  expenses: {
    label: "Dépenses",
  },
  office: {
    label: "Bureau",
    color: "hsl(var(--chart-1))",
  },
  software: {
    label: "Logiciels",
    color: "hsl(var(--chart-2))",
  },
  meals: {
    label: "Repas",
    color: "hsl(var(--chart-3))",
  },
  travel: {
    label: "Déplacements",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Autre",
    color: "hsl(var(--chart-5))",
  },
}

export function ExpenseChart() {
  const totalExpenses = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.expenses, 0)
  }, [])

  return (
    <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-[300px]"
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
           <ChartLegend content={<ChartLegendContent nameKey="category" />} className="-mt-4" />
        </PieChart>
      </ChartContainer>
  )
}
