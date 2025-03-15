import React, { useState, useEffect } from "react";

// Function to generate a persistent device ID
const getPersistentDeviceId = async () => {
    let storedId = localStorage.getItem("deviceId");

    if (!storedId) {
        storedId = await generateFingerprint(); // Generate unique device fingerprint
        localStorage.setItem("deviceId", storedId);
        await storeInIndexedDB("deviceId", storedId);
    }

    return storedId;
};

// IndexedDB Initialization
const initializeIndexedDB = async () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("DeviceDB", 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("deviceStore")) {
                db.createObjectStore("deviceStore");
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

// Store device ID in IndexedDB
const storeInIndexedDB = async (key, value) => {
    try {
        const db = await initializeIndexedDB();
        const transaction = db.transaction("deviceStore", "readwrite");
        const store = transaction.objectStore("deviceStore");
        store.put(value, key);
    } catch (error) {
        console.error("IndexedDB Error:", error);
    }
};

// Retrieve device ID from IndexedDB
const getFromIndexedDB = async (key) => {
    try {
        const db = await initializeIndexedDB();
        return new Promise((resolve) => {
            const transaction = db.transaction("deviceStore", "readonly");
            const store = transaction.objectStore("deviceStore");
            const getRequest = store.get(key);
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => resolve(null);
        });
    } catch (error) {
        return null;
    }
};

// **Canvas Fingerprinting for Unique Device Identification**
const generateFingerprint = async () => {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillText("UniqueDeviceFingerprint", 2, 2);
        const fingerprint = canvas.toDataURL();
        resolve(fingerprint.substring(0, 50)); // Shorten the fingerprint string
    });
};

const App = () => {
    const [deviceId, setDeviceId] = useState(null);

    useEffect(() => {
        const fetchDeviceId = async () => {
            let storedDeviceId =
                localStorage.getItem("deviceId") || (await getFromIndexedDB("deviceId"));

            if (!storedDeviceId) {
                storedDeviceId = await getPersistentDeviceId();
            }
            setDeviceId(storedDeviceId);
        };

        fetchDeviceId();
    }, []);

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Device Identification System</h2>
            <p><strong>Device ID:</strong> {deviceId || "Generating..."}</p>
        </div>
    );
};

export default App;
