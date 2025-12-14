import { useState, useEffect, useMemo } from "react";
import { useAiPredictions } from "@/hooks/use-ai-predictions";
import type { AiPrediction, DeviceUsage } from "@/types/ai";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Zap, Sun, Battery, Home, ArrowUpDown, Lightbulb, Leaf, BarChart3, MessageSquare, Settings, AlertTriangle, DollarSign, Activity, TrendingUp, Users, Tv, Refrigerator, WashingMachine, AirVent, Microwave, Monitor, Laptop, Smartphone, Clock, Eye, Brain, Thermometer, Droplets, Wind, Gauge, Shield, AlertCircle, CheckCircle, XCircle, TrendingDown, Network, Database, GitBranch, FileText, Download, Upload, Share2, RefreshCw, Plus } from "lucide-react";
import PlatformHeader from "@/components/dashboard/platform-header";
import EnergyOverview from "@/components/dashboard/energy-overview";
import TabMenu from "@/components/dashboard/tab-menu";
const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [energyData, setEnergyData] = useState({
    solarGeneration: 4.2,
    consumption: 3.1,
    batteryLevel: 78,
    gridExport: 1.1,
    carbonOffset: 2.3
  });
  const [p2pTrades, setP2pTrades] = useState([{
    id: 1,
    neighbor: "House #42",
    amount: 2.5,
    price: 0.15,
    status: "active",
    savings: 12
  }, {
    id: 2,
    neighbor: "House #38",
    amount: 1.8,
    price: 0.14,
    status: "completed",
    savings: 8
  }, {
    id: 3,
    neighbor: "House #51",
    amount: 3.2,
    price: 0.16,
    status: "pending",
    savings: 15
  }]);
  const [aiInsights, setAiInsights] = useState(["Sunny afternoon forecast. Consider pre-cooling your home now while electricity is cheap.", "Your solar panels are performing 5% above average today due to optimal weather conditions.", "Neighbor House #42 is offering energy at 12% below grid price. Trade recommended."]);
  const [hardwareModules, setHardwareModules] = useState([{
    id: 1,
    name: "Solar Panel Array A1",
    efficiency: 22.1,
    temperature: 45,
    status: "optimal"
  }, {
    id: 2,
    name: "Solar Panel Array A2",
    efficiency: 21.8,
    temperature: 47,
    status: "optimal"
  }, {
    id: 3,
    name: "Battery Storage Unit",
    capacity: 13.5,
    charge: 78,
    status: "charging"
  }, {
    id: 4,
    name: "Smart Inverter",
    power: 5000,
    load: 3100,
    status: "active"
  }]);
  const behaviorAnalytics = {
    peakUsageHours: "2:00 PM - 6:00 PM",
    averageDailyConsumption: "28.5 kWh",
    efficiencyScore: 87,
    carbonFootprint: "2.1 kg CO2/day",
    predictedSavings: "€45.20/month"
  };

  // Module C: HVAC & Indoor Quality Data
  const [hvacData, setHvacData] = useState({
    temperature: 22.5,
    humidity: 45,
    airQuality: 85,
    co2Level: 420,
    pm25: 12,
    hvacStatus: 'auto',
    fanSpeed: 65,
    filterLife: 78,
    energyEfficiency: 92
  });
  const [hvacHistory, setHvacHistory] = useState([{
    time: '00:00',
    temp: 21.2,
    humidity: 48,
    aqi: 82,
    co2: 410,
    pm25: 15
  }, {
    time: '04:00',
    temp: 20.8,
    humidity: 52,
    aqi: 85,
    co2: 400,
    pm25: 13
  }, {
    time: '08:00',
    temp: 22.1,
    humidity: 46,
    aqi: 88,
    co2: 430,
    pm25: 11
  }, {
    time: '12:00',
    temp: 23.5,
    humidity: 42,
    aqi: 90,
    co2: 450,
    pm25: 9
  }, {
    time: '16:00',
    temp: 24.2,
    humidity: 40,
    aqi: 87,
    co2: 480,
    pm25: 14
  }, {
    time: '20:00',
    temp: 22.8,
    humidity: 44,
    aqi: 85,
    co2: 420,
    pm25: 12
  }]);
  const [hvacAnomalies, setHvacAnomalies] = useState([{
    id: 1,
    type: 'warning',
    sensor: 'Air Quality',
    message: 'PM2.5 levels slightly elevated in bedroom',
    value: '14.0 μg/m³',
    threshold: '12.0 μg/m³',
    timestamp: new Date(Date.now() - 15 * 60000),
    severity: 'medium',
    recommendation: 'Consider increasing ventilation or checking air filter'
  }, {
    id: 2,
    type: 'info',
    sensor: 'HVAC System',
    message: 'Filter replacement recommended soon',
    value: '78.0% life remaining',
    threshold: '80.0% replacement threshold',
    timestamp: new Date(Date.now() - 2 * 60 * 60000),
    severity: 'low',
    recommendation: 'Schedule filter replacement within 2 weeks'
  }, {
    id: 3,
    type: 'success',
    sensor: 'Energy Efficiency',
    message: 'HVAC operating at optimal efficiency',
    value: '92.0% efficiency',
    threshold: '85.0% target',
    timestamp: new Date(Date.now() - 30 * 60000),
    severity: 'good',
    recommendation: 'Current settings are optimal for energy savings'
  }]);
  const hvacZones = [{
    id: 1,
    name: 'Living Room',
    temp: 22.5,
    humidity: 45,
    aqi: 88,
    status: 'optimal'
  }, {
    id: 2,
    name: 'Bedroom',
    temp: 21.8,
    humidity: 48,
    aqi: 82,
    status: 'warning'
  }, {
    id: 3,
    name: 'Kitchen',
    temp: 23.2,
    humidity: 42,
    aqi: 90,
    status: 'optimal'
  }, {
    id: 4,
    name: 'Office',
    temp: 22.0,
    humidity: 46,
    aqi: 85,
    status: 'optimal'
  }];

  // AI Anomaly Detection Modules
  const [aiModules, setAiModules] = useState([{
    id: 1,
    name: 'GNN (Graph Neural Network)',
    type: 'GNN',
    status: 'active',
    accuracy: 97.3,
    latency: 23,
    description: 'Advanced graph-based neural network for complex relationship modeling',
    features: ['Multi-node analysis', 'Relationship mapping', 'Pattern recognition'],
    lastTrained: new Date(Date.now() - 2 * 60 * 60000),
    anomaliesDetected: 12,
    confidence: 94.7
  }, {
    id: 2,
    name: 'LSTM (Long Short-Term Memory)',
    type: 'LSTM',
    status: 'testing',
    accuracy: 89.5,
    latency: 45,
    description: 'Recurrent neural network specialized for time-series anomaly detection',
    features: ['Sequential analysis', 'Memory retention', 'Temporal patterns'],
    lastTrained: new Date(Date.now() - 4 * 60 * 60000),
    anomaliesDetected: 8,
    confidence: 87.2
  }, {
    id: 3,
    name: 'TFT (Temporal Fusion Transformer)',
    type: 'TFT',
    status: 'inactive',
    accuracy: 92.1,
    latency: 67,
    description: 'Transformer-based model for multi-horizon forecasting and anomaly detection',
    features: ['Attention mechanism', 'Multi-horizon prediction', 'Feature importance'],
    lastTrained: new Date(Date.now() - 24 * 60 * 60000),
    anomaliesDetected: 15,
    confidence: 91.8
  }, {
    id: 4,
    name: 'Random Forest',
    type: 'RF',
    status: 'standby',
    accuracy: 84.7,
    latency: 12,
    description: 'Ensemble learning method using multiple decision trees',
    features: ['Fast processing', 'Feature ranking', 'Robust performance'],
    lastTrained: new Date(Date.now() - 6 * 60 * 60000),
    anomaliesDetected: 6,
    confidence: 82.5
  }]);
  const [selectedAiModule, setSelectedAiModule] = useState('GNN');
  const handleModuleToggle = (moduleId: number) => {
    setAiModules(prev => prev.map(module => {
      if (module.id === moduleId) {
        const newStatus = module.status === 'active' ? 'inactive' : 'active';
        return {
          ...module,
          status: newStatus
        };
      }
      return module;
    }));
  };

  // Ontology Management Data
  const [selectedUserRole, setSelectedUserRole] = useState('energy_supplier');
  const [ontologyData, setOntologyData] = useState({
    energy_supplier: {
      name: 'Energy Supplier',
      description: 'Entities that generate and supply energy to the grid',
      concepts: [{
        id: 1,
        name: 'Solar Farm',
        type: 'Generation Asset',
        capacity: '50,000 kW',
        efficiency: '22.1%',
        status: 'active'
      }, {
        id: 2,
        name: 'Wind Turbine',
        type: 'Generation Asset',
        capacity: '25,000 kW',
        efficiency: '35.2%',
        status: 'active'
      }, {
        id: 3,
        name: 'Battery Storage',
        type: 'Storage Asset',
        capacity: '100MWh',
        efficiency: '94.5%',
        status: 'charging'
      }, {
        id: 4,
        name: 'Grid Connection',
        type: 'Infrastructure',
        capacity: '200,000 kW',
        efficiency: '98.7%',
        status: 'operational'
      }],
      relationships: [{
        from: 'Solar Farm',
        to: 'Grid Connection',
        type: 'supplies_to',
        strength: 0.85
      }, {
        from: 'Wind Turbine',
        to: 'Battery Storage',
        type: 'charges',
        strength: 0.72
      }, {
        from: 'Battery Storage',
        to: 'Grid Connection',
        type: 'discharges_to',
        strength: 0.91
      }],
      metrics: {
        totalCapacity: '175,000 kW',
        avgEfficiency: '87.6%',
        activeAssets: 4
      }
    },
    operator: {
      name: 'System Operator',
      description: 'Entities responsible for grid stability and energy distribution',
      concepts: [{
        id: 1,
        name: 'Load Balancer',
        type: 'Control System',
        capacity: 'N/A',
        efficiency: '99.2%',
        status: 'active'
      }, {
        id: 2,
        name: 'Frequency Controller',
        type: 'Stability System',
        capacity: 'N/A',
        efficiency: '98.8%',
        status: 'monitoring'
      }, {
        id: 3,
        name: 'Demand Response',
        type: 'Management System',
        capacity: 'N/A',
        efficiency: '89.3%',
        status: 'active'
      }, {
        id: 4,
        name: 'Grid Analytics',
        type: 'AI System',
        capacity: 'N/A',
        efficiency: '95.7%',
        status: 'learning'
      }],
      relationships: [{
        from: 'Load Balancer',
        to: 'Frequency Controller',
        type: 'coordinates_with',
        strength: 0.95
      }, {
        from: 'Demand Response',
        to: 'Grid Analytics',
        type: 'informs',
        strength: 0.88
      }, {
        from: 'Grid Analytics',
        to: 'Load Balancer',
        type: 'optimizes',
        strength: 0.92
      }],
      metrics: {
        systemUptime: '99.8%',
        avgResponse: '12ms',
        activeSystems: 4
      }
    },
    energy_user: {
      name: 'Energy Consumer',
      description: 'End-users who consume energy and participate in P2P trading',
      concepts: [{
        id: 1,
        name: 'Smart Home',
        type: 'Consumer Unit',
        capacity: '15kW',
        efficiency: '87.4%',
        status: 'consuming'
      }, {
        id: 2,
        name: 'EV Charger',
        type: 'Load Device',
        capacity: '7.2kW',
        efficiency: '92.1%',
        status: 'charging'
      }, {
        id: 3,
        name: 'Heat Pump',
        type: 'HVAC System',
        capacity: '5kW',
        efficiency: '85.6%',
        status: 'heating'
      }, {
        id: 4,
        name: 'Smart Appliances',
        type: 'IoT Devices',
        capacity: '3kW',
        efficiency: '91.2%',
        status: 'optimizing'
      }],
      relationships: [{
        from: 'Smart Home',
        to: 'EV Charger',
        type: 'powers',
        strength: 0.78
      }, {
        from: 'Smart Home',
        to: 'Heat Pump',
        type: 'controls',
        strength: 0.89
      }, {
        from: 'Smart Appliances',
        to: 'Smart Home',
        type: 'reports_to',
        strength: 0.94
      }],
      metrics: {
        totalConsumption: '28.5kWh/day',
        avgEfficiency: '89.1%',
        connectedDevices: 12
      }
    },
    policy_manager: {
      name: 'Policy Manager',
      description: 'Regulatory bodies and policy makers in energy sector',
      concepts: [{
        id: 1,
        name: 'Carbon Tax',
        type: 'Policy Instrument',
        capacity: 'N/A',
        efficiency: '76.3%',
        status: 'enforced'
      }, {
        id: 2,
        name: 'Renewable Incentive',
        type: 'Subsidy Program',
        capacity: 'N/A',
        efficiency: '82.7%',
        status: 'active'
      }, {
        id: 3,
        name: 'Grid Code',
        type: 'Technical Standard',
        capacity: 'N/A',
        efficiency: '95.1%',
        status: 'compliant'
      }, {
        id: 4,
        name: 'Energy Certificate',
        type: 'Compliance Tool',
        capacity: 'N/A',
        efficiency: '88.9%',
        status: 'issuing'
      }],
      relationships: [{
        from: 'Carbon Tax',
        to: 'Renewable Incentive',
        type: 'balances_with',
        strength: 0.73
      }, {
        from: 'Grid Code',
        to: 'Energy Certificate',
        type: 'validates',
        strength: 0.91
      }, {
        from: 'Renewable Incentive',
        to: 'Energy Certificate',
        type: 'requires',
        strength: 0.85
      }],
      metrics: {
        policyCompliance: '94.2%',
        avgProcessingTime: '5.2 days',
        activePolicies: 47
      }
    },
    fund_manager: {
      name: 'Fund Manager',
      description: 'Investment and financing entities in energy projects',
      concepts: [{
        id: 1,
        name: 'Green Bond',
        type: 'Financial Instrument',
        capacity: '€500M',
        efficiency: '12.4%',
        status: 'issued'
      }, {
        id: 2,
        name: 'Carbon Credit',
        type: 'Trading Asset',
        capacity: '10,000 tons',
        efficiency: '18.7%',
        status: 'trading'
      }, {
        id: 3,
        name: 'ESG Portfolio',
        type: 'Investment Fund',
        capacity: '€2.1B',
        efficiency: '15.3%',
        status: 'growing'
      }, {
        id: 4,
        name: 'Risk Assessment',
        type: 'Analysis Tool',
        capacity: 'N/A',
        efficiency: '91.8%',
        status: 'monitoring'
      }],
      relationships: [{
        from: 'Green Bond',
        to: 'ESG Portfolio',
        type: 'funds',
        strength: 0.87
      }, {
        from: 'Carbon Credit',
        to: 'ESG Portfolio',
        type: 'contributes_to',
        strength: 0.79
      }, {
        from: 'Risk Assessment',
        to: 'Green Bond',
        type: 'evaluates',
        strength: 0.93
      }],
      metrics: {
        totalAUM: '€2.6B',
        avgReturn: '14.8%',
        activeInvestments: 23
      }
    }
  });
  const userRoles = [{
    id: 'energy_supplier',
    name: 'Energy Supplier',
    icon: Zap,
    color: 'bg-yellow-500'
  }, {
    id: 'operator',
    name: 'System Operator',
    icon: Settings,
    color: 'bg-blue-500'
  }, {
    id: 'energy_user',
    name: 'Energy Consumer',
    icon: Home,
    color: 'bg-green-500'
  }, {
    id: 'policy_manager',
    name: 'Policy Manager',
    icon: Shield,
    color: 'bg-purple-500'
  }, {
    id: 'fund_manager',
    name: 'Fund Manager',
    icon: DollarSign,
    color: 'bg-orange-500'
  }];

  // P2P Trading Scenarios Data
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [tradingScenarios, setTradingScenarios] = useState([{
    id: 1,
    name: 'Conservative Trading',
    description: 'Minimal device control with stable returns',
    profitIndex: 25,
    discomfortIndex: 0,
    estimatedRevenue: '€12.50/month',
    controlledDevices: ['Smart Water Heater', 'EV Charger'],
    scenario: 'Trade only excess solar energy during peak production hours (11AM-3PM). Water heater operates during off-peak hours, EV charges overnight when electricity is cheapest.',
    benefits: ['No lifestyle disruption', 'Guaranteed positive returns', 'Minimal device automation'],
    risks: ['Lower profit potential', 'Limited trading opportunities'],
    deviceControls: [{
      device: 'Smart Water Heater',
      control: 'Schedule heating during low-cost hours',
      impact: 'No hot water interruption'
    }, {
      device: 'EV Charger',
      control: 'Charge during 11PM-6AM',
      impact: 'Car ready by morning'
    }]
  }, {
    id: 2,
    name: 'Balanced Trading',
    description: 'Moderate device control for optimal profit-comfort balance',
    profitIndex: 50,
    discomfortIndex: 25,
    estimatedRevenue: '€28.75/month',
    controlledDevices: ['HVAC System', 'Smart Appliances', 'EV Charger', 'Water Heater'],
    scenario: 'Smart HVAC pre-cooling/heating during cheap hours, appliances run during optimal pricing windows. Participate in demand response programs during peak hours.',
    benefits: ['Balanced returns', 'Smart automation', 'Moderate lifestyle adaptation'],
    risks: ['Occasional temperature variations', 'Delayed appliance cycles'],
    deviceControls: [{
      device: 'HVAC System',
      control: 'Pre-cool/heat ±2°C during cheap hours',
      impact: 'Slight temperature variations'
    }, {
      device: 'Smart Appliances',
      control: 'Delay non-urgent cycles by 1-3 hours',
      impact: 'Flexible scheduling needed'
    }, {
      device: 'EV Charger',
      control: 'Smart charging based on grid prices',
      impact: 'Charging time optimization'
    }, {
      device: 'Water Heater',
      control: 'Temperature modulation ±5°C',
      impact: 'Minimal hot water impact'
    }]
  }, {
    id: 3,
    name: 'Aggressive Trading',
    description: 'Maximum device control for high returns',
    profitIndex: 75,
    discomfortIndex: 50,
    estimatedRevenue: '€45.20/month',
    controlledDevices: ['All Smart Devices', 'HVAC', 'Major Appliances', 'Lighting', 'EV'],
    scenario: 'Full participation in grid services including frequency regulation, demand response, and peak shaving. All devices optimized for maximum trading opportunities.',
    benefits: ['Maximum profit potential', 'Grid service participation', 'Advanced automation'],
    risks: ['Noticeable lifestyle changes', 'Device availability delays', 'Temperature fluctuations'],
    deviceControls: [{
      device: 'HVAC System',
      control: 'Wide temperature range ±4°C, demand response participation',
      impact: 'Noticeable temperature changes'
    }, {
      device: 'Major Appliances',
      control: 'Delay cycles up to 6 hours for optimal pricing',
      impact: 'Significant scheduling flexibility required'
    }, {
      device: 'Lighting System',
      control: 'Dimming during peak hours, smart scheduling',
      impact: 'Occasional lighting adjustments'
    }, {
      device: 'EV Charger',
      control: 'V2G capability, sell back to grid during peaks',
      impact: 'Car availability planning needed'
    }, {
      device: 'Water Heater',
      control: 'Wide temperature range, grid service participation',
      impact: 'Hot water temperature variations'
    }]
  }, {
    id: 4,
    name: 'Premium Trading',
    description: 'Maximum automation with AI-driven optimization',
    profitIndex: 100,
    discomfortIndex: 75,
    estimatedRevenue: '€67.80/month',
    controlledDevices: ['Full Home Automation', 'Battery Storage', 'Solar Panels', 'All IoT Devices'],
    scenario: 'AI-driven full home energy management with predictive analytics. Participate in all grid services, energy arbitrage, and peer-to-peer trading with maximum automation.',
    benefits: ['Maximum revenue potential', 'AI optimization', 'Full grid service participation', 'Predictive energy management'],
    risks: ['Significant lifestyle adaptation', 'High device dependency', 'Complex automation'],
    deviceControls: [{
      device: 'Battery Storage',
      control: 'AI-optimized charge/discharge cycles, grid arbitrage',
      impact: 'Backup power optimization'
    }, {
      device: 'Solar Panels',
      control: 'Dynamic export/storage decisions, weather prediction',
      impact: 'Maximized solar utilization'
    }, {
      device: 'Full Home Automation',
      control: 'AI-driven scheduling of all devices, predictive control',
      impact: 'Comprehensive lifestyle automation'
    }, {
      device: 'IoT Sensors',
      control: 'Occupancy-based optimization, behavioral learning',
      impact: 'Adaptive home environment'
    }, {
      device: 'Smart Grid Interface',
      control: 'Real-time grid service participation, frequency regulation',
      impact: 'Grid stability contribution'
    }]
  }]);

  // Operating Sites Data
  const [operatingSites, setOperatingSites] = useState([{
    id: 1,
    name: 'Helsinki NanoGrid Hub',
    location: 'Helsinki, Finland',
    status: 'operational',
    capacity: 2.5,
    currentOutput: 1.8,
    efficiency: 94.2,
    connectedHomes: 450,
    carbonSaved: 12.7,
    uptime: 99.8,
    lastUpdate: new Date(Date.now() - 5 * 60000)
  }, {
    id: 2,
    name: 'Madrid Smart District',
    location: 'Madrid, Spain',
    status: 'operational',
    capacity: 3.2,
    currentOutput: 2.4,
    efficiency: 91.8,
    connectedHomes: 580,
    carbonSaved: 18.3,
    uptime: 98.9,
    lastUpdate: new Date(Date.now() - 3 * 60000)
  }, {
    id: 3,
    name: 'Bucharest Green Zone',
    location: 'Bucharest, Romania',
    status: 'maintenance',
    capacity: 1.8,
    currentOutput: 0.9,
    efficiency: 87.5,
    connectedHomes: 320,
    carbonSaved: 8.9,
    uptime: 95.2,
    lastUpdate: new Date(Date.now() - 15 * 60000)
  }, {
    id: 4,
    name: 'Stockholm Energy Park',
    location: 'Stockholm, Sweden',
    status: 'operational',
    capacity: 4.1,
    currentOutput: 3.6,
    efficiency: 96.1,
    connectedHomes: 720,
    carbonSaved: 24.1,
    uptime: 99.5,
    lastUpdate: new Date(Date.now() - 2 * 60000)
  }]);

  // AI Predictions Data
  const [aiPredictions, setAiPredictions] = useState({
    carbonReduction: {
      daily: 64.0,
      weekly: 448.0,
      monthly: 1920.0,
      yearly: 23040.0,
      confidence: 94.7
    },
    energyEfficiency: {
      current: 92.6,
      predicted: 95.8,
      improvement: 3.2,
      optimizationPotential: 7.4,
      confidence: 91.3
    },
    costSavings: {
      daily: '€156.80',
      monthly: '€4,704.00',
      yearly: '€56,448.00',
      confidence: 89.2
    }
  });

  // LLM Model Status
  const [llmStatus, setLlmStatus] = useState([{
    id: 1,
    name: 'Energy Optimization GPT',
    model: 'GPT-4-Turbo',
    status: 'active',
    uptime: 99.7,
    requestsPerHour: 2847,
    avgResponseTime: 1.2,
    accuracy: 96.4,
    lastUpdate: new Date(Date.now() - 30000)
  }, {
    id: 2,
    name: 'Demand Forecasting Model',
    model: 'Claude-3-Sonnet',
    status: 'active',
    uptime: 98.9,
    requestsPerHour: 1523,
    avgResponseTime: 0.8,
    accuracy: 94.1,
    lastUpdate: new Date(Date.now() - 45000)
  }, {
    id: 3,
    name: 'Grid Stability Analyzer',
    model: 'Gemini-Pro',
    status: 'maintenance',
    uptime: 87.3,
    requestsPerHour: 0,
    avgResponseTime: 0,
    accuracy: 92.8,
    lastUpdate: new Date(Date.now() - 20 * 60000)
  }, {
    id: 4,
    name: 'Carbon Impact Calculator',
    model: 'Custom-Transformer',
    status: 'active',
    uptime: 99.2,
    requestsPerHour: 3156,
    avgResponseTime: 0.6,
    accuracy: 97.2,
    lastUpdate: new Date(Date.now() - 15000)
  }]);

  // Real Energy Supply Status Data - Inverter Management System
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInverter, setSelectedInverter] = useState(null);
  const [inverterDevices, setInverterDevices] = useState([
    {
      id: 'INV-001',
      name: 'Helsinki Solar Inverter A1',
      type: 'String Inverter',
      location: 'Helsinki, Finland',
      peakCapacity: 50.0, // kW
      currentPower: 42.3, // kW
      generation: 38.7, // kWh today
      panelTemp: 45.2, // °C
      fireDetectionThreshold: 85.0, // °C
      status: 'operational',
      lastAlert: 'Normal operation',
      updateInterval: 2, // seconds
      lastUpdate: new Date(Date.now() - 2000),
      efficiency: 94.2,
      gridPosition: { x: 2, y: 1 }
    },
    {
      id: 'INV-002',
      name: 'Helsinki Solar Inverter A2',
      type: 'String Inverter',
      location: 'Helsinki, Finland',
      peakCapacity: 50.0,
      currentPower: 38.9,
      generation: 35.2,
      panelTemp: 47.8,
      fireDetectionThreshold: 85.0,
      status: 'operational',
      lastAlert: 'Normal operation',
      updateInterval: 2,
      lastUpdate: new Date(Date.now() - 1500),
      efficiency: 91.8,
      gridPosition: { x: 3, y: 1 }
    },
    {
      id: 'INV-003',
      name: 'Madrid Solar Inverter B1',
      type: 'Central Inverter',
      location: 'Madrid, Spain',
      peakCapacity: 75.0,
      currentPower: 62.1,
      generation: 58.9,
      panelTemp: 52.3,
      fireDetectionThreshold: 85.0,
      status: 'operational',
      lastAlert: 'Normal operation',
      updateInterval: 2,
      lastUpdate: new Date(Date.now() - 1000),
      efficiency: 96.1,
      gridPosition: { x: 1, y: 2 }
    },
    {
      id: 'INV-004',
      name: 'Madrid Solar Inverter B2',
      type: 'Central Inverter',
      location: 'Madrid, Spain',
      peakCapacity: 75.0,
      currentPower: 71.2,
      generation: 67.4,
      panelTemp: 49.1,
      fireDetectionThreshold: 85.0,
      status: 'warning',
      lastAlert: 'High temperature detected',
      updateInterval: 2,
      lastUpdate: new Date(Date.now() - 500),
      efficiency: 89.3,
      gridPosition: { x: 2, y: 2 }
    },
    {
      id: 'INV-005',
      name: 'Bucharest Solar Inverter C1',
      type: 'Micro Inverter',
      location: 'Bucharest, Romania',
      peakCapacity: 25.0,
      currentPower: 18.7,
      generation: 16.8,
      panelTemp: 43.5,
      fireDetectionThreshold: 85.0,
      status: 'maintenance',
      lastAlert: 'Scheduled maintenance',
      updateInterval: 2,
      lastUpdate: new Date(Date.now() - 300000),
      efficiency: 87.5,
      gridPosition: { x: 3, y: 2 }
    },
    {
      id: 'INV-006',
      name: 'Stockholm Solar Inverter D1',
      type: 'String Inverter',
      location: 'Stockholm, Sweden',
      peakCapacity: 60.0,
      currentPower: 55.8,
      generation: 52.3,
      panelTemp: 41.2,
      fireDetectionThreshold: 85.0,
      status: 'operational',
      lastAlert: 'Normal operation',
      updateInterval: 2,
      lastUpdate: new Date(Date.now() - 800),
      efficiency: 98.1,
      gridPosition: { x: 1, y: 3 }
    }
  ]);

  // Time series data for charts
  const [timeSeriesData, setTimeSeriesData] = useState([
    { time: '00:00', power: 0, generation: 0, temperature: 25 },
    { time: '06:00', power: 15, generation: 12, temperature: 28 },
    { time: '09:00', power: 35, generation: 32, temperature: 35 },
    { time: '12:00', power: 48, generation: 45, temperature: 42 },
    { time: '15:00', power: 42, generation: 38, temperature: 48 },
    { time: '18:00', power: 25, generation: 22, temperature: 35 },
    { time: '21:00', power: 5, generation: 3, temperature: 28 },
    { time: '24:00', power: 0, generation: 0, temperature: 25 }
  ]);

  const filteredInverters = inverterDevices.filter(device => 
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [realEnergySupply, setRealEnergySupply] = useState({
    totalGeneration: 8.7, // MW
    totalConsumption: 6.2, // MW
    gridBalance: 2.5, // MW surplus
    supplyMix: {
      solar: 45.2, // %
      wind: 28.7, // %
      hydro: 15.3, // %
      grid: 10.8  // %
    },
    realTimeSuppliers: [
      {
        id: 1,
        name: 'Helsinki Solar Farm',
        type: 'Solar',
        capacity: 2.5,
        currentOutput: 1.8,
        efficiency: 94.2,
        status: 'optimal',
        lastUpdate: new Date(Date.now() - 2 * 60000)
      },
      {
        id: 2,
        name: 'Madrid Wind Park',
        type: 'Wind',
        capacity: 3.2,
        currentOutput: 2.4,
        efficiency: 91.8,
        status: 'optimal',
        lastUpdate: new Date(Date.now() - 1 * 60000)
      },
      {
        id: 3,
        name: 'Bucharest Hydro Station',
        type: 'Hydro',
        capacity: 1.8,
        currentOutput: 0.9,
        efficiency: 87.5,
        status: 'maintenance',
        lastUpdate: new Date(Date.now() - 10 * 60000)
      },
      {
        id: 4,
        name: 'Stockholm Battery Storage',
        type: 'Storage',
        capacity: 4.1,
        currentOutput: 3.6,
        efficiency: 96.1,
        status: 'discharging',
        lastUpdate: new Date(Date.now() - 30000)
      }
    ],
    gridStability: {
      frequency: 50.02, // Hz
      voltage: 230.5, // V
      powerFactor: 0.98,
      harmonics: 2.1, // %
      stability: 'excellent'
    },
    demandResponse: {
      activePrograms: 12,
      participatingHomes: 1847,
      currentReduction: 1.2, // MW
      potentialReduction: 3.8 // MW
    }
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergyData(prev => ({
        ...prev,
        solarGeneration: Math.max(0, prev.solarGeneration + (Math.random() - 0.5) * 0.5),
        consumption: Math.max(0.5, prev.consumption + (Math.random() - 0.5) * 0.3),
        batteryLevel: Math.max(0, Math.min(100, prev.batteryLevel + (Math.random() - 0.5) * 2)),
        gridExport: Math.max(0, prev.solarGeneration - prev.consumption),
        carbonOffset: prev.carbonOffset + 0.01
      }));

      // Simulate device status changes
      setCurrentDevices(prev => prev.map(device => {
        const shouldToggle = Math.random() < 0.05; // 5% chance to change status
        if (shouldToggle && device.name !== "Refrigerator") {
          // Refrigerator always stays on
          const newStatus = device.status === 'active' ? 'standby' : 'active';
          return {
            ...device,
            status: newStatus,
            power: newStatus === 'active' ? device.power || Math.floor(Math.random() * 500) + 50 : 0
          };
        }
        return device;
      }));

      // Simulate HVAC data changes
      setHvacData(prev => ({
        ...prev,
        temperature: Math.max(18, Math.min(26, prev.temperature + (Math.random() - 0.5) * 0.3)),
        humidity: Math.max(30, Math.min(70, prev.humidity + (Math.random() - 0.5) * 2)),
        airQuality: Math.max(60, Math.min(100, prev.airQuality + (Math.random() - 0.5) * 3)),
        co2Level: Math.max(350, Math.min(600, prev.co2Level + (Math.random() - 0.5) * 20)),
        pm25: Math.max(5, Math.min(25, prev.pm25 + (Math.random() - 0.5) * 2))
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  // Supply/Demand curve data for current and future predictions
  const currentSupplyDemandData = [{
    time: '00:00',
    supply: 0.2,
    demand: 2.1,
    price: 0.18
  }, {
    time: '02:00',
    supply: 0.1,
    demand: 1.8,
    price: 0.19
  }, {
    time: '04:00',
    supply: 0.0,
    demand: 1.5,
    price: 0.20
  }, {
    time: '06:00',
    supply: 0.5,
    demand: 2.8,
    price: 0.17
  }, {
    time: '08:00',
    supply: 1.2,
    demand: 3.5,
    price: 0.16
  }, {
    time: '10:00',
    supply: 2.8,
    demand: 3.2,
    price: 0.14
  }, {
    time: '12:00',
    supply: 4.2,
    demand: 3.1,
    price: 0.12
  }, {
    time: '14:00',
    supply: 4.8,
    demand: 4.2,
    price: 0.13
  }, {
    time: '16:00',
    supply: 3.9,
    demand: 4.8,
    price: 0.15
  }, {
    time: '18:00',
    supply: 2.1,
    demand: 5.2,
    price: 0.17
  }, {
    time: '20:00',
    supply: 0.8,
    demand: 4.1,
    price: 0.18
  }, {
    time: '22:00',
    supply: 0.3,
    demand: 3.2,
    price: 0.19
  }];
  const futureSupplyDemandData = [{
    time: '00:00',
    supply: 0.3,
    demand: 1.9,
    price: 0.17
  }, {
    time: '02:00',
    supply: 0.2,
    demand: 1.6,
    price: 0.18
  }, {
    time: '04:00',
    supply: 0.1,
    demand: 1.3,
    price: 0.19
  }, {
    time: '06:00',
    supply: 0.8,
    demand: 2.5,
    price: 0.16
  }, {
    time: '08:00',
    supply: 1.8,
    demand: 3.2,
    price: 0.15
  }, {
    time: '10:00',
    supply: 3.5,
    demand: 2.9,
    price: 0.12
  }, {
    time: '12:00',
    supply: 5.1,
    demand: 2.8,
    price: 0.10
  }, {
    time: '14:00',
    supply: 5.8,
    demand: 3.8,
    price: 0.11
  }, {
    time: '16:00',
    supply: 4.8,
    demand: 4.2,
    price: 0.13
  }, {
    time: '18:00',
    supply: 2.8,
    demand: 4.8,
    price: 0.15
  }, {
    time: '20:00',
    supply: 1.2,
    demand: 3.8,
    price: 0.16
  }, {
    time: '22:00',
    supply: 0.5,
    demand: 2.9,
    price: 0.17
  }];

  // IoT Device Usage Data
  const [currentDevices, setCurrentDevices] = useState<DeviceUsage[]>([{
    id: 1,
    name: "Smart TV",
    icon: Tv,
    power: 150,
    status: "active",
    room: "Living Room",
    duration: "2h 15m",
    efficiency: 85
  }, {
    id: 2,
    name: "Refrigerator",
    icon: Refrigerator,
    power: 180,
    status: "active",
    room: "Kitchen",
    duration: "24h",
    efficiency: 92
  }, {
    id: 3,
    name: "Washing Machine",
    icon: WashingMachine,
    power: 0,
    status: "standby",
    room: "Laundry",
    duration: "0m",
    efficiency: 88
  }, {
    id: 4,
    name: "Air Conditioning",
    icon: AirVent,
    power: 2200,
    status: "active",
    room: "Bedroom",
    duration: "1h 30m",
    efficiency: 78
  }, {
    id: 5,
    name: "Microwave",
    icon: Microwave,
    power: 0,
    status: "standby",
    room: "Kitchen",
    duration: "0m",
    efficiency: 90
  }, {
    id: 6,
    name: "Desktop PC",
    icon: Monitor,
    power: 320,
    status: "active",
    room: "Office",
    duration: "4h 45m",
    efficiency: 82
  }, {
    id: 7,
    name: "Laptop",
    icon: Laptop,
    power: 65,
    status: "active",
    room: "Living Room",
    duration: "3h 20m",
    efficiency: 95
  }, {
    id: 8,
    name: "Phone Charger",
    icon: Smartphone,
    power: 15,
    status: "active",
    room: "Bedroom",
    duration: "1h 10m",
    efficiency: 88
  }]);
  const initialPredictions = useMemo<AiPrediction[]>(() => [{
    time: "14:30",
    device: "Washing Machine",
    probability: 85,
    reason: "Historical pattern: Usually starts laundry after lunch",
    power: 800
  }, {
    time: "15:00",
    device: "Coffee Machine",
    probability: 72,
    reason: "Afternoon coffee routine detected",
    power: 1200
  }, {
    time: "17:30",
    device: "Oven",
    probability: 91,
    reason: "Dinner preparation time based on weekly pattern",
    power: 2500
  }, {
    time: "19:00",
    device: "Dishwasher",
    probability: 78,
    reason: "Post-dinner cleanup routine",
    power: 1800
  }, {
    time: "21:00",
    device: "Electric Vehicle",
    probability: 95,
    reason: "Daily charging schedule",
    power: 7200
  }], []);

  const {
    predictedDevices,
    aiPredictionLoading,
    aiPredictionError,
    lastPredictionUpdate,
    refreshPredictions
  } = useAiPredictions({
    devices: currentDevices,
    energyContext: {
      solarGeneration: energyData.solarGeneration,
      consumption: energyData.consumption,
      batteryLevel: energyData.batteryLevel
    },
    initialPredictions
  });
  const deviceUsageStats = {
    totalDevices: 12,
    activeDevices: 5,
    totalPower: 2930,
    averageEfficiency: 87,
    predictedNextHour: 3
  };
  // Show MW values scaled down by 100 (e.g., 2.5 MW -> 25 kW) for the site cards.
  const formatKw = (mw: number) => `${(mw * 10).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} kW`;
  const handleTradeAction = (tradeId: number, action: string) => {
    setP2pTrades(prev => prev.map(trade => trade.id === tradeId ? {
      ...trade,
      status: action === 'accept' ? 'active' : 'rejected'
    } : trade));
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <PlatformHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <EnergyOverview energy={{ ...energyData, carbonOffset: energyData.carbonOffset }} />

        {/* Main Platform Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabMenu />

          {/* Energy Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Operating Sites Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  NanoGrid Operating Sites
                </CardTitle>
                <CardDescription>
                  Real-time status of 4 operational energy sites across Europe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {operatingSites.map(site => {
                  const getStatusColor = () => {
                    switch (site.status) {
                      case 'operational':
                        return 'bg-green-100 text-green-800 border-green-200';
                      case 'maintenance':
                        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                      case 'offline':
                        return 'bg-red-100 text-red-800 border-red-200';
                      default:
                        return 'bg-gray-100 text-gray-800 border-gray-200';
                    }
                  };
                  const getStatusIcon = () => {
                    switch (site.status) {
                      case 'operational':
                        return <CheckCircle className="h-4 w-4 text-green-600" />;
                      case 'maintenance':
                        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
                      case 'offline':
                        return <XCircle className="h-4 w-4 text-red-600" />;
                      default:
                        return <Clock className="h-4 w-4 text-gray-600" />;
                    }
                  };
                  return <Card key={site.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{site.name}</CardTitle>
                            {getStatusIcon()}
                          </div>
                          <CardDescription className="text-sm">{site.location}</CardDescription>
                          <Badge className={`w-fit ${getStatusColor()}`}>
                            {site.status.toUpperCase()}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Capacity:</span>
                              <p className="font-medium text-blue-600">{formatKw(site.capacity)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Output:</span>
                              <p className="font-medium text-green-600">{formatKw(site.currentOutput)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Efficiency:</span>
                              <p className="font-medium text-purple-600">{site.efficiency.toFixed(1)}%</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Uptime:</span>
                              <p className="font-medium text-orange-600">{site.uptime.toFixed(1)}%</p>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500">Connected Homes:</span>
                              <span className="font-medium">{site.connectedHomes}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500">Carbon Saved:</span>
                              <span className="font-medium text-green-600">{site.carbonSaved.toFixed(1)} tons/day</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 pt-2">
                            Last update: {site.lastUpdate.toLocaleTimeString()}
                          </div>
                        </CardContent>
                      </Card>;
                })}
                </div>
              </CardContent>
            </Card>
            
            {/* AI Predictions */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Carbon Reduction Predictions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="h-5 w-5" />
                    AI Carbon Reduction Predictions
                  </CardTitle>
                  <CardDescription>
                    Machine learning forecasts for environmental impact
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{aiPredictions.carbonReduction.daily.toFixed(1)}</div>
                      <div className="text-sm text-green-700 font-medium">tons CO2/day</div>
                      <div className="text-xs text-green-600">Daily Reduction</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{aiPredictions.carbonReduction.weekly.toFixed(0)}</div>
                      <div className="text-sm text-blue-700 font-medium">tons CO2/week</div>
                      <div className="text-xs text-blue-600">Weekly Reduction</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{(aiPredictions.carbonReduction.monthly / 1000).toFixed(1)}K</div>
                      <div className="text-sm text-purple-700 font-medium">tons CO2/month</div>
                      <div className="text-xs text-purple-600">Monthly Reduction</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{(aiPredictions.carbonReduction.yearly / 1000).toFixed(1)}K</div>
                      <div className="text-sm text-orange-700 font-medium">tons CO2/year</div>
                      <div className="text-xs text-orange-600">Yearly Reduction</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Brain className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">AI Confidence: </span>
                    <span className="font-medium text-green-600">{aiPredictions.carbonReduction.confidence.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Energy Efficiency Predictions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    AI Energy Efficiency Analysis
                  </CardTitle>
                  <CardDescription>
                    Predictive analytics for system optimization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <div className="text-sm text-blue-600 font-medium">Current Efficiency</div>
                        <div className="text-2xl font-bold text-blue-700">{aiPredictions.energyEfficiency.current.toFixed(1)}%</div>
                      </div>
                      <Activity className="h-8 w-8 text-blue-500" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <div className="text-sm text-green-600 font-medium">Predicted Efficiency</div>
                        <div className="text-2xl font-bold text-green-700">{aiPredictions.energyEfficiency.predicted.toFixed(1)}%</div>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">+{aiPredictions.energyEfficiency.improvement.toFixed(1)}%</div>
                        <div className="text-xs text-purple-700">Improvement</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">{aiPredictions.energyEfficiency.optimizationPotential.toFixed(1)}%</div>
                        <div className="text-xs text-orange-700">Potential</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Brain className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-700">AI Confidence: </span>
                    <span className="font-medium text-blue-600">{aiPredictions.energyEfficiency.confidence.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* LLM Model Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  LLM Model Operations Status
                </CardTitle>
                <CardDescription>
                  Real-time monitoring of AI language models powering the energy system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {llmStatus.map(model => {
                  const getStatusColor = () => {
                    switch (model.status) {
                      case 'active':
                        return 'bg-green-100 text-green-800 border-green-200';
                      case 'maintenance':
                        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                      case 'offline':
                        return 'bg-red-100 text-red-800 border-red-200';
                      default:
                        return 'bg-gray-100 text-gray-800 border-gray-200';
                    }
                  };
                  const getStatusIcon = () => {
                    switch (model.status) {
                      case 'active':
                        return <CheckCircle className="h-4 w-4 text-green-600" />;
                      case 'maintenance':
                        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
                      case 'offline':
                        return <XCircle className="h-4 w-4 text-red-600" />;
                      default:
                        return <Clock className="h-4 w-4 text-gray-600" />;
                    }
                  };
                  return <Card key={model.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{model.name}</CardTitle>
                            {getStatusIcon()}
                          </div>
                          <CardDescription className="text-xs">{model.model}</CardDescription>
                          <Badge className={`w-fit text-xs ${getStatusColor()}`}>
                            {model.status.toUpperCase()}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Uptime:</span>
                              <span className="font-medium text-green-600">{model.uptime.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Requests/hr:</span>
                              <span className="font-medium text-blue-600">{model.requestsPerHour.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Avg Response:</span>
                              <span className="font-medium text-purple-600">{model.avgResponseTime.toFixed(1)}s</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Accuracy:</span>
                              <span className="font-medium text-orange-600">{model.accuracy.toFixed(1)}%</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 pt-2 border-t">
                            Updated: {model.lastUpdate.toLocaleTimeString()}
                          </div>
                        </CardContent>
                      </Card>;
                })}
                </div>
                
                {/* LLM Performance Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-3">Overall LLM Performance</h4>
                  <div className="grid md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{llmStatus.filter(m => m.status === 'active').length}/{llmStatus.length}</div>
                      <div className="text-sm text-blue-700">Active Models</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{(llmStatus.reduce((acc, m) => acc + m.uptime, 0) / llmStatus.length).toFixed(1)}%</div>
                      <div className="text-sm text-green-700">Avg Uptime</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{llmStatus.reduce((acc, m) => acc + m.requestsPerHour, 0).toLocaleString()}</div>
                      <div className="text-sm text-purple-700">Total Requests/hr</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{(llmStatus.reduce((acc, m) => acc + m.accuracy, 0) / llmStatus.length).toFixed(1)}%</div>
                      <div className="text-sm text-orange-700">Avg Accuracy</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Cost Savings Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  AI-Predicted Cost Savings
                </CardTitle>
                <CardDescription>
                  Financial impact analysis powered by machine learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{aiPredictions.costSavings.daily}</div>
                    <div className="text-sm text-green-700 font-medium">Daily Savings</div>
                    <div className="text-xs text-green-600 mt-1">Across all sites</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{aiPredictions.costSavings.monthly}</div>
                    <div className="text-sm text-blue-700 font-medium">Monthly Savings</div>
                    <div className="text-xs text-blue-600 mt-1">Projected earnings</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{aiPredictions.costSavings.yearly}</div>
                    <div className="text-sm text-purple-700 font-medium">Yearly Savings</div>
                    <div className="text-xs text-purple-600 mt-1">Annual projection</div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Brain className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">AI Confidence: </span>
                  <span className="font-medium text-green-600">{aiPredictions.costSavings.confidence.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Module A: Hardware */}
          <TabsContent value="hardware" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Real-Time Energy Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Sun className="h-6 w-6 text-yellow-600" />
                        <span className="font-medium">Solar Generation</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-600">
                        {energyData.solarGeneration.toFixed(1)} kW
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <ArrowUpDown className="h-6 w-6 text-gray-400" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Home className="h-6 w-6 text-blue-600" />
                        <span className="font-medium">Home Consumption</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">
                        {energyData.consumption.toFixed(1)} kW
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                        <span className="font-medium">Grid Export</span>
                      </div>
                      <span className="text-xl font-bold text-green-600">
                        {energyData.gridExport.toFixed(1)} kW
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Energy Efficiency</span>
                      <span className="text-sm text-gray-600">{behaviorAnalytics.efficiencyScore}%</span>
                    </div>
                    <Progress value={behaviorAnalytics.efficiencyScore} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Battery Health</span>
                      <span className="text-sm text-gray-600">94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">System Optimization</span>
                      <span className="text-sm text-gray-600">91%</span>
                    </div>
                    <Progress value={91} className="h-2" />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">€127.50</p>
                        <p className="text-xs text-gray-600">Monthly Savings</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">15.2 kg</p>
                        <p className="text-xs text-gray-600">CO2 Reduced Today</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Module A: Hardware */}
          <TabsContent value="hardware" className="space-y-6">
            <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Energy Supply Status</CardTitle>
                <CardDescription>
                  Real-time monitoring of N-type IBC/TOPCon cells with MLPE and micro-climate sensors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {hardwareModules.map(module => <Card key={module.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{module.name}</CardTitle>
                          <Badge variant={module.status === 'optimal' ? 'default' : 'secondary'} className={module.status === 'optimal' ? 'bg-green-500' : ''}>
                            {module.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {module.efficiency && <div className="flex justify-between">
                            <span className="text-sm">Efficiency</span>
                            <span className="text-sm font-medium">{module.efficiency}%</span>
                          </div>}
                        {module.temperature && <div className="flex justify-between">
                            <span className="text-sm">Temperature</span>
                            <span className="text-sm font-medium">{module.temperature}°C</span>
                          </div>}
                        {module.capacity && <div className="flex justify-between">
                            <span className="text-sm">Capacity</span>
                            <span className="text-sm font-medium">{module.capacity} kWh</span>
                          </div>}
                        {module.charge && <div className="flex justify-between">
                            <span className="text-sm">Charge Level</span>
                            <span className="text-sm font-medium">{module.charge}%</span>
                          </div>}
                        {module.power && <div className="flex justify-between">
                            <span className="text-sm">Power Rating</span>
                            <span className="text-sm font-medium">{module.power}W</span>
                          </div>}
                        {module.load && <div className="flex justify-between">
                            <span className="text-sm">Current Load</span>
                            <span className="text-sm font-medium">{module.load}W</span>
                          </div>}
                      </CardContent>
                    </Card>)}
                </div>
              </CardContent>
            </Card>
            
            {/* IoT Device Usage Overview */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Active Devices</p>
                      <p className="text-3xl font-bold text-blue-700">{deviceUsageStats.activeDevices}/{deviceUsageStats.totalDevices}</p>
                    </div>
                    <Eye className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Total Power Usage</p>
                      <p className="text-3xl font-bold text-green-700">{deviceUsageStats.totalPower}W</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Avg Efficiency</p>
                      <p className="text-3xl font-bold text-purple-700">{deviceUsageStats.averageEfficiency}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Device Status & Predictions */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Current Device Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">Demand Status : Current Device</CardTitle>
                  <CardDescription>
                    Real-time IoT monitoring of all connected devices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {currentDevices.map(device => {
                    const IconComponent = device.icon;
                    return <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${device.status === 'active' ? 'bg-green-100' : 'bg-gray-200'}`}>
                              <IconComponent className={`h-5 w-5 ${device.status === 'active' ? 'text-green-600' : 'text-gray-500'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{device.name}</p>
                              <p className="text-xs text-gray-600">{device.room}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <Badge variant={device.status === 'active' ? 'default' : 'secondary'} className={device.status === 'active' ? 'bg-green-500' : ''}>
                                {device.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {device.power}W • {device.duration}
                            </p>
                            <p className="text-xs text-blue-600">
                              Efficiency: {device.efficiency}%
                            </p>
                          </div>
                        </div>;
                  })}
                  </div>
                </CardContent>
              </Card>
              
              {/* AI Predictions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">AI Demand Predictions</CardTitle>
                      <CardDescription>
                        Enhanced with agent.gngmeta.com/sa AI Agent
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={refreshPredictions} disabled={aiPredictionLoading} className="bg-blue-600 hover:bg-blue-700">
                        {aiPredictionLoading ? <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Analyzing...
                          </div> : 'Refresh AI'}
                      </Button>
                    </div>
                  </div>
                  {lastPredictionUpdate && <p className="text-xs text-gray-500 mt-2">
                      Last updated: {lastPredictionUpdate.toLocaleTimeString()}
                    </p>}
                  {aiPredictionError && <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        AI Service temporarily unavailable. Showing cached predictions.
                      </AlertDescription>
                    </Alert>}
                </CardHeader>
                <CardContent>
                  {aiPredictionLoading ? <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">AI Agent analyzing device patterns...</p>
                        <p className="text-xs text-gray-500 mt-1">Connecting to agent.gngmeta.com/sa</p>
                      </div>
                    </div> : <div className="space-y-4">
                      {predictedDevices.map((prediction, index) => <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-l-blue-500 relative">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-800">{prediction.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-500">
                                {prediction.probability}% confidence
                              </Badge>
                              {prediction.optimization_tip && <Badge variant="outline" className="text-xs">
                                  AI Enhanced
                                </Badge>}
                            </div>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{prediction.device}</h4>
                          <p className="text-sm text-gray-600 mb-2">{prediction.reason}</p>
                          
                          {prediction.optimization_tip && <div className="mt-2 p-2 bg-green-50 rounded border-l-2 border-green-400">
                              <p className="text-xs text-green-700">
                                <Lightbulb className="h-3 w-3 inline mr-1" />
                                AI Tip: {prediction.optimization_tip}
                              </p>
                            </div>}
                          
                          <div className="flex items-center justify-between text-xs mt-2">
                            <span className="text-orange-600 font-medium">Expected: {prediction.power}W</span>
                            <span className="text-green-600">Auto-optimize: ON</span>
                          </div>
                        </div>)}
                    </div>}
                  
                  {!aiPredictionLoading && <div className="mt-6 space-y-3">
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">AI Agent Status</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-purple-600">API Endpoint:</span>
                            <p className="font-mono text-purple-800">agent.gngmeta.com/sa</p>
                          </div>
                          <div>
                            <span className="text-purple-600">Model Status:</span>
                            <p className="text-purple-800">{aiPredictionError ? 'Fallback Mode' : 'Active & Learning'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Smart Recommendations</span>
                        </div>
                        <p className="text-sm text-green-700">
                          {aiPredictionError ? "Using cached behavioral patterns. AI predictions will resume when service is available." : "AI Agent continuously learns from your usage patterns to provide personalized energy optimization suggestions."}
                        </p>
                      </div>
                    </div>}
                </CardContent>
              </Card>
            </div>
            
            {/* Real Energy Supply Status - Inverter Management System */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Real Energy Supply Status - Inverter Management
                </CardTitle>
                <CardDescription>
                  Search, monitor, and manage solar inverters with real-time performance data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Inverter Search and Management */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Device Search */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Inverter Device Search
                      </CardTitle>
                      <CardDescription>Search and manage solar inverters</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="relative">
                          <Input
                            placeholder="Search by ID, name, or type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                          <Settings className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                        </div>
                        
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {filteredInverters.map((device) => {
                            const getStatusColor = () => {
                              switch (device.status) {
                                case 'operational': return 'bg-green-100 text-green-800';
                                case 'warning': return 'bg-yellow-100 text-yellow-800';
                                case 'maintenance': return 'bg-blue-100 text-blue-800';
                                case 'error': return 'bg-red-100 text-red-800';
                                default: return 'bg-gray-100 text-gray-800';
                              }
                            };
                            
                            return (
                              <div 
                                key={device.id} 
                                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                  selectedInverter?.id === device.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                }`}
                                onClick={() => setSelectedInverter(device)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-medium text-sm">{device.id}</div>
                                  <Badge className={`text-xs ${getStatusColor()}`}>
                                    {device.status.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-600">
                                  <div>{device.name}</div>
                                  <div className="mt-1">{device.type} - {device.location}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Selected Device Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Device Details
                      </CardTitle>
                      <CardDescription>
                        {selectedInverter ? selectedInverter.name : 'Select a device to view details'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedInverter ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="text-blue-600 font-medium">Update Interval</div>
                              <div className="text-lg font-bold text-blue-700">{selectedInverter.updateInterval}s</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="text-green-600 font-medium">Peak Capacity</div>
                              <div className="text-lg font-bold text-green-700">{selectedInverter.peakCapacity.toFixed(1)} kW</div>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg">
                              <div className="text-orange-600 font-medium">Fire Detection</div>
                              <div className="text-lg font-bold text-orange-700">{selectedInverter.fireDetectionThreshold.toFixed(1)}°C</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <div className="text-purple-600 font-medium">Current Status</div>
                              <div className="text-lg font-bold text-purple-700">{selectedInverter.status.toUpperCase()}</div>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-gray-600 font-medium mb-1">Recent Alert</div>
                            <div className="text-sm text-gray-800">{selectedInverter.lastAlert}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Last update: {selectedInverter.lastUpdate.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Select an inverter device to view detailed information</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Real-time Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Real-time Metrics
                      </CardTitle>
                      <CardDescription>
                        {selectedInverter ? 'Live performance data' : 'Select device for metrics'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedInverter ? (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">Real-time Power</span>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-700">{selectedInverter.currentPower.toFixed(1)} kW</div>
                                <div className="text-xs text-green-600">{((selectedInverter.currentPower / selectedInverter.peakCapacity) * 100).toFixed(1)}% of peak</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Sun className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">Generation Today</span>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-blue-700">{selectedInverter.generation.toFixed(1)} kWh</div>
                                <div className="text-xs text-blue-600">Daily total</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Thermometer className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium">Panel Temperature</span>
                              </div>
                              <div className="text-right">
                                <div className={`text-lg font-bold ${
                                  selectedInverter.panelTemp > 60 ? 'text-red-700' : 
                                  selectedInverter.panelTemp > 45 ? 'text-yellow-700' : 'text-green-700'
                                }`}>{selectedInverter.panelTemp.toFixed(1)}°C</div>
                                <div className="text-xs text-red-600">Threshold: {selectedInverter.fireDetectionThreshold.toFixed(1)}°C</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Select an inverter to view real-time metrics</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Time Series Charts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Time Series Performance Charts
                    </CardTitle>
                    <CardDescription>
                      24-hour power generation, output, and temperature trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis yAxisId="left" label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }} />
                          <YAxis yAxisId="right" orientation="right" label={{ value: 'Temperature (°C)', angle: 90, position: 'insideRight' }} />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'temperature' ? `${value}°C` : `${value} kW`,
                              name === 'power' ? 'Real-time Power' : 
                              name === 'generation' ? 'Generation' : 'Panel Temperature'
                            ]}
                          />
                          <Legend />
                          <Line 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="power" 
                            stroke="#10b981" 
                            strokeWidth={3} 
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} 
                            name="Real-time Power (kW)"
                          />
                          <Line 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="generation" 
                            stroke="#3b82f6" 
                            strokeWidth={2} 
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }} 
                            name="Generation (kWh)"
                          />
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="temperature" 
                            stroke="#ef4444" 
                            strokeWidth={2} 
                            strokeDasharray="5 5" 
                            dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }} 
                            name="Panel Temperature (°C)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Panel Grid Map */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      Solar Panel Grid Map
                    </CardTitle>
                    <CardDescription>
                      Visual representation of inverter locations and status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative bg-gray-50 rounded-lg p-6 h-80">
                      {/* Grid Background */}
                      <svg className="w-full h-full absolute inset-0">
                        {/* Grid lines */}
                        <defs>
                          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                      
                      {/* Inverter Nodes */}
                      {inverterDevices.map((device) => {
                        const getStatusColor = () => {
                          switch (device.status) {
                            case 'operational': return '#10b981';
                            case 'warning': return '#f59e0b';
                            case 'maintenance': return '#3b82f6';
                            case 'error': return '#ef4444';
                            default: return '#6b7280';
                          }
                        };
                        
                        const x = (device.gridPosition.x * 25) + '%';
                        const y = (device.gridPosition.y * 25) + '%';
                        
                        return (
                          <div
                            key={device.id}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-110 ${
                              selectedInverter?.id === device.id ? 'scale-125 z-10' : ''
                            }`}
                            style={{ left: x, top: y }}
                            onClick={() => setSelectedInverter(device)}
                          >
                            {/* Device Node */}
                            <div 
                              className="w-12 h-12 rounded-lg border-2 flex items-center justify-center shadow-lg"
                              style={{ 
                                backgroundColor: getStatusColor() + '20',
                                borderColor: getStatusColor()
                              }}
                            >
                              <Zap className="h-6 w-6" style={{ color: getStatusColor() }} />
                            </div>
                            
                            {/* Device Info Tooltip */}
                            <div className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg p-2 shadow-lg min-w-32 text-center">
                              <div className="text-xs font-medium">{device.id}</div>
                              <div className="text-xs text-gray-600">{device.currentPower.toFixed(1)} kW</div>
                              <div className="text-xs" style={{ color: getStatusColor() }}>
                                {device.panelTemp.toFixed(1)}°C
                              </div>
                            </div>
                            
                            {/* Connection Lines */}
                            {device.gridPosition.x > 1 && (
                              <div 
                                className="absolute top-1/2 right-12 w-16 h-0.5 bg-gray-300"
                                style={{ transform: 'translateY(-50%)' }}
                              ></div>
                            )}
                            {device.gridPosition.y > 1 && (
                              <div 
                                className="absolute left-1/2 bottom-12 w-0.5 h-16 bg-gray-300"
                                style={{ transform: 'translateX(-50%)' }}
                              ></div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Legend */}
                      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg border shadow-sm">
                        <div className="text-xs font-medium mb-2">Status Legend</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Operational</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                            <span>Warning</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span>Maintenance</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span>Error</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                  
                  {/* Grid Stability */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Grid Stability Metrics</CardTitle>
                      <CardDescription>Real-time power quality indicators</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-lg font-bold text-green-600">{realEnergySupply.gridStability.frequency.toFixed(2)} Hz</div>
                            <div className="text-xs text-green-700">Frequency</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-lg font-bold text-blue-600">{realEnergySupply.gridStability.voltage.toFixed(1)} V</div>
                            <div className="text-xs text-blue-700">Voltage</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-lg font-bold text-purple-600">{realEnergySupply.gridStability.powerFactor.toFixed(2)}</div>
                            <div className="text-xs text-purple-700">Power Factor</div>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <div className="text-lg font-bold text-orange-600">{realEnergySupply.gridStability.harmonics.toFixed(1)}%</div>
                            <div className="text-xs text-orange-700">Harmonics</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Grid Stability: {realEnergySupply.gridStability.stability.toUpperCase()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                
                {/* Real-time Suppliers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Real-time Energy Suppliers</CardTitle>
                    <CardDescription>Live status of generation sources</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {realEnergySupply.realTimeSuppliers.map((supplier) => {
                        const getStatusColor = () => {
                          switch (supplier.status) {
                            case 'optimal': return 'bg-green-100 text-green-800 border-green-200';
                            case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                            case 'discharging': return 'bg-blue-100 text-blue-800 border-blue-200';
                            case 'offline': return 'bg-red-100 text-red-800 border-red-200';
                            default: return 'bg-gray-100 text-gray-800 border-gray-200';
                          }
                        };
                        
                        const getTypeIcon = () => {
                          switch (supplier.type) {
                            case 'Solar': return <Sun className="h-4 w-4 text-yellow-600" />;
                            case 'Wind': return <Wind className="h-4 w-4 text-blue-600" />;
                            case 'Hydro': return <Droplets className="h-4 w-4 text-cyan-600" />;
                            case 'Storage': return <Battery className="h-4 w-4 text-purple-600" />;
                            default: return <Zap className="h-4 w-4 text-gray-600" />;
                          }
                        };
                        
                        return (
                          <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">{supplier.name}</CardTitle>
                                {getTypeIcon()}
                              </div>
                              <Badge className={`w-fit text-xs ${getStatusColor()}`}>
                                {supplier.status.toUpperCase()}
                              </Badge>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Capacity:</span>
                                  <span className="font-medium">{formatKw(supplier.capacity)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Output:</span>
                                  <span className="font-medium text-green-600">{formatKw(supplier.currentOutput)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Efficiency:</span>
                                  <span className="font-medium text-blue-600">{supplier.efficiency.toFixed(1)}%</span>
                                </div>
                              </div>
                              
                              <div className="pt-2 border-t">
                                <div className="text-xs text-gray-500">
                                  Updated: {supplier.lastUpdate.toLocaleTimeString()}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Demand Response */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Demand Response Programs</CardTitle>
                    <CardDescription>Active load management and participation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{realEnergySupply.demandResponse.activePrograms}</div>
                        <div className="text-sm text-blue-700 font-medium">Active Programs</div>
                        <div className="text-xs text-blue-600 mt-1">Running now</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{realEnergySupply.demandResponse.participatingHomes.toLocaleString()}</div>
                        <div className="text-sm text-green-700 font-medium">Participating Homes</div>
                        <div className="text-xs text-green-600 mt-1">Enrolled users</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{formatKw(realEnergySupply.demandResponse.currentReduction)}</div>
                        <div className="text-sm text-purple-700 font-medium">Current Reduction</div>
                        <div className="text-xs text-purple-600 mt-1">Load shed now</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{formatKw(realEnergySupply.demandResponse.potentialReduction)}</div>
                        <div className="text-sm text-orange-700 font-medium">Potential Reduction</div>
                        <div className="text-xs text-orange-600 mt-1">Max capacity</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
          </TabsContent>

          {/* Module B: Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Behavior Analysis Summary */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Behavioral Pattern Analysis
                  </CardTitle>
                  <CardDescription>
                    GNN-powered user behavior patterns and energy optimization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Peak Usage</p>
                      <p className="text-lg font-bold">{behaviorAnalytics.peakUsageHours}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Daily Average</p>
                      <p className="text-lg font-bold">{behaviorAnalytics.averageDailyConsumption}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">Carbon Footprint</p>
                      <p className="text-lg font-bold">{behaviorAnalytics.carbonFootprint}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-600 font-medium">Predicted Savings</p>
                      <p className="text-lg font-bold">{behaviorAnalytics.predictedSavings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Supply/Demand Curve Analysis */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Current Supply/Demand Matching
                  </CardTitle>
                  <CardDescription>
                    Real-time GNN algorithm analysis of energy supply and demand curves
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={currentSupplyDemandData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis label={{
                        value: 'Energy (kW)',
                        angle: -90,
                        position: 'insideLeft'
                      }} />
                        <Tooltip formatter={(value, name) => [`${value} kW`, name === 'supply' ? 'Supply' : name === 'demand' ? 'Demand' : 'Price (€/kWh)']} />
                        <Legend />
                        <Area type="monotone" dataKey="supply" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Supply" />
                        <Area type="monotone" dataKey="demand" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Demand" />
                        <Line type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={2} dot={{
                        fill: '#f59e0b',
                        strokeWidth: 2,
                        r: 4
                      }} name="Price" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="p-2 bg-green-50 rounded">
                      <p className="text-sm text-green-600 font-medium">Current Surplus</p>
                      <p className="text-lg font-bold text-green-700">1.1 kW</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-sm text-blue-600 font-medium">Peak Demand</p>
                      <p className="text-lg font-bold text-blue-700">5.2 kW</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded">
                      <p className="text-sm text-orange-600 font-medium">Avg Price</p>
                      <p className="text-lg font-bold text-orange-700">€0.15</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    AI-Predicted Future Matching
                  </CardTitle>
                  <CardDescription>
                    24-hour ahead prediction using advanced machine learning algorithms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={futureSupplyDemandData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis label={{
                        value: 'Energy (kW)',
                        angle: -90,
                        position: 'insideLeft'
                      }} />
                        <Tooltip formatter={(value, name) => [`${value} kW`, name === 'supply' ? 'Predicted Supply' : name === 'demand' ? 'Predicted Demand' : 'Predicted Price (€/kWh)']} />
                        <Legend />
                        <Area type="monotone" dataKey="supply" stackId="1" stroke="#059669" fill="#059669" fillOpacity={0.4} strokeDasharray="5 5" name="Predicted Supply" />
                        <Area type="monotone" dataKey="demand" stackId="2" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} strokeDasharray="5 5" name="Predicted Demand" />
                        <Line type="monotone" dataKey="price" stroke="#dc2626" strokeWidth={2} strokeDasharray="3 3" dot={{
                        fill: '#dc2626',
                        strokeWidth: 2,
                        r: 4
                      }} name="Predicted Price" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                      <p className="text-sm text-green-600 font-medium">Predicted Surplus</p>
                      <p className="text-lg font-bold text-green-700">2.3 kW</p>
                      <p className="text-xs text-green-600">+109% vs current</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                      <p className="text-sm text-blue-600 font-medium">Peak Demand</p>
                      <p className="text-lg font-bold text-blue-700">4.8 kW</p>
                      <p className="text-xs text-blue-600">-8% vs current</p>
                    </div>
                    <div className="p-2 bg-red-50 rounded border-l-4 border-red-500">
                      <p className="text-sm text-red-600 font-medium">Avg Price</p>
                      <p className="text-lg font-bold text-red-700">€0.14</p>
                      <p className="text-xs text-red-600">-7% vs current</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* AI Anomaly Detection Modules */}
            <div className="grid lg:grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Anomaly Detection Modules
                  </CardTitle>
                  <CardDescription>
                    Test and compare different AI models for anomaly detection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiModules.map(module => {
                    const getStatusColor = () => {
                      switch (module.status) {
                        case 'active':
                          return 'border-green-500 bg-green-50';
                        case 'testing':
                          return 'border-blue-500 bg-blue-50';
                        case 'standby':
                          return 'border-yellow-500 bg-yellow-50';
                        default:
                          return 'border-gray-300 bg-gray-50';
                      }
                    };
                    const getStatusIcon = () => {
                      switch (module.status) {
                        case 'active':
                          return <CheckCircle className="h-4 w-4 text-green-600" />;
                        case 'testing':
                          return <Activity className="h-4 w-4 text-blue-600" />;
                        case 'standby':
                          return <Clock className="h-4 w-4 text-yellow-600" />;
                        default:
                          return <XCircle className="h-4 w-4 text-gray-600" />;
                      }
                    };
                    return <Card key={module.id} className={`border-2 transition-all hover:shadow-md ${getStatusColor()}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getStatusIcon()}
                                <CardTitle className="text-lg">{module.name}</CardTitle>
                              </div>
                              <Switch checked={module.status === 'active'} onCheckedChange={() => handleModuleToggle(module.id)} />
                            </div>
                            <Badge variant={module.status === 'active' ? 'default' : 'secondary'} className={module.status === 'active' ? 'bg-green-500' : ''}>
                              {module.status.toUpperCase()}
                            </Badge>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-gray-600">{module.description}</p>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">Accuracy:</span>
                                <p className="font-medium text-green-600">{module.accuracy.toFixed(1)}%</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Latency:</span>
                                <p className="font-medium text-blue-600">{module.latency.toFixed(1)}ms</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Confidence:</span>
                                <p className="font-medium text-purple-600">{module.confidence.toFixed(1)}%</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Anomalies:</span>
                                <p className="font-medium text-orange-600">{module.anomaliesDetected}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Key Features:</p>
                              <div className="flex flex-wrap gap-1">
                                {module.features.map((feature, index) => <Badge key={index} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>)}
                              </div>
                            </div>
                            
                            <div className="pt-2 border-t">
                              <p className="text-xs text-gray-500">
                                Last trained: {module.lastTrained.toLocaleString()}
                              </p>
                            </div>
                            
                            <Button size="sm" className="w-full" variant={module.status === 'active' ? 'default' : 'outline'} onClick={() => setSelectedAiModule(module.type)}>
                              {module.status === 'active' ? 'View Details' : 'Activate & Test'}
                            </Button>
                          </CardContent>
                        </Card>;
                  })}
                  </div>
                  
                  {/* Active Module Performance */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-3">Active Module Performance</h4>
                    <div className="grid md:grid-cols-4 gap-4">
                      {aiModules.filter(m => m.status === 'active').map(module => <div key={module.id} className="text-center">
                          <div className="text-lg font-bold text-blue-600">{module.name.split(' ')[0]}</div>
                          <div className="text-sm text-blue-700">{module.accuracy.toFixed(1)}% accuracy</div>
                        </div>)}
                    </div>
                  </div>
                  
                  {/* Recent Anomaly Alerts */}
                  <div className="mt-4 space-y-3">
                    <h4 className="font-medium text-gray-800">Recent Anomaly Alerts</h4>
                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>
                        {selectedAiModule} model detected unusual energy pattern in kitchen appliances. Potential faulty refrigerator compressor identified.
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>
                        Behavioral analysis suggests shifting laundry schedule to 2 PM could save €8.50/week.
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <Leaf className="h-4 w-4" />
                      <AlertDescription>
                        Carbon credit tokenization active: 2.3 kg CO2 offset tokens generated today.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Algorithm Performance Metrics */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  GNN Algorithm Performance Metrics
                </CardTitle>
                <CardDescription>
                  Real-time performance indicators of the Graph Neural Network supply/demand matching algorithm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">97.3%</div>
                    <div className="text-sm text-blue-700 font-medium">Prediction Accuracy</div>
                    <div className="text-xs text-blue-600 mt-1">Last 24h average</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">23ms</div>
                    <div className="text-sm text-green-700 font-medium">Processing Latency</div>
                    <div className="text-xs text-green-600 mt-1">Real-time optimization</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">€127.40</div>
                    <div className="text-sm text-purple-700 font-medium">Cost Optimization</div>
                    <div className="text-xs text-purple-600 mt-1">Monthly savings</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">15.2kg</div>
                    <div className="text-sm text-orange-700 font-medium">CO2 Reduction</div>
                    <div className="text-xs text-orange-600 mt-1">Today's impact</div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">Algorithm Status & Insights</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">GNN Model: Active & Learning</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Kafka Pipeline: 1,247 events/sec</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm">Privacy Filter: NER Active</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm">Next optimization cycle: 2 min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Model confidence: 94.7%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Data quality score: 98.1%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Module C: HVAC & Indoor Quality */}
          <TabsContent value="hvac" className="space-y-6">
            {/* HVAC Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="bg-gradient-to-r from-red-50 to-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-600 text-sm font-medium">Temperature</p>
                      <p className="text-3xl font-bold text-red-700">{hvacData.temperature.toFixed(1)}°C</p>
                    </div>
                    <Thermometer className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Humidity</p>
                      <p className="text-3xl font-bold text-blue-700">{hvacData.humidity.toFixed(1)}%</p>
                    </div>
                    <Droplets className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Air Quality</p>
                      <p className="text-3xl font-bold text-green-700">{hvacData.airQuality.toFixed(1)}</p>
                    </div>
                    <Wind className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">CO2 Level</p>
                      <p className="text-3xl font-bold text-purple-700">{hvacData.co2Level.toFixed(1)} ppm</p>
                    </div>
                    <Gauge className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* HVAC System Diagram and Zone Control */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AirVent className="h-5 w-5" />
                    HVAC System Diagram
                  </CardTitle>
                  <CardDescription>
                    Real-time system status and airflow visualization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-gray-50 rounded-lg p-6 h-80">
                    {/* Central HVAC Unit */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white p-3 rounded-lg text-center">
                      <AirVent className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-xs font-medium">HVAC Unit</div>
                      <div className="text-xs">{hvacData.hvacStatus}</div>
                    </div>
                    
                    {/* Air Flow Lines */}
                    <svg className="absolute inset-0 w-full h-full" style={{
                    zIndex: 1
                  }}>
                      {/* Supply lines */}
                      <line x1="50%" y1="80" x2="20%" y2="150" stroke="#3b82f6" strokeWidth="3" strokeDasharray="5,5" />
                      <line x1="50%" y1="80" x2="80%" y2="150" stroke="#3b82f6" strokeWidth="3" strokeDasharray="5,5" />
                      <line x1="50%" y1="80" x2="20%" y2="220" stroke="#3b82f6" strokeWidth="3" strokeDasharray="5,5" />
                      <line x1="50%" y1="80" x2="80%" y2="220" stroke="#3b82f6" strokeWidth="3" strokeDasharray="5,5" />
                      
                      {/* Return lines */}
                      <line x1="20%" y1="170" x2="50%" y2="100" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" />
                      <line x1="80%" y1="170" x2="50%" y2="100" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" />
                      <line x1="20%" y1="240" x2="50%" y2="100" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" />
                      <line x1="80%" y1="240" x2="50%" y2="100" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" />
                    </svg>
                    
                    {/* Zone Controls */}
                    {hvacZones.map((zone, index) => {
                    const positions = [{
                      top: '45%',
                      left: '10%'
                    }, {
                      top: '45%',
                      right: '10%'
                    }, {
                      bottom: '20%',
                      left: '10%'
                    }, {
                      bottom: '20%',
                      right: '10%'
                    }];
                    return <div key={zone.id} className={`absolute bg-white border-2 rounded-lg p-2 text-center shadow-md ${zone.status === 'optimal' ? 'border-green-500' : zone.status === 'warning' ? 'border-yellow-500' : 'border-red-500'}`} style={positions[index]}>
                          <div className="text-xs font-medium">{zone.name}</div>
                          <div className="text-xs text-gray-600">{zone.temp.toFixed(1)}°C</div>
                          <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${zone.status === 'optimal' ? 'bg-green-500' : zone.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        </div>;
                  })}
                    
                    {/* Legend */}
                    <div className="absolute bottom-2 left-2 bg-white p-2 rounded border text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-0.5 bg-blue-600"></div>
                        <span>Supply Air</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-red-500"></div>
                        <span>Return Air</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Indoor Quality Trends
                  </CardTitle>
                  <CardDescription>
                    24-hour environmental monitoring data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hvacHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis yAxisId="temp" orientation="left" label={{
                        value: 'Temperature (°C)',
                        angle: -90,
                        position: 'insideLeft'
                      }} />
                        <YAxis yAxisId="humidity" orientation="right" label={{
                        value: 'Humidity (%)',
                        angle: 90,
                        position: 'insideRight'
                      }} />
                        <Tooltip formatter={(value, name) => [name === 'temp' ? `${value}°C` : name === 'humidity' ? `${value}%` : name === 'aqi' ? `${value} AQI` : name === 'co2' ? `${value} ppm` : `${value} μg/m³`, name === 'temp' ? 'Temperature' : name === 'humidity' ? 'Humidity' : name === 'aqi' ? 'Air Quality' : name === 'co2' ? 'CO2' : 'PM2.5']} />
                        <Legend />
                        <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} name="Temperature" />
                        <Line yAxisId="humidity" type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} name="Humidity" />
                        <Line yAxisId="humidity" type="monotone" dataKey="aqi" stroke="#10b981" strokeWidth={2} name="Air Quality" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Anomaly Detection and Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  HVAC Anomaly Detection & Analysis
                </CardTitle>
                <CardDescription>
                  AI-powered monitoring for system optimization and issue prevention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hvacAnomalies.map(anomaly => {
                  const getIcon = () => {
                    switch (anomaly.type) {
                      case 'warning':
                        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
                      case 'success':
                        return <CheckCircle className="h-5 w-5 text-green-600" />;
                      case 'error':
                        return <XCircle className="h-5 w-5 text-red-600" />;
                      default:
                        return <AlertTriangle className="h-5 w-5 text-blue-600" />;
                    }
                  };
                  const getBgColor = () => {
                    switch (anomaly.type) {
                      case 'warning':
                        return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-l-yellow-500';
                      case 'success':
                        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-green-500';
                      case 'error':
                        return 'bg-gradient-to-r from-red-50 to-pink-50 border-l-red-500';
                      default:
                        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-blue-500';
                    }
                  };
                  return <div key={anomaly.id} className={`p-4 rounded-lg border-l-4 ${getBgColor()}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {getIcon()}
                            <div>
                              <h4 className="font-medium text-gray-900">{anomaly.message}</h4>
                              <p className="text-sm text-gray-600">{anomaly.sensor}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={anomaly.severity === 'good' ? 'default' : 'secondary'} className={anomaly.severity === 'good' ? 'bg-green-500' : anomaly.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'}>
                              {anomaly.severity}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {anomaly.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-sm text-gray-600">Current Value</p>
                            <p className="font-medium">{anomaly.value}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Threshold</p>
                            <p className="font-medium">{anomaly.threshold}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-3 bg-white bg-opacity-50 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Lightbulb className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Recommendation</span>
                          </div>
                          <p className="text-sm text-gray-700">{anomaly.recommendation}</p>
                        </div>
                      </div>;
                })}
                </div>
                
                {/* System Performance Metrics */}
                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{hvacData.energyEfficiency.toFixed(1)}%</div>
                    <div className="text-sm text-blue-700 font-medium">Energy Efficiency</div>
                    <div className="text-xs text-blue-600 mt-1">Above target (85%)</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">{hvacData.filterLife.toFixed(1)}%</div>
                    <div className="text-sm text-green-700 font-medium">Filter Life</div>
                    <div className="text-xs text-green-600 mt-1">Replacement due soon</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{hvacData.fanSpeed.toFixed(1)}%</div>
                    <div className="text-sm text-purple-700 font-medium">Fan Speed</div>
                    <div className="text-xs text-purple-600 mt-1">Auto-optimized</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LLM Layer: AI Insights */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  LLM Layer: Conversational AI Insights
                </CardTitle>
                <CardDescription>
                  Specialized sLLM providing personalized recommendations and automated reporting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiInsights.map((insight, index) => <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-l-blue-500">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-500 p-2 rounded-full">
                          <Lightbulb className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{insight}</p>
                          <p className="text-xs text-gray-500 mt-1">AI Recommendation • Just now</p>
                        </div>
                      </div>
                    </div>)}
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Automated ESG Report Generated</h4>
                    <p className="text-sm text-green-700">
                      Your monthly sustainability report is ready. Carbon reduction: 45.2 kg CO2, 
                      Energy efficiency improvement: 12%, Renewable energy usage: 89%.
                    </p>
                    <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700">
                      Download Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* P2P Trading */}
          <TabsContent value="trading" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpDown className="h-5 w-5" />
                    Active P2P Energy Trades
                  </CardTitle>
                  <CardDescription>
                    Peer-to-peer energy trading with AI-optimized pricing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {p2pTrades.map(trade => <div key={trade.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{trade.neighbor}</span>
                          </div>
                          <Badge variant={trade.status === 'active' ? 'default' : trade.status === 'completed' ? 'secondary' : 'outline'} className={trade.status === 'active' ? 'bg-green-500' : ''}>
                            {trade.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Amount</p>
                            <p className="font-medium">{trade.amount} kWh</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Price</p>
                            <p className="font-medium">€{trade.price}/kWh</p>
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="text-green-600 font-medium">
                            {trade.savings}% below grid price
                          </span>
                        </div>
                        {trade.status === 'pending' && <div className="flex gap-2 mt-3">
                            <Button size="sm" onClick={() => handleTradeAction(trade.id, 'accept')} className="bg-green-600 hover:bg-green-700">
                              Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleTradeAction(trade.id, 'reject')}>
                              Decline
                            </Button>
                          </div>}
                      </div>)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Trading Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">€89.40</p>
                      <p className="text-sm text-green-700">This Month Earnings</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">156.7</p>
                      <p className="text-sm text-blue-700">kWh Traded</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Average Selling Price</span>
                      <span className="text-sm font-medium">€0.157/kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Grid Price Comparison</span>
                      <span className="text-sm font-medium text-green-600">+18% premium</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Carbon Credits Earned</span>
                      <span className="text-sm font-medium">47.2 kg CO2</span>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-4">
                    Create New Trade Offer
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ontology Management */}
          <TabsContent value="ontology" className="space-y-6">
            {/* User Role Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Ontology Management System
                </CardTitle>
                <CardDescription>
                  Define and manage domain-specific ontologies for different energy stakeholders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {userRoles.map(role => {
                  const IconComponent = role.icon;
                  return <Card key={role.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedUserRole === role.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`} onClick={() => setSelectedUserRole(role.id)}>
                        <CardContent className="p-4 text-center">
                          <div className={`w-12 h-12 ${role.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-medium text-sm">{role.name}</h3>
                        </CardContent>
                      </Card>;
                })}
                </div>
              </CardContent>
            </Card>

            {/* Selected Role Ontology */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Ontology Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {ontologyData[selectedUserRole].name}
                  </CardTitle>
                  <CardDescription>
                    {ontologyData[selectedUserRole].description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(ontologyData[selectedUserRole].metrics).map(([key, value]) => <div key={key} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-sm font-bold text-blue-600">{value}</span>
                      </div>)}
                  </div>
                  
                  <Button className="w-full mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Concept
                  </Button>
                </CardContent>
              </Card>

              {/* Concepts Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Domain Concepts
                  </CardTitle>
                  <CardDescription>
                    Manage entities and their properties within this domain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {ontologyData[selectedUserRole].concepts.map(concept => {
                    const getStatusColor = () => {
                      switch (concept.status) {
                        case 'active':
                        case 'operational':
                        case 'issued':
                          return 'bg-green-100 text-green-800';
                        case 'charging':
                        case 'consuming':
                        case 'enforced':
                        case 'growing':
                          return 'bg-blue-100 text-blue-800';
                        case 'monitoring':
                        case 'learning':
                        case 'heating':
                        case 'compliant':
                        case 'trading':
                          return 'bg-yellow-100 text-yellow-800';
                        case 'optimizing':
                        case 'issuing':
                          return 'bg-purple-100 text-purple-800';
                        default:
                          return 'bg-gray-100 text-gray-800';
                      }
                    };
                    return <div key={concept.id} className="border rounded-lg p-3 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{concept.name}</h4>
                            <Badge className={getStatusColor()}>
                              {concept.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>Type:</span>
                              <span className="font-medium">{concept.type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Capacity:</span>
                              <span className="font-medium">{concept.capacity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Efficiency:</span>
                              <span className="font-medium text-green-600">{concept.efficiency}</span>
                            </div>
                          </div>
                        </div>;
                  })}
                  </div>
                </CardContent>
              </Card>

              {/* Relationships Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Relationship Graph
                  </CardTitle>
                  <CardDescription>
                    Visualize connections and dependencies between concepts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-gray-50 rounded-lg p-4 h-80">
                    {/* Simplified Network Visualization */}
                    <svg className="w-full h-full">
                      {/* Nodes */}
                      {ontologyData[selectedUserRole].concepts.map((concept, index) => {
                      const positions = [{
                        x: '20%',
                        y: '20%'
                      }, {
                        x: '80%',
                        y: '20%'
                      }, {
                        x: '20%',
                        y: '80%'
                      }, {
                        x: '80%',
                        y: '80%'
                      }];
                      const pos = positions[index] || {
                        x: '50%',
                        y: '50%'
                      };
                      return <g key={concept.id}>
                            <circle cx={pos.x} cy={pos.y} r="25" fill="#3b82f6" className="opacity-80" />
                            <text x={pos.x} y={pos.y} textAnchor="middle" dy="0.3em" className="text-xs fill-white font-medium">
                              {concept.name.split(' ')[0]}
                            </text>
                          </g>;
                    })}
                      
                      {/* Relationships */}
                      {ontologyData[selectedUserRole].relationships.map((rel, index) => {
                      const fromIndex = ontologyData[selectedUserRole].concepts.findIndex(c => c.name === rel.from);
                      const toIndex = ontologyData[selectedUserRole].concepts.findIndex(c => c.name === rel.to);
                      const positions = [{
                        x: '20%',
                        y: '20%'
                      }, {
                        x: '80%',
                        y: '20%'
                      }, {
                        x: '20%',
                        y: '80%'
                      }, {
                        x: '80%',
                        y: '80%'
                      }];
                      const fromPos = positions[fromIndex] || {
                        x: '50%',
                        y: '50%'
                      };
                      const toPos = positions[toIndex] || {
                        x: '50%',
                        y: '50%'
                      };
                      return <line key={index} x1={fromPos.x} y1={fromPos.y} x2={toPos.x} y2={toPos.y} stroke="#6b7280" strokeWidth={Math.max(1, rel.strength * 3)} strokeDasharray={rel.strength > 0.8 ? '0' : '5,5'} className="opacity-60" />;
                    })}
                    </svg>
                    
                    {/* Legend */}
                    <div className="absolute bottom-2 right-2 bg-white p-2 rounded border text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-0.5 bg-gray-600"></div>
                          <span>Strong (&gt;0.8)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-0.5 bg-gray-600" style={{
                          strokeDasharray: '2,2'
                        }}></div>
                          <span>Weak (&lt;0.8)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Relationship Details */}
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-sm">Active Relationships:</h4>
                    {ontologyData[selectedUserRole].relationships.map((rel, index) => <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                        <span><strong>{rel.from}</strong> {rel.type.replace(/_/g, ' ')} <strong>{rel.to}</strong></span>
                        <Badge variant="outline">{(rel.strength * 100).toFixed(0)}%</Badge>
                      </div>)}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Ontology Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Ontology Operations
                </CardTitle>
                <CardDescription>
                  Export, import, and manage ontology definitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export OWL
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Import RDF
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share Schema
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Validate
                  </Button>
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-3">Ontology Statistics</h4>
                  <div className="grid md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{ontologyData[selectedUserRole].concepts.length}</div>
                      <div className="text-sm text-blue-700">Concepts</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{ontologyData[selectedUserRole].relationships.length}</div>
                      <div className="text-sm text-green-700">Relations</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{userRoles.length}</div>
                      <div className="text-sm text-purple-700">User Roles</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">98.7%</div>
                      <div className="text-sm text-orange-700">Consistency</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* P2P Trading */}
          <TabsContent value="trading" className="space-y-6">
            {/* Trading Scenarios Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5" />
                  P2P Energy Trading Scenarios
                </CardTitle>
                <CardDescription>
                  Choose your trading strategy based on profit potential and comfort preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {tradingScenarios.map((scenario, index) => {
                  const getProfitColor = () => {
                    if (scenario.profitIndex >= 75) return 'text-green-600 bg-green-50';
                    if (scenario.profitIndex >= 50) return 'text-blue-600 bg-blue-50';
                    if (scenario.profitIndex >= 25) return 'text-yellow-600 bg-yellow-50';
                    return 'text-gray-600 bg-gray-50';
                  };
                  const getDiscomfortColor = () => {
                    if (scenario.discomfortIndex >= 75) return 'text-red-600 bg-red-50';
                    if (scenario.discomfortIndex >= 50) return 'text-orange-600 bg-orange-50';
                    if (scenario.discomfortIndex >= 25) return 'text-yellow-600 bg-yellow-50';
                    return 'text-green-600 bg-green-50';
                  };
                  return <Card key={scenario.id} className={`cursor-pointer transition-all hover:shadow-lg ${selectedScenario === index ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`} onClick={() => setSelectedScenario(index)}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{scenario.name}</CardTitle>
                          <CardDescription className="text-sm">{scenario.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Profit Index */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Profit Index</span>
                              <span className={`text-sm font-bold px-2 py-1 rounded ${getProfitColor()}`}>
                                {scenario.profitIndex}%
                              </span>
                            </div>
                            <Progress value={scenario.profitIndex} className="h-2" />
                          </div>
                          
                          {/* Discomfort Index */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Discomfort Index</span>
                              <span className={`text-sm font-bold px-2 py-1 rounded ${getDiscomfortColor()}`}>
                                {scenario.discomfortIndex}%
                              </span>
                            </div>
                            <Progress value={scenario.discomfortIndex} className="h-2" />
                          </div>
                          
                          {/* Estimated Revenue */}
                          <div className="pt-2 border-t">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{scenario.estimatedRevenue}</div>
                              <div className="text-xs text-gray-600">Estimated Revenue</div>
                            </div>
                          </div>
                          
                          {/* Controlled Devices Count */}
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                            <Settings className="h-4 w-4" />
                            <span>{scenario.controlledDevices.length} devices controlled</span>
                          </div>
                        </CardContent>
                      </Card>;
                })}
                </div>
              </CardContent>
            </Card>
            
            {/* Selected Scenario Details */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Scenario Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    {tradingScenarios[selectedScenario].name} Details
                  </CardTitle>
                  <CardDescription>
                    Comprehensive overview of the selected trading strategy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Scenario Description */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Trading Strategy</h4>
                    <p className="text-sm text-blue-700">{tradingScenarios[selectedScenario].scenario}</p>
                  </div>
                  
                  {/* Benefits */}
                  <div>
                    <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Benefits
                    </h4>
                    <ul className="space-y-1">
                      {tradingScenarios[selectedScenario].benefits.map((benefit, index) => <li key={index} className="text-sm text-green-700 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          {benefit}
                        </li>)}
                    </ul>
                  </div>
                  
                  {/* Risks */}
                  <div>
                    <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Considerations
                    </h4>
                    <ul className="space-y-1">
                      {tradingScenarios[selectedScenario].risks.map((risk, index) => <li key={index} className="text-sm text-orange-700 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                          {risk}
                        </li>)}
                    </ul>
                  </div>
                  
                  {/* Controlled Devices */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Controlled Devices
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tradingScenarios[selectedScenario].controlledDevices.map((device, index) => <Badge key={index} variant="outline" className="text-xs">
                          {device}
                        </Badge>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Device Control Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Device Control Configuration
                  </CardTitle>
                  <CardDescription>
                    Detailed control settings for each device in this scenario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {tradingScenarios[selectedScenario].deviceControls.map((deviceControl, index) => <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{deviceControl.device}</h4>
                          <Badge variant="secondary" className="text-xs">
                            Automated
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-gray-600">Control Method:</span>
                            <p className="font-medium text-blue-700 mt-1">{deviceControl.control}</p>
                          </div>
                          
                          <div>
                            <span className="text-gray-600">User Impact:</span>
                            <p className="font-medium text-orange-700 mt-1">{deviceControl.impact}</p>
                          </div>
                        </div>
                      </div>)}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Trading Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Trading Performance & Analytics
                </CardTitle>
                <CardDescription>
                  Real-time performance metrics for the selected trading scenario
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{tradingScenarios[selectedScenario].estimatedRevenue}</div>
                    <div className="text-sm text-green-700 font-medium">Monthly Revenue</div>
                    <div className="text-xs text-green-600 mt-1">Projected earnings</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{tradingScenarios[selectedScenario].profitIndex}%</div>
                    <div className="text-sm text-blue-700 font-medium">Profit Index</div>
                    <div className="text-xs text-blue-600 mt-1">Revenue optimization</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{100 - tradingScenarios[selectedScenario].discomfortIndex}%</div>
                    <div className="text-sm text-purple-700 font-medium">Comfort Level</div>
                    <div className="text-xs text-purple-600 mt-1">Lifestyle preservation</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{tradingScenarios[selectedScenario].controlledDevices.length}</div>
                    <div className="text-sm text-orange-700 font-medium">Active Devices</div>
                    <div className="text-xs text-orange-600 mt-1">Under automation</div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-6 flex gap-4 justify-center">
                  <Button className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Activate Scenario
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Simulate 24h
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Customize Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
};
export default Index;
