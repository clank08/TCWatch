---
title: Content Tracking - Complete User Journey
description: Comprehensive user flows for tracking True Crime content across platforms with privacy-first social features
feature: Content Tracking
last-updated: 2025-09-16
version: 1.0.0
related-files:
  - README.md
  - screen-states.md
  - implementation.md
  - ../../design-system/style-guide.md
dependencies:
  - User authentication system
  - Content database and metadata
  - Platform API integrations
  - Cross-device synchronization
status: approved
---

# Content Tracking - Complete User Journey

## Overview

Content tracking transforms the fragmented experience of consuming True Crime content across 200+ platforms into a cohesive, research-friendly system. This journey prioritizes quick status updates, meaningful progress visualization, and privacy-first social features that respect the serious nature of True Crime content.

## Primary User Goals

- **Track viewing progress** across all platforms without friction
- **Organize content** for research and reference purposes
- **Maintain viewing history** with personal notes and insights
- **Share discoveries** while maintaining privacy control
- **Sync progress** seamlessly across devices

## Success Criteria

- Users complete 95% of tracking updates in under 3 taps
- 80% of series content includes episode-level progress tracking
- Average user maintains 25+ items in their tracking system
- 60% of users add personal ratings/notes to completed content

---

## Core Experience Flow: Quick Content Tracking

### Step 1: Content Addition Entry Points

#### Trigger Scenarios

1. **Discovery Flow**: Add content directly from search results
2. **Browse Action**: Quick-add while browsing recommendations
3. **Social Addition**: Add from shared friend lists or recommendations
4. **Deep Link**: Add content from external platform notifications
5. **Manual Entry**: Add content not found in database search

#### Quick Add State

**Visual Layout**:
- Prominent "Add to Tracking" button on all content cards
- Quick status selector (Want to Watch, Currently Watching, etc.)
- Platform preference selector for multi-platform content
- Smart defaults based on user behavior and content type

**Available Actions**:
- **Primary**: Add with "Want to Watch" status (default)
- **Secondary**: Add with specific status selection
- **Tertiary**: Add to custom list simultaneously
- **Contextual**: Set platform preference, add with rating if re-watching

**System Feedback**:
- Immediate visual confirmation of addition
- Subtle animation showing content added to tracking
- Status indicator changes on content card
- Success toast with undo option

**Smart Defaults**:
- New content defaults to "Want to Watch"
- Previously rated content suggests "Currently Watching"
- Completed series suggest "Want to Watch" for related content
- Time-sensitive content (expiring soon) gets priority status

### Step 2: Status Management & Updates

#### Task Flow

User updates content status as viewing progresses, with emphasis on quick, contextual updates

#### Status Update State

**Five Primary Status Options**:

1. **Want to Watch**
   - Visual: Blue bookmark icon with subtle animation
   - Context: Content identified but not yet started
   - Quick Actions: Move to "Currently Watching", remove from list
   - Smart Features: Platform availability alerts, expiration warnings

2. **Currently Watching**
   - Visual: Orange progress ring with percentage/episode indicator
   - Context: Actively viewing content with progress tracking
   - Quick Actions: Mark episode complete, update progress, pause/hold
   - Smart Features: Next episode suggestions, binge-watching insights

3. **Completed**
   - Visual: Green checkmark with completion date
   - Context: Fully watched with rating/review opportunity
   - Quick Actions: Rate, review, add to public list, recommend to friends
   - Smart Features: Related content suggestions, sequel/follow-up alerts

4. **On Hold**
   - Visual: Amber pause icon with hold date
   - Context: Temporarily paused (common for disturbing content)
   - Quick Actions: Resume watching, move to abandoned, add hold reason
   - Smart Features: Gentle resume reminders, mood-based recommendations

5. **Abandoned**
   - Visual: Gray X with reason option
   - Context: Started but decided not to continue
   - Quick Actions: Remove from lists, add to "not interested", rate partially
   - Smart Features: Similar content warnings, preference learning

#### Progress Tracking Granularity

**For Series Content**:
- **Season View**: Visual grid showing season completion status
- **Episode Level**: Individual episode checkboxes with air dates
- **Batch Updates**: "Mark season complete", "catch up to latest"
- **Smart Resume**: Remember exact episode position across devices

**For Movies/Documentaries**:
- **Binary Completion**: Started/completed with viewing date
- **Rewatch Tracking**: Multiple viewing dates for rewatched content
- **Partial Viewing**: Option to mark as "partially watched" with notes
- **Quality Rating**: Technical quality vs content quality ratings

**For Podcast Series**:
- **Episode Progress**: Time-based progress bars for long episodes
- **Subscription Status**: Track ongoing podcast subscriptions
- **Platform Sync**: Integration with podcast apps where available
- **Transcript Notes**: Link to specific timestamps for research

### Step 3: Personal Organization & Research

#### Task Flow

User organizes tracked content for research purposes, adding personal insights and creating meaningful categories

#### Personal Dashboard State

**Visual Organization**:
- **Status Tabs**: Quick access to each tracking status
- **Visual Progress**: Completion rings, progress bars, streak indicators
- **Content Grid**: Rich cards showing poster, progress, rating, notes preview
- **Smart Sorting**: Recently updated, nearly complete, highest rated

**Research Tools**:
- **Private Notes**: Unlimited rich text for analysis and insights
- **Custom Tags**: User-defined organizational system (unsolved, 1980s, podcast-adapted)
- **Key Takeaways**: Structured highlighting of important insights
- **Cross-References**: Link related content within personal collection

**Available Actions**:
- **Primary**: Update status, add/edit notes, rate content
- **Secondary**: Create custom lists, tag content, export notes
- **Tertiary**: Share insights, compare with friends, set reminders

#### Advanced Tracking Features

**Viewing Statistics**:
- **Time Investment**: Total hours tracked across all content
- **Completion Rates**: Percentage of started content completed
- **Platform Utilization**: Distribution across connected platforms
- **Content Type Preferences**: Documentary vs series vs movie breakdown
- **Case Focus Areas**: Serial killers vs cold cases vs solved cases

**Research Organization**:
- **Case Collections**: Group all content related to specific cases
- **Perpetrator Profiles**: Comprehensive viewing history for specific killers
- **Timeline Views**: Content organized by case chronology or viewing history
- **Comparative Analysis**: Side-by-side content comparison for same cases

### Step 4: Social Integration (Privacy-First)

#### Task Flow

User decides to share insights and discover content through trusted social connections while maintaining privacy control

#### Privacy-First Social State

**Default Privacy Settings**:
- All tracking activity private by default
- Explicit opt-in required for any social sharing
- Granular controls for different types of sharing
- "Ghost Mode" option for complete privacy

**Social Sharing Options**:

1. **Public Lists**
   - Curated recommendations with optional commentary
   - Example: "Best 2024 True Crime Documentaries"
   - Privacy: User chooses public vs friends-only vs private

2. **Friend Activity Feed**
   - Recently completed content with ratings (opt-in)
   - Milestone celebrations (100th documentary, etc.)
   - Respectful sharing that avoids spoilers or triggers

3. **Collaborative Lists**
   - Shared research lists for trusted connections
   - Joint investigation projects or study groups
   - Example: "Researching 1970s Serial Killers - Mike & Sarah"

4. **Expert Insights**
   - Option to share detailed analysis publicly
   - Peer review system for accuracy
   - Recognition for quality contributions

**Available Actions**:
- **Primary**: Create shareable list, adjust privacy settings
- **Secondary**: Follow friends, comment on lists, request content recommendations
- **Tertiary**: Report inappropriate content, block users, export social data

#### Social Discovery Integration

**Friend Recommendations**:
- Content highly rated by friends with similar interests
- Recently completed by trusted connections
- Shared lists from followed users
- Discussion threads around specific cases

**Community Intelligence**:
- Trending content in True Crime community
- Hidden gems discovered by power users
- Community-verified accuracy ratings
- Seasonal content recommendations (anniversary dates, etc.)

---

## Advanced Tracking Scenarios

### Binge-Watching Support

#### Marathon Session State

**Smart Session Detection**:
- Automatically detect extended viewing sessions
- Offer batch episode marking for completed seasons
- Suggest breaks for mentally intense content
- Track viewing velocity and offer insights

**Visual Representation**:
- Progress bars showing binge completion
- Time investment indicators
- Health reminders for extended sessions
- Achievement badges for major milestones

**Available Actions**:
- Batch mark episodes as completed
- Set binge break reminders
- Share marathon achievements
- Export binge session summaries

### Cross-Platform Sync Scenarios

#### Multi-Device Experience

**Sync Priorities**:
1. **Status Updates**: Immediate sync across devices
2. **Progress Tracking**: Episode/time-based progress
3. **Personal Notes**: Rich text with formatting preservation
4. **Custom Organization**: Tags, lists, and categories

**Conflict Resolution**:
- **Last Write Wins**: For simple status updates
- **Merge Strategy**: For notes and tags (append, don't overwrite)
- **User Choice**: For conflicting episode progress
- **Automatic Backup**: All changes preserved in history

#### Offline Capability

**Core Offline Functions**:
- Status updates queue for sync when online
- View cached content metadata
- Add/edit personal notes offline
- Browse previously cached content lists

**Online Sync Behavior**:
- Background sync when connection restored
- User notification of sync conflicts
- Manual sync trigger available
- Progress indicators during sync process

### Platform Integration Scenarios

#### Automatic Progress Detection

**Smart Integration Features**:
- Netflix viewing history integration (where supported)
- Hulu watch progress synchronization
- Investigation Discovery cable viewing detection
- Generic platform deep-linking

**Manual Override Options**:
- Correct automated tracking errors
- Mark content watched on non-integrated platforms
- Adjust progress for shared account viewing
- Privacy controls for automatic detection

#### Platform-Specific Behaviors

**Netflix Integration**:
- Auto-detect completed episodes and seasons
- Respect Netflix's "Continue Watching" list
- Handle Netflix's automatic next episode behavior
- Support Netflix's rating system integration

**Cable TV Integration**:
- Manual episode marking with air date tracking
- DVR recording status integration
- Season pass and series recording support
- Live viewing vs recorded viewing distinction

---

## Edge Cases & Error Handling

### Content Database Limitations

#### Missing Content Scenarios

**User Empowerment**:
- Manual content addition with custom metadata
- Community content submission system
- Request content addition from admins
- Temporary tracking with pending database addition

**Graceful Degradation**:
- Basic tracking functionality without rich metadata
- User-provided content information
- Platform links without integrated tracking
- Community-powered content descriptions

### Platform API Failures

#### Sync Disruption Handling

**Service Degradation**:
- Clear communication about affected features
- Fallback to manual tracking methods
- Cached data utilization during outages
- Queue updates for retry when service restored

**User Communication**:
- Status indicators for platform connectivity
- Clear error messages with resolution steps
- Alternative tracking methods during outages
- Estimated resolution times when available

### Data Migration & Exports

#### User Data Portability

**Export Capabilities**:
- Complete tracking history in JSON format
- Personal notes and ratings backup
- Custom tags and list organization
- Social connections and shared content

**Import from Other Services**:
- TV Time import support
- Letterboxd integration for crime films
- Generic CSV import for existing tracking
- Manual migration assistance tools

---

## Success Metrics & Validation

### Tracking Engagement

**Primary KPIs**:
- **Daily Active Tracking**: Users updating status daily
- **Status Update Velocity**: Average updates per user per week
- **Completion Rate**: Percentage of "Want to Watch" items completed
- **Progress Granularity**: Episode-level tracking adoption

### User Satisfaction

**Quality Metrics**:
- **Ease of Use**: Task completion time for status updates
- **Value Perception**: User rating of tracking usefulness
- **Feature Adoption**: Usage of advanced features like notes/tags
- **Social Participation**: Percentage using social features

### Retention Impact

**Long-term Engagement**:
- **Return Behavior**: Users returning to update tracking regularly
- **Content Discovery**: Tracking leading to new content discovery
- **Social Growth**: Social features driving user acquisition
- **Export Usage**: Users valuing their accumulated tracking data

---

This comprehensive tracking journey ensures users can effectively manage their True Crime viewing across the fragmented streaming landscape while providing meaningful research tools and privacy-respecting social features appropriate for the genre's serious nature.