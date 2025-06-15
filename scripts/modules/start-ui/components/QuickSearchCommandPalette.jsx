import React, { useMemo, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { QuickSearchInput } from '@inkkit/ink-quicksearch-input';
import commandRegistry from '../services/CommandRegistry.js';

/**
 * Command palette using ink-quicksearch-input for better search and navigation
 */
export function QuickSearchCommandPalette({ 
  isActive, 
  onClose, 
  mode = 'command',
  onExecute,
  context = {},
  onSuggestionsChange,
  tasks = []
}) {
  // Get items based on mode
  const items = useMemo(() => {
    if (mode === 'command') {
      // Command mode - show available commands
      const availableCommands = commandRegistry.getAvailableCommands(context);
      const allCommands = availableCommands.length > 0 ? availableCommands : commandRegistry.getAllCommands();
      
      // Transform commands for QuickSearchInput format
      return allCommands
        .filter(cmd => cmd.id !== 'show-commands') // Filter out redundant show-commands
        .map(cmd => ({
          value: cmd.id,
          label: cmd.id,
          description: cmd.description,
          command: cmd,
          type: 'command',
          // Include aliases for better search
          searchText: `${cmd.id} ${cmd.name} ${cmd.aliases.join(' ')} ${cmd.description}`.toLowerCase()
        }));
    } else if (mode === 'search') {
      // Search mode - show tasks
      const flatTasks = [];
      
      tasks.forEach(task => {
        // Add parent task
        flatTasks.push({
          value: `task-${task.id}`,
          label: `[${task.id}] ${task.title}`,
          description: task.description,
          task: task,
          type: 'task',
          status: task.status,
          priority: task.priority,
          searchText: `${task.id} ${task.title} ${task.description} ${task.status}`.toLowerCase()
        });
        
        // Add subtasks
        if (task.subtasks && task.subtasks.length > 0) {
          task.subtasks.forEach((subtask, index) => {
            flatTasks.push({
              value: `subtask-${task.id}-${subtask.id}`,
              label: `  └─ [${task.id}.${index + 1}] ${subtask.title}`,
              description: subtask.description,
              task: subtask,
              parentTask: task,
              type: 'subtask',
              status: subtask.status,
              searchText: `${task.id}.${index + 1} ${subtask.title} ${subtask.description} ${subtask.status}`.toLowerCase()
            });
          });
        }
      });
      
      return flatTasks;
    }
    
    return [];
  }, [mode, context, tasks]);

  // Handle escape key globally
  useInput((input, key) => {
    if (!isActive) return;
    
    if (key.escape) {
      onClose();
    }
  });

  // Notify parent about suggestions visibility
  useEffect(() => {
    if (onSuggestionsChange) {
      // QuickSearchInput always shows items when active
      onSuggestionsChange(isActive, isActive ? Math.min(items.length, 8) : 0);
    }
  }, [isActive, items.length, onSuggestionsChange]);

  if (!isActive) {
    return null; // Don't show anything when inactive
  }

  const borderColor = mode === 'search' ? 'yellow' : 'cyan';
  const initialQuery = mode === 'search' ? '' : '/';

  return (
    <Box width="100%" flexDirection="column">
      <Box
        borderStyle="single"
        borderColor={borderColor}
        width="100%"
        paddingX={1}
        paddingY={0}
      >
        <QuickSearchInput
          items={items}
          onSelect={(item) => {
            if (item) {
              if (item.type === 'command' && item.command) {
                // Execute command
                const result = commandRegistry.parseCommand(item.value);
                if (result.command) {
                  onExecute(result.command.id, mode, result.params);
                } else {
                  onExecute(item.value, mode);
                }
              } else if (item.type === 'task' || item.type === 'subtask') {
                // Navigate to task
                onExecute('show-task', 'search', { 
                  taskId: item.task.id,
                  isSubtask: item.type === 'subtask',
                  parentTaskId: item.parentTask?.id 
                });
              }
            }
            onClose();
          }}
          indicatorComponent={({ isSelected }) => (
            <Text color={isSelected ? 'cyan' : 'gray'}>
              {isSelected ? '▸' : ' '}
            </Text>
          )}
          itemComponent={({ isSelected, item }) => {
            if (item.type === 'task' || item.type === 'subtask') {
              // Task/subtask display
              const statusColors = {
                'done': 'green',
                'in-progress': 'yellow', 
                'pending': 'gray',
                'blocked': 'red'
              };
              const statusColor = statusColors[item.status] || 'gray';
              
              return (
                <Box flexDirection="column" width="100%">
                  <Text 
                    color={isSelected ? 'cyan' : statusColor}
                    bold={isSelected}
                  >
                    {item.label}
                  </Text>
                  {item.description && (
                    <Box marginLeft={2}>
                      <Text color="gray" dimColor wrap="wrap">
                        {item.description.substring(0, 80)}
                        {item.description.length > 80 ? '...' : ''}
                      </Text>
                    </Box>
                  )}
                </Box>
              );
            }
            
            // Command display
            return (
              <Box flexDirection="column" width="100%">
                <Text 
                  color={isSelected ? 'cyan' : 'white'}
                  bold={isSelected}
                >
                  {item.label}
                </Text>
                {item.description && (
                  <Box marginLeft={2}>
                    <Text color="gray" dimColor wrap="wrap">
                      {item.description}
                    </Text>
                  </Box>
                )}
              </Box>
            );
          }}
          highlightComponent={({ isSelected, children }) => (
            <Text 
              color={isSelected ? 'cyan' : 'yellow'}
              bold={isSelected}
            >
              {children}
            </Text>
          )}
          limit={8}
          forceMatchingQuery={false}
          clearQueryChars={[
            { key: 'ctrl', char: 'u' },
            { key: 'ctrl', char: 'w' }
          ]}
          initialQuery={initialQuery}
          caseSensitive={false}
        />
      </Box>
    </Box>
  );
}