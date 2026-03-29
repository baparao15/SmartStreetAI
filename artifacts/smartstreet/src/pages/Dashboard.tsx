import { useGetMarketSummary, useListAlerts } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { AlertCard } from "@/components/AlertCard";
import { TrendingUp, TrendingDown, Activity, RefreshCcw } from "lucide-react";
import { formatPercent, cn } from "@/lib/utils";
import { useState } from "react";

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const { data: summary, isLoading: loadingSummary } = useGetMarketSummary();
  const { data: alerts, isLoading: loadingAlerts } = useListAlerts();

  const filters = ["ALL", "BREAKOUT", "EARNINGS", "INSIDER", "PATTERNS"];

  const filteredAlerts = alerts?.filter(a => 
    activeFilter === "ALL" ? true : a.alertType.toUpperCase().includes(activeFilter)
  ) || [];

  const topAlerts = filteredAlerts.slice(0, 3);
  const radarAlerts = filteredAlerts.slice(3);

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in">
        
        {/* Market Summary Bar */}
        {loadingSummary ? (
          <div className="h-24 glass-panel rounded-2xl animate-pulse" />
        ) : summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-2xl flex flex-col justify-center">
              <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Nifty 50</span>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-white">{summary.nifty50.toLocaleString('en-IN')}</span>
                <span className={cn("text-sm font-medium", summary.nifty50Change >= 0 ? "text-success" : "text-destructive")}>
                  {formatPercent(summary.nifty50ChangePercent)}
                </span>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex flex-col justify-center">
              <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sensex</span>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-white">{summary.sensex.toLocaleString('en-IN')}</span>
                <span className={cn("text-sm font-medium", summary.sensexChange >= 0 ? "text-success" : "text-destructive")}>
                  {formatPercent(summary.sensexChangePercent)}
                </span>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex flex-col justify-center">
              <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Adv/Dec</span>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden flex">
                  <div className="bg-success h-full" style={{ width: '60%' }} />
                  <div className="bg-destructive h-full" style={{ width: '40%' }} />
                </div>
                <span className="font-display text-lg font-bold text-white">{summary.advanceDecline}</span>
              </div>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Market Status</span>
                <span className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                  {summary.marketStatus}
                </span>
              </div>
              <Activity className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Feed */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-white">Top Opportunities</h2>
              <button className="text-muted-foreground hover:text-white flex items-center gap-2 text-sm transition-colors">
                <RefreshCcw className="w-4 h-4" /> Refresh
              </button>
            </div>
            
            {loadingAlerts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-64 glass-panel rounded-2xl animate-pulse" />
                <div className="h-64 glass-panel rounded-2xl animate-pulse" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {topAlerts.map(alert => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            )}

            <div className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-white">Opportunity Radar</h2>
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {filters.map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                        activeFilter === f 
                          ? "bg-white text-black" 
                          : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {radarAlerts.map(alert => (
                  <div key={alert.id} className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                      alert.priceChange >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    )}>
                      {alert.priceChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white">{alert.stockSymbol}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider",
                          alert.priority === 'STRONG' ? "bg-destructive/20 text-destructive" : "bg-white/10 text-white/70"
                        )}>
                          {alert.alertType}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{alert.headline}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-white">₹{alert.entryPrice || alert.priceChange}</div>
                      <div className={cn("text-xs", alert.priceChange >= 0 ? "text-success" : "text-destructive")}>
                        {formatPercent(alert.priceChangePercent)}
                      </div>
                    </div>
                  </div>
                ))}
                {radarAlerts.length === 0 && !loadingAlerts && (
                  <div className="text-center py-12 text-muted-foreground">
                    No opportunities found for this filter.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10" />
              
              <h3 className="text-white font-display font-bold mb-6">Portfolio Health</h3>
              
              <div className="flex justify-center mb-6 relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" className="stroke-black/40" strokeWidth="12" fill="none" />
                  <circle 
                    cx="64" cy="64" r="56" 
                    className="stroke-primary" 
                    strokeWidth="12" fill="none" 
                    strokeDasharray="351.85" 
                    strokeDashoffset={351.85 - (351.85 * 85) / 100}
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-display font-bold text-white">85</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Diversification</span>
                  <span className="text-success font-medium">Good</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Risk Level</span>
                  <span className="text-warning font-medium">Moderate</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Cash Drag</span>
                  <span className="text-white font-medium">Low</span>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-white font-display font-bold mb-4">Top Sectors</h3>
              <div className="space-y-4">
                {summary?.topSectors.map((sector, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white">{sector.name}</span>
                      <span className={sector.change >= 0 ? "text-success" : "text-destructive"}>
                        {formatPercent(sector.change)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full", sector.change >= 0 ? "bg-success" : "bg-destructive")} 
                        style={{ width: `${Math.min(Math.abs(sector.change) * 20, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
