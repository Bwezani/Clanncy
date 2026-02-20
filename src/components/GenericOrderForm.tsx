'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Home, School, Minus, Plus, Info, CalendarClock, Ticket, ArrowRight, ArrowLeft, Tag, Layers, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { submitGenericOrder } from '@/lib/actions';
import { genericOrderSchema, universitySchema, lusakaTownsSchema, type GenericOrderInput } from '@/lib/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUser } from '@/hooks/use-user';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { DeliverySettings, Product } from '@/lib/types';
import { Separator } from './ui/separator';
import { Loader } from '@/components/ui/loader';

export default function GenericOrderForm({ product, formLayout = 'continuous' }: { product: Product, formLayout?: 'continuous' | 'stacked' }) {
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState<'selection' | 'delivery'>('selection');
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  
  const [takenSlots, setTakenSlots] = useState(0);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'delivery');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setDeliverySettings({
                totalSlots: data.totalSlots ?? 0,
                disableWhenSlotsFull: data.disableWhenSlotsFull ?? true,
                slotsFullMessage: data.slotsFullMessage ?? "We're fully booked!",
                isSlotsEnabled: typeof data.isSlotsEnabled === 'boolean' ? data.isSlotsEnabled : true,
                nextDeliveryDate: data.nextDeliveryDate?.toDate()
            });
        }
        setIsLoadingSettings(false);
    });

    const slotsCounterRef = doc(db, 'slots', 'live_counter');
    const unsubscribeSlots = onSnapshot(slotsCounterRef, (docSnap) => {
        setTakenSlots(docSnap.exists() ? docSnap.data().count ?? 0 : 0);
    });

    return () => {
        unsubscribeSettings();
        unsubscribeSlots();
    };
  }, []);

  const variations = product.variations || [];
  const hasVariations = variations.length > 0;

  const form = useForm<GenericOrderInput>({
    resolver: zodResolver(genericOrderSchema),
    defaultValues: {
      productId: product.id,
      productName: product.name,
      variationName: variations[0]?.name || '',
      optionName: variations[0]?.options[0]?.name || '',
      quantity: 1,
      price: variations[0]?.options[0]?.price || 0,
      name: '',
      phone: '',
      deliveryLocationType: 'school',
      school: 'University of Zambia (UNZA)',
      block: '',
      room: '',
    },
  });

  const variationName = form.watch('variationName');
  const optionName = form.watch('optionName');
  const quantity = form.watch('quantity');
  const deliveryLocationType = form.watch('deliveryLocationType');
  
  // Get options for current variation
  const currentOptions = useMemo(() => {
      const v = variations.find(v => v.name === variationName);
      return v?.options || [];
  }, [variationName, variations]);

  useEffect(() => {
    const selectedOption = currentOptions.find(o => o.name === optionName);
    if (selectedOption) {
        form.setValue('price', selectedOption.price * quantity);
    }
  }, [optionName, quantity, currentOptions, form]);

  // When variation changes, reset option to first one
  useEffect(() => {
      const v = variations.find(v => v.name === variationName);
      if (v && v.options.length > 0) {
          const firstOption = v.options[0];
          if (optionName !== firstOption.name) {
              form.setValue('optionName', firstOption.name);
          }
      }
  }, [variationName, variations, form]);

  const slotsLeft = deliverySettings ? deliverySettings.totalSlots - takenSlots : 0;
  const areSlotsFull = deliverySettings?.isSlotsEnabled && slotsLeft <= 0;

  const onSubmit = (values: GenericOrderInput) => {
    const deviceId = localStorage.getItem('deviceId');
    const submissionData = { ...values, deviceId: deviceId || undefined, userId: user?.uid };

    startTransition(async () => {
      const result = await submitGenericOrder(submissionData);
      if (result.success && result.orderId) {
        toast({ title: 'Success!', description: result.message });
        if (!user) {
            const anonymousOrderIds = JSON.parse(localStorage.getItem('anonymousOrderIds') || '[]');
            anonymousOrderIds.push(result.orderId);
            localStorage.setItem('anonymousOrderIds', JSON.stringify(anonymousOrderIds));
        }
        router.push('/order-history');
      } else {
        toast({ variant: 'destructive', title: 'Order Failed', description: result.message });
      }
    });
  };

  const SelectionSection = (
    <section className="space-y-6 border p-4 md:p-6 rounded-lg bg-card shadow-sm">
      <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
          <Tag className="h-6 w-6 text-primary" />
          1. Select Your {product.name}
      </h2>
      
      {hasVariations && (
          <FormField
            control={form.control}
            name="variationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Choose Variation</FormLabel>
                <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-12 text-lg">
                            <SelectValue placeholder="Select variation" />
                        </SelectTrigger>
                        <SelectContent>
                            {variations.map((v) => (
                            <SelectItem key={v.name} value={v.name} className="text-lg">
                                {v.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
      )}

      <FormField
        control={form.control}
        name="optionName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{hasVariations ? 'Choose Size / Option' : 'Choose Option'}</FormLabel>
            <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12 text-lg">
                        <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                        {currentOptions.map((opt) => (
                        <SelectItem key={opt.name} value={opt.name} className="text-lg">
                            {opt.name} - K{opt.price.toFixed(2)}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      <FormField
        control={form.control}
        name="quantity"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">How many?</FormLabel>
            <FormControl>
              <div className="flex items-center gap-6">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2"
                  onClick={() => field.onChange(Math.max(1, field.value - 1))}
                  disabled={field.value <= 1}
                >
                  <Minus className="h-6 w-6" />
                </Button>
                <span className="text-3xl font-bold w-12 text-center">{field.value}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2"
                  onClick={() => field.onChange(field.value + 1)}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="text-right pt-4">
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Price</p>
        <div className="text-4xl font-bold text-primary tabular-nums">
            K{form.watch('price').toFixed(2)}
        </div>
      </div>
    </section>
  );

  const DeliverySection = (
    <section className="space-y-4 border p-4 md:p-6 rounded-lg bg-card shadow-sm">
      <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          2. Delivery Details
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="097 123 4567" {...field} /></FormControl><FormMessage /></FormItem>)} />
      </div>

      <FormField
        control={form.control}
        name="deliveryLocationType"
        render={({ field }) => (
            <FormItem className="flex items-center justify-center space-x-4 rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center space-x-2">
                    <School className="text-muted-foreground" />
                    <Label htmlFor="delivery-switch" className="cursor-pointer">On-Campus</Label>
                </div>
                <FormControl>
                    <Switch
                        id="delivery-switch"
                        checked={field.value === 'off-campus'}
                        onCheckedChange={(checked) => field.onChange(checked ? 'off-campus' : 'school')}
                    />
                </FormControl>
                <div className="flex items-center space-x-2">
                     <Home className="text-muted-foreground" />
                    <Label htmlFor="delivery-switch" className="cursor-pointer">Off-Campus</Label>
                </div>
            </FormItem>
        )}
       />

      {deliveryLocationType === 'school' ? (
        <div className="grid md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <FormField
            control={form.control}
            name="school"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School</FormLabel>
                <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select your school" />
                        </SelectTrigger>
                        <SelectContent>
                            {universitySchema.options.map((school) => (
                            <SelectItem key={school} value={school}>{school}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="block" render={({ field }) => (<FormItem><FormLabel>Block/Hostel</FormLabel><FormControl><Input placeholder="e.g., AF / Vet Hostel" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="room" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Room Number</FormLabel><FormControl><Input placeholder="e.g., 16" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
      ) : (
         <div className="grid md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Area</FormLabel>
                    <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your area" />
                            </SelectTrigger>
                            <SelectContent>
                                {lusakaTownsSchema.options.map((town) => (
                                <SelectItem key={town} value={town}>{town}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField control={form.control} name="street" render={({ field }) => (<FormItem><FormLabel>Street Name</FormLabel><FormControl><Input placeholder="e.g., Lumumba Rd" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="houseNumber" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>House Number / Description</FormLabel><FormControl><Input placeholder="e.g., Plot 1234 or 'Blue gate'" {...field} /></FormControl><FormMessage /></FormItem>)} />
         </div>
      )}
    </section>
  );

  const InfoIndicators = (
    <div className="space-y-2">
        {deliverySettings?.isSlotsEnabled && (
            <div className="flex items-center justify-center gap-2 rounded-md bg-secondary border border-secondary/80 p-3 text-sm text-secondary-foreground">
                <Ticket className="h-5 w-5" />
                <span className={cn("font-medium", slotsLeft <= 10 && slotsLeft > 0 && "animate-pulse text-destructive font-bold")}>
                    {slotsLeft > 0 ? `${slotsLeft} slots left` : "No slots left!"}
                </span>
            </div>
        )}
        {deliverySettings?.nextDeliveryDate && (
            <div className="flex items-center justify-center gap-2 rounded-md bg-secondary border border-secondary/80 p-3 text-sm text-secondary-foreground">
                <CalendarClock className="h-5 w-5" />
                <span>Next Deliveries on <b>{format(deliverySettings.nextDeliveryDate, "do MMMM, yyyy")}</b></span>
            </div>
        )}
    </div>
  );

  if (isLoadingSettings) {
      return (
          <div className="flex justify-center items-center h-96">
              <Loader />
          </div>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-6">
        <div className="flex items-center gap-2 rounded-md bg-accent/20 border border-accent/50 p-3 text-sm text-accent-foreground">
            <Info className="h-5 w-5 text-accent" />
            <span>Note: All orders are pay on delivery.</span>
        </div>

        {formLayout === 'stacked' ? (
            <>
                {currentStep === 'selection' && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-6">
                        {SelectionSection}
                        <Button type="button" size="lg" className="w-full text-lg h-14" onClick={() => setCurrentStep('delivery')}>
                            Enter Delivery Details <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        {InfoIndicators}
                    </div>
                )}
                {currentStep === 'delivery' && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep('selection')} className="hover:bg-accent/50">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Selection
                        </Button>
                        {DeliverySection}
                        <Button type="submit" size="lg" className="w-full text-lg h-14" disabled={isPending || areSlotsFull}>
                            {isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : areSlotsFull ? "Sold Out" : `Reserve Your ${product.name}`}
                        </Button>
                    </div>
                )}
            </>
        ) : (
            <div className="space-y-8">
                {SelectionSection}
                {DeliverySection}
                <div className="space-y-4">
                    <Button type="submit" size="lg" className="w-full text-lg h-14 shadow-lg hover:shadow-xl transition-shadow" disabled={isPending || areSlotsFull}>
                        {isPending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : areSlotsFull ? "Sold Out" : `Reserve Your ${product.name}`}
                    </Button>
                    {InfoIndicators}
                </div>
            </div>
        )}
      </form>
    </Form>
  );
}
