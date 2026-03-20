"use client";

import React, { useState, useMemo } from "react";
import type { AdminDevice } from "@/lib/types";
import { useAdmin } from "@/context/AdminContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Smartphone, Search, Calendar, Monitor, Cpu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader } from "@/components/ui/loader";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

function DeviceCard({ device }: { device: AdminDevice }) {
    return (
        <Card className="overflow-hidden border-none shadow-md bg-card/50">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Device Reference</span>
                </div>
                <CardTitle className="text-xs font-mono break-all bg-muted p-2 rounded border">
                    {device.id}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">User Agent</p>
                    <p className="text-xs text-foreground/80 line-clamp-2 leading-tight bg-background/50 p-2 rounded italic">
                        {device.userAgent}
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">First Seen</p>
                        <p className="text-xs font-medium">{device.formattedCreatedAt}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Last Activity</p>
                        <p className="text-xs font-bold text-primary">{device.formattedLastSeenAt}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function DeviceTable({ devices }: { devices: AdminDevice[] }) {
    return (
        <div className="rounded-xl border overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="font-bold">Device ID</TableHead>
                        <TableHead className="font-bold">Traffic History</TableHead>
                        <TableHead className="font-bold">Client Environment</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {devices.map(device => (
                        <TableRow key={device.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="align-top py-4">
                                <Badge variant="outline" className="font-mono text-[10px] py-1 px-2 border-primary/20 bg-primary/5">
                                    {device.id}
                                </Badge>
                            </TableCell>
                            <TableCell className="align-top py-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-muted-foreground">First:</span>
                                        <span className="font-medium">{device.formattedCreatedAt}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <Cpu className="h-3 w-3 text-primary" />
                                        <span className="text-muted-foreground">Active:</span>
                                        <span className="font-bold text-primary">{device.formattedLastSeenAt}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="max-w-md">
                                <div className="p-3 bg-muted/20 rounded-lg border border-dashed text-[11px] leading-relaxed text-muted-foreground italic truncate" title={device.userAgent}>
                                    {device.userAgent}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export default function DevicesDashboard() {
    const { devices, isLoading } = useAdmin();
    const isMobile = useIsMobile();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredDevices = useMemo(() => {
        if (!searchTerm) return devices;
        const lowTerm = searchTerm.toLowerCase();
        return devices.filter(d => 
            d.id.toLowerCase().includes(lowTerm) || 
            d.userAgent.toLowerCase().includes(lowTerm)
        );
    }, [devices, searchTerm]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader />
            </div>
        );
    }

    return (
        <div className="space-y-8">
             <Card className="border-accent/30 bg-accent/5 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Smartphone className="h-24 w-24 rotate-12" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-accent-foreground/70">
                        Total Unique Visitors
                    </CardTitle>
                    <Smartphone className="h-5 w-5 text-accent" />
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="text-4xl font-black text-accent-foreground">{devices.length}</div>
                    <p className="text-[10px] text-accent-foreground/60 font-medium uppercase mt-1">
                        Captured from browser fingerprints
                    </p>
                </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
                <CardHeader className="border-b pb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="text-xl font-bold">Traffic Source Logs</CardTitle>
                            <CardDescription>Monitor devices accessing your storefront.</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by ID or Browser..." 
                                className="pl-9 h-10 shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                   {filteredDevices.length > 0 ? (
                       isMobile ? (
                           <div className="space-y-4">
                               {filteredDevices.map(device => <DeviceCard key={device.id} device={device} />)}
                           </div>
                       ) : (
                           <DeviceTable devices={filteredDevices} />
                       )
                   ) : (
                       <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed">
                           <Search className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                           <p className="text-muted-foreground font-medium">No matching devices found</p>
                           <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search terms</p>
                       </div>
                   )}
                </CardContent>
            </Card>
        </div>
    );
}