---
"task-master-ai": minor
---

feat: add interactive terminal UI with start command

- Added new `start` command (alias: `interactive`) for real-time task management
- Built with React/Ink for a modern terminal UI experience
- Features include:
  - Real-time file watching with automatic refresh
  - Multiple view filters (all, pending, in-progress, done)
  - Keyboard navigation with vim-style bindings
  - Task status updates with instant feedback
  - Detailed task view with subtasks and dependencies
  - Progress tracking and statistics display
- Fixed critical performance issues:
  - Resolved infinite re-render loops caused by circular state dependencies
  - Implemented stable file watching with debouncing and self-change detection
  - Added client-side filtering to prevent loading states during view changes
- Added comprehensive test suite with 120 tests for UI components
- Added proper JSDoc documentation for all major functions
- Dependencies added: ink, @inkjs/ui, react-dom, jest-environment-jsdom