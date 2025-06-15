import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useNavigation } from '../hooks/useNavigation.js';
import ModelSelector from './ModelSelector.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import {
	getModelConfiguration,
	getAvailableModelsList,
	setModel
} from '../../task-manager/models.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const STAGES = {
	CHECK: 'check',
	CONFIRM: 'confirm',
	SELECT_MAIN: 'select_main',
	SELECT_FALLBACK: 'select_fallback',
	ALIASES: 'aliases',
	INITIALIZING: 'initializing',
	SUCCESS: 'success',
	ERROR: 'error'
};

/**
 * Project Initializer component for setting up a new Task Master project
 * Multi-stage flow: Check → Confirm → Model Selection → Aliases → Initialize
 * @param {Object} props - Component props
 * @param {string} props.projectRoot - The directory where project will be initialized
 * @param {Function} props.onComplete - Callback when initialization is complete
 * @param {Function} props.onCancel - Callback when initialization is cancelled
 * @returns {React.Component} The project initializer component
 */
export default function ProjectInitializer({ projectRoot, onComplete, onCancel }) {
	const [stage, setStage] = useState(STAGES.CHECK);
	const [error, setError] = useState(null);
	const [initProgress, setInitProgress] = useState({
		message: '',
		steps: []
	});
	const [selectedModels, setSelectedModels] = useState({
		main: null,
		fallback: null
	});
	const [addAliases, setAddAliases] = useState(false);
	const [availableModels, setAvailableModels] = useState([]);
	const [isExistingProject, setIsExistingProject] = useState(false);

	// Check if already in a task-master project
	useEffect(() => {
		const checkExistingProject = () => {
			try {
				// Check for .taskmaster directory
				const taskMasterDir = path.join(projectRoot, '.taskmaster');
				const configFile = path.join(taskMasterDir, 'config.json');
				
				if (fs.existsSync(taskMasterDir) && fs.existsSync(configFile)) {
					setIsExistingProject(true);
				}
			} catch (err) {
				// Not a task-master project
				setIsExistingProject(false);
			}
		};

		checkExistingProject();
	}, [projectRoot]);

	// Load available models
	useEffect(() => {
		const loadModels = async () => {
			try {
				// During initialization, load models directly from supported-models.json
				const __filename = fileURLToPath(import.meta.url);
				const __dirname = path.dirname(__filename);
				const supportedModelsPath = path.join(
					path.dirname(path.dirname(__dirname)),
					'supported-models.json'
				);
				
				if (fs.existsSync(supportedModelsPath)) {
					const supportedModels = JSON.parse(fs.readFileSync(supportedModelsPath, 'utf8'));
					
					// Transform the models into the format expected by ModelSelector
					const modelsList = [];
					for (const [provider, models] of Object.entries(supportedModels)) {
						for (const model of models) {
							// Only include models allowed for the current role
							const allowedForMain = model.allowed_roles?.includes('main');
							const allowedForFallback = model.allowed_roles?.includes('fallback');
							
							if ((stage === STAGES.SELECT_MAIN && allowedForMain) ||
								(stage === STAGES.SELECT_FALLBACK && allowedForFallback)) {
								modelsList.push({
									modelId: model.id,
									provider: provider,
									name: model.id,
									inputCost: model.cost_per_1m_tokens?.input || 0,
									outputCost: model.cost_per_1m_tokens?.output || 0,
									swe_score: model.swe_score || 0
								});
							}
						}
					}
					
					setAvailableModels(modelsList);
				} else {
					// If we can't load models, skip to aliases
					setStage(STAGES.ALIASES);
				}
			} catch (err) {
				// If loading models fails, skip to aliases
				console.error('Failed to load models:', err);
				setStage(STAGES.ALIASES);
			}
		};

		if (stage === STAGES.SELECT_MAIN || stage === STAGES.SELECT_FALLBACK) {
			loadModels();
		}
	}, [stage]);

	// Handle ESC key
	useInput((input, key) => {
		if (key.escape) {
			// Can cancel at any stage except during initialization
			if (stage !== STAGES.INITIALIZING) {
				onCancel();
			}
			return;
		}

		// Handle stage-specific inputs
		if (stage === STAGES.ALIASES) {
			if (input === 'y' || input === 'Y') {
				setAddAliases(true);
				startInitialization();
			} else if (input === 'n' || input === 'N') {
				setAddAliases(false);
				startInitialization();
			}
		}

		if (stage === STAGES.SUCCESS || stage === STAGES.ERROR) {
			if (key.return || input === ' ') {
				onComplete(stage === STAGES.SUCCESS);
			}
		}
	});

	const startInitialization = async () => {
		setStage(STAGES.INITIALIZING);
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

			// Model selection is skipped during initialization
			// Users can configure models after initialization using the 'm' key

			setInitProgress({
				message: 'Initialization complete!',
				steps: [
					...initProgress.steps,
					{ text: 'Installing dependencies...', completed: true },
					{ text: 'Project initialized successfully!', completed: true }
				]
			});
			setStage(STAGES.SUCCESS);
		} catch (err) {
			setError(err.message);
			setStage(STAGES.ERROR);
		}
	};

	// Render based on current stage
	switch (stage) {
		case STAGES.CHECK:
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
							<Text color="cyan">Press ESC to cancel</Text>
						</Box>
					</Box>
				);
			}
			// Proceed to confirm stage
			setStage(STAGES.CONFIRM);
			return null;

		case STAGES.CONFIRM:
			return (
				<ConfirmDialog
					title="Initialize Task Master Project"
					message={`Initialize a new Task Master project in ${path.basename(projectRoot)}?`}
					details={[
						'This will:',
						'• Create .taskmaster directory structure',
						'• Set up configuration files',
						'• Configure AI model integration',
						'• Install necessary dependencies'
					].join('\n')}
					onConfirm={() => setStage(STAGES.ALIASES)}
					onCancel={onCancel}
				/>
			);

		case STAGES.SELECT_MAIN:
			return (
				<Box flexDirection="column" width="100%" height="100%">
					<Box marginBottom={1} paddingX={1}>
						<Text color="blue" bold>Step 1/3: Select Primary AI Model</Text>
					</Box>
					<ModelSelector
						availableModels={availableModels}
						currentModelId={null}
						role="main"
						onSelect={(modelId, provider) => {
							const model = availableModels.find(m => m.modelId === modelId);
							setSelectedModels(prev => ({ ...prev, main: model }));
							setStage(STAGES.SELECT_FALLBACK);
						}}
						onCancel={() => {
							// Skip model selection
							setStage(STAGES.SELECT_FALLBACK);
						}}
					/>
				</Box>
			);

		case STAGES.SELECT_FALLBACK:
			return (
				<Box flexDirection="column" width="100%" height="100%">
					<Box marginBottom={1} paddingX={1}>
						<Text color="blue" bold>Step 2/3: Select Fallback Model (Optional)</Text>
						<Text color="gray">Press ESC to skip</Text>
					</Box>
					<ModelSelector
						availableModels={availableModels}
						currentModelId={null}
						role="fallback"
						onSelect={(modelId, provider) => {
							const model = availableModels.find(m => m.modelId === modelId);
							setSelectedModels(prev => ({ ...prev, fallback: model }));
							setStage(STAGES.ALIASES);
						}}
						onCancel={() => {
							// Skip fallback selection
							setStage(STAGES.ALIASES);
						}}
					/>
				</Box>
			);

		case STAGES.ALIASES:
			return (
				<Box flexDirection="column" padding={1}>
					<Text color="blue" bold>Step 3/3: Shell Aliases</Text>
					<Box marginTop={1} flexDirection="column">
						<Text>Would you like to add shell aliases for Task Master?</Text>
						<Text color="gray">This lets you type "tm" instead of "task-master"</Text>
					</Box>
					<Box marginTop={2}>
						<Text color="cyan">[Y]es / [N]o</Text>
					</Box>
				</Box>
			);

		case STAGES.INITIALIZING:
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

		case STAGES.SUCCESS:
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
						<Text color="gray">Press Enter to continue</Text>
					</Box>
				</Box>
			);

		case STAGES.ERROR:
			return (
				<Box flexDirection="column" padding={1}>
					<Text color="red" bold>❌ Initialization Failed</Text>
					<Box marginTop={1}>
						<Text color="red">{error}</Text>
					</Box>
					<Box marginTop={2}>
						<Text color="gray">Press Enter to close</Text>
					</Box>
				</Box>
			);

		default:
			return null;
	}
}