import { useGetPortfolio, useAddHolding, useRemoveHolding } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Plus, Trash2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const addHoldingSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  quantity: z.coerce.number().min(1, "Quantity must be > 0"),
  avgPrice: z.coerce.number().min(0.01, "Price must be > 0"),
});

export default function Portfolio() {
  const { data: portfolio, isLoading, refetch } = useGetPortfolio();
  const addMutation = useAddHolding();
  const removeMutation = useRemoveHolding();
  
  const [isAdding, setIsAdding] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(addHoldingSchema)
  });

  const onSubmit = async (data: any) => {
    await addMutation.mutateAsync({ data });
    setIsAdding(false);
    reset();
    refetch();
  };

  const removeHolding = async (id: number) => {
    if(confirm("Remove this holding?")) {
      await removeMutation.mutateAsync({ id });
      refetch();
    }
  };

  if (isLoading) return <Layout><div className="p-8 text-white">Loading portfolio...</div></Layout>;
  if (!portfolio) return <Layout><div className="p-8 text-white">No portfolio data.</div></Layout>;

  const isPositive = portfolio.dayChange >= 0;

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-panel p-8 rounded-3xl bg-gradient-to-br from-card to-card/50 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <p className="text-muted-foreground text-sm uppercase tracking-wider mb-2">Total Value</p>
            <h1 className="text-5xl font-display font-bold text-white tracking-tight mb-4">
              {formatCurrency(portfolio.totalValue)}
            </h1>
            <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium", isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
              {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span>{formatCurrency(Math.abs(portfolio.dayChange))}</span>
              <span className="opacity-80">({formatPercent(portfolio.dayChangePercent)}) Today</span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center text-center">
            <ShieldCheck className={cn("w-12 h-12 mb-3", portfolio.healthScore > 70 ? "text-success" : "text-warning")} />
            <div className="text-4xl font-display font-bold text-white mb-1">{portfolio.healthScore}</div>
            <p className="text-sm text-muted-foreground">Portfolio Health</p>
            <div className="mt-4 px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-white/80">
              Risk: {portfolio.riskProfile}
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
            <h2 className="text-xl font-display font-bold text-white">Your Holdings</h2>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Trade
            </button>
          </div>

          {isAdding && (
            <div className="p-6 border-b border-white/5 bg-primary/5 animate-in">
              <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Symbol (e.g. RELIANCE)</label>
                  <input {...register("symbol")} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none" />
                  {errors.symbol && <span className="text-destructive text-xs mt-1 block">{errors.symbol.message as string}</span>}
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Quantity</label>
                  <input type="number" step="any" {...register("quantity")} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none" />
                  {errors.quantity && <span className="text-destructive text-xs mt-1 block">{errors.quantity.message as string}</span>}
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Avg Price</label>
                  <input type="number" step="any" {...register("avgPrice")} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none" />
                  {errors.avgPrice && <span className="text-destructive text-xs mt-1 block">{errors.avgPrice.message as string}</span>}
                </div>
                <button type="submit" disabled={addMutation.isPending} className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
                  {addMutation.isPending ? "Adding..." : "Save"}
                </button>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-black/40 border-b border-white/5 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Asset</th>
                  <th className="px-6 py-4 font-medium text-right">Qty</th>
                  <th className="px-6 py-4 font-medium text-right">Avg Price</th>
                  <th className="px-6 py-4 font-medium text-right">LTP</th>
                  <th className="px-6 py-4 font-medium text-right">Current Value</th>
                  <th className="px-6 py-4 font-medium text-right">P&L</th>
                  <th className="px-6 py-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {portfolio.holdings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No holdings found. Add your first trade above.
                    </td>
                  </tr>
                ) : (
                  portfolio.holdings.map((h) => (
                    <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{h.symbol}</div>
                        <div className="text-xs text-muted-foreground">{h.name}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-white font-medium">{h.quantity}</td>
                      <td className="px-6 py-4 text-right text-white">₹{h.avgPrice}</td>
                      <td className="px-6 py-4 text-right font-medium text-white">₹{h.currentPrice}</td>
                      <td className="px-6 py-4 text-right font-bold text-white">{formatCurrency(h.currentValue)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className={cn("font-bold", h.gainLoss >= 0 ? "text-success" : "text-destructive")}>
                          {formatCurrency(h.gainLoss)}
                        </div>
                        <div className={cn("text-xs", h.gainLoss >= 0 ? "text-success" : "text-destructive")}>
                          {formatPercent(h.gainLossPercent)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => removeHolding(h.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
