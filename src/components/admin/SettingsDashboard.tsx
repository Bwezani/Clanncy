"use client";

import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { useAdmin } from '@/context/AdminContext';


export default function SettingsDashboard() {
  const { nextDeliveryDate, setNextDeliveryDate } = useAdmin();

  return (
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
                        onSelect={(date) => setNextDeliveryDate(date)}
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
  );
}
