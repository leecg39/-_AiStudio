import React, { useState, useCallback } from 'react';
import { ProjectState, ProjectStatus, AgentLog, Frame } from './types';
import { generateScript, generateStoryboard, generateFrameImage, generateSpeech } from './services/gemini';
import { AgentChat } from './components/AgentChat';
import { PreviewPanel } from './components/PreviewPanel';
import { Timeline } from './components/Timeline';

const INITIAL_STATE: ProjectState = {
  status: ProjectStatus.IDLE,
  userIdea: '',
  script: [],
  frames: [],
  logs: [],
  currentFrameIndex: 0
};

export default function App() {
  const [state, setState] = useState<ProjectState>(INITIAL_STATE);

  const addLog = (agent: AgentLog['agent'], message: string) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, {
        id: Date.now().toString(),
        agent,
        message,
        timestamp: Date.now()
      }]
    }));
  };

  const handleUpdateFrame = (frameIndex: number, updates: Partial<Frame>) => {
    setState(prev => {
      const newFrames = [...prev.frames];
      newFrames[frameIndex] = { ...newFrames[frameIndex], ...updates };
      return { ...prev, frames: newFrames };
    });
  };

  const handleGenerateScript = async (idea: string) => {
    setState(prev => ({ ...prev, userIdea: idea, status: ProjectStatus.PLANNING_SCRIPT }));
    addLog('ORCHESTRATOR', `새 프로젝트 시작: "${idea}"`);
    addLog('SCRIPT', '아이디어 분석 및 대본 작성 시작...');

    try {
      const script = await generateScript(idea);
      addLog('SCRIPT', `대본 작성 완료 (${script.length} 라인). 검토 대기 중.`);
      setState(prev => ({
        ...prev,
        script,
        status: ProjectStatus.REVIEW_SCRIPT
      }));
    } catch (error) {
      console.error(error);
      addLog('ORCHESTRATOR', '오류 발생: 대본 생성 실패');
      setState(prev => ({ ...prev, status: ProjectStatus.ERROR }));
    }
  };

  const handleConfirmScript = async () => {
    setState(prev => ({ ...prev, status: ProjectStatus.PLANNING_STORYBOARD }));
    addLog('ORCHESTRATOR', '대본 승인됨. Visual Agent 호출.');
    addLog('VISUAL', '대본 시각화 및 프레임 분할 작업 시작...');

    try {
      const frames = await generateStoryboard(state.script);
      addLog('VISUAL', `스토리보드 생성 완료 (${frames.length} 씬). 검토 대기 중.`);
      setState(prev => ({
        ...prev,
        frames,
        status: ProjectStatus.REVIEW_STORYBOARD,
        currentFrameIndex: 0
      }));
    } catch (error) {
      console.error(error);
      addLog('ORCHESTRATOR', '오류 발생: 스토리보드 생성 실패');
      setState(prev => ({ ...prev, status: ProjectStatus.ERROR }));
    }
  };

  const handleConfirmStoryboard = async () => {
    setState(prev => ({ ...prev, status: ProjectStatus.PRODUCING }));
    addLog('ORCHESTRATOR', '제작 파이프라인 가동. Gemini API 자산 생성 시작.');

    const framesToProcess = [...state.frames];
    
    // Process sequentially to simulate a pipeline (and avoid rate limits in demo)
    for (let i = 0; i < framesToProcess.length; i++) {
        const frame = framesToProcess[i];
        
        // 1. Update State to show processing
        setState(prev => {
           const newFrames = [...prev.frames];
           newFrames[i] = { ...newFrames[i], isGenerating: true };
           return { ...prev, frames: newFrames, currentFrameIndex: i };
        });

        addLog('VISUAL', `Scene ${frame.sceneNumber} 렌더링 중 (Imagen)...`);
        
        try {
          // Generate Image
          const imageUrl = await generateFrameImage(frame.imagePrompt);
          
          // Generate Audio (TTS for first line of script in frame as demo)
          let audioUrl: string | undefined = undefined;
          if (frame.scriptLines.length > 0) {
             addLog('AUDIO', `Scene ${frame.sceneNumber} 음성 합성 중...`);
             audioUrl = await generateSpeech(frame.scriptLines[0].dialogue);
          }

          // Update Frame with Assets
          setState(prev => {
             const newFrames = [...prev.frames];
             newFrames[i] = { 
               ...newFrames[i], 
               generatedImageUrl: imageUrl,
               generatedAudioUrl: audioUrl,
               isGenerating: false 
             };
             return { ...prev, frames: newFrames };
          });
          
          addLog('ORCHESTRATOR', `Scene ${frame.sceneNumber} 자산 생성 완료.`);

        } catch (e) {
          console.error(e);
          addLog('ORCHESTRATOR', `Scene ${frame.sceneNumber} 처리 중 오류 발생.`);
        }
    }

    addLog('ORCHESTRATOR', '모든 작업 완료. 최종 확인.');
    setState(prev => ({ ...prev, status: ProjectStatus.COMPLETED }));
  };

  return (
    <div className="flex h-screen bg-studio-900 text-white overflow-hidden font-sans">
      {/* Left: Chat/Logs */}
      <div className="w-80 h-full flex-shrink-0 hidden md:block z-10">
        <AgentChat logs={state.logs} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Top Header */}
        <header className="h-14 bg-studio-900 border-b border-studio-700 flex items-center justify-between px-6 shadow-md">
          <div className="font-bold text-lg tracking-widest text-white">
            AUTOSTUDIO <span className="text-studio-accent">2025</span>
          </div>
          <div className="text-xs text-gray-500 font-mono">
            STATUS: <span className="text-studio-pop">{state.status}</span>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          <PreviewPanel 
            projectState={state}
            onGenerateScript={handleGenerateScript}
            onConfirmScript={handleConfirmScript}
            onConfirmStoryboard={handleConfirmStoryboard}
            onUpdateFrame={handleUpdateFrame}
          />
        </main>

        {/* Bottom Timeline */}
        {state.status !== ProjectStatus.IDLE && (
          <footer className="h-auto bg-studio-900 z-10 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
             <Timeline 
               frames={state.frames} 
               currentFrameIndex={state.currentFrameIndex}
               onFrameSelect={(idx) => setState(prev => ({ ...prev, currentFrameIndex: idx }))}
             />
          </footer>
        )}
      </div>
    </div>
  );
}