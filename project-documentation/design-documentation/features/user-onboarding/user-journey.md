---
title: User Onboarding - Complete User Journey
description: Comprehensive user journey mapping for new user onboarding experience
feature: User Onboarding
last-updated: 2025-01-16
version: 1.0.0
related-files:
  - README.md
  - screen-states.md
  - ../../design-system/style-guide.md
dependencies:
  - OAuth 2.0 authentication system
  - Platform API integrations
  - Interest profiling algorithm
status: approved
---

# User Onboarding - Complete User Journey

## Overview

The onboarding journey transforms new users from curious visitors into engaged True Crime content trackers. This flow prioritizes value discovery, reduces friction, and establishes the cross-platform tracking habit that defines our core value proposition.

## Primary User Goal
**Get started tracking True Crime content across multiple platforms with personalized recommendations**

## Success Criteria
- 70% complete full onboarding flow
- 85% return within 7 days of signup
- 80% add first piece of content within onboarding
- Clear understanding of cross-platform value proposition

---

## Core Experience Flow

### Step 1: App Discovery & Landing

#### Entry Point
**Trigger**: User discovers app through social media, search, or word-of-mouth
**Context**: User is frustrated with content scattered across platforms

#### Landing Screen State
**Visual Layout**:
- Hero section with dark, investigative aesthetic
- Clear value proposition: "Track all your True Crime content in one place"
- Visual showing multiple platform logos (Netflix, Hulu, Investigation Discovery, etc.)
- Social proof: "Join 10,000+ True Crime fans already tracking their content"

**Available Actions**:
- **Primary**: "Start Tracking Free" button (Investigation Red, prominent)
- **Secondary**: "See How It Works" (brief demo/video)
- **Tertiary**: "Sign In" link for returning users

**Visual Hierarchy**:
1. App logo and value proposition (H1)
2. Platform integration visual
3. Social proof and testimonials
4. Primary CTA button
5. Secondary exploration options

**System Feedback**:
- Subtle animation showing content flowing between platforms
- Loading indicator if fetching latest user count
- Smooth transitions between onboarding steps

**Microcopy**:
- Headline: "Never lose track of True Crime content again"
- Subhead: "Discover, track, and discuss across Netflix, Hulu, Investigation Discovery, and 200+ more platforms"
- CTA: "Start Tracking Free"
- Secondary: "See how it works in 30 seconds"

### Step 2: Account Creation

#### Task Flow
User chooses authentication method and creates secure account

#### State Description
**Visual Layout**:
- Clean, minimal form design with dark theme
- Clear progress indicator (Step 1 of 4)
- Social authentication options prominently displayed
- Email/password option below social options

**Available Actions**:
- **Primary**: Social login buttons (Google, Apple, Facebook)
- **Secondary**: Email/password form fields
- **Tertiary**: "Skip for now" option (guest mode)

**State Changes**:
- Form validation in real-time
- Loading states during authentication
- Success confirmation before proceeding
- Error handling for failed authentication

**Error Prevention**:
- Clear password requirements displayed
- Email format validation
- Duplicate account detection with recovery options
- Social login failure fallbacks

**Progressive Disclosure**:
- Basic info first (name, email)
- Advanced preferences saved for later steps
- Optional profile photo upload after core setup

#### Success State
- Welcome message with user's name
- Clear indication of progress (Step 1 complete)
- Automatic progression to interest selection

### Step 3: Interest Profiling

#### Task Flow
User selects True Crime interests to enable personalized recommendations

#### State Description
**Visual Layout**:
- Grid of visually appealing True Crime categories
- Each category shows representative imagery (tasteful, not graphic)
- Progress indicator (Step 2 of 4)
- "Skip this step" option available but not prominent

**Interest Categories** (8-10 options):
1. **Serial Killers** - Most comprehensive documentaries and series
2. **Cold Cases** - Unsolved mysteries and investigations
3. **True Crime Podcasts** - Audio content and adaptations
4. **Court Cases** - Legal proceedings and trials
5. **Missing Persons** - Disappearances and searches
6. **Forensic Science** - Investigation techniques and evidence
7. **Historical Crimes** - Older cases and period pieces
8. **International Cases** - Global True Crime stories
9. **Cult & Conspiracy** - Organized crime and conspiracies
10. **Survivor Stories** - First-person accounts and recoveries

**Available Actions**:
- **Primary**: Select 3-5 interest categories (minimum 1)
- **Secondary**: "I'm interested in everything" option
- **Tertiary**: Skip step (impacts recommendation quality)

**Visual Hierarchy**:
1. Progress and step explanation
2. Category grid with clear selection states
3. Continue button (enabled after minimum selection)
4. Skip option

**System Feedback**:
- Selected categories highlight with Investigation Red accent
- Counter showing selections (e.g., "3 of 5 selected")
- Recommendation preview: "Based on your interests, we'll suggest..."

**Microcopy**:
- Headline: "What True Crime content interests you most?"
- Subhead: "We'll personalize your recommendations based on your preferences"
- Selection note: "Choose at least one (you can change these later)"

### Step 4: Platform Integration

#### Task Flow
User connects streaming services and cable provider to enable content discovery

#### State Description
**Visual Layout**:
- List of popular streaming platforms with logos
- Cable provider section (collapsible)
- Progress indicator (Step 3 of 4)
- Clear explanation of benefits for each connection

**Platform Options** (Priority order):
1. **Netflix** - Largest True Crime library
2. **Hulu** - Investigation Discovery partnership
3. **Investigation Discovery** - Specialized True Crime network
4. **Amazon Prime Video** - Growing True Crime collection
5. **HBO Max/Discovery+** - Premium True Crime content
6. **Peacock** - NBC True Crime specials
7. **Paramount+** - CBS True Crime shows
8. **Apple TV+** - Original True Crime series

**Available Actions**:
- **Primary**: "Connect" button for each platform
- **Secondary**: "Add Cable Provider" expandable section
- **Tertiary**: "Skip for now" (significantly reduces experience)

**Connection Flow**:
1. User selects platform
2. OAuth authentication window opens
3. User logs into platform
4. Connection confirmed with checkmark
5. Brief preview of available content shown

**Visual Hierarchy**:
1. Benefits explanation
2. Connected platforms (green checkmarks)
3. Available platforms to connect
4. Cable provider section
5. Continue button (available even with zero connections)

**System Feedback**:
- Loading spinner during OAuth flow
- Success checkmarks for connected platforms
- Content preview: "We found 47 True Crime titles on Netflix"
- Warning for skipping: "You'll miss personalized content discovery"

**Error Recovery**:
- Clear error messages for failed connections
- "Try again" buttons for authentication failures
- Alternative email/password option if OAuth fails
- Support link for platform-specific issues

### Step 5: First Content Addition (Guided Tutorial)

#### Task Flow
Guided experience to add first piece of content and understand core value

#### State Description
**Visual Layout**:
- Split screen: tutorial explanation + live app interface
- Progress indicator (Step 4 of 4)
- Highlighted interactive elements
- Popular True Crime content suggestions based on interests

**Tutorial Steps**:
1. **Search Demonstration**: "Try searching for a case or person you're interested in"
2. **Content Selection**: "Choose something to add to your tracking list"
3. **Status Setting**: "Mark it as 'Want to Watch', 'Watching', or 'Completed'"
4. **Platform Discovery**: "See which of your platforms has this content"

**Available Actions**:
- **Primary**: Follow tutorial prompts
- **Secondary**: Skip tutorial (not recommended)
- **Contextual**: Search, add to list, set status, rate content

**State Changes**:
- Tutorial overlay guides user through each action
- Real content added to user's actual tracking list
- Live search results based on connected platforms
- Immediate feedback for each completed action

**Visual Hierarchy**:
1. Tutorial instructions (overlay or side panel)
2. Highlighted actionable elements
3. Search results and content cards
4. Status indicators and buttons
5. "Complete Setup" final button

**System Feedback**:
- Step-by-step progress through tutorial
- Real-time search suggestions
- Content availability indicators
- Success animations for completed actions

**Microcopy**:
- Welcome: "Let's add your first True Crime content!"
- Search prompt: "What case or person interests you? Try 'Ted Bundy' or 'Golden State Killer'"
- Success: "Great! You've added [Content Name] to your list"

### Step 6: Dashboard Introduction & Success State

#### Task Flow
User sees personalized dashboard and understands ongoing value

#### State Description
**Visual Layout**:
- Personalized dashboard with user's content
- Recommendations based on interests and connections
- Brief feature tour highlights
- Clear navigation to main app sections

**Dashboard Elements**:
1. **Continue Watching** - Previously started content
2. **Watchlist** - Content marked as "Want to Watch"
3. **Recommended for You** - Based on interests and platform availability
4. **Trending Now** - Popular True Crime content
5. **Your Stats** - Content tracked, hours watched, etc.

**Available Actions**:
- **Primary**: Browse and explore content
- **Secondary**: "Take a quick tour" of features
- **Contextual**: Add more content, adjust settings

**Success Indicators**:
- User has connected at least one platform
- User has added at least one piece of content
- Personalized recommendations are displaying
- Clear path forward for continued engagement

**Visual Hierarchy**:
1. Welcome back message with user's name
2. Primary content sections (Continue Watching, Watchlist)
3. Personalized recommendations
4. Secondary features and settings access

**System Feedback**:
- Loading indicators for dynamic content
- Smooth animations between sections
- Content availability updates
- Notification preferences prompt

**Microcopy**:
- Welcome: "Welcome to your True Crime tracking hub, [Name]!"
- Success message: "You're all set! Start exploring your personalized recommendations"
- Next steps: "Add more content to get better recommendations"

---

## Advanced Users & Edge Cases

### Power User Shortcuts

**Quick Setup Option**:
- "I'm an existing True Crime fan" fast track
- Import from other tracking services (TV Time, Letterboxd)
- Bulk platform connection
- Advanced interest profiling with specific preferences

**Efficiency Features**:
- Keyboard shortcuts for navigation
- Bulk content addition
- Advanced search filters immediately available
- Social features setup during onboarding

### Empty States

#### First-Time Use Scenarios

**No Platforms Connected**:
- Clear explanation of limited experience
- Prominent platform connection options
- Alternative content discovery methods
- Success stories from users with connections

**No Interests Selected**:
- Generic but still relevant recommendations
- Popular True Crime content trending now
- Easy interest modification from any screen
- Gradual learning from user behavior

**No Content Added**:
- Gentle encouragement to explore
- Trending and popular content prominently displayed
- Search suggestions based on current True Crime news
- Quick add buttons for popular titles

#### Technical Edge Cases

**Platform Connection Failures**:
- Clear error messaging with specific steps
- Alternative connection methods
- Customer support contact options
- Graceful degradation to manual content addition

**Slow Network Conditions**:
- Offline-capable onboarding flow
- Essential steps work without connection
- Sync when connection restored
- Clear indicators for delayed operations

### Error States

#### Authentication Errors

**OAuth Failures**:
- User-friendly error messages
- Alternative authentication methods
- Platform-specific troubleshooting
- Contact support escalation

**Account Creation Issues**:
- Duplicate email handling
- Password requirement violations
- Social login conflicts
- Recovery and retry flows

#### Platform Integration Errors

**API Failures**:
- Graceful degradation to basic functionality
- Retry mechanisms with exponential backoff
- Clear status indicators
- Alternative content discovery methods

**Content Loading Issues**:
- Skeleton loading states
- Partial content display
- Refresh and retry options
- Offline content caching

### Loading States

#### Authentication Loading

**Social Login**:
- Spinner with platform branding
- "Connecting to [Platform]..." message
- Estimated time indicator
- Cancel option available

#### Platform Connection Loading

**OAuth Flow**:
- Progress indicator for multi-step process
- "Connecting to Netflix..." status
- Success/failure immediate feedback
- Batch connection status display

#### Content Discovery Loading

**Search Results**:
- Skeleton cards for consistent layout
- Progressive content loading
- Search suggestion loading
- Platform availability checking

### Offline/Connectivity

**Limited Connectivity**:
- Core onboarding works offline
- Sync queue for when connection restored
- Clear indicators for network-dependent features
- Essential information cached locally

**No Connectivity**:
- Basic account creation still possible
- Platform connections queued for later
- Offline content recommendations
- Clear messaging about limited functionality

---

## Key Decision Points

### Skip vs. Complete Steps

**Interest Selection**:
- **Skip Impact**: Generic recommendations, less personalized experience
- **Complete Impact**: Highly targeted content discovery, better engagement
- **Recommendation**: Encourage completion with preview of benefits

**Platform Connection**:
- **Skip Impact**: Significantly reduced app value, manual content discovery only
- **Complete Impact**: Full app experience, automated content availability
- **Recommendation**: Strong encouragement to connect at least one platform

### Privacy & Social Features

**Social Setup During Onboarding**:
- **Delayed Approach**: Focus on personal tracking first, introduce social later
- **Immediate Approach**: Show community value early, risk overwhelming new users
- **Recommendation**: Introduce social features after user establishes tracking habit

### Data Collection Balance

**Minimal vs. Comprehensive Profiling**:
- **Minimal**: Faster onboarding, less targeted experience
- **Comprehensive**: Better personalization, potential user fatigue
- **Recommendation**: Progressive profiling over time rather than front-loading

---

## Success Metrics & Validation

### Completion Metrics
- **Full Flow Completion**: 70% target
- **Platform Connection**: 60% connect at least one platform
- **Content Addition**: 80% add first content during onboarding
- **Interest Selection**: 85% select at least one interest

### Engagement Metrics
- **7-Day Return Rate**: 85% target
- **First Content Addition**: Within 24 hours of signup
- **Platform Usage**: Users explore connected platform content within first week
- **Feature Discovery**: Users understand core tracking functionality

### Quality Metrics
- **User Satisfaction**: Post-onboarding survey ratings
- **Task Completion Time**: Average onboarding duration
- **Error Rates**: Authentication and platform connection success rates
- **Support Requests**: Onboarding-related help queries

---

This comprehensive user journey ensures new users understand the True Crime tracker's value proposition, successfully complete essential setup steps, and develop the tracking habits that drive long-term engagement with the application.