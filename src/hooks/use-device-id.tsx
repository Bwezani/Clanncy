"use client";

import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const DEVICE_ID_KEY = "deviceId";
const DEVICE_ID_SYNCED_KEY = "deviceIdSynced";

export function useDeviceId() {
  useEffect(() => {
    const getOrGenerateDeviceId = async () => {
      let deviceId = localStorage.getItem(DEVICE_ID_KEY);
      const isSynced = localStorage.getItem(DEVICE_ID_SYNCED_KEY);

      if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
      }

      if (deviceId && !isSynced) {
        try {
          await setDoc(doc(db, "devices", deviceId), {
            createdAt: serverTimestamp(),
            lastSeenAt: serverTimestamp(),
            userAgent: navigator.userAgent,
          });
          localStorage.setItem(DEVICE_ID_SYNCED_KEY, "true");
          console.log("Device ID synced to Firestore:", deviceId);
        } catch (error) {
          console.error("Error saving device ID to Firestore:", error);
        }
      } else if (deviceId && isSynced) {
         try {
          await setDoc(doc(db, "devices", deviceId), {
            lastSeenAt: serverTimestamp(),
          }, { merge: true });
        } catch (error) {
          console.error("Error updating device lastSeenAt:", error);
        }
      }
    };

    // Ensure this runs only on the client
    if (typeof window !== "undefined") {
      getOrGenerateDeviceId();
    }
  }, []);
}
