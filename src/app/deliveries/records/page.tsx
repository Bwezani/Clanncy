
import RecordsDashboard from "@/components/admin/RecordsDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DeliveryRecordsPage() {
    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-start mb-8">
                <div className="space-y-2">
                    <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
                        Delivery Records
                    </h1>
                    <p className="text-lg text-foreground/80">
                        A log of delivered and dropped orders by device.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/deliveries">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Deliveries
                    </Link>
                </Button>
            </div>
            <RecordsDashboard />
        </div>
    );
}
