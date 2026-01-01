"use client";

import React, { useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, subYears } from 'date-fns';
import type { DateRange } from "react-day-picker"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';


export default function AnalyticsDashboard() {
  const { orders, isLoading } = useAdmin();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  })

  const filteredOrders = useMemo(() => {
    if (!date?.from || !date?.to) return [];
    return orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= date.from! && orderDate <= date.to!;
    });
  }, [orders, date]);

  const chartData = useMemo(() => {
    if (!filteredOrders.length || !date?.from || !date?.to) return [];

    const dailyTotals: Record<string, number> = {};
    let currentDate = date.from;
    while (currentDate <= date.to) {
        const formattedDate = format(currentDate, 'yyyy-MM-dd');
        dailyTotals[formattedDate] = 0;
        currentDate = addDays(currentDate, 1);
    }

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


  return (
    <Card>
        <CardHeader>
        <CardTitle>Sales Analytics</CardTitle>
        <CardDescription>A summary of your sales over the selected period.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pl-2">
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
            <div className="h-[350px] w-full">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ChartContainer config={{ orders: { label: "Orders", color: "hsl(var(--primary))" } }}>
                            <BarChart accessibilityLayer data={chartData}>
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
                                <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </ResponsiveContainer>
                )}
            </div>
        </CardContent>
    </Card>
  );
}
