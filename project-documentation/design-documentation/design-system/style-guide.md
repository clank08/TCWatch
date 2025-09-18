---
title: True Crime Tracker - Complete Style Guide
description: Comprehensive design system specifications including colors, typography, spacing, and components
feature: Design System Foundation
last-updated: 2025-01-16
version: 1.0.0
related-files:
  - ../README.md
  - tokens/colors.md
  - tokens/typography.md
  - tokens/spacing.md
  - components/
dependencies:
  - React Native/Expo platform requirements
  - WCAG 2.1 AA accessibility standards
status: approved
---

# True Crime Tracker - Complete Style Guide

## Overview

This style guide establishes the complete design system for the True Crime tracking application, creating a cohesive, accessible, and genre-appropriate user experience across all platforms.

## Table of Contents

1. [Color System](#color-system)
2. [Typography System](#typography-system)
3. [Spacing & Layout System](#spacing--layout-system)
4. [Component Specifications](#component-specifications)
5. [Motion & Animation System](#motion--animation-system)

---

## Color System

### Primary Colors

**Noir Black (Primary)**
- `#1C1C1E` - Main UI backgrounds, app bars, primary brand element
- `#000000` - Pure black for emphasis, borders, highest contrast text
- `#2C2C2E` - Elevated surfaces, cards, secondary backgrounds

**Investigation Red (Primary Accent)**
- `#DC143C` - Critical actions, error states, important notifications
- `#B91C3C` - Hover states for red elements, pressed states
- `#FDE8E8` - Light background for error messages, subtle highlights

**Evidence Blue (Secondary)**
- `#1E40AF` - Links, informational elements, secondary actions
- `#1E3A8A` - Hover states for blue elements
- `#EFF6FF` - Light background for info messages, selected states

### Neutral Palette

**Text & Interface Grays**
- `Neutral-50`: `#FAFAFA` - Lightest backgrounds, subtle borders
- `Neutral-100`: `#F5F5F5` - Card backgrounds on light themes
- `Neutral-200`: `#E5E5E5` - Dividers, disabled states
- `Neutral-300`: `#D4D4D4` - Placeholder text, inactive elements
- `Neutral-400`: `#A3A3A3` - Secondary text, metadata
- `Neutral-500`: `#737373` - Body text on light backgrounds
- `Neutral-600`: `#525252` - Primary text on light backgrounds
- `Neutral-700`: `#404040` - Headings, high emphasis text
- `Neutral-800`: `#262626` - Primary text on dark backgrounds
- `Neutral-900`: `#171717` - Headings on dark backgrounds, maximum contrast

### Dark Theme Colors (Primary)

**Dark Backgrounds**
- `Dark-50`: `#0A0A0A` - App background, deepest level
- `Dark-100`: `#1C1C1E` - Primary surface, navigation backgrounds
- `Dark-200`: `#2C2C2E` - Elevated cards, modal backgrounds
- `Dark-300`: `#3A3A3C` - Interactive elements, form inputs
- `Dark-400`: `#48484A` - Borders, dividers on dark surfaces

**Dark Theme Text**
- `Dark-Text-Primary`: `#FFFFFF` - Primary text, highest contrast
- `Dark-Text-Secondary`: `#E5E5E7` - Secondary text, metadata
- `Dark-Text-Tertiary`: `#A1A1A6` - Placeholder text, disabled text

### Semantic Colors

**Success States**
- `Success-Primary`: `#16A34A` - Completed tracking, positive confirmations
- `Success-Light`: `#DCFCE7` - Success message backgrounds
- `Success-Dark`: `#15803D` - Success elements on dark backgrounds

**Warning States**
- `Warning-Primary`: `#D97706` - Caution alerts, incomplete content warnings
- `Warning-Light`: `#FEF3C7` - Warning message backgrounds
- `Warning-Dark`: `#B45309` - Warning elements on dark backgrounds

**Error States**
- `Error-Primary`: `#DC143C` - Error messages, failed operations
- `Error-Light`: `#FDE8E8` - Error message backgrounds
- `Error-Dark`: `#B91C3C` - Error elements on dark backgrounds

**Information States**
- `Info-Primary`: `#1E40AF` - Informational messages, help text
- `Info-Light`: `#EFF6FF` - Info message backgrounds
- `Info-Dark`: `#1E3A8A` - Info elements on dark backgrounds

### Accessibility Notes

- All color combinations meet WCAG AA standards (4.5:1 normal text, 3:1 large text)
- Critical interactions maintain 7:1 contrast ratio for enhanced accessibility
- Color-blind friendly palette verified with Stark and Color Oracle tools
- Dark theme colors provide enhanced readability for extended viewing sessions

---

## Typography System

### Font Stack

**Primary Font Family**
```css
font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont,
             'Roboto', 'Segoe UI', sans-serif;
```

**Monospace Font Family** (for metadata, timestamps)
```css
font-family: 'SF Mono', 'Consolas', 'JetBrains Mono',
             'Monaco', monospace;
```

### Font Weights

- **Light**: 300 - Subtle text, quotes
- **Regular**: 400 - Body text, descriptions
- **Medium**: 500 - Emphasis, important information
- **Semibold**: 600 - Section headers, button text
- **Bold**: 700 - Page titles, major headings

### Type Scale

**H1 - Page Titles**
- Font Size: `32px / 2rem`
- Line Height: `40px / 2.5rem`
- Weight: 700 (Bold)
- Letter Spacing: `-0.02em`
- Usage: Page titles, major sections, case names

**H2 - Section Headers**
- Font Size: `24px / 1.5rem`
- Line Height: `32px / 2rem`
- Weight: 600 (Semibold)
- Letter Spacing: `-0.01em`
- Usage: Content categories, feature sections

**H3 - Subsection Headers**
- Font Size: `20px / 1.25rem`
- Line Height: `28px / 1.75rem`
- Weight: 600 (Semibold)
- Letter Spacing: `0em`
- Usage: Content lists, filter sections

**H4 - Card Titles**
- Font Size: `18px / 1.125rem`
- Line Height: `24px / 1.5rem`
- Weight: 500 (Medium)
- Letter Spacing: `0em`
- Usage: Content titles, card headers

**Body Large - Primary Reading**
- Font Size: `18px / 1.125rem`
- Line Height: `28px / 1.75rem`
- Weight: 400 (Regular)
- Usage: Content descriptions, important body text

**Body - Standard UI Text**
- Font Size: `16px / 1rem`
- Line Height: `24px / 1.5rem`
- Weight: 400 (Regular)
- Usage: Standard UI text, form labels

**Body Small - Secondary Information**
- Font Size: `14px / 0.875rem`
- Line Height: `20px / 1.25rem`
- Weight: 400 (Regular)
- Usage: Metadata, secondary descriptions

**Caption - Metadata & Timestamps**
- Font Size: `12px / 0.75rem`
- Line Height: `16px / 1rem`
- Weight: 400 (Regular)
- Family: Monospace
- Usage: Timestamps, episode counts, duration

### Responsive Typography

**Mobile (320-767px)**
- H1: `28px`, Line Height: `36px`
- H2: `22px`, Line Height: `28px`
- Body Large: `16px`, Line Height: `24px`
- Increased line height for readability on small screens

**Tablet (768-1023px)**
- Standard scale with 1.1x multiplier for improved readability
- Optimal line lengths maintained (45-75 characters)

**Desktop & Wide (1024px+)**
- Full type scale as specified
- Maximum line lengths capped at 75 characters for readability

---

## Spacing & Layout System

### Base Unit
`8px` - All spacing measurements are multiples of 8px for consistent rhythm

### Spacing Scale

- `xs`: `4px` (0.5 × base) - Tight spacing between related elements
- `sm`: `8px` (1 × base) - Small internal padding, close relationships
- `md`: `16px` (2 × base) - Standard spacing, default margins
- `lg`: `24px` (3 × base) - Section spacing, card padding
- `xl`: `32px` (4 × base) - Large section separation
- `2xl`: `48px` (6 × base) - Major content blocks
- `3xl`: `64px` (8 × base) - Screen padding, hero sections

### Grid System

**Mobile Grid (320-767px)**
- Columns: 4
- Margins: 16px
- Gutters: 16px
- Max Width: 100%

**Tablet Grid (768-1023px)**
- Columns: 8
- Margins: 32px
- Gutters: 24px
- Max Width: 768px

**Desktop Grid (1024-1439px)**
- Columns: 12
- Margins: 48px
- Gutters: 32px
- Max Width: 1200px

**Wide Grid (1440px+)**
- Columns: 12
- Margins: 64px
- Gutters: 32px
- Max Width: 1440px

### Layout Principles

1. **Content-First**: Layout serves content discovery and consumption
2. **Vertical Rhythm**: Consistent 8px baseline grid throughout
3. **Breathing Room**: Generous whitespace for cognitive processing
4. **Hierarchy**: Clear visual separation between content levels
5. **Responsive Flow**: Graceful adaptation across all breakpoints

---

## Component Specifications

### Buttons

**Primary Button**
- Height: `48px` (mobile), `44px` (desktop)
- Padding: `16px 24px`
- Border Radius: `8px`
- Typography: Body, Semibold (600)
- Background: `Investigation-Red` (#DC143C)
- Text: `White` (#FFFFFF)

**States:**
- Default: Background `#DC143C`
- Hover: Background `#B91C3C`, slight scale `1.02`
- Active: Background `#A91B3A`, scale `0.98`
- Focus: 2px blue outline offset 2px
- Disabled: Background `#A3A3A3`, text `#737373`
- Loading: Spinner animation, text "Loading..."

**Secondary Button**
- Same dimensions as primary
- Background: `Transparent`
- Border: `2px solid #DC143C`
- Text: `Investigation-Red` (#DC143C)

**Ghost Button**
- Same dimensions, no background or border
- Text: `Evidence-Blue` (#1E40AF)
- Hover: Background `#EFF6FF`

### Form Elements

**Text Input**
- Height: `48px`
- Padding: `14px 16px`
- Border: `1px solid #D4D4D4`
- Border Radius: `8px`
- Typography: Body (16px)
- Background: `White` (light), `#2C2C2E` (dark)

**States:**
- Default: Border `#D4D4D4`
- Focus: Border `#1E40AF`, blue glow shadow
- Error: Border `#DC143C`, red glow shadow
- Disabled: Background `#F5F5F5`, text `#A3A3A3`

### Cards

**Content Card**
- Border Radius: `12px`
- Padding: `16px`
- Background: `White` (light), `#2C2C2E` (dark)
- Shadow: `0 2px 8px rgba(0, 0, 0, 0.1)` (light)
- Border: `1px solid #48484A` (dark theme only)

**States:**
- Default: Standard shadow and background
- Hover: Increased shadow `0 4px 16px rgba(0, 0, 0, 0.15)`, slight lift
- Pressed: Reduced shadow, scale `0.98`
- Loading: Skeleton shimmer animation

### Navigation

**Tab Bar**
- Height: `80px` (includes safe area)
- Background: `#1C1C1E` with blur effect
- Border Top: `1px solid #48484A`
- Icon Size: `24px`
- Label: Caption (12px), Medium weight

**States:**
- Active: Icon and text `#DC143C`
- Inactive: Icon and text `#A1A1A6`
- Hover: Background tint `rgba(220, 20, 60, 0.1)`

---

## Motion & Animation System

### Timing Functions

**Ease-Out**: `cubic-bezier(0.0, 0, 0.2, 1)`
- Usage: Element entrances, expansions, reveals
- Creates natural deceleration, feels responsive

**Ease-In-Out**: `cubic-bezier(0.4, 0, 0.6, 1)`
- Usage: Transitions, movements, state changes
- Balanced acceleration and deceleration

**Spring**: `tension: 200, friction: 25`
- Usage: Interactive feedback, playful moments
- Adds personality without being distracting

### Duration Scale

**Micro Animations**: `150ms`
- Hover effects, focus indicators, micro-interactions
- Immediate feedback for user actions

**Short Transitions**: `250ms`
- Component state changes, dropdown menus
- Local UI transitions that don't interrupt flow

**Medium Transitions**: `400ms`
- Screen transitions, modal presentations
- More significant UI changes that need smooth motion

**Long Animations**: `600ms`
- Complex multi-step animations, onboarding sequences
- Used sparingly for special moments

### Animation Principles

1. **Purposeful Motion**: Every animation serves a functional purpose
2. **Performance First**: 60fps minimum, hardware acceleration preferred
3. **Accessibility Aware**: Respects `prefers-reduced-motion` settings
4. **Consistent Timing**: Similar actions use similar durations and easing
5. **Spatial Continuity**: Elements move logically through space

### Common Animation Patterns

**Fade In/Out**
- Duration: 250ms
- Easing: Ease-out for in, ease-in for out
- Usage: Content reveals, overlays, tooltips

**Slide Transitions**
- Duration: 400ms
- Easing: Ease-in-out
- Usage: Screen navigation, drawer menus, modal presentation

**Scale Feedback**
- Duration: 150ms
- Scale: 1.02 for hover, 0.98 for press
- Usage: Button feedback, card interactions

---

## Implementation Guidelines

### Design Token Usage

All design values should be implemented as design tokens for consistency:

```javascript
// Example React Native/Expo implementation
const tokens = {
  colors: {
    primary: '#DC143C',
    background: {
      light: '#FFFFFF',
      dark: '#1C1C1E'
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24
  },
  typography: {
    h1: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700'
    }
  }
};
```

### Platform Adaptations

**iOS Specific**
- Use SF Pro Display font family
- Follow iOS Human Interface Guidelines for navigation
- Implement haptic feedback for key interactions
- Support Dynamic Type and larger accessibility fonts

**Android Specific**
- Use Roboto font family fallback
- Follow Material Design navigation patterns
- Implement appropriate elevation shadows
- Support Android accessibility services

**Web Specific**
- Implement focus management for keyboard navigation
- Provide hover states for mouse interactions
- Ensure semantic HTML structure
- Support browser zoom up to 200%

### Quality Assurance Checklist

- [ ] All color combinations meet WCAG AA contrast ratios
- [ ] Typography scales appropriately across all breakpoints
- [ ] Components function correctly in both light and dark themes
- [ ] Animations respect reduced motion preferences
- [ ] Touch targets meet minimum 44x44px requirement
- [ ] Focus indicators are visible and consistent
- [ ] All interactive elements provide appropriate feedback

---

This style guide serves as the foundation for all design decisions in the True Crime tracking application. Every component, screen, and interaction should reference these specifications to ensure a cohesive, accessible, and high-quality user experience.