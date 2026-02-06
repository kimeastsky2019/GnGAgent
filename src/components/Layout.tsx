import React, { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ShieldAlert,
  LayoutDashboard,
  FileCheck,
  ShieldCheck,
  Activity,
  Scale,
  Menu,
  X,
  ChevronRight,
  Bell,
  Home,
  Search,
  User,
  Settings,
  ListOrdered,
  Brain,
  TrendingUp,
  Wrench,
  Mail,
  MapPin,
  Building2
} from "lucide-react";
import { ROUTE_PATHS, cn } from "@/lib/index";
import { motion, AnimatePresence } from "framer-motion";

// ─── Navigation 구조 ───────────────────────────────────
// 3개 그룹: 작업(Work) / 관제(Control) / 도구(Tools)

interface NavItem {
  nameKey: string;
  path: string;
  icon: React.ElementType;
  descriptionKey?: string;
  matchPath?: (path: string) => boolean;
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    labelKey: "nav.group_work",
    items: [
      { nameKey: "nav.home", path: ROUTE_PATHS.HOME, icon: Home, descriptionKey: "nav.home_desc" },
      { nameKey: "flow.nav_start", path: ROUTE_PATHS.FLOW_REQUEST_FORM, icon: ListOrdered, descriptionKey: "flow.nav_start_desc", matchPath: (path) => path.startsWith("/flow") },
      { nameKey: "flow.nav_dashboard", path: ROUTE_PATHS.DASHBOARD, icon: LayoutDashboard, descriptionKey: "nav.dashboard_desc" },
    ],
  },
  {
    labelKey: "nav.group_tools",
    items: [
      { nameKey: "nav.assessment", path: ROUTE_PATHS.ASSESSMENT, icon: FileCheck, descriptionKey: "nav.assessment_desc" },
      { nameKey: "nav.technical", path: ROUTE_PATHS.TECHNICAL_VALIDATION, icon: ShieldCheck, descriptionKey: "nav.technical_desc" },
      { nameKey: "nav.monitoring", path: ROUTE_PATHS.MONITORING, icon: Activity, descriptionKey: "nav.monitoring_desc" },
      { nameKey: "nav.compliance", path: ROUTE_PATHS.COMPLIANCE, icon: Scale, descriptionKey: "nav.compliance_desc" },
      { nameKey: "nav.sllm", path: ROUTE_PATHS.SLLM_AUTOMATION, icon: Brain, descriptionKey: "nav.sllm_desc" },
    ],
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* --- Top Header --- */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-50 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-accent rounded-md text-muted-foreground"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <a href="https://agent.gngmeta.com/nanogrid/" className="flex items-center gap-2 group">
            <img
              src={`${import.meta.env.BASE_URL}assets/logo_gng_header.png`}
              alt="GnG International"
              className="h-10 w-auto group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-none tracking-tight">GnG International</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Governance Orchestrator</span>
            </div>
          </a>
        </div>

        <div className="flex items-center gap-3 lg:gap-6">
          <div className="hidden md:flex items-center bg-muted/50 border border-border px-3 py-1.5 rounded-full w-64 focus-within:ring-1 ring-primary transition-all">
            <Search size={16} className="text-muted-foreground mr-2" />
            <input
              type="text"
              placeholder="AI 서비스 검색..."
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground hover:bg-accent rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
            </button>
            <div className="h-8 w-[1px] bg-border mx-1"></div>
            <button className="flex items-center gap-2 p-1 pl-1 pr-3 hover:bg-accent rounded-full transition-colors">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                AD
              </div>
              <span className="hidden sm:inline text-sm font-medium">관리자</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* --- Sidebar (Desktop) --- */}
        <aside
          className={cn(
            "hidden lg:flex flex-col fixed left-0 top-16 bottom-0 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out z-40",
            isSidebarOpen ? "w-64" : "w-20"
          )}
        >
          <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto px-3">
            {navGroups.map((group, gIdx) => (
              <div key={group.labelKey}>
                {/* Group divider (skip for first group) */}
                {gIdx > 0 && (
                  <div className="my-3 mx-2">
                    {isSidebarOpen ? (
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-sidebar-border" />
                        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest shrink-0">
                          {t(group.labelKey)}
                        </span>
                        <div className="h-px flex-1 bg-sidebar-border" />
                      </div>
                    ) : (
                      <div className="h-px bg-sidebar-border" />
                    )}
                  </div>
                )}

                {group.items.map((item) => (
                  <NavLink
                    key={item.path + item.nameKey}
                    to={item.path}
                    className={({ isActive }) => {
                      const active = item.matchPath ? item.matchPath(location.pathname) : isActive;
                      return cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      );
                    }}
                  >
                    <item.icon size={18} className={cn("shrink-0", isSidebarOpen ? "" : "mx-auto")} />
                    {isSidebarOpen && (
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold truncate">{t(item.nameKey)}</span>
                        {item.descriptionKey && (
                          <span className="text-[10px] opacity-70 truncate">{t(item.descriptionKey)}</span>
                        )}
                      </div>
                    )}
                    {!isSidebarOpen && (
                      <div className="absolute left-16 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg border border-border">
                        {t(item.nameKey)}
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
            >
              <ChevronRight size={18} className={cn("transition-transform", isSidebarOpen ? "rotate-180" : "")} />
            </button>
          </div>
        </aside>

        {/* --- Mobile Sidebar Overlay --- */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[55] lg:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-[280px] bg-sidebar z-[60] lg:hidden border-r border-sidebar-border shadow-2xl p-6"
              >
                <div className="flex items-center justify-between mb-8">
                  <a href="https://agent.gngmeta.com/nanogrid/" className="flex items-center gap-2">
                    <img
                      src={`${import.meta.env.BASE_URL}assets/logo_gng_header.png`}
                      alt="GnG International"
                      className="h-8 w-auto"
                    />
                    <span className="font-bold">GnG International</span>
                  </a>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-accent rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <nav className="flex flex-col gap-1">
                  {navGroups.map((group, gIdx) => (
                    <div key={group.labelKey}>
                      {gIdx > 0 && (
                        <div className="my-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-border/50" />
                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                              {t(group.labelKey)}
                            </span>
                            <div className="h-px flex-1 bg-border/50" />
                          </div>
                        </div>
                      )}
                      {group.items.map((item) => (
                        <NavLink
                          key={item.path + item.nameKey}
                          to={item.path}
                          className={({ isActive }) => {
                            const active = item.matchPath ? item.matchPath(location.pathname) : isActive;
                            return cn(
                              "flex items-center gap-4 px-4 py-3 rounded-xl transition-all",
                              active
                                ? "bg-primary text-primary-foreground shadow-lg"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            );
                          }}
                        >
                          <item.icon size={20} />
                          <span className="font-medium">{t(item.nameKey)}</span>
                        </NavLink>
                      ))}
                    </div>
                  ))}
                </nav>

                <div className="absolute bottom-8 left-6 right-6">
                  <div className="bg-accent/50 p-4 rounded-2xl border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        AD
                      </div>
                      <div>
                        <p className="text-sm font-bold">홍길동 팀장</p>
                        <p className="text-xs text-muted-foreground">거버넌스 전략팀</p>
                      </div>
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium hover:bg-accent rounded-lg transition-colors">
                      <Settings size={14} /> 설정 및 로그아웃
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* --- Main Content --- */}
        <main
          className={cn(
            "flex-1 min-w-0 transition-all duration-300 flex flex-col",
            isSidebarOpen ? "lg:pl-64" : "lg:pl-20"
          )}
        >
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full flex-1">
            {children}
          </div>

          {/* --- Footer --- */}
          <footer className="mt-auto py-8 px-4 lg:px-8 border-t border-border bg-muted/30 w-full">
            <div className="max-w-[1600px] mx-auto space-y-6">
              {/* Contact / Company Info */}
              <div className="flex flex-col sm:flex-row flex-wrap items-start justify-between gap-6 pb-6 border-b border-border/50">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span>{t("footer.contact_title")}</span>
                </div>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <a href="mailto:info@gngmeta.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Mail className="w-4 h-4 shrink-0" />
                    info@gngmeta.com
                  </a>
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>경기도 성남시 분당구 판교로289번길 20 2동 5층</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground/80">
                    {t("footer.business_id")}: 625-88-02407
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1 items-center md:items-start">
                  <p className="text-sm text-muted-foreground font-medium">
                    © 2026 GnG International. All rights reserved.
                  </p>
                  <p className="text-[11px] text-muted-foreground/60">
                    {t("footer.compliance_note")}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{t("footer.terms")}</a>
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{t("footer.privacy")}</a>
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{t("footer.support")}</a>
                  <div className="flex items-center gap-2 px-3 py-1 bg-chart-3/10 text-chart-3 rounded-full border border-chart-3/20">
                    <div className="w-2 h-2 bg-chart-3 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">System Healthy</span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
