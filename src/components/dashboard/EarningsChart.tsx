
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslation } from 'react-i18next';

const data = [
  {
    month: "Jan",
    earnings: 0,
  },
  {
    month: "Feb",
    earnings: 180,
  },
  {
    month: "Mar",
    earnings: 260,
  },
  {
    month: "Apr",
    earnings: 450,
  },
  {
    month: "May",
    earnings: 320,
  },
  {
    month: "Jun",
    earnings: 792,
  },
];

export function EarningsChart() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.earnings.title', 'Earnings Overview')}</CardTitle>
        <CardDescription>
          {t('dashboard.earnings.description', 'Monthly platform revenue')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[225px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
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
        </div>
      </CardContent>
    </Card>
  );
}
