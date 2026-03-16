"use client";

import React, { useState, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subYears, eachDayOfInterval, isThisMonth } from 'date-fns';
import type { DateRange } from "react-day-picker"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Smartphone, ShoppingCart, DollarSign, Target, TrendingUp, Package } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Loader } from '@/components/ui/loader';


const generateDateRange = (start: Date, end: Date) => {
    return eachDayOfInterval({ start, end });
};

export default function AnalyticsDashboard() {
  const { orders, devices, isLoading, goals } = useAdmin();
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
  
  const {
    currentSales,
    currentReservations,
    currentDevices,
    salesProgress,
    reservationsProgress,
    devicesProgress,
    isGoalsPeriodSet
  } = useMemo(() => {
    if (!goals.startDate || !goals.endDate) {
        return { 
            isGoalsPeriodSet: false,
            currentSales: 0,
            salesProgress: 0,
            currentReservations: 0,
            reservationsProgress: 0,
            currentDevices: 0,
            devicesProgress: 0,
        };
    }

    const goalStartDate = goals.startDate;
    const goalEndDate = goals.endDate;

    const deliveredOrdersInPeriod = orders.filter(o =>
        o.status === 'Delivered' &&
        o.date >= goalStartDate &&
        o.date <= goalEndDate
    );
    const sales = deliveredOrdersInPeriod.reduce((sum, order) => sum + order.price, 0);

    const reservationsInPeriod = orders.filter(o =>
        o.date >= goalStartDate &&
        o.date <= goalEndDate
    );

    const devicesInPeriod = devices.filter(d =>
        d.createdAt >= goalStartDate &&
        d.createdAt <= goalEndDate
    );
    
    return {
        isGoalsPeriodSet: true,
        currentSales: sales,
        salesProgress: goals.salesTarget > 0 ? (sales / goals.salesTarget) * 100 : 0,
        currentReservations: reservationsInPeriod.length,
        reservationsProgress: goals.reservationsTarget > 0 ? (reservationsInPeriod.length / goals.reservationsTarget) * 100 : 0,
        currentDevices: devicesInPeriod.length,
        devicesProgress: goals.devicesTarget > 0 ? (devicesInPeriod.length / goals.devicesTarget) * 100 : 0,
    }
  }, [goals, orders, devices]);


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
        <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Target className="h-6 w-6" />
                    Goal Progress
                </CardTitle>
                {isGoalsPeriodSet && goals.startDate && goals.endDate ? (
                    <CardDescription>
                        Progress towards your goals for the period: <b>{format(goals.startDate, "do MMM")} - {format(goals.endDate, "do MMM, yyyy")}</b>
                    </CardDescription>
                ) : (
                    <CardDescription>
                        Set a goal period in the settings to track your progress.
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                {isGoalsPeriodSet ? (
                    <>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm font-bold">
                                <span className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-600" /> Sales</span>
                                <span className="text-foreground/80">K{currentSales.toFixed(2)} / K{goals.salesTarget.toFixed(2)}</span>
                            </div>
                            <Progress value={salesProgress} className="h-3" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm font-bold">
                                <span className="flex items-center gap-2"><Package className="h-4 w-4 text-blue-600" /> Reservations</span>
                                <span className="text-foreground/80">{currentReservations} / {goals.reservationsTarget}</span>
                            </div>
                            <Progress value={reservationsProgress} className="h-3" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm font-bold">
                                <span className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-accent" /> New Devices</span>
                                <span className="text-foreground/80">{currentDevices} / {goals.devicesTarget}</span>
                            </div>
                            <Progress value={devicesProgress} className="h-3" />
                        </div>
                    </>
                ) : (
                    <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-xl">
                        No goal period set.
                    </div>
                )}
            </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-green-500/20 bg-green-500/5 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-green-700">
                        Total Revenue
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-green-700">K{totalRevenue.toFixed(2)}</div>
                    <p className="text-[10px] text-green-600/70 font-medium uppercase mt-1">
                        All-time delivered
                    </p>
                </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                        Monthly Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-primary">K{thisMonthRevenue.toFixed(2)}</div>
                    <p className="text-[10px] text-primary/70 font-medium uppercase mt-1">
                        {format(new Date(), 'MMMM')} current
                    </p>
                </CardContent>
            </Card>
            <Card className="border-blue-500/20 bg-blue-500/5 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-700">
                        Total Orders
                    </CardTitle>
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-blue-700">{orders.length}</div>
                    <p className="text-[10px] text-blue-600/70 font-medium uppercase mt-1">
                        Lifetime placements
                    </p>
                </CardContent>
            </Card>
             <Card className="border-accent/30 bg-accent/5 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-accent-foreground">
                        Total Devices
                    </CardTitle>
                    <Smartphone className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black text-accent-foreground">{devices.length}</div>
                    <p className="text-[10px] text-accent-foreground/60 font-medium uppercase mt-1">
                        Unique visitors
                    </p>
                </CardContent>
            </Card>
        </div>

        <Card className="shadow-lg border-none">
            <CardHeader className="border-b pb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Traffic & Sales Trends</CardTitle>
                        <CardDescription>Visualize your business growth over time.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                "w-full sm:w-[260px] justify-start text-left font-normal h-10",
                                !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                date.to ? (
                                    <>
                                    {format(date.from, "LLL dd")} - {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                                ) : (
                                <span>Pick a date range</span>
                                )}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
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
                        <Select onValueChange={(value) => {
                            const now = new Date();
                            if (value === 'this-month') setDate({ from: startOfMonth(now), to: endOfMonth(now) });
                            if (value === 'last-7-days') setDate({ from: subDays(now, 6), to: now });
                            if (value === 'this-week') setDate({ from: startOfWeek(now), to: endOfWeek(now) });
                            if (value === 'last-year') setDate({ from: subYears(now, 1), to: now });
                        }}>
                            <SelectTrigger className="w-full sm:w-[160px] h-10">
                                <SelectValue placeholder="Quick Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                                <SelectItem value="this-week">This Week</SelectItem>
                                <SelectItem value="this-month">This Month</SelectItem>
                                <SelectItem value="last-year">Last Year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                 <Tabs defaultValue="sales" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 h-12 p-1 bg-muted/50 max-w-md mx-auto">
                        <TabsTrigger value="sales" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Sales Volume</TabsTrigger>
                        <TabsTrigger value="devices" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">New Traffic</TabsTrigger>
                    </TabsList>
                    <TabsContent value="sales" className="pl-0 outline-none">
                        <div className="h-[400px] w-full mt-4">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ChartContainer config={{ orders: { label: "Orders", color: "hsl(var(--primary))" } }}>
                                        <AreaChart accessibilityLayer data={salesChartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                                            <defs>
                                                <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--color-orders)" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="var(--color-orders)" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                tickMargin={15}
                                                axisLine={false}
                                                style={{ fontSize: '12px', fontWeight: 500 }}
                                            />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={15}
                                                allowDecimals={false}
                                                style={{ fontSize: '12px', fontWeight: 500 }}
                                            />
                                            <ChartTooltip
                                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}
                                                content={<ChartTooltipContent indicator="line" />}
                                            />
                                            <Area 
                                                dataKey="orders" 
                                                type="monotone" 
                                                stroke="var(--color-orders)" 
                                                strokeWidth={3} 
                                                fill="url(#fillOrders)" 
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ChartContainer>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </TabsContent>
                    <TabsContent value="devices" className="pl-0 outline-none">
                         <div className="h-[400px] w-full mt-4">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ChartContainer config={{ devices: { label: "New Devices", color: "hsl(var(--accent))" } }}>
                                        <AreaChart accessibilityLayer data={deviceChartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                                            <defs>
                                                <linearGradient id="fillDevices" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--color-devices)" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="var(--color-devices)" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                tickMargin={15}
                                                axisLine={false}
                                                style={{ fontSize: '12px', fontWeight: 500 }}
                                            />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={15}
                                                allowDecimals={false}
                                                style={{ fontSize: '12px', fontWeight: 500 }}
                                            />
                                            <ChartTooltip
                                                cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1 }}
                                                content={<ChartTooltipContent indicator="line" />}
                                            />
                                            <Area 
                                                dataKey="devices" 
                                                type="monotone" 
                                                stroke="var(--color-devices)" 
                                                strokeWidth={3} 
                                                fill="url(#fillDevices)" 
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
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
