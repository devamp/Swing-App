# Play Map implementation

Play Map uses the existing React Navigation bottom tabs, `react-native-maps` provider (Apple Maps on iOS, Google Maps on Android), Swing theme, Paper buttons, Profile's `SelectableChip`, and Dashboard's `CompactMatchCard`. No dependencies or backend credentials were added. Expo SDK 56's versioned map and location documentation was consulted before implementation.

## Backend replacement

Implement `PlayMapService` in `src/services/playMap/types.ts`, then replace the exported `playMapService` adapter in `src/services/playMap/service.ts`. Operations are `search`, `getMatch`, `getHostedMatches`, `invite`, and `createMatch`. The Play Map flow never calls the existing Firebase/auth/court services. Existing Dashboard/Profile/CreateMatch flows are unchanged.

`fixtures.ts` contains local Portland-area venues and coarse neighborhood centers, both sports, shared-coordinate results, nearby clusters, different skill/availability combinations, and future/full/expired hosted-match cases. Dates are relative to service initialization. Mock creates/invites are session-only and reset on reload. Invitations are idempotent and do not reserve spots. Hosted eligibility means future, same sport, open spots, owned by the mocked host.

`model.ts` owns deterministic filtering, distance calculation, stable distance/ID ordering, and marker clustering. Search respects the committed map bounds AND the distance limit measured from the search center. Exact coordinates stay together at every zoom. Nearby screen-space groups separate as the map zooms. Clustering does not remove list results. Player coordinates must remain approximate when replacing the service.

`state.ts` stores each mode's filters, camera, committed search area, results, selection, and location group separately. Detail routes leave the Play Map screen mounted. Camera movements do not fetch; Search this area commits them. Explicit filter/area choices, Retry, and Expand Search Area also fetch. Stale asynchronous search responses are ignored.

The separate `PlayMapMatchDetail` and `PlayMapCreateMatch` stack routes deliberately use only this service; the pre-existing real match routes retain their behavior. Returning from mock creation reopens the originating player preview. The new match is then eligible in its invite chooser.

Device location is requested only through an explicit recenter/use-current-location action with `expo-location`. No location is sent to a backend. If unavailable or denied, the area sheet offers local city search and manual area choices; users can also move the map. Existing map tile traffic remains managed by the map provider.

## Development scenarios

Set `EXPO_PUBLIC_PLAY_MAP_SCENARIO` in your local environment before starting Metro, or in `.env.local`, then restart/reload the app. There are no developer controls in the user interface.

| Value | Behavior |
| --- | --- |
| `success` (default) | 650ms loading, populated results, successful mutations |
| `slow` | 8-second responses for loading verification |
| `empty` | Both discovery modes return no results |
| `error` | First search fails; Retry succeeds |
| `location-unavailable` | Device location unavailable; manual areas still work |
| `no-hosted` | No eligible hosted matches initially; creating one enables invitations |
| `invite-error` | First invitation fails; retrying the same action succeeds |
| `create-error` | First creation fails; retrying succeeds |

Example: `EXPO_PUBLIC_PLAY_MAP_SCENARIO=error npm start`.

## Verification

Run `node --test tests/*.test.cjs`, `npx tsc --noEmit`, and `npx expo export --platform ios --output-dir /tmp/swing-play-map-export`.

Automated coverage: both discovery modes; sport/skill/distance/date/time/availability filters; empty intersections; camera bounds and expansion; stable ordering; exact-coordinate grouping at four zoom levels; nearby cluster separation; all results retained; independent mode state and committed search; async loading; empty/error/retry scenarios; eligible hosted matches; details; idempotent invites; create/invite failures and retry; creation from no-hosted state.

Native review checklist:

- Switch modes, change filters, open/return from details: camera, filters, group, and selection persist.
- Tap a single marker: its card is selected and scrolled into view. Tap a card: its marker is highlighted and details/preview opens.
- Tap a count marker: location heading/count, every member, and All matches/players remain available. Zoom in: nearby locations separate, identical ones remain grouped.
- Drag the handle through all three positions; also use its tap and accessibility expand/collapse actions. Scroll results independently. Bottom tabs remain unobscured.
- Pan: results remain unchanged until Search this area. Recenter, choose a city manually, and expand an empty search.
- Invite: eligible chooser → sending → confirmation. No-hosted: create → return to preview → invite.
- Exercise all scenario values above, and verify larger text on both platforms.

Native map rendering is iOS/Android only, matching the existing app. Android interaction and device-specific font scaling still require device QA.
