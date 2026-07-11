import { useLocation, Link } from "wouter";
import AppLayout from "@/components/AppLayout";
import { AlertCircle } from "lucide-react";

export default function CheckoutCancel() {
  const [, navigate] = useLocation();

  return (
    <AppLayout>
      <div className="container py-20 md:py-32 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-primary" />
            </div>
          </div>

          <h1 className="font-display text-5xl font-black uppercase mb-4">
            CHECKOUT CANCELLED
          </h1>

          <p className="font-sans text-lg text-muted-foreground mb-8">
            Your payment was not processed. Your subscription remains unchanged.
          </p>

          <div className="space-y-3">
            <Link href="/pricing">
              <button className="brut-btn-primary w-full text-sm py-3">
                RETURN TO PRICING
              </button>
            </Link>
            <button
              onClick={() => navigate("/dashboard")}
              className="brut-btn-ghost w-full text-sm py-3"
            >
              BACK TO DASHBOARD
            </button>
          </div>

          <p className="font-mono text-xs text-muted-foreground mt-6">
            Questions? Contact support@appliedenergetics.com
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
