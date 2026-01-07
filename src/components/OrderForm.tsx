"use client";

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Home, School, Minus, Plus, Info, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { submitOrder } from '@/lib/actions';
import { orderSchema, universitySchema, lusakaTownsSchema, type OrderInput } from '@/lib/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUser } from '@/hooks/use-user';

const PRICE_WHOLE = 150.00;
const PRICE_PER_PIECE = 25.00;

export default function OrderForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useUser();
  const [nextDeliveryDate, setNextDeliveryDate] = useState<Date | null>(null);

  useEffect(() => {
    const storedDate = localStorage.getItem('nextDeliveryDate');
    if (storedDate) {
      setNextDeliveryDate(new Date(storedDate));
    }
  }, []);

  const form = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      chickenType: 'whole',
      quantity: 1,
      price: PRICE_WHOLE,
      name: '',
      deliveryLocationType: 'school',
      school: 'University of Zambia (UNZA)',
      block: '',
      room: '',
      phone: '',
      area: undefined,
      street: '',
      houseNumber: ''
    },
  });

  const chickenType = form.watch('chickenType');
  const quantity = form.watch('quantity');
  const deliveryLocationType = form.watch('deliveryLocationType');

  useEffect(() => {
    let newPrice: number;
    if (chickenType === 'whole') {
      newPrice = quantity * PRICE_WHOLE;
    } else {
      newPrice = quantity * PRICE_PER_PIECE;
    }
    form.setValue('price', newPrice);
  }, [chickenType, quantity, form]);

  const onSubmit = (values: OrderInput) => {
    const deviceId = localStorage.getItem('deviceId');
    const submissionData: OrderInput & { userId?: string } = { 
        ...values, 
        deviceId: deviceId || undefined 
    };

    if (user) {
        submissionData.userId = user.uid;
    }

    startTransition(async () => {
      const result = await submitOrder(submissionData);
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Order Failed',
          description: result.message,
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-6">
        <div className="flex items-center gap-2 rounded-md bg-accent/20 border border-accent/50 p-3 text-sm text-accent-foreground">
            <Info className="h-5 w-5 text-accent" />
            <span>Note: All orders are pay on delivery.</span>
        </div>
        <section className="space-y-4 border p-4 rounded-lg">
          <h2 className="text-2xl font-bold font-headline">1. Choose Your Chicken</h2>
            <FormField
              control={form.control}
              name="chickenType"
              render={({ field }) => (
                <FormItem>
                   <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('quantity', 1);
                    }}
                    defaultValue={field.value}
                    className="grid grid-cols-2 gap-4 items-start"
                  >
                     <FormItem className="flex flex-col items-center self-stretch">
                      <RadioGroupItem value="whole" id="whole" className="sr-only" />
                      <label
                        htmlFor="whole"
                        style={{
                            backgroundImage: `url('https://i.postimg.cc/JhFDRd2m/359635-removebg-preview.png')`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                        className={cn(
                          'flex flex-col items-center justify-end rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors w-full h-full min-h-[150px]',
                          field.value === 'whole' && 'border-primary ring-2 ring-primary'
                        )}
                      >
                      </label>
                      <span className="font-bold text-center mt-2 text-foreground">Whole Chicken</span>
                    </FormItem>
                     <FormItem className="flex flex-col items-center self-stretch">
                      <RadioGroupItem value="pieces" id="pieces" className="sr-only" />
                      <label
                        htmlFor="pieces"
                        style={{
                            backgroundImage: `url('https://i.postimg.cc/G2Zc5WS4/359689-removebg-preview.png')`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                        className={cn(
                          'flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors w-full h-full min-h-[150px]',
                           field.value === 'pieces' && 'border-primary ring-2 ring-primary'
                        )}
                      >
                      </label>
                      <span className="font-bold text-center mt-2">Pieces</span>
                    </FormItem>
                  </RadioGroup>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{chickenType === 'whole' ? 'Number of whole chickens' : 'Number of pieces'}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => field.value > 1 && field.onChange(field.value - 1)}
                            disabled={field.value <= 1}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                            {...field}
                            type="number"
                            min="1"
                            className="w-16 text-center"
                            onChange={(e) => {
                                const value = parseInt(e.target.value, 10);
                                if (value > 0) {
                                    field.onChange(value);
                                } else if (e.target.value === '') {
                                    field.onChange(1);
                                }
                            }}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => field.onChange(field.value + 1)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
           <div className="text-right text-3xl font-bold text-primary transition-colors">
              K{form.watch('price').toFixed(2)}
          </div>
        </section>

        <section className="space-y-4 border p-4 rounded-lg">
          <h2 className="text-2xl font-bold font-headline">2. Delivery Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="097 123 4567" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>

          <FormField
            control={form.control}
            name="deliveryLocationType"
            render={({ field }) => (
                <FormItem className="flex items-center justify-center space-x-4 rounded-lg border p-4">
                    <div className="flex items-center space-x-2">
                        <School />
                        <Label htmlFor="delivery-switch">On-Campus</Label>
                    </div>
                    <FormControl>
                        <Switch
                            id="delivery-switch"
                            checked={field.value === 'off-campus'}
                            onCheckedChange={(checked) => field.onChange(checked ? 'off-campus' : 'school')}
                        />
                    </FormControl>
                    <div className="flex items-center space-x-2">
                         <Home />
                        <Label htmlFor="delivery-switch">Off-Campus</Label>
                    </div>
                </FormItem>
            )}
           />

          {deliveryLocationType === 'school' ? (
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your school" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        {universitySchema.options.map((school) => (
                          <SelectItem key={school} value={school}>{school}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="block" render={({ field }) => (<FormItem><FormLabel>Block/Hostel</FormLabel><FormControl><Input placeholder="e.g., AF / Vet Hostel" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="room" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Room Number</FormLabel><FormControl><Input placeholder="e.g., 16" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
          ) : (
             <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="area"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Area</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select your area" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper">
                            {lusakaTownsSchema.options.map((town) => (
                            <SelectItem key={town} value={town}>{town}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField control={form.control} name="street" render={({ field }) => (<FormItem><FormLabel>Street Name</FormLabel><FormControl><Input placeholder="e.g., Lumumba Rd" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="houseNumber" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>House Number / Description</FormLabel><FormControl><Input placeholder="e.g., Plot 1234 or 'Blue gate'" {...field} /></FormControl><FormMessage /></FormItem>)} />
             </div>
          )}

        </section>

        <Button type="submit" size="lg" className="w-full text-lg" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Reserve Your Chicken
        </Button>

        {nextDeliveryDate && (
             <div className="flex items-center justify-center gap-2 rounded-md bg-secondary border border-secondary/80 p-3 text-sm text-secondary-foreground mt-4">
                <CalendarClock className="h-5 w-5" />
                <span>Next Deliveries on <b>{format(nextDeliveryDate, "do MMMM, yyyy")}</b></span>
            </div>
        )}
      </form>
    </Form>
  );
}
