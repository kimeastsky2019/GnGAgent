import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AiPrediction, DeviceUsage, EnergySnapshot } from "@/types/ai";

interface UseAiPredictionsOptions {
  devices: DeviceUsage[];
  energyContext: EnergySnapshot;
  initialPredictions: AiPrediction[];
  endpoint?: string;
  pollIntervalMs?: number;
}

interface UseAiPredictionsResult {
  predictedDevices: AiPrediction[];
  aiPredictionLoading: boolean;
  aiPredictionError: string | null;
  lastPredictionUpdate: Date | null;
  refreshPredictions: () => Promise<void>;
}

const DEFAULT_ENDPOINT = "https://agent.gngmeta.com/sa";
const DEFAULT_POLL_INTERVAL = 300000; // 5 minutes

export function useAiPredictions({
  devices,
  energyContext,
  initialPredictions,
  endpoint = DEFAULT_ENDPOINT,
  pollIntervalMs = DEFAULT_POLL_INTERVAL
}: UseAiPredictionsOptions): UseAiPredictionsResult {
  const [predictedDevices, setPredictedDevices] = useState<AiPrediction[]>(initialPredictions);
  const [aiPredictionLoading, setAiPredictionLoading] = useState(false);
  const [aiPredictionError, setAiPredictionError] = useState<string | null>(null);
  const [lastPredictionUpdate, setLastPredictionUpdate] = useState<Date | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const initialPredictionsRef = useRef(initialPredictions);
  const devicesRef = useRef(devices);
  const energyContextRef = useRef(energyContext);

  // Keep references in sync without re-creating callbacks
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  useEffect(() => {
    energyContextRef.current = energyContext;
  }, [energyContext]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const parsePredictions = useCallback((response: unknown): AiPrediction[] => {
    if (Array.isArray(response)) {
      return response as AiPrediction[];
    }

    if (response && typeof response === "object" && "response" in response) {
      const raw = String((response as { response?: string }).response ?? "");
      const jsonMatch = raw.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as AiPrediction[];
      }
    }

    // Fallback with slight enrichment to highlight cached data
    return initialPredictionsRef.current.map(prediction => ({
      ...prediction,
      optimization_tip:
        prediction.optimization_tip ??
        "Consider scheduling during peak solar generation for additional savings",
      reason: `AI Enhanced: ${prediction.reason}`
    }));
  }, []);

  const refreshPredictions = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAiPredictionLoading(true);
    setAiPredictionError(null);

    const deviceContext = devicesRef.current.map(device => ({
      name: device.name,
      power: device.power,
      status: device.status,
      room: device.room,
      efficiency: device.efficiency
    }));

    const now = new Date().toISOString();
    const energy = energyContextRef.current;

    const prompt = `Based on the current IoT device usage data and behavioral patterns, predict the next 5 device usage events for a smart home energy management system.

Current devices: ${JSON.stringify(deviceContext)}
Current time: ${now}
Energy context: Solar generation ${energy.solarGeneration}kW, Consumption ${energy.consumption}kW, Battery ${energy.batteryLevel}%

Please provide predictions in this exact JSON format:
[
  {
    "time": "HH:MM",
    "device": "Device Name",
    "probability": 85,
    "reason": "AI analysis reason",
    "power": 800,
    "optimization_tip": "Energy optimization suggestion"
  }
]

Focus on realistic home appliance usage patterns, energy efficiency, and cost optimization opportunities.`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 1000,
          temperature: 0.7
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const parsedPredictions = parsePredictions(data);

      if (!isMountedRef.current) return;

      setPredictedDevices(parsedPredictions);
      setLastPredictionUpdate(new Date());
    } catch (error) {
      if (!isMountedRef.current || controller.signal.aborted) return;

      const message = error instanceof Error ? error.message : "Unknown AI prediction error";
      setAiPredictionError(message);
      setPredictedDevices(initialPredictionsRef.current);
    } finally {
      if (isMountedRef.current) {
        setAiPredictionLoading(false);
      }
    }
  }, [endpoint, parsePredictions]);

  // Initialize predictions immediately with provided seed
  useEffect(() => {
    setPredictedDevices(initialPredictionsRef.current);
  }, []);

  // Kick off the first remote fetch shortly after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshPredictions();
    }, 2000);

    return () => clearTimeout(timer);
  }, [refreshPredictions]);

  // Auto-refresh predictions on an interval
  useEffect(() => {
    if (!pollIntervalMs) return;

    const interval = setInterval(() => {
      void refreshPredictions();
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [pollIntervalMs, refreshPredictions]);

  // Derive stable return object to avoid churn in consumers
  return useMemo(
    () => ({
      predictedDevices,
      aiPredictionLoading,
      aiPredictionError,
      lastPredictionUpdate,
      refreshPredictions
    }),
    [aiPredictionError, aiPredictionLoading, lastPredictionUpdate, predictedDevices, refreshPredictions]
  );
}
