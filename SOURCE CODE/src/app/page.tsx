
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShieldCheck, PiggyBank, Bot } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const stats = [
    { value: '10,000+', label: 'Happy Users' },
    { value: 'UGX 10B+', label: 'Saved Collectively' },
    { value: '500+', label: 'SACCOs Formed' },
    { value: '98%', label: 'Goal Achievement Rate' },
  ];

  const features = [
    {
      icon: <PiggyBank className="w-10 h-10 text-primary" />,
      title: 'Smart Budgeting',
      description: 'Set your budget and we help you stick to it with intelligent warnings and insights.',
    },
    {
      icon: <Users className="w-10 h-10 text-primary" />,
      title: 'Group Savings (SACCOs)',
      description: 'Achieve financial goals faster with friends and family. Create or join saving circles.',
    },
    {
      icon: <ShieldCheck className="w-10 h-10 text-primary" />,
      title: 'Secure Payments',
      description: 'Easily deposit and withdraw funds using MTN MoMo and Airtel Money.',
    },
    {
      icon: <Bot className="w-10 h-10 text-primary" />,
      title: 'AI Financial Advisor',
      description: 'Get personalized financial advice, tips, and investment strategies from our AI assistant.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-2">
           <PiggyBank className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Pesa Path</h1>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Features
          </Link>
          <Link href="#saccos" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            SACCOs
          </Link>
        </nav>
        <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
                <Link href="/login">Get Started</Link>
            </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="relative h-[60vh] md:h-[70vh] w-full flex items-center justify-center text-center overflow-hidden">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover z-0"
                src="https://videos.pexels.com/video-files/853874/853874-hd_1920_1080_25fps.mp4"
            />
            <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-10" />
            <div className="relative z-20 px-4 sm:px-6 lg:px-8 text-white">
                 <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                    Your Path to Financial Freedom Starts Here
                 </h2>
                <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-slate-200">
                    Pesa Path helps you manage money, plan budgets, form group savings (SACCOs), and learn to invest in a fun, gamified, and AI-guided experience.
                </p>
                <div className="mt-8">
                    <Button size="lg" asChild>
                    <Link href="/dashboard">Start Your Financial Journey</Link>
                    </Button>
                </div>
            </div>
        </section>


        <section className="bg-gradient-to-r from-primary/80 to-accent/80 text-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl md:text-4xl font-bold">{stat.value}</p>
                  <p className="mt-1 opacity-90">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section id="features" className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
           <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold">A Better Way to Manage Your Money</h3>
            <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">Everything you need to achieve your financial goals in one platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="mx-auto bg-primary/20 rounded-full w-20 h-20 flex items-center justify-center">
                    {feature.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <h4 className="font-bold text-lg">{feature.title}</h4>
                  <p className="text-muted-foreground mt-2 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-gradient-to-r from-primary/80 to-accent/80 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5" />
                <span className="font-bold">Pesa Path</span>
            </div>
            <div className="flex gap-4">
                <Link href="/terms" className="text-sm opacity-90 hover:opacity-100">
                    Terms & Conditions
                </Link>
            </div>
            <p className="text-sm opacity-90">&copy; {new Date().getFullYear()} Pesa Path. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
