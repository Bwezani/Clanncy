
import OrdersDashboard from "@/components/admin/OrdersDashboard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookMarked } from "lucide-react";

export default function DeliveriesPage() {
    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
                <div className="space-y-4">
                    <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
                        Deliveries
                    </h1>
                    <p className="text-lg text-foreground/80">
                        Manage and fulfill pending and all orders.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/deliveries/records">
                        <BookMarked className="mr-2 h-4 w-4" />
                        View Records
                    </Link>
                </Button>
            </div>
            <OrdersDashboard />
        </div>
    );
}
