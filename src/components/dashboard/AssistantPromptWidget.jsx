import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Mic, Send, Sparkles } from 'lucide-react';

export default function AssistantPromptWidget({ delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="h-full rounded-3xl p-1 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-500 shadow-lg group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-500 blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
      
      <div className="h-full bg-card/95 backdrop-blur-xl rounded-[22px] p-5 flex flex-col relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-orange-500 p-[2px]">
            <div className="w-full h-full bg-card rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-foreground" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-1.5">
              ORAs AI <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            </h3>
            <p className="text-xs text-muted-foreground">How can I help today?</p>
          </div>
        </div>

        <div className="mt-auto relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Mic className="w-4 h-4 cursor-pointer hover:text-foreground transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Ask anything..." 
            className="w-full bg-muted/50 border border-border rounded-full py-3 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-foreground placeholder:text-muted-foreground"
          />
          <button className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-sm">
            <Send className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
