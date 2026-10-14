// 📖 Docs: obsidian/frontend/components/common.md

import Link from "next/link";

import { PRIVACY_POLICY_URL } from "@/lib/legal";

export interface PrivacyPolicyLinkProps {
  /** Utilities for the anchor. The plain-text fallback takes none of them. */
  className?: string;
  /** The words themselves — the sentence around them decides the case. */
  children: React.ReactNode;
}

/**
 * *privacy policy*, linked only where there is a policy to link to.
 *
 * Both consent surfaces said `/privacy-policy`, which was never built — a
 * underlined phrase that 404s in the one place on a site where a visitor is
 * being asked to trust it. `PRIVACY_POLICY_URL` (`lib/legal.ts`, not
 * `siteConfig`: that module reads the env schema, and these callers are client
 * leaves) is `null` until the page exists; until then the phrase is plain text, and the sentence still
 * reads. A server component: it holds nothing, and both callers are already
 * client leaves that do not need it to be one.
 */
export const PrivacyPolicyLink = ({
  className,
  children,
}: PrivacyPolicyLinkProps) =>
  PRIVACY_POLICY_URL ? (
    <Link
      href={PRIVACY_POLICY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </Link>
  ) : (
    <>{children}</>
  );
