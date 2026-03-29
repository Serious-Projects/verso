import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/10 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo-mark.svg" alt="Verso" width={24} height={24} />
          <span className="text-sm font-bold tracking-tight">Verso</span>
        </Link>
      </nav>

      <article className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-[-0.03em]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground/60">Last updated: 29 March 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">1. Data Storage</h2>
            <p>
              Verso currently stores all your data locally in your browser using localStorage.
              No data is sent to any server. Your pages, databases, and settings remain entirely
              on your device.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">2. No Account Required</h2>
            <p>
              Verso does not require you to create an account, provide an email address, or share
              any personal information to use the application.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">3. Analytics</h2>
            <p>
              We may use privacy-respecting analytics (such as Vercel Analytics) to understand
              general usage patterns. These do not track individual users or collect personal data.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">4. Third-Party Services</h2>
            <p>
              Verso is hosted on Vercel. When you visit our website, Vercel may collect standard
              server logs (IP address, browser type, access times). See{" "}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Vercel&apos;s Privacy Policy
              </a>{" "}
              for details.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">5. Changes</h2>
            <p>
              We may update this policy as Verso evolves (e.g., when we add cloud sync or
              collaboration features). Any significant changes will be communicated on this page.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">6. Contact</h2>
            <p>
              If you have questions about this policy, reach out via our{" "}
              <a href="https://github.com/Serious-Projects/verso/issues" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                GitHub Issues
              </a>.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
