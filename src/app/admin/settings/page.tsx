import SettingsDashboard from "@/components/admin/SettingsDashboard";

export default function AdminSettingsPage() {
    return (
        <div>
             <div className="space-y-4 mb-8">
                <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter text-primary">
                    Settings
                </h1>
                <p className="text-lg text-foreground/80">
                    Manage your delivery schedule.
                </p>
            </div>
            <SettingsDashboard />
        </div>
    );
}
