---
title: Content Tracking - Screen States & UI Specifications
description: Detailed UI specifications for all content tracking screens, states, and interactions
feature: Content Tracking
last-updated: 2025-09-16
version: 1.0.0
related-files:
  - README.md
  - user-journey.md
  - implementation.md
  - ../../design-system/style-guide.md
dependencies:
  - Design system color palette and typography
  - Component library specifications
  - Platform-specific interaction patterns
status: approved
---

# Content Tracking - Screen States & UI Specifications

## Overview

This document provides comprehensive visual specifications for all content tracking screens, states, and interactions. Every specification references the established design system and provides detailed implementation guidance for developers.

## Table of Contents

1. [Quick Add Interface](#quick-add-interface)
2. [Tracking Dashboard](#tracking-dashboard)
3. [Content Detail & Progress](#content-detail--progress)
4. [Status Management](#status-management)
5. [Personal Organization](#personal-organization)
6. [Social Tracking Features](#social-tracking-features)

---

## Quick Add Interface

### Screen: Content Card Quick Add

**Purpose**: Enable frictionless addition of content to tracking system from any discovery context

#### State: Default Quick Add Button

**Visual Design Specifications**:

**Layout Structure**:
- Positioned on content card top-right corner
- 40×40px touch target (44×44px minimum)
- Floating above content card with subtle drop shadow
- Z-index layered above card content but below modal overlays

**Button Styling**:
- Background: `rgba(220, 20, 60, 0.9)` (Investigation Red with transparency)
- Icon: Plus symbol, 20×20px, `#FFFFFF`
- Border Radius: `50%` (perfect circle)
- Shadow: `0 2px 8px rgba(220, 20, 60, 0.3)`
- Typography: Not applicable (icon-only)

**Interaction Design Specifications**:

**Hover State** (web/desktop):
- Scale: `1.1` transform
- Background: `#DC143C` (full opacity)
- Shadow: `0 4px 12px rgba(220, 20, 60, 0.4)`
- Transition: `150ms cubic-bezier(0.0, 0, 0.2, 1)`

**Pressed State**:
- Scale: `0.95` transform
- Background: `#B91C3C` (darker red)
- Haptic: Light impact (iOS), short vibration (Android)

**Focus State**:
- Outline: `2px solid #1E40AF` offset `2px`
- Maintains all other styling

#### State: Quick Add Menu Expanded

**Visual Design Specifications**:

**Layout Structure**:
- Modal overlay from button origin point
- 280px width, auto height based on content
- Positioned to avoid screen edges with smart repositioning
- Background blur/dim overlay: `rgba(0, 0, 0, 0.4)`

**Menu Styling**:
- Background: `#FFFFFF` (light theme), `#2C2C2E` (dark theme)
- Border Radius: `12px`
- Shadow: `0 8px 32px rgba(0, 0, 0, 0.2)`
- Border: `1px solid #48484A` (dark theme only)
- Padding: `16px`

**Status Option Items**:
- Height: `48px` each
- Padding: `12px 16px`
- Typography: Body (16px), Medium weight (500)
- Icon Size: `24×24px` positioned left with 12px margin
- Hover Background: `rgba(220, 20, 60, 0.08)`

**Status Icons and Colors**:
- **Want to Watch**: Bookmark icon, `#1E40AF` (Evidence Blue)
- **Currently Watching**: Play-circle icon, `#D97706` (Warning Orange)
- **Completed**: Checkmark icon, `#16A34A` (Success Green)
- **On Hold**: Pause icon, `#D97706` (Warning Orange)
- **Abandoned**: X icon, `#737373` (Neutral-500)

**Interaction Design Specifications**:

**Entry Animation**:
- Scale from 0 to 1 with spring easing
- Opacity fade from 0 to 1
- Duration: `250ms`
- Origin: Quick add button position

**Exit Animation**:
- Scale from 1 to 0 with ease-in timing
- Opacity fade from 1 to 0
- Duration: `200ms`

**Option Selection**:
- Immediate visual feedback with color background
- Success animation: checkmark overlay
- Auto-dismiss after 1 second
- Status change reflection on content card

### Screen: Manual Content Addition

**Purpose**: Add content not found in discovery search

#### State: Manual Entry Form

**Visual Design Specifications**:

**Layout Structure**:
- Full-screen modal with header, form, and action area
- Header: 64px height with title and close button
- Form area: Scrollable content with grouped form sections
- Action area: 80px height with primary/secondary buttons

**Form Sections**:
1. **Content Information** (required)
2. **Platform & Availability** (optional)
3. **Personal Metadata** (optional)
4. **Privacy Settings** (optional)

**Input Field Specifications**:

**Content Title Input**:
- Height: `48px`
- Padding: `14px 16px`
- Border: `1px solid #D4D4D4` (default), `#1E40AF` (focus), `#DC143C` (error)
- Border Radius: `8px`
- Typography: Body (16px), Regular (400)
- Placeholder: "Enter content title..."
- Validation: Required, minimum 2 characters

**Content Type Selector**:
- Segmented control, 4 options: Documentary, Series, Movie, Podcast
- Height: `44px`
- Active segment: `#DC143C` background, `#FFFFFF` text
- Inactive segments: transparent background, `#737373` text

**Platform Multi-Select**:
- Chip-based selection interface
- Available platforms displayed as rounded chips
- Selected state: `#DC143C` background, `#FFFFFF` text
- Unselected state: `#E5E5E5` background, `#404040` text
- Height: `36px` per chip, `8px` spacing

**Personal Rating** (optional):
- 5-star rating component
- Star size: `32×32px`
- Unselected: `#D4D4D4` (outline)
- Selected: `#D97706` (filled)
- Half-star support with tap zones

**Interaction Design Specifications**:

**Form Validation**:
- Real-time validation with inline error messages
- Error states: red border + error text below field
- Success states: subtle green checkmark in field
- Required field indicators: red asterisk after label

**Submit Actions**:
- Primary button: "Add to Tracking" - uses primary button styling
- Secondary button: "Save as Draft" - uses secondary button styling
- Success state: Confirmation with content card preview

---

## Tracking Dashboard

### Screen: Main Tracking Overview

**Purpose**: Central hub for all tracked content with status-based organization

#### State: Dashboard Default View

**Visual Design Specifications**:

**Layout Structure**:
- Header: 120px with user greeting and statistics
- Status tabs: 56px horizontal scrollable tab bar
- Content grid: Responsive grid with infinite scroll
- Floating action button: 56×56px bottom-right positioned

**Header Section**:
- Background: Gradient from `#1C1C1E` to `#2C2C2E`
- Padding: `16px` (respects safe areas)
- Typography: H2 for greeting, Body Small for statistics
- User greeting: "Good evening, Sarah" with time-based logic
- Statistics: "15 watching • 42 completed • 238 total"

**Statistics Cards** (horizontal scroll):
- Card size: `160×80px`
- Border radius: `12px`
- Background: `rgba(255, 255, 255, 0.1)` with backdrop blur
- Primary metric: H3 typography, centered
- Label: Caption typography, below metric

**Status Tab Bar**:
- Tabs: Want to Watch, Watching (3), Completed, On Hold, All
- Active tab indicator: 3px bottom border, `#DC143C`
- Badge numbers: circular badges for non-zero counts
- Typography: Body Small, Medium weight

**Content Grid**:
- 2 columns (mobile), 3 columns (tablet), 4+ columns (desktop)
- 16px gutters, 16px margins
- Aspect ratio: 3:4 for poster cards
- Infinite scroll with loading indicators

**Content Card Specifications**:

**Card Structure**:
- Poster image: Full card width, 75% of card height
- Content overlay: Bottom 25% with gradient background
- Status indicator: Top-right corner badge
- Quick actions: Hidden until hover/long-press

**Status Indicator Badges**:
- Size: `24×24px` circle
- Position: Top-right corner, 8px from edges
- Background colors match status system (see Quick Add specs)
- Icon: Status-specific icons, 16×16px, white

**Content Overlay Information**:
- Title: Body typography, Medium weight, 2-line max with ellipsis
- Metadata: Caption typography, Regular weight
- Progress bar (for series): 2px height, full width, `#DC143C` fill
- Rating stars: 16×16px stars, right-aligned

**Interaction Design Specifications**:

**Card Hover State** (desktop):
- Lift effect: `0 8px 24px rgba(0, 0, 0, 0.15)` shadow
- Scale: `1.02` transform
- Quick actions reveal: Slide up from bottom
- Transition: `200ms ease-out`

**Long Press State** (mobile):
- Haptic feedback: Medium impact
- Quick actions overlay: Semi-modal from card position
- Background dim: `rgba(0, 0, 0, 0.5)`
- Card highlight: White border + elevated shadow

**Status Tab Switching**:
- Content grid fade out (200ms) → filter → fade in (300ms)
- Tab indicator slide animation (250ms ease-in-out)
- Maintain scroll position within status groups
- Loading states for slow status switches

#### State: Empty Status View

**Visual Design Specifications**:

**Empty State Layout**:
- Centered content in available space
- Illustration: 120×120px custom True Crime-themed icon
- Spacing: 24px between illustration and text
- Maximum width: 280px for text content

**Empty State Messaging**:
- Primary text: H3 typography, "No content here yet"
- Secondary text: Body typography, status-specific guidance
- Call-to-action: Primary button linking to discovery

**Status-Specific Messages**:
- **Want to Watch**: "Start building your watchlist by exploring new content"
- **Currently Watching**: "When you start watching something, it'll appear here"
- **Completed**: "Finished content will show here with your ratings"
- **On Hold**: "Taking a break from something? It'll be saved here"

### Screen: List Management Interface

**Purpose**: Organize tracked content into custom lists and collections

#### State: My Lists Overview

**Visual Design Specifications**:

**Layout Structure**:
- Header: 80px with "My Lists" title and create button
- List grid: 2×2 grid cards showing list previews
- System lists: Default lists (Want to Watch, etc.) with custom styling
- Custom lists: User-created lists with preview images

**List Card Specifications**:
- Size: Full width, 120px height (mobile)
- Background: Collage of first 4 content posters with overlay
- Overlay gradient: Bottom 50% with dark gradient
- Typography: List name (H4), item count (Caption)
- Corner radius: `12px`

**System List Styling**:
- Background: Solid color matching status (not poster collage)
- Icon: Large status icon, 48×48px, center-positioned
- Special treatment: "Pinned" indicator for quick access

**Create New List Card**:
- Dashed border: `2px dashed #D4D4D4`
- Plus icon: 48×48px, centered
- Typography: "Create New List" centered below icon
- Background: `#FAFAFA` (light theme), `#3A3A3C` (dark theme)

---

## Content Detail & Progress

### Screen: Individual Content Detail

**Purpose**: Comprehensive view of single content item with full tracking controls

#### State: Content Detail Default View

**Visual Design Specifications**:

**Layout Structure**:
- Hero section: 300px height with poster and metadata overlay
- Content tabs: 48px sticky tab bar (Overview, Episodes, Notes, Social)
- Tab content: Scrollable area with tab-specific layouts
- Bottom action bar: 80px with primary tracking actions

**Hero Section**:
- Background: Blurred poster image with dark overlay
- Poster: 120×160px floating left with 16px margin
- Content info: Right side with title, metadata, ratings
- Status badge: Top-right corner, 32×32px
- Platform badges: Horizontal scroll below metadata

**Status & Actions Strip**:
- Background: `rgba(28, 28, 30, 0.95)` with backdrop blur
- Height: 64px with internal padding
- Status dropdown: Current status with chevron
- Progress indicator: Circular progress for series, linear for movies
- Quick actions: Rate, add notes, share icons

#### State: Progress Tracking (Series Content)

**Visual Design Specifications**:

**Episodes Tab Layout**:
- Season selector: Horizontal scrollable chips at top
- Episode list: Vertical list with checkboxes and metadata
- Progress visualization: Season completion rings
- Batch actions: "Mark season complete" floating button

**Episode List Item**:
- Height: 80px with 16px padding
- Checkbox: 24×24px, left-aligned with 16px margin
- Episode info: Title, air date, duration
- Watched indicator: Checkmark and date
- Watch count: Small badge for multiple viewings

**Season Progress Ring**:
- Size: 64×64px positioned top-right of season chip
- Ring color: `#16A34A` (completed), `#D97706` (in-progress), `#D4D4D4` (unwatched)
- Progress text: Episode fraction (e.g., "8/12") centered
- Animation: Progress fills smoothly when episodes marked

**Batch Actions**:
- Floating button: 56×56px, bottom-right with 16px margin
- Action menu: Slide up panel with batch options
- Options: "Mark all watched", "Mark season complete", "Reset progress"

#### State: Personal Notes Interface

**Visual Design Specifications**:

**Notes Tab Layout**:
- Rich text editor: Full-width with formatting toolbar
- Tag input: Chip-based tag system below editor
- Metadata section: Viewing dates, rating, key insights
- Export options: Share or download notes

**Rich Text Editor**:
- Minimum height: 200px, expands with content
- Toolbar: Bold, italic, bullet lists, headers
- Typography: Body size with 1.6 line height for readability
- Placeholder: "Add your thoughts, analysis, or research notes..."

**Tag System**:
- Input field: Type to add new tags or select existing
- Tag chips: Rounded, removable, color-coded by category
- Suggested tags: Based on content metadata and user history
- Examples: "unsolved", "1980s", "podcast-adapted", "victim-focused"

**Metadata Cards**:
- Cards: 3-column grid showing key information
- Viewing history: Dates watched with platform indicators
- Personal rating: Editable star rating with date
- Key insights: Structured highlights and takeaways

---

## Status Management

### Screen: Status Change Interface

**Purpose**: Quick and contextual status updates with batch operations

#### State: Status Selector Modal

**Visual Design Specifications**:

**Modal Layout**:
- Size: 320×400px (mobile), centered positioning
- Background: `#FFFFFF` (light), `#2C2C2E` (dark)
- Border radius: `16px`
- Shadow: `0 16px 48px rgba(0, 0, 0, 0.3)`

**Status Options**:
- Grid layout: 2×3 grid for 5 status options + custom
- Card size: 130×100px per status option
- Visual hierarchy: Icon (32×32px), label (Body), description (Caption)
- Active state: Border + background color matching status

**Status Option Cards**:

**Want to Watch**:
- Icon: Bookmark, `#1E40AF`
- Background: `rgba(30, 64, 175, 0.08)`
- Description: "Plan to watch later"

**Currently Watching**:
- Icon: Play-circle, `#D97706`
- Background: `rgba(217, 119, 6, 0.08)`
- Description: "Actively viewing"

**Completed**:
- Icon: Check-circle, `#16A34A`
- Background: `rgba(22, 163, 74, 0.08)`
- Description: "Finished watching"

**On Hold**:
- Icon: Pause-circle, `#D97706`
- Background: `rgba(217, 119, 6, 0.08)`
- Description: "Taking a break"

**Abandoned**:
- Icon: X-circle, `#737373`
- Background: `rgba(115, 115, 115, 0.08)`
- Description: "Won't continue"

#### State: Bulk Status Operations

**Visual Design Specifications**:

**Selection Mode Activation**:
- Long press on content card enters selection mode
- Selected cards: Blue border + checkmark overlay
- Selection counter: Floating header showing "X items selected"
- Action bar: Slides up from bottom with bulk actions

**Bulk Action Bar**:
- Background: `#1C1C1E` with backdrop blur
- Height: 80px with safe area padding
- Actions: Status change, delete, move to list, export
- Layout: Icon buttons with labels, evenly spaced

**Status Change Flow**:
- Tap "Change Status" → Status selector modal
- Selected status applies to all selected items
- Progress animation: Items update with staggered timing
- Confirmation toast: "15 items moved to Currently Watching"

---

## Personal Organization

### Screen: Custom Lists & Collections

**Purpose**: User-defined organization system for research and categorization

#### State: Create/Edit List Interface

**Visual Design Specifications**:

**List Creation Form**:
- Full-screen modal with step-by-step setup
- Steps: Basic info, content selection, privacy settings
- Progress indicator: Stepped progress bar at top
- Navigation: Back/Next buttons, skip options

**Basic Information Step**:
- List name input: Required field with character counter
- Description input: Optional, rich text editor
- Cover image: Upload or select from content posters
- Category selection: Predefined tags (Research, Recommendations, etc.)

**Content Selection Step**:
- Search interface: Find and add content to list
- Current content: Grid showing already tracked content
- Drag to add: Visual drag-and-drop interface
- Bulk import: Import from other lists or tracking statuses

**Privacy Settings Step**:
- Privacy level: Private, Friends Only, Public
- Collaboration: Allow friends to contribute
- Discovery: Show in public list directory
- Sharing: Generate shareable links

#### State: List Detail View

**Visual Design Specifications**:

**List Header**:
- Cover image: Full-width hero image from list content
- List metadata: Title, description, item count, creation date
- Creator info: Avatar, name, update frequency
- Action buttons: Follow, share, collaborate

**Content Organization**:
- Sortable grid: Drag-and-drop reordering
- Sort options: Added date, rating, title, release date
- Filter options: By status, rating, content type
- View options: Grid, list, timeline layouts

**List Statistics**:
- Progress tracking: How many items user has watched from list
- Community stats: Followers, completions, ratings
- Quality metrics: Average rating, completion rate
- Activity feed: Recent additions and updates

---

## Social Tracking Features

### Screen: Friend Activity Feed

**Purpose**: Privacy-first social discovery through trusted connections

#### State: Activity Feed Default

**Visual Design Specifications**:

**Activity Item Layout**:
- Avatar: 40×40px user profile image
- Content: Activity description with content poster thumbnail
- Timestamp: Relative time (2 hours ago)
- Action buttons: Like, comment, add to list

**Activity Types**:

**Completion Activity**:
- Format: "[Friend] completed [Content Title]"
- Visual: Checkmark icon + content poster
- Rating: Star display if rating was shared
- Privacy: Only shown if friend opted into sharing

**List Creation**:
- Format: "[Friend] created '[List Name]' with [X] items"
- Visual: List cover image or content collage
- Preview: First few items with "and X more"
- Action: "View List" button

**Milestone Achievement**:
- Format: "[Friend] watched their 100th documentary!"
- Visual: Achievement badge + milestone number
- Content: Recently completed content that triggered milestone

#### State: Privacy Controls

**Visual Design Specifications**:

**Privacy Dashboard**:
- Toggle switches: Large, clear on/off controls
- Setting descriptions: Clear explanation of what each setting shares
- Granular options: Separate controls for different activity types
- Privacy preview: "This is how your profile appears to friends"

**Social Settings Options**:
- Share completions: Friends see finished content
- Share ratings: Friends see your ratings and reviews
- Share lists: Friends can discover your public lists
- Activity visibility: Friends see recent activity in feed
- Profile discovery: Profile appears in friend suggestions

**Friend Management**:
- Friend list: All connections with individual privacy controls
- Block/unfollow: Easy removal options
- Friend requests: Pending incoming and outgoing requests
- Find friends: Search by username or import from other platforms

---

## Responsive Design Specifications

### Mobile (320-767px)

**Layout Adaptations**:
- Single-column content grids
- Full-width cards and modals
- Bottom sheet interactions for secondary actions
- Thumb-friendly touch targets (minimum 44×44px)
- Safe area respect for modern devices

### Tablet (768-1023px)

**Layout Adaptations**:
- 2-3 column content grids based on content type
- Side panel navigation for status filtering
- Modal dialogs instead of full-screen overlays
- Hover states for interactive elements
- Keyboard navigation support

### Desktop (1024px+)

**Layout Adaptations**:
- Multi-column layouts with sidebar navigation
- Hover previews and tooltips
- Keyboard shortcuts for power users
- Context menus for advanced actions
- Multiple content panes for research workflows

## Animation & Transition Specifications

### Content State Changes

**Status Update Animation**:
- Duration: `300ms`
- Easing: `cubic-bezier(0.4, 0, 0.6, 1)`
- Properties: Background color, border color, icon
- Sequence: Color change → icon change → badge update

**Progress Updates**:
- Duration: `500ms`
- Easing: Spring animation for natural feel
- Properties: Progress bar/ring fill, percentage text
- Feedback: Haptic pulse on mobile for major milestones

### List Interactions

**Card Addition**:
- Entry animation: Scale from 0.8 to 1.0 with fade in
- Duration: `400ms`
- Stagger: 50ms delay between multiple cards
- Exit animation: Scale to 0.9 with fade out, 200ms

**Drag and Drop**:
- Lift state: Scale 1.05, shadow increase
- Drag state: Follow finger/cursor with slight lag
- Drop animation: Spring back to position
- Invalid drop: Shake animation + haptic feedback

---

This comprehensive screen specification ensures every aspect of the content tracking interface is precisely defined for implementation while maintaining consistency with the established design system and True Crime application requirements.