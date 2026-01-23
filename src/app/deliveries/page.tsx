
import OrdersDashboard from "@/components/admin/OrdersDashboard";

export default function DeliveriesPage() {
    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="space-y-4 mb-8">
                <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
                    Deliveries
                </h1>
                <p className="text-lg text-foreground/80">
                    Manage and fulfill pending and all orders.
                </p>
            </div>
            <OrdersDashboard />
        </div>
    );
}
