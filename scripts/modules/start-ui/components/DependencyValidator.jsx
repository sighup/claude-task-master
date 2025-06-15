import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';

// Status colors matching the existing components
const STATUS_COLORS = {
	error: '#EF4444', // red
	warning: '#EAB308', // yellow
	success: '#10B981', // green
	info: '#3B82F6', // blue
	gray: '#6B7280'
};

// Issue type icons
const ISSUE_ICONS = {
	circular: '↻',
	invalid: '⚠',
	self: '↺'
};

export function DependencyValidator({
	onClose,
	onFix,
	projectRoot,
	tasksFile
}) {
	const [validationResults, setValidationResults] = useState(null);
	const [selectedIssueIndex, setSelectedIssueIndex] = useState(0);
	const [selectedIssues, setSelectedIssues] = useState(new Set());
	const [isValidating, setIsValidating] = useState(true);
	const [isFixing, setIsFixing] = useState(false);
	const [fixResults, setFixResults] = useState(null);
	const [error, setError] = useState(null);
	const { stdout } = useStdout();

	const terminalHeight = stdout?.rows || 24;
	const terminalWidth = stdout?.columns || 80;

	// Run validation on mount
	useEffect(() => {
		validateDependencies();
	}, []);

	const validateDependencies = async () => {
		setIsValidating(true);
		setError(null);
		try {
			// Call the validate-dependencies tool
			const result = await onFix('validate', {
				projectRoot,
				file: tasksFile
			});
			
			// Parse the validation results
			if (result.issues) {
				setValidationResults(result);
			} else {
				setValidationResults({
					issues: [],
					valid: true
				});
			}
		} catch (err) {
			setError(err.message || 'Failed to validate dependencies');
		} finally {
			setIsValidating(false);
		}
	};

	const fixSelectedIssues = async () => {
		setIsFixing(true);
		setError(null);
		try {
			// For fixing, we can either fix all or implement selective fixing
			// For now, we'll use the fix-dependencies tool which fixes all issues
			const result = await onFix('fix', {
				projectRoot,
				file: tasksFile,
				selectedIssues: Array.from(selectedIssues)
			});
			
			setFixResults(result);
			
			// Re-validate after fixing
			setTimeout(() => {
				validateDependencies();
				setFixResults(null);
				setSelectedIssues(new Set());
			}, 2000);
		} catch (err) {
			setError(err.message || 'Failed to fix dependencies');
		} finally {
			setIsFixing(false);
		}
	};

	useInput((input, key) => {
		// Close on ESC
		if (key.escape) {
			onClose();
			return;
		}

		// Navigation
		if (key.upArrow && validationResults?.issues?.length > 0) {
			setSelectedIssueIndex(prev => Math.max(0, prev - 1));
			return;
		}
		
		if (key.downArrow && validationResults?.issues?.length > 0) {
			setSelectedIssueIndex(prev => 
				Math.min(validationResults.issues.length - 1, prev + 1)
			);
			return;
		}

		// Toggle selection with space
		if (input === ' ' && validationResults?.issues?.length > 0) {
			const newSelected = new Set(selectedIssues);
			if (newSelected.has(selectedIssueIndex)) {
				newSelected.delete(selectedIssueIndex);
			} else {
				newSelected.add(selectedIssueIndex);
			}
			setSelectedIssues(newSelected);
			return;
		}

		// Select/deselect all
		if (input === 'a') {
			if (selectedIssues.size === validationResults?.issues?.length) {
				setSelectedIssues(new Set());
			} else {
				const allIndices = new Set(
					Array.from({ length: validationResults.issues.length }, (_, i) => i)
				);
				setSelectedIssues(allIndices);
			}
			return;
		}

		// Fix selected issues
		if (input === 'f' && selectedIssues.size > 0 && !isFixing) {
			fixSelectedIssues();
			return;
		}

		// Fix all issues
		if (input === 'F' && validationResults?.issues?.length > 0 && !isFixing) {
			// Select all and fix
			const allIndices = new Set(
				Array.from({ length: validationResults.issues.length }, (_, i) => i)
			);
			setSelectedIssues(allIndices);
			fixSelectedIssues();
			return;
		}

		// Refresh validation
		if (input === 'r' && !isValidating && !isFixing) {
			validateDependencies();
			return;
		}
	});

	// Calculate visible window for scrolling
	const HEADER_LINES = 3;
	const FOOTER_LINES = 4;
	const AVAILABLE_LINES = Math.max(5, terminalHeight - HEADER_LINES - FOOTER_LINES);

	const calculateVisibleIssues = () => {
		if (!validationResults?.issues || validationResults.issues.length === 0) {
			return { issues: [], startIndex: 0 };
		}

		const issues = validationResults.issues;
		
		// If all issues fit, show all
		if (issues.length <= AVAILABLE_LINES) {
			return { issues, startIndex: 0 };
		}

		// Calculate window to keep selected issue visible
		let startIdx = 0;
		const halfWindow = Math.floor(AVAILABLE_LINES / 2);
		startIdx = Math.max(0, selectedIssueIndex - halfWindow);
		
		// Adjust if we're near the end
		if (startIdx + AVAILABLE_LINES > issues.length) {
			startIdx = Math.max(0, issues.length - AVAILABLE_LINES);
		}

		return {
			issues: issues.slice(startIdx, startIdx + AVAILABLE_LINES),
			startIndex: startIdx
		};
	};

	const visibleData = calculateVisibleIssues();

	// Render loading state
	if (isValidating) {
		return (
			<Box flexDirection="column" width="100%" height={terminalHeight}>
				<Box borderStyle="single" borderColor="gray" paddingX={1} flexShrink={0}>
					<Text bold color="white">Dependency Validator</Text>
				</Box>
				<Box flexGrow={1} justifyContent="center" alignItems="center">
					<Text color="yellow">Validating dependencies...</Text>
				</Box>
			</Box>
		);
	}

	// Render error state
	if (error) {
		return (
			<Box flexDirection="column" width="100%" height={terminalHeight}>
				<Box borderStyle="single" borderColor="gray" paddingX={1} flexShrink={0}>
					<Text bold color="white">Dependency Validator</Text>
				</Box>
				<Box flexGrow={1} justifyContent="center" alignItems="center">
					<Text color="red">Error: {error}</Text>
				</Box>
				<Box borderStyle="single" borderColor="gray" paddingX={1} flexShrink={0}>
					<Text color="gray">ESC: Close | R: Retry validation</Text>
				</Box>
			</Box>
		);
	}

	// Render fix results
	if (fixResults) {
		return (
			<Box flexDirection="column" width="100%" height={terminalHeight}>
				<Box borderStyle="single" borderColor="gray" paddingX={1} flexShrink={0}>
					<Text bold color="white">Dependency Validator - Fix Results</Text>
				</Box>
				<Box flexGrow={1} justifyContent="center" alignItems="center" flexDirection="column">
					<Text color={STATUS_COLORS.success}>✓ Dependencies fixed successfully!</Text>
					{fixResults.message && (
						<Text color="gray">{fixResults.message}</Text>
					)}
					<Text color="yellow" marginTop={1}>Revalidating...</Text>
				</Box>
			</Box>
		);
	}

	// Render main view
	const hasIssues = validationResults?.issues?.length > 0;

	return (
		<Box flexDirection="column" width="100%" height={terminalHeight}>
			{/* Header */}
			<Box borderStyle="single" borderColor="gray" paddingX={1} flexShrink={0}>
				<Text bold color="white">Dependency Validator</Text>
				{hasIssues && (
					<Text color="gray">
						{' '}({selectedIssues.size} of {validationResults.issues.length} selected)
					</Text>
				)}
			</Box>

			{/* Content */}
			<Box flexDirection="column" flexGrow={1} overflow="hidden">
				{!hasIssues ? (
					<Box flexGrow={1} justifyContent="center" alignItems="center">
						<Text color={STATUS_COLORS.success}>
							✓ All dependencies are valid!
						</Text>
					</Box>
				) : (
					<>
						{/* Issues list */}
						<Box flexDirection="column" paddingX={1}>
							{visibleData.startIndex > 0 && (
								<Box justifyContent="center" marginBottom={1}>
									<Text color="#EAB308" dimColor>
										⬆ {visibleData.startIndex} more above ⬆
									</Text>
								</Box>
							)}
							
							{visibleData.issues.map((issue, visibleIndex) => {
								const actualIndex = visibleData.startIndex + visibleIndex;
								const isSelected = actualIndex === selectedIssueIndex;
								const isChecked = selectedIssues.has(actualIndex);
								
								return (
									<Box
										key={actualIndex}
										backgroundColor={isSelected ? '#1E40AF' : undefined}
										paddingX={1}
										marginBottom={1}
									>
										<Box flexDirection="row" alignItems="flex-start">
											{/* Checkbox */}
											<Text color={isSelected ? 'white' : 'gray'}>
												[{isChecked ? '✓' : ' '}]
											</Text>
											
											{/* Issue icon and type */}
											<Text
												color={
													issue.type === 'circular' ? STATUS_COLORS.error :
													issue.type === 'invalid' ? STATUS_COLORS.warning :
													issue.type === 'self' ? STATUS_COLORS.error :
													STATUS_COLORS.gray
												}
												marginLeft={1}
											>
												{ISSUE_ICONS[issue.type] || '?'} {issue.type}:
											</Text>
											
											{/* Issue description */}
											<Box flexGrow={1} marginLeft={1}>
												<Text color={isSelected ? 'white' : 'white'}>
													{issue.description || formatIssueDescription(issue)}
												</Text>
												
												{/* Suggested fix */}
												{issue.suggestedFix && (
													<Text color={isSelected ? '#D1D5DB' : 'gray'}>
														  → {issue.suggestedFix}
													</Text>
												)}
											</Box>
										</Box>
									</Box>
								);
							})}
							
							{visibleData.startIndex + visibleData.issues.length < validationResults.issues.length && (
								<Box justifyContent="center" marginTop={1}>
									<Text color="#EAB308" dimColor>
										⬇ {validationResults.issues.length - (visibleData.startIndex + visibleData.issues.length)} more below ⬇
									</Text>
								</Box>
							)}
						</Box>
					</>
				)}
			</Box>

			{/* Footer */}
			<Box borderStyle="single" borderColor="gray" paddingX={1} flexShrink={0}>
				<Box flexDirection="column">
					<Text color="gray">
						{hasIssues ? (
							<>
								Space: Toggle | A: Select all | F: Fix all | f: Fix selected | R: Refresh
							</>
						) : (
							'R: Refresh validation'
						)}
					</Text>
					<Text color="gray">
						ESC: Close | ↑/↓: Navigate issues
					</Text>
				</Box>
			</Box>

			{/* Status bar */}
			{isFixing && (
				<Box
					position="absolute"
					top="50%"
					left="50%"
					borderStyle="single"
					borderColor="yellow"
					paddingX={2}
					paddingY={1}
				>
					<Text color="yellow">Fixing selected issues...</Text>
				</Box>
			)}
		</Box>
	);
}

// Helper function to format issue descriptions
function formatIssueDescription(issue) {
	switch (issue.type) {
		case 'circular':
			return `Circular dependency: ${issue.chain?.join(' → ') || issue.tasks?.join(' → ')}`;
		case 'invalid':
			return `Task ${issue.taskId} depends on non-existent task ${issue.invalidDep}`;
		case 'self':
			return `Task ${issue.taskId} depends on itself`;
		default:
			return `Unknown issue with task ${issue.taskId}`;
	}
}