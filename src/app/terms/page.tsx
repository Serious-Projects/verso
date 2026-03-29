import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/10 px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo-mark.svg" alt="Verso" width={24} height={24} />
          <span className="text-sm font-bold tracking-tight">Verso</span>
        </Link>
      </nav>

      <article className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-[-0.03em]">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground/60">Last updated: 29 March 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">1. Acceptance</h2>
            <p>
              By using Verso, you agree to these terms. If you disagree with any part, please
              do not use the application.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">2. Service Description</h2>
            <p>
              Verso is an open-source, browser-based workspace application. It provides a block
              editor, database views, and page management tools. All data is stored locally in
              your browser.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">3. Your Data</h2>
            <p>
              You own all content you create in Verso. Since data is stored locally, you are
              responsible for backing up your data. Clearing your browser data will permanently
              delete your Verso content.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">4. No Warranty</h2>
            <p>
              Verso is provided &quot;as is&quot; without warranty of any kind. We do not guarantee
              uninterrupted or error-free operation. Use at your own discretion.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">5. Limitation of Liability</h2>
            <p>
              In no event shall the Verso team be liable for any indirect, incidental, or
              consequential damages arising from your use of the application, including data loss.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">6. Open Source</h2>
            <p>
              Verso is open source. You may view, fork, and contribute to the codebase on{" "}
              <a href="https://github.com/Serious-Projects/verso" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                GitHub
              </a>.
              Contributions are subject to the project&apos;s license.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">7. Changes</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of Verso
              after changes constitutes acceptance of the updated terms.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
