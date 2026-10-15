# Swing App - Updated MVP Scope

Reviewed October 11, 2026. Repository baseline: f121706 plus the existing local Profile.tsx changes.

Update October 15, 2026: Play Map / FindMatches is now a "Coming soon" placeholder. Its previous UI, mock services, fixtures, and detail/create routes have been removed for a clean reimplementation. Play Map implementation references below describe the October 11 baseline; `docs/play-map.md` has also been removed.

MVP SCOPE / 01

## Swing AppUpdated MVP scope

Launch readiness review | October 11, 2026 | Product and engineering scope

### Launch assessment: not ready for a public MVP

Swing has substantial screen and Firebase groundwork, but the core loop is incomplete: a player cannot reliably discover a real game, join it, and manage that commitment. The Play Map currently uses demo data and session-only mutations. [E3-E7]

### What is already built

The app includes tennis and pickleball onboarding, validated email signup/login, an editable playing profile, Firebase-backed hosted match creation and deletion, and a nearby-match Dashboard. The Play Map has a developed map/list interface with filters, clusters, player previews, and invitation states. These are code implementation findings, not production certification.

### What prevents launch

- Disconnected discovery: Dashboard reads Firebase; Play Map reads local fixtures and creates separate temporary matches.

- No participation lifecycle: no real join/leave flow, participant roster, capacity transaction, or joined-match list.

- Incomplete account reliability: reset password is a placeholder; startup auth routing, durable sessions, save failures, and deletion cleanup need work.

- Unverified production controls: deployed database rules, indexes, real court inventory, privacy controls, release signing, and native behavior have not been established by this review.

### Recommended first release

Launch a match-first MVP for one defined local market, using real courts and matches. Include browsing, hosting, direct joining, leaving, and upcoming-game management. Defer player discovery and invitations unless their backend and recipient flows are completed. This is a proposed scope reduction, not a previously approved product decision.

Basis: local repository at commit f121706, including the existing uncommitted Profile.tsx changes. No app source was changed. TypeScript and iOS/Android bundle exports passed. No live backend, signed-build, store-console, or physical-device validation was performed.

MVP SCOPE / 02

## First MVP boundary

Proposed launch contract. These choices keep the first release small and testable.

### Product outcome

A local tennis or pickleball player can create an account, find a suitable upcoming game at a public venue, secure a spot, and see where and when to play. A host can see who is coming and cancel the game when needed.

| Area | Included in the recommended MVP |
| --- | --- |
| Audience and geography | Adult recreational players in one defined Portland-area launch market, aligned with the current geographic fixtures. Confirm the exact service area and audience before implementation. |
| Sports and platforms | Tennis and pickleball. Native iOS and/or Android only after each platform passes release QA. A single-platform pilot is an acceptable schedule reduction; web is deferred. |
| Accounts and profiles | Email/password signup, login, logout, reset password, restored session, editable display name, sport/skill, general area, availability, and account deletion. Initials avatar is sufficient. |
| Discovery and hosting | Real future matches with open spots; sport, skill, area/distance, date and time filters; real court selection; one persistent match creation/detail flow. |
| Participation | Direct join with immediate confirmation, participant roster, atomic capacity limits, leave match, host cancellation, and a My Matches view for hosted and joined games. |
| Trust and operations | Private account data protected; coarse public location only; support/report route, moderation removal process, privacy/terms pages, error visibility, and an owner for launch support. |

### Explicitly deferred

Player directory and player-to-match invitations; chat and direct messages; push notifications and reminders; social login; profile photo uploads; ratings/rankings; payments; court reservations; leagues/tournaments; background or live location; national city search; and a web release.

### Scope rules

- Hide deferred controls from the release build, including the Players mode and invitation flow. Do not ship fixtures or success messages for actions that do not persist.

- Keep fixed venue/time details and in-app match status refresh so players can coordinate without chat or push. Do not offer host editing in this version; cancellation plus recreation is sufficient.

- If player discovery is a launch requirement, add the conditional work on page 7. It increases scope beyond the recommended match-first release.

MVP SCOPE / 03

## Completed implementation

Implemented means present and connected in source. Live behavior still requires the launch checks.

| Capability | Completed in the current project | Refs |
| --- | --- | --- |
| App foundation | Expo SDK 56, React Native 0.85, TypeScript, React Navigation, Paper theme, React Query, splash/assets, and Dashboard / Play Map / Profile tabs. | E1, E2 |
| Onboarding screens | Sport selection including both sports; current-location request or Portland selection; 5/10/25-mile radius; skill and play-style selection; result, empty, and signup prompt screens. | E6 |
| Account basics | Firebase email/password signup and login, input validation, password visibility, display-name creation, and persisted user preference document. Logout is connected. | E3 |
| Profile editing | Read and subscribe to the user document; edit display name, general area, bio, sport skill, game type, play style, typical availability, and availability status; initials avatar. | E4, E10 |
| Host a real match | Firestore court loading and searchable court/map picker; date/time selection; sport, skill, game type, players needed, name and note; future-time validation and Firestore match creation. | E5, E8 |
| View / delete hosted match | Read detail by match ID; host-only delete control and service-side ownership check; transactional deletion with hosted-count decrement and cache invalidation. | E5, E9 |
| Dashboard discovery | Fetch future Firestore matches; filter out own, expired and full matches; calculate viewer-relative distance; show nearest two results and next hosted game; loading/error/retry states. | E5, E7 |
| Play Map interface | Match/player modes; map/list selection; clustering; search-this-area; sport, distance, skill, date/time or availability filters; area selection, recenter, draggable results sheet, empty/error/retry states. | E11-E13 |

### Preserve the useful work

The Play Map interface can be retained while replacing its service adapter. Reuse the real match form and detail route to avoid maintaining two different match systems. Profile editing should be retained after correcting error propagation and data consistency.

Completed screens do not establish that security rules allow the intended requests, that production court records exist, or that signed native binaries behave correctly. These remain verification gates.

MVP SCOPE / 04

## Partial and missing features

This inventory separates visible UI from the backend behavior needed for launch.

| Capability | Current status and gap | Launch treatment |
| --- | --- | --- |
| Play Map data | Demo only. Exported adapter is createMockPlayMapService. Matches and players come from fixtures; creates/invites reset after reload. Runtime default is no-hosted. | Replace match backend. Hide Players. [E11] |
| Join / leave / roster | Missing. Match details display open spots but provide no joining flow. No participant or membership model/service is present. | Required. [E5, E9, E12] |
| My Matches / activity | Partial. My Matches shows an unavailable alert. Upcoming shows only games hosted by the user. Joined/upcoming counters initialize to zero; no lifecycle updates exist. | Required list; derive or hide counters. [E3-E5, E7] |
| Guest discovery | Partial. Reads up to three matches without passing sport, radius or skill criteria; does not enforce future/open status. Host label uses userId. Availability UI is commented out. | Use real matching criteria, public labels and retry state. [E6] |
| Session / reset | Partial. Auth observer exists but is unused by app navigation. Native durable persistence is not explicitly configured. Reset password is an alert. | Required. Verify cold-start sessions. [E2, E3, E14] |
| Save / create integrity | Partial. Profile update catches errors without rethrowing. Match creation and host counter update are separate writes; signup is also a multistep operation. | Required failure recovery and retry safety. [E3-E5] |
| Account deletion | Partial. Deletes one avatar path, Users document and Auth user after recent-login check. Does not clean hosted matches or future memberships; steps can partially fail. | Required cleanup and recovery. [E3, E4] |
| Area / court coverage | Partial. Onboarding manual area is Portland only. Play Map searches four preset areas. Dashboard needs coordinates and has no manual-center path. Live court inventory is unverified. | Support launch area without GPS. [E6-E8, E13] |
| Notifications / invitations | Missing or demo. Dashboard notifications show an unavailable alert. Invite chooser has mock sending/success states with no recipient inbox or acceptance. | Defer and hide. [E7, E11-E13] |
| Production readiness | Unverified. No rules, indexes, test suite, CI or EAS configuration was found in the repository. Android release currently uses debug signing; Maps key configuration is absent. | Complete release gates. [E15-E17] |

Absence of local Firebase or EAS files does not prove those services are unconfigured remotely. Obtain deployed configuration and release evidence before marking them complete.

MVP SCOPE / 05

## Launch work: core product

P0 = required before the first public MVP. Owners below are suggested workstreams, not assigned people.

### B1 - P0 / One real discovery and match system

Current: Dashboard and Play Map use different data models and services. Profile, onboarding and map skill/availability values also differ.

Required: Use canonical match IDs, sport/skill values, timestamps, venue coordinates and membership fields. Implement the real match-mode PlayMapService adapter. Reuse real create/detail routes. Apply criteria consistently in onboarding and authenticated discovery; replace raw host IDs with public display names.

Done when: A game created by account A appears in account B's eligible Dashboard, map and list results, with the same ID and details, after reload. Expired/full/out-of-area games are excluded. No fixture data is reachable in release.

Owner: app + backend. Depends on data contract and B7 access rules. Evidence: E5-E8, E11-E13.

### B2 - P0 / Join, leave and host cancellation

Current: There is no persistent membership or participant action. playersNeeded is a posted number, not a maintained reservation count.

Required: Add direct join and leave, a host-visible roster, one membership per user/match, and explicit open/full/cancelled/expired behavior. Reserve/release capacity atomically and make retries idempotent. Extend host deletion into cancellation visible to existing participants, with a defined retention policy.

Done when: Two users competing for the final spot cannot overbook. Duplicate taps/retries cannot double-join. Leaving releases one spot. Host/self joins, past/full/cancelled joins and unauthorized mutations are rejected. Both users see cancellation.

Owner: backend + app. Depends on B1 schema and B7 rules. Evidence: E5, E9, E12.

### B3 - P0 / My Matches and truthful activity

Current: Only the next hosted match is queried; My Matches is a placeholder and activity does not reflect a full participation lifecycle.

Required: Add hosted and joined upcoming lists, detail navigation, roster and status refresh on focus. Include cancellations so participants can see them. Query or reliably maintain activity totals; hide counters until accurate.

Done when: Host and participant see the same game in their own lists after restart. Leaving removes the active commitment; cancellation is visible. Zero, loading, failed-load and deleted-match states are understandable.

Owner: app + backend. Depends on B2. Evidence: E3-E5, E7, E10.

MVP SCOPE / 06

## Launch work: accounts and data

Complete these reliability fixes even if player discovery and invitations are deferred.

### B4 - P0 / Sessions, routing and recovery

Current: Login/signup navigate directly to Home. Root routes are unconditional; the auth subscription is not used. Reset password is unavailable.

Required: Restore and observe Firebase auth at startup, explicitly configure/verify native persistence, gate authenticated routes and deep links, implement reset email and feedback, and clear user-scoped cached data on logout/account switch.

Done when: Signed-in users relaunch into Home; signed-out users cannot open private screens. Password-reset email restores access. Back navigation and account switching cannot show another user's cached data.

Owner: app. Evidence: E2, E3, E14.

### B5 - P0 / Reliable saves, creation and onboarding

Current: Profile save can report success after a caught write failure. Match creation can persist a game before a failed counter update. Signup can create Auth before a failed profile write.

Required: Propagate profile write errors; make match creation atomic or recoverable and retry-safe. Add signup/profile completion recovery. Give court loading and guest discovery explicit errors/retry. Support a preset manual geographic center in Dashboard and consistent permission-denied behavior.

Done when: Injected write failures never produce a false success message. Retrying cannot create duplicate games or stranded accounts. A player denying GPS can still onboard, browse the launch area and choose a court.

Owner: app + backend. Evidence: E3-E8, E10.

### B6 - P0 / Complete account deletion

Current: Deletion removes the profile before the Auth user and leaves hosted matches untouched. The recent-login branch asks the user to log out and back in.

Required: Define cleanup/anonymization for hosted games, memberships and any future invites. Provide recent-login recovery and an idempotent deletion workflow that can resume after partial failure. Explain the retained-data policy accurately.

Done when: An account with hosted and joined games can be deleted after reauthentication. No discoverable orphan host or stranded reservation remains. A retry after interruption completes safely; private data cannot be read afterward.

Owner: backend + app. Depends on B2. Evidence: E3, E4.

MVP SCOPE / 07

## Launch work: trust and release

P0 gates apply to every launch platform. Conditional scope applies only if those features are retained.

### B7 - P0 / Access rules, privacy and support

Current: Firebase is initialized in the app, but deployed rules/indexes were not inspected. Users documents mix email and preferences, including precise saved coordinates. Public player records are not implemented.

Required: Version and test Firestore/Storage rules and required indexes. Enforce ownership, membership capacity, field validation and private-account access on the backend. Expose only safe public display fields; keep exact user coordinates and email private. Add accessible privacy/terms/support links and a working report/removal process.

Done when: Negative access tests pass for anonymous and unrelated users. Match discovery works with least-privilege reads. Public responses omit private fields. A pilot user can report a match and an operator can remove it.

Owner: backend + product/operations. Evidence: E3-E5, E15. Policy content and store disclosures need owner review.

### B8 - P0 / Native release and launch operations

Current: JS bundles pass, but no signed release or device QA was performed. Android release uses the debug key and no Google Maps key/plugin is configured locally.

Required: Configure release credentials and a repeatable EAS or local build process. For Android, configure the SDK 56 react-native-maps plugin key and signing-certificate restrictions, then rebuild. Verify native/config parity, branding, permission strings, court inventory, store assets/disclosures, support ownership, crash/error visibility and a rollback procedure.

Done when: Each selected platform installs as a signed release without Metro and passes page 8. Maps and permissions work on real devices. Production rules, court data, store configuration and operational ownership have recorded evidence.

Owner: release engineering + QA + operations. Evidence: E8, E15-E17. Expo SDK 56 map deployment guidance: [D2].

### Conditional: keep Players and invitations in the first release

Add real public player discovery with opt-in coarse areas and normalized availability; bind hosted-match eligibility to the signed-in host; persist idempotent invitations; build recipient inbox plus accept/decline/expiry; reserve capacity on acceptance; and add block/report handling. Verify two-account delivery and full/cancelled-match races. The existing mock invite reserves no spots and has no recipient lifecycle. [E11-E13]

For the recommended match-first release, hide this entire path. Push delivery and chat remain deferred; recipient actions would still require a persistent in-app inbox if invitations are included.

MVP SCOPE / 08

## Release acceptance checklist

A public MVP is ready when the selected scope passes these gates with recorded results.

| Gate | Required acceptance evidence |
| --- | --- |
| 1. Real end-to-end loop | Account A signs up and hosts a game at a seeded real court. B finds it with valid filters, joins, sees confirmation and My Matches. A sees B on the roster. Both restart and retain the same state. |
| 2. Capacity and cancellation | Run simultaneous last-spot joins, duplicate retries, leave/rejoin, past/full joins and host cancellation. Confirm one reservation per user, accurate spots and visible cancellation in both accounts. |
| 3. Accounts and data | Exercise reset password, cold-start sessions, logout/back/deep links, account switch, profile write denial, signup partial failure and deletion with games. Verify rule-denied reads/writes directly. |
| 4. Discovery and location | Test both sports, skill, radius/map bounds and date/time boundaries; empty results; denied/blocked/unavailable GPS; preset manual area; court-load failure; expired/full records; and cross-screen data consistency. |
| 5. Native usability | Test signed release builds on physical devices for each launch OS. Check maps, marker/list selection, filters, keyboard, safe areas, small screens, large text, screen-reader labels, offline/slow requests and retries. |
| 6. Operational release | Verify live courts and supply of games in the launch area, privacy/support URLs, report response, store assets/disclosures, production access rules/indexes, release credentials, crash visibility and rollback owner. |

### Delivery order and handoff

First: confirm match-first vs full player scope, market, platforms and direct-join policy. Freeze the canonical data contract and access rules (B1/B7).Then: implement real map discovery, participation and My Matches (B1-B3); complete account/data fixes (B4-B6) alongside them.Finally: remove deferred/demo paths, seed production courts, run negative/race tests and device QA, produce signed releases and complete operational signoff (B8).

### Pilot measurement

Track onboarding completion, signup-to-first-join conversion, time to first join, games hosted, games gaining participants, join/save failure rates and support reports. Set numeric pilot targets and assign product, engineering, QA and support signoff owners before inviting the cohort; no targets or dates were supplied for this review.

The schedule should be estimated after the B1/B2 schema and participation policy are agreed. A launch date or completion percentage would be speculative from repository evidence alone.

MVP SCOPE / 09

## Verification and evidence

Audit record and source map for future updates. Paths are relative to the repository root.

| Check performed | Result and limitation |
| --- | --- |
| TypeScript | PASS - ./node_modules/.bin/tsc --noEmit. No compile errors in the reviewed working tree. |
| iOS export | PASS - expo export --platform ios. Hermes bundle generated, 1,266 modules. This is not an Xcode build, signed archive or device test. |
| Android export | PASS - expo export --platform android. Hermes bundle generated, 1,266 modules. This does not validate Gradle signing or Google Maps rendering. |
| Automated suite / docs | No test files or test script found. docs/play-map.md refers to tests/*.test.cjs and types.ts, but the checkout has no tests directory and uses types.d.ts. It says success is the default; service.ts defaults to no-hosted. Update the guide and restore/add executable coverage. |

Not performed: real Firebase auth/database/storage requests, deployed rules/index inspection, data inventory, signed native builds, store-console review, device UI testing, load testing or analytics verification. Repository gaps are distinguished from external configuration that may already exist.

### Coverage to add before release

- Backend/emulator tests for access rules, ownership, field validation, final-spot contention, duplicate joins, leave/cancel races and idempotent match creation.

- Integration tests for startup auth, reset password, signup recovery, profile write rejection, multi-account cache isolation and resumable account deletion.

- Discovery regression tests for sport/skill mapping, geo bounds, date/time boundaries, future/open eligibility, stale responses and manual location fallback.

- Native acceptance runs for map rendering, markers, sheet gestures, accessibility, app background/restart and slow/offline recovery on the selected release platforms.

### Evidence needed from outside the repository

Collect exported deployed rules/indexes, Firebase authentication settings, seeded venue inventory, build/signing records, real-device test results, store listing/disclosure drafts, and support/monitoring ownership. Attach these to the release checklist and mark each gate with an owner and date.

### Build checks are necessary, but insufficient

The current project compiles and bundles on both native targets. The release decision must also establish that two real accounts can complete the participation loop safely and consistently on signed builds.

MVP SCOPE / 10

## Repository source map

Evidence IDs used throughout the review. Paths are relative to the repository root.

E1 - package.json; ios/Podfile.lockSDK/dependency baseline

E2 - src/App.tsx; src/navigation/index.tsxProviders, root routes, auth routing

E3 - src/services/authService.ts:16,45,69Signup, deletion, unused auth observer

E4 - src/services/userService.ts:10,56,74Profile data, swallowed save error, deletion

E5 - src/services/matchService/matchService.ts:28,96,120,143,208Real match writes, discovery, deletion

E6 - src/navigation/screens/Onboarding/ChooseLocation; SkillAvailability:97; FoundMatches:119,151

E7 - src/navigation/screens/BottomNavBar/Home.tsxNearby discovery, hosted-only upcoming, placeholder actions

E8 - src/navigation/screens/CreateMatch.tsx:584,721; src/services/courtService.tsReal court picker and match submission

E9 - src/navigation/screens/MatchDetail.tsxRead detail, host deletion; no join action

E10 - src/navigation/screens/BottomNavBar/Profile.tsx:418,463,555Includes pre-existing local edits; save and activity behavior

E11 - src/services/playMap/service.ts:13,84; fixtures.tsMock adapter, no-hosted default, session data

E12 - src/services/playMap/types.d.ts; model.ts; state.tsSeparate contracts, filters, clustering, in-memory mode state

E13 - src/navigation/screens/BottomNavBar/FindMatches.tsxAlso src/navigation/screens/PlayMapDetails.tsx and src/components/playMap/: map, mock creation, invitations

E14 - src/navigation/screens/Login.tsx:64; src/services/firebase.ts:22Password reset placeholder; getAuth initialization

E15 - Repository file inventory; README.md; docs/play-map.mdNo rules/indexes/tests/CI/EAS files found; stale guides

E16 - app.config.ts; android/app/src/main/AndroidManifest.xmlLocation/app identity; no Maps key configuration

E17 - android/app/build.gradle:115Release uses signingConfigs.debug

MVP SCOPE / 11

## Review notes and references

Use this document as the launch scope baseline; update statuses as evidence is collected.

### How to interpret status

| Status | Meaning |
| --- | --- |
| Implemented | The behavior is present in source and connected to an actual service where specified. It still needs runtime acceptance and production verification. |
| Partial | Some UI or service behavior is present, but a required step, consistency guarantee, recovery path or integration is incomplete. |
| Demo only | Visible behavior uses local fixtures/in-memory state. It is not a persistent multi-user capability. |
| Missing | No implementation for the behavior was found in the reviewed repository. |
| Unverified | Evidence is outside the local review or no executed check establishes readiness. It may already exist remotely. |

### Decisions for the scope owner

- Recommended: accept match-first launch; hide Players and invitations. If retained, fund and test the conditional scope on page 7.

- Recommended: one launch market with verified tennis and pickleball venues. Keep manual area selection bounded to that market.

- Recommended: direct joining with immediate confirmation. A host-approval policy would require request/pending/accept/decline states and a recipient surface before release.

- To confirm: iOS, Android or a single-platform pilot; launch audience; pilot size and targets; support owner; and release timing.

### Versioned Expo documentation consulted

D1 - Expo SDK 56 referencehttps://docs.expo.dev/versions/v56.0.0/

D2 - Expo SDK 56: react-native-mapshttps://docs.expo.dev/versions/v56.0.0/sdk/map-view/Supports the Android Google Maps plugin/key and release-certificate configuration gate in B8.

D3 - Expo SDK 56: Locationhttps://docs.expo.dev/versions/v56.0.0/sdk/location/

### Document maintenance

This scope supersedes the starter-template README as the product readiness summary; docs/play-map.md remains a feature implementation guide with the corrections noted on page 9. The editable companion is docs/mvp-scope.md. Recheck status after backend integration and signed-device QA rather than treating passed bundle exports as launch approval.
