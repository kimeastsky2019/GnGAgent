import { Card, CardContent } from "@/components/ui/card";
import { Battery, Home, Leaf, Sun } from "lucide-react";
import type { EnergySnapshot } from "@/types/ai";

interface EnergyOverviewProps {
  energy: EnergySnapshot & { carbonOffset: number };
}

const EnergyOverview = ({ energy }: EnergyOverviewProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-yellow-100 text-sm font-medium">Solar Generation</p>
            <p className="text-2xl font-bold">{energy.solarGeneration.toFixed(1)} kW</p>
          </div>
          <Sun className="h-8 w-8 text-yellow-100" />
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-r from-green-400 to-emerald-500 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm font-medium">Battery Level</p>
            <p className="text-2xl font-bold">{energy.batteryLevel.toFixed(0)}%</p>
          </div>
          <Battery className="h-8 w-8 text-green-100" />
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Consumption</p>
            <p className="text-2xl font-bold">{energy.consumption.toFixed(1)} kW</p>
          </div>
          <Home className="h-8 w-8 text-blue-100" />
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-r from-purple-400 to-pink-500 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm font-medium">Carbon Offset</p>
            <p className="text-2xl font-bold">{energy.carbonOffset.toFixed(1)} kg</p>
          </div>
          <Leaf className="h-8 w-8 text-purple-100" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default EnergyOverview;
