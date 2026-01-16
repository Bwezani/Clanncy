
'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Info, Loader2, Save, Trash2, AlertTriangle } from 'lucide-react';
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


function DangerZone() {
    const { clearAllOrders, isSaving } = useAdmin();
    const [confirmationCode, setConfirmationCode] = useState('');
    const requiredCode = '0305';

    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
            </CardHeader>
            <CardContent>
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
                                This action cannot be undone. This will permanently delete all order data from your database.
                                To confirm, please type the confirmation code in the box below.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Input
                            type="text"
                            placeholder="Confirmation code"
                            value={confirmationCode}
                            onChange={(e) => setConfirmationCode(e.target.value)}
                        />
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setConfirmationCode('')}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    clearAllOrders();
                                    setConfirmationCode('');
                                }}
                                disabled={confirmationCode !== requiredCode || isSaving}
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                I understand, clear all orders
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
    nextDeliveryDate, 
    setNextDeliveryDate,
    prices,
    setPrices,
    contact,
    setContact,
    homepage,
    setHomepage,
    isSaving,
    isLoading,
    saveAllSettings,
  } = useAdmin();

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
                <CardTitle>Delivery Settings</CardTitle>
                <CardDescription>Manage your delivery schedule.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="delivery-date">Next Delivery Date</Label>
                        <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="delivery-date"
                            variant={"outline"}
                            className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !nextDeliveryDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {nextDeliveryDate ? (
                                format(nextDeliveryDate, "PPP")
                            ) : (
                            <span>Pick a date</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={nextDeliveryDate}
                            onSelect={(date) => setNextDeliveryDate(date || undefined)}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                    <div className="flex items-center gap-2 rounded-md bg-secondary/50 border border-secondary/80 p-3 text-sm text-secondary-foreground">
                    <Info className="h-5 w-5 text-secondary-foreground/80" />
                    <span>This date will be displayed to customers on the ordering page.</span>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Homepage Settings</CardTitle>
                <CardDescription>Set the main title and subtitle on the homepage.</CardDescription>
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
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="bounce-animation-switch" className="text-base">Enable Form Bounce Animation</Label>
                        <p className="text-sm text-muted-foreground">
                            Animate form sections to guide the user.
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
