// WebUSB TypeScript declarations
declare interface USBDevice {
  vendorId: number;
  productId: number;
  serialNumber?: string;
  configuration: USBConfiguration | null;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferOut(
    endpointNumber: number,
    data: BufferSource,
  ): Promise<USBOutTransferResult>;
  transferIn(
    endpointNumber: number,
    length: number,
  ): Promise<USBInTransferResult>;
}

declare interface USBConfiguration {
  configurationValue: number;
}

declare interface USBOutTransferResult {
  bytesWritten: number;
  status: "ok" | "stall" | "babble";
}

declare interface USBInTransferResult {
  data?: DataView;
  status: "ok" | "stall" | "babble";
}

declare interface USBDeviceRequestOptions {
  filters: USBDeviceFilter[];
}

declare interface USBDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
}

declare interface USB {
  getDevices(): Promise<USBDevice[]>;
  requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void;
}
