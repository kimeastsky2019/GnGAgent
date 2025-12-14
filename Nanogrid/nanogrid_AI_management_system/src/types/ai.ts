import type { LucideIcon } from "lucide-react";

export interface DeviceUsage {
  id: number;
  name: string;
  icon: LucideIcon;
  power: number;
  status: "active" | "standby";
  room: string;
  duration: string;
  efficiency: number;
}

export interface EnergySnapshot {
  solarGeneration: number;
  consumption: number;
  batteryLevel: number;
}

export interface AiPrediction {
  time: string;
  device: string;
  probability: number;
  reason: string;
  power: number;
  optimization_tip?: string;
}
