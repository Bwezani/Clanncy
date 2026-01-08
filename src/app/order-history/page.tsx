
import { OrderHistory } from '@/components/OrderHistory';
import { ContactCard } from '@/components/ContactCard';

export default function OrderHistoryPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12">
                <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
                    Your Chicken History
                </h1>
                <p className="text-lg text-foreground/80">
                    A walk down memory lane of all the deliciousness you've ordered.
                </p>
            </div>
            <OrderHistory />
            <div className="mt-12">
              <ContactCard />
            </div>
        </div>
    );
}
