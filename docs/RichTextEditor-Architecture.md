# RichTextEditor Architecture Documentation

This document explains how the RichTextEditor component and its subcomponents work together to provide a flexible, extensible rich text editing experience with multi-character mention support.

## Overview

The RichTextEditor is built on top of TipTap (which uses ProseMirror) and provides a modular system for handling different types of suggestions (mentions, tags, commands) triggered by configurable characters (@, #, /, etc.).

## Component Architecture

```
RichTextEditor
├── TipTap Editor (ProseMirror)
│   ├── StarterKit extension
│   ├── Placeholder extension
│   └── Mention extensions (one per suggestion config)
├── useSuggestions hook
├── SuggestionList component
└── Floating Toolbar (optional)
```

## Core Components

### 1. RichTextEditor (Main Component)

**File:** `src/components/RichTextEditor.tsx`

The main component that orchestrates all functionality:

**Key Responsibilities:**
- Initialize TipTap editor with extensions
- Manage floating toolbar state and positioning
- Render suggestion list when active
- Handle content changes and prop updates

**Props:**
```typescript
interface RichTextEditorProps {
  content: string                        // HTML content
  onChange: (html: string) => void       // Content change handler
  placeholder?: string                   // Placeholder text
  className?: string                     // CSS class
  floatingToolbar?: boolean             // Show/hide floating toolbar
  suggestionConfigs?: SuggestionConfig[] // Suggestion configurations
}
```

**Key Features:**
- **Dynamic Extension Loading:** Creates one Mention extension per suggestion config
- **Toolbar Management:** Positions floating toolbar based on cursor/selection
- **Suggestion Integration:** Connects TipTap events to custom suggestion system

### 2. useSuggestions Hook

**File:** `src/hooks/useSuggestions.ts`

A custom hook that manages all suggestion-related state and logic:

**State Management:**
```typescript
interface SuggestionState {
  isOpen: boolean              // Whether suggestions are visible
  query: string               // Current search query
  position: { top, left }     // Suggestion list position
  selectedIndex: number       // Currently selected suggestion
  items: T[]                 // Filtered suggestion items
  config: SuggestionConfig   // Active suggestion configuration
  command: Function          // TipTap command to insert suggestion
}
```

**Key Functions:**

#### `createSuggestionHandlers(config)`
Returns TipTap suggestion handlers for a specific config:

- **`onStart`:** Initializes suggestion state when trigger character is typed
- **`onUpdate`:** Updates suggestions as user types query
- **`onKeyDown`:** Handles keyboard navigation (↑↓ arrows, Enter, Escape)
- **`onExit`:** Cleans up when suggestions are dismissed

#### `filterItems(config, query)`
Filters and limits suggestion items based on:
- Custom search function (`config.searchKey`)
- Default string matching on specified property
- Maximum items limit (`config.maxItems`)

**State Synchronization:**
Uses refs to avoid stale closures in TipTap event handlers:
- `selectedIndexRef` - Current selection index
- `commandRef` - Current TipTap command
- `itemsRef` - Current filtered items

### 3. SuggestionList Component

**File:** `src/components/SuggestionList.tsx`

A generic, reusable component for rendering suggestion lists:

**Props:**
```typescript
interface SuggestionListProps<T> {
  items: T[]                    // Suggestions to display
  config: SuggestionConfig<T>   // Configuration for rendering
  command: (item: T) => void    // Selection handler
  selectedIndex: number         // Currently selected index (controlled by parent)
}
```

**Key Features:**
- **Generic Rendering:** Works with any data type extending `SuggestionItem`
- **Custom Render Functions:** Each config can provide custom item rendering
- **Controlled Selection:** Selection state managed by parent component
- **Auto-scroll:** Scrolls selected item into view automatically
- **Accessibility:** Proper button elements with keyboard support

**Rendering Logic:**
1. Uses `config.render(item)` if provided
2. Falls back to default avatar + label rendering
3. Applies `config.className` for custom styling

### 4. Type Definitions

**File:** `src/types/suggestions.ts`

**SuggestionItem:** Base interface for all suggestion data
```typescript
interface SuggestionItem {
  id: string        // Unique identifier
  label: string     // Display text
  [key: string]: any // Additional properties
}
```

**SuggestionConfig:** Configuration for each suggestion type
```typescript
interface SuggestionConfig<T> {
  char: string                           // Trigger character (@, #, /)
  items: (props) => Promise<T[]> | T[]   // Data source function
  render?: (item: T) => ReactNode        // Custom rendering
  searchKey?: keyof T | Function         // Search logic
  className?: string                     // CSS class
  maxItems?: number                      // Limit results
  htmlAttributes?: Record<string, any>   // HTML attributes for mentions
}
```

## Data Flow

### 1. Initialization
```
User provides suggestionConfigs → RichTextEditor creates Mention extensions → TipTap editor ready
```

### 2. Suggestion Trigger
```
User types '@' → TipTap detects trigger → onStart handler called → useSuggestions sets state → SuggestionList renders
```

### 3. Typing Query
```
User types 'john' → TipTap onUpdate → filterItems called → State updated → SuggestionList re-renders with filtered items
```

### 4. Keyboard Navigation
```
User presses ↓ → TipTap onKeyDown → selectedIndex updated → SuggestionList highlights new item → Auto-scroll to view
```

### 5. Selection
```
User presses Enter → TipTap onKeyDown → command() called → Mention inserted → Suggestion list closed
```

## Extension System

### TipTap Integration

Each `SuggestionConfig` creates a separate TipTap Mention extension:

```typescript
suggestionConfigs.map(config => 
  Mention.configure({
    HTMLAttributes: {
      class: 'mention',
      ...config.htmlAttributes
    },
    suggestion: {
      char: config.char,
      items: config.items,
      render: () => createSuggestionHandlers(config)
    }
  })
)
```

### Multiple Mention Types

The system supports multiple simultaneous mention types:
- **User mentions (@):** `@john` → `<mention class="mention">@john</mention>`
- **Tag mentions (#):** `#urgent` → `<mention class="mention tag-mention">#urgent</mention>`
- **Command mentions (/):** `/todo` → `<mention class="mention command-mention">/todo</mention>`

## Styling System

### CSS Module Structure
**File:** `src/components/RichTextEditor.module.css`

- **`.richTextEditor`** - Main editor container
- **`.richTextContent`** - Editor content area
- **`.suggestionContainer`** - Positioned suggestion list wrapper
- **`.suggestionList`** - Suggestion list styling
- **`.suggestionListItem`** - Individual suggestion items
- **`.selected`** - Currently selected item highlight
- **`.floatingToolbar`** - Toolbar positioning and appearance

### Theming Support
- Custom CSS classes via `config.className`
- Custom HTML attributes via `config.htmlAttributes`
- CSS variables for easy theme customization

## Usage Examples

### Basic Usage
```typescript
<RichTextEditor
  content={content}
  onChange={setContent}
  placeholder="Type @ to mention users..."
/>
```

### Advanced Multi-Mention Setup
```typescript
const suggestionConfigs = [
  {
    char: '@',
    items: ({ query }) => fetchUsers(query),
    render: (user) => <UserMention user={user} />,
    maxItems: 10
  },
  {
    char: '#',
    items: ({ query }) => getTags(query),
    className: 'tag-suggestions',
    htmlAttributes: { 'data-type': 'tag' }
  }
]

<RichTextEditor
  content={content}
  onChange={setContent}
  suggestionConfigs={suggestionConfigs}
  floatingToolbar={true}
/>
```

## Performance Considerations

### Debouncing
- TipTap handles input debouncing internally
- Async `items` functions are awaited properly

### Memory Management
- Refs prevent memory leaks from stale closures
- Effect cleanup in `useSuggestions`
- State reset prevents conflicts between suggestion types

### Virtualization
- Consider react-window for large suggestion lists
- Current implementation handles up to ~100 items well

## Known Issues & Solutions

### Multiple Mentions Per Line
**Issue:** Previously, only one mention could be used per line due to suggestion state conflicts.

**Solution:** Implemented state reset in `onStart` handler with small delay to ensure clean transitions between different mention types:

```typescript
onStart: async (props: any) => {
  // Close any existing suggestions first
  setSuggestionState(prev => ({ ...prev, isOpen: false }))
  
  // Small delay to ensure clean state transition
  setTimeout(() => {
    setSuggestionState({
      isOpen: true,
      // ... new suggestion state
    })
  }, 10)
}
```

### Keyboard Navigation with Multiple Configs
**Issue:** Config-specific checks could prevent keyboard events from working properly.

**Solution:** Removed overly restrictive config matching checks, allowing TipTap's internal system to handle event routing while maintaining clean state management.

## Accessibility Features

- **Keyboard Navigation:** Full arrow key + Enter/Escape support
- **Screen Readers:** Proper ARIA attributes on suggestion buttons
- **Focus Management:** Maintains editor focus during suggestion selection
- **High Contrast:** CSS custom properties for theme adaptation

## Extensibility Points

### Custom Data Sources
```typescript
{
  char: '%',
  items: async ({ query, editor }) => {
    const context = getEditorContext(editor)
    return await searchAPI(query, context)
  }
}
```

### Custom Rendering
```typescript
{
  char: '$',
  render: (variable) => (
    <div className="variable-suggestion">
      <code>{variable.name}</code>
      <span className="type">{variable.type}</span>
    </div>
  )
}
```

### Custom Search Logic
```typescript
{
  char: '!',
  searchKey: (item, query) => {
    return item.aliases.some(alias => 
      alias.toLowerCase().includes(query.toLowerCase())
    )
  }
}
```

This architecture provides a flexible, maintainable foundation for rich text editing with extensible mention support while maintaining good performance and accessibility standards.