export enum ProjectStatus {
  IDLE = 'IDLE',
  PLANNING_SCRIPT = 'PLANNING_SCRIPT',
  REVIEW_SCRIPT = 'REVIEW_SCRIPT',
  PLANNING_STORYBOARD = 'PLANNING_STORYBOARD',
  REVIEW_STORYBOARD = 'REVIEW_STORYBOARD',
  PRODUCING = 'PRODUCING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ScriptLine {
  id: string;
  character: string;
  dialogue: string;
  emotion: string;
}

export type TransitionType = 'CUT' | 'FADE_IN' | 'FADE_OUT' | 'CROSS_DISSOLVE';

export interface Transition {
  type: TransitionType;
  duration: number; // seconds
}

export interface Frame {
  id: string;
  sceneNumber: number;
  duration: number; // seconds
  scriptLines: ScriptLine[];
  visualDescription: string;
  imagePrompt: string; // The specific prompt for the image generator
  audioPrompt: string; // Description for BGM/SFX
  
  // Transition into this frame
  transition: Transition;

  // Generated Assets
  generatedImageUrl?: string;
  generatedAudioUrl?: string;
  isGenerating?: boolean;
}

export interface AgentLog {
  id: string;
  agent: 'ORCHESTRATOR' | 'SCRIPT' | 'VISUAL' | 'AUDIO';
  message: string;
  timestamp: number;
}

export interface ProjectState {
  status: ProjectStatus;
  userIdea: string;
  script: ScriptLine[];
  frames: Frame[];
  logs: AgentLog[];
  currentFrameIndex: number;
}