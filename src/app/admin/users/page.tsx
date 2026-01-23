
import UsersDashboard from "@/components/admin/UsersDashboard";

export default function AdminUsersPage() {
    return (
        <div>
            <div className="space-y-4 mb-8">
                <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
                    Users
                </h1>
                <p className="text-lg text-foreground/80">
                    Manage user roles and permissions.
                </p>
            </div>
            <UsersDashboard />
        </div>
    );
}
