/**
 * Fuzzy search implementation for command matching
 * Supports scoring, highlighting, and context-aware filtering
 */

/**
 * Calculate fuzzy match score for a string against a query
 * @param {string} str - The string to match against
 * @param {string} query - The search query
 * @returns {Object|null} Match result with score and indices, or null if no match
 */
function fuzzyMatch(str, query) {
  if (!str || !query) return null;
  
  const strLower = str.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match gets highest score
  if (strLower === queryLower) {
    return {
      score: 1000,
      indices: [[0, str.length - 1]]
    };
  }
  
  // Check if query is a substring
  const substringIndex = strLower.indexOf(queryLower);
  if (substringIndex !== -1) {
    // Beginning of string matches get higher scores
    const score = substringIndex === 0 ? 900 : 800 - substringIndex;
    return {
      score,
      indices: [[substringIndex, substringIndex + queryLower.length - 1]]
    };
  }
  
  // Fuzzy matching algorithm
  let score = 0;
  let consecutive = 0;
  let queryIndex = 0;
  let indices = [];
  let currentMatch = null;
  
  for (let i = 0; i < str.length && queryIndex < query.length; i++) {
    if (strLower[i] === queryLower[queryIndex]) {
      score += 10;
      
      // Bonus for consecutive matches
      if (consecutive > 0) {
        score += consecutive * 5;
      }
      consecutive++;
      
      // Bonus for matching at word boundaries
      if (i === 0 || /[\s\-_]/.test(str[i - 1])) {
        score += 20;
      }
      
      // Track match indices for highlighting
      if (currentMatch && currentMatch[1] === i - 1) {
        currentMatch[1] = i;
      } else {
        if (currentMatch) indices.push(currentMatch);
        currentMatch = [i, i];
      }
      
      queryIndex++;
    } else {
      consecutive = 0;
    }
  }
  
  // Add last match
  if (currentMatch) indices.push(currentMatch);
  
  // Only return if all query characters were found
  if (queryIndex !== query.length) {
    return null;
  }
  
  // Penalize based on string length difference
  const lengthPenalty = (str.length - query.length) * 2;
  score = Math.max(0, score - lengthPenalty);
  
  return { score, indices };
}

/**
 * Highlight matched portions of a string
 * @param {string} str - The original string
 * @param {Array} indices - Array of [start, end] index pairs
 * @returns {Array} Array of {text, highlighted} objects
 */
function highlightMatches(str, indices) {
  if (!indices || indices.length === 0) {
    return [{ text: str, highlighted: false }];
  }
  
  const result = [];
  let lastIndex = 0;
  
  indices.forEach(([start, end]) => {
    // Add non-highlighted portion
    if (start > lastIndex) {
      result.push({
        text: str.substring(lastIndex, start),
        highlighted: false
      });
    }
    
    // Add highlighted portion
    result.push({
      text: str.substring(start, end + 1),
      highlighted: true
    });
    
    lastIndex = end + 1;
  });
  
  // Add remaining non-highlighted portion
  if (lastIndex < str.length) {
    result.push({
      text: str.substring(lastIndex),
      highlighted: false
    });
  }
  
  return result;
}

/**
 * Check if a command is available in the given context
 * @param {Object} command - The command object
 * @param {Object} context - The current context
 * @returns {boolean} Whether the command is available
 */
function isCommandAvailable(command, context) {
  if (!command.requiresContext) return true;
  
  // Check task selection requirement
  if (command.requiresTask && !context.selectedTask) {
    return false;
  }
  
  // Check subtask requirement
  if (command.requiresSubtask && !context.selectedSubtask) {
    return false;
  }
  
  // Check if command works with current task status
  if (command.validStatuses && context.selectedTask) {
    const taskStatus = context.selectedTask.status || 'pending';
    if (!command.validStatuses.includes(taskStatus)) {
      return false;
    }
  }
  
  // Check custom availability function
  if (typeof command.isAvailable === 'function') {
    return command.isAvailable(context);
  }
  
  return true;
}

/**
 * Search commands with fuzzy matching
 * @param {Array} commands - Array of command objects
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Array} Sorted array of matching commands with scores and highlights
 */
export function searchCommands(commands, query, options = {}) {
  const {
    context = {},
    maxResults = 10,
    includeUnavailable = false
  } = options;
  
  if (!query || query.trim() === '') {
    // Return all available commands when no query
    return commands
      .filter(cmd => includeUnavailable || isCommandAvailable(cmd, context))
      .slice(0, maxResults)
      .map(cmd => ({
        command: cmd,
        score: 0,
        highlights: {
          name: [{ text: cmd.name, highlighted: false }],
          description: [{ text: cmd.description || '', highlighted: false }],
          aliases: []
        }
      }));
  }
  
  const results = [];
  
  commands.forEach(command => {
    // Skip unavailable commands unless requested
    if (!includeUnavailable && !isCommandAvailable(command, context)) {
      return;
    }
    
    let bestScore = 0;
    const highlights = {
      name: null,
      description: null,
      aliases: []
    };
    
    // Match against name
    const nameMatch = fuzzyMatch(command.name, query);
    if (nameMatch) {
      bestScore = Math.max(bestScore, nameMatch.score + 50); // Bonus for name matches
      highlights.name = highlightMatches(command.name, nameMatch.indices);
    }
    
    // Match against description
    if (command.description) {
      const descMatch = fuzzyMatch(command.description, query);
      if (descMatch) {
        bestScore = Math.max(bestScore, descMatch.score);
        highlights.description = highlightMatches(command.description, descMatch.indices);
      }
    }
    
    // Match against aliases
    if (command.aliases && Array.isArray(command.aliases)) {
      command.aliases.forEach(alias => {
        const aliasMatch = fuzzyMatch(alias, query);
        if (aliasMatch) {
          bestScore = Math.max(bestScore, aliasMatch.score + 30); // Bonus for alias matches
          highlights.aliases.push({
            alias,
            highlights: highlightMatches(alias, aliasMatch.indices)
          });
        }
      });
    }
    
    // Add to results if any match found
    if (bestScore > 0) {
      // Penalty for unavailable commands
      if (!isCommandAvailable(command, context)) {
        bestScore *= 0.5;
      }
      
      // Fill in missing highlights
      if (!highlights.name) {
        highlights.name = [{ text: command.name, highlighted: false }];
      }
      if (!highlights.description) {
        highlights.description = [{ text: command.description || '', highlighted: false }];
      }
      
      results.push({
        command,
        score: bestScore,
        highlights,
        available: isCommandAvailable(command, context)
      });
    }
  });
  
  // Sort by score (descending) and return top results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Create a highlighted string from highlight segments
 * @param {Array} segments - Array of {text, highlighted} objects
 * @param {Object} options - Formatting options
 * @returns {string} Formatted string with highlights
 */
export function formatHighlights(segments, options = {}) {
  const {
    highlightPrefix = '**',
    highlightSuffix = '**'
  } = options;
  
  return segments
    .map(segment => 
      segment.highlighted 
        ? `${highlightPrefix}${segment.text}${highlightSuffix}`
        : segment.text
    )
    .join('');
}

/**
 * Quick search utility for simple string arrays
 * @param {Array} items - Array of strings to search
 * @param {string} query - Search query
 * @returns {Array} Sorted array of matching items
 */
export function quickSearch(items, query) {
  if (!query) return items;
  
  const results = items
    .map(item => {
      const match = fuzzyMatch(item, query);
      return match ? { item, ...match } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
  
  return results.map(r => r.item);
}