/**
 * Command Registry Service
 * Provides methods to manage and execute commands
 */

import {
  CommandRegistry,
  CommandCategories,
  CommandGroups,
  KeyboardShortcuts,
  getCommandByAlias,
  getCommandById,
  getCommandsByCategory,
  validateCommandContext
} from '../helpers/commandRegistry.js';

import { searchCommands } from '../helpers/fuzzySearch.js';

class CommandRegistryService {
  constructor() {
    this.commands = CommandRegistry;
    this.categories = CommandCategories;
    this.groups = CommandGroups;
    this.shortcuts = KeyboardShortcuts;
  }

  /**
   * Get a command by its ID
   * @param {string} id - The command ID
   * @returns {Object|null} The command object or null if not found
   */
  getCommandById(id) {
    return getCommandById(id);
  }

  /**
   * Get commands by category
   * @param {string} category - The category name
   * @returns {Array} Array of commands in the category
   */
  getCommandsByCategory(category) {
    return getCommandsByCategory(category);
  }

  /**
   * Get all commands
   * @returns {Array} Array of all commands
   */
  getAllCommands() {
    if (!this.commands) {
      return [];
    }
    return Object.values(this.commands);
  }

  /**
   * Get commands available in the current context
   * @param {Object} context - The current context (selectedTask, selectedSubtask, etc.)
   * @returns {Array} Array of available commands
   */
  getAvailableCommands(context = {}) {
    if (!this.commands) {
      return [];
    }
    return Object.values(this.commands).filter(command => {
      const validation = validateCommandContext(command, context);
      return validation.valid;
    });
  }

  /**
   * Parse a command string to extract command and arguments
   * @param {string} input - The input string
   * @returns {Object} Object with command and args
   */
  parseCommand(input) {
    if (!input || typeof input !== 'string') {
      return { command: null, args: {} };
    }

    const trimmedInput = input.trim();
    
    // Check for keyboard shortcut first
    if (trimmedInput.length === 1 && this.shortcuts[trimmedInput]) {
      const commandKey = this.shortcuts[trimmedInput];
      const command = this.commands[commandKey];
      return { command, args: {} };
    }

    // Split input into parts
    const parts = trimmedInput.split(/\s+/);
    const commandPart = parts[0].toLowerCase();
    
    // Find command by alias
    const command = getCommandByAlias(commandPart);
    if (!command) {
      return { command: null, args: {}, error: `Unknown command: ${commandPart}` };
    }

    // Parse arguments based on command requirements
    const args = {};
    const remainingParts = parts.slice(1);
    
    if (command.requiresArgs && command.requiresArgs.length > 0) {
      // Simple argument parsing - join all remaining parts as the value
      // This could be enhanced to support named arguments or more complex parsing
      if (remainingParts.length > 0) {
        // For commands with single argument, use the entire remaining input
        if (command.requiresArgs.length === 1) {
          args[command.requiresArgs[0]] = remainingParts.join(' ');
        } else {
          // For multiple arguments, try to parse them positionally
          command.requiresArgs.forEach((argName, index) => {
            if (index < remainingParts.length) {
              // Special handling for last argument - take all remaining parts
              if (index === command.requiresArgs.length - 1) {
                args[argName] = remainingParts.slice(index).join(' ');
              } else {
                args[argName] = remainingParts[index];
              }
            }
          });
        }
      }
    }

    return { command, args };
  }

  /**
   * Execute a command (returns the action to be executed)
   * @param {Object} command - The command object
   * @param {Object} args - The command arguments
   * @param {Object} context - The execution context
   * @returns {Object} Object with action and parameters
   */
  executeCommand(command, args = {}, context = {}) {
    if (!command) {
      return { 
        success: false, 
        error: 'No command provided' 
      };
    }

    // Validate command in context
    const validation = validateCommandContext(command, { ...context, args });
    if (!validation.valid) {
      return { 
        success: false, 
        error: validation.message 
      };
    }

    // Return the action to be executed by the UI
    return {
      success: true,
      action: command.action,
      params: {
        ...args,
        commandId: command.id,
        commandName: command.name
      }
    };
  }

  /**
   * Search for commands using fuzzy search
   * @param {string} query - The search query
   * @param {Object} options - Search options
   * @returns {Array} Array of matching commands with scores
   */
  searchCommands(query, options = {}) {
    const commands = Object.values(this.commands);
    return searchCommands(commands, query, options);
  }

  /**
   * Get command by keyboard shortcut
   * @param {string} key - The keyboard key
   * @returns {Object|null} The command object or null
   */
  getCommandByShortcut(key) {
    const commandKey = this.shortcuts[key];
    return commandKey ? this.commands[commandKey] : null;
  }

  /**
   * Get all keyboard shortcuts
   * @returns {Object} Object mapping keys to command IDs
   */
  getKeyboardShortcuts() {
    return { ...this.shortcuts };
  }

  /**
   * Check if a command is available in the given context
   * @param {string} commandId - The command ID
   * @param {Object} context - The current context
   * @returns {boolean} Whether the command is available
   */
  isCommandAvailable(commandId, context = {}) {
    const command = this.getCommandById(commandId);
    if (!command) return false;

    const validation = validateCommandContext(command, context);
    return validation.valid;
  }

  /**
   * Get command help text
   * @param {string} commandId - The command ID
   * @returns {Object} Help information for the command
   */
  getCommandHelp(commandId) {
    const command = this.getCommandById(commandId);
    if (!command) return null;

    return {
      name: command.name,
      description: command.description,
      aliases: command.aliases,
      category: command.category,
      requiresSelection: command.requiresSelection,
      requiresArgs: command.requiresArgs || [],
      usage: this.getCommandUsage(command),
      examples: this.getCommandExamples(command)
    };
  }

  /**
   * Get command usage string
   * @param {Object} command - The command object
   * @returns {string} Usage string
   */
  getCommandUsage(command) {
    const parts = [command.aliases[0]];
    
    if (command.requiresArgs && command.requiresArgs.length > 0) {
      const argStrings = command.requiresArgs.map(arg => `<${arg}>`);
      parts.push(...argStrings);
    }

    return parts.join(' ');
  }

  /**
   * Get command examples
   * @param {Object} command - The command object
   * @returns {Array} Array of example strings
   */
  getCommandExamples(command) {
    // This could be enhanced with actual examples from the command definitions
    const examples = [];
    
    switch (command.id) {
      case 'add-task':
        examples.push('a Implement user authentication');
        examples.push('add Create database schema');
        break;
      case 'update-status':
        examples.push('u 5 done');
        examples.push('status 3 in-progress');
        break;
      case 'search-tasks':
        examples.push('/ authentication');
        examples.push('search database');
        break;
      case 'filter-tasks':
        examples.push('f pending');
        examples.push('filter status:done');
        break;
      default:
        // Generic example
        if (command.aliases.length > 0) {
          examples.push(this.getCommandUsage(command));
        }
    }

    return examples;
  }

  /**
   * Get all command groups for UI organization
   * @returns {Array} Array of command groups
   */
  getCommandGroups() {
    return this.groups.map(group => ({
      ...group,
      commands: this.getCommandsByCategory(group.category)
    }));
  }
}

// Create singleton instance
const commandRegistryService = new CommandRegistryService();

export default commandRegistryService;