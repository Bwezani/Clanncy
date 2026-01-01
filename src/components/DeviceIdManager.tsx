"use client";

import { useDeviceId } from "@/hooks/use-device-id";

export default function DeviceIdManager() {
    useDeviceId();
    return null;
}
