'use client';
import { useForm, FormProvider, Controller } from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile as updateAuthProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Shield, Palette } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeSwitcher } from '@/components/theme-switcher';


const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  photoURL: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Please enter your current password.' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters.' }),
});

export default function SettingsPage() {
  const { user, firestore, auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);


  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isGrantingAdmin, setIsGrantingAdmin] = useState(false);

  const adminRoleRef = useMemoFirebase(() => (user ? doc(firestore, 'roles_admin', user.uid) : null), [user, firestore]);
  const { data: adminRole } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole;

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      photoURL: '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  });

  useEffect(() => {
    if (userData) {
      profileForm.reset({ 
        name: userData.name || '',
        photoURL: userData.photoURL || '',
       });
    }
  }, [userData, profileForm]);

  async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    setIsLoadingProfile(true);

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        name: values.name,
        photoURL: values.photoURL || '',
      });

      if (auth.currentUser) {
        await updateAuthProfile(auth.currentUser, {
            displayName: values.name,
            photoURL: values.photoURL || '',
        });
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setIsLoadingProfile(false);
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    if (!user || !user.email) return;
    setIsLoadingPassword(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      await updatePassword(user, values.newPassword);

      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
      passwordForm.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Password Change Failed',
        description: 'Please check your current password and try again.',
      });
    } finally {
      setIsLoadingPassword(false);
    }
  }

  async function grantAdminAccess() {
    if (!user || !firestore) return;
    setIsGrantingAdmin(true);
    try {
      const adminRoleDoc = doc(firestore, 'roles_admin', user.uid);
      await setDoc(adminRoleDoc, {}); 
      toast({
        title: 'Admin Access Granted',
        description: 'You are now an administrator. Refresh to see admin options.',
      });
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Failed to Grant Admin Access',
        description: error.message,
      });
    } finally {
        setIsGrantingAdmin(false);
    }
  }

  return (
    <div className="p-4 sm:px-6 space-y-6">
       <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="flex items-center gap-4">
                 <Avatar className="h-20 w-20">
                  <AvatarImage src={profileForm.watch('photoURL') || user?.photoURL || undefined} />
                  <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="grid gap-2 flex-1">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="photoURL"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.png" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoadingProfile}>
                {isLoadingProfile ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent>
           <ThemeSwitcher />
        </CardContent>
      </Card>
      
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>For your security, we recommend using a strong password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoadingPassword}>
                {isLoadingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Developer Actions</CardTitle>
          <CardDescription>Actions for development and testing purposes.</CardDescription>
        </CardHeader>
        <CardContent>
           <Button
              onClick={grantAdminAccess}
              disabled={isAdmin || isGrantingAdmin}
            >
              <Shield className="mr-2 h-4 w-4" />
              {isGrantingAdmin ? 'Granting Access...' : (isAdmin ? 'Admin Access Granted' : 'Become Admin')}
            </Button>
            {isAdmin && <p className="text-sm text-muted-foreground mt-2">You can now access the <a href="/admin" className="underline">admin dashboard</a>.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
