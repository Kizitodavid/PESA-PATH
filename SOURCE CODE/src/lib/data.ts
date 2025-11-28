import { Wallet, PiggyBank, Target, TrendingUp, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export const overviewData = [
  {
    title: 'Current Balance',
    value: '$0.00',
    change: '+0.0%',
    icon: Wallet,
  },
  {
    title: 'Total Savings',
    value: '$0.00',
    change: '+0.0%',
    icon: PiggyBank,
  },
  {
    title: 'XP Points',
    value: '0',
    change: '+0 XP',
    icon: TrendingUp,
  },
  {
    title: 'Saving Streak',
    value: '0 days',
    change: 'Keep it up!',
    icon: Target,
  },
];

export const transactionsChartData: { month: string; deposits: number; withdrawals: number; }[] = [];

export const recentTransactionsData: any[] = [];

export const aiAssistantMessages = [
    {
        id: 1,
        sender: 'ai' as const,
        text: "Hello! I'm your AI financial assistant. How can I help you achieve your financial goals today?"
    }
]
