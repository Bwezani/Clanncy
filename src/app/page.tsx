
import OrderForm from '@/components/OrderForm';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-6 text-center">
        <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter text-primary">
          The Best Chicken on Campus.
        </h1>
        <p className="text-lg md:text-xl text-foreground/80">
          Preorder now and pay when your chicken is delivered!
        </p>
        <Card className="shadow-lg text-left">
          <CardContent className="p-0">
            <OrderForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
