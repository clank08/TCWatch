---
title: User Journey Overview - True Crime Tracker
description: Comprehensive overview of all user journeys across the True Crime tracking application
last-updated: 2025-09-16
version: 1.0.0
related-files:
    - features/user-onboarding/user-journey.md
    - features/content-discovery/user-journey.md
    - features/content-tracking/user-journey.md
    - features/social/user-journey.md
status: approved
---

# User Journey Overview - True Crime Tracker

## Executive Summary

This document provides a holistic view of the user experience across the True Crime tracking application, connecting individual feature journeys into a cohesive narrative that demonstrates how users progress from initial discovery to becoming engaged community members.

## Journey Architecture

### Primary User Paths

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│  Discovery  │────▶│  Onboarding  │────▶│   Tracking  │────▶│  Social  │
│   (Entry)   │     │  (Activation)│     │ (Engagement)│     │ (Loyalty)│
└─────────────┘     └──────────────┘     └─────────────┘     └──────────┘
```

### User Evolution Stages

1. **Curious Visitor** - Exploring the app's value proposition
2. **New User** - Setting up profile and preferences
3. **Active Tracker** - Regularly tracking and discovering content
4. **Engaged Researcher** - Using advanced features and lists
5. **Community Contributor** - Sharing insights and collaborating

---

## Complete User Journey Map

### Phase 1: Discovery & Acquisition

#### Entry Points

**Organic Discovery**
- App store search for "true crime tracker"
- Social media recommendations
- True Crime forum discussions
- Friend referrals with shared lists

**Marketing Touchpoints**
- Podcast sponsorships on True Crime shows
- Community partnerships with case-focused groups
- Content creator collaborations
- SEO-optimized landing pages

#### Value Recognition

**Immediate Value Signals**
- "Track content across 200+ platforms"
- "Never miss content about your followed cases"
- "Connect with serious True Crime researchers"
- "Privacy-first social features"

**Differentiation Points**
- Case-based organization (not platform-first)
- Comprehensive platform coverage
- Research-focused community
- Respectful, investigative approach

---

### Phase 2: Onboarding & Activation

#### Welcome Flow (0-5 minutes)

**Step 1: Account Creation**
- Email/social sign-up
- Privacy tier selection (Private/Selective/Community)
- Terms acceptance with privacy emphasis

**Step 2: Platform Connection**
- Quick connect to top 5 streaming services
- Optional bulk platform import
- Skip option for manual addition later

**Step 3: Interest Profiling**
- Select favorite cases/killers
- Choose content preferences (documentaries, series, movies)
- Set tracking goals (casual viewer vs. researcher)

**Step 4: First Content Addition**
- Guided discovery of popular content
- One-tap tracking of first item
- Success confirmation with next steps

#### Activation Metrics

- **Time to First Track**: < 3 minutes
- **Platforms Connected**: Average 3-5 in first session
- **Initial Content Added**: 3-7 items in onboarding
- **Profile Completion**: 60% in first session

---

### Phase 3: Core Experience Loop

#### Daily Active Use Pattern

```
Morning Check (30 seconds)
│
├─▶ Notification Review
│   └─▶ New content alerts for followed cases
│
├─▶ Quick Status Updates
│   └─▶ Mark last night's viewing as completed
│
└─▶ Discovery Browse
    └─▶ Check trending cases or friend activity
```

#### Weekly Engagement Pattern

```
Sunday Planning (5-10 minutes)
│
├─▶ Review Watchlist
│   ├─▶ Organize "Want to Watch" items
│   └─▶ Check platform availability
│
├─▶ Discover New Content
│   ├─▶ Browse by favorite cases
│   └─▶ Check friend recommendations
│
└─▶ Social Interaction
    ├─▶ Share discovered content
    └─▶ Update collaborative lists
```

#### Monthly Research Pattern

```
Deep Dive Sessions (30-60 minutes)
│
├─▶ Case Exploration
│   ├─▶ Comprehensive content search
│   └─▶ Timeline organization
│
├─▶ List Curation
│   ├─▶ Create thematic lists
│   └─▶ Share research findings
│
└─▶ Community Engagement
    ├─▶ Participate in discussions
    └─▶ Connect with experts
```

---

### Phase 4: Feature Integration Journey

#### Content Discovery → Tracking Flow

```
Search for "BTK Killer"
    │
    ▼
View 15 results across platforms
    │
    ▼
Filter to Netflix + Hulu (user's platforms)
    │
    ▼
Quick add 3 documentaries to "Want to Watch"
    │
    ▼
Deep link to Netflix to start watching
    │
    ▼
Return to app to mark "Currently Watching"
```

#### Tracking → Social Sharing Flow

```
Complete watching "Mindhunter" Season 2
    │
    ▼
Rate and add personal notes
    │
    ▼
System suggests sharing with friends interested in FBI cases
    │
    ▼
Create custom list: "Best FBI Behavioral Science Content"
    │
    ▼
Share with privacy settings (friends only)
    │
    ▼
Friends add content and provide feedback
```

#### Social → Discovery Enhancement Flow

```
Friend shares "Unsolved Mysteries" list
    │
    ▼
Browse list and find 5 new cases
    │
    ▼
Follow 2 interesting cold cases
    │
    ▼
Receive notifications for new content
    │
    ▼
Discover documentary on followed case
    │
    ▼
Add to tracking and thank friend
```

---

### Phase 5: Advanced User Journeys

#### The Researcher Path

**Profile**: Academic or journalist studying True Crime

```
Journey Focus:
1. Comprehensive case documentation
2. Timeline-based content organization
3. Source verification and accuracy ratings
4. Expert network connections
5. Collaborative research lists
```

**Key Features Used**:
- Advanced search with boolean operators
- Custom tagging and categorization
- Private research notes
- Expert verification badge
- Academic discussion forums

#### The Binge Watcher Path

**Profile**: Enthusiast who consumes content in marathons

```
Journey Focus:
1. Efficient watchlist management
2. Series progress tracking
3. Platform optimization for availability
4. Spoiler-free social features
5. Next-watch recommendations
```

**Key Features Used**:
- Bulk status updates
- Season-level tracking
- Platform availability filters
- Watch time statistics
- Personalized recommendations

#### The Social Curator Path

**Profile**: Community leader who shares discoveries

```
Journey Focus:
1. List creation and management
2. Content curation for others
3. Community engagement
4. Trend identification
5. Influence metrics
```

**Key Features Used**:
- Public list creation
- Follower management
- Activity feed curation
- Content recommendations
- Community moderation tools

---

## Critical User Moments

### Moments of Delight

1. **First Successful Platform Deep Link**
   - Seamless transition from app to content
   - Time saved finding content manually

2. **Discovering Comprehensive Case Coverage**
   - Finding all content about a specific case
   - Organized timeline view of available content

3. **Friend Recommendation Success**
   - Discovering amazing content through trusted friends
   - Shared experience of watching together

4. **Tracking Milestone Achievement**
   - Completing a full series or case study
   - Visual celebration of accomplishment

### Moments of Friction (and Solutions)

1. **Platform Connection Complexity**
   - Solution: Progressive disclosure, connect as needed
   - Quick skip option with later reminders

2. **Privacy Concern on Social Features**
   - Solution: Clear privacy-first messaging
   - Granular controls visible upfront

3. **Overwhelming Content Options**
   - Solution: Smart filtering and personalization
   - Focus on quality over quantity

4. **Respectful Content Handling**
   - Solution: Content warnings where appropriate
   - Community guidelines prominently displayed

---

## User Journey Metrics

### Engagement Funnel

```
100% - App Download
 │
75% - Complete Onboarding
 │
60% - Add First Content
 │
45% - Track 5+ Items
 │
35% - Weekly Active User
 │
25% - Use Social Features
 │
15% - Community Contributor
 │
10% - Power User (Daily Active)
```

### Time-to-Value Metrics

- **First Content Track**: < 3 minutes
- **Platform Connection**: < 30 seconds per platform
- **Friend Connection**: < 1 minute
- **List Creation**: < 2 minutes
- **Content Discovery**: < 10 seconds to results

### Retention Indicators

- **Day 1**: 80% add at least one content item
- **Day 7**: 60% have tracked 5+ items
- **Day 30**: 40% are weekly active users
- **Day 90**: 25% have used social features
- **Day 180**: 15% are community contributors

---

## Cross-Journey Integration Points

### Data Flow Between Features

```
User Preferences (Onboarding)
    ↓
Personalized Discovery
    ↓
Content Tracking
    ↓
Social Sharing
    ↓
Community Intelligence
    ↓
Enhanced Discovery
```

### Privacy-Preserved Information Sharing

1. **Anonymous Aggregation**
   - Trending content without user attribution
   - Popular platform combinations
   - Average completion rates

2. **Opt-in Social Data**
   - Friend activity with consent
   - Shared lists with permissions
   - Public reviews with pseudonyms

3. **Private-by-Default**
   - Personal notes never shared
   - Watch history protected
   - Custom tags private

---

## Journey Evolution & Optimization

### Continuous Improvement Areas

1. **Onboarding Optimization**
   - A/B test platform connection order
   - Refine interest profiling questions
   - Optimize time-to-first-track

2. **Discovery Enhancement**
   - Improve search relevance
   - Expand platform coverage
   - Refine recommendation algorithms

3. **Social Feature Adoption**
   - Reduce friction for friend connections
   - Highlight privacy protections
   - Showcase community value

4. **Retention Drivers**
   - Personalized re-engagement
   - Milestone celebrations
   - Content notifications

### Future Journey Expansions

1. **Live Event Integration**
   - True Crime convention schedules
   - Podcast release tracking
   - Documentary premiere alerts

2. **Educational Pathways**
   - Guided case studies
   - Historical context integration
   - Expert commentary tracks

3. **Research Tools**
   - Citation management
   - Fact-checking integration
   - Timeline builders

---

## Conclusion

The True Crime Tracker user journey is designed to evolve with user needs, supporting everything from casual content tracking to serious research collaboration. By maintaining a privacy-first approach and focusing on case-based organization, the application creates a unique value proposition that serves the specific needs of the True Crime community while fostering respectful, educational engagement with sensitive content.

The journey emphasizes:
- **Progressive Disclosure**: Features revealed as users need them
- **Privacy by Design**: Every social interaction is opt-in
- **Research Focus**: Tools for serious investigation, not just entertainment
- **Community Value**: Collective intelligence enhances individual experience
- **Respectful Approach**: Appropriate handling of sensitive content

Success is measured not just by engagement metrics, but by the quality of user experience and the value provided to the True Crime community in their content discovery and research endeavors.