import { create } from "zustand";

const LAST_DEVICE_KEY = "printer_last_device";

// WebUSB interfaces (not in standard TS lib)
interface WebUSBDevice {
  vendorId: number;
  productId: number;
  serialNumber?: string;
  configuration: { configurationValue: number } | null;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  transferOut(
    endpointNumber: number,
    data: BufferSource,
  ): Promise<{ bytesWritten: number; status: string }>;
}

interface WebUSB {
  getDevices(): Promise<WebUSBDevice[]>;
  requestDevice(options: { filters: unknown[] }): Promise<WebUSBDevice>;
}

interface NavigatorWithUSB extends Navigator {
  usb: WebUSB;
}

interface PrinterState {
  isConnected: boolean;
  device: WebUSBDevice | null;
  lastDeviceId: string | null;
  isConnecting: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  reconnect(): Promise<void>;
  print(cpclString: string): Promise<void>;
  testPrint(): Promise<void>;
  testPrintWithSerials(
    serial1: string,
    serial2: string,
    title: string,
    settings: import("../stores/labelSettingsStore").LabelSettings,
  ): Promise<void>;
}

const getLastDeviceId = (): string | null => {
  try {
    return localStorage.getItem(LAST_DEVICE_KEY);
  } catch {
    return null;
  }
};

const setLastDeviceId = (id: string | null): void => {
  try {
    if (id) {
      localStorage.setItem(LAST_DEVICE_KEY, id);
    } else {
      localStorage.removeItem(LAST_DEVICE_KEY);
    }
  } catch {
    // ignore
  }
};

const getDeviceId = (device: WebUSBDevice): string => {
  return `${device.vendorId}_${device.productId}_${device.serialNumber ?? ""}`;
};

const openDevice = async (device: WebUSBDevice): Promise<void> => {
  await device.open();
  if (device.configuration === null) {
    await device.selectConfiguration(1);
  }
  await device.claimInterface(0);
};

const getUSB = (): WebUSB | null => {
  if (!("usb" in navigator)) return null;
  return (navigator as NavigatorWithUSB).usb;
};

export const usePrinterStore = create<PrinterState>((set, get) => ({
  isConnected: false,
  device: null,
  lastDeviceId: getLastDeviceId(),
  isConnecting: false,

  connect: async () => {
    const usb = getUSB();
    if (!usb) {
      throw new Error("WebUSB is not supported in this browser");
    }
    set({ isConnecting: true });
    try {
      const device = await usb.requestDevice({ filters: [] });
      await openDevice(device);
      const deviceId = getDeviceId(device);
      setLastDeviceId(deviceId);
      set({
        isConnected: true,
        device,
        lastDeviceId: deviceId,
        isConnecting: false,
      });
    } catch (err) {
      set({ isConnecting: false });
      throw err;
    }
  },

  disconnect: async () => {
    const { device } = get();
    if (device) {
      try {
        await device.close();
      } catch {
        // ignore close errors
      }
    }
    setLastDeviceId(null);
    set({ isConnected: false, device: null, lastDeviceId: null });
  },

  reconnect: async () => {
    const usb = getUSB();
    if (!usb) return;
    const lastId = getLastDeviceId();
    if (!lastId) return;

    set({ isConnecting: true });
    try {
      const devices = await usb.getDevices();
      const match = devices.find((d) => getDeviceId(d) === lastId);
      if (match) {
        await openDevice(match);
        set({ isConnected: true, device: match, isConnecting: false });
      } else {
        set({ isConnecting: false });
      }
    } catch {
      set({ isConnecting: false });
    }
  },

  print: async (cpclString: string) => {
    const { device } = get();
    if (!device) throw new Error("No printer connected");
    const encoder = new TextEncoder();
    // Ensure CPCL lines are terminated with \r\n as required by most CPCL printers
    const normalized = cpclString.replace(/\r?\n/g, "\r\n");
    const data = encoder.encode(`${normalized}\r\n`);
    await device.transferOut(1, data);
  },

  testPrint: async () => {
    // CPCL BARCODE: data must be on a separate line immediately after the command
    const testLines = [
      "! 0 200 200 336 1",
      "PAGE-WIDTH 456",
      "TEXT 24 0 16 16 MAKE SOME DOUBLE!!",
      "TEXT 20 0 16 60 TEST PRINT - OK",
      "BARCODE CODE128 2 2 79 16 100",
      "TEST123456",
      "TEXT 16 0 16 195 TEST123456",
      "PRINT",
    ];
    await get().print(testLines.join("\r\n"));
  },

  testPrintWithSerials: async (
    serial1: string,
    serial2: string,
    title: string,
    settings: import("../stores/labelSettingsStore").LabelSettings,
  ) => {
    const { generateCPCL } = await import("../utils/cpclGenerator");
    const cpcl = generateCPCL(settings, serial1, serial2, title);
    await get().print(cpcl);
  },
}));
