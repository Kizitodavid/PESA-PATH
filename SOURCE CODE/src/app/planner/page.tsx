
'use client';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, Trash2, Edit, AlertTriangle, CheckCircle, ListPlus, Banknote } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, addDoc, deleteDoc, updateDoc, writeBatch, type User } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getWeek, getMonth, getYear, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

type BudgetPeriod = 'monthly' | 'weekly';

const categorySchema = z.object({
  name: z.string().min(2, 'Category name is too short'),
  budgeted: z.coerce.number().positive('Budget must be a positive number'),
});

type Category = z.infer<typeof categorySchema> & { id: string; period: string };
type Transaction = { id: string; type: 'deposit' | 'withdrawal'; amount: number; timestamp: { toDate: () => Date }; categoryId?: string };


function AssignTransactionsModal({ transactions, categories, period, onAssign, user }: { transactions: Transaction[], categories: Category[], period: BudgetPeriod, onAssign: () => void, user: User | null }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [assignments, setAssignments] = useState<Record<string, { categoryId?: string; reason?: string }>>({});
    const [isSaving, setIsSaving] = useState(false);

    const getPeriodKey = (date: Date, period: BudgetPeriod) => {
        const year = getYear(date);
        if (period === 'monthly') return `${year}-${getMonth(date)}`;
        if (period === 'weekly') return `${year}-W${getWeek(date)}`;
        return '';
    };
    
    const currentDate = new Date();
    const currentPeriodKey = getPeriodKey(currentDate, period);
    
    const unassignedTransactions = useMemo(() => {
        return transactions.filter(t => 
            !t.categoryId && 
            t.type === 'withdrawal' &&
            getPeriodKey(t.timestamp.toDate(), period) === currentPeriodKey
        );
    }, [transactions, period, currentPeriodKey]);

    const handleAssignmentChange = (transactionId: string, field: 'categoryId' | 'reason', value: string) => {
        setAssignments(prev => ({
            ...prev,
            [transactionId]: {
                ...prev[transactionId],
                [field]: value
            }
        }));
    };
    
    const handleSaveAssignments = async () => {
        if (!firestore || !user) return;
        setIsSaving(true);
        const batch = writeBatch(firestore);
        
        Object.entries(assignments).forEach(([transactionId, assignmentData]) => {
            if (assignmentData.categoryId) { // Only update if a category is chosen
                const transactionRef = doc(firestore, `users/${user.uid}/transactions`, transactionId);
                const updateData: { categoryId: string; reason?: string } = { categoryId: assignmentData.categoryId };
                if (assignmentData.reason) {
                    updateData.reason = assignmentData.reason;
                }
                batch.update(transactionRef, updateData);
            }
        });

        try {
            await batch.commit();
            toast({ title: "Assignments saved!", description: "Your withdrawals have been categorized."});
            onAssign();
            setAssignments({});
        } catch (error: any) {
            toast({ title: "Error saving assignments", description: error.message, variant: 'destructive'});
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Dialog onOpenChange={(open) => !open && setAssignments({})}>
            <DialogTrigger asChild>
                <Button variant="outline"><ListPlus className="mr-2 h-4 w-4"/>Assign Withdrawals</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Assign Uncategorized Withdrawals</DialogTitle>
                    <DialogDescription>
                        Assign your recent withdrawals to budget categories for the current {period}.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-4 pr-6">
                    {unassignedTransactions.length > 0 ? unassignedTransactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between gap-4 p-3 bg-secondary rounded-lg">
                            <div className="w-1/4">
                                <p className="font-medium">UGX {t.amount.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">{t.timestamp.toDate().toLocaleDateString()}</p>
                            </div>
                            <div className="w-1/4">
                                 <Select onValueChange={(categoryId) => handleAssignmentChange(t.id, 'categoryId', categoryId)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Assign category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="w-2/4">
                                <Input 
                                    placeholder="Add a reason (optional)"
                                    onChange={(e) => handleAssignmentChange(t.id, 'reason', e.target.value)}
                                />
                             </div>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Banknote className="mx-auto h-8 w-8 mb-2"/>
                            <p>No uncategorized withdrawals for this period.</p>
                        </div>
                    )}
                  </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSaveAssignments} disabled={Object.keys(assignments).length === 0 || isSaving}>
                        {isSaving ? "Saving..." : "Save Assignments"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function PlannerPage() {
    const router = useRouter();
    const { user, firestore } = useFirebase();
    const { toast } = useToast();
    const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>('monthly');

    const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
    const { data: userData, isLoading: isUserLoading } = useDoc(userDocRef);
    
    const categoriesColRef = useMemoFirebase(() => (user ? collection(firestore, `users/${user.uid}/budgetCategories`) : null), [user, firestore]);
    const { data: allCategories, isLoading: areCategoriesLoading, error: catError } = useCollection<Category>(categoriesColRef);
    
    const transactionsColRef = useMemoFirebase(() => (user ? collection(firestore, `users/${user.uid}/transactions`) : null), [user, firestore]);
    const { data: allTransactions, isLoading: areTransactionsLoading } = useCollection<Transaction>(transactionsColRef);

    const form = useForm<z.infer<typeof categorySchema>>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: '', budgeted: undefined },
    });
    
    const getPeriodKey = (date: Date, period: BudgetPeriod) => {
        const year = getYear(date);
        if (period === 'monthly') return `${year}-${getMonth(date)}`;
        if (period === 'weekly') return `${year}-W${getWeek(date)}`;
        return '';
    };

    const currentPeriodKey = getPeriodKey(new Date(), budgetPeriod);

    async function handleAddCategory(values: z.infer<typeof categorySchema>) {
        if (!user || !firestore) return;
        
        const categoriesCol = collection(firestore, `users/${user.uid}/budgetCategories`);
        
        try {
            await addDoc(categoriesCol, {
                ...values,
                userId: user.uid,
                period: getPeriodKey(new Date(), budgetPeriod) // Store period with category
            });
            toast({ title: 'Category Added!', description: `${values.name} has been added to your budget.` });
            form.reset();
            setCategoryDialogOpen(false);
        } catch(error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    }
    
    async function handleDeleteCategory(id: string) {
        if (!user || !firestore) return;
        const categoryDoc = doc(firestore, `users/${user.uid}/budgetCategories`, id);
        try {
            await deleteDoc(categoryDoc);
            toast({ title: 'Category Removed', variant: 'destructive'});
        } catch(error: any) {
             toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    }

    const { categories, transactionsForPeriod } = useMemo(() => {
        if (!allCategories || !allTransactions) return { categories: [], transactionsForPeriod: [] };
        
        const filteredCategories = allCategories.filter(c => c.period === currentPeriodKey);
        
        const periodStartDate = budgetPeriod === 'monthly' ? startOfMonth(new Date()) : startOfWeek(new Date());
        const periodEndDate = budgetPeriod === 'monthly' ? endOfMonth(new Date()) : endOfWeek(new Date());

        const filteredTransactions = allTransactions.filter(t => {
            const tDate = t.timestamp.toDate();
            return tDate >= periodStartDate && tDate <= periodEndDate;
        });

        return { categories: filteredCategories, transactionsForPeriod: filteredTransactions };

    }, [allCategories, allTransactions, budgetPeriod, currentPeriodKey]);

    const categoriesWithSpent = useMemo(() => {
        if (!categories || !transactionsForPeriod) return [];
        return categories.map(cat => {
            const spent = transactionsForPeriod
                .filter(t => t.type === 'withdrawal' && t.categoryId === cat.id)
                .reduce((sum, t) => sum + t.amount, 0);
            return { ...cat, spent };
        });

    }, [categories, transactionsForPeriod]);

    const totalBudgeted = categoriesWithSpent?.reduce((sum, cat) => sum + cat.budgeted, 0) || 0;
    const totalSpent = categoriesWithSpent?.reduce((sum, cat) => sum + cat.spent, 0) || 0;
    const remainingBalance = totalBudgeted - totalSpent;
    const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    
    if (isUserLoading || areCategoriesLoading || areTransactionsLoading) {
        return (
            <div className="p-4 sm:px-6 max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-10 w-1/2" />
                <Card>
                    <CardHeader>
                        <CardTitle>Budget Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                           <Skeleton className="h-24" />
                           <Skeleton className="h-24" />
                           <Skeleton className="h-24" />
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/3" />
                         <Skeleton className="h-5 w-1/2" />
                    </CardHeader>
                    <CardContent>
                         <Skeleton className="h-32" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4 sm:px-6 max-w-4xl mx-auto">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Money Planner</h1>
                            <p className="text-muted-foreground">Your space for budgeting and financial planning.</p>
                        </div>
                    </div>
                     <Select onValueChange={(value: BudgetPeriod) => setBudgetPeriod(value)} defaultValue={budgetPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monthly">Monthly Budget</SelectItem>
                            <SelectItem value="weekly">Weekly Budget</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Budget Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Budget Summary</CardTitle>
                        <CardDescription>
                            This is your budget summary for the current {budgetPeriod.slice(0,-2)}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <Card className="p-4">
                               <CardDescription>Income this month</CardDescription>
                               <p className="text-2xl font-bold">UGX {(userData?.income || 0).toLocaleString()}</p>
                            </Card>
                             <Card className="p-4">
                               <CardDescription>Total Budget</CardDescription>
                               <p className="text-2xl font-bold">UGX {totalBudgeted.toLocaleString()}</p>
                            </Card>
                             <Card className="p-4">
                               <CardDescription>Remaining</CardDescription>
                               <p className={`text-2xl font-bold ${remainingBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
                                 UGX {remainingBalance.toLocaleString()}
                               </p>
                            </Card>
                        </div>
                         <div>
                            <div className="mb-1 flex justify-between">
                                <span>Overall Progress</span>
                                <span>UGX {totalSpent.toLocaleString()} / {totalBudgeted.toLocaleString()}</span>
                            </div>
                            <Progress value={overallProgress} className={overallProgress > 100 ? '[&>div]:bg-destructive' : ''} />
                         </div>
                    </CardContent>
                </Card>

                {/* Budget Categories */}
                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                         <div>
                            <CardTitle>Budget Categories</CardTitle>
                            <CardDescription>Your spending breakdown for this budget period.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                             <AssignTransactionsModal 
                                transactions={allTransactions || []} 
                                categories={categories}
                                period={budgetPeriod}
                                onAssign={() => {}} // This could trigger a re-fetch or re-calculation if needed
                                user={user}
                             />
                            <Dialog open={isCategoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <PlusCircle className="mr-2 h-4 w-4"/>
                                        Add Category
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Budget Category</DialogTitle>
                                        <DialogDescription>Create a new category for your {budgetPeriod} budget.</DialogDescription>
                                    </DialogHeader>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(handleAddCategory)} className="space-y-4">
                                            <FormField control={form.control} name="name" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category Name</FormLabel>
                                                    <FormControl><Input placeholder="e.g., Data Bundles" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                             <FormField control={form.control} name="budgeted" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Budget Amount (UGX)</FormLabel>
                                                    <FormControl><Input type="number" placeholder="e.g., 50000" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <DialogFooter>
                                                <Button type="submit">Save Category</Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {categoriesWithSpent && categoriesWithSpent.length > 0 ? categoriesWithSpent.map(cat => {
                            const progress = cat.budgeted > 0 ? (cat.spent / cat.budgeted) * 100 : 0;
                            const isOver = progress > 100;
                            const remaining = cat.budgeted - cat.spent;
                            return (
                                <Card key={cat.id} className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold">{cat.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                <span className={isOver ? 'text-destructive font-bold' : ''}>
                                                    UGX {cat.spent.toLocaleString()}
                                                </span>
                                                {' '} of UGX {cat.budgeted.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                                                <Edit className="h-4 w-4"/>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                    <Progress value={Math.min(progress, 100)} className={cn("mt-2 h-2", isOver ? '[&>div]:bg-destructive' : '')} />
                                    {isOver ? (
                                        <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            You are UGX {Math.abs(remaining).toLocaleString()} over budget!
                                        </p>
                                    ) : (
                                         <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            You have UGX {remaining.toLocaleString()} remaining.
                                        </p>
                                    )}
                                </Card>
                            )
                        }) : (
                             <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p>No budget categories for this {budgetPeriod} yet.</p>
                                <p className="text-sm">Click "Add Category" to get started!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

    