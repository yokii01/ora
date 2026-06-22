import React from 'react';
import { Link } from 'react-router-dom';
import { StickyNote, ArrowRight, Plus } from 'lucide-react';
import WidgetCard from './WidgetCard';

const colorMap = {
  default: 'bg-muted',
  red: 'bg-red-100',
  orange: 'bg-orange-100',
  yellow: 'bg-yellow-100',
  green: 'bg-green-100',
  blue: 'bg-blue-100',
  purple: 'bg-purple-100',
  pink: 'bg-pink-100',
};

export default function NotesWidget({ notes = [], delay = 0 }) {
  const recentNotes = notes.slice(0, 3);

  return (
    <WidgetCard delay={delay}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <StickyNote className="w-4 h-4 text-warning" />
          </div>
          <h3 className="font-semibold text-sm">Quick Notes</h3>
        </div>
        <Link to="/notes" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {recentNotes.length === 0 ? (
        <Link to="/notes" className="flex flex-col items-center gap-2 py-4 text-muted-foreground hover:text-primary transition-colors">
          <Plus className="w-5 h-5" />
          <span className="text-sm">Create your first note</span>
        </Link>
      ) : (
        <div className="space-y-2">
          {recentNotes.map((note) => (
            <div key={note.id} className="flex items-center gap-3 py-1.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colorMap[note.color] || colorMap.default}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{note.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {note.content ? note.content.replace(/<[^>]*>/g, '').slice(0, 60) : 'Empty note'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  );
}