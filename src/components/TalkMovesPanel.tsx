import React from 'react';
import { TalkMove } from '../types';
import { MessageSquareQuote, Users2 } from 'lucide-react';

interface TalkMovesPanelProps {
  talkMoves: TalkMove[];
  groupingTip: string;
}

export const TalkMovesPanel: React.FC<TalkMovesPanelProps> = ({ talkMoves, groupingTip }) => {
  const laneBorderColors: Record<string, string> = {
    Support: 'border-l-blue-600',
    Core: 'border-l-indigo-600',
    Extend: 'border-l-purple-700',
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Talk Moves */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquareQuote className="w-5 h-5 text-indigo-600" />
          <h3 className="font-sans font-bold text-xl text-slate-900">
            Talk Moves — What to Say Out Loud Per Lane
          </h3>
        </div>
        <p className="font-mono text-xs text-slate-500 mb-5">
          Spoken prompts for while circulating the classroom, aligned with command-term questioning.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {talkMoves.map((tm, idx) => (
            <div
              key={idx}
              className={`border-l-4 ${laneBorderColors[tm.tier] || 'border-l-indigo-600'} pl-4 py-1 space-y-2`}
            >
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">
                {tm.tier} Lane Prompts
              </div>
              <ul className="space-y-2 font-serif text-sm text-slate-900 leading-relaxed list-disc list-inside">
                {tm.prompts.map((p, pIdx) => (
                  <li key={pIdx}>"{p}"</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Grouping Tip */}
      {groupingTip && (
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 flex items-start gap-3">
          <Users2 className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-800 block mb-1">
              Classroom Seating &amp; Grouping Tip
            </span>
            <p className="font-serif text-sm text-slate-900 leading-relaxed">
              {groupingTip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
