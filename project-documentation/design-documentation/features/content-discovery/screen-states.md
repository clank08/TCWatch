---
title: Content Discovery - Screen States & UI Specifications
description: Detailed UI specifications for discovery dashboard, search results, case browsing, and all discovery interface states
feature: Content Discovery
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

# Content Discovery - Screen States & UI Specifications

## Overview

This document provides comprehensive visual specifications for all content discovery screens, states, and interactions. Every specification prioritizes case-based discovery over platform-first browsing, supporting intelligent search across 200+ platforms while maintaining the investigative aesthetic appropriate for True Crime content.

## Table of Contents

1. [Discovery Dashboard](#discovery-dashboard)
2. [Universal Search Interface](#universal-search-interface)
3. [Case-Based Browsing](#case-based-browsing)
4. [Content Results & Details](#content-results--details)
5. [Platform Integration](#platform-integration)
6. [Social Discovery](#social-discovery)

---

## Discovery Dashboard

### Screen: Discovery Home

**Purpose**: Central hub for content discovery with multiple entry points for different discovery methods

#### State: Dashboard Default View

**Visual Design Specifications**:

**Layout Structure**:
- Header: 80px with search bar and user context
- Quick actions: 120px section with discovery shortcuts
- Trending content: Variable height carousel section
- Browse categories: Grid layout with case-based organization
- Recent activity: Footer section showing user's discovery history

**Header Section**:
- Background: Gradient from `#0A0A0A` to `#1C1C1E`
- Search bar: Prominent central position, 48px height
- User context: Small avatar and notification indicator
- Typography: "Discover True Crime Content" H2, white text
- Safe area: Respects device notches and dynamic islands

**Search Bar Styling**:
- Width: Full width minus 32px margins
- Height: `48px`
- Background: `rgba(255, 255, 255, 0.1)` with backdrop blur
- Border: `1px solid rgba(255, 255, 255, 0.2)`
- Border Radius: `24px` (fully rounded)
- Placeholder: "Search for cases, killers, or content..."
- Icon: Search icon, 20×20px, left-aligned with 16px padding
- Typography: Body (16px), Regular weight

**Quick Action Cards**:
- Layout: Horizontal scroll, 4 visible cards
- Card size: 120×80px per card
- Gap: 12px between cards
- Border radius: `12px`
- Shadow: `0 4px 12px rgba(0, 0, 0, 0.15)`

**Quick Action Types**:

**Trending Cases**:
- Background: Linear gradient `#DC143C` to `#B91C3C`
- Icon: Trending up, 32×32px, white
- Text: "Trending Cases" (Body Small, Bold, White)
- Badge: "12 new" (Caption, White background with red text)

**Platform Browse**:
- Background: Linear gradient `#1E40AF` to `#1E3A8A`
- Icon: Grid, 32×32px, white
- Text: "Browse Platforms" (Body Small, Bold, White)
- Badge: Platform count (Caption)

**Case Directory**:
- Background: Linear gradient `#16A34A` to `#15803D`
- Icon: Folder, 32×32px, white
- Text: "Case Directory" (Body Small, Bold, White)
- Badge: "500+ cases" (Caption)

**Friend Activity**:
- Background: Linear gradient `#D97706` to `#B45309`
- Icon: Users, 32×32px, white
- Text: "Friend Activity" (Body Small, Bold, White)
- Badge: Activity count (Caption)

**Interaction Design Specifications**:

**Search Bar Focus**:
- Border: Changes to `#DC143C` (Investigation Red)
- Background: Transitions to `rgba(28, 28, 30, 0.95)` with increased blur
- Scale: Subtle 1.02 transform
- Transition: `200ms cubic-bezier(0.4, 0, 0.6, 1)`
- Suggestions panel: Slides down from search bar

**Quick Action Hover** (desktop):
- Scale: `1.05` transform
- Shadow: Increases to `0 8px 24px rgba(0, 0, 0, 0.25)`
- Duration: `150ms ease-out`

**Quick Action Press** (mobile):
- Scale: `0.95` transform
- Haptic: Light impact feedback
- Visual: Brief color saturation increase

#### State: Trending Content Carousel

**Visual Design Specifications**:

**Carousel Container**:
- Height: 280px total (240px cards + 40px indicators)
- Horizontal scroll: Momentum scrolling with snap-to-card
- Padding: 16px horizontal margins
- Card gap: 16px between items
- Auto-scroll: 8-second intervals when idle

**Trending Content Cards**:
- Size: 200×240px per card
- Border radius: `16px`
- Background: Content poster with dark overlay gradient
- Shadow: `0 6px 20px rgba(0, 0, 0, 0.3)`
- Overflow: Hidden for clean poster display

**Card Content Layout**:
- Poster image: Full card background, `cover` resize mode
- Gradient overlay: Bottom 60% with `rgba(0, 0, 0, 0.8)` fade
- Content info: Bottom 80px with 16px padding
- Status indicators: Top-right corner positioning

**Card Information Display**:
- Title: H4 typography, white color, 2-line max with ellipsis
- Metadata: Caption typography, `rgba(255, 255, 255, 0.8)`
- Case context: "About Jeffrey Dahmer" subtitle style
- Platform badges: Horizontal row, 24×24px each
- Trending indicator: Fire icon with "Trending" text

**Platform Badge Styling**:
- Size: 24×24px circles
- Background: Platform brand colors with 80% opacity
- Icon: Platform logo, 16×16px, white overlay
- Overlap: -4px horizontal spacing for stack effect
- Max display: 4 badges with "+X more" indicator

**Interaction Design Specifications**:

**Card Selection**:
- Press state: Scale to 0.95 with opacity 0.8
- Release animation: Spring back to original size
- Navigation: Direct to content detail screen
- Transition: Slide transition matching card position

**Carousel Scroll Indicators**:
- Position: Bottom center, 16px from card bottom
- Style: Dot indicators, 8×8px each
- Active dot: `#DC143C` background
- Inactive dots: `rgba(255, 255, 255, 0.3)` background
- Animation: Smooth position changes with scroll

#### State: Browse Categories Grid

**Visual Design Specifications**:

**Grid Layout**:
- Columns: 2 (mobile), 3 (tablet), 4 (desktop)
- Gap: 16px between items
- Margins: 16px screen edges
- Aspect ratio: 1:1 square cards
- Minimum height: 120px per card

**Category Card Structure**:
- Background: Case-themed imagery with dark overlay
- Border radius: `12px`
- Shadow: `0 2px 8px rgba(0, 0, 0, 0.15)`
- Overlay: `rgba(0, 0, 0, 0.6)` for text readability
- Border: None for clean appearance

**Category Types & Styling**:

**Serial Killers**:
- Background image: Subtle forensic/investigation imagery
- Accent color: `#DC143C` for highlights
- Icon: Person silhouette, 40×40px
- Content count: "180 cases available"

**Cold Cases**:
- Background image: File folder/evidence imagery
- Accent color: `#1E40AF` for highlights
- Icon: Folder open, 40×40px
- Content count: "95 unsolved cases"

**By Decade**:
- Background image: Period-appropriate imagery collage
- Accent color: `#D97706` for highlights
- Icon: Calendar, 40×40px
- Content count: "Browse by era"

**Mass Casualties**:
- Background image: News/documentary footage style
- Accent color: `#16A34A` for highlights
- Icon: Warning triangle, 40×40px
- Content count: "45 major cases"

**International**:
- Background image: World map or global imagery
- Accent color: `#7C3AED` for highlights
- Icon: Globe, 40×40px
- Content count: "Global true crime"

**Recently Solved**:
- Background image: Gavel/justice imagery
- Accent color: `#059669` for highlights
- Icon: Check circle, 40×40px
- Content count: "Latest developments"

**Card Content Layout**:
- Icon: Top-left corner, 16px margins
- Title: Center-positioned, H3 typography, white
- Subtitle: Below title, Body Small, `rgba(255, 255, 255, 0.8)`
- Content count: Bottom-right, Caption, accent color

---

## Universal Search Interface

### Screen: Search Results

**Purpose**: Display comprehensive search results across all content types with intelligent filtering

#### State: Search Input Active

**Visual Design Specifications**:

**Search Bar Expanded State**:
- Full screen overlay: `rgba(0, 0, 0, 0.95)` background
- Search bar: Moves to top with 16px margins
- Cancel button: Right-aligned, "Cancel" text
- Voice search: Microphone icon in search bar
- Filter button: Gear icon, right side of search bar

**Search Bar Styling (Expanded)**:
- Height: `56px` (increased from collapsed state)
- Background: `#2C2C2E` solid background
- Border: `2px solid #DC143C` (active state)
- Typography: Body Large (18px) for better readability
- Clear button: X icon when text is present

**Suggestions Panel**:
- Position: Below search bar with 8px gap
- Background: `#2C2C2E` with `rgba(0, 0, 0, 0.1)` border
- Border radius: `12px`
- Max height: 60% of screen height
- Shadow: `0 8px 32px rgba(0, 0, 0, 0.3)`

**Suggestion Categories**:

**Recent Searches**:
- Section header: "Recent Searches" (Caption, `#A1A1A6`)
- Items: Clock icon + search term + remove button
- Max display: 5 most recent searches
- Typography: Body (16px), white text

**Popular Searches**:
- Section header: "Trending Searches" (Caption, `#A1A1A6`)
- Items: Trending icon + search term + case count
- Examples: "Jeffrey Dahmer", "Cold Cases", "Netflix Documentaries"
- Typography: Body (16px), white text

**Auto-Complete**:
- Section header: "Suggestions" (Caption, `#A1A1A6`)
- Items: Search icon + completed term + match highlighting
- Bold highlighting: Matched portions in `#DC143C`
- Real-time updates: As user types

**Suggestion Item Styling**:
- Height: 48px per item
- Padding: 12px horizontal
- Hover/Press: `rgba(220, 20, 60, 0.1)` background
- Icon: 20×20px, `#A1A1A6` color
- Remove button: 16×16px, right-aligned, `#737373`

**Interaction Design Specifications**:

**Search Suggestions Interaction**:
- Tap to select: Suggestion populates search bar
- Remove recent: Swipe left reveals delete button
- Keyboard navigation: Arrow keys to navigate suggestions
- Voice search: Activates speech recognition with visual feedback

**Voice Search Feedback**:
- Microphone animation: Pulsing circle while listening
- Voice levels: Waveform visualization
- Transcription: Real-time text appearing in search bar
- Error handling: "Didn't catch that" with retry option

#### State: Search Results Display

**Visual Design Specifications**:

**Results Layout Structure**:
- Filter bar: 56px sticky header below search
- Results count: Above content grid
- Content grid: Responsive layout with infinite scroll
- Sort options: Dropdown in top-right corner
- No results state: Centered empty state design

**Filter Bar Styling**:
- Background: `rgba(28, 28, 30, 0.95)` with backdrop blur
- Height: 56px with horizontal scroll
- Chip spacing: 8px gaps between filter chips
- Padding: 12px horizontal margins

**Filter Chip Design**:
- Height: 32px
- Border radius: 16px (fully rounded)
- Padding: 8px 12px
- Typography: Body Small (14px), Medium weight

**Filter Chip States**:
- Default: `rgba(255, 255, 255, 0.1)` background, white text
- Active: `#DC143C` background, white text
- Hover: `rgba(255, 255, 255, 0.15)` background (desktop)
- Count indicator: Number badge for active filters

**Results Count Display**:
- Typography: Body Small (14px), `#A1A1A6` color
- Format: "1,247 results for 'jeffrey dahmer'"
- Position: Above content grid, left-aligned
- Loading state: Skeleton animation while searching

**Content Grid Specifications**:
- Columns: 2 (mobile), 3 (tablet), 4+ (desktop)
- Gap: 16px between cards
- Card aspect: 3:4 for poster-style content
- Infinite scroll: Auto-loads more results at 80% scroll

**Search Result Card Design**:
- Background: `#2C2C2E` with subtle border
- Border radius: 12px
- Shadow: `0 2px 8px rgba(0, 0, 0, 0.15)`
- Poster area: 70% of card height
- Info area: 30% of card height with padding

**Card Content Information**:
- Title: H4 typography, white, 2-line max
- Year and type: Caption, `#A1A1A6`, single line
- Platform badges: Row of 24×24px platform icons
- Rating: 5-star display with community average
- Case context: Subtitle showing related case

**Platform Availability Display**:
- Badge count: Maximum 5 platforms shown
- Overflow indicator: "+3 more" text for additional platforms
- User platforms: Highlighted with colored border
- Availability status: Green dot for currently available

#### State: No Results Found

**Visual Design Specifications**:

**Empty State Layout**:
- Centered content: Vertically and horizontally centered
- Illustration: 120×120px custom True Crime search icon
- Spacing: 24px between illustration and text
- Max width: 320px for text content
- Background: Maintains search interface backdrop

**Empty State Messaging**:
- Primary text: H3 typography, "No results found"
- Secondary text: Body typography, search guidance
- Search term display: "No results for '[search term]'" in red
- Suggestion text: Helpful tips for better search results

**Alternative Actions**:
- Refine search: Button to open advanced search
- Browse instead: Link to case directory
- Request content: "Can't find what you're looking for?" link
- Clear filters: If filters are active, prominent clear button

**Search Suggestions**:
- "Try these instead:" header
- List of related searches as tappable chips
- Popular searches: Fallback suggestions
- Spelling suggestions: For potential misspellings

---

## Case-Based Browsing

### Screen: Case Directory

**Purpose**: Organized browsing of True Crime cases with multiple categorization methods

#### State: Case Directory Home

**Visual Design Specifications**:

**Directory Header**:
- Height: 120px with background image
- Background: Collage of case-related imagery with dark overlay
- Title: "Case Directory" H1, white text, center-aligned
- Subtitle: "500+ documented cases" Body, white text
- Search integration: Small search bar at bottom

**Navigation Tabs**:
- Tab bar: 56px height with horizontal scroll
- Tab styling: Underlined active state with `#DC143C`
- Typography: Body Small, Medium weight
- Active indicator: 3px bottom border
- Badge indicators: Case counts for each tab

**Tab Categories**:
- **All Cases**: Complete database view
- **Trending**: Currently popular cases
- **Unsolved**: Open investigations
- **By Era**: Decade-based organization
- **Serial**: Serial killer cases
- **Mass**: Mass casualty events
- **International**: Global cases

**Case Grid Layout**:
- Cards: Variable height based on content
- Spacing: 16px gaps, 16px margins
- Columns: 1 (mobile), 2 (tablet), 3+ (desktop)
- Loading: Skeleton cards during data fetch

**Case Card Structure**:
- Header image: 160px height with case-related photo
- Content area: Variable height with case information
- Footer: Platform availability and content count
- Border radius: 16px for modern appearance

**Case Information Display**:
- Case name: H3 typography, high contrast
- Perpetrator(s): H4 typography, secondary text
- Time period: Caption with era information
- Location: Caption with geographic context
- Status: Badge indicating solved/unsolved
- Content count: Available documentaries/series count

**Status Badge Styling**:
- Solved cases: Green background `#16A34A`
- Unsolved cases: Orange background `#D97706`
- Cold cases: Blue background `#1E40AF`
- Recent developments: Purple background `#7C3AED`
- Size: Fit content with 8px padding

**Platform Count Display**:
- Format: "Available on 12 platforms"
- Typography: Caption, secondary text color
- Icons: Small platform logos in a row
- Overflow: "+X more" for platforms beyond display limit

#### State: Case Detail View

**Visual Design Specifications**:

**Case Hero Section**:
- Height: 300px full-bleed hero image
- Background: Case-related imagery with gradient overlay
- Content overlay: Bottom 40% with case information
- Navigation: Back button, share button, bookmark button

**Hero Content Layout**:
- Case title: H1 typography, white, shadow for readability
- Perpetrator name(s): H2 typography, white
- Key details: Time period, location, status
- Quick stats: Victim count, investigation duration
- CTA button: "View All Content" primary button

**Tabbed Content Section**:
- Tab bar: Sticky below hero, 48px height
- Tab options: Overview, Timeline, Content, Related
- Active indicator: Bottom border with case status color
- Smooth transitions: Between tab content areas

**Overview Tab Content**:
- Case summary: Rich text with key facts
- Key figures: Cards for perpetrator(s), victims, investigators
- Investigation status: Progress indicators and updates
- Related cases: Horizontal scroll of connected cases

**Timeline Tab Layout**:
- Vertical timeline: Left-aligned timestamps
- Event cards: Right-aligned with connecting lines
- Media integration: Photos, documents, evidence
- Interactive elements: Expandable detail sections

**Content Tab Organization**:
- Content types: Segmented control (All, Docs, Series, Movies)
- Grid layout: Consistent with main discovery interface
- Filtering: By platform, year, rating
- Sorting: Relevance, date, rating, platform

**Related Cases Section**:
- Similar cases: Algorithm-based recommendations
- Same perpetrator: Other crimes by same individual
- Same era: Cases from similar time period
- Geographic: Cases from same location/region

**Interaction Design Specifications**:

**Hero Scroll Behavior**:
- Parallax effect: Background image moves slower than content
- Title fade: Hero content fades as user scrolls
- Sticky tabs: Tab bar becomes sticky after hero scroll
- Progress indicator: Shows scroll progress through case content

**Timeline Interactions**:
- Tap to expand: Event cards show detailed information
- Swipe navigation: Swipe between timeline events
- Media zoom: Photos and documents can be examined closely
- External links: References to news articles, court documents

#### State: Case Search & Filter

**Visual Design Specifications**:

**Advanced Search Interface**:
- Modal overlay: Full screen advanced search
- Search sections: Multiple input fields for specific criteria
- Date range: Slider for year selection
- Geographic: Map-based location selection
- Status filter: Checkboxes for case status types

**Search Criteria Fields**:
- Perpetrator name: Text input with autocomplete
- Victim count: Range slider with numeric input
- Location: Geographic search with map
- Time period: Date range selector
- Case type: Multi-select checkboxes
- Investigator: Law enforcement agency search

**Geographic Search**:
- Interactive map: Tap regions to filter cases
- Location radius: Adjustable distance from selected point
- Regional grouping: State, county, city level filtering
- International toggle: Include/exclude non-US cases

**Results Refinement**:
- Applied filters: Chip display of active filters
- Clear options: Individual filter removal
- Save search: Bookmark searches for later
- Alert setup: Notifications for new matching cases

---

## Content Results & Details

### Screen: Content Detail View

**Purpose**: Comprehensive information about specific True Crime content with platform integration

#### State: Content Detail Default

**Visual Design Specifications**:

**Content Hero Section**:
- Height: 320px with poster and metadata
- Background: Blurred poster image with dark overlay
- Poster: 180×240px floating poster on left side
- Content info: Right side with title and details
- Action buttons: Bottom overlay with primary actions

**Poster Display**:
- Size: 180×240px (3:4 aspect ratio)
- Position: Left side with 24px margins
- Border radius: 12px with subtle shadow
- Loading state: Skeleton animation
- Fallback: Default True Crime poster design

**Content Information Layout**:
- Title: H1 typography, white text with shadow
- Subtitle: H3 for series/season information
- Metadata row: Year, runtime, rating, content type
- Description: Scrollable text with expand/collapse
- Platform badges: Horizontal scroll of available platforms

**Metadata Display Styling**:
- Year: Caption typography, `#E5E5E7`
- Runtime: "2h 15m" or "6 episodes" format
- Rating: Star display with numeric rating
- Content type: "Documentary Series" badge style
- Separator: Bullet points between metadata items

**Platform Availability**:
- Badge layout: Horizontal scroll below metadata
- Badge size: 32×32px with platform logos
- User platforms: Highlighted with colored border
- Pricing: "Free", "Subscription", "$4.99" labels
- Deep links: Tap to open in platform app

**Action Button Row**:
- Background: `rgba(0, 0, 0, 0.8)` with backdrop blur
- Buttons: "Add to Tracking", "Watch Now", "Share"
- Layout: Equal width distribution
- Styling: Primary button design system
- Haptic: Feedback on button press

#### State: Content Tabs Interface

**Visual Design Specifications**:

**Tab Bar Design**:
- Position: Sticky below hero section
- Height: 48px with horizontal scroll
- Background: `rgba(28, 28, 30, 0.95)` with blur
- Active indicator: Bottom border, `#DC143C`
- Typography: Body Small, Medium weight

**Tab Options**:
- **Overview**: Case context and content summary
- **Episodes**: Episode list for series content
- **Cast & Crew**: People involved in production
- **Reviews**: Community and critic reviews
- **Related**: Similar content recommendations

**Overview Tab Layout**:
- Case connection: How content relates to specific case
- Content focus: Perspective and coverage approach
- Key insights: What viewers will learn
- Content warnings: Sensitive material advisories
- Production info: Network, year, awards

**Case Context Section**:
- Background: `#2C2C2E` card with 16px padding
- Icon: Case folder icon, 24×24px
- Case link: Tappable link to case directory
- Relationship: How content covers the case
- Completeness: Comprehensive vs. partial coverage

**Episodes Tab (Series Content)**:
- List layout: Episode cards with metadata
- Progress tracking: Watched/unwatched indicators
- Episode info: Title, air date, description, runtime
- Thumbnail: Episode still image where available
- Batch actions: Mark multiple episodes watched

**Episode Card Design**:
- Height: 80px per episode
- Thumbnail: 120×68px (16:9 aspect ratio)
- Info area: Episode details and description
- Status indicator: Checkmark for watched episodes
- Watch button: Direct link to platform playback

**Reviews Tab Organization**:
- Review types: Community, Critics, Friends
- Rating display: Overall scores and distributions
- Review cards: Individual review layouts
- Sorting: Recent, helpful, rating high/low
- User actions: Like, report, respond to reviews

**Community Review Card**:
- User avatar: 32×32px profile image
- Username: Display name with reputation indicator
- Rating: 5-star display with review date
- Review text: Expandable with "Read more" option
- Helpful votes: Thumbs up/down with count

#### State: Platform Selection Modal

**Visual Design Specifications**:

**Modal Layout**:
- Size: 90% screen width, max 400px
- Height: Auto-sizing based on platform count
- Background: `#2C2C2E` with rounded corners
- Border radius: 16px for modern appearance
- Shadow: `0 16px 48px rgba(0, 0, 0, 0.4)`

**Platform List Design**:
- Layout: Vertical list with platform information
- Item height: 72px per platform
- Dividers: Subtle lines between platform options
- Grouping: User's platforms first, then others
- Scroll: If more platforms than fit on screen

**Platform Item Layout**:
- Logo: 40×40px platform logo on left
- Platform name: H4 typography, white text
- Availability: "Free", "Subscription", price info
- Quality: "HD", "4K" indicators where available
- Action: "Open" button or subscription required

**Platform Status Indicators**:
- Available: Green dot, "Watch Now" button
- Subscription required: Orange dot, "Requires [Platform] subscription"
- Rental/Purchase: Blue dot, "$4.99 to rent"
- Coming soon: Gray dot, "Available [date]"
- Not available: Red dot, "Not currently available"

**User Platform Highlighting**:
- Background: Subtle `rgba(220, 20, 60, 0.1)` tint
- Border: 1px `#DC143C` border
- Priority: Listed first regardless of alphabetical order
- Quick action: Larger "Watch Now" button

---

## Platform Integration

### Screen: Platform Browser

**Purpose**: Browse content organized by streaming platform rather than case

#### State: Platform Grid View

**Visual Design Specifications**:

**Platform Grid Layout**:
- Cards: 2×2 grid (mobile), 3×4 (tablet), 4×6 (desktop)
- Spacing: 16px gaps between platform cards
- Margins: 16px from screen edges
- Card aspect: 16:9 for platform branding
- Categories: Streaming, Cable, Rental, Free

**Platform Card Design**:
- Background: Platform brand colors and gradients
- Logo: Centered platform logo, 64×64px
- Content preview: Small thumbnails of available content
- Statistics: Content count and user engagement
- Status: User subscription indicator

**Platform Card Information**:
- Platform name: H3 typography, white text
- Content count: "142 True Crime titles" format
- User status: "Connected", "Free Trial", "Subscribe"
- Price: Monthly cost for subscription services
- Quality: "HD", "4K", "Ad-supported" indicators

**User Connection Status**:
- Connected: Green checkmark with "Connected" text
- Available: Blue "Connect" button
- Subscription required: Orange "Subscribe" button
- Free trial: Purple "Start Trial" button
- Geographic restriction: Gray "Not available in your region"

**Platform Categories**:

**Streaming Services**:
- Netflix, Hulu, Amazon Prime, HBO Max, etc.
- Background: Streaming-specific gradients
- Features: Subscription information and original content

**Cable Networks**:
- Investigation Discovery, A&E, Oxygen, etc.
- Background: Traditional TV network styling
- Features: Live TV and on-demand availability

**Free Platforms**:
- YouTube, Tubi, Pluto TV, etc.
- Background: Free platform indicators
- Features: Ad-supported content notices

**Rental/Purchase**:
- iTunes, Google Play, Vudu, etc.
- Background: Purchase-focused design
- Features: Rental and purchase price information

#### State: Individual Platform View

**Visual Design Specifications**:

**Platform Header**:
- Height: 200px with platform branding
- Background: Platform colors and logo integration
- Navigation: Back button and platform logo
- User status: Connection indicator and settings
- Search: Platform-specific search functionality

**Platform Content Organization**:
- Sections: True Crime categories within platform
- Featured: Platform's highlighted True Crime content
- New releases: Recently added content
- Popular: Most watched True Crime on platform
- Exclusive: Platform original productions

**Content Section Layout**:
- Section headers: H3 typography with section descriptions
- Content rows: Horizontal scrolling content cards
- Card design: Consistent with main discovery interface
- Loading: Skeleton animations for slow platform APIs
- Error handling: Graceful degradation for API failures

**Platform-Specific Features**:
- Original content: Special badging for platform exclusives
- Quality indicators: HDR, Dolby Vision, 4K availability
- Download options: Offline viewing capability
- Parental controls: Content rating and restriction info
- Watchlist integration: Add to platform-native lists

---

## Social Discovery

### Screen: Friend Recommendations

**Purpose**: Privacy-first social discovery through trusted connections

#### State: Friend Activity Feed

**Visual Design Specifications**:

**Activity Feed Layout**:
- Card-based: Individual activity cards in vertical scroll
- Spacing: 12px between activity cards
- Margins: 16px horizontal screen margins
- Background: `#1C1C1E` for dark theme consistency
- Empty state: Friendly encouragement to add friends

**Activity Card Design**:
- Background: `#2C2C2E` with subtle border
- Border radius: 12px for consistency
- Padding: 16px for comfortable content spacing
- Shadow: Minimal shadow for depth
- Animation: Subtle fade-in when new activities appear

**Activity Types**:

**Content Completion**:
- Layout: Friend avatar + content thumbnail + metadata
- Text: "[Friend] completed [Content Title]"
- Rating: Friend's rating display if shared
- Timestamp: "2 hours ago" relative time
- Actions: Add to list, view details

**List Creation**:
- Layout: Friend avatar + list preview + description
- Text: "[Friend] created '[List Name]'"
- Preview: First 3 content posters
- Content count: "15 items" indicator
- Actions: Follow list, view details

**Achievement Milestone**:
- Layout: Achievement badge + friend info
- Text: "[Friend] watched their 50th documentary!"
- Badge: Special milestone indicator
- Recent content: What triggered the milestone
- Actions: Congratulate, view profile

**Activity Card Components**:
- Friend avatar: 40×40px profile image
- Content thumbnail: 60×80px poster image
- Metadata: Time, platform, content type
- Action buttons: Secondary button styling
- Privacy indicator: Shows friend's sharing level

**Privacy Controls Display**:
- Activity visibility: Clear indicators of what's shared
- Control access: Link to privacy settings
- Friend-specific: Different sharing levels per friend
- Opt-out options: Easy way to stop sharing activities

#### State: Community Lists Discovery

**Visual Design Specifications**:

**Community Lists Layout**:
- Grid: 1 column (mobile), 2 columns (tablet+)
- List cards: Detailed information and preview
- Filtering: Popular, Recent, By Topic, Friend-created
- Search: Find lists by name or creator

**Community List Card**:
- Height: 120px with horizontal layout
- Left side: List preview (collage of content posters)
- Right side: List information and metadata
- Footer: Engagement stats and follow button

**List Information Display**:
- List title: H4 typography, white text
- Creator: Username with avatar, secondary text
- Description: Brief list description, truncated
- Stats: Follower count, completion rate, last updated
- Tags: Topic tags for list categorization

**List Preview Collage**:
- Size: 120×120px square
- Layout: 2×2 grid of content posters
- Overflow: "+X more" overlay for additional content
- Quality: High-resolution poster images
- Fallback: Default True Crime imagery

**Engagement Indicators**:
- Follower count: Number of users following list
- Completion rate: Percentage who finished all content
- Community rating: Average user rating for list
- Activity level: How recently list was updated
- User status: Following/not following indicator

**List Actions**:
- Follow button: Primary action to follow list
- View button: Secondary action to see full list
- Share button: Share list with friends or social media
- Save button: Bookmark list for later review
- Report button: Flag inappropriate content

---

## Responsive Design Specifications

### Mobile (320-767px)

**Layout Adaptations**:
- Single column: All content grids collapse to single column
- Full-width cards: Content cards expand to full screen width
- Bottom sheets: Modal dialogs become bottom sheet presentations
- Touch-first: All interactions optimized for touch
- Safe areas: Proper handling of notches and home indicators

**Search Interface Mobile**:
- Full screen: Search takes over entire screen when active
- Voice prominence: Voice search button prominently displayed
- Gesture navigation: Swipe to dismiss search interface
- Keyboard handling: Proper keyboard avoidance and management

**Case Directory Mobile**:
- List view: Cases displayed in vertical list format
- Expandable cards: Tap to expand for more information
- Quick actions: Swipe gestures for common actions
- Infinite scroll: Optimized for mobile scrolling patterns

### Tablet (768-1023px)

**Layout Adaptations**:
- Split view: Search and results can be shown simultaneously
- Hover states: Introduction of hover effects for interface elements
- Multi-column: Content grids expand to 2-3 columns
- Modal sizing: Dialogs sized appropriately for screen space

**Advanced Features**:
- Drag and drop: Enhanced list management capabilities
- Multi-select: Bulk operations for content management
- Sidebar navigation: Persistent navigation for complex flows
- Picture-in-picture: Video previews while browsing

### Desktop (1024px+)

**Layout Adaptations**:
- Multi-pane: Complex layouts with multiple information panes
- Keyboard shortcuts: Full keyboard navigation support
- Context menus: Right-click menus for advanced actions
- Hover previews: Content information on hover
- Multiple windows: Support for multiple discovery sessions

**Power User Features**:
- Advanced search: Complex query building interface
- Bulk operations: Mass content management tools
- Analytics: Detailed discovery usage statistics
- Export options: Data export for external tools
- Automation: Saved searches and automated recommendations

---

## Animation & Transition Specifications

### Search Interactions

**Search Bar Focus Animation**:
- Duration: `300ms`
- Easing: `cubic-bezier(0.4, 0, 0.6, 1)`
- Properties: Border color, background opacity, scale
- Sequence: Border change → background fade → scale

**Results Loading**:
- Skeleton animation: Shimmer effect while loading
- Staggered appearance: Content cards fade in sequentially
- Duration: `200ms` per card with 50ms stagger
- Error states: Graceful transition to error messaging

### Content Discovery

**Card Interactions**:
- Hover elevation: Scale 1.02 with shadow increase
- Press feedback: Scale 0.98 with haptic feedback
- Loading states: Skeleton to content transition
- Add to list: Success animation with checkmark overlay

**Platform Selection**:
- Modal entrance: Scale from 0.8 to 1.0 with fade
- Platform highlighting: Color transition on selection
- Deep link activation: Brief loading state then transition
- Error handling: Shake animation for failed connections

### Social Features

**Activity Updates**:
- New activity: Slide in from top with gentle bounce
- Friend actions: Subtle pulse animation on friend avatars
- List updates: Content refresh with smooth transitions
- Notifications: Toast messages with auto-dismiss

---

This comprehensive screen specification provides detailed guidance for implementing every aspect of the content discovery interface while maintaining consistency with the True Crime application's design system and user experience requirements. The case-first approach prioritizes investigative workflows over traditional streaming browsing patterns.