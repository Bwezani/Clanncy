
import { OrderHistory } from '@/components/OrderHistory';
import { ContactCard } from '@/components/ContactCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function OrderHistoryPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <Button asChild variant="outline">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Order Page
                    </Link>
                </Button>
            </div>
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
