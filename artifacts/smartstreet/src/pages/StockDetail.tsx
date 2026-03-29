import { useGetStock } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { useParams } from "wouter";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Target, ShieldAlert, Activity, CheckCircle2 } from "lucide-react";
import { formatPercent, formatCurrency, cn } from "@/lib/utils";

export default function StockDetail() {
  const params = useParams();
  const symbol = params.symbol || "RELIANCE";
  const { data: stock, isLoading, error } = useGetStock(symbol);

  if (isLoading) return <Layout><div className="p-8 text-white">Loading...</div></Layout>;
  if (error || !stock) return <Layout><div className="p-8 text-destructive">Error loading stock data.</div></Layout>;

  const isPositive = stock.priceChange >= 0;

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display font-bold text-white">{stock.symbol}</h1>
              <span className="px-2.5 py-1 bg-white/10 rounded-lg text-xs font-semibold text-white/80">
                {stock.sector}
              </span>
            </div>
            <p className="text-muted-foreground">{stock.name}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-display font-bold text-white mb-1">
              {formatCurrency(stock.currentPrice)}
            </div>
            <div className={cn("flex items-center justify-end gap-2 font-medium", isPositive ? "text-success" : "text-destructive")}>
              {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span>{formatCurrency(Math.abs(stock.priceChange))} ({formatPercent(stock.priceChangePercent)})</span>
            </div>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-medium">Price History (6M)</h3>
            <div className="flex gap-2">
              {['1W', '1M', '3M', '6M', '1Y'].map(tf => (
                <button key={tf} className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  tf === '6M' ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                )}>
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stock.priceHistory} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  domain={['dataMin - 100', 'dataMax + 100']} 
                  stroke="rgba(255,255,255,0.4)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                  orientation="right"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: 'white' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                  formatter={(value: number) => [`₹${value}`, 'Price']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                />
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Technical Stats */}
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Key Indicators
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">RSI (14)</div>
                <div className={cn("text-lg font-bold", stock.rsi > 70 ? "text-destructive" : stock.rsi < 30 ? "text-success" : "text-white")}>
                  {stock.rsi.toFixed(1)}
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    {stock.rsi > 70 ? "Overbought" : stock.rsi < 30 ? "Oversold" : "Neutral"}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Volume vs Avg</div>
                <div className="text-lg font-bold text-white">
                  {(stock.volume / stock.avgVolume).toFixed(1)}x
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">MACD</div>
                <div className="text-lg font-bold text-white">
                  {stock.macd?.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Signal</div>
                <div className="text-lg font-bold text-white">
                  {stock.macdSignal?.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Active Patterns */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
            <h3 className="text-white font-medium flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-primary" /> Detected Patterns
            </h3>
            {stock.patterns.length > 0 ? (
              <div className="space-y-4">
                {stock.patterns.map(pattern => (
                  <div key={pattern.id} className="bg-black/20 border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-white">{pattern.patternType}</span>
                          <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded font-medium">
                            {pattern.confidence}% Confidence
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Detected on {new Date(pattern.detectedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">Historical Win Rate</div>
                        <div className="text-sm font-bold text-success">{pattern.historicalSuccessRate}%</div>
                        <div className="text-xs text-muted-foreground mt-0.5">over {pattern.occurrences} instances</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Entry Level</div>
                        <div className="text-base font-display text-white">₹{pattern.entryPrice}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target</div>
                        <div className="text-base font-display text-success">₹{pattern.targetPrice}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Stop Loss</div>
                        <div className="text-base font-display text-destructive">₹{pattern.stopLoss}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                <p>No actionable patterns detected currently.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
