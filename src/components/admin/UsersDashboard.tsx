'use client';

import { useAdmin } from "@/context/AdminContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "../ui/button";
import { MoreHorizontal, Users } from "lucide-react";
import type { AdminUser, UserRole } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader } from '@/components/ui/loader';

const roleHierarchy: UserRole[] = ['admin', 'assistant', 'customer'];

function UserCard({ user, onRoleChange }: { user: AdminUser; onRoleChange: (userId: string, role: UserRole) => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-4">
        <div>
          <CardTitle className="text-base font-medium break-all">{user.email}</CardTitle>
          <CardDescription>Joined: {user.createdAt}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={user.email === 'bwezanijuma@gmail.com'}>
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onRoleChange(user.id, 'admin')}>Set as Admin</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRoleChange(user.id, 'assistant')}>Set as Assistant</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRoleChange(user.id, 'customer')}>Set as Customer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <span className="text-muted-foreground">Role: </span>
          <span className="font-semibold capitalize">{user.role}</span>
        </div>
      </CardContent>
    </Card>
  );
}


function UserTable({ users, onRoleChange }: { users: AdminUser[], onRoleChange: (userId: string, role: UserRole) => void }) {
    
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map(user => (
                    <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                            <span className="capitalize">{user.role}</span>
                        </TableCell>
                        <TableCell>{user.createdAt}</TableCell>
                        <TableCell className="text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={user.email === 'bwezanijuma@gmail.com'}>
                                        <MoreHorizontal />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => onRoleChange(user.id, 'admin')}>Set as Admin</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onRoleChange(user.id, 'assistant')}>Set as Assistant</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onRoleChange(user.id, 'customer')}>Set as Customer</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export default function UsersDashboard() {
    const { users, isLoading, updateUserRole } = useAdmin();
    const isMobile = useIsMobile();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader />
            </div>
        )
    }

    const sortedUsers = [...users].sort((a,b) => roleHierarchy.indexOf(a.role) - roleHierarchy.indexOf(b.role) || (a.email || '').localeCompare(b.email || ''));

    return (
        <div className="space-y-8">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Users
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{users.length}</div>
                    <p className="text-xs text-muted-foreground">
                        Total users in the system
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>User List</CardTitle>
                    <CardDescription>A list of all users and their roles.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isMobile ? (
                        <div className="space-y-4">
                            {sortedUsers.map(user => (
                                <UserCard key={user.id} user={user} onRoleChange={updateUserRole} />
                            ))}
                        </div>
                    ) : (
                        <UserTable users={sortedUsers} onRoleChange={updateUserRole} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
