# Test-period rollout

The user authorized phone-free registration for testing on 2026-10-16. SIGNUP_REQUIRE_PHONE defaults to false. Phone fields and verification controls are hidden, and the server stores no phone or phoneVerifiedAt even if supplied by a client. Address-based onboarding, existing data, and real member sessions remain enabled. To require SMS later set SIGNUP_REQUIRE_PHONE=true together with the three SOLAPI credentials below.

# Verified phone signup and regional introduction

Prepared for the existing Railway service. SMS-specific requirements below apply only when SIGNUP_REQUIRE_PHONE=true.

## Configuration
Set these as Railway service secrets (never commit or paste into source):
- SOLAPI_API_KEY
- SOLAPI_API_SECRET
- SOLAPI_SENDER: sender number registered with SOLAPI, digits only.

Provider API: https://solapi.com/developers/api/messages
Provider authentication: https://solapi.com/developers/api/authentication-api-key
Address selection: https://postcode.map.kakao.com/guide

No demo OTP, fallback phone verification, or fabricated scores are included. When SIGNUP_REQUIRE_PHONE=true, missing provider settings prevent new registrations; existing login and accounts remain functional. Set the three variables together and deploy this branch only when the sender is approved and message delivery can be tested. Account credentials must stay in Railway secrets.

## Behavior
- Main /signup routes to agreement, phone verification, address lookup, profile registration.
- OTP valid for five minutes, five verification attempts, 60-second resend delay, five sends/phone/hour and 200 sends/service/day. Session-bound HttpOnly cookie; consumed after successful account creation; verified grant lasts ten minutes.
- Enrollment does not prove legal name, age, or residential ownership; SMS establishes possession of the provided phone only.
- On signup success: existing member system creates the account, issues its session, then navigates to /welcome.
- /api/my-region requires a member session and derives the region from the saved profile, not URL parameters.
- Address lookup normalizes non-autonomous districts to their parent city; Jeju/Sejong local administrative regions use their elected metropolitan leader only.
- Uses existing published leader photos and axes; existing compositeRanking for comparable cohort rank. Missing data displays pending; no leader.score shortcut, hard-coded rank, or fabricated six-axis score.
- Address detail is optional; no signup values persisted in localStorage. Completion/skip returns to the current introduction homepage.
- Existing published/draft/editorial/photos/auth stores are retained. No data migration or reset.

## Verification
npm run build
node tests/signup-flow.mjs
node tests/signup-http.mjs

Tests cover provider protocol success/failure (mocked, no SMS sent), verification bypass, binding, wrong phone, expiry, attempt limit, replay, region normalization, real member session creation, missing rank, route/CSRF/privacy checks, and existing admin login.

Remaining external verification: actual SMS delivery with approved sender and browser address-popup/animation QA. Signup terms text is a proposed service-specific draft and should be reconciled with the operator's final policies before activation.
