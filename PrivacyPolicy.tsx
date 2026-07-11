import AppLayout from "@/components/AppLayout";
import { Lock } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <AppLayout>
      <div className="container py-12 max-w-3xl">
        <div className="flex items-center gap-3 mb-8 border-b border-border pb-8">
          <Lock className="w-6 h-6 text-primary" />
          <h1 className="font-display text-4xl font-black uppercase">Privacy Policy</h1>
        </div>

        <div className="space-y-8 font-mono text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">1. Information We Collect</h2>
            <p>
              Applied Energetics collects information you provide directly, including:
            </p>
            <ul className="space-y-1 mt-2 ml-4">
              <li>• Account information (name, email, password)</li>
              <li>• Profile data (sport, experience level, training goals)</li>
              <li>• Session data (protocols used, duration, perceived exertion, notes)</li>
              <li>• Health data (if you connect Apple Health, Google Health Connect, or Samsung Health)</li>
              <li>• Payment information (processed securely by Stripe)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul className="space-y-1 mt-2 ml-4">
              <li>• Provide and improve the Applied Energetics service</li>
              <li>• Personalize your experience and recommendations</li>
              <li>• Process payments and manage subscriptions</li>
              <li>• Send service updates and announcements</li>
              <li>• Correlate health data with breathwork sessions for insights</li>
              <li>• Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">3. Health Data Privacy</h2>
            <p>
              If you connect health platforms, Applied Energetics may access:
            </p>
            <ul className="space-y-1 mt-2 ml-4">
              <li>• Heart rate and respiratory rate data</li>
              <li>• Heart rate variability (HRV)</li>
              <li>• Blood oxygen saturation (SpO2)</li>
              <li>• Workout and exercise data</li>
            </ul>
            <p className="mt-3">
              This data is used solely to correlate with your breathwork sessions and provide personalized insights. We do not sell, share, or use this data for advertising purposes. You may revoke access at any time through your device settings.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="space-y-1 mt-2 ml-4">
              <li>• Encryption in transit (HTTPS/TLS)</li>
              <li>• Encryption at rest for sensitive data</li>
              <li>• Secure authentication and session management</li>
              <li>• Regular security audits and updates</li>
            </ul>
            <p className="mt-3">
              However, no security system is impenetrable. We cannot guarantee absolute security of your information.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">5. Data Sharing</h2>
            <p>
              We do not sell, rent, or share your personal information with third parties for marketing purposes. We may share information with:
            </p>
            <ul className="space-y-1 mt-2 ml-4">
              <li>• Service providers (Stripe for payments, cloud hosting providers)</li>
              <li>• Legal authorities if required by law</li>
              <li>• Your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">6. Data Retention</h2>
            <p>
              We retain your account data as long as your account is active. Session and health data is retained for historical analysis and trend tracking. You may request deletion of your account and associated data at any time through your profile settings.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">7. Your Rights</h2>
            <p>
              You have the right to:
            </p>
            <ul className="space-y-1 mt-2 ml-4">
              <li>• Access your personal data</li>
              <li>• Correct inaccurate information</li>
              <li>• Request deletion of your account and data</li>
              <li>• Revoke health platform permissions</li>
              <li>• Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">8. Third-Party Links</h2>
            <p>
              Applied Energetics may contain links to third-party websites. We are not responsible for the privacy practices of external sites. Please review their privacy policies before providing personal information.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">9. Children's Privacy</h2>
            <p>
              Applied Energetics is not intended for users under 18. We do not knowingly collect information from children under 18. If we become aware that a child has provided us with personal information, we will delete such information immediately.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">10. Policy Changes</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this policy. Your continued use of Applied Energetics constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold uppercase text-foreground mb-3">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our privacy practices, please contact us through the Applied Energetics website.
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
