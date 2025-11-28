
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

function AdminDashboard() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const usersColRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
    const saccosColRef = useMemoFirebase(() => collection(firestore, 'saccos'), [firestore]);

    const { data: users, isLoading: areUsersLoading } = useCollection(usersColRef);
    const { data: saccos, isLoading: areSaccosLoading } = useCollection(saccosColRef);

    const handleToggleFreeze = async (userId: string, isCurrentlyFrozen: boolean) => {
        if (!firestore) return;
        const userDocRef = doc(firestore, 'users', userId);
        try {
            await updateDoc(userDocRef, { isFrozen: !isCurrentlyFrozen });
            toast({
                title: `User ${isCurrentlyFrozen ? 'Unfrozen' : 'Frozen'}`,
                description: `The user account has been successfully ${isCurrentlyFrozen ? 'unfrozen' : 'frozen'}.`
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Operation Failed',
                description: error.message || 'Could not update user status.'
            });
        }
    };
    
    if (areUsersLoading || areSaccosLoading) {
         return (
             <div className="p-4 sm:px-6 space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-10 w-full" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/3" />
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-2">
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-10 w-full" />
                       </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <Tabs defaultValue="users">
            <TabsList className="mb-4">
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="saccos">SACCOs</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
                <Card>
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>A list of all registered users in the application.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total Savings</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users && users.map(u => (
                                    <TableRow key={u.id}>
                                        <TableCell>{u.name}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>
                                            {u.isFrozen ? (
                                                <Badge variant="destructive">Frozen</Badge>
                                            ) : (
                                                <Badge variant="default" className="bg-green-500">Active</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">UGX {(u.totalSavings || 0).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant={u.isFrozen ? "secondary" : "destructive"}
                                                size="sm"
                                                onClick={() => handleToggleFreeze(u.id, !!u.isFrozen)}
                                            >
                                                {u.isFrozen ? 'Unfreeze' : 'Freeze'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="saccos">
                 <Card>
                    <CardHeader>
                        <CardTitle>All SACCOs</CardTitle>
                        <CardDescription>A list of all SACCOs created in the. application.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Members</TableHead>
                                    <TableHead className="text-right">Goal</TableHead>
                                    <TableHead className="text-right">Current Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {saccos && saccos.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-medium">{s.name}</TableCell>
                                        <TableCell>{s.memberIds?.length || 0}</TableCell>
                                        <TableCell className="text-right">UGX {(s.goal || 0).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">UGX {(s.currentTotal || 0).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}


export default function AdminPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    const adminRoleRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'roles_admin', user.uid);
    }, [user, firestore]);

    const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);
    const isAdmin = !!adminRole;

    useEffect(() => {
        if (!isUserLoading && !isAdminRoleLoading && !isAdmin) {
            toast({
              variant: 'destructive',
              title: 'Access Denied',
              description: 'You do not have permission to view this page.'
            });
            router.push('/dashboard');
        }
    }, [user, isUserLoading, isAdmin, isAdminRoleLoading, router, toast]);

    const isLoading = isUserLoading || isAdminRoleLoading;

    if (isLoading) {
        return (
             <div className="p-4 sm:px-6 space-y-4">
                <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-8 w-1/4" />
                </div>
                <Skeleton className="h-10 w-full max-w-xs" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-2">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                       </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!isAdmin) {
        // This is a fallback for the brief period before the redirect in useEffect happens.
        return <div className="p-4">Redirecting...</div>;
    }


    return (
        <div className="p-4 sm:px-6">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <AdminDashboard />
        </div>
    );
}
