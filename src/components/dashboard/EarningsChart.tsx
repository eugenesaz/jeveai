
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartLineUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Generate mock data for the last 12 weeks
const generateMockData = () => {
  const data = [];
  const today = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i * 7);
    
    data.push({
      week: `Week ${12-i}`,
      earnings: Math.floor(Math.random() * 30000),
      date: date.toISOString().split('T')[0],
    });
  }
  
  return data;
};

const mockData = generateMockData();

export const EarningsChart = () => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <ChartLineUp className="h-5 w-5 text-purple-500" />
          {t('dashboard.earnings.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={mockData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 20,
              }}
            >
              <defs>
                <linearGradient id="earnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9b87f5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9b87f5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="week"
                stroke="#888888"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#888888', fontSize: 12 }}
              />
              <YAxis
                stroke="#888888"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#888888', fontSize: 12 }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {payload[0].payload.date}
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {payload[0].payload.week}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {t('dashboard.earnings.earnings')}
                            </span>
                            <span className="font-bold">
                              ${payload[0].value?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="#9b87f5"
                fill="url(#earnings)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
