# Start-UI Feature Implementation Plan

This document outlines the plan to extend the start-ui interactive terminal interface to include all features available in the Task Master CLI.

## Complete CLI Command Reference

Based on the Task Master CLI, all commands must be accessible through the UI with appropriate keyboard shortcuts and user interactions.

### Project Setup & Configuration

1. **init** - Initialize a new project with Task Master structure
   - Creates Task Master AI model configuration and analytics emails
   - Sets the primary model for task generation
   - Gets the available models in configuration
   - Sets the fallback model (optional)

2. **models** - Manage AI model configurations
   - `--set-main` - Set the primary model
   - `--set-research` - Set the research model
   - `--set-fallback` - Set the fallback model
   - Shows current model configuration when run without args

### Task Generation

3. **parse-prd** - Generate tasks from a PRD document
   - `--input=<file.txt>` - Input PRD file (default: .taskmaster/docs/prd.txt)
   - `--num-tasks=<n>` - Number of tasks to generate
   - Creates individual task files from tasks.json

4. **generate** - Generate task files from tasks.json
   - Creates files in .taskmaster/tasks/

### Task Management

5. **list** - List all tasks with their status
   - `--status=<status>` - Filter by status (pending, done, in-progress, review, deferred, cancelled)
   - `--with-subtasks` - Include subtasks in listing
   - Shows tasks as standalone tasks with professional formatting
   - Updates specific task statuses

6. **set-status** - Update task status
   - `--id=<id>` - Task ID (required)
   - `--status=<status>` - New status: pending, done, in-progress, review, deferred, cancelled
   - `--with-subtasks` - Also update subtasks

7. **sync-readme** - Export tasks to README with professional formatting
   - Updates README with task list formatted for GitHub

8. **update** - Update multiple tasks based on new requirements
   - `--from=<id>` - Starting task ID (required)
   - `--prompt="<context>"` - Context to apply to all tasks (required)
   - Updates a single task without regeneration

9. **update-task** - Update a specific task with new information
   - `--id=<id>` - Task ID (required)
   - `--prompt="<context>"` - New information to incorporate (required)

10. **update-subtask** - Append additional information to a subtask
    - `--id=<parentId.subtaskId>` - Subtask ID in parent.child format (required)
    - `--prompt="<context>"` - Information to append (required)

11. **add-task** - Add a new task using AI
    - `--prompt="<text>"` - Task description (required)
    - `--dependencies=<ids>` - Comma-separated dependency IDs (optional)
    - `--priority=<priority>` - Priority level: high, medium, low (optional)

12. **remove-task** - Permanently remove a task or subtask
    - `--id=<id>` - Task/subtask ID (required)
    - `-y` - Skip confirmation (optional)
    - Removes a subtask (optionally converts to standalone task)
    - Removes all subtasks from all tasks

13. **add-subtask** - Add a new subtask to a parent task
    - `--parent-id=<id>` - Parent task ID (required)
    - `--title="<title>"` - Subtask title (required)
    - `--description="<desc>"` - Subtask description (optional)
    - `--task-id=<id>` - Convert existing task to subtask (optional)

14. **remove-subtask** - Remove a subtask
    - `--parent-id=<id>` - Parent task ID (required)
    - `--subtask-id=<id>` - Subtask ID (required)
    - `--convert` - Convert to standalone task (optional)

15. **clear-subtasks** - Clear all subtasks
    - `--all` - Clear from all tasks

### Task Analysis & Breakdown

16. **analyze-complexity** - Analyze tasks and generate expansion recommendations
    - `--threshold=<1-10>` - Complexity threshold (default: 5)
    - `[task1,task2]` - Specific tasks to analyze
    - `[--research]` - Use research model
    - `[--prompt="<context>"]` - Additional context

17. **complexity-report** - Display the complexity analysis report
    - Shows tasks into detailed subtasks
    - Breaks specific task into subtasks

18. **expand** - Expand tasks into subtasks
    - `--all` - Expand all tasks based on thresholds
    - Task-specific expansion with subtask count

### Task Navigation & Viewing

19. **next** - Show the next task to work on based on dependencies
    - `<id>` - Display detailed information about a specific task

20. **show** - Display detailed task information
    - `<id>` - Task ID to show

### Dependency Management

21. **add-dependency** - Add a dependency to a task
    - `--id=<id>` - Task ID
    - `--depends-on=<id>` - Dependency ID
    - Removes a dependency from a task

22. **remove-dependency** - Remove a dependency
    - `--id=<id>` - Task ID
    - `--depends-on=<id>` - Dependency to remove
    - Identifies invalid dependencies without fixing them

23. **validate-dependencies** - Check for dependency issues
    - Fix invalid dependencies (automatically)

24. **fix-dependencies** - Auto-fix dependency issues

### Configuration

25. **taskmaster/config.json** - AI model configuration file
    - API keys for AI providers (Anthropic, API_KEY, etc.)
    - API keys for Cursor integration

## Current Implementation Status

✅ **Completed Features:**
- Basic task list display with real-time updates
- View filtering (All, Pending, In Progress, Done)
- Keyboard navigation (arrows, j/k, PgUp/PgDn)
- Task detail view (s key)
- Subtask toggling (Tab key)
- Exit functionality (Q key)
- File watching with auto-refresh
- Task status update (u key) with BottomSheet and --with-subtasks option
- Generate task files (g key)
- Next task suggestion & navigation (n key)
- Add new task (a key) with minimal input and confirmation
- Remove task (r key) with confirmation
- Update/Edit task (e key) with single prompt field (CLI compliant)
- Project Setup page (p key) for model configuration
- InlineTaskInput with confirmation prompt
- Bottom sheet modal pattern (used consistently)
- UpdatePrompt component for single-field updates
- StatusSelectorWithOptions for enhanced status updates
- EnhancedTaskInput for progressive disclosure of optional fields
- Export to README (x key) with progress indicator
- Batch update from ID (U key) with multi-stage input
- Update subtask append (E key) with context-aware selection
- Add subtask (A key) with multi-stage input and context awareness
- Remove subtask (R key) with option to convert to standalone task
- Clear subtasks (C key) from all tasks
- Parse PRD (P key) to generate tasks from PRD document
- Analyze complexity (c key) with threshold and task selection options
- Complexity report viewer (X key) to display analysis results
- Task expansion (v key) for single task or bulk expansion
- Help overlay (h/? keys) with comprehensive command reference
- Dependency management (d/D/V/F keys) for adding, removing, validating and fixing dependencies
- Model management UI (m key) for configuring AI models
- Project initialization (i key) for setting up new projects
- Toast notifications for operation feedback
- Progress indicators for long-running operations
- Loading states with skeleton loaders

## Keyboard Shortcuts Mapping

| Key | CLI Command | Description | Implementation Status |
|-----|-------------|-------------|----------------------|
| i | init | Initialize project | ✅ Completed |
| m | models | Manage AI models | ✅ Completed |
| P | parse-prd | Parse PRD to tasks | ✅ Completed |
| g | generate | Generate task files | ✅ Completed |
| l | list | View/filter tasks | ✅ Completed (via views) |
| u | set-status | Update task status | ✅ Completed |
| x | sync-readme | Export to README | ✅ Completed |
| U | update | Update multiple tasks | ✅ Completed |
| e | update-task | Update single task | ✅ Completed |
| E | update-subtask | Update subtask | ✅ Completed |
| a | add-task | Add new task | ✅ Completed |
| r | remove-task | Remove task | ✅ Completed |
| A | add-subtask | Add subtask | ✅ Completed |
| R | remove-subtask | Remove subtask | ✅ Completed |
| C | clear-subtasks | Clear all subtasks | ✅ Completed |
| c | analyze-complexity | Analyze complexity | ✅ Completed |
| X | complexity-report | Show complexity report | ✅ Completed |
| v | expand | Expand tasks | ✅ Completed |
| n | next | Next task navigation | ✅ Completed |
| s | show | Show task details | ✅ Completed |
| d | add-dependency | Add dependency | ✅ Completed |
| D | remove-dependency | Remove dependency | ✅ Completed |
| V | validate-dependencies | Validate deps | ✅ Completed |
| F | fix-dependencies | Fix deps | ✅ Completed |
| p | (project setup) | Configure project | ✅ Completed |
| Tab | (toggle) | Show/hide subtasks | ✅ Completed |
| h/? | (help) | Show help overlay | ✅ Completed |
| q | (quit) | Exit application | ✅ Completed |

## User Interaction Design

### Modal Interactions

1. **Add Task (a key)**
   - Current: Single-line input with confirmation
   - Enhancement available: EnhancedTaskInput with optional dependency and priority fields (Tab to access)

2. **Update Task (e key)**
   - ✅ Fixed: Now uses UpdatePrompt with single prompt field only (matching CLI)

3. **Add Subtask (A key)**
   - Context-aware: When viewing a task, adds subtask to that task
   - Fields: Title (required), Description (optional)
   - Option to convert existing task

4. **Status Update (u key)**
   - ✅ Fixed: Now uses BottomSheet with StatusSelectorWithOptions
   - ✅ Fixed: Added --with-subtasks checkbox when task has subtasks

5. **Batch Update (U key)**
   - Show affected tasks preview
   - Confirm before applying
   - Progress indicator

6. **Export README (x key)**
   - Simple confirmation
   - Show export path on success

### Context-Aware Operations

When in **Task List View**:
- a = Add new task
- r = Remove selected task
- e = Update selected task
- A = Convert task to subtask (with parent selection)

When in **Task Detail View** (after pressing s):
- a = Add subtask to current task
- r = Remove selected subtask
- e = Update selected subtask
- A = Add another subtask
- ESC = Return to task list

### Progressive Disclosure

1. **Simple Operations** (single input):
   - Add task (prompt only)
   - Update task (prompt only)
   - Remove task (confirmation only)

2. **Complex Operations** (multi-step):
   - Parse PRD (file selection → options → generate)
   - Analyze complexity (threshold → selection → report)
   - Dependency management (source → target → validate)

## Implementation Phases

### Phase 1: Core Task Operations ✅ (Mostly Complete)
- [x] Add task with prompt
- [x] Update task with prompt
- [x] Remove task with confirmation
- [x] Status updates
- [x] Task navigation

### Phase 2: Missing CLI Commands 🚧 (High Priority)
- [x] Export to README (x key)
- [x] Batch update from ID (U key)
- [x] Update subtask append (E key)
- [x] Add/remove subtasks (A/R keys)
- [x] Clear subtasks (C key)

### Phase 3: Task Analysis 📊 (Medium Priority)
- [x] Parse PRD integration (P key)
- [x] Complexity analysis (c key)
- [x] Complexity report viewer (X key)
- [x] Task expansion (v key)

### Phase 4: Dependency Management 🔗 (Medium Priority)
- [x] Add dependencies (d key)
- [x] Remove dependencies (D key)
- [x] Validate dependencies (V key)
- [x] Fix dependencies (F key)

### Phase 5: Project Management 🛠️ (Low Priority)
- [x] Project initialization (i key)
- [x] Model management UI (m key)
- [ ] Configuration editor

### Phase 6: UI Enhancements ✨ (Low Priority)
- [x] Help overlay with command reference (h/? keys)
- [x] Toast notifications
- [x] Progress indicators
- [x] Loading states

## Component Requirements

### New Components Needed

```
components/
├── UpdatePrompt.jsx        # Single prompt input for updates ✅
├── BatchUpdateModal.jsx    # Multi-task update with preview ✅
├── SubtaskManager.jsx      # Add/remove/convert subtasks ✅
├── DependencyManager.jsx   # Add/remove dependencies ✅
├── DependencyValidator.jsx # Validate/fix dependencies ✅
├── ComplexityReport.jsx    # Display analysis results ✅
├── TaskExpander.jsx        # Expand tasks UI ✅
├── PrdParser.jsx          # Parse PRD file UI ✅
├── ModelManager.jsx       # Configure AI models ✅
├── ProjectInitializer.jsx # Initialize new projects ✅
├── ExportProgress.jsx     # Export with progress ✅
├── HelpOverlay.jsx        # Command reference ✅
├── Toast.jsx              # Toast notifications ✅
├── ProgressIndicator.jsx  # Progress indicators ✅
└── LoadingStates.jsx      # Loading skeletons ✅
```

### Service Updates Needed

```javascript
// taskService.js additions
- syncReadme() ✅
- batchUpdate(fromId, prompt) ✅
- updateSubtask(subtaskId, prompt) ✅
- addSubtask(parentId, subtaskData) ✅
- removeSubtask(parentId, subtaskId, convert) ✅
- clearSubtasks(all) ✅
- analyzeComplexity(options) ✅
- expandTask(taskId, numSubtasks, options) ✅
- expandAll(options) ✅
- getComplexityReport() ✅
- addDependency(taskId, dependsOn) ✅
- removeDependency(taskId, dependsOn) ✅
- validateDependencies() ✅
- fixDependencies() ✅
- parsePrd(inputFile, numTasks) ✅
```

## Design Principles

1. **CLI Parity**: Every CLI command must be accessible via keyboard
2. **Minimal Input**: Use single-field inputs where possible
3. **Context Awareness**: Operations change based on current view
4. **Progressive Enhancement**: Start simple, add complexity as needed
5. **Keyboard First**: All operations via keyboard shortcuts
6. **Visual Feedback**: Clear indication of current state/operation
7. **Error Recovery**: Graceful handling with helpful messages

## Testing Requirements

- Unit tests for each new component
- Integration tests for CLI command equivalents
- Keyboard navigation tests
- Context-switching tests
- Error handling tests
- Performance tests for batch operations

---
*This plan represents the complete feature set of Task Master CLI to be implemented in the UI.*