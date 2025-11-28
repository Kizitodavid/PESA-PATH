
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowUpRight, Bot, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getPersonalizedInvestmentTips } from '@/ai/flows/personalized-investment-tips';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


const investmentOptions = [
  {
    title: 'Government Treasury Bonds',
    description: 'Low-risk investments backed by the government, offering fixed interest payments. Ideal for capital preservation.',
    riskLevel: 'Low',
    avgReturn: '8-12% p.a.',
    link: 'https://www.bou.or.ug/bou/bou-downloads/financial_markets/T-Bills-Bonds/FAQs-on-Govt-Securities.html',
  },
  {
    title: 'Real Estate Investment Trusts (REITs)',
    description: 'Invest in a portfolio of income-generating properties without buying physical real estate. Offers high dividends.',
    riskLevel: 'Medium',
    avgReturn: '5-15% p.a.',
    link: 'https://www.investopedia.com/terms/r/reit.asp',
  },
  {
    title: 'Stock Market (Index Funds)',
    description: 'Diversify your investment across the top companies in the market via the Uganda Securities Exchange.',
    riskLevel: 'Medium',
    avgReturn: '10-18% p.a.',
    link: 'https://www.use.or.ug/',
  },
  {
    title: 'SACCO Memberships',
    description: 'Join a Savings and Credit Cooperative Organization to access loans, earn dividends, and build a community.',
    riskLevel: 'Low to Medium',
    avgReturn: 'Varies (Dividends)',
    link: '/saccos',
  },
  {
    title: 'High-Growth Tech Stocks',
    description: 'Invest in individual technology companies with high growth potential. Higher risk, but potential for high rewards.',
    riskLevel: 'High',
    avgReturn: '20%+ p.a. (Volatile)',
    link: 'https://www.nasdaq.com/market-activity/stocks/screener',
  },
  {
    title: 'Agricultural Investments (Agri-tech)',
    description: 'Fund modern farming projects through agri-tech platforms. A growing sector with sustainable returns.',
    riskLevel: 'Medium to High',
    avgReturn: '15-25% p.a.',
    link: 'https://www.investopedia.com/articles/investing/090815/top-agriculture-stocks-etfs.asp',
  },
];

function AIPoweredTips() {
    const { user, firestore } = useFirebase();
    const { toast } = useToast();
    const [tips, setTips] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const userDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'users', user.uid) : null),
        [user, firestore]
    );
    const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

    const handleGetTips = async () => {
        if (!userData || !userData.age || !userData.income) {
            toast({
                variant: 'destructive',
                title: 'User data not found',
                description: 'Please complete your profile in settings to get personalized tips.',
            });
            return;
        }

        setIsLoading(true);
        setTips('');
        try {
            const result = await getPersonalizedInvestmentTips({
                age: userData.age,
                income: userData.income,
                savingPlan: userData.savingPlan,
            });
            setTips(result.tips);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error generating tips',
                description: error.message || 'Could not fetch AI-powered tips at this time.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <Card className="mb-8 bg-gradient-to-br from-primary/10 to-background">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot /> AI-Powered Investment Advisor</CardTitle>
                <CardDescription>Get personalized investment tips based on your profile.</CardDescription>
            </CardHeader>
            <CardContent>
                {isUserLoading ? <Skeleton className="h-10 w-48" /> : (
                    <Button onClick={handleGetTips} disabled={isLoading}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Generating...</> : <><Sparkles className="mr-2 h-4 w-4"/>Get My AI-Powered Tips</>}
                    </Button>
                )}

                {tips && (
                    <div className="mt-4 p-4 bg-background rounded-lg border">
                        <h4 className="font-semibold mb-2">Here are your personalized tips:</h4>
                        <div
                            className="prose prose-sm max-w-none text-foreground"
                            dangerouslySetInnerHTML={{ __html: tips.replace(/•/g, '<br/>•') }}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function InvestmentsPage() {
  const router = useRouter();
  return (
    <div className="p-4 sm:px-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Explore Investments</h1>
              <p className="text-muted-foreground">
                Discover popular investment opportunities to grow your wealth.
              </p>
            </div>
        </div>
      </div>
      
      <div className="mt-6">
         <AIPoweredTips />
      </div>


      <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
        {investmentOptions.map((deal) => (
          <Card key={deal.title} className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                      <CardTitle>{deal.title}</CardTitle>
                      <CardDescription className="mt-1">{deal.description}</CardDescription>
                  </div>
                   <div className={`text-xs font-bold py-1 px-2 rounded-full ${
                      deal.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                      deal.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                      {deal.riskLevel} Risk
                  </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
               <div className="flex justify-between text-sm text-muted-foreground">
                <span>Avg. Return:</span>
                <span className="font-semibold text-foreground">{deal.avgReturn}</span>
              </div>
            </CardContent>
            <div className="p-6 pt-0">
               <Button asChild className="w-full">
                <Link href={deal.link} target="_blank" rel="noopener noreferrer">
                  Learn More <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
