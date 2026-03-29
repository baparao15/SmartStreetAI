import { useState } from "react";
import { Alert } from "@workspace/api-client-react";
import { TrendingUp, TrendingDown, BarChart2, Zap, Target, Activity, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn, formatPercent } from "@/lib/utils";
import { Link } from "wouter";

export function AlertCard({ alert }: { alert: Alert }) {
  const [expanded, setExpanded] = useState(false);
  const isPositive = alert.priceChange >= 0;

  const priorityColors = {
    STRONG: "border-destructive/30 bg-destructive/5 text-destructive",
    MODERATE: "border-warning/30 bg-warning/5 text-warning",
    WATCH: "border-success/30 bg-success/5 text-success"
  };

  const priorityShadows = {
    STRONG: "hover:shadow-destructive/10",
    MODERATE: "hover:shadow-warning/10",
    WATCH: "hover:shadow-success/10"
  };

  return (
    <div className={cn(
      "glass-panel rounded-2xl overflow-hidden transition-all duration-300",
      priorityShadows[alert.priority as keyof typeof priorityShadows] || "hover:shadow-white/5",
      expanded ? "ring-1 ring-primary/20" : ""
    )}>
      <div className="p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-display font-bold text-white text-lg leading-none">{alert.stockSymbol}</span>
              <span className="text-xs text-muted-foreground">{alert.stockName}</span>
            </div>
            <div className={cn(
              "px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1",
              isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatPercent(alert.priceChangePercent)}
            </div>
          </div>
          
          <div className={cn(
            "px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider",
            priorityColors[alert.priority as keyof typeof priorityColors] || "border-white/20 text-white"
          )}>
            {alert.alertType}
          </div>
        </div>

        <h3 className="text-white font-medium mb-4 text-sm leading-snug">
          {alert.headline}
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {alert.volumeSpike != null && (
            <div className="bg-black/20 rounded-lg p-2 flex flex-col items-center justify-center">
              <BarChart2 className="w-4 h-4 text-primary mb-1" />
              <span className="text-xs text-muted-foreground mb-0.5">Vol Spike</span>
              <span className="text-xs font-bold text-white">{alert.volumeSpike}x</span>
            </div>
          )}
          {alert.patternSuccessRate != null && (
            <div className="bg-black/20 rounded-lg p-2 flex flex-col items-center justify-center">
              <Target className="w-4 h-4 text-success mb-1" />
              <span className="text-xs text-muted-foreground mb-0.5">Win Rate</span>
              <span className="text-xs font-bold text-white">{alert.patternSuccessRate}%</span>
            </div>
          )}
          {alert.sentimentScore != null && (
            <div className="bg-black/20 rounded-lg p-2 flex flex-col items-center justify-center">
              <Activity className="w-4 h-4 text-warning mb-1" />
              <span className="text-xs text-muted-foreground mb-0.5">Sentiment</span>
              <span className="text-xs font-bold text-white">{alert.sentimentScore}/100</span>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-white/5 bg-black/20 animate-in">
          <div className="text-sm text-muted-foreground leading-relaxed mb-4">
            {alert.explanation}
          </div>
          
          {alert.evidencePoints && alert.evidencePoints.length > 0 && (
            <div className="space-y-2 mb-4">
              {alert.evidencePoints.map((pt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs text-white/80">{pt}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 mb-4">
            {alert.entryPrice && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Entry</div>
                <div className="text-sm font-display text-white">₹{alert.entryPrice}</div>
              </div>
            )}
            {alert.targetPrice && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Target</div>
                <div className="text-sm font-display text-success">₹{alert.targetPrice}</div>
              </div>
            )}
            {alert.stopLoss && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Stop Loss</div>
                <div className="text-sm font-display text-destructive">₹{alert.stopLoss}</div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Link 
              href={`/stocks/${alert.stockSymbol}`}
              className="flex-1 bg-primary text-primary-foreground text-center py-2.5 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(0,122,255,0.3)] hover:shadow-[0_0_25px_rgba(0,122,255,0.5)] transition-all"
            >
              View Chart
            </Link>
            <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-center py-2.5 rounded-xl text-sm font-bold transition-all">
              Mark Acted On
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
