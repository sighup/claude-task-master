# Start-UI Functional Tests

This directory contains functional tests for the start-ui interactive terminal interface. These tests verify that the UI correctly updates in response to file system changes and user interactions.

## Test Files

### `taskStateChanges.test.js`
Tests that verify the UI updates correctly when task states change:
- Status updates from pending to in-progress/done
- Multiple task updates
- Filtered view updates
- Task detail view updates
- Selection persistence during updates

### `userInteractions.test.js`
Tests for keyboard navigation and user interactions:
- Task navigation (j/k keys)
- View switching (1-4 keys)
- Task status updates via keyboard
- Subtask toggling
- Exit handling
- Page navigation for long lists

### `realTimeUpdates.test.js`
Tests for real-time file system updates:
- External task updates (simulating CLI commands from another terminal)
- Multiple concurrent updates
- New task additions
- Updates while in different views
- User position preservation during updates

### `performanceEdgeCases.test.js`
Tests for performance and edge cases:
- Large task lists (100+ tasks)
- Empty task lists
- Long task titles
- Nested subtasks
- Rapid updates and debouncing
- Corrupted JSON handling
- Missing task fields

## Running the Tests

Run all functional tests:
```bash
npm test tests/functional/start-ui
```

Run a specific test file:
```bash
npm test tests/functional/start-ui/taskStateChanges.test.js
```

## Test Infrastructure

### Mock File System
The tests use a real file system with temporary directories to accurately test file watching:
- `setupMockProject()` - Creates a temporary project with tasks.json
- `updateMockTaskStatus()` - Updates task status in the mock file
- `addMockTask()` - Adds new tasks
- `cleanupMockProject()` - Removes temporary directories

### Timing Considerations
- The `StableTaskService` has a 3-second minimum update interval
- Tests use appropriate delays to account for debouncing
- File system operations include small delays to simulate real behavior

### Assertions
Tests verify:
- Terminal output using `lastFrame()`
- Task counts and statistics
- View-specific content
- Selection indicators (►)
- File system state matches UI state

## Key Testing Patterns

1. **Initial Setup**
   ```javascript
   mockProjectRoot = setupMockProject({ tasks: [...] });
   app = render(<App projectRoot={mockProjectRoot} />);
   await delay(100); // Wait for initial render
   ```

2. **User Input Simulation**
   ```javascript
   stdin.write('j'); // Navigate down
   stdin.write('2'); // Switch to pending view
   stdin.write('\r'); // Press Enter
   ```

3. **File System Changes**
   ```javascript
   await updateMockTaskStatus(mockProjectRoot, taskId, 'done');
   await delay(3500); // Wait for debounced update
   ```

4. **UI Verification**
   ```javascript
   expect(lastFrame()).toContain('Expected text');
   expect(lastFrame()).toMatch(/►.*Task Name/);
   ```

## Notes

- Tests use real file system operations for accuracy
- Temporary directories are created in the system temp folder
- All tests clean up their temporary files
- Tests are designed to catch regressions like infinite re-renders
- Performance tests ensure the UI remains responsive with large datasets