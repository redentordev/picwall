import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-white hover:text-white/80"
          >
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </div>

        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-zinc-400">Last updated: March 28, 2025</p>
          </div>

          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">1. Introduction</h2>
              <p className="text-zinc-300">
                At Picwall, we respect your privacy and are committed to
                protecting your personal data. This Privacy Policy explains how
                we collect, use, and share information about you when you use
                our services.
              </p>
              <p className="text-zinc-300">
                By using Picwall, you agree to the collection and use of
                information in accordance with this policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">
                2. Information We Collect
              </h2>
              <p className="text-zinc-300">
                We collect several types of information from and about users of
                our platform, including:
              </p>
              <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                <li>
                  Personal information you provide to us (such as name, email
                  address, and username)
                </li>
                <li>Profile information (such as profile pictures and bio)</li>
                <li>Content you post (such as photos, comments, and likes)</li>
                <li>
                  Usage information (such as how you interact with our services)
                </li>
                <li>
                  Device information (such as IP address, browser type, and
                  operating system)
                </li>
                <li>
                  Location information (such as general location based on IP
                  address)
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">
                3. How We Use Your Information
              </h2>
              <p className="text-zinc-300">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Create and maintain your account</li>
                <li>Process transactions</li>
                <li>
                  Send you technical notices, updates, security alerts, and
                  support messages
                </li>
                <li>
                  Respond to your comments, questions, and customer service
                  requests
                </li>
                <li>
                  Communicate with you about products, services, offers, and
                  events
                </li>
                <li>
                  Monitor and analyze trends, usage, and activities in
                  connection with our services
                </li>
                <li>
                  Detect, investigate, and prevent fraudulent transactions and
                  other illegal activities
                </li>
                <li>Personalize your experience</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">
                4. How We Share Your Information
              </h2>
              <p className="text-zinc-300">
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                <li>
                  Other users (such as when you post content or interact with
                  others on our platform)
                </li>
                <li>
                  Service providers (such as companies that help us operate our
                  services)
                </li>
                <li>
                  Business partners (such as when we collaborate on features or
                  promotions)
                </li>
                <li>
                  Law enforcement or other third parties (when required by law
                  or to protect our rights)
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">5. Your Choices</h2>
              <p className="text-zinc-300">
                You have several choices regarding your information:
              </p>
              <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                <li>
                  Account Information: You can update your account information
                  at any time by logging into your account
                </li>
                <li>
                  Privacy Settings: You can adjust your privacy settings to
                  control who can see your content
                </li>
                <li>
                  Marketing Communications: You can opt out of receiving
                  promotional emails from us by following the instructions in
                  those emails
                </li>
                <li>
                  Cookies: Most web browsers are set to accept cookies by
                  default. You can usually choose to set your browser to remove
                  or reject cookies
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">6. Data Security</h2>
              <p className="text-zinc-300">
                We take reasonable measures to help protect your personal
                information from loss, theft, misuse, unauthorized access,
                disclosure, alteration, and destruction.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">
                7. Children&apos;s Privacy
              </h2>
              <p className="text-zinc-300">
                Our services are not intended for children under 13 years of
                age. We do not knowingly collect personal information from
                children under 13.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">
                8. Changes to This Privacy Policy
              </h2>
              <p className="text-zinc-300">
                We may update our Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">9. Contact Us</h2>
              <p className="text-zinc-300">
                If you have any questions about this Privacy Policy, please
                contact us at privacy@picwall.example.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
