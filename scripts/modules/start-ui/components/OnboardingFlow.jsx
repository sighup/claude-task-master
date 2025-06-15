import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { checkProjectStatus, getOnboardingSteps } from '../utils/projectChecks.js';
import ProjectInitializer from './ProjectInitializer.jsx';
import { ModelManager } from './ModelManager.jsx';
import PrdParser from './PrdParser.jsx';
import ModalDialog from './ModalDialog.jsx';
import { LoadingSpinner } from './ProgressIndicator.jsx';

/**
 * Onboarding flow component for new users
 * Guides through project initialization, model setup, and PRD parsing
 */
export function OnboardingFlow({ projectRoot, onComplete, onSkip, parsePrd }) {
  const [loading, setLoading] = useState(true);
  const [projectStatus, setProjectStatus] = useState(null);
  const [onboardingSteps, setOnboardingSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showInitializer, setShowInitializer] = useState(false);
  const [showModelManager, setShowModelManager] = useState(false);
  const [showPrdParser, setShowPrdParser] = useState(false);
  const [showPrdInstructions, setShowPrdInstructions] = useState(false);
  const [error, setError] = useState(null);

  // Check project status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        const status = checkProjectStatus(projectRoot);
        setProjectStatus(status);
        
        const steps = getOnboardingSteps(status);
        setOnboardingSteps(steps);
        
        // If no steps needed, complete onboarding
        if (steps.length === 0) {
          onComplete();
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    checkStatus();
  }, [projectRoot]);

  // Handle step progression
  const moveToNextStep = async () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      executeCurrentStep();
    } else {
      // All steps complete
      onComplete();
    }
  };

  // Execute the current step
  const executeCurrentStep = () => {
    const step = onboardingSteps[currentStep];
    if (!step) return;

    switch (step.id) {
      case 'init':
        setShowInitializer(true);
        break;
      case 'models':
        setShowModelManager(true);
        break;
      case 'prd':
        setShowPrdInstructions(true);
        break;
      case 'parse-prd':
        setShowPrdParser(true);
        break;
    }
  };

  // Start onboarding when steps are loaded
  useEffect(() => {
    if (onboardingSteps.length > 0 && !loading) {
      executeCurrentStep();
    }
  }, [onboardingSteps, loading]);

  useInput((input, key) => {
    if (key.escape) {
      onSkip();
    }
  });

  if (loading) {
    return (
      <ModalDialog
        isOpen={true}
        title="Task Master Setup"
        width={50}
        height={12}
      >
        <Box flexDirection="column" alignItems="center" justifyContent="center" padding={2}>
          <LoadingSpinner />
          <Text color="gray" marginTop={1}>Checking project status...</Text>
        </Box>
      </ModalDialog>
    );
  }

  if (error) {
    return (
      <ModalDialog
        isOpen={true}
        title="Setup Error"
        width={60}
        height={15}
        onClose={onSkip}
      >
        <Box flexDirection="column" padding={1}>
          <Text color="red" bold>Error checking project status:</Text>
          <Text color="red" marginTop={1}>{error}</Text>
          <Text color="gray" marginTop={2}>Press ESC to skip onboarding</Text>
        </Box>
      </ModalDialog>
    );
  }

  // Show project initializer
  if (showInitializer) {
    return (
      <Box flexDirection="column" width="100%" height="100%" alignItems="center" justifyContent="center">
        <ProjectInitializer
          projectRoot={projectRoot}
          onComplete={() => {
            setShowInitializer(false);
            moveToNextStep();
          }}
          onCancel={() => {
            setShowInitializer(false);
            onSkip();
          }}
        />
      </Box>
    );
  }

  // Show model manager
  if (showModelManager) {
    return (
      <Box flexDirection="column" width="100%" height="100%" alignItems="center" justifyContent="center">
        <ModalDialog
          isOpen={true}
          title="Configure AI Models"
          width={90}
          height={35}
          onClose={() => {
            setShowModelManager(false);
            onSkip();
          }}
        >
          <ModelManager
            projectRoot={projectRoot}
            onComplete={() => {
              setShowModelManager(false);
              moveToNextStep();
            }}
            onCancel={() => {
              setShowModelManager(false);
              onSkip();
            }}
          />
        </ModalDialog>
      </Box>
    );
  }

  // Show PRD instructions
  if (showPrdInstructions) {
    return (
      <ModalDialog
        isOpen={true}
        title="Create a PRD Document"
        width={80}
        height={20}
        onClose={() => {
          setShowPrdInstructions(false);
          moveToNextStep();
        }}
      >
        <Box flexDirection="column" padding={1}>
          <Text bold marginBottom={1}>Create Your Project Requirements</Text>
          
          <Text marginBottom={1}>
            Task Master can automatically generate tasks from a project description.
          </Text>
          
          <Text bold marginBottom={1}>
            Create a file named:
          </Text>
          
          <Box marginLeft={2} marginBottom={1}>
            <Text color="cyan">prd.txt</Text>
          </Box>
          
          <Text marginBottom={1}>
            In this location:
          </Text>
          
          <Box marginLeft={2} marginBottom={1}>
            <Text color="cyan">.taskmaster/docs/</Text>
          </Box>
          
          <Text marginBottom={1}>
            Write a simple description of what you want to build. Include:
          </Text>
          
          <Box marginLeft={2} marginBottom={1} flexDirection="column">
            <Text color="gray">• What the project does</Text>
            <Text color="gray">• Key features you want</Text>
            <Text color="gray">• Any technical requirements</Text>
          </Box>
          
          <Text color="yellow" marginTop={1}>
            Press any key once you've created the file...
          </Text>
        </Box>
      </ModalDialog>
    );
  }

  // Show PRD parser
  if (showPrdParser) {
    return (
      <ModalDialog
        isOpen={true}
        title="Parse PRD Document"
        width={80}
        height={30}
        onClose={() => {
          setShowPrdParser(false);
          onComplete(); // Still complete, as tasks can be added manually
        }}
      >
        <PrdParser
          projectRoot={projectRoot}
          onParse={async (options) => {
            // Use the parsePrd function from the parent App component
            if (parsePrd) {
              const success = await parsePrd(options);
              if (success) {
                // Wait a moment for tasks to be written before completing
                setTimeout(() => {
                  setShowPrdParser(false);
                  onComplete(); // This will trigger refreshTasks in App.jsx
                }, 1000);
              } else {
                setShowPrdParser(false);
              }
              return success;
            } else {
              setShowPrdParser(false);
              onComplete();
              return false;
            }
          }}
          onCancel={() => {
            setShowPrdParser(false);
            onComplete(); // Still complete, as tasks can be added manually
          }}
        />
      </ModalDialog>
    );
  }

  // Show onboarding status
  return (
    <ModalDialog
      isOpen={true}
      title="Task Master Setup"
      width={70}
      height={20}
      onClose={onSkip}
    >
      <Box flexDirection="column" padding={1}>
        <Text bold marginBottom={1}>Welcome to Task Master!</Text>
        
        <Text marginBottom={2}>
          Let's set up your project. The following steps are needed:
        </Text>
        
        <Box flexDirection="column" marginBottom={2}>
          {onboardingSteps.map((step, index) => (
            <Box key={step.id} marginBottom={1}>
              <Text color={index < currentStep ? 'green' : index === currentStep ? 'yellow' : 'gray'}>
                {index < currentStep ? '✓' : index === currentStep ? '▶' : '○'} {step.title}
              </Text>
              <Text color="gray" marginLeft={3}>{step.description}</Text>
            </Box>
          ))}
        </Box>
        
        <Text color="gray">
          Step {currentStep + 1} of {onboardingSteps.length}
        </Text>
        
        <Text color="gray" marginTop={1}>
          Press ESC to skip setup and continue with manual configuration
        </Text>
      </Box>
    </ModalDialog>
  );
}