# Frontend Design System

The frontend uses a custom-made design system built directly in the Next.js
application. It is intentionally lightweight: reusable React components,
shared Tailwind theme tokens, a consistent typography setup, and project-owned
icons.

## Design Tokens

The shared color palette is defined in `frontend/app/globals.css` through
Tailwind theme variables. It includes:

- background tokens: `bg-primary`, `bg-secondary`, `bg-tertiary`, `bg-hover`
- text tokens: `text-primary`, `text-secondary`, `text-tertiary`, `text-muted`,
  `text-dimmed`
- border tokens: `border-strong`, `border-default`, `border-subtle`
- accent and semantic tokens: `accent-blue`, `accent-green`, `accent-purple`,
  `danger`, `away`
- button tokens: `btn-primary-bg`, `btn-primary-text`

The same file also defines the light theme overrides through `:root.light`, so
components can keep the same token names across dark and light modes.

## Typography

Typography is configured in `frontend/app/layout.tsx` with the Geist and
Geist Mono font families from `next/font/google`. The global font variables are
then exposed to Tailwind in `frontend/app/globals.css` as `--font-sans` and
`--font-mono`.

Most components use a compact product UI scale with explicit text sizes,
medium weights for labels and actions, and muted text tokens for secondary
metadata.

## Icons

Navigation and panel icons are custom React SVG components:

- `components/icons/NavIcons.tsx`
- `components/icons/PanelToggleIcon.tsx`

The application also has a reusable brand mark in `Logo42.tsx`.

## Reusable Components

The component layer contains more than ten reusable UI components used across
pages and feature areas:

- `Avatar`
- `Sidebar`
- `Post`
- `ConfirmModal`
- `ConfirmActionModal`
- `TermsAcceptanceModal`
- `FriendsList`
- `FriendsPanel`
- `FriendPopover`
- `UserActionMenu`
- `SettingsPopup`
- `MessageComposer`
- `MessageNotificationsProvider`
- `CohortStatsPanel`
- `NewChannelCard`
- `InterestPickerModal`
- `GameModal`
- `ActivityCard`
- `ChannelHeader`
- `ChannelComposer`
- `ChannelAboutPanel`
- `ChannelInviteModal`
- `ChannelSystemEvent`
- `FallingPattern`

These components share the same visual language: token-based colors, compact
spacing, rounded controls, subtle borders, hover states, and consistent
typography.

## Structure

- `components/`: reusable application and layout components
- `components/channel/`: reusable channel-specific components
- `components/icons/`: custom SVG icon components
- `components/ui/`: small visual UI primitives

