import React from 'react';
import { Frame, ProjectState, ProjectStatus, TransitionType } from '../types';

interface PreviewPanelProps {
  projectState: ProjectState;
  onGenerateScript: (idea: string) => void;
  onConfirmScript: () => void;
  onConfirmStoryboard: () => void;
  onUpdateFrame: (frameIndex: number, updates: Partial<Frame>) => void;
}

interface PreviewContainerProps {
  children: React.ReactNode;
  currentFrame?: Frame;
}

const PreviewContainer: React.FC<PreviewContainerProps> = ({ children, currentFrame }) => (
  <div className="h-full flex flex-col items-center justify-center p-4">
    <div className="relative aspect-[9/16] h-full max-h-[600px] bg-black rounded-2xl overflow-hidden shadow-2xl border border-studio-700 group">
      {children}
      
      {/* Overlay info */}
      <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex justify-between items-start">
           <span className="text-xs font-mono text-studio-accent">AutoStudio CAM-1</span>
           {currentFrame && <span className="text-xs font-mono text-white">SCENE {currentFrame.sceneNumber}</span>}
        </div>
      </div>
    </div>
  </div>
);

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
  projectState, 
  onGenerateScript, 
  onConfirmScript,
  onConfirmStoryboard,
  onUpdateFrame
}) => {
  const [ideaInput, setIdeaInput] = React.useState('');
  const currentFrame = projectState.frames[projectState.currentFrameIndex];

  const handleIdeaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ideaInput.trim()) onGenerateScript(ideaInput);
  };

  if (projectState.status === ProjectStatus.IDLE) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-br from-studio-900 to-studio-800">
        <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-studio-accent to-studio-pop">
          AutoStudio 2025
        </h1>
        <p className="text-gray-400 mb-8 max-w-md">
          간단한 아이디어만 입력하세요. 대본부터 영상 생성까지, 
          AI 에이전트 스웜이 모든 것을 처리합니다.
        </p>
        <form onSubmit={handleIdeaSubmit} className="w-full max-w-lg">
          <div className="relative">
            <input
              type="text"
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              placeholder="예: 사이버펑크 도시에서 추격전을 벌이는 로봇..."
              className="w-full bg-studio-800 border border-studio-600 rounded-full py-4 px-6 text-white focus:outline-none focus:border-studio-accent focus:ring-1 focus:ring-studio-accent transition-all shadow-lg"
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-studio-accent hover:bg-cyan-600 text-studio-900 font-bold px-6 rounded-full transition-colors"
            >
              생성
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (projectState.status === ProjectStatus.REVIEW_SCRIPT || projectState.status === ProjectStatus.PLANNING_SCRIPT) {
    return (
      <div className="flex h-full">
        {/* Script Editor View */}
        <div className="flex-1 p-8 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
            <span className="w-2 h-8 bg-purple-500 mr-3 rounded-full"></span>
            Script Review
          </h2>
          <div className="space-y-4 max-w-3xl">
            {projectState.script.map((line, idx) => (
              <div key={line.id} className="bg-studio-800 p-4 rounded-lg border border-studio-700 hover:border-studio-600 transition-colors">
                 <div className="flex justify-between mb-2">
                    <span className="font-bold text-studio-accent">{line.character}</span>
                    <span className="text-xs text-gray-500 px-2 py-1 bg-studio-900 rounded">{line.emotion}</span>
                 </div>
                 <p className="text-lg text-gray-200">{line.dialogue}</p>
              </div>
            ))}
            
            {projectState.status === ProjectStatus.PLANNING_SCRIPT && (
               <div className="text-center py-10 animate-pulse text-gray-500">대본 작성 중...</div>
            )}
          </div>
        </div>
        
        {/* Action Sidebar */}
        <div className="w-64 border-l border-studio-700 p-6 flex flex-col justify-end bg-studio-800/30">
           <button 
             onClick={onConfirmScript}
             disabled={projectState.status === ProjectStatus.PLANNING_SCRIPT}
             className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transition-all"
           >
             스토리보드 생성 &rarr;
           </button>
        </div>
      </div>
    );
  }

  // Storyboard & Production View
  return (
    <div className="flex h-full">
      {/* Visual Preview */}
      <div className="flex-1 bg-studio-950 relative">
         <PreviewContainer currentFrame={currentFrame}>
            {currentFrame ? (
              <>
                {currentFrame.generatedImageUrl ? (
                   <img src={currentFrame.generatedImageUrl} className="w-full h-full object-cover" alt="Generated Scene" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center bg-studio-800 text-gray-600 p-8 text-center">
                      {projectState.status === ProjectStatus.PRODUCING ? (
                        <div className="animate-pulse">Rendering Asset...</div>
                      ) : (
                        <div>Preview Placeholder</div>
                      )}
                   </div>
                )}
                
                {/* Dialogue Overlay Subtitles */}
                <div className="absolute bottom-16 left-0 w-full px-6 text-center">
                   {currentFrame.scriptLines.map((line, i) => (
                     <div key={i} className="mb-2">
                       <span className="bg-black/60 text-white px-2 py-1 rounded text-sm box-decoration-clone leading-6">
                         {line.dialogue}
                       </span>
                     </div>
                   ))}
                </div>

                 {/* Playback Controls (Mock) */}
                 {currentFrame.generatedAudioUrl && (
                    <audio src={currentFrame.generatedAudioUrl} controls className="absolute bottom-2 left-2 right-2 w-[calc(100%-1rem)] h-8 opacity-70 hover:opacity-100 transition-opacity" />
                 )}
              </>
            ) : (
              <div className="text-gray-500">프레임 선택</div>
            )}
         </PreviewContainer>
      </div>

      {/* Info Panel */}
      <div className="w-80 border-l border-studio-700 bg-studio-800/80 backdrop-blur p-6 overflow-y-auto">
         {currentFrame ? (
           <div className="space-y-6">
              {/* Transition Control */}
              <div className="bg-studio-900/50 p-4 rounded-lg border border-studio-700">
                <h3 className="text-xs font-bold text-studio-accent uppercase tracking-wider mb-3">Transition Setting</h3>
                <div className="flex items-center gap-2 mb-2">
                  <select 
                    value={currentFrame.transition.type}
                    onChange={(e) => onUpdateFrame(projectState.currentFrameIndex, { 
                      transition: { ...currentFrame.transition, type: e.target.value as TransitionType } 
                    })}
                    className="bg-studio-800 text-xs text-white p-2 rounded border border-studio-600 flex-1 focus:border-studio-accent outline-none"
                  >
                    <option value="CUT">Cut</option>
                    <option value="FADE_IN">Fade In</option>
                    <option value="FADE_OUT">Fade Out</option>
                    <option value="CROSS_DISSOLVE">Cross Dissolve</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-16">Duration</span>
                  <input 
                    type="range" 
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={currentFrame.transition.duration}
                    onChange={(e) => onUpdateFrame(projectState.currentFrameIndex, { 
                      transition: { ...currentFrame.transition, duration: parseFloat(e.target.value) } 
                    })}
                    className="flex-1 accent-studio-accent h-1 bg-studio-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-mono text-white w-8 text-right">{currentFrame.transition.duration}s</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Visual Description</h3>
                <p className="text-sm text-gray-300 leading-relaxed bg-black/20 p-3 rounded">{currentFrame.visualDescription}</p>
              </div>
              
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Generated Prompt</h3>
                <p className="text-xs font-mono text-studio-accent bg-studio-900 p-3 rounded border border-studio-700 break-words">
                  {currentFrame.imagePrompt}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Audio Direction</h3>
                <p className="text-sm text-gray-400 italic">{currentFrame.audioPrompt}</p>
              </div>
           </div>
         ) : (
           <div className="text-center text-gray-500 mt-20">프레임을 선택하여 세부 정보를 확인하세요.</div>
         )}

         <div className="mt-10 pt-6 border-t border-studio-700">
           {projectState.status === ProjectStatus.REVIEW_STORYBOARD ? (
              <button 
                onClick={onConfirmStoryboard}
                className="w-full py-3 bg-studio-pop hover:bg-pink-400 text-white font-bold rounded shadow-lg shadow-pink-900/20 transition-all flex items-center justify-center gap-2"
              >
                <span>최종 제작 시작</span>
                <span className="text-xs bg-white/20 px-1 rounded">GEMINI API</span>
              </button>
           ) : projectState.status === ProjectStatus.PRODUCING ? (
              <div className="w-full py-3 bg-studio-700 text-gray-300 font-bold rounded text-center cursor-wait">
                제작 진행 중...
              </div>
           ) : projectState.status === ProjectStatus.COMPLETED ? (
              <button className="w-full py-3 bg-green-600 text-white font-bold rounded shadow-lg">
                 다운로드 (Demo)
              </button>
           ) : null}
         </div>
      </div>
    </div>
  );
};