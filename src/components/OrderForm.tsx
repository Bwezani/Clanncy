'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Home, School, Minus, Plus, Info, CalendarClock, ChevronsUpDown, Ticket, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Separator } from './ui/separator';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Prices, HomepageSettings, DeliverySettings } from '@/lib/types';
import { Loader } from '@/components/ui/loader';


const defaultPrices: Prices = {
    whole: 150.00,
    mixedPiece: 15.00,
    isChoosePiecesEnabled: true,
    pieces: {
        breasts: 30.0,
        thighs: 20.0,
        drumsticks: 15.0,
        wings: 10.0,
    }
};

const PieceSelectionDialog = ({ onSave, initialValues, prices }: { onSave: (pieces: OrderInput['pieceDetails']) => void, initialValues: OrderInput['pieceDetails'], prices: Prices['pieces'] }) => {
  const [pieces, setPieces] = useState(initialValues || { breasts: 0, thighs: 0, drumsticks: 0, wings: 0 });

  const handlePieceChange = (piece: keyof typeof pieces, value: number) => {
    setPieces(prev => ({ ...prev, [piece]: Math.max(0, value) }));
  };

  const totalPieces = Object.values(pieces).reduce((sum, val) => sum + val, 0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <ChevronsUpDown className="mr-2 h-4 w-4" />
          Select Pieces ({totalPieces > 0 ? `${totalPieces} selected` : 'Click here'})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Your Chicken Pieces</DialogTitle>
          <DialogDescription>Choose the quantity for each type of piece. Prices are per piece.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {Object.entries(prices).map(([key, price]) => (
             <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">{key}</p>
                <p className="text-sm text-muted-foreground">K{price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePieceChange(key as keyof typeof pieces, pieces[key as keyof typeof pieces] - 1)}
                  disabled={pieces[key as keyof typeof pieces] <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  className="w-16 text-center"
                  value={pieces[key as keyof typeof pieces]}
                  onChange={(e) => handlePieceChange(key as keyof typeof pieces, parseInt(e.target.value, 10) || 0)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePieceChange(key as keyof typeof pieces, pieces[key as keyof typeof pieces] + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" onClick={() => onSave(pieces)}>Save Selection</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function OrderForm({ formLayout = 'continuous', overrideDeviceId, onSuccess, initialData }: { formLayout?: 'continuous' | 'stacked', overrideDeviceId?: string, onSuccess?: (result: { success: boolean; message: string; orderId: string | null; }) => void, initialData?: Partial<OrderInput> }) {
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState<'chicken' | 'delivery'>('chicken');
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const [prices, setPrices] = useState<Prices>(defaultPrices);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [isBounceAnimationEnabled, setIsBounceAnimationEnabled] = useState(true);
  const [isFirstSectionInteracted, setIsFirstSectionInteracted] = useState(false);
  
  const [takenSlots, setTakenSlots] = useState(0);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  const [content, setContent] = useState({
    wholeChickenImageUrl: 'https://i.postimg.cc/JhFDRd2m/359635-removebg-preview.png',
    piecesImageUrl: 'https://i.postimg.cc/G2Zc5WS4/359689-removebg-preview.png',
  });

  // Listeners for settings
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'delivery');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const newSettings: DeliverySettings = {
                totalSlots: data.totalSlots ?? 0,
                disableWhenSlotsFull: data.disableWhenSlotsFull ?? true,
                slotsFullMessage: data.slotsFullMessage ?? "We're fully booked for now!",
                isSlotsEnabled: typeof data.isSlotsEnabled === 'boolean' ? data.isSlotsEnabled : true,
                nextDeliveryDate: data.nextDeliveryDate?.toDate()
            };
            setDeliverySettings(newSettings);
            if (newSettings.nextDeliveryDate) {
                localStorage.setItem('nextDeliveryDate', newSettings.nextDeliveryDate.toISOString());
            } else {
                localStorage.removeItem('nextDeliveryDate');
            }
        }
        setIsLoadingSettings(false);
    }, (error) => {
        console.error("Error fetching delivery settings: ", error);
        setIsLoadingSettings(false);
    });

    const slotsCounterRef = doc(db, 'slots', 'live_counter');
    const unsubscribeSlots = onSnapshot(slotsCounterRef, (docSnap) => {
        if (docSnap.exists()) {
            setTakenSlots(docSnap.data().count ?? 0);
        } else {
            setTakenSlots(0);
        }
    }, (error) => {
        console.error("Error fetching slots counter: ", error);
    });

    return () => {
        unsubscribeSettings();
        unsubscribeSlots();
    };
  }, []);


  useEffect(() => {
    // Attempt to load from localStorage first for faster initial load
    const cachedPrices = localStorage.getItem('curbsidePrices');
    if (cachedPrices) {
      const parsedPrices = JSON.parse(cachedPrices);
      // Ensure the flag has a default value
      if (typeof parsedPrices.isChoosePiecesEnabled === 'undefined') {
        parsedPrices.isChoosePiecesEnabled = true;
      }
      setPrices(parsedPrices);
      setIsLoadingPrices(false); 
    }

    // Set up real-time listener for prices
    const pricesDocRef = doc(db, 'settings', 'pricing');
    const unsubscribePrices = onSnapshot(pricesDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const fetchedPrices = docSnap.data() as Prices;
        if (typeof fetchedPrices.isChoosePiecesEnabled === 'undefined') {
          fetchedPrices.isChoosePiecesEnabled = true;
        }
        setPrices(fetchedPrices);
        localStorage.setItem('curbsidePrices', JSON.stringify(fetchedPrices));
      }
      setIsLoadingPrices(false);
    }, (error) => {
      console.error("Could not fetch prices:", error);
      setIsLoadingPrices(false);
    });

    // Set up real-time listener for homepage settings (for bounce animation toggle and images)
    const homepageDocRef = doc(db, 'settings', 'homepage');
    const unsubscribeHomepage = onSnapshot(homepageDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as HomepageSettings;
            if (typeof data.isBounceAnimationEnabled === 'boolean') {
                setIsBounceAnimationEnabled(data.isBounceAnimationEnabled);
            } else {
                setIsBounceAnimationEnabled(true);
            }
             setContent({
                wholeChickenImageUrl: data.wholeChickenImageUrl || 'https://i.postimg.cc/JhFDRd2m/359635-removebg-preview.png',
                piecesImageUrl: data.piecesImageUrl || 'https://i.postimg.cc/G2Zc5WS4/359689-removebg-preview.png',
            });
        }
    });


    return () => {
        unsubscribePrices();
        unsubscribeHomepage();
    };
  }, []);

  const form = useForm<OrderInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      chickenType: 'whole',
      piecesType: undefined,
      quantity: 1,
      price: prices.whole,
      pieceDetails: {
        breasts: 0,
        thighs: 0,
        drumsticks: 0,
        wings: 0,
      },
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      deliveryLocationType: initialData?.deliveryLocationType || 'school',
      school: initialData?.school || 'University of Zambia (UNZA)',
      block: initialData?.block || '',
      room: initialData?.room || '',
      area: initialData?.area || undefined,
      street: initialData?.street || '',
      houseNumber: initialData?.houseNumber || '',
    },
  });
  
  const { setValue, getValues } = form;
  const chickenType = form.watch('chickenType');
  const piecesType = form.watch('piecesType');
  const quantity = form.watch('quantity');
  const pieceDetails = form.watch('pieceDetails');
  const deliveryLocationType = form.watch('deliveryLocationType');
  const name = form.watch('name');
  const phone = form.watch('phone');
  const school = form.watch('school');
  const block = form.watch('block');
  const room = form.watch('room');
  const area = form.watch('area');
  const street = form.watch('street');
  const houseNumber = form.watch('houseNumber');
  
  const isDeliverySectionComplete =
    !!(name && phone &&
    ((deliveryLocationType === 'school' && school && block && room) ||
    (deliveryLocationType === 'off-campus' && area && street && houseNumber)));

  const isChickenSectionComplete = chickenType === 'whole' || (chickenType === 'pieces' && (piecesType === 'mixed' || (piecesType === 'custom' && form.getValues('quantity') > 0)));

  const slotsLeft = deliverySettings ? deliverySettings.totalSlots - takenSlots : 0;
  const areSlotsFull = deliverySettings?.isSlotsEnabled && slotsLeft <= 0;

  useEffect(() => {
    let newPrice = 0;
    if (chickenType === 'whole') {
        newPrice = quantity * prices.whole;
    } else if (chickenType === 'pieces') {
        if (piecesType === 'mixed') {
            newPrice = quantity * prices.mixedPiece;
        } else if (piecesType === 'custom' && pieceDetails) {
            newPrice = (
                (pieceDetails.breasts || 0) * prices.pieces.breasts +
                (pieceDetails.thighs || 0) * prices.pieces.thighs +
                (pieceDetails.drumsticks || 0) * prices.pieces.drumsticks +
                (pieceDetails.wings || 0) * prices.pieces.wings
            );
            const totalPieces = Object.values(pieceDetails).reduce((sum, val) => sum + (val || 0), 0);
            if (getValues('quantity') !== totalPieces) {
                setValue('quantity', totalPieces, { shouldValidate: true });
            }
        }
    }
    if (getValues('price') !== newPrice) {
        setValue('price', newPrice);
    }
  }, [chickenType, piecesType, quantity, pieceDetails, prices, setValue, getValues]);


  const onSubmit = (values: OrderInput) => {
    const deviceId = overrideDeviceId || localStorage.getItem('deviceId');
    const submissionData: OrderInput & { userId?: string, deviceId?: string } = { 
        ...values, 
        deviceId: deviceId || undefined 
    };

    if (user) {
        submissionData.userId = user.uid;
    }

    startTransition(async () => {
      const result = await submitOrder(submissionData);

      if (onSuccess) {
          onSuccess(result);
          return;
      }
      
      if (result.success && result.orderId) {
        toast({
          title: 'Success!',
          description: result.message,
        });

        if (!user) {
            const anonymousOrderIds = JSON.parse(localStorage.getItem('anonymousOrderIds') || '[]');
            anonymousOrderIds.push(result.orderId);
            localStorage.setItem('anonymousOrderIds', JSON.stringify(anonymousOrderIds));
        }

        router.push('/order-history');
      } else {
        toast({
          variant: 'destructive',
          title: 'Order Failed',
          description: result.message,
        });
      }
    });
  };
  
  const handlePiecesSave = (pieces: OrderInput['pieceDetails']) => {
    form.setValue('pieceDetails', pieces, { shouldValidate: true, shouldDirty: true });
  }

  const ChickenSection = (
    <section 
      className={cn(
        "space-y-4 border px-3 py-4 rounded-lg",
        formLayout === 'continuous' && isBounceAnimationEnabled && !isFirstSectionInteracted && 'animate-bounce-subtle'
      )}
      onClick={() => {
        if (!isFirstSectionInteracted) {
          setIsFirstSectionInteracted(true)
        }
      }}
    >
      <h2 className="text-2xl font-bold font-headline">1. Choose Your Chicken</h2>
        <FormField
          control={form.control}
          name="chickenType"
          render={({ field }) => (
            <FormItem>
               <RadioGroup
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === 'whole') {
                      form.setValue('quantity', 1);
                      form.setValue('piecesType', undefined);
                  } else {
                      form.setValue('quantity', 2); 
                      form.setValue('piecesType', 'mixed');
                      if (!prices.isChoosePiecesEnabled) {
                        form.setValue('piecesType', 'mixed');
                      }
                  }
                }}
                defaultValue={field.value}
                className="grid grid-cols-2 gap-4 items-start"
              >
                 <FormItem className="flex flex-col items-center self-stretch">
                  <RadioGroupItem value="whole" id="whole" className="sr-only" />
                  <label
                    htmlFor="whole"
                    style={{
                        backgroundImage: `url('${content.wholeChickenImageUrl}')`,
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
                        backgroundImage: `url('${content.piecesImageUrl}')`,
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

        {chickenType === 'whole' && (
             <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Number of whole chickens</FormLabel>
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
        )}
        
        {chickenType === 'pieces' && (
          <div className="space-y-4">
            <Separator />
            {prices.isChoosePiecesEnabled ? (
              <FormField
                control={form.control}
                name="piecesType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Piece Options</FormLabel>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === 'mixed') {
                          form.setValue('quantity', 2);
                        } else {
                          form.setValue('quantity', 0);
                          form.setValue('pieceDetails', { breasts: 0, thighs: 0, drumsticks: 0, wings: 0 });
                        }
                      }}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem>
                        <RadioGroupItem value="mixed" id="mixed" className="peer sr-only" />
                        <Label
                          htmlFor="mixed"
                          className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary", "cursor-pointer")}
                        >
                          Mixed Pieces
                        </Label>
                      </FormItem>
                      <FormItem>
                        <RadioGroupItem value="custom" id="custom" className="peer sr-only" />
                        <Label
                          htmlFor="custom"
                          className={cn("flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary", "cursor-pointer")}
                        >
                          Choose Pieces
                        </Label>
                      </FormItem>
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div>
                <Label className="text-base font-medium">Piece Options</Label>
                <p className="font-medium p-4 border rounded-md bg-muted/50 mt-2">Mixed Pieces</p>
              </div>
            )}
            
            {piecesType === 'mixed' && (
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Number of mixed pieces</FormLabel>
                    <FormControl>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                    const currentVal = field.value;
                                    if (currentVal === 5) {
                                        field.onChange(2);
                                    } else if (currentVal > 5) {
                                        field.onChange(currentVal - 5);
                                    }
                                }}
                                disabled={field.value <= 2}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                {...field}
                                type="number"
                                min="2"
                                className="w-16 text-center"
                                readOnly 
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                    const currentVal = field.value;
                                    if (currentVal === 2) {
                                        field.onChange(5);
                                    } else {
                                        field.onChange(currentVal + 5);
                                    }
                                }}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            )}
            
            {piecesType === 'custom' && prices.isChoosePiecesEnabled && (
                <FormField
                    control={form.control}
                    name="pieceDetails"
                    render={() => (
                        <FormItem>
                            <FormLabel>Chicken Pieces</FormLabel>
                            <FormControl>
                              <PieceSelectionDialog onSave={handlePiecesSave} initialValues={pieceDetails} prices={prices.pieces} />
                            </FormControl>
                            <FormMessage>{form.formState.errors.quantity?.message}</FormMessage>
                        </FormItem>
                    )}
                />
            )}
          </div>
        )}


       <div className="text-right text-3xl font-bold text-primary transition-colors">
          K{form.watch('price').toFixed(2)}
      </div>
    </section>
  );

  const DeliverySection = (
      <section className={cn(
        "space-y-4 border px-3 py-4 rounded-lg",
        formLayout === 'continuous' && isBounceAnimationEnabled && isFirstSectionInteracted && !isDeliverySectionComplete && 'animate-bounce-subtle'
      )}>
        <h2 className="text-2xl font-bold font-headline">2. Delivery Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField 
            control={form.control} 
            name="name" 
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />
          <FormField 
            control={form.control} 
            name="phone" 
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl><Input placeholder="097 123 4567" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} 
          />
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

        {form.watch('deliveryLocationType') === 'school' ? (
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
            <FormField 
              control={form.control} 
              name="block" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Block/Hostel</FormLabel>
                  <FormControl><Input placeholder="e.g., AF / Vet Hostel" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
            <FormField 
              control={form.control} 
              name="room" 
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Room Number</FormLabel>
                  <FormControl><Input placeholder="e.g., 16" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
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
              <FormField 
                control={form.control} 
                name="street" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Lumumba Rd" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
              <FormField 
                control={form.control} 
                name="houseNumber" 
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>House Number / Description</FormLabel>
                    <FormControl><Input placeholder="e.g., Plot 1234 or 'Blue gate'" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} 
              />
           </div>
        )}
      </section>
  );

  const SlotIndicator = (
    <>
      {deliverySettings?.isSlotsEnabled && !isLoadingSettings && deliverySettings.totalSlots > 0 && (
          <div className="flex items-center justify-center gap-2 rounded-md bg-secondary border border-secondary/80 p-3 text-sm text-secondary-foreground">
              <Ticket className="h-5 w-5" />
              <span
                  className={cn(
                      "font-medium",
                      slotsLeft <= 10 && slotsLeft > 0 && "animate-pulse text-destructive font-bold"
                  )}
              >
                  {slotsLeft > 0 ? `${slotsLeft} slots left` : "No slots left!"}
              </span>
          </div>
      )}
    </>
  );

  const DeliveryDateIndicator = (
    <>
      {deliverySettings?.nextDeliveryDate && (
          <div className="flex items-center justify-center gap-2 rounded-md bg-secondary border border-secondary/80 p-3 text-sm text-secondary-foreground">
              <CalendarClock className="h-5 w-5" />
              <span>Next Deliveries on <b>{format(deliverySettings.nextDeliveryDate, "do MMMM, yyyy")}</b></span>
          </div>
      )}
    </>
  );

  const infoIndicatorsJsx = (
    <div className="space-y-2">
        {SlotIndicator}
        {DeliveryDateIndicator}
    </div>
  );

  const SubmitSection = (
      <div className="space-y-4">
            <Button
              type="submit"
              size="lg"
              className={cn(
                "w-full text-lg",
                formLayout === 'continuous' && isBounceAnimationEnabled && isDeliverySectionComplete && "animate-bounce"
              )}
              disabled={isPending || (areSlotsFull && deliverySettings?.disableWhenSlotsFull)}
            >
              {isPending ? (
                 <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (areSlotsFull && deliverySettings?.disableWhenSlotsFull) ? (
                deliverySettings.slotsFullMessage
              ) : (
                'Reserve Your Chicken'
              )}
            </Button>
            {infoIndicatorsJsx}
        </div>
  );


  if (isLoadingPrices || isLoadingSettings) {
      return (
          <div className="flex justify-center items-center h-96">
              <Loader />
          </div>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-6 px-0 sm:px-6 overflow-x-hidden">
        {formLayout === 'stacked' ? (
          <>
            <div className="mx-2 sm:mx-0 flex items-center gap-2 rounded-md bg-accent/20 border border-accent/50 p-3 text-sm text-accent-foreground">
              <Info className="h-5 w-5 text-accent" />
              <span>Note: All orders are pay on delivery.</span>
            </div>
            <div className="px-2 sm:px-0">
              {currentStep === 'chicken' && (
                  <div className="animate-in fade-in-0 slide-in-from-left-20 duration-500">
                    {ChickenSection}
                    <div className="mt-8 space-y-4">
                      <Button
                        type="button"
                        size="lg"
                        className="w-full"
                        disabled={!isChickenSectionComplete}
                        onClick={() => setCurrentStep('delivery')}
                      >
                        Enter Delivery Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      {SlotIndicator}
                    </div>
                  </div>
                )}
                {currentStep === 'delivery' && (
                  <div className="animate-in fade-in-0 slide-in-from-right-20 duration-500">
                    <Button type="button" variant="outline" className="mb-4" onClick={() => setCurrentStep('chicken')}>
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Chicken Selection
                      </Button>
                    {DeliverySection}
                    <div className="mt-8">
                      {SubmitSection}
                    </div>
                  </div>
                )}
            </div>
          </>
        ) : (
          <div className="px-2 sm:px-0 space-y-8">
            <div className="flex items-center gap-2 rounded-md bg-accent/20 border border-accent/50 p-3 text-sm text-accent-foreground">
                <Info className="h-5 w-5 text-accent" />
                <span>Note: All orders are pay on delivery.</span>
            </div>
            {ChickenSection}
            {DeliverySection}
            {SubmitSection}
          </div>
        )}
      </form>
    </Form>
  );
}
