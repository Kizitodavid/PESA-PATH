'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  PiggyBank,
  ArrowRightLeft,
  Users,
  BarChart,
  Settings,
  UserCircle,
  Shield,
  Landmark,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: ArrowRightLeft, label: 'Transactions' },
  { href: '/saccos', icon: Users, label: 'SACCOs' },
  { href: '/investments', icon: BarChart, label: 'Investments' },
  { href: '/planner', icon: Landmark, label: 'Money Planner' },
];

const bottomNavItems = [
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();

  const adminRoleRef = useMemoFirebase(() => (user ? doc(firestore, 'roles_admin', user.uid) : null), [user, firestore]);
  const { data: adminRole } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole;

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-card sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/dashboard"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <PiggyBank className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">Pesa Path</span>
        </Link>
        <TooltipProvider>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <Button
                    variant={pathname.startsWith(item.href) ? 'default' : 'ghost'}
                    size="icon"
                    className={cn(
                      "rounded-lg",
                      { "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary": pathname.startsWith(item.href) }
                    )}
                    aria-label={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          ))}
          {isAdmin && (
             <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/admin">
                  <Button
                    variant={pathname.startsWith('/admin') ? 'default' : 'ghost'}
                    size="icon"
                    className={cn(
                      "rounded-lg",
                      { "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary": pathname.startsWith('/admin') }
                    )}
                    aria-label="Admin"
                  >
                    <Shield className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                Admin
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
             <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={'/settings'}>
                     <Button
                        variant={pathname.startsWith('/settings') ? 'default' : 'ghost'}
                        size="icon"
                        className={cn(
                          "rounded-lg",
                          { "bg-primary/10 text-primary": pathname.startsWith('/settings') }
                        )}
                        aria-label={'Settings'}
                      >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                  {'Settings'}
                </TooltipContent>
              </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
