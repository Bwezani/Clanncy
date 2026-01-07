
import OrderForm from '@/components/OrderForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown } from 'lucide-react';

export default function Home() {

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-6 text-center">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
          The Best Chicken on Campus
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 px-4">
          Preorder now and pay when your chicken is delivered!
        </p>
        <Card className="shadow-lg text-left">
            <CardHeader>
                <CardTitle className="font-headline text-2xl md:text-3xl font-bold tracking-tighter text-primary flex items-center justify-center gap-3">
                    Fill in order details here <ArrowDown className="h-8 w-8" />
                </CardTitle>
            </CardHeader>
          <CardContent className="p-0">
            <OrderForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
