import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-in text-center p-8">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,59,48,0.2)]">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-display font-bold text-white">404 - Not Found</h1>
        <p className="text-muted-foreground max-w-md">
          The market data or page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/" 
          className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
        >
          Return to Dashboard
        </Link>
      </div>
    </Layout>
  );
}
