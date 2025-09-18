---
title: User Onboarding - Screen States & Layouts
description: Complete screen-by-screen specifications for user onboarding flow
feature: User Onboarding
last-updated: 2025-01-16
version: 1.0.0
related-files:
  - user-journey.md
  - implementation.md
  - ../../design-system/style-guide.md
dependencies:
  - OAuth 2.0 authentication
  - Platform API integrations
  - Interest profiling system
status: approved
---

# User Onboarding - Screen States & Layouts

## Overview

This document provides detailed screen-by-screen specifications for the user onboarding flow, including all possible states, responsive behavior, and interaction patterns. Each screen is designed to guide users through essential setup while maintaining the investigative, serious aesthetic appropriate for True Crime content.

## Table of Contents

1. [Landing Screen](#landing-screen)
2. [Account Creation Screen](#account-creation-screen)
3. [Interest Profiling Screen](#interest-profiling-screen)
4. [Platform Integration Screen](#platform-integration-screen)
5. [Tutorial & First Content Screen](#tutorial--first-content-screen)
6. [Dashboard Introduction Screen](#dashboard-introduction-screen)

---

## Landing Screen

### Purpose
Convert visitors into users by clearly communicating value proposition and removing signup friction.

### Layout Structure
**Container**: Full-screen with safe area insets
**Grid**: Single column on mobile, hero + sidebar on desktop
**Content Organization**: Hero section, value props, social proof, CTA

---

#### State: Default

**Visual Design Specifications**:

**Layout**:
- **Safe Area**: Full-screen dark background (`#0A0A0A`)
- **Content Container**: Max width 400px (mobile), 1200px (desktop)
- **Vertical Spacing**: 3xl between major sections (64px)
- **Horizontal Margins**: 2xl (48px desktop), lg (24px mobile)

**Typography**:
- **App Logo**: H1 (`32px`), Bold (700), center-aligned
- **Value Proposition**: H2 (`24px`), Semibold (600), center-aligned
- **Description**: Body Large (`18px`), Regular (400), center-aligned
- **Social Proof**: Body Small (`14px`), Medium (500)

**Color Application**:
- **Background**: Dark-50 (`#0A0A0A`)
- **Primary Text**: Dark-Text-Primary (`#FFFFFF`)
- **Secondary Text**: Dark-Text-Secondary (`#E5E5E7`)
- **Accent Elements**: Investigation-Red (`#DC143C`)

**Interactive Elements**:
- **Primary CTA Button**:
  - Dimensions: 48px height, full width (mobile), 320px width (desktop)
  - Background: Investigation-Red (`#DC143C`)
  - Text: "Start Tracking Free" (Body, Semibold)
  - Border Radius: 8px
  - Padding: 16px 24px

- **Secondary CTA Button**:
  - Same dimensions
  - Background: Transparent
  - Border: 2px solid Investigation-Red
  - Text: Investigation-Red color

**Visual Hierarchy**:
1. App logo and brand (top, prominent)
2. Hero value proposition statement
3. Platform integration visual (multiple logos)
4. Social proof numbers/testimonials
5. Primary action button (most prominent)
6. Secondary actions (less prominent)

**Whitespace Usage**:
- **Above fold**: 20% content, 80% strategic negative space
- **Section Spacing**: 64px between major content blocks
- **Content Breathing**: 24px internal spacing within sections
- **CTA Isolation**: 48px clearance around primary button

**Interaction Design Specifications**:

**Primary Actions**:
- **"Start Tracking Free" Button**:
  - Default: Investigation-Red background, white text
  - Hover: Investigation-Red-Dark (`#B91C3C`), scale 1.02, 250ms ease-out
  - Active: Investigation-Red-Dark, scale 0.98, 150ms ease-out
  - Focus: 2px Evidence-Blue outline, 2px offset
  - Disabled: Neutral-400 background, Neutral-600 text

- **"See How It Works" Button**:
  - Default: Transparent background, Investigation-Red border/text
  - Hover: Investigation-Red-Light background (`#FDE8E8`), no scale
  - Active: Darker background tint
  - Focus: Same outline treatment as primary

**Secondary Actions**:
- **"Sign In" Link**:
  - Default: Evidence-Blue color, no underline
  - Hover: Evidence-Blue-Dark, subtle underline
  - Active: Slightly darker blue
  - Focus: Same outline treatment

**Animation & Motion Specifications**:

**Entry Animations**:
- **Logo**: Fade in from 0 to 1 opacity, 400ms ease-out, 0ms delay
- **Value Prop**: Slide up 32px, fade in, 400ms ease-out, 200ms delay
- **Platform Visual**: Fade in, 400ms ease-out, 400ms delay
- **CTA Buttons**: Slide up 16px, fade in, 400ms ease-out, 600ms delay

**Micro-interactions**:
- **Button Hover**: Scale transform 1.02, 250ms spring animation
- **Logo Interaction**: Subtle pulse animation on tap (mobile)
- **Platform Logos**: Gentle floating animation (3s duration, infinite)

**Responsive Design Specifications**:

**Mobile (320-767px)**:
- **Layout**: Single column, center-aligned content
- **Logo Size**: 24px font size (reduced from desktop 32px)
- **Value Prop**: 20px font size (reduced from desktop 24px)
- **Button Width**: Full width minus 48px margins
- **Platform Visual**: Stacked logos, smaller size
- **Spacing**: Reduced to lg (24px) between sections

**Tablet (768-1023px)**:
- **Layout**: Single column, wider content area (600px max width)
- **Typography**: Standard scale maintained
- **Button Width**: 400px centered
- **Platform Visual**: Two-row grid layout
- **Spacing**: Standard xl (32px) between sections

**Desktop (1024px+)**:
- **Layout**: Hero section with optional sidebar for testimonials
- **Typography**: Full scale as specified
- **Button Width**: 320px centered
- **Platform Visual**: Single row with all major platforms
- **Spacing**: Maximum 3xl (64px) between sections

**Accessibility Specifications**:

**Screen Reader Support**:
- **Main Heading**: `<h1>` with app name and value proposition
- **CTA Button**: `aria-label="Create free account to start tracking True Crime content"`
- **Platform Visual**: `alt="Available on Netflix, Hulu, Investigation Discovery, and 200+ more platforms"`
- **Secondary Actions**: Clear link descriptions

**Keyboard Navigation**:
- **Tab Order**: Logo (skip-link), Primary CTA, Secondary CTA, Sign In
- **Focus Management**: Clear focus indicators, logical progression
- **Skip Links**: "Skip to main content" for accessibility

**Touch Targets**:
- **Minimum Size**: 44x44px for all interactive elements
- **Spacing**: 8px minimum between touch targets
- **Safe Margins**: 16px from screen edges for thumb reach

---

#### State: Loading (Initial App Load)

**Visual Design Specifications**:
- **Background**: Same dark theme as default
- **Loading Indicator**: Centered spinner with Investigation-Red accent
- **Brand Element**: App logo visible during loading
- **Progress**: Subtle progress indicator for app initialization

**Loading Animation**:
- **Spinner**: Investigation-Red color, 24px size, 2px stroke
- **Duration**: Maximum 3 seconds before content reveal
- **Fallback**: If loading takes longer, show partial content

---

#### State: Error (Network/Loading Issues)

**Visual Design Specifications**:
- **Error Message**: Clear, non-technical language
- **Retry Button**: Prominent, same styling as primary CTA
- **Support Option**: Link to help or contact information
- **Graceful Degradation**: Show as much content as possible

**Error Messaging**:
- **Headline**: "Having trouble connecting?"
- **Description**: "Check your internet connection and try again"
- **Actions**: "Try Again" button + "Need Help?" link

---

## Account Creation Screen

### Purpose
Secure account creation with minimal friction and clear privacy communication.

### Layout Structure
**Container**: Centered form with progress indicator
**Grid**: Single column form layout
**Content Organization**: Progress, form fields, actions, alternatives

---

#### State: Default

**Visual Design Specifications**:

**Layout**:
- **Form Container**: Max width 400px, centered with xl margins
- **Progress Bar**: Full width at top, 4px height
- **Form Field Spacing**: lg (24px) between field groups
- **Button Spacing**: xl (32px) above form submission

**Typography**:
- **Page Title**: H2 (`24px`), Semibold (600), center-aligned
- **Progress Text**: Caption (`12px`), Medium (500), "Step 1 of 4"
- **Field Labels**: Body (`16px`), Medium (500), left-aligned
- **Input Text**: Body (`16px`), Regular (400)
- **Helper Text**: Body Small (`14px`), Regular (400)

**Color Application**:
- **Background**: Dark-100 (`#1C1C1E`)
- **Form Background**: Dark-200 (`#2C2C2E`)
- **Input Backgrounds**: Dark-300 (`#3A3A3C`)
- **Text**: Dark-Text-Primary (`#FFFFFF`)
- **Labels**: Dark-Text-Secondary (`#E5E5E7`)

**Interactive Elements**:

**Social Login Buttons**:
- **Dimensions**: 48px height, full width
- **Spacing**: sm (8px) between buttons
- **Google Button**: White background, Google brand colors
- **Apple Button**: Black background, white text
- **Facebook Button**: Facebook blue background

**Text Input Fields**:
- **Dimensions**: 48px height, full width
- **Padding**: 14px 16px internal
- **Border**: 1px solid Dark-400 (`#48484A`)
- **Border Radius**: 8px
- **Typography**: Body (16px), Regular weight

**Form Validation**:
- **Real-time validation**: Immediate feedback as user types
- **Error States**: Red border and error message below field
- **Success States**: Green checkmark icon in field
- **Helper Text**: Always visible for password requirements

**Interaction Design Specifications**:

**Input Focus States**:
- **Default**: Dark-400 border, Dark-300 background
- **Focus**: Evidence-Blue border, subtle blue glow shadow
- **Error**: Investigation-Red border, red glow shadow
- **Success**: Success-Primary border, green checkmark icon
- **Disabled**: Dark-200 background, Dark-Text-Tertiary text

**Button States** (Primary "Create Account"):
- **Default**: Investigation-Red background, white text
- **Hover**: Investigation-Red-Dark background
- **Loading**: Spinner animation, "Creating Account..." text
- **Disabled**: Neutral-400 background (while form invalid)

**Animation & Motion Specifications**:

**Form Interactions**:
- **Field Focus**: Smooth border color transition, 200ms ease-out
- **Validation Feedback**: Error/success states animate in from bottom
- **Button Press**: Subtle scale feedback (0.98) on press
- **Loading State**: Spinner replaces button text smoothly

**Error Animations**:
- **Shake Animation**: Invalid field shakes horizontally 3px, 3 times
- **Error Message**: Slides down from field, red background fade-in
- **Form Submission Error**: Entire form container subtle shake

**Responsive Design Specifications**:

**Mobile (320-767px)**:
- **Form Width**: Full width minus 32px margins
- **Social Buttons**: Full width, stacked vertically
- **Input Fields**: Full width, 16px font size (improved mobile typing)
- **Progress Bar**: Full width, 6px height for better visibility

**Tablet & Desktop (768px+)**:
- **Form Width**: 400px max width, centered
- **Social Buttons**: Can be side-by-side if space permits
- **Input Fields**: Standard 16px font size
- **Progress Bar**: Standard 4px height

**Accessibility Specifications**:

**Form Accessibility**:
- **Field Labels**: Properly associated with inputs via `for` attribute
- **Error Messages**: `aria-describedby` linking to error text
- **Required Fields**: `aria-required="true"` and visual indicators
- **Form Validation**: `aria-invalid` states and screen reader announcements

**Keyboard Navigation**:
- **Tab Order**: Social buttons first, then form fields, then submit
- **Enter Key**: Submits form when all fields valid
- **Escape Key**: Clears current field or shows exit confirmation

---

#### State: Loading (Account Creation)

**Visual Changes**:
- **Submit Button**: Shows spinner animation and "Creating Account..." text
- **Form Disabled**: All inputs become read-only during submission
- **Progress Indication**: Subtle loading bar below form
- **Prevent Duplicate**: Double-submission protection active

**Loading Feedback**:
- **Duration Expectation**: "This usually takes a few seconds"
- **Progress Indicators**: Determinate progress if possible
- **Cancel Option**: Allow user to cancel during creation

---

#### State: Success

**Visual Changes**:
- **Success Animation**: Green checkmark animation
- **Progress Update**: Progress bar advances to step 2
- **Auto-Advancement**: Automatic redirect to next step after 2 seconds
- **Success Message**: "Account created successfully! Setting up your profile..."

---

#### State: Error (Account Creation Failed)

**Error Handling**:
- **Clear Error Messages**: Non-technical, actionable language
- **Field-Specific Errors**: Highlight problematic fields
- **Retry Functionality**: Easy retry without re-entering all data
- **Alternative Options**: Suggest different signup method

**Common Error Scenarios**:
- **Email Already Exists**: "An account with this email already exists. Sign in instead?"
- **Weak Password**: Specific requirements with helpful suggestions
- **Network Error**: "Connection problem. Please try again."
- **Server Error**: "Something went wrong. Please try again in a moment."

---

## Interest Profiling Screen

### Purpose
Capture user preferences to enable personalized content recommendations while maintaining engagement momentum.

### Layout Structure
**Container**: Grid of selectable interest categories
**Grid**: 2 columns mobile, 3-4 columns desktop
**Content Organization**: Progress, explanation, category grid, continue action

---

#### State: Default

**Visual Design Specifications**:

**Layout**:
- **Category Grid**: 2x5 on mobile, 3x4 on tablet, 4x3 on desktop
- **Card Spacing**: md (16px) gutters between cards
- **Card Dimensions**: Square aspect ratio, minimum 120px
- **Progress Position**: Top of screen, consistent with previous step

**Category Card Design**:
- **Background**: Dark-200 (`#2C2C2E`) default, Investigation-Red selected
- **Border**: 2px solid Dark-400 default, Investigation-Red selected
- **Border Radius**: 12px for softer, approachable feel
- **Image**: Category-representative illustration (tasteful, non-graphic)
- **Typography**: H4 (`18px`), Medium (500), center-aligned

**Interest Categories**:
1. **Serial Killers**: Comprehensive documentaries and series
2. **Cold Cases**: Unsolved mysteries and investigations
3. **Forensic Science**: Investigation techniques and evidence
4. **Court Cases**: Legal proceedings and trials
5. **Missing Persons**: Disappearances and searches
6. **Historical Crimes**: Pre-1950s cases with modern coverage
7. **International Cases**: Global True Crime stories
8. **Cult & Conspiracy**: Organized crime and conspiracies

**Selection Indication**:
- **Visual**: Background changes to Investigation-Red
- **Icon**: White checkmark in top-right corner
- **Animation**: Smooth color transition and scale (1.02)
- **Counter**: "3 of 8 selected" below grid

**Continue Button State**:
- **Enabled**: When at least 1 category selected
- **Disabled**: Gray background, reduced opacity
- **Text Changes**: "Continue" (enabled) vs "Select at least one interest" (disabled)

**Interaction Design Specifications**:

**Category Selection**:
- **Tap/Click**: Immediate visual feedback with color change
- **Multiple Selection**: Allow selecting/deselecting multiple categories
- **Maximum**: No limit, but recommend 3-5 for best experience
- **Feedback**: Subtle haptic feedback on selection (mobile)

**Visual Feedback**:
- **Selection Animation**: 200ms ease-out color transition
- **Scale Animation**: Selected cards scale to 1.02 briefly
- **Counter Update**: Real-time update of selection count
- **Button State**: Enable/disable animation for continue button

**Animation & Motion Specifications**:

**Entry Animations**:
- **Grid Entrance**: Cards animate in with staggered timing (50ms between)
- **Scale In**: Each card scales from 0.9 to 1.0 with fade
- **Progress Bar**: Continuous progress from previous step

**Selection Animations**:
- **Color Transition**: 200ms ease-out from default to Investigation-Red
- **Checkmark**: Bouncy entrance animation for checkmark icon
- **Counter Update**: Number change with slight scale animation

**Responsive Design Specifications**:

**Mobile (320-767px)**:
- **Grid**: 2 columns, 4 rows
- **Card Size**: Minimum 140px height for touch targets
- **Typography**: Slightly smaller (16px) for card labels
- **Spacing**: Reduced gutters (12px) to fit screen

**Tablet (768-1023px)**:
- **Grid**: 3 columns, 3 rows
- **Card Size**: 160px height, more breathing room
- **Typography**: Standard size (18px)
- **Spacing**: Standard gutters (16px)

**Desktop (1024px+)**:
- **Grid**: 4 columns, 2 rows
- **Card Size**: 180px height, most spacious
- **Typography**: Full size with more detailed descriptions
- **Spacing**: Large gutters (24px) for premium feel

**Accessibility Specifications**:

**Selection Accessibility**:
- **ARIA States**: `aria-selected="true/false"` for each category
- **Screen Reader**: "Serial Killers category, selected" announcements
- **Keyboard Navigation**: Arrow keys to move, space to select/deselect
- **Focus Indicators**: Clear focus ring on keyboard navigation

**Instructions Accessibility**:
- **Clear Guidance**: "Choose the True Crime topics that interest you most"
- **Selection Count**: Screen reader announces current selection count
- **Progress Context**: "Step 2 of 4: Interest Selection"

---

#### State: Loading (Saving Preferences)

**Visual Changes**:
- **Continue Button**: Spinner and "Saving preferences..." text
- **Grid Disabled**: Categories become non-interactive
- **Loading Indicator**: Subtle progress indication

---

#### State: Error (Save Failed)

**Error Handling**:
- **Error Message**: "Unable to save preferences. Please try again."
- **Retry Button**: Prominent retry option
- **Skip Option**: Allow skipping this step with warning about generic recommendations

---

## Platform Integration Screen

### Purpose
Connect user's streaming services and cable providers to enable comprehensive content discovery and availability tracking.

### Layout Structure
**Container**: Platform list with connection status indicators
**Grid**: Single column list on mobile, 2-column on desktop
**Content Organization**: Progress, benefits explanation, platform list, continue action

---

#### State: Default

**Visual Design Specifications**:

**Layout**:
- **Platform List**: Vertical list of platforms with logos and connection status
- **Platform Card**: Horizontal layout with logo, name, description, action button
- **Card Height**: 80px for generous touch targets
- **Card Spacing**: sm (8px) between platform cards

**Platform Card Components**:
- **Logo**: 48x48px platform logo, left-aligned
- **Platform Info**: Name (H4) and description (Body Small), center-left
- **Connection Status**: "Connect" button or "Connected" checkmark, right-aligned
- **Background**: Dark-200 default, Success-Light when connected

**Priority Platform Order**:
1. **Netflix** - "Largest True Crime library"
2. **Investigation Discovery** - "Specialized True Crime network"
3. **Hulu** - "Investigation Discovery partnership"
4. **Amazon Prime Video** - "Growing True Crime collection"
5. **HBO Max/Discovery+** - "Premium True Crime content"
6. **Peacock** - "NBC True Crime specials"
7. **Paramount+** - "CBS True Crime shows"
8. **Apple TV+** - "Original True Crime series"

**Connection Button States**:
- **Default "Connect"**: Evidence-Blue background, white text
- **Loading**: Spinner with "Connecting..." text
- **Connected**: Success-Primary background, checkmark icon
- **Error**: Investigation-Red background, "Retry" text

**Cable Provider Section**:
- **Collapsible**: "Add Cable Provider" expandable section
- **Provider List**: Major cable providers with setup instructions
- **Manual Entry**: Text field for unlisted providers

**Interaction Design Specifications**:

**Platform Connection Flow**:
1. **User Taps "Connect"**: Button shows loading state
2. **OAuth Window**: External browser/webview opens
3. **User Authenticates**: Platform login process
4. **Return to App**: Connection status updates
5. **Success Feedback**: Visual confirmation and content preview

**Connection Status Feedback**:
- **Success**: Green checkmark, "Connected" text, content count preview
- **Failure**: Red warning icon, "Connection failed" with retry option
- **Partial**: Yellow warning for limited access or expired authentication

**Skip vs. Complete Messaging**:
- **Connected Platforms**: "Great! We found 47 True Crime titles on Netflix"
- **Skip Warning**: "You'll miss personalized content discovery across platforms"
- **Benefits Reminder**: "Connect platforms to see where your content is available"

**Animation & Motion Specifications**:

**Connection Animations**:
- **Loading State**: Smooth button text replacement with spinner
- **Success Animation**: Checkmark bounce-in animation
- **Content Preview**: Slide-in animation for "Found X titles" message
- **List Updates**: Connected platforms move to top of list

**OAuth Flow Animations**:
- **Modal Presentation**: Smooth slide-up for OAuth webview
- **Return Animation**: Modal dismisses with success/failure feedback
- **Status Update**: Real-time update of connection status

**Responsive Design Specifications**:

**Mobile (320-767px)**:
- **Platform Cards**: Full width, stacked vertically
- **Logo Size**: 40x40px (slightly smaller for mobile)
- **Typography**: Compressed for mobile (16px name, 12px description)
- **Touch Targets**: Minimum 44px button height

**Tablet (768-1023px)**:
- **Platform Cards**: Two-column grid for better space usage
- **Logo Size**: Standard 48x48px
- **Typography**: Standard sizing
- **Card Layout**: Slightly wider for better content balance

**Desktop (1024px+)**:
- **Platform Cards**: Optional two-column layout
- **Logo Size**: 48x48px with more spacing
- **Typography**: Full size with expanded descriptions
- **Hover States**: Subtle hover effects for desktop interaction

**Accessibility Specifications**:

**Connection Accessibility**:
- **Button States**: Clear ARIA states for connection status
- **Progress Feedback**: Screen reader announcements for connection progress
- **Error Messages**: Specific, actionable error descriptions
- **OAuth Accessibility**: Proper focus management during OAuth flow

**Platform Information**:
- **Logo Alt Text**: "Netflix logo" descriptive alternative text
- **Connection Status**: "Netflix: Connected" or "Netflix: Not connected"
- **Action Buttons**: Clear button labeling and purpose

---

#### State: Connecting (OAuth in Progress)

**Visual Changes**:
- **Active Button**: Shows spinner and "Connecting to [Platform]..." text
- **Other Buttons**: Disabled during OAuth flow
- **Modal Overlay**: Optional dimming during OAuth process
- **Cancel Option**: Allow user to cancel connection attempt

**OAuth Flow Management**:
- **Timeout Handling**: 60-second timeout for OAuth completion
- **Error Recovery**: Clear path back to connection attempt
- **Success Return**: Smooth transition back to app with confirmation

---

#### State: Connected

**Visual Changes**:
- **Platform Card**: Background changes to Success-Light tint
- **Status Icon**: Green checkmark replaces connect button
- **Content Preview**: "Found 47 True Crime titles" message appears
- **List Reorder**: Connected platforms move to top

**Content Discovery Preview**:
- **Title Count**: Show number of True Crime titles found
- **Popular Examples**: "Including Dahmer, The Staircase, and 45 more"
- **Deep Link Preview**: Sample direct link to specific content

---

#### State: Connection Failed

**Error Handling**:
- **Clear Error Message**: "Connection to Netflix failed. Please try again."
- **Retry Button**: Prominent retry option with same OAuth flow
- **Alternative Options**: "Try connecting via email/password" if available
- **Skip Option**: "Continue without connecting" with impact explanation

**Error Types**:
- **Authentication Failed**: User cancelled or credentials rejected
- **Network Error**: Connection timeout or network issues
- **Platform Error**: Platform API unavailable or rate limited
- **Account Issues**: User account not compatible or restricted

---

## Tutorial & First Content Screen

### Purpose
Guide users through adding their first piece of content to demonstrate core value and establish tracking behavior.

### Layout Structure
**Container**: Tutorial overlay with live app interface
**Grid**: Split between tutorial guidance and interactive content
**Content Organization**: Tutorial steps, search interface, content results, action completion

---

#### State: Default (Tutorial Introduction)

**Visual Design Specifications**:

**Tutorial Overlay Design**:
- **Background**: Semi-transparent dark overlay (`rgba(0, 0, 0, 0.8)`)
- **Tutorial Panel**: Bottom sheet on mobile, side panel on desktop
- **Panel Background**: Dark-200 with subtle border
- **Tutorial Content**: Clear steps with visual indicators

**Live Interface Behind Overlay**:
- **Search Bar**: Fully functional search interface
- **Content Grid**: Real search results based on user interests
- **Dimmed State**: 50% opacity until user interacts

**Tutorial Step Indicators**:
- **Step Counter**: "Step 1 of 4" with progress dots
- **Current Step**: Highlighted with Investigation-Red accent
- **Completed Steps**: Success-Primary checkmarks
- **Upcoming Steps**: Neutral-400 outlines

**Tutorial Content Layout**:
- **Step Title**: H3 (`20px`), Semibold, clear action description
- **Step Description**: Body (`16px`), detailed explanation
- **Visual Pointer**: Arrow or highlight indicating where to interact
- **Skip Option**: "Skip tutorial" link (subtle, not prominent)

**Interaction Design Specifications**:

**Tutorial Progression**:
1. **Search Demonstration**: "Try searching for a case you're interested in"
2. **Content Selection**: "Choose something to add to your tracking list"
3. **Status Setting**: "Mark it as 'Want to Watch' or 'Completed'"
4. **Platform Discovery**: "See which platforms have this content"

**Interactive Guidance**:
- **Highlighted Elements**: Current interaction glows with Investigation-Red border
- **Disabled Elements**: Non-relevant UI is dimmed and non-interactive
- **Real Actions**: User actions affect their actual data (not fake demo)

**Progressive Disclosure**:
- **Tutorial Hints**: Contextual tips appear as user progresses
- **Advanced Features**: Mention rating, notes, sharing for later discovery
- **Skip Prevention**: Gentle encouragement to complete tutorial

**Animation & Motion Specifications**:

**Tutorial Entrance**:
- **Overlay Fade**: Background overlay fades in over 300ms
- **Panel Slide**: Tutorial panel slides up from bottom (mobile) or in from side (desktop)
- **Element Highlighting**: Current interactive element glows with animated border

**Step Transitions**:
- **Progress Animation**: Step indicators animate progress
- **Content Updates**: Tutorial content cross-fades between steps
- **Highlight Movement**: Interactive element highlighting smoothly transitions

**Success Animations**:
- **Step Completion**: Checkmark animation when step completed
- **Content Addition**: Subtle celebration animation when content added
- **Final Success**: Confetti or success animation at tutorial completion

**Responsive Design Specifications**:

**Mobile (320-767px)**:
- **Tutorial Panel**: Bottom sheet covering 40% of screen
- **Search Interface**: Full width above tutorial panel
- **Content Grid**: Visible above tutorial, scrollable
- **Interaction Hints**: Larger touch targets and clearer visual cues

**Tablet (768-1023px)**:
- **Tutorial Panel**: Side panel (30% width) or overlay modal
- **Search Interface**: 70% width with tutorial alongside
- **Content Grid**: Grid layout with 2-3 columns visible
- **Enhanced Visuals**: More space for tutorial content and examples

**Desktop (1024px+)**:
- **Tutorial Panel**: Right sidebar (25% width)
- **Search Interface**: 75% width with full functionality
- **Content Grid**: Full desktop grid layout visible
- **Rich Tutorial**: More detailed explanations and visual examples

**Accessibility Specifications**:

**Tutorial Accessibility**:
- **Step Progression**: Screen reader announces each step completion
- **Interactive Guidance**: Clear instructions for keyboard navigation
- **Skip Options**: Accessible skip functionality with warnings
- **Focus Management**: Proper focus flow through tutorial steps

**Live Interface Accessibility**:
- **Dimmed State**: Screen readers announce tutorial mode
- **Interactive Elements**: Clear indication of what's interactive
- **Keyboard Navigation**: Full keyboard accessibility maintained during tutorial

---

#### State: Search Step Active

**Visual Changes**:
- **Search Bar**: Glowing Investigation-Red border
- **Placeholder Text**: "Try searching for 'Ted Bundy' or 'Golden State Killer'"
- **Tutorial Panel**: Shows search tips and encouragement
- **Other Elements**: Dimmed and non-interactive

**Search Functionality**:
- **Real Search**: Actual search results based on user query
- **Guided Suggestions**: Tutorial provides successful search examples
- **Interest-Based**: Results prioritize user's selected interests
- **Platform Filter**: Shows results from connected platforms first

**Tutorial Guidance**:
- **Search Tips**: "Search for specific cases, killers, or general topics"
- **Popular Suggestions**: Show trending searches or examples
- **Success Criteria**: "Great! Now choose something that interests you"

---

#### State: Content Selection Step

**Visual Changes**:
- **Search Results**: Fully interactive and highlighted
- **Content Cards**: Glowing borders when hovered/focused
- **Tutorial Panel**: Shows selection guidance
- **Add Buttons**: Prominently highlighted on content cards

**Content Card Enhancement**:
- **Clear CTAs**: "Add to Watchlist" buttons are prominent
- **Platform Badges**: Show availability on user's connected platforms
- **Quick Info**: Key details visible (rating, year, type)
- **Selection Feedback**: Immediate visual feedback when content selected

**Tutorial Guidance**:
- **Selection Tips**: "Choose content that looks interesting to you"
- **Multiple Options**: "You can add multiple items to your list"
- **Quality Hints**: "Look for high ratings and platform availability"

---

#### State: Status Setting Step

**Visual Changes**:
- **Status Selector**: Dropdown or button group for status selection
- **Options Highlighted**: "Want to Watch", "Watching", "Completed" options
- **Selected Content**: Shows in dedicated area with status options
- **Tutorial Panel**: Explains status meanings and benefits

**Status Options**:
- **Want to Watch**: For content user plans to watch later
- **Watching**: For content currently in progress
- **Completed**: For content user has already finished
- **Abandoned**: Optional status for content user stopped watching

**Tutorial Guidance**:
- **Status Explanation**: Clear explanation of each status type
- **Tracking Benefits**: "This helps organize your content and get recommendations"
- **Change Later**: "You can always change the status later"

---

#### State: Platform Discovery Step

**Visual Changes**:
- **Platform Availability**: Expanded view showing all platforms with content
- **Deep Link Buttons**: Prominent buttons to launch content on platforms
- **Platform Comparison**: Side-by-side view of availability and pricing
- **Tutorial Panel**: Explains platform integration benefits

**Platform Integration Demo**:
- **Availability Display**: Clear indication of which platforms have content
- **Direct Links**: Functional deep links to platform content
- **Cost Information**: Free vs. subscription vs. rental pricing
- **User Platforms**: Highlight user's connected platforms first

**Tutorial Completion**:
- **Success Message**: "Congratulations! You've added your first True Crime content"
- **Next Steps**: "Explore your personalized dashboard"
- **Continue Button**: Proceeds to dashboard introduction

---

#### State: Tutorial Complete

**Visual Changes**:
- **Success Animation**: Celebration animation or confetti
- **Tutorial Dismissal**: Overlay fades out smoothly
- **Content Added**: User's content appears in actual tracking lists
- **Dashboard Preview**: Brief preview of dashboard features

**Transition to Dashboard**:
- **Automatic Progression**: Smooth transition to dashboard after celebration
- **Data Persistence**: All tutorial actions saved to user's actual data
- **Feature Unlocked**: Full app functionality now available

---

## Dashboard Introduction Screen

### Purpose
Introduce users to their personalized dashboard and establish ongoing engagement patterns with the core tracking functionality.

### Layout Structure
**Container**: Full dashboard layout with optional overlay guidance
**Grid**: Dashboard sections with optional tutorial highlights
**Content Organization**: User content, recommendations, feature discovery

---

#### State: Default (Dashboard Overview)

**Visual Design Specifications**:

**Dashboard Layout**:
- **Header Section**: Welcome message with user's name and stats
- **Primary Content**: "Continue Watching" and "Watchlist" sections
- **Recommendations**: Personalized content based on interests and platforms
- **Secondary Features**: Trending, social activity, settings access

**Welcome Section**:
- **Personal Greeting**: "Welcome back, [User Name]!" (H2)
- **Quick Stats**: Content tracked, platforms connected, hours saved
- **Achievement Indicator**: First milestone completion badge
- **Navigation Hints**: Subtle indicators for main app sections

**Content Sections**:
- **Continue Watching**: Content with "Watching" status
- **Your Watchlist**: Content with "Want to Watch" status
- **Recommended for You**: Based on interests and platform availability
- **Trending Now**: Popular content in True Crime community

**Feature Introduction**:
- **Optional Tour**: "Take a tour of your dashboard" subtle option
- **Feature Highlights**: Brief callouts for key functionality
- **Quick Actions**: Most common actions prominently displayed
- **Help Access**: Easy access to help and support

**Interaction Design Specifications**:

**Content Interaction**:
- **Content Cards**: Full interaction with rating, notes, status change
- **Platform Links**: Direct links to watch content on platforms
- **List Management**: Easy addition/removal from watchlists
- **Social Actions**: Share, rate, review functionality

**Navigation Introduction**:
- **Tab Bar**: Clear indication of main app sections
- **Search Access**: Prominent search functionality
- **Profile Access**: User settings and profile management
- **Feature Discovery**: Gentle introduction to advanced features

**Onboarding Completion**:
- **Success Acknowledgment**: Recognition of completed onboarding
- **Next Steps**: Clear guidance for continued engagement
- **Feature Unlocking**: Introduction of premium or advanced features
- **Community Introduction**: Optional social feature introduction

**Animation & Motion Specifications**:

**Dashboard Entrance**:
- **Content Loading**: Staggered loading of dashboard sections
- **Personal Data**: User's content appears with gentle animations
- **Recommendation Loading**: Dynamic loading of personalized content
- **Achievement Animation**: Celebration for onboarding completion

**Ongoing Interactions**:
- **Smooth Transitions**: Between dashboard sections and detailed views
- **Content Updates**: Real-time updates as user interacts with content
- **Status Changes**: Smooth animations for status updates and list changes

**Responsive Design Specifications**:

**Mobile (320-767px)**:
- **Single Column**: Stacked sections with full-width content
- **Touch Optimized**: Large touch targets for content interaction
- **Swipe Navigation**: Horizontal swipe for content carousels
- **Bottom Navigation**: Tab bar at bottom for easy thumb access

**Tablet (768-1023px)**:
- **Mixed Layout**: Some sections side-by-side, others stacked
- **Enhanced Interaction**: Hover states and enhanced touch targets
- **Side Navigation**: Optional sidebar for desktop-like experience
- **Adaptive Content**: More content visible per section

**Desktop (1024px+)**:
- **Multi-Column**: Full dashboard layout with sidebar navigation
- **Rich Interactions**: Hover states, context menus, keyboard shortcuts
- **Dense Information**: More content and metadata visible
- **Advanced Features**: Full feature set immediately available

**Accessibility Specifications**:

**Dashboard Navigation**:
- **Landmark Roles**: Proper semantic structure for screen readers
- **Skip Links**: Quick navigation to main content sections
- **Keyboard Navigation**: Full keyboard accessibility for all dashboard functions
- **Focus Management**: Logical focus flow through dashboard sections

**Content Accessibility**:
- **Content Descriptions**: Rich descriptions for all content items
- **Status Indicators**: Clear indication of content status and availability
- **Interactive Elements**: Proper labeling for all buttons and controls
- **Alternative Text**: Descriptive text for all images and visual elements

---

This comprehensive screen-by-screen specification ensures consistent implementation of the user onboarding flow while maintaining the investigative, serious aesthetic appropriate for True Crime content and providing excellent accessibility and usability across all device types.