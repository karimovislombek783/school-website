# School website abuse and security review

Reviewed 21 October 2026. Production repository: karimovislombek783/school-website. This review uses source inspection, provider settings, normal HTTP requests and rollback-only SQL checks; no live flood or password attack was performed.

## Findings and action

| Surface | Finding | Result |
| --- | --- | --- |
| Staff authentication | Supabase email login, MFA gate and staff membership; public signup and anonymous signin already disabled; email confirmation enabled | Native signin quota tightened from 30 to 10/IP/5 minutes. No public account-creation route was found. CAPTCHA is not claimed enabled |
| Newsletter subscribe | Separate COUNT and INSERT quota operations were vulnerable to simultaneous requests. User-agent was part of the identity and easily varied | Replaced with atomic Postgres reservations. Stable IP identity; 5/IP/hour, 1/email/hour, 200 valid requests/site/day. Global admission bounds counter/subscriber growth |
| Newsletter email | A public caller could repeatedly request confirmation mail; batches had no shared daily app budget or fetch timeout | Combined application budget of 90 attempted recipient deliveries/day across confirmations, campaigns and admin tests; 10-second provider timeout; no unbounded retries. This budget does not include Supabase-auth emails or other websites sharing Resend |
| Large request bodies | Subscription relied on declared Content-Length, which can be omitted | Streamed UTF-8 byte counting stops at 16 KiB; remaining JSON write routes use the bounded parser. Honeypot still returns without DB/email work |
| Staff newsletter mutations | Session/MFA/role present; explicit same-origin check missing | Send, admin POST and PATCH now require same origin. Bulk delivery reserves per 20-recipient group before changing unsubscribe tokens |
| Newsletter outage control | No deployment-time emergency pause | NEWSLETTER_DISABLED=1 stops subscription and outbound delivery, including scheduler campaigns; redeploy required. Set 0/redeploy to resume. Unsubscribe and public pages remain available |
| Dynamic app traffic | No custom Vercel rules present at review start | Published `Bound school dynamic requests`, ID rule_bound_school_dynamic_requests_MSemAo: 120/IP/60 seconds, 429, regex ^/(api(/|$)|(uz|en)/admin(/|$)), no hostname restriction |
| Database privacy | Potential direct browser bypass of application endpoints reviewed | Live audit: every public table has RLS enabled; anon and authenticated cannot SELECT newsletter subscriber table. Anonymous non-published content read denied. Only service_role can call quota RPC |
| Media uploads | Browser normalizes images, but client validation is not the authorization boundary | Live bucket is private; server-enforced maximum 5,242,880 bytes. Storage policies require staff/MFA and per-user folder. A compromised staff account remains a storage-abuse risk; complete upload quotas and malware/content inspection are not claimed |
| Scheduler | Secret-protected, timing-safe comparison, max100 publications/10 newsletters per call | Preserved. Campaign news_id uniqueness prevents duplicate campaign creation. No anonymous scheduler operation permitted |
| Webhook | Signed provider callbacks, 5-minute time check, unique event IDs | Preserved, rejected non-finite timestamps. Declared and actual size bound 1MB. Signature secret remains server-only |
| AI | No school AI generation endpoint found in active routes | The expensive public AI endpoint scenario does not match this codebase |
| Public content | Intended publicly readable, cached published content and signed image URLs | Normal scraping remains possible. Rate limits do not make public pages confidential |

## Live SQL verification

The atomic quota function accepted a two-unit reservation and rejected a subsequent unit against limit two; test changes rolled back. The browser role was denied permission to execute the quota function. All public tables reported RLS enabled. Draft read denial included a permissions denial in the anonymous role simulation. This is not a full penetration test or proof of every staff-role transition.

## Limits and tradeoffs

Fixed windows reset on UTC boundaries and can permit bursts near a reset. The daily admission cap deliberately trades newsletter availability for bounded email/database growth. Someone could exhaust the newsletter allowance; public school pages do not depend on it. Per-IP firewall limits do not stop distributed attacks and do not cover direct Supabase requests. Provider quotas can still cause temporary outages.

Email budget reservations count attempts, including uncertain/time-out sends. A batch needs enough remaining allowance for the entire group; exhausted groups are counted as failed. The existing admin reports completed_with_errors. Large campaigns may exceed the conservative 90-recipient daily application allowance, and are not automatically resumed. Review campaign size in the admin before sending; no real newsletter was sent during this review. Never raise this limit without checking the free provider quota and other sites that share it.

The firewall covers all hostnames for this Vercel project. Supabase login and storage use Supabase's domain, so their own controls still matter. Built-in DDoS mitigation is active; no claim is made that every attack is preventable or that an alert is a spending cap.

## Remaining owner work

- Sign in normally to the school CMS and complete MFA to verify the user journey after deployment. No password/code should be shared in chat.
- CAPTCHA can be added as another login layer if desired; create a separate Turnstile widget for both school domain hostnames. Do not enable Supabase CAPTCHA before integrating the client token.
- Export and encrypt database, private school-media files and configuration; retain copies off-site, then test a restore in isolation. Free-plan backups must not be assumed.
- Review user/staff access periodically, remove departed staff through the normal owner workflow, keep authenticator recovery methods safe, and enable provider-account MFA.
- Review orphan media, pending subscriptions and audit retention with an exact candidate list. No school content, subscriber records or media were bulk-deleted here. The new ephemeral quota table cleans entries expired for two days when a new daily global admission window begins.
