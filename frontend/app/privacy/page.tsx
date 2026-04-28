import Link from "next/link";
import Logo42 from "@/components/Logo42";

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mb-8 text-[13px] text-text-muted">
          Last updated: April 4, 2026
        </p>

        <div className="space-y-6 text-[14px] leading-relaxed text-text-secondary">
          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              1. Introduction
            </h2>
            <p>
              42 Connect (&quot;the Platform&quot;) is a social intranet
              designed for students of the 42 school network. This Privacy
              Policy explains how we collect, use, store, and protect your
              personal data when you use our services.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              2. Data We Collect
            </h2>
            <p className="mb-2">
              We collect the following categories of personal information:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="font-medium text-text-primary">
                  Account information:
                </strong>{" "}
                Your 42 intra username, display name, email address, profile
                picture, campus, and coalition data, obtained through the 42
                OAuth authentication system.
              </li>
              <li>
                <strong className="font-medium text-text-primary">
                  Profile data:
                </strong>{" "}
                Interests, bio, and other information you voluntarily add to
                your profile.
              </li>
              <li>
                <strong className="font-medium text-text-primary">
                  Content you create:
                </strong>{" "}
                Posts, messages, comments, room memberships, project
                participations, and other interactions on the platform.
              </li>
              <li>
                <strong className="font-medium text-text-primary">
                  Usage data:
                </strong>{" "}
                Pages visited, features used, timestamps, and device
                information (browser type, operating system) collected
                automatically for analytics and service improvement.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              3. How We Use Your Data
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Providing and maintaining the platform (authentication,
                profiles, messaging, channels, and feed).
              </li>
              <li>
                Suggesting connections and channels based on shared interests and
                campus proximity.
              </li>
              <li>
                Sending notifications about messages, friend requests, and
                activity relevant to you.
              </li>
              <li>
                Improving the platform through aggregated, anonymized usage
                analytics.
              </li>
              <li>
                Ensuring platform security and enforcing our Terms of Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              4. Data Sharing
            </h2>
            <p>
              We do not sell your personal data. Your information may be shared
              in the following limited circumstances:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong className="font-medium text-text-primary">
                  With other users:
                </strong>{" "}
                Your profile information, posts, and room activity are visible
                to other authenticated users of the platform according to your
                privacy settings.
              </li>
              <li>
                <strong className="font-medium text-text-primary">
                  Service providers:
                </strong>{" "}
                We may use third-party hosting and infrastructure services to
                operate the platform. These providers process data on our
                behalf under strict contractual obligations.
              </li>
              <li>
                <strong className="font-medium text-text-primary">
                  Legal requirements:
                </strong>{" "}
                We may disclose data if required by law or in response to valid
                legal requests.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              5. Data Storage and Security
            </h2>
            <p>
              Your data is stored on secured servers used for this school
              project. We implement appropriate technical measures to protect
              your data, including encryption in transit (TLS) and access
              controls. However, no system is completely secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              6. Data Retention
            </h2>
            <p>
              We retain your personal data for as long as your account is
              active. If you delete your account, your personal data will be
              removed within 30 days, except where retention is required by law
              or for legitimate purposes (e.g., resolving disputes). Anonymized
              analytics data may be retained indefinitely.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              7. Your Rights
            </h2>
            <p className="mb-2">
              Under the General Data Protection Regulation (GDPR), you have
              the right to:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Access your personal data and obtain a copy.</li>
              <li>Rectify inaccurate or incomplete data.</li>
              <li>Request deletion of your data (&quot;right to be forgotten&quot;).</li>
              <li>Restrict or object to certain processing of your data.</li>
              <li>Data portability -- receive your data in a structured, machine-readable format.</li>
              <li>Withdraw consent at any time where processing is based on consent.</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at the address listed
              below.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              8. Cookies
            </h2>
            <p>
              42 Connect uses essential cookies required for authentication and
              session management only. We do not use third-party tracking or
              analytics cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Significant
              changes will be communicated through the platform. Continued use
              of the service after changes constitutes acceptance of the
              updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-[16px] font-semibold text-text-primary">
              10. Contact
            </h2>
            <p>
              For questions or concerns about this Privacy Policy or your
              personal data, please contact the 42 Connect team at{" "}
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
            <Link href="/terms" className="hover:text-text-secondary">
              Terms of Service
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
