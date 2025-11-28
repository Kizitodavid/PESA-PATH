'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from './login-form';
import { SignupForm } from './signup-form';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PiggyBank } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083L43.595 20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C43.021 36.25 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
)

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    if (!auth || !firestore) {
        toast({ variant: 'destructive', title: 'Firebase not initialized.' });
        return;
    }
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document already exists
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // New user - create document and redirect to onboarding
        await setDoc(userDocRef, {
            id: user.uid,
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            age: 0,
            income: 0,
            savingPlan: '',
            totalSavings: 0,
            isFrozen: false,
        });
        toast({
            title: 'Account Created!',
            description: 'Welcome to Pesa Path! Let\'s get you set up.',
        });
        router.push('/onboarding');
      } else {
         // Existing user - just log them in
         toast({
            title: 'Login Successful',
            description: `Welcome back, ${user.displayName || 'friend'}!`,
         });
         router.push('/dashboard');
      }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Uh oh! Something went wrong.',
            description: error.message,
        });
    }
  };


  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div>Loading...</div>
      </div>
    );
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
            <Tabs defaultValue="login" className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                <Card>
                    <CardHeader>
                        <CardTitle>Login</CardTitle>
                        <CardDescription>
                            Access your Pesa Path account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                            <GoogleIcon /> Sign in with Google
                        </Button>
                        <div className="relative">
                           <div className="absolute inset-0 flex items-center">
                               <span className="w-full border-t" />
                           </div>
                           <div className="relative flex justify-center text-xs uppercase">
                               <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                           </div>
                        </div>
                        <LoginForm />
                    </CardContent>
                </Card>
                </TabsContent>
                <TabsContent value="signup">
                <Card>
                    <CardHeader>
                        <CardTitle>Sign Up</CardTitle>
                        <CardDescription>
                            Create an account to start your financial journey.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                           <GoogleIcon /> Sign up with Google
                        </Button>
                         <div className="relative">
                           <div className="absolute inset-0 flex items-center">
                               <span className="w-full border-t" />
                           </div>
                           <div className="relative flex justify-center text-xs uppercase">
                               <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                           </div>
                        </div>
                        <SignupForm />
                    </CardContent>
                </Card>
                </TabsContent>
            </Tabs>
        </main>
    </div>
  );
}
