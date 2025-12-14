import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabStyles: Record<string, string> = {
  dashboard: "data-[state=active]:from-blue-600 data-[state=active]:to-sky-500",
  hardware: "data-[state=active]:from-orange-500 data-[state=active]:to-amber-400",
  analytics: "data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-500",
  hvac: "data-[state=active]:from-teal-600 data-[state=active]:to-cyan-500",
  ontology: "data-[state=active]:from-emerald-600 data-[state=active]:to-lime-500",
  trading: "data-[state=active]:from-pink-600 data-[state=active]:to-rose-500"
};

const tabs = [
  { value: "dashboard", label: "Energy Dashboard" },
  { value: "hardware", label: "Module A: Hardware" },
  { value: "analytics", label: "Module B: Analytics" },
  { value: "hvac", label: "Module C: HVAC" },
  { value: "ontology", label: "Ontology Management" },
  { value: "trading", label: "P2P Trading" }
];

const TabMenu = () => (
  <TabsList className="grid w-full grid-cols-6 gap-2 bg-transparent p-0">
    {tabs.map(tab => (
      <TabsTrigger
        key={tab.value}
        value={tab.value}
        className={`rounded-md border border-slate-200 bg-white/70 text-slate-700 shadow-sm transition
          data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-transparent
          data-[state=active]:bg-gradient-to-r data-[state=active]:brightness-110 hover:bg-white
          ${tabStyles[tab.value]}`}
      >
        {tab.label}
      </TabsTrigger>
    ))}
  </TabsList>
);

export default TabMenu;
