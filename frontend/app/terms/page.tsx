import Link from "next/link";
import Logo42 from "@/components/Logo42";

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-full justify-center overflow-y-auto p-7">
      <div className="w-full max-w-[680px] py-8">
        <Link
          href="/"
          className="mb-10 flex items-center gap-2.5 text-base font-medium tracking-tight text-text-primary"
        >
          <Logo42 className="h-[22px] w-auto" />
          <span>Connect</span>
        </Link>

        <h1 className="mb-2 text-[26px] font-bold tracking-tight">
          Terms of Service
        </h1>
        <p className="mb-8 text-[13px] text-text-muted">
          Last updated: April 4, 2026
        </p>

        <div className="space-y-6 text-[14px] leading-relaxed text-text-secondary">
          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using 42 Connect (&quot;the Platform&quot;), you
              agree to follow these Terms of Service. If you do not agree
              to these terms, you must not use the platform. These terms
              outline the rules and guidelines for using the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              2. Eligibility
            </h2>
            <p>
              42 Connect is available exclusively to active students and alumni
              of the 42 school network. You must authenticate using your
              official 42 intra account. Creating accounts through any other
              means is prohibited. We reserve the right to verify your
              eligibility and suspend accounts that do not meet these criteria.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              3. User Accounts
            </h2>
            <p>
              Your account is created automatically when you sign in via
              42 OAuth. You are responsible for all activity that occurs under
              your account. You must not share your login credentials or allow
              others to access your account. Notify us immediately if you
              suspect unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              4. Acceptable Use
            </h2>
            <p className="mb-2">When using 42 Connect, you agree not to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Post content that is illegal, harassing, threatening,
                defamatory, discriminatory, or otherwise objectionable.
              </li>
              <li>
                Impersonate other users or misrepresent your identity or
                affiliation.
              </li>
              <li>
                Share spam, unsolicited advertising, or promotional content
                unrelated to the 42 community.
              </li>
              <li>
                Attempt to gain unauthorized access to other accounts, the
                platform infrastructure, or connected systems.
              </li>
              <li>
                Use automated tools (bots, scrapers) to access the platform
                without prior written permission.
              </li>
              <li>
                Upload malicious software, viruses, or content designed to
                disrupt the platform.
              </li>
              <li>
                Violate any applicable laws, regulations, or third-party
                rights.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              5. User Content
            </h2>
            <p>
              You retain ownership of the content you post on 42 Connect. By
              posting content, you grant the platform a non-exclusive,
              worldwide, royalty-free license to display, distribute, and store
              your content as necessary to operate and improve the service.
              You are solely responsible for the content you post and must
              ensure it complies with these terms and applicable laws.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              6. Channels and Projects
            </h2>
            <p>
              Channels are community spaces organized around shared interests.
              Projects allow users to form teams and collaborate. Channel creators
              and project leads may set additional guidelines for their spaces.
              The platform reserves the right to remove channels or projects that
              violate these terms or are used for purposes contrary to the
              spirit of the 42 community.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              7. Messaging
            </h2>
            <p>
              Direct messages are private between participants. The platform
              does not actively monitor private messages but reserves the right
              to investigate reports of abuse. Messages may be retained on our
              servers for the duration described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              8. Moderation and Enforcement
            </h2>
            <p>
              We reserve the right to remove content, restrict features, or
              suspend accounts that violate these terms. Moderation decisions
              may include warnings, temporary restrictions, or permanent bans
              depending on the severity and frequency of violations. Users may
              appeal moderation decisions by contacting us.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              9. Intellectual Property
            </h2>
            <p>
              The 42 Connect platform, including its design, code, logos, and
              branding, is the property of the 42 Connect team. The 42 logo
              and name are trademarks of 42 school. You may not reproduce,
              distribute, or create derivative works from the platform without
              prior written permission.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              10. Disclaimer of Warranties
            </h2>
            <p>
              42 Connect is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, express or
              implied. We do not guarantee that the platform will be
              uninterrupted, error-free, or secure. Use the platform at your
              own risk.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              11. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, the 42 Connect team
              shall not be liable for any indirect, incidental, special, or
              consequential damages arising from your use of the platform,
              including but not limited to loss of data, loss of profits, or
              interruption of service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              12. Changes to These Terms
            </h2>
            <p>
              We may modify these Terms of Service at any time. Material
              changes will be communicated through the platform at least 14
              days before they take effect. Your continued use of the platform
              after changes become effective constitutes acceptance of the
              revised terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              13. Governing Law
            </h2>
            <p>
              These terms are governed by applicable French law. As a school
              project, disputes should be resolved amicably through direct
              communication with the 42 Connect team.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              14. Contact
            </h2>
            <p>
              For questions about these Terms of Service, contact the
              42 Connect team at{" "}
              <a
                href="mailto:42connect.contact@gmail.com"
                className="font-medium text-accent-blue hover:underline"
              >
                42connect.contact@gmail.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-border-default pt-5 text-[12px] text-text-muted">
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-text-secondary">
              Privacy Policy
            </Link>
            <Link href="/login" className="hover:text-text-secondary">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
