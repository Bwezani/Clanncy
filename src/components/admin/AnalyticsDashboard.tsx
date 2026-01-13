
"use client";

import React, { useState, useMemo } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subYears, eachDayOfInterval, isThisMonth } from 'date-fns';
import type { DateRange } from "react-day-picker"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Loader2, Smartphone, ShoppingCart, DollarSign } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';


const generateDateRange = (start: Date, end: Date) => {
    return eachDayOfInterval({ start, end });
};

export default function AnalyticsDashboard() {
  const { orders, devices, isLoading } = useAdmin();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  })

  const { totalRevenue, thisMonthRevenue } = useMemo(() => {
    const deliveredOrders = orders.filter(o => o.status === 'Delivered');
    const total = deliveredOrders.reduce((sum, order) => sum + order.price, 0);
    
    const monthly = deliveredOrders
      .filter(order => isThisMonth(order.date))
      .reduce((sum, order) => sum + order.price, 0);

    return { totalRevenue: total, thisMonthRevenue: monthly };
  }, [orders]);


  const filteredOrders = useMemo(() => {
    if (!date?.from || !date?.to) return [];
    return orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= date.from! && orderDate <= date.to!;
    });
  }, [orders, date]);
  
  const filteredDevices = useMemo(() => {
    if (!date?.from || !date?.to) return [];
    return devices.filter(device => {
        const deviceDate = new Date(device.createdAt);
        return deviceDate >= date.from! && deviceDate <= date.to!;
    })
  }, [devices, date]);

  const salesChartData = useMemo(() => {
    if (!filteredOrders.length || !date?.from || !date?.to) return [];

    const dailyTotals: Record<string, number> = {};
    const range = generateDateRange(date.from, date.to);
    range.forEach(day => {
        const formattedDate = format(day, 'yyyy-MM-dd');
        dailyTotals[formattedDate] = 0;
    });

    filteredOrders.forEach(order => {
        const orderDate = format(new Date(order.date), 'yyyy-MM-dd');
        if (dailyTotals[orderDate] !== undefined) {
             dailyTotals[orderDate] += 1;
        }
    });

    return Object.entries(dailyTotals).map(([date, total]) => ({
        date: format(new Date(date), 'MMM d'),
        orders: total,
    }));
  }, [filteredOrders, date]);

  const deviceChartData = useMemo(() => {
    if (!filteredDevices.length || !date?.from || !date?.to) return [];

     const dailyTotals: Record<string, number> = {};
    const range = generateDateRange(date.from, date.to);
    range.forEach(day => {
        const formattedDate = format(day, 'yyyy-MM-dd');
        dailyTotals[formattedDate] = 0;
    });

    filteredDevices.forEach(device => {
        const deviceDate = format(new Date(device.createdAt), 'yyyy-MM-dd');
        if (dailyTotals[deviceDate] !== undefined) {
             dailyTotals[deviceDate] += 1;
        }
    });

    return Object.entries(dailyTotals).map(([date, total]) => ({
        date: format(new Date(date), 'MMM d'),
        devices: total,
    }));
  }, [filteredDevices, date]);


  return (
    <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">K{totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                        From all delivered orders
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        This Month's Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">K{thisMonthRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                        Revenue for {format(new Date(), 'MMMM')}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Orders
                    </CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{orders.length}</div>
                    <p className="text-xs text-muted-foreground">
                        Total orders placed all time
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Devices
                    </CardTitle>
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{devices.length}</div>
                    <p className="text-xs text-muted-foreground">
                        Total unique devices that have visited
                    </p>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>A summary of your sales and device growth over the selected period.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center px-4">
                    <div className="grid gap-2 w-full sm:w-auto">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                "w-full sm:w-[300px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                date.to ? (
                                    <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                                ) : (
                                <span>Pick a date</span>
                                )}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Select onValueChange={(value) => {
                        const now = new Date();
                        if (value === 'this-month') setDate({ from: startOfMonth(now), to: endOfMonth(now) });
                        if (value === 'last-7-days') setDate({ from: subDays(now, 6), to: now });
                        if (value === 'this-week') setDate({ from: startOfWeek(now), to: endOfWeek(now) });
                        if (value === 'last-year') setDate({ from: subYears(now, 1), to: now });
                    }}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Quick Select" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="this-month">This Month</SelectItem>
                            <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                            <SelectItem value="this-week">This Week</SelectItem>
                            <SelectItem value="last-year">Last Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <Tabs defaultValue="sales" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="sales">Sales</TabsTrigger>
                        <TabsTrigger value="devices">Devices</TabsTrigger>
                    </TabsList>
                    <TabsContent value="sales" className="pl-2">
                        <div className="h-[350px] w-full">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ChartContainer config={{ orders: { label: "Orders", color: "hsl(var(--primary))" } }}>
                                        <LineChart accessibilityLayer data={salesChartData} margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                tickMargin={10}
                                                axisLine={false}
                                                tickFormatter={(value) => value.slice(0, 3)}
                                            />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={10}
                                                allowDecimals={false}
                                            />
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent indicator="dot" />}
                                            />
                                            <Line dataKey="orders" type="monotone" stroke="var(--color-orders)" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ChartContainer>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="devices" className="pl-2">
                         <div className="h-[350px] w-full">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ChartContainer config={{ devices: { label: "New Devices", color: "hsl(var(--accent))" } }}>
                                        <LineChart accessibilityLayer data={deviceChartData} margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
                                            <CartesianGrid vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                tickMargin={10}
                                                axisLine={false}
                                                tickFormatter={(value) => value.slice(0, 3)}
                                            />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={10}
                                                allowDecimals={false}
                                            />
                                            <ChartTooltip
                                                cursor={false}
                                                content={<ChartTooltipContent indicator="dot" />}
                                            />
                                            <Line dataKey="devices" type="monotone" stroke="var(--color-devices)" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ChartContainer>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>
  );
}

    