import AppLayout from "@/components/AppLayout";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <AppLayout>
      <div className="container py-12 max-w-3xl">
        <div className="flex items-center gap-3 mb-8 border-b border-border pb-8">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="font-display text-4xl font-black uppercase">Terms of Service</h1>
        </div>

        <div className="space-y-8 font-mono text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Applied Energetics, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on Applied Energetics for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="space-y-1 mt-2 ml-4">
              <li>• Modify or copy the materials</li>
              <li>• Use the materials for any commercial purpose or for any public display</li>
              <li>• Attempt to decompile or reverse engineer any software contained on Applied Energetics</li>
              <li>• Remove any copyright or other proprietary notations from the materials</li>
              <li>• Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">3. Disclaimer</h2>
            <p>
              The materials on Applied Energetics are provided on an 'as is' basis. Applied Energetics makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">4. Limitations</h2>
            <p>
              In no event shall Applied Energetics or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Applied Energetics, even if we or our authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">5. Accuracy of Materials</h2>
            <p>
              The materials appearing on Applied Energetics could include technical, typographical, or photographic errors. Applied Energetics does not warrant that any of the materials on the website are accurate, complete, or current. Applied Energetics may make changes to the materials contained on the website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">6. Links</h2>
            <p>
              Applied Energetics has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Applied Energetics of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">7. Modifications</h2>
            <p>
              Applied Energetics may revise these terms of service for the website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which Applied Energetics operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">9. Subscription Terms</h2>
            <p>
              Subscription tiers (Free, Pro, Elite) are subject to the following:
            </p>
            <ul className="space-y-1 mt-2 ml-4">
              <li>• Free tier: No payment required, limited features</li>
              <li>• Pro tier: $9/month, recurring billing, cancel anytime</li>
              <li>• Elite tier: $29/month, recurring billing, cancel anytime</li>
              <li>• Cancellation takes effect at the end of your current billing cycle</li>
              <li>• Refunds are not provided for partial months</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">10. Contact</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us through the Applied Energetics website.
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
