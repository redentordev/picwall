import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-zinc-400">Last updated: March 28, 2025</p>
          </div>

          <div className="space-y-6">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">1. Introduction</h2>
              <p className="text-zinc-300">
                Welcome to Picwall (&quot;we,&quot; &quot;our,&quot; or
                &quot;us&quot;). By accessing or using our services, you agree
                to be bound by these Terms of Service (&quot;Terms&quot;).
                Please read these Terms carefully.
              </p>
              <p className="text-zinc-300">
                By accessing or using Picwall, you agree to these Terms. If you
                do not agree to these Terms, you may not access or use our
                services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">2. Using Picwall</h2>
              <p className="text-zinc-300">
                You must be at least 13 years old to use Picwall. By using
                Picwall, you represent and warrant that you meet all eligibility
                requirements we outline in these Terms.
              </p>
              <p className="text-zinc-300">
                You are responsible for maintaining the confidentiality of your
                account credentials and for all activities that occur under your
                account. You agree to notify us immediately of any unauthorized
                use of your account.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">3. User Content</h2>
              <p className="text-zinc-300">
                You retain ownership rights to the content you post on Picwall.
                However, by posting content, you grant us a non-exclusive,
                royalty-free, transferable, sublicensable, worldwide license to
                use, display, reproduce, and distribute your content on Picwall.
              </p>
              <p className="text-zinc-300">
                You represent and warrant that you own or have the necessary
                rights to the content you post, and that your content does not
                violate the rights of any third party or any applicable laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">4. Prohibited Conduct</h2>
              <p className="text-zinc-300">
                You agree not to engage in any of the following prohibited
                activities:
              </p>
              <ul className="list-disc pl-6 text-zinc-300 space-y-2">
                <li>Violating any laws or regulations</li>
                <li>
                  Posting content that is illegal, harmful, threatening,
                  abusive, harassing, defamatory, or otherwise objectionable
                </li>
                <li>Impersonating any person or entity</li>
                <li>
                  Interfering with or disrupting the services or servers
                  connected to Picwall
                </li>
                <li>
                  Attempting to gain unauthorized access to any part of Picwall
                </li>
                <li>
                  Using Picwall for any commercial purposes without our prior
                  written consent
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">
                5. Intellectual Property
              </h2>
              <p className="text-zinc-300">
                Picwall and its original content, features, and functionality
                are owned by us and are protected by international copyright,
                trademark, patent, trade secret, and other intellectual property
                laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">6. Termination</h2>
              <p className="text-zinc-300">
                We may terminate or suspend your account and access to Picwall
                immediately, without prior notice or liability, for any reason,
                including if you breach these Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">
                7. Disclaimer of Warranties
              </h2>
              <p className="text-zinc-300">
                Picwall is provided &quot;as is&quot; and &quot;as
                available&quot; without any warranties of any kind, either
                express or implied.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">
                8. Limitation of Liability
              </h2>
              <p className="text-zinc-300">
                In no event shall we be liable for any indirect, incidental,
                special, consequential, or punitive damages, including loss of
                profits, data, or goodwill, arising out of or in connection with
                your access to or use of Picwall.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
              <p className="text-zinc-300">
                We reserve the right to modify or replace these Terms at any
                time. If a revision is material, we will provide at least 30
                days&apos; notice prior to any new terms taking effect.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">10. Contact Us</h2>
              <p className="text-zinc-300">
                If you have any questions about these Terms, please contact us
                at support@picwall.example.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
