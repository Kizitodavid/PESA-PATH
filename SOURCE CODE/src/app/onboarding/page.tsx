'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { PiggyBank } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  savingPlan: z.enum(['weekly', 'monthly', 'yearly']),
  age: z.coerce.number().min(18, "You must be at least 18 years old.").max(100),
  income: z.coerce.number().positive("Please enter a valid monthly income."),
});

export default function OnboardingPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      savingPlan: 'monthly',
      age: undefined,
      income: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to complete onboarding.',
      });
      return;
    }

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        savingPlan: values.savingPlan,
        age: values.age,
        income: values.income,
      });

      toast({
        title: 'Preferences Saved!',
        description: 'You are all set to start your financial journey.',
      });

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message,
      });
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
        <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
                <PiggyBank className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Pesa Path</h1>
            </Link>
        </header>
        <main className="flex-grow flex items-center justify-center">
            <Card className="w-[450px]">
                <CardHeader>
                <CardTitle>Welcome to Pesa Path!</CardTitle>
                <CardDescription>Let's set up your profile to get you started.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="savingPlan"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Saving Frequency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select how often you want to save" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormDescription>
                            This is how often you plan to make deposits.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Age</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 25" {...field} />
                            </FormControl>
                             <FormDescription>
                                Your age helps us tailor financial advice.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="income"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Monthly Income (UGX)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 1500000" {...field} />
                            </FormControl>
                             <FormDescription>
                                Your income helps us provide personalized tips.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full">Complete Setup</Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
      </main>
    </div>
  );
}
