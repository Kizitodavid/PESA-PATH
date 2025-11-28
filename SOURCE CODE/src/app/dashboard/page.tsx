'use client';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { TransactionsChart } from '@/components/dashboard/transactions-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { AIAssistant } from '@/components/dashboard/ai-assistant';
import { DailyTipCard } from '@/components/dashboard/daily-tip-card';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { Wallet, PiggyBank, Target, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BudgetWarningCard } from '@/components/dashboard/budget-warning-card';

export default function DashboardPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);

  const transactionsColRef = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'transactions') : null),
    [firestore, user]
  );
  const { data: transactions, isLoading: isTransactionsLoading } = useCollection(transactionsColRef);
  
  const recentTransactionsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('timestamp', 'desc'), limit(5)) : null),
    [firestore, user]
  );
  const { data: recentTransactions, isLoading: areRecentTransactionsLoading } = useCollection(recentTransactionsQuery);


  const streakColRef = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'streaks') : null),
    [firestore, user]
  );
  const { data: streakCollection, isLoading: isStreakLoading } = useCollection(streakColRef);
  const streakData = streakCollection && streakCollection.length > 0 ? streakCollection[0] : null;


  const overviewCards = [
    {
      title: 'Current Balance',
      value: userData ? `UGX ${(userData.totalSavings || 0).toLocaleString()}` : 'UGX 0',
      change: '',
      icon: Wallet,
    },
    {
      title: 'Total Savings',
      value: userData ? `UGX ${(userData.totalSavings || 0).toLocaleString()}` : 'UGX 0',
      change: '',
      icon: PiggyBank,
    },
    {
        title: 'XP Points',
        value: `${streakData?.xp || 0}`,
        change: 'Keep saving!',
        icon: TrendingUp,
    },
    {
        title: 'Saving Streak',
        value: `${streakData?.streakLength || 0} days`,
        change: 'On fire!',
        icon: Target,
    },
  ];
  
  const isLoading = isAuthLoading || isUserDocLoading || isTransactionsLoading || isStreakLoading || areRecentTransactionsLoading;

  if (isLoading) {
    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[126px]" />)}
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mt-4">
                <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                    <Skeleton className="h-[150px]" />
                    <Skeleton className="h-[350px]" />
                    <Skeleton className="h-[400px]" />
                </div>
                <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
                    <Skeleton className="h-[560px]" />
                </div>
            </div>
        </>
    )
  }


  return (
    <>
      <BudgetWarningCard />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
        {overviewCards.map((data) => (
          <OverviewCard key={data.title} {...data} />
        ))}
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mt-4">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <DailyTipCard />
          <TransactionsChart transactions={transactions} />
          <RecentTransactions transactions={recentTransactions} />
        </div>
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
          <AIAssistant />
        </div>
      </div>
    </>
  );
}
