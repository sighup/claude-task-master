import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { Navigation } from './Navigation.jsx';
import { TreeTaskList } from './TreeTaskList.jsx';
import { getSelectedTaskInfo, formatSubtaskId } from '../helpers/taskHelpers.js';
import { LoadingSpinner } from './ProgressIndicator.jsx';
import { DelayedLoadingSkeleton } from './LoadingStates.jsx';

export function TaskListContainer({
  tasks,
  currentView,
  showSubtasks,
  isLoading,
  selectedTask,
  selectedIndex,
  isNavigating,
  handleViewChange,
  toggleSubtasks,
  onSelectItem, // This is likely the 'select' callback from useNavigation
  activeTaskRef,
  totalTasks,
  doneTasks,
  inProgressTasks,
  pendingTasks,
  totalNavigableItems,
  onDisplayedTasksCountChange, // New callback prop
  onDisplayedTasksChange, // Callback to pass up the full displayed task list
  nextEligibleTasks, // Add this prop
  taskListItemAreaHeight // Accept new prop for item area height
}) {

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    // Tasks are already filtered by useTaskData hook based on the filter passed from App.jsx
    // No need to filter again here - just return the tasks as-is
    return tasks;
  }, [tasks]);

  // Calculate flattened tasks for navigation count
  const displayedTasks = useMemo(() => {
    // Don't return empty array during loading if we already have tasks
    if (isLoading && (!tasks || tasks.length === 0)) {
      return [];
    }
    
    // Replicate TreeTaskList's flattening logic for accurate count
    const result = [];
    filteredTasks.forEach(task => {
      result.push(task);
      if (showSubtasks && task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach(subtask => {
          result.push({ 
            ...subtask, 
            isSubtask: true, 
            parentId: task.id 
          });
        });
      }
    });
    
    
    return result;
  }, [filteredTasks, showSubtasks]); // Remove isLoading and tasks dependencies to prevent unnecessary recalculations

  // Determine the actual task object for the current selectedIndex
  const currentSelectedItem = displayedTasks[selectedIndex];

  React.useEffect(() => {
    if (onDisplayedTasksCountChange) {
      onDisplayedTasksCountChange(displayedTasks.length);
    }
    if (onDisplayedTasksChange) {
      onDisplayedTasksChange(displayedTasks);
    }
  }, [displayedTasks, onDisplayedTasksCountChange, onDisplayedTasksChange]);

  return (
    <Box flexDirection="column" width="100%" flexGrow={1}>
      <Navigation
        currentView={currentView}
        onViewChange={handleViewChange}
        showSubtasks={showSubtasks}
        onToggleSubtasks={toggleSubtasks}
        totalTasks={totalTasks}
        doneTasks={doneTasks}
        inProgressTasks={inProgressTasks}
        pendingTasks={pendingTasks}
        totalNavigableItems={totalNavigableItems}
        selectedIndex={selectedIndex}
      />

      {(() => {
        if (isLoading && (!tasks || tasks.length === 0)) {
          return <DelayedLoadingSkeleton />;
        }

        if (displayedTasks.length === 0 && !isLoading) {
          // Double-check if we actually have tasks but displayedTasks hasn't updated yet
          if (filteredTasks.length > 0) {
            // Force a re-render by returning the TreeTaskList anyway
            return (
              <TreeTaskList
                tasks={filteredTasks}
                selectedIndex={selectedIndex}
                loading={isLoading}
                showSubtasks={showSubtasks}
                nextEligibleTasks={nextEligibleTasks}
                itemAreaHeight={taskListItemAreaHeight}
              />
            );
          }
          return (
            <Box flexGrow={1} alignItems="center" justifyContent="center">
              <Text>No tasks to display in this view.</Text>
            </Box>
          );
        }


        return (
          <TreeTaskList
            tasks={filteredTasks}
            selectedIndex={selectedIndex}
            loading={isLoading}
            showSubtasks={showSubtasks}
            nextEligibleTasks={nextEligibleTasks}
            itemAreaHeight={taskListItemAreaHeight}
          />
        );
      })()}
    </Box>
  );
}
