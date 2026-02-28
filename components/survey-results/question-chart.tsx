'use client'

import React from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuestionWithAnswers } from '@/lib/api/survey-clients'

interface QuestionChartData {
  id: string
  text: string
  count: number
  percentage: number
}

interface QuestionChartProps {
  question: QuestionWithAnswers
  data: QuestionChartData[]
  colors: string[]
  totalResponses: number
}

export function QuestionChart({ question, data, colors, totalResponses }: QuestionChartProps) {
  // Generate chart config
  const chartConfig: ChartConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    data.forEach((item, index) => {
      config[item.id] = {
        label: item.text,
        color: colors[index] || `hsl(${(index * 137.508) % 360}, 70%, 50%)`
      }
    })
    return config
  }, [data, colors])

  // Filter out zero values for cleaner display
  const nonZeroData = data.filter(item => item.count > 0)
  const hasData = nonZeroData.length > 0

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-base font-medium">
              {question.questionText}
            </span>
            <Badge variant="secondary">
              {question.questionType === 'single' ? 'Single Choice' : 'Multiple Choice'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No responses yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-base font-medium">
            {question.questionText}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {question.questionType === 'single' ? 'Single Choice' : 'Multiple Choice'}
            </Badge>
            <Badge variant="outline">
              {totalResponses} responses
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="h-64">
            <ChartContainer config={chartConfig}>
              {question.questionType === 'single' ? (
                <PieChart>
                  <Pie
                    data={nonZeroData}
                    dataKey="count"
                    nameKey="text"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.percent}%`}
                  >
                    {nonZeroData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colors[data.findIndex(d => d.id === entry.id)] || `hsl(${(index * 137.508) % 360}, 70%, 50%)`}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent hideLabel />}
                  />
                </PieChart>
              ) : (
                <BarChart data={nonZeroData} layout="horizontal">
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="text" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid gap-2">
                              <div className="font-medium">{data.text}</div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm text-muted-foreground">Count:</div>
                                <div className="font-mono text-sm">{data.count}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm text-muted-foreground">Percentage:</div>
                                <div className="font-mono text-sm">{data.percentage}%</div>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(220, 70%, 50%)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              )}
            </ChartContainer>
          </div>

          {/* Data Table */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Response Breakdown</h4>
            <div className="space-y-2">
              {data.map((item, index) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: colors[index] || `hsl(${(index * 137.508) % 360}, 70%, 50%)`
                      }}
                    />
                    <span className="text-sm">{item.text}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{item.count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}