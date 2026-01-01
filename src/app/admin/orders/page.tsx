import OrdersDashboard from "@/components/admin/OrdersDashboard";

export default function AdminOrdersPage() {
    return (
        <div>
            <div className="space-y-4 mb-8">
                <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
                    Orders
                </h1>
                <p className="text-lg text-foreground/80">
                    Manage and fulfill pending and all orders.
                </p>
            </div>
            <OrdersDashboard />
        </div>
    );
}
