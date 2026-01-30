'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, DollarSign, Info, Loader2, Save, ShoppingCart, Smartphone, Trash2, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { useAdmin } from '@/context/AdminContext';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';


function DangerZone() {
    const { clearAllOrders, isSaving } = useAdmin();
    const [allOrdersCode, setAllOrdersCode] = useState('');
    const requiredCode = '0305';

    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>This action is irreversible. Please proceed with caution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear All Order Data
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                                Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete ALL order data from your database and reset the slot counter.
                                To confirm, please type the confirmation code in the box below.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Input
                            type="text"
                            placeholder="Confirmation code"
                            value={allOrdersCode}
                            onChange={(e) => setAllOrdersCode(e.target.value)}
                        />
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setAllOrdersCode('')}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    clearAllOrders();
                                    setAllOrdersCode('');
                                }}
                                disabled={allOrdersCode !== requiredCode || isSaving}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "I understand, clear all orders"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

export default function SettingsDashboard() {
  const { 
    deliverySettings,
    setDeliverySettings,
    prices,
    setPrices,
    contact,
    setContact,
    homepage,
    setHomepage,
    goals,
    setGoals,
    clearGoals,
    resetSlots,
    isSaving,
    isLoading,
    saveAllSettings,
  } = useAdmin();

  const [resetSlotsCode, setResetSlotsCode] = useState('');
  const requiredCode = '0305';

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Delivery & Slot Settings</CardTitle>
                <CardDescription>Manage your delivery schedule and order capacity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="enable-slots-switch" className="text-base">Enable Slot Management</Label>
                        <p className="text-sm text-muted-foreground">
                            Track and limit the number of available order slots.
                        </p>
                    </div>
                    <Switch
                        id="enable-slots-switch"
                        checked={deliverySettings.isSlotsEnabled ?? true}
                        onCheckedChange={(checked) => setDeliverySettings({ ...deliverySettings, isSlotsEnabled: checked })}
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="delivery-date">Next Delivery Date</Label>
                            <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="delivery-date"
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !deliverySettings.nextDeliveryDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {deliverySettings.nextDeliveryDate ? (
                                    format(deliverySettings.nextDeliveryDate, "PPP")
                                ) : (
                                <span>Pick a date</span>
                                )}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={deliverySettings.nextDeliveryDate}
                                onSelect={(date) => setDeliverySettings({...deliverySettings, nextDeliveryDate: date || undefined})}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                    {deliverySettings.isSlotsEnabled && (
                        <div className="space-y-2">
                            <Label htmlFor="total-slots">Total Slots Available</Label>
                            <Input
                                id="total-slots"
                                type="number"
                                value={deliverySettings.totalSlots}
                                onChange={(e) => setDeliverySettings({ ...deliverySettings, totalSlots: parseInt(e.target.value, 10) || 0 })}
                                min="0"
                            />
                        </div>
                    )}
                </div>

                {deliverySettings.isSlotsEnabled && (
                    <div className="space-y-6">
                        <div className="space-y-4 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="disable-ordering-switch" className="text-base">Disable Ordering When Slots Are Full</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Prevent new orders when all slots are taken.
                                    </p>
                                </div>
                                <Switch
                                    id="disable-ordering-switch"
                                    checked={deliverySettings.disableWhenSlotsFull}
                                    onCheckedChange={(checked) => setDeliverySettings({ ...deliverySettings, disableWhenSlotsFull: checked })}
                                />
                            </div>
                            {deliverySettings.disableWhenSlotsFull && (
                                <div className="space-y-2">
                                    <Label htmlFor="slots-full-message">"Slots Full" Message</Label>
                                    <Textarea
                                        id="slots-full-message"
                                        placeholder="We're fully booked! Please check back later."
                                        value={deliverySettings.slotsFullMessage}
                                        onChange={(e) => setDeliverySettings({ ...deliverySettings, slotsFullMessage: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
                             <div>
                                <h3 className="font-semibold">Reset Slots Count</h3>
                                <p className="text-sm text-muted-foreground">Sets the taken slots counter back to 0 for a new day.</p>
                             </div>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline">
                                        Reset Count
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-6 w-6 text-amber-500" />
                                            Reset Slot Counter?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                        This will set the live slot counter back to 0. This is useful for starting a new delivery day and does not delete any existing orders. To confirm, type the code below.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <Input
                                        type="text"
                                        placeholder="Confirmation code"
                                        value={resetSlotsCode}
                                        onChange={(e) => setResetSlotsCode(e.target.value)}
                                    />
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setResetSlotsCode('')}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => {
                                                resetSlots();
                                                setResetSlotsCode('');
                                            }}
                                            disabled={resetSlotsCode !== requiredCode || isSaving}
                                        >
                                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Reset'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Homepage Settings</CardTitle>
                <CardDescription>Set the main title, subtitle, images, and animations on the homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="homepage-title">Main Title</Label>
                    <Input
                        id="homepage-title"
                        type="text"
                        placeholder="The Best Chicken on Campus"
                        value={homepage.title}
                        onChange={(e) => setHomepage({ ...homepage, title: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="homepage-subtitle">Subtitle</Label>
                    <Textarea
                        id="homepage-subtitle"
                        placeholder="Preorder now and pay when your chicken is delivered!"
                        value={homepage.subtitle}
                        onChange={(e) => setHomepage({ ...homepage, subtitle: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Order Form Layout</Label>
                     <RadioGroup
                        value={homepage.formLayout || 'continuous'}
                        onValueChange={(value: 'continuous' | 'stacked') => setHomepage({ ...homepage, formLayout: value as 'continuous' | 'stacked' })}
                        className="flex space-x-4 pt-2"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="continuous" id="continuous" />
                            <Label htmlFor="continuous">Continuous</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="stacked" id="stacked" />
                            <Label htmlFor="stacked">Stacked</Label>
                        </div>
                    </RadioGroup>
                </div>
                <Separator />
                <div className="grid md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="whole-chicken-image-url">Whole Chicken Image URL</Label>
                        <Input
                            id="whole-chicken-image-url"
                            type="text"
                            placeholder="https://example.com/image.png"
                            value={homepage.wholeChickenImageUrl || ''}
                            onChange={(e) => setHomepage({ ...homepage, wholeChickenImageUrl: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pieces-image-url">Pieces Image URL</Label>
                        <Input
                            id="pieces-image-url"
                            type="text"
                            placeholder="https://example.com/image.png"
                            value={homepage.piecesImageUrl || ''}
                            onChange={(e) => setHomepage({ ...homepage, piecesImageUrl: e.target.value })}
                        />
                    </div>
                </div>
                <Separator />
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="bounce-animation-switch" className="text-base">Enable Hero Section Animation</Label>
                        <p className="text-sm text-muted-foreground">
                           Animate the hero section on the homepage when the page loads.
                        </p>
                    </div>
                    <Switch
                        id="bounce-animation-switch"
                        checked={homepage.isBounceAnimationEnabled ?? true}
                        onCheckedChange={(checked) => setHomepage({ ...homepage, isBounceAnimationEnabled: checked })}
                    />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Contact Settings</CardTitle>
                <CardDescription>Set the phone numbers for customer contact.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="call-number">Call Number</Label>
                        <Input
                            id="call-number"
                            type="text"
                            placeholder="+260..."
                            value={contact.callNumber}
                            onChange={(e) => setContact({ ...contact, callNumber: e.target.value })}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="whatsapp-number">WhatsApp Number</Label>
                        <Input
                            id="whatsapp-number"
                            type="text"
                            placeholder="+260..."
                            value={contact.whatsappNumber}
                            onChange={(e) => setContact({ ...contact, whatsappNumber: e.target.value })}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Feature Settings</CardTitle>
                <CardDescription>Enable or disable optional features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="choose-pieces-switch" className="text-base">Enable 'Choose Pieces' Option</Label>
                        <p className="text-sm text-muted-foreground">
                            Allow customers to select specific chicken pieces.
                        </p>
                    </div>
                    <Switch
                        id="choose-pieces-switch"
                        checked={prices.isChoosePiecesEnabled}
                        onCheckedChange={(checked) => setPrices({ ...prices, isChoosePiecesEnabled: checked })}
                    />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle>Goal Settings</CardTitle>
                        <CardDescription>Set your targets for sales, reservations, and new devices for a specific period.</CardDescription>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Clear Goals</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will clear the current goal settings in the form. You will still need to click "Save All Settings" to make this change permanent.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={clearGoals}>
                                    Clear
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="goal-period">Goal Period</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="goal-period" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !goals.startDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {goals.startDate && goals.endDate ? (
                                        <>
                                        {format(goals.startDate, "LLL dd, y")} - {format(goals.endDate, "LLL dd, y")}
                                        </>
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={goals.startDate}
                                    selected={{ from: goals.startDate, to: goals.endDate }}
                                    onSelect={(range) => setGoals({ ...goals, startDate: range?.from, endDate: range?.to })}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="sales-target">Sales Target (K)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="sales-target"
                                type="number"
                                className="pl-10"
                                value={goals.salesTarget}
                                onChange={(e) => setGoals({ ...goals, salesTarget: parseFloat(e.target.value) || 0 })}
                                min="0"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reservations-target">Reservations Target</Label>
                        <div className="relative">
                            <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="reservations-target"
                                type="number"
                                className="pl-10"
                                value={goals.reservationsTarget}
                                onChange={(e) => setGoals({ ...goals, reservationsTarget: parseInt(e.target.value, 10) || 0 })}
                                min="0"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="devices-target">New Devices Target</Label>
                        <div className="relative">
                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="devices-target"
                                type="number"
                                className="pl-10"
                                value={goals.devicesTarget}
                                onChange={(e) => setGoals({ ...goals, devicesTarget: parseInt(e.target.value, 10) || 0 })}
                                min="0"
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Pricing Settings</CardTitle>
                <CardDescription>Set the prices for your products.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="whole-price">Whole Chicken Price (K)</Label>
                        <Input
                            id="whole-price"
                            type="number"
                            value={prices.whole}
                            onChange={(e) => setPrices({ ...prices, whole: parseFloat(e.target.value) || 0 })}
                            min="0"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="mixed-piece-price">Mixed Piece Price (K)</Label>
                        <Input
                            id="mixed-piece-price"
                            type="number"
                            value={prices.mixedPiece}
                            onChange={(e) => setPrices({ ...prices, mixedPiece: parseFloat(e.target.value) || 0 })}
                            min="0"
                        />
                    </div>
                </div>

                <Separator />
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="breasts-price">Breasts Price (K)</Label>
                        <Input
                            id="breasts-price"
                            type="number"
                            value={prices.pieces.breasts}
                            onChange={(e) => setPrices({ ...prices, pieces: { ...prices.pieces, breasts: parseFloat(e.target.value) || 0 } })}
                            min="0"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="thighs-price">Thighs Price (K)</Label>
                        <Input
                            id="thighs-price"
                            type="number"
                            value={prices.pieces.thighs}
                            onChange={(e) => setPrices({ ...prices, pieces: { ...prices.pieces, thighs: parseFloat(e.target.value) || 0 } })}
                            min="0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="drumsticks-price">Drumsticks Price (K)</Label>
                        <Input
                            id="drumsticks-price"
                            type="number"
                            value={prices.pieces.drumsticks}
                            onChange={(e) => setPrices({ ...prices, pieces: { ...prices.pieces, drumsticks: parseFloat(e.target.value) || 0 } })}
                            min="0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="wings-price">Wings Price (K)</Label>
                        <Input
                            id="wings-price"
                            type="number"
                            value={prices.pieces.wings}
                            onChange={(e) => setPrices({ ...prices, pieces: { ...prices.pieces, wings: parseFloat(e.target.value) || 0 } })}
                            min="0"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <Button
            onClick={saveAllSettings}
            disabled={isSaving}
            size="lg"
            className="w-full md:w-auto"
        >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save All Settings
        </Button>
        
        <DangerZone />
    </div>
  );
}
