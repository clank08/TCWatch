---
title: Social Features - Screen States & UI Specifications
description: Comprehensive UI specifications for all social feature screens and states
feature: Social Features
last-updated: 2025-09-16
version: 1.0.0
related-files:
  - README.md
  - user-journey.md
  - implementation.md
  - ../../design-system/style-guide.md
dependencies:
  - React Native/Expo UI framework
  - Privacy control components
  - Real-time communication systems
  - Content sharing mechanisms
status: approved
---

# Social Features - Screen States & UI Specifications

## Overview

This document provides comprehensive UI specifications for all social feature screens, ensuring privacy-first design principles while maintaining the investigative, respectful tone appropriate for True Crime content. All screens prioritize user control and transparency in social interactions.

## Table of Contents

1. [Privacy Onboarding Screens](#privacy-onboarding-screens)
2. [Friend Management Screens](#friend-management-screens)
3. [List Creation & Sharing](#list-creation--sharing)
4. [Activity Feed Interfaces](#activity-feed-interfaces)
5. [Community Discussion Screens](#community-discussion-screens)
6. [Privacy Control Panels](#privacy-control-panels)

---

## Privacy Onboarding Screens

### Screen: Social Features Introduction

**Purpose**: Introduce social features while emphasizing privacy-first approach and user control

#### State: Welcome to Social Features

**Visual Design Specifications**:

**Layout Structure**:
- Hero illustration showing privacy shield with community connections
- Step-by-step privacy setup preview
- Clear value proposition without overwhelming information
- Prominent privacy guarantees and user control messaging

**Typography**:
- H1: "Connect Safely with Fellow Researchers" (32px, Bold, Investigation Red)
- H2: "Your Privacy, Your Control" (24px, Semibold, Neutral-700)
- Body Large: Feature explanation text (18px, Regular, Neutral-600)
- Caption: Privacy guarantee text (12px, Regular, Neutral-500)

**Color Application**:
- Background: Dark-50 for immersive experience
- Privacy elements: Success-Primary for trust indicators
- Warning elements: Warning-Primary for important notices
- Accent colors: Investigation-Red for primary actions

**Interactive Elements**:

**Primary Actions**:
- "Set Up Privacy Controls" button (Investigation Red, 48px height)
  - Default: Background #DC143C, text White
  - Hover: Background #B91C3C, subtle lift animation
  - Press: Scale 0.98, background #A91B3A
  - Loading: Spinner with "Setting up..." text

**Secondary Actions**:
- "Learn More About Privacy" link (Evidence Blue)
- "Skip Social Features" button (Ghost style)
- "Advanced Settings" expandable section

**Animation & Motion Specifications**:
- Page entry: Fade in with 400ms ease-out
- Privacy shield animation: Subtle glow pulse every 3 seconds
- Step indicators: Progressive highlight with spring animation
- Button interactions: 150ms scale feedback with spring easing

**Responsive Design**:
- **Mobile**: Single column layout with larger touch targets
- **Tablet**: Two-column with illustration on left, content on right
- **Desktop**: Centered modal-style presentation with 600px max width

**Accessibility Specifications**:
- Privacy setup screen reader description: "Social features setup with privacy controls"
- Focus order: Header → explanation → primary action → secondary actions
- ARIA labels: "Privacy-first social features setup"
- High contrast mode: Enhanced borders and text contrast
- Voice control: "Set up privacy" and "skip social" voice commands

#### State: Privacy Level Selection

**Visual Layout**:
- Three privacy tier cards with clear visual hierarchy
- Side-by-side comparison of privacy levels
- Interactive privacy preview showing what others see
- Real-time privacy impact indicator

**Privacy Tier Cards**:

**Ghost Mode Card**:
- Icon: Invisible user silhouette with privacy shield
- Background: Neutral-100 with subtle security pattern
- Border: 2px solid Success-Primary when selected
- Description: "Complete privacy - invisible to all users"
- Features list: Checkmarks for privacy features, X for social features

**Research Network Card** (Recommended):
- Icon: Connected users with selective sharing indicators
- Background: Success-Light with recommended badge
- Border: 2px solid Success-Primary (default selection)
- Description: "Connect with researchers while controlling data sharing"
- Features list: Balanced privacy and social features

**Community Contributor Card**:
- Icon: User with community network connections
- Background: Info-Light with community indicators
- Border: 2px solid Info-Primary when selected
- Description: "Active community participation with controlled visibility"
- Features list: Full social features with privacy controls

**Privacy Preview Section**:
- Live preview of profile as others would see it
- Toggle between friend view and public view
- Clear indicators of visible vs. hidden information
- "What friends can see" and "What's kept private" sections

### Screen: Granular Privacy Controls

#### State: Permission Configuration

**Visual Design Specifications**:

**Layout Structure**:
- Categorized permission groups with expand/collapse
- Toggle switches with clear labels and impact descriptions
- Visual privacy level indicator updating in real-time
- Advanced settings behind "Show More" expandable sections

**Permission Categories**:

**Profile Visibility**:
```
┌─ Profile Visibility ─────────────────────────────┐
│ [🔍] Make profile discoverable         [Toggle]  │
│      Allows others to find you by interests      │
│                                                   │
│ [👤] Show real name                    [Toggle]  │
│      Display name vs anonymous username           │
│                                                   │
│ [🎯] Show case interests               [Toggle]  │
│      Share which cases you follow                 │
└───────────────────────────────────────────────────┘
```

**Activity Sharing**:
```
┌─ Activity Sharing ───────────────────────────────┐
│ [📺] Share completed content           [Toggle]  │
│      Let friends see what you've watched         │
│                                                   │
│ [⭐] Share ratings and reviews         [Toggle]  │
│      Show your ratings to friends                │
│                                                   │
│ [📅] Show currently watching           [Toggle]  │
│      Display what you're watching now             │
└───────────────────────────────────────────────────┘
```

**List Sharing Controls**:
```
┌─ List Sharing ───────────────────────────────────┐
│ Default list privacy:          [Dropdown ▼]      │
│ ┌─────────────────────────────────────────────┐   │
│ │ • Private (only me)                         │   │
│ │ • Friends only                              │   │
│ │ • Public (discoverable by community)       │   │
│ └─────────────────────────────────────────────┘   │
│                                                   │
│ [🤝] Allow list collaboration         [Toggle]   │
│      Let friends add content to lists            │
└───────────────────────────────────────────────────┘
```

**Communication Preferences**:
```
┌─ Communication ──────────────────────────────────┐
│ [📨] Allow friend requests from:   [Dropdown ▼]  │
│ ┌─────────────────────────────────────────────┐   │
│ │ • No one                                    │   │
│ │ • Mutual friends only                       │   │
│ │ • Anyone with shared interests              │   │
│ │ • Anyone in community                       │   │
│ └─────────────────────────────────────────────┘   │
│                                                   │
│ [💬] Enable direct messaging           [Toggle]  │
│      Allow private messages from friends         │
└───────────────────────────────────────────────────┘
```

**Privacy Impact Indicator**:
- Real-time privacy score from 1-10 (10 being most private)
- Color-coded privacy level: Green (high), Yellow (medium), Red (low)
- "Your privacy level: High" with explanation text
- One-click preset configurations: "Maximum Privacy", "Balanced", "Open"

---

## Friend Management Screens

### Screen: Friend Discovery

#### State: Interest-Based Suggestions

**Visual Layout**:
- Grid of potential friend cards with shared interest indicators
- Filter controls for discovery preferences
- Search bar for finding specific users
- Privacy reminder showing what others can see about you

**Friend Suggestion Cards**:
```
┌─ Potential Friend Card ──────────────────────────┐
│ [👤] Anonymous Avatar    [📊] Compatibility: 85%  │
│                                                   │
│ Shared Interests:                                 │
│ • Serial Killers (1970s-1980s)                   │
│ • Cold Cases (Midwest)                            │
│ • True Crime Podcasts                             │
│                                                   │
│ Mutual Friends: 2                                 │
│ Account Age: 1 year                               │
│                                                   │
│ [Connect] [View Lists] [Not Interested]           │
└───────────────────────────────────────────────────┘
```

**Card Design Specifications**:
- Height: 200px on mobile, 180px on desktop
- Border radius: 12px with subtle shadow
- Background: Dark-200 with hover elevation
- Interest tags: Rounded pills in Evidence Blue
- Compatibility score: Prominent percentage with color coding

**Filter Controls**:
- Interest category dropdown (Serial Killers, Cold Cases, etc.)
- Account age filter (1 month, 6 months, 1 year+)
- Activity level filter (Active, Occasional, New User)
- Mutual friends toggle (Show only users with mutual friends)

#### State: Friend Requests Management

**Visual Layout**:
- Tabbed interface: Received, Sent, Suggestions
- Request cards with detailed information and action buttons
- Batch actions for managing multiple requests
- Quick accept/decline swipe gestures on mobile

**Incoming Request Card**:
```
┌─ Friend Request ─────────────────────────────────┐
│ [👤] Avatar    TrueCrimeResearcher_42             │
│                                                   │
│ Request Message:                                  │
│ "Hi! I noticed we both follow the Zodiac case    │
│ and have similar viewing preferences. Would love  │
│ to connect and share research resources!"         │
│                                                   │
│ Shared Interests: 4 cases in common              │
│ Mutual Friends: Sarah_Detective, Mike_Scholar     │
│ Account: Verified researcher, 2 years old        │
│                                                   │
│ [Accept] [Message First] [Decline] [Block]        │
└───────────────────────────────────────────────────┘
```

**Action Button Specifications**:
- Accept: Success-Primary background, 44px height
- Message First: Evidence-Blue outline style
- Decline: Neutral-400 ghost style
- Block: Error-Primary ghost style with confirmation dialog

### Screen: Friends List & Management

#### State: Active Friends Network

**Visual Layout**:
- Searchable list of confirmed friends
- Activity indicators showing recent friend activity
- Friend groups/categories for organization
- Quick actions for each friend connection

**Friend List Item**:
```
┌─ Friend ─────────────────────────────────────────┐
│ [👤] Avatar    Mike_Scholar               [🟢]   │
│      "The Case Scholar"                           │
│                                                   │
│ Recently completed: Dahmer - Monster             │
│ Shared 2 new lists this week                     │
│ Common interests: 12 cases                       │
│                                                   │
│ [Message] [View Profile] [Settings] [•••]        │
└───────────────────────────────────────────────────┘
```

**Friend Categories**:
- Research Partners (close collaborators)
- Content Buddies (recommendation sharing)
- Community Members (casual connections)
- Experts (verified professionals)

**Activity Indicators**:
- Green dot: Active in last hour
- Yellow dot: Active today
- Gray dot: Inactive for 24+ hours
- Special indicators: Currently watching, recently rated content

---

## List Creation & Sharing

### Screen: List Creator

#### State: New List Setup

**Visual Layout**:
- Step-by-step creation wizard with progress indicator
- Content search integration within creation flow
- Real-time privacy and sharing controls
- Preview of list as others would see it

**Creation Steps**:

**Step 1: List Details**
```
┌─ Create New List ────────────────────────────────┐
│ List Name: [True Crime Masterpieces 2024]       │
│                                                   │
│ Description:                                      │
│ [Comprehensive collection of the highest-rated   │
│  documentaries and series from 2024, focusing   │
│  on investigative excellence and victim respect] │
│                                                   │
│ Privacy Level:                                    │
│ ◉ Private (only me)                              │
│ ○ Friends only                                    │
│ ○ Public (community can discover)                │
│                                                   │
│ Tags: [documentary] [2024] [high-quality] [+]    │
└───────────────────────────────────────────────────┘
```

**Step 2: Content Addition**
- Integrated search interface matching main discovery
- Quick-add buttons from search results
- Drag-and-drop ordering interface
- Bulk import from existing lists

**Step 3: Organization & Settings**
```
┌─ List Organization ──────────────────────────────┐
│ Order Content By:                                 │
│ ◉ Manual (drag to reorder)                       │
│ ○ Release date                                    │
│ ○ Rating (highest first)                         │
│ ○ Case chronology                                 │
│                                                   │
│ Sections:                                         │
│ [+ Add Section] to group related content         │
│                                                   │
│ Collaboration:                                    │
│ □ Allow friends to add content                    │
│ □ Allow friends to edit descriptions              │
│ □ Notify me of changes                            │
└───────────────────────────────────────────────────┘
```

#### State: List Content Management

**Content Item in List**:
```
┌─ List Item ──────────────────────────────────────┐
│ [🎬] Poster  Dahmer - Monster: The Jeffrey       │
│              Dahmer Story                         │
│                                                   │
│ [≡] My Notes:                                     │
│     Excellent portrayal focusing on victims      │
│     and community impact. Watch after reading    │
│     FBI case files for context.                  │
│                                                   │
│ Netflix • 2022 • 10 episodes                     │
│ Community Rating: 4.2/5                          │
│                                                   │
│ [🎯] [⭐ 4.5] [✏️ Edit] [❌ Remove]                │
└───────────────────────────────────────────────────┘
```

**List Management Tools**:
- Drag handles (≡) for manual reordering
- Bulk select checkboxes for mass actions
- Section dividers with custom headers
- Import/export functionality for backup

### Screen: List Sharing Interface

#### State: Share Configuration

**Visual Layout**:
- Privacy level selector with real-time preview
- Specific friend selection for targeted sharing
- Link generation for external sharing
- Collaboration permission settings

**Sharing Options**:
```
┌─ Share "True Crime Masterpieces 2024" ──────────┐
│                                                   │
│ Share With:                                       │
│ ◉ Specific friends                                │
│   [Select friends...] (3 selected)               │
│                                                   │
│ ○ All friends                                     │
│   Your complete friend network (47 people)       │
│                                                   │
│ ○ Make public                                     │
│   Anyone in the community can discover           │
│                                                   │
│ Permissions:                                      │
│ ☑ Can view list                                   │
│ ☑ Can copy to their own lists                    │
│ □ Can add content (collaboration)                 │
│ □ Can edit descriptions                           │
│                                                   │
│ [Generate Share Link] [Send to Friends]          │
└───────────────────────────────────────────────────┘
```

**Link Sharing Interface**:
- One-time share links with expiration dates
- Password protection for sensitive research lists
- View-only vs. collaboration link options
- Link analytics showing who accessed the list

---

## Activity Feed Interfaces

### Screen: Social Activity Dashboard

#### State: Friend Activity Feed

**Visual Layout**:
- Chronological activity stream with filtering options
- Activity type icons and categorization
- Quick actions for each activity item
- Load more/infinite scroll for performance

**Activity Feed Item Types**:

**Completed Content Activity**:
```
┌─ Activity ───────────────────────────────────────┐
│ [👤] Sarah_Detective completed                    │
│      "The Ripper" documentary                     │
│      ⭐⭐⭐⭐⭐ "Exceptional research quality"      │
│                                                   │
│ [🎬] The Ripper poster thumbnail                  │
│      Netflix • Documentary • 2020                │
│                                                   │
│ [+ Add to My List] [💬 Comment] [❤️ Like]         │
│                                                   │
│ 2 hours ago                                       │
└───────────────────────────────────────────────────┘
```

**List Sharing Activity**:
```
┌─ Activity ───────────────────────────────────────┐
│ [👤] Mike_Scholar created a new list             │
│      "Zodiac Killer: Complete Coverage"          │
│      📝 12 items • Research focus                │
│                                                   │
│ "Comprehensive collection covering all aspects   │
│ of the Zodiac investigation, from original       │
│ police reports to modern DNA analysis."          │
│                                                   │
│ [👁️ View List] [📋 Copy to My Lists] [📤 Share] │
│                                                   │
│ 4 hours ago • 3 friends also liked this         │
└───────────────────────────────────────────────────┘
```

**Community Contribution Activity**:
```
┌─ Activity ───────────────────────────────────────┐
│ [👤] Expert_Detective (Verified) shared insights │
│      on "Investigation timeline accuracy"        │
│      in Golden State Killer discussion           │
│                                                   │
│ "Having worked on similar cases, I can confirm   │
│ the documentary's timeline is highly accurate... │
│ [Read more]"                                      │
│                                                   │
│ 💬 12 responses • 🔥 Highly rated contribution   │
│                                                   │
│ [💬 Join Discussion] [👍 Helpful] [🔖 Save]      │
│                                                   │
│ 1 day ago                                         │
└───────────────────────────────────────────────────┘
```

**Feed Controls**:
- Activity type filters (Completions, Lists, Discussions, All)
- Friend selection filters (All friends, Close friends, Experts only)
- Time range filters (Today, This week, This month)
- Hide/show specific activity types toggle

#### State: Personal Activity Summary

**Visual Layout**:
- Weekly activity summary with statistics
- Privacy impact indicator showing what friends see
- Quick privacy adjustments
- Activity export options for personal records

**Weekly Summary Card**:
```
┌─ Your Activity This Week ────────────────────────┐
│                                                   │
│ 🎬 Completed: 3 documentaries                     │
│ 📝 Created: 1 new list (12 items)                │
│ ⭐ Rated: 5 pieces of content                     │
│ 💬 Discussed: 2 community topics                 │
│                                                   │
│ Visible to: 12 friends                           │
│ Privacy Level: Research Network                   │
│                                                   │
│ [📊 Full Statistics] [🔒 Adjust Privacy]         │
└───────────────────────────────────────────────────┘
```

---

## Community Discussion Screens

### Screen: Case Discussion Forum

#### State: Discussion Thread List

**Visual Layout**:
- Threaded discussion list with topic categorization
- Expert contributor indicators and verification badges
- Community moderation indicators
- Quality-based sorting and filtering

**Discussion Thread Card**:
```
┌─ Discussion Thread ──────────────────────────────┐
│ 📌 Pinned: "New evidence in BTK case analysis"   │
│    Started by Expert_Investigator (Verified)     │
│                                                   │
│ Recent DNA analysis suggests the possibility of  │
│ additional victims. Discussion of implications... │
│                                                   │
│ 💬 23 replies • 🔥 High quality discussion       │
│ ⏰ Last reply: 2 hours ago                       │
│ 👤 Active: 5 experts, 12 community members       │
│                                                   │
│ Tags: [DNA] [cold-case] [expert-analysis]        │
│                                                   │
│ [💬 Join Discussion] [📚 Related Content] [🔖]   │
└───────────────────────────────────────────────────┘
```

**Discussion Categories**:
- Case Analysis & Evidence
- Content Review & Accuracy
- Research Methodology
- New Developments
- Educational Resources

**Quality Indicators**:
- Expert participation badge
- Community rating (upvoted quality content)
- Fact-checking status
- Source citation quality

#### State: Individual Discussion Thread

**Visual Layout**:
- Chronological message thread with reply nesting
- User expertise indicators and verification status
- Source citation integration
- Community quality ratings

**Discussion Message Format**:
```
┌─ Message ────────────────────────────────────────┐
│ [👤] Expert_Pathologist (Verified Forensic Expert)│
│      2 hours ago                                  │
│                                                   │
│ The autopsy findings mentioned in the documentary │
│ align with standard forensic procedures of that   │
│ era. However, modern techniques would likely      │
│ reveal additional trace evidence.                 │
│                                                   │
│ Sources:                                          │
│ 📖 "Forensic Pathology Handbook" (Smith, 2019)   │
│ 🔗 FBI Evidence Guidelines                        │
│                                                   │
│ 👍 15 helpful • 💬 3 replies • 🔗 2 citations    │
│                                                   │
│ [💬 Reply] [👍 Helpful] [🔗 Cite] [⚠ Report]     │
└───────────────────────────────────────────────────┘
```

**Anonymous Contribution Option**:
```
┌─ Anonymous Message ──────────────────────────────┐
│ [?] Anonymous Contributor (Verified)             │
│     6 hours ago                                   │
│                                                   │
│ Having worked on similar cases, I can provide    │
│ additional context that wasn't covered in the    │
│ documentary. The investigation had several       │
│ aspects that remain sensitive...                 │
│                                                   │
│ [This contribution has been verified by          │
│  community moderators for accuracy]              │
│                                                   │
│ 👍 28 helpful • 💬 7 replies • ✅ Verified       │
│                                                   │
│ [💬 Reply] [👍 Helpful] [🔍 More Context]        │
└───────────────────────────────────────────────────┘
```

### Screen: Content Review Discussion

#### State: Accuracy Review Thread

**Visual Layout**:
- Content header with basic information
- Accuracy rating breakdown by category
- Expert verification status
- Community correction submissions

**Content Review Interface**:
```
┌─ Content Review: "Dahmer - Monster" ─────────────┐
│                                                   │
│ Community Accuracy Rating:                        │
│ Historical Facts:     ⭐⭐⭐⭐⭐ (4.8/5)          │
│ Timeline Accuracy:    ⭐⭐⭐⭐⭐ (4.6/5)          │
│ Victim Sensitivity:   ⭐⭐⭐⭐⭐ (4.9/5)          │
│ Legal Accuracy:       ⭐⭐⭐⭐☆ (4.2/5)          │
│                                                   │
│ ✅ Verified by 3 forensic experts                │
│ ✅ Cross-referenced with court documents         │
│ ⚠ 2 minor factual corrections submitted         │
│                                                   │
│ [📝 Add Review] [🔍 View Corrections] [💬 Discuss]│
└───────────────────────────────────────────────────┘
```

**Correction Submission Interface**:
- Specific scene/timestamp reference
- Factual correction with sources
- Community voting on correction accuracy
- Expert verification process

---

## Privacy Control Panels

### Screen: Privacy Dashboard

#### State: Complete Privacy Overview

**Visual Layout**:
- Privacy health score with recommendations
- Quick privacy level adjustment controls
- Activity visibility preview
- Data usage and sharing transparency

**Privacy Health Dashboard**:
```
┌─ Privacy Health Score: 8.5/10 (Excellent) ──────┐
│                                                   │
│ 🟢 Profile Discovery: Limited                    │
│ 🟢 Activity Sharing: Friends only                │
│ 🟡 List Visibility: Some public lists            │
│ 🟢 Communication: Restricted                     │
│                                                   │
│ Recommendations:                                  │
│ • Consider reviewing public list settings        │
│ • Your privacy settings are well-configured      │
│                                                   │
│ [⚙️ Adjust Settings] [🔍 Privacy Checkup]       │
└───────────────────────────────────────────────────┘
```

**Data Transparency Panel**:
```
┌─ Your Data Usage ────────────────────────────────┐
│                                                   │
│ What we collect:                                  │
│ • Content you track and rate                     │
│ • Lists you create and share                     │
│ • Privacy preferences and settings               │
│ • Anonymized usage patterns                      │
│                                                   │
│ What we don't collect:                           │
│ • Personal messages (end-to-end encrypted)       │
│ • Private research notes                         │
│ • Individual viewing sessions                    │
│ • Location data                                  │
│                                                   │
│ [📊 Full Data Report] [⬇️ Export My Data]        │
└───────────────────────────────────────────────────┘
```

#### State: Advanced Privacy Controls

**Granular Permission Matrix**:
```
┌─ Advanced Privacy Controls ──────────────────────┐
│                                                   │
│ Friend Visibility:           Friends  Public None │
│ Profile information          [✓]      [ ]    [ ] │
│ Content completions          [✓]      [ ]    [ ] │
│ Ratings and reviews          [✓]      [ ]    [ ] │
│ Currently watching           [ ]      [ ]    [✓] │
│ Custom lists                 [✓]      [ ]    [ ] │
│ Discussion participation     [✓]      [✓]    [ ] │
│                                                   │
│ Data Processing:                                  │
│ ☑ Allow anonymized analytics                     │
│ ☑ Enable recommendation improvements             │
│ □ Participate in research studies                │
│ □ Allow academic data usage (anonymized)         │
│                                                   │
│ [💾 Save Changes] [🔄 Reset to Defaults]         │
└───────────────────────────────────────────────────┘
```

### Screen: Data Control Center

#### State: Data Management Interface

**Visual Layout**:
- Complete data inventory with export options
- Deletion controls with impact explanations
- Account management and closure options
- Backup and portability tools

**Data Export Interface**:
```
┌─ Export Your Data ───────────────────────────────┐
│                                                   │
│ Choose what to export:                            │
│ ☑ Content tracking history (1,247 items)         │
│ ☑ Personal ratings and reviews (342 items)       │
│ ☑ Custom lists and collections (18 lists)        │
│ ☑ Friend connections and messages (23 friends)   │
│ ☑ Privacy settings and preferences               │
│ □ Anonymous discussion contributions             │
│                                                   │
│ Export format:                                    │
│ ◉ JSON (machine readable)                        │
│ ○ CSV (spreadsheet compatible)                   │
│ ○ PDF (human readable report)                    │
│                                                   │
│ [📤 Generate Export] [📧 Email When Ready]       │
│                                                   │
│ Estimated time: 5-10 minutes                     │
└───────────────────────────────────────────────────┘
```

**Account Deletion Interface**:
```
┌─ Delete Account ─────────────────────────────────┐
│                                                   │
│ ⚠️ This action cannot be undone                   │
│                                                   │
│ What will be deleted:                             │
│ • Your profile and account information           │
│ • All tracking data and personal lists           │
│ • Private messages and friend connections        │
│ • Personal settings and preferences              │
│                                                   │
│ What will be preserved (anonymized):             │
│ • Public list contributions to community         │
│ • Anonymous discussion contributions             │
│ • Content reviews (marked as "deleted user")     │
│                                                   │
│ Before deleting:                                  │
│ □ Export my data for personal backup             │
│ □ Transfer list ownership to friends             │
│ □ Notify friends of account closure              │
│                                                   │
│ [⬇️ Export First] [🗑️ Delete Account]           │
└───────────────────────────────────────────────────┘
```

---

## Component Specifications Summary

### Universal UI Components

**Privacy Level Indicator**:
- Size: 24x24px icon with status color
- Colors: Green (private), Yellow (selective), Orange (open)
- States: With tooltip explaining current privacy level
- Animation: Subtle glow when settings change

**Friend Status Badge**:
- Online: Green dot (4px, positioned top-right of avatar)
- Away: Yellow dot with timestamp
- Offline: No indicator
- Expert: Blue verification checkmark overlay

**Content Quality Indicator**:
- Star rating: 5-star system with half-star precision
- Expert verified: Checkmark badge
- Community rated: Number of ratings with average
- Accuracy verified: Shield icon with color coding

**Action Button Hierarchy**:
- Primary actions: Investigation Red background, white text
- Secondary actions: Evidence Blue outline, blue text
- Tertiary actions: Ghost style with neutral text
- Destructive actions: Error Red with confirmation dialogs

---

This comprehensive screen specification ensures all social features maintain the privacy-first approach while providing intuitive, accessible interfaces for True Crime researchers to connect and collaborate safely.