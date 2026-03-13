
import ReferralManagement from "@/components/admin/ReferralManagement";

export default function AdminReferralsPage() {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
                    Referral Program
                </h1>
                <p className="text-lg text-foreground/80">
                    Monitor and manage your customer referral activity.
                </p>
            </div>
            <ReferralManagement />
        </div>
    );
}
