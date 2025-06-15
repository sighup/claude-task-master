import fs from 'fs';
import path from 'path';
import { findTasksPath, findPRDPath, findConfigPath } from '../../../../src/utils/path-utils.js';
import { TASKMASTER_DIR } from '../../../../src/constants/paths.js';

/**
 * Check if a Task Master project is initialized
 * @param {string} projectRoot - The project root directory
 * @returns {Object} - Status object with initialization state
 */
export function checkProjectStatus(projectRoot) {
  const status = {
    isInitialized: false,
    hasTaskmaster: false,
    hasTasksFile: false,
    hasPRD: false,
    hasConfig: false,
    hasModels: false,
    missingApiKeys: [],
    errors: [],
    warnings: []
  };

  try {
    // Check for .taskmaster directory
    const taskmasterDir = path.join(projectRoot, TASKMASTER_DIR);
    status.hasTaskmaster = fs.existsSync(taskmasterDir);

    // Check for tasks.json
    const tasksPath = findTasksPath(null, { projectRoot });
    status.hasTasksFile = !!tasksPath && fs.existsSync(tasksPath);

    // Check for PRD
    const prdPath = findPRDPath(null, { projectRoot });
    status.hasPRD = !!prdPath && fs.existsSync(prdPath);

    // Check for config
    const configPath = findConfigPath(null, { projectRoot });
    status.hasConfig = !!configPath && fs.existsSync(configPath);

    // Load config to check models and API keys
    if (status.hasConfig && configPath) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Check if models are configured
        status.hasModels = !!(config.models?.main || config.models?.research || config.models?.fallback);
        
        // Check for API keys based on configured models
        const checkApiKey = (modelId) => {
          if (!modelId) return;
          
          if (modelId.includes('claude') || modelId.includes('anthropic')) {
            if (!process.env.ANTHROPIC_API_KEY) {
              status.missingApiKeys.push('ANTHROPIC_API_KEY');
            }
          } else if (modelId.includes('gpt') || modelId.includes('openai')) {
            if (!process.env.OPENAI_API_KEY) {
              status.missingApiKeys.push('OPENAI_API_KEY');
            }
          } else if (modelId.includes('perplexity')) {
            if (!process.env.PERPLEXITY_API_KEY) {
              status.missingApiKeys.push('PERPLEXITY_API_KEY');
            }
          } else if (modelId.includes('groq')) {
            if (!process.env.GROQ_API_KEY) {
              status.missingApiKeys.push('GROQ_API_KEY');
            }
          } else if (modelId.includes('gemini') || modelId.includes('google')) {
            if (!process.env.GOOGLE_API_KEY) {
              status.missingApiKeys.push('GOOGLE_API_KEY');
            }
          }
        };
        
        checkApiKey(config.models?.main);
        checkApiKey(config.models?.research);
        checkApiKey(config.models?.fallback);
        
        // Remove duplicates
        status.missingApiKeys = [...new Set(status.missingApiKeys)];
      } catch (err) {
        status.warnings.push(`Failed to parse config: ${err.message}`);
      }
    }

    // Determine if project is initialized
    status.isInitialized = status.hasTaskmaster && status.hasTasksFile;

    // Add warnings for missing components
    if (!status.hasTaskmaster) {
      status.errors.push('Task Master project not initialized. Run "task-master init" to set up.');
    }
    if (status.hasTaskmaster && !status.hasTasksFile) {
      status.warnings.push('No tasks.json file found. Create tasks or parse a PRD.');
    }
    if (status.hasTaskmaster && !status.hasPRD) {
      status.warnings.push('No PRD document found. Add a PRD.md or PRD.txt file to .taskmaster/docs/');
    }
    if (status.hasTaskmaster && !status.hasConfig) {
      status.warnings.push('No configuration file found. Models may not be set up.');
    }
    if (status.hasConfig && !status.hasModels) {
      status.warnings.push('No AI models configured. Run model setup to configure.');
    }
    if (status.missingApiKeys.length > 0) {
      status.warnings.push(`Missing API keys: ${status.missingApiKeys.join(', ')}`);
    }

  } catch (err) {
    status.errors.push(`Failed to check project status: ${err.message}`);
  }

  return status;
}

/**
 * Get onboarding steps based on project status
 * @param {Object} status - Project status from checkProjectStatus
 * @returns {Array} - Array of onboarding steps needed
 */
export function getOnboardingSteps(status) {
  const steps = [];

  if (!status.hasTaskmaster) {
    steps.push({
      id: 'init',
      title: 'Initialize Project',
      description: 'Set up Task Master directory structure',
      command: 'init',
      required: true
    });
  }

  if (!status.hasModels || status.missingApiKeys.length > 0) {
    steps.push({
      id: 'models',
      title: 'Configure AI Models',
      description: 'Set up AI models and verify API keys',
      command: 'models',
      required: true
    });
  }

  if (!status.hasPRD) {
    steps.push({
      id: 'prd',
      title: 'Create PRD Document',
      description: 'Add a PRD.md or PRD.txt file to .taskmaster/docs/',
      command: null,
      required: false,
      manual: true
    });
  }

  if (!status.hasTasksFile && status.hasPRD) {
    steps.push({
      id: 'parse-prd',
      title: 'Parse PRD to Generate Tasks',
      description: 'Generate initial tasks from your PRD document',
      command: 'parse-prd',
      required: false
    });
  }

  return steps;
}