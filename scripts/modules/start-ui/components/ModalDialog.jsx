import React, { useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

/**
 * ModalDialog - A reusable modal dialog component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} [props.footer] - Optional footer text
 * @param {number} [props.width=60] - Modal width
 * @param {number} [props.height] - Modal height (auto if not specified)
 * @param {Function} [props.onClose] - Callback when modal is closed
 */
const ModalDialog = ({
	isOpen,
	title,
	children,
	footer,
	width = 60,
	height,
	onClose
}) => {
	// Handle ESC key to close modal
	useInput((input, key) => {
		if (!isOpen) return;
		
		if (key.escape && onClose) {
			onClose();
		}
	});

	if (!isOpen) {
		return null;
	}

	return (
		<Box
			flexDirection="column"
			width="100%"
			height="100%"
			alignItems="center"
			justifyContent="center"
		>
			{/* Modal container */}
			<Box
				borderStyle="round"
				borderColor="cyan"
				width={width}
				height={height}
				flexDirection="column"
				paddingX={2}
				paddingY={1}
			>
				{/* Title bar */}
				<Box
					borderStyle="single"
					borderBottom
					borderTop={false}
					borderLeft={false}
					borderRight={false}
					marginBottom={1}
					paddingBottom={1}
				>
					<Text bold color="cyan">
						{title}
					</Text>
				</Box>

				{/* Content area */}
				<Box flexGrow={1} flexDirection="column">
					{children}
				</Box>

				{/* Footer */}
				{footer && (
					<Box
						borderStyle="single"
						borderTop
						borderBottom={false}
						borderLeft={false}
						borderRight={false}
						marginTop={1}
						paddingTop={1}
					>
						<Text color="gray">{footer}</Text>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default ModalDialog;