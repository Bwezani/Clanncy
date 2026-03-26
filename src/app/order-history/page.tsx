import { OrderHistory } from '@/components/OrderHistory';
import { ContactCard } from '@/components/ContactCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function OrderHistoryPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 pb-20 relative">
            <div className="mb-8">
                <Button asChild variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-colors">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Order Page
                    </Link>
                </Button>
            </div>
            <div className="text-center space-y-4 mb-14 relative z-10">
                {/* Decorative background blur */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] bg-primary/10 blur-[80px] -z-10 rounded-full pointer-events-none" />
                <h1 className="font-headline text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary via-primary/80 to-accent drop-shadow-sm pb-1">
                    Your Chicken History
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
                    A walk down memory lane of all the deliciousness you've ordered.
                </p>
            </div>
            
            <div className="bg-card/40 backdrop-blur-md rounded-3xl p-4 md:p-8 shadow-2xl border border-white/20 dark:border-white/5 relative z-10">
                <OrderHistory />
            </div>
            
            <div className="mt-16 relative z-10">
              <ContactCard />
            </div>
        </div>
    );
}
