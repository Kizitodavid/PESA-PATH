
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, PlusCircle, Users } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

const saccoSchema = z.object({
  name: z.string().min(3, 'SACCO name must be at least 3 characters'),
  goal: z.coerce.number().positive('Goal must be a positive number'),
});

export default function SaccosPage() {
  const router = useRouter();
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);

  const saccosColRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'saccos') : null),
    [firestore]
  );
  const { data: saccos, isLoading } = useCollection(saccosColRef);

  const form = useForm<z.infer<typeof saccoSchema>>({
    resolver: zodResolver(saccoSchema),
    defaultValues: {
      name: '',
      goal: 1000000,
    },
  });

  async function onSubmit(values: z.infer<typeof saccoSchema>) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create a SACCO.',
      });
      return;
    }

    try {
      await addDoc(collection(firestore, 'saccos'), {
        name: values.name,
        goal: values.goal,
        adminId: user.uid,
        memberIds: [user.uid],
        currentTotal: 0,
        createdAt: serverTimestamp(),
        rotationOrder: [user.uid],
      });

      toast({
        title: 'SACCO Created!',
        description: `${values.name} has been successfully created.`,
      });
      form.reset();
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Create SACCO',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  }

  const handleJoinSacco = async (saccoId: string) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to join a SACCO.',
      });
      return;
    }

    const saccoDocRef = doc(firestore, 'saccos', saccoId);
    try {
      await updateDoc(saccoDocRef, {
        memberIds: arrayUnion(user.uid),
        rotationOrder: arrayUnion(user.uid)
      });
      toast({
        title: 'Joined SACCO!',
        description: 'You are now a member of this savings group.',
      });
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Failed to Join SACCO',
        description: "There was an issue joining the SACCO. It might be due to security rules.",
      });
      console.error(error);
    }
  };


  return (
    <div className="p-4 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Group Savings (SACCOs)</h1>
            <p className="text-muted-foreground">
              Create or join savings groups to achieve goals together.
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create SACCO
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New SACCO</DialogTitle>
              <DialogDescription>
                Start a new savings group with a name and a goal.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SACCO Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Family Vacation Fund" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saving Goal (UGX)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1000000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Create SACCO</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available SACCOs</CardTitle>
          <CardDescription>
            Join an existing group or manage one you've created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Goal Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-1/4" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                ))
              ) : saccos && saccos.length > 0 ? (
                saccos.map((sacco) => {
                  const isMember = sacco.memberIds.includes(user?.uid);
                  const progress = sacco.goal > 0 ? (sacco.currentTotal / sacco.goal) * 100 : 0;
                  return (
                  <TableRow key={sacco.id}>
                    <TableCell className="font-medium">{sacco.name}</TableCell>
                    <TableCell>{sacco.memberIds.length}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <Progress value={progress} className="w-[60%]" />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <span className='text-xs text-muted-foreground'>
                        UGX {sacco.currentTotal.toLocaleString()} of UGX {sacco.goal.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                       {isMember ? (
                         <Button asChild variant="outline" size="sm">
                           <Link href={`/saccos/${sacco.id}`}>View & Deposit</Link>
                         </Button>
                       ) : (
                         <Button 
                           variant="default" 
                           size="sm" 
                           onClick={() => handleJoinSacco(sacco.id)}
                         >
                           Join
                         </Button>
                       )}
                    </TableCell>
                  </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    No SACCOs found.
                    <p className='text-sm text-muted-foreground'>Why not create one and invite your friends?</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
