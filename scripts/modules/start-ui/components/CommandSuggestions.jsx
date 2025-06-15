import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, List, ListItem, ListItemText, Typography, Chip, useTheme, alpha } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Update as UpdateIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Build as BuildIcon,
  Code as CodeIcon,
  Check as CheckIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Help as HelpIcon,
  History as HistoryIcon,
  ExpandMore as ExpandIcon,
  CompareArrows as MoveIcon,
  Link as DependencyIcon,
  Folder as ProjectIcon,
} from '@mui/icons-material';

// Command categories with their icons
const categoryIcons = {
  task: <CheckIcon />,
  edit: <EditIcon />,
  view: <SearchIcon />,
  project: <ProjectIcon />,
  analysis: <AnalyticsIcon />,
  navigation: <PlayArrowIcon />,
  help: <HelpIcon />,
};

// Define all available commands
const allCommands = [
  // Task Management
  { id: 'add-task', label: 'Add New Task', description: 'Create a new task', shortcut: 'a', category: 'task', icon: <AddIcon /> },
  { id: 'add-subtask', label: 'Add Subtask', description: 'Add a subtask to the selected task', shortcut: 'shift+a', category: 'task', icon: <AddIcon /> },
  { id: 'update-task', label: 'Update Task', description: 'Update the selected task', shortcut: 'u', category: 'task', icon: <UpdateIcon /> },
  { id: 'update-subtask', label: 'Update Subtask', description: 'Update a subtask', shortcut: 'shift+u', category: 'task', icon: <UpdateIcon /> },
  { id: 'remove-task', label: 'Remove Task', description: 'Delete the selected task', shortcut: 'del', category: 'task', icon: <DeleteIcon /> },
  { id: 'move-task', label: 'Move Task', description: 'Move task to a different position', shortcut: 'm', category: 'task', icon: <MoveIcon /> },
  { id: 'expand-task', label: 'Expand Task', description: 'Expand task into subtasks', shortcut: 'e', category: 'task', icon: <ExpandIcon /> },
  { id: 'expand-all', label: 'Expand All Tasks', description: 'Expand all pending tasks', shortcut: 'shift+e', category: 'task', icon: <ExpandIcon /> },
  
  // Status Management
  { id: 'set-status', label: 'Set Task Status', description: 'Change the status of selected tasks', shortcut: 's', category: 'edit', icon: <EditIcon /> },
  { id: 'mark-done', label: 'Mark as Done', description: 'Mark selected tasks as completed', shortcut: 'd', category: 'edit', icon: <CheckIcon /> },
  { id: 'mark-in-progress', label: 'Mark as In Progress', description: 'Set tasks to in progress', shortcut: 'i', category: 'edit', icon: <PlayArrowIcon /> },
  
  // Dependency Management
  { id: 'add-dependency', label: 'Add Dependency', description: 'Add dependency to task', shortcut: 'shift+d', category: 'edit', icon: <DependencyIcon /> },
  { id: 'remove-dependency', label: 'Remove Dependency', description: 'Remove task dependency', shortcut: 'shift+r', category: 'edit', icon: <DependencyIcon /> },
  { id: 'validate-dependencies', label: 'Validate Dependencies', description: 'Check for dependency issues', shortcut: 'v', category: 'analysis', icon: <CheckIcon /> },
  
  // View & Navigation
  { id: 'search-tasks', label: 'Search Tasks', description: 'Search through all tasks', shortcut: '/', category: 'view', icon: <SearchIcon /> },
  { id: 'filter-status', label: 'Filter by Status', description: 'Filter tasks by their status', shortcut: 'f', category: 'view', icon: <SearchIcon /> },
  { id: 'next-task', label: 'Next Task', description: 'Navigate to the next available task', shortcut: 'n', category: 'navigation', icon: <PlayArrowIcon /> },
  { id: 'refresh', label: 'Refresh Tasks', description: 'Reload tasks from file', shortcut: 'r', category: 'view', icon: <RefreshIcon /> },
  
  // Project Management
  { id: 'parse-prd', label: 'Parse PRD', description: 'Parse requirements document', shortcut: 'p', category: 'project', icon: <BuildIcon /> },
  { id: 'generate-files', label: 'Generate Task Files', description: 'Generate individual task files', shortcut: 'g', category: 'project', icon: <CodeIcon /> },
  { id: 'model-config', label: 'Model Configuration', description: 'Configure AI models', shortcut: 'shift+m', category: 'project', icon: <SettingsIcon /> },
  { id: 'export-tasks', label: 'Export Tasks', description: 'Export tasks to file', shortcut: 'shift+x', category: 'project', icon: <SaveIcon /> },
  
  // Analysis & Reports
  { id: 'analyze-complexity', label: 'Analyze Complexity', description: 'Run complexity analysis on tasks', shortcut: 'c', category: 'analysis', icon: <AnalyticsIcon /> },
  { id: 'complexity-report', label: 'View Complexity Report', description: 'Display complexity analysis results', shortcut: 'shift+c', category: 'analysis', icon: <AnalyticsIcon /> },
  
  // Help & Info
  { id: 'help', label: 'Show Help', description: 'Display keyboard shortcuts', shortcut: '?', category: 'help', icon: <HelpIcon /> },
  { id: 'about', label: 'About Task Master', description: 'Show version and info', shortcut: null, category: 'help', icon: <HelpIcon /> },
];

const CommandSuggestions = ({ 
  searchQuery = '', 
  onSelectCommand, 
  recentCommands = [],
  unavailableCommands = [],
  maxHeight = 400,
  onClose
}) => {
  const theme = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef(null);
  const itemRefs = useRef({});

  // Filter and sort commands
  const filteredCommands = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    // Filter commands based on search
    let filtered = allCommands;
    if (query) {
      filtered = allCommands.filter(cmd => 
        cmd.label.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query) ||
        cmd.shortcut?.toLowerCase().includes(query) ||
        cmd.category.toLowerCase().includes(query)
      );
    }

    // Sort by relevance and recent usage
    filtered.sort((a, b) => {
      // Recent commands come first
      const aRecent = recentCommands.includes(a.id);
      const bRecent = recentCommands.includes(b.id);
      if (aRecent && !bRecent) return -1;
      if (!aRecent && bRecent) return 1;

      // Then sort by match position
      if (query) {
        const aPos = a.label.toLowerCase().indexOf(query);
        const bPos = b.label.toLowerCase().indexOf(query);
        if (aPos !== -1 && bPos !== -1) {
          return aPos - bPos;
        }
      }

      return 0;
    });

    return filtered;
  }, [searchQuery, recentCommands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const command = filteredCommands[selectedIndex];
        if (command && !unavailableCommands.includes(command.id)) {
          onSelectCommand(command);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredCommands, onSelectCommand, unavailableCommands, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedIndex]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Highlight matched text
  const highlightMatch = (text, query) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <Box 
          key={index} 
          component="span" 
          sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.3),
            color: theme.palette.primary.main,
            fontWeight: 'bold',
            px: 0.5,
            borderRadius: 0.5
          }}
        >
          {part}
        </Box>
      ) : part
    );
  };

  let currentIndex = 0;

  return (
    <Box
      sx={{
        maxHeight,
        overflow: 'auto',
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[3],
      }}
      ref={listRef}
    >
      {filteredCommands.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No commands found for "{searchQuery}"
          </Typography>
        </Box>
      ) : (
        <List sx={{ py: 0 }}>
          {Object.entries(groupedCommands).map(([category, commands]) => (
            <React.Fragment key={category}>
              {/* Category Header */}
              <ListItem 
                sx={{ 
                  py: 0.5, 
                  px: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {categoryIcons[category]}
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {category}
                  </Typography>
                </Box>
              </ListItem>

              {/* Commands in category */}
              {commands.map((command) => {
                const isSelected = currentIndex === selectedIndex;
                const isRecent = recentCommands.includes(command.id);
                const isUnavailable = unavailableCommands.includes(command.id);
                const itemIndex = currentIndex++;

                return (
                  <ListItem
                    key={command.id}
                    ref={el => itemRefs.current[itemIndex] = el}
                    button
                    disabled={isUnavailable}
                    selected={isSelected}
                    onClick={() => !isUnavailable && onSelectCommand(command)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.15),
                        },
                      },
                      opacity: isUnavailable ? 0.5 : 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                      {/* Icon */}
                      <Box sx={{ color: isUnavailable ? 'text.disabled' : 'primary.main' }}>
                        {command.icon}
                      </Box>

                      {/* Label and Description */}
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {highlightMatch(command.label, searchQuery)}
                          </Typography>
                          {isRecent && (
                            <HistoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {highlightMatch(command.description, searchQuery)}
                        </Typography>
                      </Box>

                      {/* Shortcut */}
                      {command.shortcut && (
                        <Chip
                          label={command.shortcut}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.75rem',
                            bgcolor: alpha(theme.palette.text.primary, 0.08),
                            '& .MuiChip-label': {
                              px: 1,
                            },
                          }}
                        />
                      )}
                    </Box>
                  </ListItem>
                );
              })}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default CommandSuggestions;