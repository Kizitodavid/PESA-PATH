'use client';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { FirebaseClientProvider } from '@/firebase/client-provider';

function PlannerLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <AppHeader />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}


export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <PlannerLayoutContent>{children}</PlannerLayoutContent>
    </FirebaseClientProvider>
  );
}
