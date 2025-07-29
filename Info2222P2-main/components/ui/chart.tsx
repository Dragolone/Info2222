import type * as React from "react"

import { cn } from "@/lib/utils"

const Chart = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("relative", className)} {...props} />
}
Chart.displayName = "Chart"

const ChartContainer = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("rounded-md border", className)} {...props} />
}
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("absolute z-10 rounded-md border bg-popover p-4 text-popover-foreground shadow-sm", className)}
      {...props}
    />
  )
}
ChartTooltip.displayName = "ChartTooltip"

const ChartTooltipContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("font-medium", className)} {...props} />
}
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("absolute left-0 top-0 flex items-center justify-center", className)} {...props} />
}
ChartLegend.displayName = "ChartLegend"

const ChartLegendContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("font-medium", className)} {...props} />
}
ChartLegendContent.displayName = "ChartLegendContent"

export { Chart, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent }

