---
title: Content Discovery - Complete User Journey
description: Comprehensive user journey for discovering True Crime content across platforms
feature: Content Discovery
last-updated: 2025-09-16
version: 1.0.0
related-files:
    - README.md
    - screen-states.md
    - ../../design-system/style-guide.md
dependencies:
    - Platform API integrations (Watchmode, TMDB, TheTVDB)
    - Search indexing system
    - Recommendation algorithm
    - User preference engine
status: approved
---

# Content Discovery - Complete User Journey

## Overview

Content discovery is the core differentiator of the True Crime tracker, enabling users to find relevant content across 200+ platforms through case-based organization rather than traditional platform-first browsing. This journey prioritizes comprehensive coverage, intelligent filtering, and immediate action on discovered content.

## Primary User Goals

-   **Find specific content** about cases or perpetrators of interest
-   **Discover new content** related to followed cases
-   **Evaluate content quality** before watching
-   **Identify viewing options** across all available platforms

## Success Criteria

-   85% of searches result in content addition or platform click-through
-   Users discover content on previously unknown platforms
-   Average 3+ search results per query that meet availability criteria
-   Users successfully find comprehensive coverage of specific cases

---

## Core Experience Flow

### Step 1: Discovery Entry Point

#### Trigger Scenarios

1. **Dashboard Search**: User enters from home screen search bar
2. **Browse by Case**: User explores trending or followed cases
3. **Platform Browse**: User filters by specific platforms
4. **Social Discovery**: User explores shared lists or friend recommendations
5. **Notification Follow**: User clicks new content alert

#### Search Dashboard State

**Visual Layout**:

-   Prominent search bar with intelligent autocomplete
-   Quick filter chips for common searches (Serial Killers, Cold Cases, etc.)
-   Trending cases section with visual case cards
-   Recently searched items for returning users
-   Browse categories organized by case type and era

**Available Actions**:

-   **Primary**: Universal search across all content
-   **Secondary**: Browse by case categories
-   **Tertiary**: Filter by platform availability
-   **Contextual**: Clear search history, adjust filters

**Visual Hierarchy**:

1. Search interface (most prominent)
2. Quick filter categories
3. Trending and recommended cases
4. Recently viewed content
5. Advanced filter access

**System Feedback**:

-   Real-time search suggestions as user types
-   Loading indicators for search results
-   Empty state guidance for no results
-   Filter count indicators

**Microcopy**:

-   Search placeholder: "Search for cases, killers, or content..."
-   Quick filters: "Popular searches", "Your interests"
-   Browse prompt: "Explore cases by category"

### Step 2: Search Execution & Results

#### Task Flow

User executes search and evaluates comprehensive results across platforms

#### Universal Search State

**Search Query Processing**:

-   Fuzzy matching for misspelled names and cases
-   Boolean search operators (AND, OR, NOT)
-   Synonym recognition (e.g., "BTK" = "Dennis Rader")
-   Case alias handling (e.g., "Golden State Killer" = "Joseph James DeAngelo")

**Results Organization**:

1. **Exact Matches** - Direct case/perpetrator matches
2. **Related Content** - Connected cases or similar topics
3. **Platform Availability** - Grouped by user's connected services
4. **Content Types** - Documentaries, series, movies, podcasts
5. **Quality Indicators** - Ratings, reviews, critical acclaim

**Visual Layout**:

-   Search results grid with rich content cards
-   Platform availability badges on each card
-   Filter sidebar for refinement
-   Sort options (relevance, rating, release date, availability)
-   Bulk action controls for list management

**Content Card Information**:

-   **Primary**: Title and type (Documentary, Series, Movie)
-   **Secondary**: Platform availability with deep-link indicators
-   **Metadata**: Release year, duration, rating, episode count
-   **Quality**: User ratings, critic scores, community reviews
-   **Context**: Case relevance, content focus (perpetrator, victims, investigation)

**Available Actions**:

-   **Primary**: Add to watchlist/tracking
-   **Secondary**: View detailed information
-   **Tertiary**: Share content, rate if watched
-   **Contextual**: Filter, sort, bulk select

**State Changes**:

-   Filter application updates results in real-time
-   Platform filter shows/hides content based on availability
-   Sort order reorganizes results immediately
-   Search refinement maintains context and filters

### Step 3: Content Evaluation

#### Task Flow

User examines specific content to determine viewing priority and platform choice

#### Detail View State

**Comprehensive Information Display**:

-   **Content Overview**: Title, synopsis, key focus areas
-   **Platform Availability**: All platforms with pricing/subscription info
-   **Quality Metrics**: User ratings, critic reviews, community feedback
-   **Case Context**: How this content relates to the broader case
-   **Related Content**: Other titles about the same case
-   **Episode Information**: Season/episode breakdown for series

**Visual Layout**:

-   Hero image/trailer preview
-   Platform availability prominently displayed
-   Tabbed interface for detailed information
-   Related content carousel
-   User review and rating section

**Platform Integration**:

-   **Deep Links**: Direct links to content on user's platforms
-   **Subscription Status**: Clear indication of access requirements
-   **Pricing Information**: Rental/purchase costs for pay-per-view content
-   **Quality Options**: HD/4K availability indicators
-   **Availability Dates**: When content becomes available/expires

**Available Actions**:

-   **Primary**: Add to tracking with status selection
-   **Secondary**: Play on preferred platform
-   **Tertiary**: Share, rate, review
-   **Contextual**: Add to custom list, set reminder

**Case Relationship Context**:

-   **Primary Focus**: Main subject (perpetrator, victims, investigation)
-   **Case Timeline**: Where this content fits in the case chronology
-   **Perspective**: Whose viewpoint/angle (investigators, survivors, families)
-   **Completeness**: How comprehensive the coverage is

#### Rating and Review Integration

**Community Intelligence**:

-   **Accuracy Ratings**: How factually accurate the content is
-   **Quality Ratings**: Production value and storytelling quality
-   **Sensitivity Ratings**: How respectfully victims are portrayed
-   **Completeness Ratings**: How thoroughly the case is covered

**Personal Tracking Options**:

-   **Watch Status**: Want to Watch, Watching, Completed, Abandoned
-   **Personal Rating**: 1-5 star rating system
-   **Personal Notes**: Private research notes and thoughts
-   **Tags**: Custom tags for organization (unsolved, 1980s, podcast-adapted)

### Step 4: Action & Platform Selection

#### Task Flow

User decides on content and selects optimal viewing method

#### Platform Selection State

**Decision Support Information**:

-   **Platform Comparison**: Side-by-side availability and pricing
-   **Quality Comparison**: HD/4K options across platforms
-   **Convenience Factors**: Download availability, offline viewing
-   **Cost Analysis**: Free vs. subscription vs. rental costs

**Visual Layout**:

-   Platform cards with key information
-   Recommended platform highlighted
-   Quick action buttons for each platform
-   Alternative viewing options displayed

**Smart Recommendations**:

-   **User Preference**: Prioritize user's connected platforms
-   **Cost Optimization**: Highlight free options over paid
-   **Quality Priority**: Suggest best available quality
-   **Convenience**: Consider download/offline capabilities

**Available Actions**:

-   **Primary**: Launch content on selected platform
-   **Secondary**: Add to tracking list with platform preference
-   **Tertiary**: Compare all platform options
-   **Contextual**: Set price drop alerts, availability reminders

**State Changes**:

-   Platform selection updates tracking preferences
-   Content added to appropriate list with chosen platform
-   Deep link redirects to platform app/website
-   Tracking status automatically updates

---

## Advanced Discovery Patterns

### Case-Based Discovery

#### Browse by Perpetrator

**Organization Strategy**:

-   **Alphabetical Listing**: All documented perpetrators
-   **Timeline View**: Cases organized by time period
-   **Type Categorization**: Serial killers, mass murderers, etc.
-   **Geographic View**: Cases organized by location

**Content Aggregation**:

-   **Comprehensive Coverage**: All content about specific perpetrator
-   **Quality Ranking**: Best-reviewed content first
-   **Content Type Filtering**: Documentaries, series, movies, books
-   **Chronological Organization**: Content by case timeline

#### Browse by Case Type

**Category Organization**:

-   **Serial Killers**: Most comprehensive category
-   **Cold Cases**: Unsolved mysteries and investigations
-   **Mass Casualties**: Spree killings and mass murders
-   **Historical Cases**: Pre-1950s cases with modern coverage
-   **International**: Non-US cases with English content
-   **Solved Recently**: Cases with new developments

**Discovery Enhancement**:

-   **Trending Cases**: Based on new content and community interest
-   **Seasonal Relevance**: Anniversary dates and commemorative content
-   **News Integration**: Cases currently in the news
-   **Community Interest**: Most discussed cases

### Social Discovery Integration

#### Friend Recommendations

**Social Intelligence**:

-   **Friend Activity**: Recently watched by trusted connections
-   **Shared Interests**: Content matching mutual interests
-   **Rating Alignment**: Content rated highly by similar users
-   **List Sharing**: Content from shared friend lists

**Privacy Controls**:

-   **Opt-in Activity Sharing**: Users control what friends see
-   **Granular Permissions**: Share ratings but not activity, etc.
-   **Anonymous Recommendations**: Community data without personal info

#### Community Discovery

**Collective Intelligence**:

-   **Trending Content**: Most added to watchlists recently
-   **Hidden Gems**: Highly-rated content with low awareness
-   **Controversial Content**: Content with widely varying opinions
-   **New Release Alerts**: Fresh content across all platforms

### Advanced Filtering & Search

#### Multi-Dimensional Filtering

**Content Attributes**:

-   **Release Date Range**: Focus on specific time periods
-   **Content Length**: Short documentaries vs. multi-part series
-   **Platform Exclusivity**: Netflix originals, Investigation Discovery exclusives
-   **Production Quality**: Professional vs. independent productions
-   **Perspective Focus**: Investigative, survivor-focused, perpetrator-focused

**Quality Metrics**:

-   **Minimum Rating**: User and critic rating thresholds
-   **Accuracy Verified**: Content fact-checked by community
-   **Victim Sensitivity**: Respectful portrayal verified
-   **Case Completeness**: Comprehensive vs. partial coverage

#### Intelligent Search Features

**Query Understanding**:

-   **Natural Language**: "What Netflix shows about 1970s serial killers?"
-   **Boolean Logic**: "Ted Bundy AND documentary NOT movie"
-   **Temporal Queries**: "New content about unsolved cases this month"
-   **Comparative Queries**: "Best documentaries about Zodiac Killer"

**Search Enhancement**:

-   **Auto-Complete**: Intelligent suggestions based on True Crime database
-   **Spell Correction**: Handle misspelled names and cases
-   **Synonym Recognition**: Alternative names for cases and perpetrators
-   **Context Preservation**: Remember search context across sessions

---

## Error States & Edge Cases

### No Results Scenarios

#### Obscure Case Searches

**Helpful Responses**:

-   **Alternative Suggestions**: Similar cases with available content
-   **Content Request**: Allow users to request specific content
-   **Notification Setup**: Alert when requested content becomes available
-   **Related Topics**: Broader category suggestions

#### Platform Availability Issues

**User Guidance**:

-   **Alternative Platforms**: Show content on platforms user doesn't have
-   **Free Alternatives**: Suggest free or trial platform options
-   **Content Alerts**: Notify when content becomes available on user's platforms
-   **Purchase Options**: Direct links to rent/buy content

### Loading & Performance States

#### Search Performance

**Optimization Strategy**:

-   **Progressive Loading**: Show most relevant results first
-   **Caching Strategy**: Common searches cached for speed
-   **Background Loading**: Continue loading while user browses initial results
-   **Infinite Scroll**: Load additional results as user scrolls

#### Platform API Failures

**Graceful Degradation**:

-   **Partial Results**: Show available data even if some platforms fail
-   **Cached Data**: Fall back to cached availability information
-   **Manual Override**: Allow users to manually indicate content availability
-   **Status Communication**: Clear indication of which platforms are unavailable

### Quality Assurance

#### Content Accuracy

**Verification Systems**:

-   **Community Moderation**: User reporting for inaccurate information
-   **Expert Review**: Periodic review by True Crime experts
-   **Source Verification**: Cross-reference with authoritative sources
-   **Update Tracking**: Monitor for content changes and corrections

#### Search Quality

**Performance Monitoring**:

-   **Result Relevance**: Track user actions after search
-   **Query Success**: Monitor zero-result searches for improvement
-   **Response Time**: Ensure <2 second search response times
-   **User Satisfaction**: Periodic search experience surveys

---

## Key Decision Points

### Content Prioritization

**Algorithm Factors**:

1. **Platform Availability**: Prioritize content on user's platforms
2. **Quality Ratings**: Surface highest-rated content first
3. **Recency**: Balance new content with classic coverage
4. **Relevance**: Match search intent and user interests
5. **Completeness**: Prefer comprehensive over partial coverage

### Discovery vs. Search Balance

**Interface Design Decisions**:

-   **Search Prominence**: Make search primary discovery method
-   **Browse Support**: Provide rich browsing for exploration
-   **Hybrid Approach**: Combine search with category navigation
-   **Personalization**: Balance user preferences with comprehensive results

### Social Integration Level

**Privacy-First Approach**:

-   **Default Private**: All activity private by default
-   **Opt-in Sharing**: Clear choices about what to share
-   **Granular Controls**: Detailed privacy settings
-   **Anonymous Options**: Participate in community without personal exposure

---

## Success Metrics & Validation

### Discovery Effectiveness

-   **Search Success Rate**: 85% target for searches resulting in action
-   **Content Addition Rate**: Percentage of discovered content added to lists
-   **Platform Utilization**: Users discover content on multiple platforms
-   **Discovery Depth**: Users explore multiple content types per case

### User Satisfaction

-   **Search Relevance**: User rating of search result quality
-   **Content Quality**: Satisfaction with discovered content
-   **Platform Integration**: Success rate of deep-linking to platforms
-   **Discovery Serendipity**: Users find unexpected interesting content

### Engagement Impact

-   **Session Length**: Time spent in discovery flows
-   **Content Consumption**: Percentage of discovered content actually watched
-   **Return Behavior**: Users return to discovery regularly
-   **Social Sharing**: Discovery leads to list creation and sharing

---

This comprehensive content discovery journey ensures users can effectively find, evaluate, and act on True Crime content across the fragmented streaming landscape while maintaining the investigative, serious tone appropriate for the genre.
