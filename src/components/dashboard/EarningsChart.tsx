
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslation } from 'react-i18next';
import { ChartContainer } from "@/components/ui/chart";

const mockData = [
  { month: "Jan", earnings: 1200 },
  { month: "Feb", earnings: 1800 },
  { month: "Mar", earnings: 2400 },
  { month: "Apr", earnings: 3600 },
  { month: "May", earnings: 4200 },
  { month: "Jun", earnings: 5100 },
  { month: "Jul", earnings: 6300 },
  { month: "Aug", earnings: 7200 },
];

export function EarningsChart() {
  const { t } = useTranslation();

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>{t('dashboard.earnings.title', 'Earnings Overview')}</CardTitle>
        <CardDescription>
          {t('dashboard.earnings.description', 'Your monthly revenue from all courses')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[225px]">
          <ChartContainer
            config={{
              earnings: {
                theme: {
                  light: "var(--theme-primary)",
                  dark: "var(--theme-primary)",
                }
              }
            }}
          >
            <ResponsiveContainer>
              <LineChart
                data={mockData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {t('dashboard.month', 'Month')}
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {payload[0].payload.month}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {t('dashboard.earnings', 'Earnings')}
                              </span>
                              <span className="font-bold">
                                ${payload[0].value}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  stroke="#888888"
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  stroke="#888888"
                  tickFormatter={(value) => `$${value}`}
                  fontSize={12}
                />
                <Line
                  type="monotone"
                  strokeWidth={3}
                  dataKey="earnings"
                  activeDot={{
                    r: 8,
                    style: { fill: "var(--theme-primary)", opacity: 0.8 },
                  }}
                  style={{ stroke: "var(--theme-primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
