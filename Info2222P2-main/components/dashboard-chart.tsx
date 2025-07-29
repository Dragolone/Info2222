"use client"

import { Bar } from "recharts"
import { Card } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

const data = [
  { month: "Jan", completed: 45, total: 60 },
  { month: "Feb", completed: 52, total: 65 },
  { month: "Mar", completed: 48, total: 62 },
  { month: "Apr", completed: 61, total: 75 },
  { month: "May", completed: 55, total: 70 },
  { month: "Jun", completed: 67, total: 80 },
]

export function DashboardChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="month"
          stroke="hsl(var(--foreground))"
          fontSize={12}
          tickLine={{ stroke: 'hsl(var(--border))', opacity: 0.5 }}
          axisLine={{ stroke: 'hsl(var(--border))', opacity: 0.5 }}
        />
        <YAxis
          stroke="hsl(var(--foreground))"
          fontSize={12}
          tickLine={{ stroke: 'hsl(var(--border))', opacity: 0.5 }}
          axisLine={{ stroke: 'hsl(var(--border))', opacity: 0.5 }}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          }}
          labelStyle={{
            color: 'hsl(var(--foreground))',
            fontWeight: 'bold',
            padding: '4px 0',
            borderBottom: '1px solid hsl(var(--border))',
            marginBottom: '4px'
          }}
          itemStyle={{
            color: 'hsl(var(--foreground))',
            padding: '2px 0'
          }}
        />
        <Legend
          wrapperStyle={{
            paddingTop: '1rem',
          }}
          formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
        />
        <Bar
          dataKey="total"
          fill="hsl(var(--muted))"
          radius={[4, 4, 0, 0]}
          name="Total Tasks"
          activeBar={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <Bar
          dataKey="completed"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          name="Completed Tasks"
          activeBar={{ fill: 'hsl(var(--primary-foreground))', stroke: 'hsl(var(--primary))' }}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

