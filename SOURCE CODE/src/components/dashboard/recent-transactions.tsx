'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export function RecentTransactions({ transactions }: { transactions: any[] | null }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
         <div className="grid gap-2">
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Here are your most recent deposits and withdrawals.
          </CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="/transactions">
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions && transactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="font-medium">{transaction.reason || transaction.method}</div>
                     {transaction.reason && <div className="text-xs text-muted-foreground">{transaction.method}</div>}
                  </TableCell>
                  <TableCell className={cn("text-right", transaction.type === 'deposit' ? 'text-green-500' : 'text-red-500')}>
                    {transaction.type === 'deposit' ? '+' : '-'}UGX {transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {transaction.timestamp ? formatDistanceToNow(transaction.timestamp.toDate(), { addSuffix: true }) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={transaction.type === 'deposit' ? 'default' : 'secondary'} className={cn(transaction.type === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No transactions yet. Make your first deposit to get started!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
