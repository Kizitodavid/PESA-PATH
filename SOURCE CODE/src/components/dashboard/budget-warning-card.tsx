'use client';

import { useEffect, useState } from 'react';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { getBudgetOverspendingWarning } from '@/ai/flows/budget-overspending-warning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, doc } from 'firebase/firestore';

export function BudgetWarningCard() {
  const { user, firestore } = useFirebase();
  const [warning, setWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);

  const transactionsColRef = useMemoFirebase(
    () => (user ? collection(firestore, `users/${user.uid}/transactions`) : null),
    [user, firestore]
  );
  const { data: transactions, isLoading: areTransactionsLoading } = useCollection(transactionsColRef);

  useEffect(() => {
    async function checkOverspending() {
      if (!userData || !transactions || !userData.income) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const input = {
          income: userData.income,
          transactions: transactions.map(t => ({
            type: t.type,
            amount: t.amount,
            timestamp: t.timestamp?.toDate().toISOString() || new Date().toISOString(),
          }))
        };
        const result = await getBudgetOverspendingWarning(input);
        if (result.isOverspending) {
          setWarning(result.warningMessage);
        } else {
          setWarning(null);
        }
      } catch (error) {
        console.error("Failed to get budget warning:", error);
        setWarning(null); // Don't show a warning if the AI check fails
      } finally {
        setIsLoading(false);
      }
    }

    // Run check when user data and transactions are loaded
    if (!isUserLoading && !areTransactionsLoading) {
        checkOverspending();
    }
  }, [userData, transactions, isUserLoading, areTransactionsLoading]);

  if (isLoading) {
    return <Skeleton className="h-[100px] w-full" />;
  }

  if (!warning) {
    return null; // Don't render anything if there is no warning
  }

  return (
    <Card className="bg-destructive/10 border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Budget Alert
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-destructive font-medium">{warning}</p>
      </CardContent>
    </Card>
  );
}
