
import ProductsDashboard from "@/components/admin/ProductsDashboard";

export default function AdminProductsPage() {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
                    Products
                </h1>
                <p className="text-lg text-foreground/80">
                    Manage your product catalog, prices, and options.
                </p>
            </div>
            <ProductsDashboard />
        </div>
    );
}
