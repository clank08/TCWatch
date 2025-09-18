---
title: State Specifications - Loading, Empty, Error & Success
description: Comprehensive specifications for all UI states across the True Crime tracking application
feature: Design System Foundation
last-updated: 2025-01-16
version: 1.0.0
related-files:
  - ../style-guide.md
  - buttons.md
  - forms.md
  - ../tokens/colors.md
dependencies:
  - Platform API integrations
  - Network connectivity handling
  - User feedback systems
status: approved
---

# State Specifications - Loading, Empty, Error & Success

## Overview

This document defines comprehensive specifications for all UI states in the True Crime tracking application. These states ensure users receive clear feedback about system status, maintain engagement during loading periods, and provide clear recovery paths when issues occur.

## State Philosophy

Our state design principles:
- **Investigative Clarity**: States provide clear, specific information like case evidence
- **User Empowerment**: Always provide actionable next steps
- **Emotional Consideration**: Respectful tone appropriate for True Crime content
- **Performance Perception**: Loading states make wait times feel shorter
- **Accessibility First**: All states work with screen readers and assistive technology

## Table of Contents

1. [Loading States](#loading-states)
2. [Empty States](#empty-states)
3. [Error States](#error-states)
4. [Success States](#success-states)
5. [Implementation Guidelines](#implementation-guidelines)

---

## Loading States

### Core Loading Principles
- **Perceived Performance**: Make loading feel faster than actual time
- **Progressive Enhancement**: Show content as it becomes available
- **Contextual Feedback**: Provide specific loading context, not just generic spinners
- **Graceful Degradation**: Functional even when loading takes longer than expected

---

### Primary Loading State

**Visual Design Specifications**:

**Loading Spinner**:
- **Size**: 24px diameter for inline, 32px for full-screen
- **Color**: Investigation-Red (`#DC143C`)
- **Stroke Width**: 2px
- **Animation**: 1.2s linear infinite rotation
- **Background**: Transparent center with progress arc

**Typography**:
- **Loading Text**: Body (`16px`), Medium (500)
- **Context Text**: Body Small (`14px`), Regular (400)
- **Color**: Dark-Text-Secondary (`#E5E5E7`) on dark backgrounds

**Layout**:
- **Centered**: Horizontally and vertically centered in container
- **Spacing**: 16px between spinner and text
- **Container**: Minimum 120px height for comfortable spacing
- **Background**: Semi-transparent overlay when over content

**Animation Specifications**:
- **Rotation**: Smooth 360-degree rotation at 1.2s duration
- **Entrance**: Fade in over 200ms when loading begins
- **Exit**: Fade out over 150ms when loading completes
- **Pulse**: Optional subtle pulse animation for longer loads

**Contextual Loading Messages**:
- **Content Search**: "Searching across platforms..."
- **Platform Connection**: "Connecting to Netflix..."
- **Data Sync**: "Syncing your watchlist..."
- **Authentication**: "Signing you in..."
- **Content Addition**: "Adding to your list..."

---

### Skeleton Loading State

**Purpose**: Show layout structure while content loads

**Visual Design Specifications**:

**Skeleton Elements**:
- **Background**: Dark-200 (`#2C2C2E`) base color
- **Shimmer**: Lighter overlay (`#3A3A3C`) animating left to right
- **Border Radius**: Match actual content (8px for cards, 4px for text)
- **Dimensions**: Exact dimensions of content being loaded

**Content Card Skeleton**:
- **Image Area**: 120x80px rectangle with rounded corners
- **Title**: 80% width rectangle, 16px height
- **Description**: Two lines at 100% and 60% width, 12px height each
- **Metadata**: Three small rectangles (40px, 30px, 50px width)

**Text Skeleton**:
- **Headings**: 60-80% of container width, height matching actual text
- **Body Text**: Multiple lines with varying widths (100%, 95%, 78%)
- **Metadata**: Short rectangles matching typical metadata length

**Animation**:
- **Shimmer Effect**: Linear gradient moving left to right over 1.5s
- **Continuous Loop**: Seamless infinite animation
- **Subtle Movement**: 150px wide shimmer highlight

**Implementation**:
```css
.skeleton {
  background: linear-gradient(
    90deg,
    #2C2C2E 25%,
    #3A3A3C 50%,
    #2C2C2E 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

### Progressive Loading State

**Purpose**: Show content as it becomes available

**Content Prioritization**:
1. **Critical Content**: User's own watchlist and tracking data
2. **Platform Content**: Content availability from connected platforms
3. **Recommendations**: Personalized suggestions based on interests
4. **Community Content**: Social features and trending content

**Progressive Reveal**:
- **Stage 1**: Show user's personal content immediately
- **Stage 2**: Add platform-specific content as APIs respond
- **Stage 3**: Include community and recommendation content
- **Stage 4**: Final polish with images and detailed metadata

**Visual Indicators**:
- **Section Loading**: Individual sections show skeleton while loading
- **Content Streaming**: New content appears smoothly as it loads
- **Completion Indicator**: Subtle indication when all content loaded

---

### Timeout Loading State

**Purpose**: Handle extended loading periods gracefully

**Timeout Thresholds**:
- **Quick Actions**: 3 seconds (search, add to list)
- **Platform Connections**: 10 seconds (OAuth flows)
- **Content Discovery**: 5 seconds (search results)
- **Sync Operations**: 15 seconds (data synchronization)

**Extended Loading UI**:
- **Progress Indicator**: Determinate progress bar when possible
- **Detailed Status**: "Loading content from 3 of 5 platforms..."
- **Cancel Option**: Allow user to cancel long operations
- **Entertainment**: Interesting True Crime facts during very long loads

**Fallback Behavior**:
- **Partial Results**: Show available content even if some sources fail
- **Retry Option**: Easy retry for failed operations
- **Alternative Actions**: Suggest related actions user can take immediately

---

## Empty States

### Core Empty State Principles
- **Opportunity Focus**: Present empty states as opportunities, not failures
- **Clear Guidance**: Specific, actionable steps to populate content
- **Contextual Help**: Relevant to the specific feature and user state
- **Visual Appeal**: Maintain dark theme aesthetic while being encouraging

---

### First-Time Use Empty State

**Purpose**: Guide new users who haven't added any content yet

**Visual Design Specifications**:

**Illustration**:
- **Style**: Simple, outlined illustrations matching dark theme
- **Color**: Neutral-400 (`#A3A3A3`) with Investigation-Red accent
- **Size**: 120px on mobile, 160px on desktop
- **Theme**: Investigation-related imagery (magnifying glass, evidence files)

**Typography**:
- **Headline**: H3 (`20px`), Semibold (600), center-aligned
- **Description**: Body (`16px`), Regular (400), center-aligned
- **CTA Text**: Body (`16px`), Semibold (600)
- **Color**: Dark-Text-Primary for headlines, Dark-Text-Secondary for descriptions

**Content Structure**:
- **Headline**: "Start Your True Crime Investigation"
- **Description**: "Add content to track what you've watched and discover new cases across all your platforms"
- **Primary CTA**: "Search for Content" (Investigation-Red button)
- **Secondary CTA**: "Browse Popular Cases" (Ghost button)

**Layout**:
- **Centered**: All content vertically and horizontally centered
- **Spacing**: 24px between illustration and headline, 16px between text elements
- **Container**: Maximum 400px width for optimal reading
- **Bottom Actions**: CTAs stacked on mobile, side-by-side on desktop

---

### No Search Results Empty State

**Purpose**: Help users when searches return no results

**Visual Design Specifications**:

**Search-Specific Illustration**:
- **Theme**: Empty search folder or detective looking through files
- **Color Treatment**: Neutral with subtle Investigation-Red details
- **Animation**: Optional subtle animation (file opening, magnifying glass movement)

**Helpful Content**:
- **Headline**: "No Results Found"
- **Context**: "We couldn't find any True Crime content matching '[search term]'"
- **Suggestions**:
  - "Try different keywords or broader terms"
  - "Check spelling of names and cases"
  - "Browse by category instead"

**Actionable Options**:
- **Search Suggestions**: "Try 'serial killers', 'cold cases', or 'forensic science'"
- **Popular Searches**: Show trending search terms
- **Browse Alternative**: "Browse All Content" button
- **Request Content**: "Request Missing Content" feedback option

**Alternative Searches**:
- **Similar Terms**: "Did you mean 'Ted Bundy'?" for misspellings
- **Related Cases**: "Try searching for 'Green River Killer' or 'Gary Ridgway'"
- **Category Suggestions**: "Browse Serial Killers category"

---

### No Platform Content Empty State

**Purpose**: Address situations when user's connected platforms have no relevant content

**Visual Design**:
- **Platform-Aware**: Include logos of user's connected platforms
- **Neutral Tone**: Not critical of platforms, focus on solutions

**Informative Content**:
- **Headline**: "Not Available on Your Platforms"
- **Context**: "This content isn't currently available on Netflix, Hulu, or Investigation Discovery"
- **Alternatives**: Show other platforms where content is available

**Actionable Solutions**:
- **Platform Suggestions**: "Available on Amazon Prime (rent for $3.99)"
- **Watchlist Option**: "Add to watchlist and get notified if it becomes available"
- **Similar Content**: "Find similar content on your platforms"
- **Free Alternatives**: Link to free options if available

---

### Offline Empty State

**Purpose**: Provide helpful guidance when network connectivity is limited

**Visual Design**:
- **Network Theme**: Simple wifi/connection icon illustration
- **Muted Colors**: Lower contrast indicating reduced functionality

**Offline-Specific Messaging**:
- **Headline**: "You're Offline"
- **Context**: "Connect to the internet to search and discover new content"
- **Available Actions**: "View your saved watchlist and tracking history"

**Offline Functionality**:
- **Cached Content**: Show previously loaded content
- **Read-Only Mode**: Allow viewing but not editing
- **Sync Queue**: "Your changes will sync when you're back online"
- **Retry Connection**: "Try Again" button to check connectivity

---

## Error States

### Core Error Principles
- **User-Friendly Language**: No technical jargon or error codes
- **Specific Context**: Explain exactly what went wrong
- **Recovery Focus**: Always provide clear next steps
- **Responsibility**: Take ownership without blaming user or external services

---

### General Error State

**Purpose**: Handle unexpected errors with grace and clarity

**Visual Design Specifications**:

**Error Illustration**:
- **Style**: Consistent with empty state illustrations
- **Color**: Investigation-Red primary with neutral accents
- **Theme**: Detective with question mark, broken case file, investigation roadblock
- **Size**: Same sizing as empty states (120px mobile, 160px desktop)

**Typography Hierarchy**:
- **Error Headline**: H3 (`20px`), Semibold (600)
- **Error Description**: Body (`16px`), Regular (400)
- **Technical Details**: Body Small (`14px`), Regular (400), collapsible
- **Action Buttons**: Body (`16px`), Semibold (600)

**Color Usage**:
- **Headlines**: Investigation-Red (`#DC143C`)
- **Descriptions**: Dark-Text-Primary (`#FFFFFF`)
- **Technical Details**: Dark-Text-Tertiary (`#A1A1A6`)
- **Buttons**: Investigation-Red background for primary actions

**Content Structure**:
- **Headline**: "Something Went Wrong"
- **User-Friendly Explanation**: Non-technical description of the issue
- **Impact Statement**: How this affects the user's experience
- **Recovery Actions**: Specific steps user can take

**Recovery Actions**:
- **Primary**: "Try Again" button (Investigation-Red)
- **Secondary**: "Go Back" or alternative action (Ghost button)
- **Support**: "Contact Support" link if problem persists
- **Refresh**: "Refresh Page/App" option for web/app contexts

---

### Network Error State

**Purpose**: Handle connectivity-related issues specifically

**Network-Specific Messaging**:
- **Headline**: "Connection Problem"
- **Description**: "We can't reach our servers right now. This might be a network issue."
- **User Context**: Distinguish between user's network and service issues

**Diagnostic Information**:
- **Connection Status**: "Check your internet connection"
- **Service Status**: "All services are operational" or link to status page
- **Last Successful Sync**: "Last updated 5 minutes ago"

**Recovery Options**:
- **Retry Connection**: Attempt to reconnect automatically
- **Offline Mode**: Switch to cached/offline functionality
- **Network Settings**: Link to device network settings (mobile)
- **Alternative Access**: Suggest different connection method

---

### Platform API Error State

**Purpose**: Handle errors from streaming platform integrations

**Platform-Specific Context**:
- **Service Identification**: "Netflix Connection Error"
- **Service Impact**: "We can't check Netflix availability right now"
- **Alternative Functionality**: "Other platforms are working normally"

**Platform Error Types**:

**Authentication Expired**:
- **Headline**: "Netflix Login Expired"
- **Description**: "Your Netflix connection needs to be renewed"
- **Action**: "Reconnect to Netflix" button
- **Impact**: "Netflix content won't show as available until reconnected"

**Service Unavailable**:
- **Headline**: "Netflix Temporarily Unavailable"
- **Description**: "Netflix's service is experiencing issues"
- **Action**: "Try Again Later" or "Check Other Platforms"
- **Estimated Recovery**: "We'll retry automatically in 5 minutes"

**Rate Limited**:
- **Headline**: "Too Many Requests"
- **Description**: "We've made too many requests to Netflix recently"
- **Action**: "Please wait a few minutes and try again"
- **Prevention**: "This helps us maintain reliable service for everyone"

---

### Content Not Found Error State

**Purpose**: Handle missing or removed content gracefully

**Content-Specific Context**:
- **Headline**: "Content No Longer Available"
- **Description**: "[Content Name] has been removed or is no longer accessible"
- **Context**: Why content might be unavailable (licensing, removal, etc.)

**Alternative Actions**:
- **Similar Content**: "Find similar True Crime documentaries"
- **Watchlist Update**: "Remove from watchlist" or "Mark as unavailable"
- **Notification Setup**: "Notify me if this becomes available again"
- **Related Searches**: "Search for other content about [Case Name]"

---

### Permission/Access Error State

**Purpose**: Handle authorization and access restriction issues

**Access-Specific Messaging**:
- **Headline**: "Access Restricted"
- **Description**: Context-appropriate explanation of access limitation
- **User Education**: Explain why access is restricted

**Permission Types**:

**Account Required**:
- **Headline**: "Sign In Required"
- **Description**: "Create an account to track and manage your True Crime content"
- **Action**: "Sign In" or "Create Account" buttons

**Platform Subscription Required**:
- **Headline**: "Netflix Subscription Required"
- **Description**: "This content is only available to Netflix subscribers"
- **Actions**: "Subscribe to Netflix" or "Find Alternative Platforms"

**Geographic Restrictions**:
- **Headline**: "Not Available in Your Region"
- **Description**: "This content isn't available in your location due to licensing restrictions"
- **Alternatives**: "Find similar content available in your region"

---

## Success States

### Core Success Principles
- **Celebration Appropriate**: Positive but respectful of True Crime content gravity
- **Clear Confirmation**: Unambiguous confirmation of successful actions
- **Next Steps**: Guide users toward continued engagement
- **Achievement Recognition**: Acknowledge user progress and milestones

---

### Action Confirmation Success State

**Purpose**: Confirm successful completion of user actions

**Visual Design Specifications**:

**Success Animation**:
- **Icon**: Green checkmark with subtle bounce animation
- **Duration**: 300ms entrance, 2s display, 200ms exit
- **Color**: Success-Primary (`#16A34A`)
- **Size**: 24px for inline confirmations, 48px for full-screen

**Typography**:
- **Headline**: H4 (`18px`), Medium (500)
- **Description**: Body (`16px`), Regular (400)
- **Color**: Success-Primary for headlines, Dark-Text-Primary for descriptions

**Common Success Messages**:

**Content Added**:
- **Headline**: "Added to Your Watchlist"
- **Description**: "[Content Name] has been added successfully"
- **Next Action**: "View Watchlist" or "Continue Browsing"

**Platform Connected**:
- **Headline**: "Netflix Connected Successfully"
- **Description**: "We found 47 True Crime titles on your Netflix account"
- **Next Action**: "Browse Netflix Content" or "Connect Another Platform"

**Profile Updated**:
- **Headline**: "Profile Updated"
- **Description**: "Your preferences have been saved"
- **Next Action**: "View Updated Recommendations"

---

### Milestone Achievement Success State

**Purpose**: Celebrate user progress and engagement milestones

**Achievement Visual Design**:
- **Badge/Medal**: Circular badge with investigative theme
- **Animation**: Gentle scale animation and sparkle effects
- **Color**: Gold/bronze gradient with Investigation-Red accents
- **Style**: Consistent with overall dark theme aesthetic

**Achievement Types**:

**First Content Added**:
- **Badge**: "Detective Badge" - magnifying glass icon
- **Title**: "First Case Opened"
- **Description**: "You've added your first True Crime content!"

**Platform Master**:
- **Badge**: "Platform Detective" - multiple platform icons
- **Title**: "Connected Investigator"
- **Description**: "You've connected 3+ platforms for comprehensive tracking!"

**Content Curator**:
- **Badge**: "Evidence Collector" - file cabinet icon
- **Title**: "Case File Master"
- **Description**: "You've tracked 25+ pieces of True Crime content!"

**Social Contributor**:
- **Badge**: "Community Investigator" - people icon
- **Title**: "Social Sleuth"
- **Description**: "You've shared your first recommendation list!"

**Achievement Presentation**:
- **Modal/Overlay**: Non-intrusive overlay presentation
- **Dismissible**: Easy to dismiss but memorable
- **Shareable**: Option to share achievement on social platforms
- **Progress Hint**: Subtle hint toward next achievement level

---

### Data Sync Success State

**Purpose**: Confirm successful data synchronization across devices

**Sync Confirmation**:
- **Headline**: "Everything's Up to Date"
- **Description**: "Your watchlist and tracking data are synced across all devices"
- **Timestamp**: "Last synced: Just now"

**Sync Details**:
- **Items Synced**: "Synced 15 watchlist items and 8 completed shows"
- **Platforms Updated**: "Updated availability from 4 connected platforms"
- **Cross-Device**: "Available on all your devices"

---

### Social Action Success State

**Purpose**: Confirm successful social interactions while respecting privacy

**Privacy-Aware Messaging**:
- **Share Success**: "List shared privately with selected friends"
- **Privacy Reminder**: "Only friends you selected can see this list"
- **Control Emphasis**: "You can change sharing settings anytime"

**Social Confirmations**:

**List Shared**:
- **Headline**: "List Shared Successfully"
- **Description**: "Your 'Best Serial Killer Documentaries' list is now visible to 3 friends"
- **Action**: "View Shared List" or "Manage Privacy Settings"

**Friend Connected**:
- **Headline**: "Friend Added"
- **Description**: "[Friend Name] can now see your public activity"
- **Privacy**: "Your watchlist remains private unless you choose to share"

---

## Implementation Guidelines

### Responsive State Design

**Mobile Considerations**:
- **Touch-Friendly**: All error recovery actions have 44px minimum touch targets
- **Screen Space**: Compact state messaging that doesn't overwhelm small screens
- **Thumb Navigation**: Critical actions positioned for easy thumb access
- **Orientation**: States work in both portrait and landscape orientations

**Desktop/Tablet Enhancements**:
- **Rich Content**: More detailed explanations and visual elements
- **Hover States**: Interactive hover effects for error recovery actions
- **Keyboard Navigation**: Full keyboard accessibility for all state interactions
- **Multi-Column**: Side-by-side layout for state message and actions when space permits

### Accessibility Implementation

**Screen Reader Support**:
- **State Announcements**: Automatic announcements when states change
- **Descriptive Labels**: Clear, descriptive labels for all interactive elements
- **Error Details**: Complete error information available to assistive technology
- **Success Confirmation**: Clear confirmation of successful actions

**Keyboard Navigation**:
- **Focus Management**: Proper focus handling during state transitions
- **Skip Options**: Allow skipping non-critical state interactions
- **Retry Shortcuts**: Keyboard shortcuts for common recovery actions
- **Tab Order**: Logical tab order through state interface elements

**Visual Accessibility**:
- **High Contrast**: All state indicators meet WCAG contrast requirements
- **Color Independence**: States work without color (iconography and text)
- **Animation Control**: Respect user's reduced motion preferences
- **Text Scaling**: States remain functional at 200% text zoom

### Performance Considerations

**Loading Optimization**:
- **Progressive Enhancement**: Show content as it becomes available
- **Skeleton Caching**: Cache skeleton layouts for instant display
- **Background Loading**: Continue loading while user interacts with available content
- **Preemptive States**: Anticipate likely loading scenarios

**Error Recovery Optimization**:
- **Intelligent Retry**: Automatic retry with exponential backoff
- **Partial Failure Handling**: Show successful results even when some operations fail
- **Offline Caching**: Cache critical data for offline error recovery
- **Graceful Degradation**: Maintain core functionality during various error states

### Testing and Quality Assurance

**State Testing Requirements**:
- **All Error Scenarios**: Test every identified error condition
- **Connectivity Variations**: Test with various network conditions
- **Platform Failures**: Simulate platform API failures and timeouts
- **Edge Cases**: Test with unusual data conditions and user states

**User Experience Testing**:
- **State Clarity**: Verify users understand each state and required actions
- **Recovery Success**: Measure success rates of error recovery flows
- **Loading Tolerance**: Test user patience with various loading scenarios
- **Accessibility Testing**: Full testing with screen readers and keyboard navigation

---

These comprehensive state specifications ensure the True Crime tracking application provides clear, helpful feedback to users in all situations while maintaining the investigative, serious tone appropriate for the content domain.