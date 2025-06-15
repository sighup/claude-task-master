import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ConfirmDialog from './ConfirmDialog.jsx';
import { execSync } from 'child_process';
import {
	getMainModelId,
	getResearchModelId,
	getFallbackModelId,
	getAvailableModels,
	getMainProvider,
	getResearchProvider,
	getFallbackProvider,
	isApiKeySet,
	getMcpApiKeyStatus,
	getConfig,
	writeConfig,
	getAllProviders
} from '../../config-manager.js';

const SECTIONS = {
	MENU: 'menu',
	INIT: 'init',
	PRD: 'prd',
	MODELS: 'models'
};

const INIT_STAGES = {
	CHECK: 'check',
	CONFIRM: 'confirm',
	ALIASES: 'aliases',
	INITIALIZING: 'initializing',
	SUCCESS: 'success',
	ERROR: 'error'
};

const PRD_STAGES = {
	FILE: 'file',
	OPTIONS: 'options',
	CONFIRM: 'confirm',
	PARSING: 'parsing',
	SUCCESS: 'success',
	ERROR: 'error'
};

// Provider display names
const PROVIDER_NAMES = {
	anthropic: 'Anthropic',
	openai: 'OpenAI',
	google: 'Google',
	perplexity: 'Perplexity',
	xai: 'xAI',
	ollama: 'Ollama (Local)',
	openrouter: 'OpenRouter'
};

// Model role names
const MODEL_ROLES = {
	main: 'Main Model',
	research: 'Research Model',
	fallback: 'Fallback Model'
};

// Format cost display
function formatCost(cost) {
	if (!cost) return 'N/A';
	if (typeof cost === 'object') {
		return `$${cost.input}/$${cost.output} per 1M`;
	}
	return `$${cost} per 1M`;
}

// Group models by provider
function groupModelsByProvider(models) {
	const grouped = {};
	for (const model of models) {
		if (!grouped[model.provider]) {
			grouped[model.provider] = [];
		}
		grouped[model.provider].push(model);
	}
	return grouped;
}

/**
 * Project Setup component - Full page setup interface
 * Combines project initialization, PRD parsing, and model configuration
 */
export default function ProjectSetup({ projectRoot, onClose, onParsePrd }) {
	const [currentSection, setCurrentSection] = useState(SECTIONS.MENU);
	const [menuSelection, setMenuSelection] = useState(0);
	
	// Init state
	const [initStage, setInitStage] = useState(INIT_STAGES.CHECK);
	const [initError, setInitError] = useState(null);
	const [initProgress, setInitProgress] = useState({ message: '', steps: [] });
	const [addAliases, setAddAliases] = useState(false);
	const [isExistingProject, setIsExistingProject] = useState(false);
	
	// PRD state
	const [prdStage, setPrdStage] = useState(PRD_STAGES.FILE);
	const [inputFile, setInputFile] = useState('.taskmaster/docs/prd.txt');
	const [numTasks, setNumTasks] = useState('10');
	const [useResearch, setUseResearch] = useState(false);
	const [appendMode, setAppendMode] = useState(false);
	const [prdError, setPrdError] = useState(null);
	const [parseStatus, setParseStatus] = useState('');
	
	// Models state
	const [currentConfig, setCurrentConfig] = useState({});
	const [availableModels, setAvailableModels] = useState([]);
	const [groupedModels, setGroupedModels] = useState({});
	const [selectedProvider, setSelectedProvider] = useState(0);
	const [selectedModel, setSelectedModel] = useState(0);
	const [selectedRole, setSelectedRole] = useState(null);
	const [modelMessage, setModelMessage] = useState(null);
	const [modelMessageType, setModelMessageType] = useState('info');
	const [modelsLoading, setModelsLoading] = useState(false);
	const [apiKeyStatus, setApiKeyStatus] = useState({});
	
	// Check if project exists
	useEffect(() => {
		const checkExistingProject = () => {
			try {
				const taskMasterDir = path.join(projectRoot, '.taskmaster');
				const configFile = path.join(taskMasterDir, 'config.json');
				
				if (fs.existsSync(taskMasterDir) && fs.existsSync(configFile)) {
					setIsExistingProject(true);
				}
			} catch (err) {
				setIsExistingProject(false);
			}
		};

		checkExistingProject();
	}, [projectRoot]);
	
	// Load models when entering models section
	useEffect(() => {
		if (currentSection === SECTIONS.MODELS && availableModels.length === 0) {
			loadModelsData();
		}
	}, [currentSection]);
	
	const loadModelsData = async () => {
		try {
			setModelsLoading(true);

			// Get current model configuration
			const config = getConfig(projectRoot);
			const currentModels = {
				main: {
					provider: getMainProvider(projectRoot),
					modelId: getMainModelId(projectRoot)
				},
				research: {
					provider: getResearchProvider(projectRoot),
					modelId: getResearchModelId(projectRoot)
				},
				fallback: {
					provider: getFallbackProvider(projectRoot),
					modelId: getFallbackModelId(projectRoot)
				}
			};
			setCurrentConfig(currentModels);

			// Get available models
			const models = await getAvailableModels({ projectRoot });
			setAvailableModels(models);

			// Group models by provider
			const grouped = groupModelsByProvider(models);
			setGroupedModels(grouped);

			// Check API key status
			const providers = getAllProviders();
			const keyStatus = {};
			for (const provider of providers) {
				keyStatus[provider] = {
					cli: isApiKeySet(provider, null, projectRoot),
					mcp: getMcpApiKeyStatus(provider, projectRoot)
				};
			}
			setApiKeyStatus(keyStatus);

			setModelsLoading(false);
		} catch (err) {
			setModelMessage(`Failed to load configuration: ${err.message}`);
			setModelMessageType('error');
			setModelsLoading(false);
		}
	};
	
	// Show temporary message
	const showModelMessage = (msg, type = 'info') => {
		setModelMessage(msg);
		setModelMessageType(type);
		setTimeout(() => {
			setModelMessage(null);
		}, 3000);
	};
	
	// Handle model selection
	const selectModel = async (role) => {
		const providers = Object.keys(groupedModels);
		const currentProvider = providers[selectedProvider] || providers[0];
		const currentProviderModels = groupedModels[currentProvider] || [];
		const currentModel = currentProviderModels[selectedModel];
		
		if (!currentModel) {
			showModelMessage('No model selected', 'error');
			return;
		}

		// Check if model is allowed for this role
		if (currentModel.allowed_roles && !currentModel.allowed_roles.includes(role)) {
			showModelMessage(`This model cannot be used as ${MODEL_ROLES[role]}`, 'error');
			return;
		}

		// Check API key
		const provider = currentModel.provider;
		const keyStatus = apiKeyStatus[provider];
		if (!keyStatus?.cli && !keyStatus?.mcp) {
			showModelMessage(`API key not configured for ${PROVIDER_NAMES[provider] || provider}`, 'error');
			return;
		}

		try {
			// Update configuration
			const config = getConfig(projectRoot);
			config.models[role] = {
				provider: currentModel.provider,
				modelId: currentModel.id,
				maxTokens: currentModel.max_tokens || currentModel.maxTokens,
				temperature: config.models[role]?.temperature || 0.2
			};

			// Write updated config
			await writeConfig(config, projectRoot);

			// Update local state
			setCurrentConfig((prev) => ({
				...prev,
				[role]: {
					provider: currentModel.provider,
					modelId: currentModel.id
				}
			}));

			showModelMessage(`${MODEL_ROLES[role]} updated to ${currentModel.id}`, 'success');
			setSelectedRole(null);
		} catch (err) {
			showModelMessage(`Failed to update model: ${err.message}`, 'error');
		}
	};
	
	// Initialize project
	const startInitialization = async () => {
		setInitStage(INIT_STAGES.INITIALIZING);
		setInitProgress({ message: 'Starting initialization...', steps: [] });

		try {
			// Run the initialization using the direct function
			const { initializeProject } = await import('../../../init.js');

			// Add progress updates
			const progressSteps = [
				'Creating directory structure...',
				'Setting up configuration files...',
				'Copying template files...',
				'Configuring MCP integration...'
			];

			for (const step of progressSteps) {
				setInitProgress(prev => ({
					message: step,
					steps: [...prev.steps, { text: step, completed: false }]
				}));
				
				// Small delay to show progress
				await new Promise(resolve => setTimeout(resolve, 500));
				
				// Mark step as completed
				setInitProgress(prev => ({
					...prev,
					steps: prev.steps.map((s, i) => 
						i === prev.steps.length - 1 ? { ...s, completed: true } : s
					)
				}));
			}

			// Execute initialization
			const options = {
				aliases: addAliases,
				skipInstall: false,
				yes: true
			};

			// Change to project directory for initialization
			const originalCwd = process.cwd();
			process.chdir(projectRoot);

			try {
				await initializeProject(options);
			} finally {
				// Restore original directory
				process.chdir(originalCwd);
			}

			setInitProgress({
				message: 'Initialization complete!',
				steps: [
					...initProgress.steps,
					{ text: 'Installing dependencies...', completed: true },
					{ text: 'Project initialized successfully!', completed: true }
				]
			});
			setInitStage(INIT_STAGES.SUCCESS);
			setIsExistingProject(true);
		} catch (err) {
			setInitError(err.message);
			setInitStage(INIT_STAGES.ERROR);
		}
	};
	
	// Parse PRD
	const handleParsePrd = async () => {
		setPrdStage(PRD_STAGES.PARSING);
		setParseStatus('Reading PRD file...');
		
		try {
			const fullPath = path.isAbsolute(inputFile) ? inputFile : path.join(projectRoot, inputFile);
			const options = {
				input: fullPath,
				numTasks: parseInt(numTasks, 10),
				research: useResearch,
				append: appendMode,
				force: true
			};

			setParseStatus('Generating tasks from PRD...');
			const success = await onParsePrd(options);
			
			if (success) {
				setPrdStage(PRD_STAGES.SUCCESS);
			} else {
				setPrdError('Failed to parse PRD');
				setPrdStage(PRD_STAGES.ERROR);
			}
		} catch (err) {
			setPrdError(err.message || 'Failed to parse PRD');
			setPrdStage(PRD_STAGES.ERROR);
		}
	};

	// Handle input
	useInput((input, key) => {
		// ESC always returns to menu or exits
		if (key.escape) {
			if (currentSection === SECTIONS.MENU) {
				onClose();
			} else {
				// Return to menu from any section
				setCurrentSection(SECTIONS.MENU);
				// Reset section states
				setInitStage(INIT_STAGES.CHECK);
				setPrdStage(PRD_STAGES.FILE);
			}
			return;
		}
		
		// Menu navigation
		if (currentSection === SECTIONS.MENU) {
			if (key.upArrow && menuSelection > 0) {
				setMenuSelection(menuSelection - 1);
			} else if (key.downArrow && menuSelection < 2) {
				setMenuSelection(menuSelection + 1);
			} else if (key.return) {
				// Enter selected section
				if (menuSelection === 0) {
					setCurrentSection(SECTIONS.INIT);
				} else if (menuSelection === 1) {
					setCurrentSection(SECTIONS.PRD);
				} else if (menuSelection === 2) {
					setCurrentSection(SECTIONS.MODELS);
				}
			}
			return;
		}
		
		// Section-specific input handling
		if (currentSection === SECTIONS.INIT) {
			handleInitInput(input, key);
		} else if (currentSection === SECTIONS.PRD) {
			handlePrdInput(input, key);
		} else if (currentSection === SECTIONS.MODELS) {
			handleModelsInput(input, key);
		}
	});
	
	// Init input handler
	const handleInitInput = (input, key) => {
		if (initStage === INIT_STAGES.INITIALIZING) return;
		
		if (initStage === INIT_STAGES.CHECK && isExistingProject) {
			// Just show warning, ESC returns to menu
			return;
		}
		
		if (initStage === INIT_STAGES.ALIASES) {
			if (input === 'y' || input === 'Y') {
				setAddAliases(true);
				startInitialization();
			} else if (input === 'n' || input === 'N') {
				setAddAliases(false);
				startInitialization();
			}
		}
		
		if (initStage === INIT_STAGES.SUCCESS || initStage === INIT_STAGES.ERROR) {
			if (key.return) {
				setCurrentSection(SECTIONS.MENU);
				setInitStage(INIT_STAGES.CHECK);
			}
		}
	};
	
	// PRD input handler
	const handlePrdInput = (input, key) => {
		if (prdStage === PRD_STAGES.PARSING) return;
		
		if (prdStage === PRD_STAGES.FILE) {
			if (key.return) {
				// Validate file exists
				const fullPath = path.isAbsolute(inputFile) ? inputFile : path.join(projectRoot, inputFile);
				if (!fs.existsSync(fullPath)) {
					setPrdError(`File not found: ${fullPath}`);
					return;
				}
				setPrdError(null);
				setPrdStage(PRD_STAGES.OPTIONS);
			}
		} else if (prdStage === PRD_STAGES.OPTIONS) {
			if (key.tab) {
				// Tab through options
				if (!useResearch && !appendMode) {
					setUseResearch(true);
				} else if (useResearch && !appendMode) {
					setUseResearch(false);
					setAppendMode(true);
				} else if (!useResearch && appendMode) {
					setAppendMode(false);
				}
				return;
			}

			if (input === ' ' || key.space) {
				// Toggle current option
				if (useResearch && !appendMode) {
					setUseResearch(!useResearch);
				} else if (!useResearch && appendMode) {
					setAppendMode(!appendMode);
				}
				return;
			}

			if (key.return) {
				// Validate numTasks
				const num = parseInt(numTasks, 10);
				if (isNaN(num) || num < 1 || num > 100) {
					setPrdError('Number of tasks must be between 1 and 100');
					return;
				}
				setPrdError(null);
				setPrdStage(PRD_STAGES.CONFIRM);
			}
		} else if (prdStage === PRD_STAGES.CONFIRM) {
			if (input === 'y' || input === 'Y' || key.return) {
				handleParsePrd();
			} else if (input === 'n' || input === 'N') {
				setCurrentSection(SECTIONS.MENU);
				setPrdStage(PRD_STAGES.FILE);
			}
		} else if (prdStage === PRD_STAGES.SUCCESS || prdStage === PRD_STAGES.ERROR) {
			if (key.return) {
				setCurrentSection(SECTIONS.MENU);
				setPrdStage(PRD_STAGES.FILE);
			}
		}
	};
	
	// Models input handler
	const handleModelsInput = (input, key) => {
		// Number keys for role selection
		if (!selectedRole && ['1', '2', '3'].includes(input)) {
			const roleMap = { '1': 'main', '2': 'research', '3': 'fallback' };
			setSelectedRole(roleMap[input]);
			selectModel(roleMap[input]);
			return;
		}

		const providers = Object.keys(groupedModels);
		const currentProvider = providers[selectedProvider] || providers[0];
		const currentProviderModels = groupedModels[currentProvider] || [];

		// Navigation
		if (key.upArrow) {
			if (providers.length === 0) return;

			// If we're in the provider list
			if (selectedModel === 0 && selectedProvider > 0) {
				setSelectedProvider(selectedProvider - 1);
				setSelectedModel(0);
			} else if (selectedModel > 0) {
				setSelectedModel(selectedModel - 1);
			}
		}

		if (key.downArrow) {
			if (providers.length === 0) return;

			// Navigate within current provider's models
			if (selectedModel < currentProviderModels.length - 1) {
				setSelectedModel(selectedModel + 1);
			} else if (selectedProvider < providers.length - 1) {
				// Move to next provider
				setSelectedProvider(selectedProvider + 1);
				setSelectedModel(0);
			}
		}

		if (key.leftArrow) {
			// Move to previous provider
			if (selectedProvider > 0) {
				setSelectedProvider(selectedProvider - 1);
				setSelectedModel(0);
			}
		}

		if (key.rightArrow) {
			// Move to next provider
			if (selectedProvider < providers.length - 1) {
				setSelectedProvider(selectedProvider + 1);
				setSelectedModel(0);
			}
		}
	};
	
	// Render menu
	const renderMenu = () => {
		const menuItems = [
			{
				name: 'Initialize Project',
				description: isExistingProject ? 'Project already initialized' : 'Set up Task Master in this directory',
				enabled: !isExistingProject
			},
			{
				name: 'Parse PRD',
				description: isExistingProject ? 'Generate tasks from PRD document' : 'Initialize project first',
				enabled: isExistingProject
			},
			{
				name: 'Configure Models',
				description: isExistingProject ? 'Set up AI model preferences' : 'Initialize project first',
				enabled: isExistingProject
			}
		];
		
		return (
			<Box flexDirection="column" padding={1}>
				<Text color="white" bold marginBottom={1}>Project Setup</Text>
				<Text color="gray" marginBottom={2}>Choose an option to configure your project:</Text>
				
				<Box flexDirection="column">
					{menuItems.map((item, index) => (
						<Box key={index} marginBottom={1}>
							<Text 
								color={!item.enabled ? 'gray' : (menuSelection === index ? 'blue' : 'white')}
								backgroundColor={menuSelection === index ? '#1E3A8A' : undefined}
								dimColor={!item.enabled}
							>
								{menuSelection === index ? '▶ ' : '  '}
								{index + 1}. {item.name}
							</Text>
							<Box marginLeft={5}>
								<Text color="gray" dimColor>
									{item.description}
								</Text>
							</Box>
						</Box>
					))}
				</Box>
				
				<Box marginTop={2}>
					<Text color="gray">↑↓ Navigate • Enter Select • ESC Exit</Text>
				</Box>
			</Box>
		);
	};
	
	// Render init section
	const renderInit = () => {
		switch (initStage) {
			case INIT_STAGES.CHECK:
				if (isExistingProject) {
					return (
						<Box flexDirection="column" padding={1}>
							<Text color="yellow" bold>⚠️  Warning: Task Master Project Already Exists</Text>
							<Text color="gray" marginTop={1}>
								This directory already contains a Task Master project.
							</Text>
							<Text color="gray">
								The .taskmaster directory and configuration files are present.
							</Text>
							<Box marginTop={2}>
								<Text color="cyan">Press ESC to return to menu</Text>
							</Box>
						</Box>
					);
				}
				// Proceed to confirm stage
				setInitStage(INIT_STAGES.CONFIRM);
				return null;

			case INIT_STAGES.CONFIRM:
				return (
					<ConfirmDialog
						title="Initialize Task Master Project"
						message={`Initialize a new Task Master project in ${projectRoot}?`}
						details={[
							'This will:',
							'• Create .taskmaster directory structure',
							'• Set up configuration files',
							'• Configure AI model integration',
							'• Install necessary dependencies'
						].join('\n')}
						onConfirm={() => setInitStage(INIT_STAGES.ALIASES)}
						onCancel={() => {
							setCurrentSection(SECTIONS.MENU);
							setInitStage(INIT_STAGES.CHECK);
						}}
					/>
				);

			case INIT_STAGES.ALIASES:
				return (
					<Box flexDirection="column" padding={1}>
						<Text color="blue" bold>Shell Aliases</Text>
						<Box marginTop={1} flexDirection="column">
							<Text>Would you like to add shell aliases for Task Master?</Text>
							<Text color="gray">This lets you type "tm" instead of "task-master"</Text>
						</Box>
						<Box marginTop={2}>
							<Text color="cyan">[Y]es / [N]o</Text>
						</Box>
					</Box>
				);

			case INIT_STAGES.INITIALIZING:
				return (
					<Box flexDirection="column" padding={1}>
						<Box marginBottom={2}>
							<Text color="blue" bold>Initializing Project...</Text>
						</Box>
						<Box flexDirection="column">
							{initProgress.steps.map((step, index) => (
								<Box key={index}>
									<Text color={step.completed ? 'green' : 'yellow'}>
										{step.completed ? '✓' : '⧗'} {step.text}
									</Text>
								</Box>
							))}
							{initProgress.message && !initProgress.steps.some(s => s.text === initProgress.message) && (
								<Box marginTop={1}>
									<Text color="cyan">
										<Spinner type="dots" /> {initProgress.message}
									</Text>
								</Box>
							)}
						</Box>
					</Box>
				);

			case INIT_STAGES.SUCCESS:
				return (
					<Box flexDirection="column" padding={1}>
						<Text color="green" bold>✅ Project Initialized Successfully!</Text>
						<Box marginTop={2} flexDirection="column">
							<Text color="white" bold>Next Steps:</Text>
							<Box marginTop={1} flexDirection="column" marginLeft={2}>
								<Text>1. Add API keys to .env file</Text>
								<Text>2. Create a PRD document in .taskmaster/docs/prd.txt</Text>
								<Text>3. Use parse-prd to generate initial tasks</Text>
								<Text>4. Run task-master start to manage your project</Text>
							</Box>
						</Box>
						<Box marginTop={2}>
							<Text color="gray">Press Enter to return to menu</Text>
						</Box>
					</Box>
				);

			case INIT_STAGES.ERROR:
				return (
					<Box flexDirection="column" padding={1}>
						<Text color="red" bold>❌ Initialization Failed</Text>
						<Box marginTop={1}>
							<Text color="red">{initError}</Text>
						</Box>
						<Box marginTop={2}>
							<Text color="gray">Press Enter to return to menu</Text>
						</Box>
					</Box>
				);
		}
	};
	
	// Render PRD section
	const renderPrd = () => {
		const defaultPrdPath = path.join(projectRoot, '.taskmaster/docs/prd.txt');
		const tasksPath = path.join(projectRoot, '.taskmaster/tasks/tasks.json');
		
		if (prdStage === PRD_STAGES.PARSING) {
			return (
				<Box flexDirection="column" padding={1}>
					<Text color="blue" bold>
						<Spinner type="dots" /> {parseStatus}
					</Text>
					{useResearch && (
						<Box marginTop={1}>
							<Text color="gray">Using research model for enhanced analysis...</Text>
						</Box>
					)}
				</Box>
			);
		}
		
		if (prdStage === PRD_STAGES.SUCCESS) {
			return (
				<Box flexDirection="column" padding={1}>
					<Text color="green" bold>✅ PRD Parsed Successfully!</Text>
					<Box marginTop={2}>
						<Text>Tasks have been generated from your PRD document.</Text>
					</Box>
					<Box marginTop={2}>
						<Text color="gray">Press Enter to return to menu</Text>
					</Box>
				</Box>
			);
		}
		
		if (prdStage === PRD_STAGES.ERROR) {
			return (
				<Box flexDirection="column" padding={1}>
					<Text color="red" bold>❌ PRD Parsing Failed</Text>
					<Box marginTop={1}>
						<Text color="red">{prdError}</Text>
					</Box>
					<Box marginTop={2}>
						<Text color="gray">Press Enter to return to menu</Text>
					</Box>
				</Box>
			);
		}
		
		return (
			<Box flexDirection="column" padding={1}>
				{prdStage === PRD_STAGES.FILE && (
					<>
						<Text color="white" bold>PRD File Path:</Text>
						<Box marginTop={1}>
							<TextInput
								value={inputFile}
								onChange={setInputFile}
								placeholder={defaultPrdPath}
							/>
						</Box>
						<Box marginTop={1}>
							<Text color="gray" dimColor>
								Enter path relative to project root or absolute path
							</Text>
						</Box>
						{prdError && (
							<Box marginTop={1}>
								<Text color="red">{prdError}</Text>
							</Box>
						)}
						<Box marginTop={1}>
							<Text color="gray" dimColor>
								Enter: Continue | ESC: Return to menu
							</Text>
						</Box>
					</>
				)}

				{prdStage === PRD_STAGES.OPTIONS && (
					<>
						<Box marginBottom={1}>
							<Text color="green">✓ File: {inputFile}</Text>
						</Box>

						<Text color="white" bold>Number of tasks to generate:</Text>
						<Box marginTop={1}>
							<TextInput
								value={numTasks}
								onChange={setNumTasks}
								placeholder="10"
							/>
						</Box>

						<Box marginTop={1} flexDirection="column">
							<Text color="white" bold>Options:</Text>
							<Box marginLeft={2} marginTop={1}>
								<Text color={useResearch ? 'green' : 'gray'}>
									[{useResearch ? '✓' : ' '}] Use research model for enhanced analysis
								</Text>
							</Box>
							<Box marginLeft={2}>
								<Text color={appendMode ? 'green' : 'gray'}>
									[{appendMode ? '✓' : ' '}] Append to existing tasks (don't overwrite)
								</Text>
							</Box>
						</Box>

						{prdError && (
							<Box marginTop={1}>
								<Text color="red">{prdError}</Text>
							</Box>
						)}

						<Box marginTop={1}>
							<Text color="gray" dimColor>
								Tab: Navigate options | Space: Toggle | Enter: Continue | ESC: Return to menu
							</Text>
						</Box>
					</>
				)}

				{prdStage === PRD_STAGES.CONFIRM && (
					<>
						<Box flexDirection="column" marginBottom={1}>
							<Text color="white" bold>Parse PRD Summary:</Text>
							<Box marginLeft={2} marginTop={1} flexDirection="column">
								<Text color="gray">File: <Text color="cyan">{inputFile}</Text></Text>
								<Text color="gray">Tasks to generate: <Text color="cyan">{numTasks}</Text></Text>
								<Text color="gray">Research mode: <Text color={useResearch ? 'green' : 'gray'}>{useResearch ? 'Yes' : 'No'}</Text></Text>
								<Text color="gray">Append mode: <Text color={appendMode ? 'green' : 'gray'}>{appendMode ? 'Yes' : 'No'}</Text></Text>
							</Box>
						</Box>

						{!appendMode && fs.existsSync(tasksPath) && (
							<Box marginBottom={1}>
								<Text color="yellow">⚠️  This will overwrite existing tasks.json!</Text>
							</Box>
						)}

						<Box>
							<Text color="white">Generate tasks from PRD? </Text>
							<Text color="gray">[Y/n] </Text>
						</Box>

						{prdError && (
							<Box marginTop={1}>
								<Text color="red">{prdError}</Text>
							</Box>
						)}

						<Box marginTop={1}>
							<Text color="gray" dimColor>
								Y/Enter: Confirm | N/ESC: Cancel
							</Text>
						</Box>
					</>
				)}
			</Box>
		);
	};
	
	// Render models section
	const renderModels = () => {
		if (modelsLoading) {
			return (
				<Box flexDirection="column" padding={1}>
					<Text color="yellow">Loading model configuration...</Text>
				</Box>
			);
		}
		
		const providers = Object.keys(groupedModels);
		const currentProvider = providers[selectedProvider] || providers[0];
		const currentProviderModels = groupedModels[currentProvider] || [];
		const currentModel = currentProviderModels[selectedModel];
		
		return (
			<Box flexDirection="column" width="100%" height="100%">
				{/* Header */}
				<Box paddingX={1} marginBottom={1}>
					<Text bold color="white">
						Model Configuration
					</Text>
				</Box>

				{/* Current Configuration */}
				<Box flexDirection="column" paddingX={1} marginBottom={1}>
					<Text bold color="cyan">
						Current Configuration:
					</Text>
					<Box flexDirection="column" paddingLeft={2}>
						<Text color="white">
							1. Main Model:{' '}
							<Text color="green">
								{currentConfig.main?.modelId || 'Not set'} (
								{currentConfig.main?.provider || 'N/A'})
							</Text>
						</Text>
						<Text color="white">
							2. Research Model:{' '}
							<Text color="green">
								{currentConfig.research?.modelId || 'Not set'} (
								{currentConfig.research?.provider || 'N/A'})
							</Text>
						</Text>
						<Text color="white">
							3. Fallback Model:{' '}
							<Text color="green">
								{currentConfig.fallback?.modelId || 'Not set'} (
								{currentConfig.fallback?.provider || 'N/A'})
							</Text>
						</Text>
					</Box>
				</Box>

				{/* Available Models */}
				<Box flexDirection="column" paddingX={1} flexGrow={1}>
					<Text bold color="cyan" marginBottom={1}>
						Available Models:
					</Text>

					{providers.length === 0 ? (
						<Text color="gray">No models available</Text>
					) : (
						<Box flexDirection="column">
							{providers.map((provider, providerIndex) => {
								const models = groupedModels[provider];
								const isSelectedProvider = providerIndex === selectedProvider;

								return (
									<Box key={provider} flexDirection="column" marginBottom={1}>
										<Text
											bold
											color={isSelectedProvider ? 'yellow' : 'white'}
											backgroundColor={isSelectedProvider ? '#333' : undefined}
										>
											{PROVIDER_NAMES[provider] || provider} (
											{models.length} models)
											{apiKeyStatus[provider]?.cli || apiKeyStatus[provider]?.mcp
												? ' ✓'
												: ' ⚠️  No API Key'}
										</Text>

										{isSelectedProvider && (
											<Box flexDirection="column" paddingLeft={2}>
												{models.map((model, modelIndex) => {
													const isSelected =
														isSelectedProvider && modelIndex === selectedModel;
													const roles = model.allowed_roles || ['main', 'fallback'];

													return (
														<Box
															key={model.id}
															flexDirection="column"
															backgroundColor={isSelected ? '#3B82F6' : undefined}
															paddingX={1}
														>
															<Text color={isSelected ? 'white' : 'gray'}>
																{model.id}
																{model.swe_score > 0 && ` (SWE: ${model.swe_score})`}
															</Text>
															{isSelected && (
																<Box flexDirection="column" paddingLeft={2}>
																	<Text color="white" dimColor>
																		Cost: {formatCost(model.cost_per_1m_tokens)}
																	</Text>
																	<Text color="white" dimColor>
																		Roles: {roles.join(', ')}
																	</Text>
																	{model.max_tokens && (
																		<Text color="white" dimColor>
																			Max Tokens: {model.max_tokens.toLocaleString()}
																		</Text>
																	)}
																</Box>
															)}
														</Box>
													);
												})}
											</Box>
										)}
									</Box>
								);
							})}
						</Box>
					)}
				</Box>

				{/* Instructions */}
				<Box paddingX={1} paddingTop={1} borderStyle="single" borderColor="gray">
					<Text color="gray">
						↑↓ Navigate models • ←→ Switch providers • 1/2/3 Set model role • ESC Return to menu
					</Text>
				</Box>

				{/* Message */}
				{modelMessage && (
					<Box
						position="absolute"
						bottom={2}
						left={2}
						right={2}
						justifyContent="center"
						paddingX={1}
						paddingY={1}
						backgroundColor={
							modelMessageType === 'error'
								? '#EF4444'
								: modelMessageType === 'success'
									? '#10B981'
									: '#3B82F6'
						}
					>
						<Text color="white" bold>
							{modelMessage}
						</Text>
					</Box>
				)}
			</Box>
		);
	};
	
	// Main render
	if (currentSection === SECTIONS.MENU) {
		return renderMenu();
	} else if (currentSection === SECTIONS.INIT) {
		return renderInit();
	} else if (currentSection === SECTIONS.PRD) {
		return renderPrd();
	} else if (currentSection === SECTIONS.MODELS) {
		return renderModels();
	}
	
	return null;
}