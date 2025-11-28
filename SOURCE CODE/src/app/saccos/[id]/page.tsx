
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, where, query, documentId, writeBatch } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, User, ChevronsRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';

const depositSchema = z.object({
  amount: z.coerce
    .number()
    .positive('Deposit amount must be positive.')
    .min(1000, 'Minimum deposit is UGX 1,000.'),
});

// A component to display the list of members
function MemberList({ memberIds }: { memberIds: string[] }) {
    const { firestore } = useFirebase();
    const [memberData, setMemberData] = useState<Map<string, {name: string, photoURL?: string}>>(new Map());

    const membersQuery = useMemoFirebase(() => {
        if (!firestore || memberIds.length === 0) return null;
        // Firestore 'in' query is limited to 30 items. For larger groups, pagination would be needed.
        return query(collection(firestore, 'users'), where(documentId(), 'in', memberIds.slice(0, 30)));
    }, [firestore, memberIds]);

    const { data: members, isLoading } = useCollection(membersQuery);

    useEffect(() => {
        if (members) {
            const dataMap = new Map();
            members.forEach(member => {
                dataMap.set(member.id, { name: member.name, photoURL: member.photoURL });
            });
            setMemberData(dataMap);
        }
    }, [members, memberIds]);


    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(Math.min(memberIds.length, 3))].map((_, i) => (
                     <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-5 w-2/3" />
                    </div>
                ))}
            </div>
        );
    }
    
    if (memberIds.length === 0) {
        return <p className="text-sm text-muted-foreground">No members yet. Be the first to join!</p>;
    }


    return (
        <div className="space-y-3">
            {memberIds.map((id) => (
                <div key={id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={memberData.get(id)?.photoURL} />
                        <AvatarFallback>{memberData.get(id)?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{memberData.get(id)?.name || 'Loading...'}</span>
                </div>
            ))}
        </div>
    );
}


export default function SaccoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const saccoId = typeof id === 'string' ? id : '';

  const saccoDocRef = useMemoFirebase(
    () => (firestore && saccoId ? doc(firestore, 'saccos', saccoId) : null),
    [firestore, saccoId]
  );
  const { data: sacco, isLoading: isSaccoLoading } = useDoc(saccoDocRef);

  const form = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: undefined,
    },
  });

  const isMember = sacco && user ? sacco.memberIds.includes(user.uid) : false;

  async function onSubmit(values: z.infer<typeof depositSchema>) {
    if (!user || !firestore || !sacco) {
      toast({
        variant: 'destructive',
        title: 'Operation Forbidden',
        description: 'You must be logged in and a member to deposit.',
      });
      return;
    }

    form.control.disabled = true;
    try {
      // Use a write batch to perform atomic operations
      const batch = writeBatch(firestore);

      // 1. Decrease the user's totalSavings
      const userDocRef = doc(firestore, 'users', user.uid);
      batch.update(userDocRef, {
          totalSavings: increment(-values.amount),
      });

      // 2. Increase the SACCO's currentTotal
      const saccoRef = doc(firestore, 'saccos', saccoId);
      batch.update(saccoRef, {
        currentTotal: increment(values.amount),
      });

      // 3. Record a "SACCO Deposit" withdrawal transaction for the user
      const transactionColRef = collection(firestore, `users/${user.uid}/transactions`);
      const newTransactionRef = doc(transactionColRef); // Create a ref to get an ID
      batch.set(newTransactionRef, {
        id: newTransactionRef.id,
        amount: values.amount,
        type: 'withdrawal',
        method: 'SACCO Deposit',
        reason: `Deposit to ${sacco.name}`,
        userId: user.uid,
        timestamp: serverTimestamp(),
        phoneNumber: user.phoneNumber || 'N/A'
      });
      
      // Commit the batch
      await batch.commit();

      toast({
        title: 'Deposit Successful!',
        description: `You have successfully deposited UGX ${values.amount.toLocaleString()} into ${sacco.name}.`,
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Deposit Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      form.control.disabled = false;
    }
  }
  
  if (isSaccoLoading) {
    return (
        <div className="p-4 sm:px-6 space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    )
  }

  if (!sacco) {
    return (
      <div className="p-4 sm:px-6 text-center">
        <h1 className="text-2xl font-bold">SACCO not found</h1>
        <p className="text-muted-foreground">The SACCO you are looking for does not exist.</p>
        <Button onClick={() => router.push('/saccos')} className="mt-4">
          Back to SACCOs
        </Button>
      </div>
    );
  }

  const progress = sacco.goal > 0 ? (sacco.currentTotal / sacco.goal) * 100 : 0;

  return (
    <div className="p-4 sm:px-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push('/saccos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{sacco.name}</h1>
          <p className="text-muted-foreground">Group savings circle details and actions.</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Goal Progress</CardTitle>
                    <CardDescription>
                        Tracking the collective savings goal for {sacco.name}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-2 flex justify-between items-end">
                        <span className="text-3xl font-bold">UGX {sacco.currentTotal.toLocaleString()}</span>
                        <span className="text-muted-foreground">of UGX {sacco.goal.toLocaleString()}</span>
                    </div>
                     <Progress value={progress} className="w-full h-3" />
                     <p className="text-right mt-1 text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ChevronsRight className="h-5 w-5" /> Payout Rotation</CardTitle>
                    <CardDescription>
                        This is the order in which members will receive payouts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">Rotation logic and payouts coming soon.</p>
                   {/* Placeholder for rotation display */}
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Make a Deposit</CardTitle>
                    <CardDescription>Contribute to the group goal.</CardDescription>
                </CardHeader>
                <CardContent>
                    {user && isMember ? (
                         <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Amount (UGX)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 50000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <Button type="submit" className="w-full" disabled={form.control.disabled}>
                                    {form.control.disabled ? 'Depositing...' : 'Deposit Money'}
                                </Button>
                            </form>
                        </Form>
                    ) : (
                        <div className="text-center text-muted-foreground p-4 bg-secondary rounded-md">
                            <p>You must be a member to make a deposit.</p>
                             {!isMember && user && (
                                <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/saccos')}>
                                    Join this SACCO to deposit
                                </Button>
                            )}
                            {!user && (
                                <Button variant="link" onClick={() => router.push('/login')}>Login</Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Members</CardTitle>
                    <CardDescription>
                        {sacco.memberIds.length} member(s) in this SACCO.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <MemberList memberIds={sacco.memberIds} />
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}

    