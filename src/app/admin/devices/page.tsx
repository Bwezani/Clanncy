import DevicesDashboard from "@/components/admin/DevicesDashboard";

export default function AdminDevicesPage() {
    return (
        <div>
            <div className="space-y-4 mb-8">
                <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
                    Devices
                </h1>
                <p className="text-lg text-foreground/80">
                    View devices that have accessed the application.
                </p>
            </div>
            <DevicesDashboard />
        </div>
    );
}
