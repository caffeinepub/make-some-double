import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Job {
    leftSerial: bigint;
    prefix: string;
    rightSerial: bigint;
}
export interface backendInterface {
    getAllJobs(): Promise<Array<Job>>;
    getSettings(): Promise<string>;
    setSettings(newSettings: string): Promise<void>;
    submitJob(prefix: string, leftSerial: bigint, rightSerial: bigint): Promise<void>;
}
