/**
 * Command Registry for Task Master UI
 * Defines all available commands with metadata, requirements, and mappings
 */

export const CommandCategories = {
  BASIC: 'basic',
  TASK: 'task',
  BATCH: 'batch',
  PROJECT: 'project',
  NAVIGATION: 'navigation',
  HELP: 'help'
};

export const CommandRegistry = {
  // Basic Operations
  ADD_TASK: {
    id: 'add-task',
    name: 'Add Task',
    description: 'Create a new task',
    category: CommandCategories.BASIC,
    requiresSelection: false,
    requiresArgs: [],  // Made optional - prompt can be provided but not required
    aliases: ['a', 'add', '+'],
    action: 'addTask',
    icon: '➕'
  },
  
  UPDATE_TASK: {
    id: 'update-task',
    name: 'Update Task',
    description: 'Update a task with new information',
    category: CommandCategories.BASIC,
    requiresSelection: true,
    requiresArgs: [],  // Made optional - will use UI to collect details
    aliases: ['e', 'edit', 'update'],
    action: 'editTask',
    icon: '✏️'
  },
  
  REMOVE_TASK: {
    id: 'remove-task',
    name: 'Remove Task',
    description: 'Delete a task or subtask',
    category: CommandCategories.BASIC,
    requiresSelection: true,
    requiresArgs: [],  // Made optional - will use selection or UI to confirm
    aliases: ['r', 'remove', 'delete', 'd'],
    action: 'removeTask',
    icon: '🗑️'
  },
  
  SHOW_TASK: {
    id: 'show-task',
    name: 'Show Task Details',
    description: 'Display full task information',
    category: CommandCategories.BASIC,
    requiresSelection: true,
    requiresArgs: [],  // Made optional - will use selected task
    aliases: ['s', 'show', 'view'],
    action: 'showTask',
    icon: '👁️'
  },
  
  // Task-specific Operations
  UPDATE_STATUS: {
    id: 'update-status',
    name: 'Update Task Status',
    description: 'Change the status of a task',
    category: CommandCategories.TASK,
    requiresSelection: true,
    requiresArgs: [],  // Made optional - will use UI to select status
    aliases: ['u', 'status', 'mark', 'set'],
    action: 'updateTaskStatus',
    icon: '🔄'
  },
  
  ADD_SUBTASK: {
    id: 'add-subtask',
    name: 'Add Subtask',
    description: 'Create a subtask under a task',
    category: CommandCategories.TASK,
    requiresSelection: true,
    requiresArgs: [],  // Made optional - will use UI to collect details
    aliases: ['as', 'addsub'],
    action: 'addSubtask',
    icon: '📋'
  },
  
  REMOVE_SUBTASK: {
    id: 'remove-subtask',
    name: 'Remove Subtask',
    description: 'Delete a subtask from a task',
    category: CommandCategories.TASK,
    requiresSelection: true,
    requiresArgs: [],  // Made optional - will use selected subtask
    aliases: ['rs', 'removesub'],
    action: 'removeSubtask',
    icon: '❌'
  },
  
  UPDATE_SUBTASK: {
    id: 'update-subtask',
    name: 'Update Subtask',
    description: 'Update information for a subtask',
    category: CommandCategories.TASK,
    requiresSelection: true,
    requiresArgs: [],  // Made optional - will use UI to collect details
    aliases: ['us', 'updatesub'],
    action: 'updateSubtask',
    icon: '🔧'
  },
  
  CLEAR_SUBTASKS: {
    id: 'clear-subtasks',
    name: 'Clear Subtasks',
    description: 'Remove all subtasks from a task',
    category: CommandCategories.TASK,
    requiresSelection: true,
    requiresArgs: [],  // Made optional - will use UI to confirm
    aliases: ['cs', 'clearsub'],
    action: 'clearSubtasks',
    icon: '🧹'
  },
  
  ADD_DEPENDENCY: {
    id: 'add-dependency',
    name: 'Add Dependency',
    description: 'Add a dependency to a task',
    category: CommandCategories.TASK,
    requiresSelection: true,
    requiresArgs: ['taskId', 'dependsOnId'],
    aliases: ['ad', 'adddep'],
    action: 'addDependency',
    icon: '🔗'
  },
  
  REMOVE_DEPENDENCY: {
    id: 'remove-dependency',
    name: 'Remove Dependency',
    description: 'Remove a dependency from a task',
    category: CommandCategories.TASK,
    requiresSelection: true,
    requiresArgs: ['taskId', 'dependencyId'],
    aliases: ['rd', 'removedep'],
    action: 'removeDependency',
    icon: '🔓'
  },
  
  EXPAND_TASK: {
    id: 'expand-task',
    name: 'Expand Task',
    description: 'Generate subtasks for a task',
    category: CommandCategories.TASK,
    requiresSelection: true,
    requiresArgs: [],  // Made optional - will use UI to configure expansion
    aliases: ['x', 'expand'],
    action: 'expandTask',
    icon: '📈'
  },
  
  MOVE_TASK: {
    id: 'move-task',
    name: 'Move Task',
    description: 'Reorder or move a task',
    category: CommandCategories.TASK,
    requiresSelection: true,
    requiresArgs: ['fromId', 'toId'],
    aliases: ['m', 'move'],
    action: 'moveTask',
    icon: '↔️'
  },
  
  // Batch Operations
  UPDATE_ALL: {
    id: 'update-all',
    name: 'Update All Tasks',
    description: 'Update multiple tasks with new context',
    category: CommandCategories.BATCH,
    requiresSelection: false,
    requiresArgs: [],  // Made optional - will use UI to collect details
    aliases: ['ua', 'updateall'],
    action: 'updateAll',
    icon: '🔄'
  },
  
  EXPAND_ALL: {
    id: 'expand-all',
    name: 'Expand All Tasks',
    description: 'Generate subtasks for all pending tasks',
    category: CommandCategories.BATCH,
    requiresSelection: false,
    requiresArgs: [],
    aliases: ['xa', 'expandall'],
    action: 'expandAll',
    icon: '📊'
  },
  
  BATCH_UPDATE_STATUS: {
    id: 'batch-update-status',
    name: 'Batch Update Status',
    description: 'Update status for multiple tasks',
    category: CommandCategories.BATCH,
    requiresSelection: false,
    requiresArgs: ['taskIds', 'status'],
    aliases: ['bus', 'batchstatus'],
    action: 'batchUpdateStatus',
    icon: '⚡'
  },
  
  // Project Operations
  PARSE_PRD: {
    id: 'parse-prd',
    name: 'Parse PRD',
    description: 'Generate tasks from PRD document',
    category: CommandCategories.PROJECT,
    requiresSelection: false,
    requiresArgs: [],
    aliases: ['p', 'prd', 'parseprd'],
    action: 'parsePrd',
    icon: '📄'
  },
  
  GENERATE_FILES: {
    id: 'generate-files',
    name: 'Generate Task Files',
    description: 'Create individual task files',
    category: CommandCategories.PROJECT,
    requiresSelection: false,
    requiresArgs: [],
    aliases: ['g', 'generate', 'gen'],
    action: 'generateTaskFiles',
    icon: '📁'
  },
  
  SYNC_README: {
    id: 'sync-readme',
    name: 'Sync to README',
    description: 'Export tasks to README.md',
    category: CommandCategories.PROJECT,
    requiresSelection: false,
    requiresArgs: [],
    aliases: ['sync', 'export'],
    action: 'syncReadme',
    icon: '📝'
  },
  
  INITIALIZE_PROJECT: {
    id: 'init-project',
    name: 'Initialize Project',
    description: 'Initialize Task Master in current directory',
    category: CommandCategories.PROJECT,
    requiresSelection: false,
    requiresArgs: [],
    aliases: ['init', 'i'],
    action: 'initializeProject',
    icon: '🚀'
  },
  
  ANALYZE_COMPLEXITY: {
    id: 'analyze-complexity',
    name: 'Analyze Complexity',
    description: 'Analyze project task complexity',
    category: CommandCategories.PROJECT,
    requiresSelection: false,
    requiresArgs: [],
    aliases: ['ac', 'analyze', 'complexity'],
    action: 'analyzeComplexity',
    icon: '📈'
  },
  
  SHOW_COMPLEXITY_REPORT: {
    id: 'show-complexity-report',
    name: 'Show Complexity Report',
    description: 'Display complexity analysis results',
    category: CommandCategories.PROJECT,
    requiresSelection: false,
    requiresArgs: [],
    aliases: ['cr', 'report'],
    action: 'showComplexityReport',
    icon: '📊'
  },
  
  VALIDATE_DEPENDENCIES: {
    id: 'validate-dependencies',
    name: 'Validate Dependencies',
    description: 'Check for dependency issues',
    category: CommandCategories.PROJECT,
    requiresSelection: false,
    requiresArgs: [],
    aliases: ['vd', 'validate'],
    action: 'validateDependencies',
    icon: '✅'
  },
  
  FIX_DEPENDENCIES: {
    id: 'fix-dependencies',
    name: 'Fix Dependencies',
    description: 'Automatically fix dependency issues',
    category: CommandCategories.PROJECT,
    requiresSelection: false,
    requiresArgs: [],
    aliases: ['fd', 'fixdeps'],
    action: 'fixDependencies',
    icon: '🔧'
  },
  
  CONFIGURE_MODELS: {
    id: 'configure-models',
    name: 'Configure AI Models',
    description: 'Set up AI model configurations',
    category: CommandCategories.PROJECT,
    requiresSelection: false,
    requiresArgs: [],
    aliases: ['models', 'config'],
    action: 'configureModels',
    icon: '🤖'
  },
  
  // Navigation
  NEXT_TASK: {
    id: 'next-task',
    name: 'Next Task',
    description: 'Navigate to the next available task',
    category: CommandCategories.NAVIGATION,
    requiresSelection: false,
    requiresArgs: [],
    aliases: ['n', 'next'],
    action: 'nextTask',
    icon: '➡️'
  },
  
  GO_TO_TASK: {
    id: 'go-to-task',
    name: 'Go to Task',
    description: 'Navigate to a specific task',
    category: CommandCategories.NAVIGATION,
    requiresSelection: false,
    requiresArgs: ['taskId'],
    aliases: ['gt', 'goto'],
    action: 'goToTask',
    icon: '🎯'
  },
  
  FILTER_TASKS: {
    id: 'filter-tasks',
    name: 'Filter Tasks',
    description: 'Filter tasks by status or criteria',
    category: CommandCategories.NAVIGATION,
    requiresSelection: false,
    requiresArgs: ['filter'],
    aliases: ['f', 'filter'],
    action: 'filterTasks',
    icon: '🔍'
  },
  
  SEARCH_TASKS: {
    id: 'search-tasks',
    name: 'Search Tasks',
    description: 'Search tasks by text',
    category: CommandCategories.NAVIGATION,
    requiresSelection: false,
    requiresArgs: ['query'],
    aliases: ['/', 'search'],
    action: 'searchTasks',
    icon: '🔎'
  },
  
  // Help
  SHOW_HELP: {
    id: 'show-help',
    name: 'Show Help',
    description: 'Display help and keyboard shortcuts',
    category: CommandCategories.HELP,
    requiresSelection: false,
    requiresArgs: [],
    aliases: ['h', 'help', '?'],
    action: 'showHelp',
    icon: '❓'
  },
  
  SHOW_COMMANDS: {
    id: 'show-commands',
    name: 'Show Command Palette',
    description: 'Display all available commands',
    category: CommandCategories.HELP,
    requiresSelection: false,
    requiresArgs: [],
    aliases: ['palette', 'cmd'],
    action: 'showCommandPalette',
    icon: '🎨'
  },
  
  EXIT_APP: {
    id: 'exit',
    name: 'Exit Application',
    description: 'Exit the Task Master UI',
    category: CommandCategories.HELP,
    requiresSelection: false,
    requiresArgs: [],
    aliases: ['q', 'quit', 'exit'],
    action: 'exitApp',
    icon: '🚪'
  }
};

// Helper functions
export const getCommandByAlias = (alias) => {
  return Object.values(CommandRegistry).find(cmd => 
    cmd.aliases.includes(alias.toLowerCase())
  );
};

export const getCommandById = (id) => {
  return Object.values(CommandRegistry).find(cmd => cmd.id === id);
};

export const getCommandsByCategory = (category) => {
  return Object.values(CommandRegistry).filter(cmd => cmd.category === category);
};

export const getCommandRequirements = (command) => {
  return {
    requiresSelection: command.requiresSelection,
    requiresArgs: command.requiresArgs || [],
    requiresContext: command.requiresContext || []
  };
};

export const validateCommandContext = (command, context) => {
  // Check if selection is required
  if (command.requiresSelection && !context.selectedTask) {
    return {
      valid: false,
      message: 'This command requires a task to be selected'
    };
  }
  
  // Special validation for subtask-specific commands
  const subtaskCommands = ['remove-subtask', 'update-subtask'];
  if (subtaskCommands.includes(command.id)) {
    if (!context.selectedTask?.selectedSubtask) {
      return {
        valid: false,
        message: 'This command requires a subtask to be selected'
      };
    }
  }
  
  // Check for required arguments
  const missingArgs = command.requiresArgs.filter(arg => !context.args?.[arg]);
  if (missingArgs.length > 0) {
    return {
      valid: false,
      message: `Missing required arguments: ${missingArgs.join(', ')}`
    };
  }
  
  return { valid: true };
};

// Export command groups for UI organization
export const CommandGroups = [
  {
    name: 'Basic Operations',
    category: CommandCategories.BASIC,
    icon: '📝'
  },
  {
    name: 'Task Management',
    category: CommandCategories.TASK,
    icon: '✅'
  },
  {
    name: 'Batch Operations',
    category: CommandCategories.BATCH,
    icon: '🔄'
  },
  {
    name: 'Project Tools',
    category: CommandCategories.PROJECT,
    icon: '🛠️'
  },
  {
    name: 'Navigation',
    category: CommandCategories.NAVIGATION,
    icon: '🧭'
  },
  {
    name: 'Help',
    category: CommandCategories.HELP,
    icon: '❓'
  }
];

// Export keyboard shortcuts mapping
export const KeyboardShortcuts = {
  'a': 'ADD_TASK',
  'e': 'UPDATE_TASK',
  'r': 'REMOVE_TASK',
  's': 'SHOW_TASK',
  'u': 'UPDATE_STATUS',
  'n': 'NEXT_TASK',
  'g': 'GENERATE_FILES',
  'h': 'SHOW_HELP',
  'p': 'PARSE_PRD',
  '/': 'SEARCH_TASKS',
  'x': 'EXPAND_TASK',
  'm': 'CONFIGURE_MODELS',
  'f': 'FILTER_TASKS',
  'd': 'ADD_DEPENDENCY',
  '?': 'SHOW_HELP',
  '+': 'ADD_TASK',
  'i': 'INITIALIZE_PROJECT',
  'q': 'EXIT_APP',
  'c': 'ANALYZE_COMPLEXITY',
  'v': 'VALIDATE_DEPENDENCIES'
};

export default CommandRegistry;