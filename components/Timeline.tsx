import React from 'react';
import { Frame } from '../types';

interface TimelineProps {
  frames: Frame[];
  currentFrameIndex: number;
  onFrameSelect: (index: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ frames, currentFrameIndex, onFrameSelect }) => {
  
  const getTransitionIcon = (type: string) => {
    switch (type) {
      case 'CUT': return <div className="w-[2px] h-6 bg-gray-600"></div>;
      case 'CROSS_DISSOLVE': return <div className="text-studio-accent font-bold text-xs">X</div>;
      case 'FADE_IN': return <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-studio-accent"></div>;
      case 'FADE_OUT': return <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[8px] border-t-studio-pop"></div>;
      default: return null;
    }
  };

  return (
    <div className="w-full h-32 bg-studio-900 border-t border-studio-700 flex overflow-x-auto items-center p-4">
      {frames.length === 0 && (
        <div className="w-full text-center text-gray-600 text-sm">
          스토리보드가 생성되면 타임라인이 표시됩니다.
        </div>
      )}
      {frames.map((frame, index) => (
        <React.Fragment key={frame.id}>
           {/* Transition Indicator - Show before the frame it applies to */}
           <div className="flex flex-col items-center justify-center px-2 min-w-[30px]" title={`Transition: ${frame.transition.type} (${frame.transition.duration}s)`}>
             {getTransitionIcon(frame.transition.type)}
             <span className="text-[9px] text-gray-500 mt-1">{frame.transition.duration}s</span>
           </div>

           <div
            onClick={() => onFrameSelect(index)}
            className={`
              relative flex-shrink-0 w-24 h-24 rounded-lg cursor-pointer transition-all border-2 overflow-hidden group
              ${currentFrameIndex === index ? 'border-studio-accent ring-2 ring-studio-accent/30' : 'border-studio-700 hover:border-gray-500'}
            `}
          >
            {frame.generatedImageUrl ? (
              <img src={frame.generatedImageUrl} alt={`Scene ${frame.sceneNumber}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-studio-800 flex items-center justify-center text-xs text-gray-500 p-1 text-center">
                 Scene {frame.sceneNumber}
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-[10px] text-white px-1 truncate">
               {frame.duration}s
            </div>
            
            {frame.isGenerating && (
               <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-studio-accent border-t-transparent rounded-full animate-spin"></div>
               </div>
            )}
            
            {/* Tooltip on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[10px] text-white font-mono">EDIT</span>
            </div>
          </div>
        </React.Fragment>
      ))}
      
      {/* Spacer for end of list */}
      <div className="min-w-[50px]"></div>
    </div>
  );
};