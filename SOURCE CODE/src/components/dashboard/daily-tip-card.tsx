'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb } from 'lucide-react';
import { getDailyFinancialTip } from '@/ai/flows/daily-financial-tip';

export function DailyTipCard() {
  const [tip, setTip] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTip() {
      const today = new Date().toISOString().split('T')[0]; // Get date in YYYY-MM-DD format
      
      try {
        const storedTipData = localStorage.getItem('dailyFinancialTip');
      
        if (storedTipData) {
          const { date, tip } = JSON.parse(storedTipData);
          if (date === today) {
            setTip(tip);
            setIsLoading(false);
            return; // Use cached tip
          }
        }
      } catch (e) {
          console.error("Could not read daily tip from localStorage", e);
      }


      // If no cached tip or tip is outdated, fetch a new one
      try {
        const response = await getDailyFinancialTip();
        const newTip = response.tip;
        setTip(newTip);
        // Cache the new tip with today's date
        try {
            localStorage.setItem('dailyFinancialTip', JSON.stringify({ date: today, tip: newTip }));
        } catch (e) {
            console.error("Could not save daily tip to localStorage", e);
        }
      } catch (error) {
        console.error('Failed to fetch daily tip:', error);
        setTip('Could not load a tip right now. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTip();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          Daily Financial Tip
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-muted-foreground">{tip}</p>
        )}
      </CardContent>
    </Card>
  );
}
