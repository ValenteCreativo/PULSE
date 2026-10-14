/**
 * The privacy policy's address — `null` until the page exists (the author's
 * call: the consent copy reads the phrase as plain text until then).
 *
 * Its own module, not a `siteConfig` read, because the consent banner is a
 * client leaf: `lib/site.ts` reads the validated environment, and importing it
 * from the banner shipped `zod` and the env schema to every visitor's browser.
 * `siteConfig.privacyPolicyUrl` re-exports this value for the server side.
 */
export const PRIVACY_POLICY_URL: string | null = null;
