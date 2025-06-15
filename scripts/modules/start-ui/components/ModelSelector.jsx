import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { useNavigation } from '../hooks/useNavigation.js';

/**
 * Model selector component for choosing AI models
 * @param {Object} props - Component props
 * @param {Array} props.availableModels - List of available models
 * @param {string} props.currentModelId - Currently selected model ID
 * @param {string} props.role - The role being configured (main/research/fallback)
 * @param {Function} props.onSelect - Callback when model is selected
 * @param {Function} props.onCancel - Callback when selection is cancelled
 * @returns {React.Component} The model selector component
 */
export default function ModelSelector({
	availableModels = [],
	currentModelId,
	role,
	onSelect,
	onCancel
}) {
	const [filterText, setFilterText] = useState('');
	const [showCustomInput, setShowCustomInput] = useState(false);
	const [customProvider, setCustomProvider] = useState('');

	// Group models by provider
	const modelsByProvider = useMemo(() => {
		const grouped = availableModels.reduce((acc, model) => {
			const provider = model.provider || 'Unknown';
			if (!acc[provider]) {
				acc[provider] = [];
			}
			acc[provider].push(model);
			return acc;
		}, {});

		// Sort providers
		const sortedProviders = Object.keys(grouped).sort();
		return sortedProviders.map(provider => ({
			provider,
			models: grouped[provider].sort((a, b) => {
				// Sort by SWE score if available, then by name
				if (a.sweScore && b.sweScore) {
					return b.sweScore - a.sweScore;
				}
				return (a.modelId || '').localeCompare(b.modelId || '');
			})
		}));
	}, [availableModels]);

	// Flatten models for navigation
	const flattenedOptions = useMemo(() => {
		const options = [];
		
		// Add special options
		options.push({ type: 'special', id: 'keep-current', label: 'Keep Current Model' });
		options.push({ type: 'special', id: 'custom-ollama', label: 'Custom Ollama Model' });
		options.push({ type: 'special', id: 'custom-openrouter', label: 'Custom OpenRouter Model' });
		options.push({ type: 'special', id: 'custom-bedrock', label: 'Custom Bedrock Model' });
		
		// Add separator
		options.push({ type: 'separator' });
		
		// Add models by provider
		modelsByProvider.forEach(({ provider, models }) => {
			options.push({ type: 'provider', provider });
			models.forEach(model => {
				const matchesFilter = !filterText || 
					model.modelId.toLowerCase().includes(filterText.toLowerCase());
				if (matchesFilter) {
					options.push({ type: 'model', model });
				}
			});
		});
		
		return options;
	}, [modelsByProvider, filterText]);

	// Filter out separators and providers for navigation
	const navigableOptions = flattenedOptions.filter(
		opt => opt.type === 'special' || opt.type === 'model'
	);

	const {
		selectedIndex,
		navigateUp,
		navigateDown,
		selectCurrent
	} = useNavigation(
		{ length: navigableOptions.length },
		{
			initialIndex: 0,
			onSelect: () => {
				const option = navigableOptions[selectedIndex];
				if (option.type === 'special') {
					handleSpecialOption(option.id);
				} else if (option.type === 'model') {
					onSelect(option.model.modelId, option.model.provider);
				}
			}
		}
	);

	const handleSpecialOption = (optionId) => {
		switch (optionId) {
			case 'keep-current':
				onCancel();
				break;
			case 'custom-ollama':
				setCustomProvider('ollama');
				setShowCustomInput(true);
				break;
			case 'custom-openrouter':
				setCustomProvider('openrouter');
				setShowCustomInput(true);
				break;
			case 'custom-bedrock':
				setCustomProvider('bedrock');
				setShowCustomInput(true);
				break;
		}
	};

	useInput((input, key) => {
		if (showCustomInput) {
			// Handle custom input mode separately
			return;
		}

		if (key.escape) {
			onCancel();
			return;
		}

		if (key.upArrow || input === 'k') {
			navigateUp();
			return;
		}

		if (key.downArrow || input === 'j') {
			navigateDown();
			return;
		}

		if (key.return) {
			selectCurrent();
			return;
		}

		// Filter handling
		if (key.backspace || key.delete) {
			setFilterText(filterText.slice(0, -1));
		} else if (input && input.match(/^[a-zA-Z0-9-_.]$/)) {
			setFilterText(filterText + input);
		}
	});

	if (showCustomInput) {
		// This would be a text input component in real implementation
		return (
			<Box flexDirection="column" padding={1}>
				<Text color="blue" bold>Enter Custom {customProvider} Model ID</Text>
				<Text color="gray">Implementation pending - Press ESC to cancel</Text>
			</Box>
		);
	}

	// Find current position in flattened list for display
	let displayIndex = 0;
	let currentNavIndex = 0;

	return (
		<Box flexDirection="column" width="100%" height="100%">
			{/* Header */}
			<Box borderStyle="single" borderColor="blue" paddingX={1} marginBottom={1}>
				<Text color="blue" bold>Select {role} Model</Text>
				{currentModelId && (
					<Text color="gray"> (Current: {currentModelId})</Text>
				)}
			</Box>

			{/* Filter */}
			{filterText && (
				<Box paddingX={1} marginBottom={1}>
					<Text color="yellow">Filter: {filterText}</Text>
				</Box>
			)}

			{/* Model List */}
			<Box flexDirection="column" paddingX={1} height={20}>
				{flattenedOptions.map((option, index) => {
					if (option.type === 'separator') {
						return (
							<Box key={`sep-${index}`} marginY={0}>
								<Text color="gray">{'─'.repeat(60)}</Text>
							</Box>
						);
					}

					if (option.type === 'provider') {
						return (
							<Box key={`provider-${option.provider}`} marginTop={1}>
								<Text color="cyan" bold>{option.provider}</Text>
							</Box>
						);
					}

					if (option.type === 'special') {
						const isSelected = currentNavIndex === selectedIndex;
						currentNavIndex++;
						return (
							<Box key={option.id}>
								<Text color={isSelected ? 'blue' : 'white'}>
									{isSelected ? '► ' : '  '}
								</Text>
								<Text color="yellow" bold={isSelected}>
									{option.label}
								</Text>
							</Box>
						);
					}

					if (option.type === 'model') {
						const isSelected = currentNavIndex === selectedIndex;
						currentNavIndex++;
						const { model } = option;
						
						return (
							<Box key={model.modelId} marginLeft={2}>
								<Text color={isSelected ? 'blue' : 'white'}>
									{isSelected ? '► ' : '  '}
								</Text>
								<Text bold={isSelected}>
									{model.modelId}
								</Text>
								{model.sweScore && (
									<Text color="green"> (SWE: {model.sweScore})</Text>
								)}
								{model.cost && (
									<Text color="gray"> ${model.cost.input || 0}/{model.cost.output || 0}</Text>
								)}
							</Box>
						);
					}
				})}
			</Box>

			{/* Footer */}
			<Box
				position="absolute"
				bottom={0}
				borderStyle="single"
				borderColor="gray"
				paddingX={1}
				width="100%"
			>
				<Text color="gray">
					↑/↓: Navigate | Enter: Select | Type to filter | ESC: Cancel
				</Text>
			</Box>
		</Box>
	);
}