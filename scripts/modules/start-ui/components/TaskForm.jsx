import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ProgressLoaders } from './ProgressLoader.jsx';

const PRIORITIES = ['high', 'medium', 'low'];
const MODES = ['ai', 'manual'];
const MODE_LABELS = {
	ai: 'AI-Powered (Describe task)',
	manual: 'Manual Entry (Fill fields)'
};

// Define all form fields for navigation
const AI_FORM_FIELDS = ['prompt', 'dependencies', 'priority', 'research'];
const MANUAL_FORM_FIELDS = ['title', 'description', 'details', 'testStrategy', 'dependencies', 'priority'];

/**
 * Task form component for creating and editing tasks
 * Matches the CLI's add-task capabilities
 * @param {Object} props - Component props
 * @param {Object} props.initialValues - Initial form values for editing
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Function} props.onCancel - Callback when form is cancelled
 * @param {boolean} props.isEdit - Whether this is edit mode
 * @returns {React.Component} The task form component
 */
export default function TaskForm({ 
	initialValues = {}, 
	onSubmit, 
	onCancel,
	isEdit = false,
	simplified = false,
	loading = false
}) {
	// Determine initial mode based on whether we have manual data
	const hasManualData = initialValues.title && initialValues.description && !initialValues.prompt;
	const [mode, setMode] = useState(hasManualData ? 'manual' : 'ai');
	const [currentField, setCurrentField] = useState(0);
	const [values, setValues] = useState({
		// AI mode fields
		prompt: initialValues.prompt || '',
		// Manual mode fields
		title: initialValues.title || '',
		description: initialValues.description || '',
		details: initialValues.details || '',
		testStrategy: initialValues.testStrategy || '',
		// Common fields
		priority: initialValues.priority || 'medium',
		dependencies: initialValues.dependencies?.join(', ') || '',
		research: initialValues.research || false
	});
	const [errors, setErrors] = useState({});
	const [priorityIndex, setPriorityIndex] = useState(
		PRIORITIES.indexOf(values.priority)
	);
	const [modeIndex, setModeIndex] = useState(
		MODES.indexOf(mode)
	);

	// Get current form fields based on mode
	const FORM_FIELDS = mode === 'ai' ? AI_FORM_FIELDS : MANUAL_FORM_FIELDS;

	// Update priority when index changes
	useEffect(() => {
		setValues(prev => ({
			...prev,
			priority: PRIORITIES[priorityIndex]
		}));
	}, [priorityIndex]);

	// Update mode when index changes
	useEffect(() => {
		setMode(MODES[modeIndex]);
	}, [modeIndex]);

	const validateForm = () => {
		const newErrors = {};
		
		if (mode === 'ai') {
			if (!values.prompt.trim()) {
				newErrors.prompt = 'Task description is required';
			}
		} else {
			// Manual mode validation
			if (!values.title.trim()) {
				newErrors.title = 'Task title is required';
			}
			if (!values.description.trim()) {
				newErrors.description = 'Task description is required';
			}
		}
		
		// Parse and validate dependencies
		if (values.dependencies) {
			const deps = values.dependencies.split(',').map(d => d.trim());
			const invalidDeps = deps.filter(d => d && isNaN(parseInt(d)));
			if (invalidDeps.length > 0) {
				newErrors.dependencies = 'Dependencies must be comma-separated task IDs';
			}
		}
		
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (validateForm()) {
			const dependencies = values.dependencies
				? values.dependencies.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
				: [];
			
			const submitData = {
				priority: values.priority,
				dependencies
			};

			if (mode === 'ai') {
				// AI mode submission
				submitData.prompt = values.prompt.trim();
				submitData.research = values.research;
			} else {
				// Manual mode submission
				submitData.title = values.title.trim();
				submitData.description = values.description.trim();
				submitData.details = values.details.trim();
				submitData.testStrategy = values.testStrategy.trim();
			}

			onSubmit(submitData);
		}
	};

	const handleFieldChange = (field, value) => {
		setValues(prev => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: null }));
		}
	};

	useInput((input, key) => {
		if (key.escape) {
			onCancel();
			return;
		}

		// Simplified mode - just handle text input and submit on Enter
		if (simplified) {
			if (key.return) {
				handleSubmit();
			} else if (key.backspace || key.delete) {
				handleFieldChange('prompt', values.prompt.slice(0, -1));
			} else if (input && !key.ctrl && !key.meta) {
				handleFieldChange('prompt', values.prompt + input);
			}
			return;
		}

		// Mode selection (only when not editing)
		if (!isEdit && currentField === 0) {
			if (key.leftArrow) {
				setModeIndex(prev => Math.max(0, prev - 1));
			} else if (key.rightArrow) {
				setModeIndex(prev => Math.min(MODES.length - 1, prev + 1));
			} else if (key.return || key.tab || key.downArrow) {
				// Move to next field
				setCurrentField(1);
			}
			return;
		}

		// Adjust field index for mode selection when not editing
		const fieldOffset = isEdit ? 0 : 1;
		const actualFieldIndex = currentField - fieldOffset;

		if (key.tab || key.downArrow) {
			// Move to next field (+1 for mode selector if not editing, +1 for submit button)
			const totalFields = FORM_FIELDS.length + fieldOffset + 1;
			setCurrentField((prev) => (prev + 1) % totalFields);
			return;
		}

		if (key.upArrow) {
			// Move to previous field
			const totalFields = FORM_FIELDS.length + fieldOffset + 1;
			setCurrentField((prev) => 
				prev === 0 ? totalFields - 1 : prev - 1
			);
			return;
		}

		// Handle priority selection with left/right arrows
		const priorityFieldIndex = FORM_FIELDS.indexOf('priority') + fieldOffset;
		if (currentField === priorityFieldIndex && (key.leftArrow || key.rightArrow)) {
			if (key.leftArrow) {
				setPriorityIndex(prev => Math.max(0, prev - 1));
			} else {
				setPriorityIndex(prev => Math.min(PRIORITIES.length - 1, prev + 1));
			}
			return;
		}

		// Handle research toggle (AI mode only)
		const researchFieldIndex = FORM_FIELDS.indexOf('research') + fieldOffset;
		if (mode === 'ai' && currentField === researchFieldIndex && key.return) {
			handleFieldChange('research', !values.research);
			return;
		}

		// Submit on Enter when on submit button
		const submitButtonIndex = FORM_FIELDS.length + fieldOffset;
		if (key.return && currentField === submitButtonIndex) {
			handleSubmit();
			return;
		}

		// Handle text input for text fields
		if (actualFieldIndex >= 0 && actualFieldIndex < FORM_FIELDS.length) {
			const fieldName = FORM_FIELDS[actualFieldIndex];
			
			// Skip input for non-text fields
			if (fieldName === 'priority' || fieldName === 'research') {
				return;
			}
			
			if (key.backspace || key.delete) {
				handleFieldChange(fieldName, values[fieldName].slice(0, -1));
			} else if (key.return) {
				// Move to next field on Enter
				const totalFields = FORM_FIELDS.length + fieldOffset + 1;
				setCurrentField((prev) => (prev + 1) % totalFields);
			} else if (input && !key.ctrl && !key.meta) {
				handleFieldChange(fieldName, values[fieldName] + input);
			}
		}
	});

	const renderField = (fieldIndex, fieldName, label, helpText) => {
		const actualFieldIndex = isEdit ? fieldIndex : fieldIndex + 1;
		const isActive = currentField === actualFieldIndex;
		const value = values[fieldName];
		const error = errors[fieldName];

		return (
			<Box flexDirection="column" marginBottom={1}>
				<Box flexDirection="row">
					<Box width={30} flexShrink={0}>
						<Text color={isActive ? 'blue' : 'white'} bold={isActive}>
							{isActive ? '► ' : '  '}{label}:
						</Text>
					</Box>
					<Box flexGrow={1}>
						{fieldName === 'priority' ? (
							<Box>
								{PRIORITIES.map((p, i) => (
									<Text
										key={p}
										color={i === priorityIndex ? 'blue' : 'gray'}
										bold={i === priorityIndex}
									>
										{i === priorityIndex ? '[' : ' '}
										{p}
										{i === priorityIndex ? ']' : ' '}
										{i < PRIORITIES.length - 1 ? '  ' : ''}
									</Text>
								))}
							</Box>
						) : fieldName === 'research' ? (
							<Text color={isActive ? 'blue' : 'white'}>
								[{value ? 'X' : ' '}] Use research AI
							</Text>
						) : (
							<Text color={isActive ? 'blue' : 'white'}>
								{value || (isActive ? '|' : helpText || 'Enter text...')}
							</Text>
						)}
					</Box>
				</Box>
				{error && (
					<Box marginLeft={30}>
						<Text color="red">{error}</Text>
					</Box>
				)}
			</Box>
		);
	};

	// Simplified version - just a single text input
	if (simplified) {
		// Show loading state if creating AI task
		if (loading && mode === 'ai') {
			return (
				<ProgressLoaders.TaskCreation 
					title="Creating AI-Generated Task"
					subtitle={values.prompt ? `"${values.prompt.substring(0, 60)}${values.prompt.length > 60 ? '...' : ''}"` : undefined}
					showResearchMode={values.research}
				/>
			);
		}
		
		return (
			<Box flexDirection="column">
				<Box flexDirection="row" alignItems="center">
					<Text color={values.prompt ? 'white' : 'gray'}>
						{values.prompt || 'Describe your task...'}
					</Text>
					<Text color="cyan">{currentField === 0 ? '|' : ''}</Text>
				</Box>
				<Box marginTop={1}>
					<Text color="gray">Press Enter to submit, ESC to cancel</Text>
				</Box>
			</Box>
		);
	}

	// Loading state for AI task creation (full form)
	if (loading && mode === 'ai') {
		return (
			<ProgressLoaders.TaskCreation 
				title="Creating AI-Generated Task"
				subtitle={values.prompt ? `"${values.prompt.substring(0, 60)}${values.prompt.length > 60 ? '...' : ''}"` : undefined}
				showResearchMode={values.research}
			/>
		);
	}

	// Full form version
	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				<Text color="blue" bold>
					{isEdit ? 'Edit Task' : 'Add New Task'}
				</Text>
			</Box>

			{/* Mode selector (only for new tasks) */}
			{!isEdit && (
				<Box marginBottom={1}>
					<Box flexDirection="row">
						<Box width={30} flexShrink={0}>
							<Text color={currentField === 0 ? 'blue' : 'white'} bold={currentField === 0}>
								{currentField === 0 ? '► ' : '  '}Mode:
							</Text>
						</Box>
						<Box>
							{MODES.map((m, i) => (
								<Text
									key={m}
									color={i === modeIndex ? 'blue' : 'gray'}
									bold={i === modeIndex}
								>
									{i === modeIndex ? '[' : ' '}
									{MODE_LABELS[m]}
									{i === modeIndex ? ']' : ' '}
									{i < MODES.length - 1 ? '  ' : ''}
								</Text>
							))}
						</Box>
					</Box>
				</Box>
			)}

			{/* AI Mode Fields */}
			{mode === 'ai' && (
				<>
					{renderField(0, 'prompt', 'Task Description', 'Describe what needs to be done...')}
					{renderField(1, 'dependencies', 'Dependencies', 'e.g., 1, 2, 3')}
					{renderField(2, 'priority', 'Priority')}
					{renderField(3, 'research', 'Research Mode', 'Use research AI for better context')}
				</>
			)}

			{/* Manual Mode Fields */}
			{mode === 'manual' && (
				<>
					{renderField(0, 'title', 'Title', 'Short, descriptive title...')}
					{renderField(1, 'description', 'Description', 'One or two sentence summary...')}
					{renderField(2, 'details', 'Implementation Details', 'Technical details and approach...')}
					{renderField(3, 'testStrategy', 'Test Strategy', 'How to verify completion...')}
					{renderField(4, 'dependencies', 'Dependencies', 'e.g., 1, 2, 3')}
					{renderField(5, 'priority', 'Priority')}
				</>
			)}

			{/* Submit Button */}
			<Box marginTop={1}>
				<Text
					color={currentField === (FORM_FIELDS.length + (isEdit ? 0 : 1)) ? 'blue' : 'white'}
					bold={currentField === (FORM_FIELDS.length + (isEdit ? 0 : 1))}
				>
					{currentField === (FORM_FIELDS.length + (isEdit ? 0 : 1)) ? '► ' : '  '}
					[{isEdit ? 'Update' : 'Add'} Task]
				</Text>
			</Box>

			{/* Help text */}
			<Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
				<Text color="gray">
					{mode === 'ai' ? 
						'Tab/↑↓: Navigate | ←→: Select | Space: Toggle | Enter: Submit | ESC: Cancel' :
						'Tab/↑↓: Navigate | ←→: Select priority | Enter: Submit | ESC: Cancel'
					}
				</Text>
			</Box>
		</Box>
	);
}