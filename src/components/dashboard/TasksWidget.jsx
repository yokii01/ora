const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cn } from '@/lib/utils';
import WidgetCard from './WidgetCard';

const priorityColors = {
  urgent: 'bg-destructive/10 text-destructive',
  high: 'bg-warning/10 text-warning',
  medium: 'bg-info/10 text-info',
  low: 'bg-muted text-muted-foreground',
};

export default function TasksWidget({ tasks = [], delay = 0 }) {
  const [checking, setChecking] = useState({});
  const queryClient = useQueryClient();
  const todayTasks = tasks.filter(t => t.status !== 'completed').slice(0, 4);
  const completed = tasks.filter(t => t.status === 'completed').length;

  const completeMutation = useMutation({
    mutationFn: (id) => db.entities.Task.update(id, { status: 'completed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const handleCheck = (task) => {
    setChecking(prev => ({ ...prev, [task.id]: true }));
    setTimeout(() => {
      completeMutation.mutate(task.id);
    }, 400);
  };

  return (
    <WidgetCard delay={delay}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-info" />
          </div>
          <h3 className="font-semibold text-sm">Today's Tasks</h3>
        </div>
        <Link to="/tasks" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {todayTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No tasks for today. Enjoy!</p>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {todayTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-3 py-1.5 group cursor-pointer"
                onClick={() => !checking[task.id] && handleCheck(task)}
              >
                <motion.div
                  animate={checking[task.id] ? { scale: [1, 1.3, 1] } : {}}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    checking[task.id]
                      ? "border-success bg-success"
                      : "border-muted-foreground/30 group-hover:border-primary"
                  )}
                >
                  {checking[task.id] && <CheckCircle2 className="w-3 h-3 text-white" />}
                </motion.div>
                <span className={cn("text-sm flex-1 truncate transition-all", checking[task.id] && "line-through text-muted-foreground")}>
                  {task.title}
                </span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0", priorityColors[task.priority])}>
                  {task.priority}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {tasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>{completed} of {tasks.length} completed</span>
          </div>
        </div>
      )}
    </WidgetCard>
  );
}