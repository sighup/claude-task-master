import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
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
import { log } from '../../utils.js';

// Model role names
const MODEL_ROLES = {
	main: 'Main Model',
	research: 'Research Model',
	fallback: 'Fallback Model'
};

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

// Format cost display
function formatCost(cost) {
	if (!cost) return 'N/A';
	if (typeof cost === 'object') {
		return `$${cost.input}/$${cost.output} per 1M`;
	}
	return `$${cost} per 1M`;
}

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

export function ModelManager({ projectRoot, onClose }) {
	const { exit } = useApp();
	const [currentConfig, setCurrentConfig] = useState({});
	const [availableModels, setAvailableModels] = useState([]);
	const [groupedModels, setGroupedModels] = useState({});
	const [selectedProvider, setSelectedProvider] = useState(0);
	const [selectedModel, setSelectedModel] = useState(0);
	const [selectedRole, setSelectedRole] = useState(null);
	const [message, setMessage] = useState(null);
	const [messageType, setMessageType] = useState('info');
	const [loading, setLoading] = useState(true);
	const [apiKeyStatus, setApiKeyStatus] = useState({});

	// Load current configuration and available models
	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);

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

				// Check API key status for each provider
				const providers = getAllProviders();
				const keyStatus = {};
				for (const provider of providers) {
					keyStatus[provider] = {
						cli: isApiKeySet(provider, null, projectRoot),
						mcp: getMcpApiKeyStatus(provider, projectRoot)
					};
				}
				setApiKeyStatus(keyStatus);

				setLoading(false);
			} catch (err) {
				setMessage(`Failed to load configuration: ${err.message}`);
				setMessageType('error');
				setLoading(false);
			}
		};

		loadData();
	}, [projectRoot]);

	// Get providers list
	const providers = Object.keys(groupedModels);
	const currentProvider = providers[selectedProvider] || providers[0];
	const currentProviderModels = groupedModels[currentProvider] || [];
	const currentModel = currentProviderModels[selectedModel];

	// Show temporary message
	const showMessage = useCallback((msg, type = 'info') => {
		setMessage(msg);
		setMessageType(type);
		setTimeout(() => {
			setMessage(null);
		}, 3000);
	}, []);

	// Handle model selection
	const selectModel = useCallback(
		async (role) => {
			if (!currentModel) {
				showMessage('No model selected', 'error');
				return;
			}

			// Check if model is allowed for this role
			if (
				currentModel.allowed_roles &&
				!currentModel.allowed_roles.includes(role)
			) {
				showMessage(
					`This model cannot be used as ${MODEL_ROLES[role]}`,
					'error'
				);
				return;
			}

			// Check API key
			const provider = currentModel.provider;
			const keyStatus = apiKeyStatus[provider];
			if (!keyStatus?.cli && !keyStatus?.mcp) {
				showMessage(
					`API key not configured for ${PROVIDER_NAMES[provider] || provider}`,
					'error'
				);
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

				showMessage(
					`${MODEL_ROLES[role]} updated to ${currentModel.id}`,
					'success'
				);
				setSelectedRole(null);
			} catch (err) {
				showMessage(`Failed to update model: ${err.message}`, 'error');
			}
		},
		[currentModel, apiKeyStatus, projectRoot, showMessage]
	);

	// Handle keyboard input
	useInput((input, key) => {
		if (key.escape) {
			if (onClose) {
				onClose();
			} else {
				exit();
			}
			return;
		}

		// Number keys for role selection
		if (!selectedRole && ['1', '2', '3'].includes(input)) {
			const roleMap = { '1': 'main', '2': 'research', '3': 'fallback' };
			setSelectedRole(roleMap[input]);
			selectModel(roleMap[input]);
			return;
		}

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
	});

	if (loading) {
		return (
			<Box flexDirection="column" padding={1}>
				<Text color="yellow">Loading model configuration...</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" width="100%" height="100%">
			{/* Header */}
			<Box paddingX={1} marginBottom={1}>
				<Text bold color="white">
					Model Configuration Manager
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
					↑↓ Navigate models • ←→ Switch providers • 1/2/3 Set model role • ESC
					Exit
				</Text>
			</Box>

			{/* Message */}
			{message && (
				<Box
					position="absolute"
					bottom={2}
					left={2}
					right={2}
					justifyContent="center"
					paddingX={1}
					paddingY={1}
					backgroundColor={
						messageType === 'error'
							? '#EF4444'
							: messageType === 'success'
								? '#10B981'
								: '#3B82F6'
					}
				>
					<Text color="white" bold>
						{message}
					</Text>
				</Box>
			)}
		</Box>
	);
}