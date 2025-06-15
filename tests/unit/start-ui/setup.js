/**
 * Ink UI Test Setup
 * Common utilities and mocks for testing Ink components
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Mock file system for consistent testing
export const mockTasksData = {
	tasks: [
		{
			id: 1,
			title: 'Test Task 1',
			description: 'First test task',
			status: 'pending',
			priority: 'high',
			dependencies: [],
			subtasks: [
				{
					id: 1,
					title: 'Subtask 1',
					status: 'done',
					dependencies: []
				}
			]
		},
		{
			id: 2,
			title: 'Test Task 2',
			description: 'Second test task',
			status: 'in-progress',
			priority: 'medium',
			dependencies: [1],
			subtasks: []
		},
		{
			id: 3,
			title: 'Test Task 3',
			description: 'Third test task',
			status: 'done',
			priority: 'low',
			dependencies: [],
			subtasks: []
		}
	],
	metadata: {
		version: '1.0.0',
		lastUpdated: '2024-01-01T00:00:00Z'
	}
};

// Mock project root for testing
export const mockProjectRoot = '/test/project';

// Mock utils functions
export const mockUtils = {
	findProjectRoot: jest.fn(() => mockProjectRoot),
	readJSON: jest.fn(() => Promise.resolve(mockTasksData)),
	writeJSON: jest.fn(() => Promise.resolve()),
	log: jest.fn()
};

// Mock task manager functions
export const mockTaskManager = {
	listTasks: jest.fn(() => Promise.resolve(mockTasksData.tasks)),
	setTaskStatus: jest.fn(() => Promise.resolve(true)),
	findTaskById: jest.fn((id) =>
		Promise.resolve(mockTasksData.tasks.find((t) => t.id === parseInt(id)))
	),
	findNextTask: jest.fn(() =>
		Promise.resolve(mockTasksData.tasks.find((t) => t.status === 'pending'))
	),
	taskExists: jest.fn(() => Promise.resolve(true))
};

// Mock fs for file watching
export const mockFs = {
	existsSync: jest.fn(() => true),
	statSync: jest.fn(() => ({ mtime: new Date() })),
	readFileSync: jest.fn(() => JSON.stringify(mockTasksData))
};

// Setup function to reset all mocks
export function setupMocks() {
	jest.clearAllMocks();

	// Reset mock implementations
	mockUtils.findProjectRoot.mockReturnValue(mockProjectRoot);
	mockUtils.readJSON.mockResolvedValue(mockTasksData);
	mockTaskManager.listTasks.mockResolvedValue(mockTasksData.tasks);
	mockFs.existsSync.mockReturnValue(true);
	mockFs.statSync.mockReturnValue({ mtime: new Date() });
}

// Helper to create mock metadata
export function createMockMetadata(overrides = {}) {
	return {
		totalTasks: 3,
		pendingTasks: 1,
		completedTasks: 1,
		inProgressTasks: 1,
		lastUpdated: new Date().toISOString(),
		...overrides
	};
}

// Helper to create mock task
export function createMockTask(overrides = {}) {
	return {
		id: 1,
		title: 'Mock Task',
		description: 'Mock task description',
		status: 'pending',
		priority: 'medium',
		dependencies: [],
		subtasks: [],
		...overrides
	};
}
