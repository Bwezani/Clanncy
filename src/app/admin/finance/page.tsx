
import FinanceDashboard from "@/components/admin/FinanceDashboard";

export default function AdminFinancePage() {
    return (
        <div>
            <div className="space-y-4 mb-8">
                <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
                    Finance
                </h1>
                <p className="text-lg text-foreground/80">
                    Track your expenses, sales, and profitability.
                </p>
            </div>
            <FinanceDashboard />
        </div>
    );
}
