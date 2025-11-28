
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeft,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  doc,
  updateDoc,
  increment,
  writeBatch,
} from "firebase/firestore";

import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const transactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.enum(["deposit", "withdrawal"]),
  method: z.enum(["MTN MoMo", "Airtel Money", "Bank Transfer", "Other"]),
  phoneNumber: z.string().min(10, "Please enter a valid phone number."),
  reason: z.string().optional(),
});

type Category = { id: string; name: string };

export default function TransactionsPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const transactionsQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, `users/${user.uid}/transactions`), orderBy('timestamp', 'desc')) : null),
    [firestore, user]
  );
  const { data: transactions, isLoading } = useCollection(transactionsQuery);

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "deposit",
      method: "MTN MoMo",
      amount: undefined,
      phoneNumber: "",
      reason: "",
    },
  });

  async function onSubmit(values: z.infer<typeof transactionSchema>) {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You must be logged in to add a transaction.",
      });
      return;
    }

    form.control.disabled = true;
    try {
      const batch = writeBatch(firestore);

      // 1. Create the transaction document
      const transactionCol = collection(firestore, `users/${user.uid}/transactions`);
      const newTransactionRef = doc(transactionCol); // This creates a ref with a new ID
      batch.set(newTransactionRef, {
        ...values,
        id: newTransactionRef.id,
        userId: user.uid,
        timestamp: serverTimestamp(),
      });

      // 2. Update the user's totalSavings
      const userDocRef = doc(firestore, 'users', user.uid);
      const amountChange = values.type === 'deposit' ? values.amount : -values.amount;
      batch.update(userDocRef, {
        totalSavings: increment(amountChange)
      });
      
      await batch.commit();

      toast({
        title: "Transaction Recorded",
        description: `Your ${values.type} has been successfully recorded.`,
      });

      form.reset();
      setDialogOpen(false);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Transaction Failed",
        description: e.message || "An error occurred.",
      });
    } finally {
        form.control.disabled = false;
    }
  }

  return (
    <div className="p-4 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="text-2xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">
              A record of all your deposits and withdrawals.
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Transaction</DialogTitle>
              <DialogDescription>
                Log a deposit or withdrawal to update your balance.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select transaction type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="deposit">Deposit</SelectItem>
                          <SelectItem value="withdrawal">Withdrawal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (UGX)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Method */}
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MTN MoMo">MTN MoMo</SelectItem>
                          <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Number */}
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="e.g., 0771234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reason */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lunch with friends" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <DialogFooter>
                  <Button type="submit" disabled={form.control.disabled}>
                    {form.control.disabled ? 'Submitting...' : 'Add Transaction'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : transactions?.length ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Badge
                        variant={transaction.type === "deposit" ? "default" : "destructive"}
                        className={cn(
                          "flex items-center gap-1 w-fit capitalize",
                           transaction.type === "deposit" ? "bg-green-500" : ""
                        )}
                      >
                        {transaction.type === "deposit" ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownLeft className="h-3 w-3" />
                        )}
                        {transaction.type}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium">{transaction.reason || transaction.method}</div>
                      {transaction.reason && <div className="text-xs text-muted-foreground">{transaction.method}</div>}
                    </TableCell>

                    <TableCell>
                      {transaction.timestamp
                        ? formatDistanceToNow(transaction.timestamp.toDate(), {
                            addSuffix: true,
                          })
                        : "Just now"}
                    </TableCell>

                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        transaction.type === "deposit"
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      {transaction.type === "deposit" ? "+" : "-"} UGX{" "}
                      {transaction.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No transactions found.
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

    