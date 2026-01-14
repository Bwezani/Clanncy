
"use client";

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
} from "@/components/ui/table"
import { Loader2, Smartphone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

function DeviceCard({ device }: { device: AdminDevice }) {
    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <CardTitle className="text-sm font-mono break-all">{device.id}</CardTitle>
                <CardDescription className="break-words">{device.userAgent}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
                <p><span className="font-semibold">First Seen:</span> {device.formattedCreatedAt}</p>
                <p><span className="font-semibold">Last Seen:</span> {device.formattedLastSeenAt}</p>
            </CardContent>
        </Card>
    )
}

function DeviceTable({ devices }: { devices: AdminDevice[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Device ID</TableHead>
                    <TableHead>First Seen</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>User Agent</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {devices.map(device => (
                    <TableRow key={device.id}>
                        <TableCell className="font-mono text-xs max-w-[150px] truncate">{device.id}</TableCell>
                        <TableCell>{device.formattedCreatedAt}</TableCell>
                        <TableCell>{device.formattedLastSeenAt}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={device.userAgent}>{device.userAgent}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}


export default function DevicesDashboard() {
    const { devices, isLoading } = useAdmin();
    const isMobile = useIsMobile();

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
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Devices
                    </CardTitle>
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{devices.length}</div>
                    <p className="text-xs text-muted-foreground">
                        Total unique devices that have visited the app
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Device List</CardTitle>
                    <CardDescription>A list of all unique devices, sorted by last seen.</CardDescription>
                </CardHeader>
                <CardContent>
                   {isMobile ? (
                       <div className="space-y-4">
                           {devices.map(device => <DeviceCard key={device.id} device={device} />)}
                       </div>
                   ) : (
                       <DeviceTable devices={devices} />
                   )}
                </CardContent>
            </Card>
        </div>
    )
}
