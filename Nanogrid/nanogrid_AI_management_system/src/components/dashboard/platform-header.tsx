import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Wifi, Globe2, ExternalLink } from "lucide-react";

const PlatformHeader = () => (
  <header className="bg-white shadow-sm border-b">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src="/nanogrid/images/nanogrid-logo.png"
            alt="NanoGrid Platform"
            className="h-12 w-auto"
          />
          <div className="sr-only">
            <h1>NanoGrid Platform</h1>
            <p>NanoGrid Platform</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Wifi className="h-3 w-3 mr-1" />
            Live System
          </Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
            TRL 7-8 Ready
          </Badge>
          <Badge className="bg-slate-900 text-white flex items-center gap-2 px-3 py-1">
            <Globe2 className="h-4 w-4" />
            agent.gngmeta.com/dt
          </Badge>
          <Button variant="ghost" size="sm" asChild className="border border-slate-200">
            <a href="https://agent.gngmeta.com/dt/" target="_blank" rel="noreferrer">
              Docs <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge className="bg-gradient-to-r from-blue-500 to-sky-500 text-white">Dashboard</Badge>
        <Badge className="bg-gradient-to-r from-orange-500 to-amber-400 text-white">Hardware</Badge>
        <Badge className="bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white">Analytics</Badge>
        <Badge className="bg-gradient-to-r from-teal-600 to-cyan-500 text-white">HVAC</Badge>
        <Badge className="bg-gradient-to-r from-emerald-600 to-lime-500 text-white">Ontology</Badge>
        <Badge className="bg-gradient-to-r from-pink-600 to-rose-500 text-white">Trading</Badge>
      </div>
    </div>
  </header>
);

export default PlatformHeader;
