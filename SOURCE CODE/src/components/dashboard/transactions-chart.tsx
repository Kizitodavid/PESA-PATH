'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useMemo } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';

const chartConfig = {
  deposits: {
    label: 'Deposits',
    color: 'hsl(var(--chart-1))',
  },
  withdrawals: {
    label: 'Withdrawals',
    color: 'hsl(var(--chart-2))',
  },
};

export function TransactionsChart({ transactions }: { transactions: any[] | null }) {
  const chartData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 6); // Last 7 days including today
    const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });

    const dailyData = dateInterval.map(day => ({
        date: format(day, 'MMM d'), // Format as 'Jan 23'
        deposits: 0,
        withdrawals: 0,
    }));

    if (transactions) {
      transactions.forEach(transaction => {
        const transactionDate = transaction.timestamp.toDate();
        const formattedDate = format(transactionDate, 'MMM d');
        
        const dayData = dailyData.find(d => d.date === formattedDate);

        if (dayData) {
            if (transaction.type === 'deposit') {
                dayData.deposits += transaction.amount;
            } else {
                dayData.withdrawals += transaction.amount;
            }
        }
      });
    }

    return dailyData;
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposits vs. Withdrawals</CardTitle>
        <CardDescription>A summary of your cash flow for the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData}>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `UGX ${value.toLocaleString()}`}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
                content={<ChartTooltipContent formatter={(value) => `UGX ${Number(value).toLocaleString()}`} />}
              />
              <Legend />
              <Bar dataKey="deposits" fill="var(--color-deposits)" name="Deposits" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withdrawals" fill="var(--color-withdrawals)" name="Withdrawals" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
