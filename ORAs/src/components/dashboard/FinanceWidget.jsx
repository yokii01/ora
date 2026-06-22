import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import WidgetCard from './WidgetCard';

export default function FinanceWidget({ transactions = [], delay = 0 }) {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const balance = income - expenses;

  return (
    <WidgetCard delay={delay}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">Finance</h3>
        </div>
        <Link to="/finance" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
          Details <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="text-center py-2">
        <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-1">Balance</p>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs">
          <TrendingUp className="w-3.5 h-3.5 text-success" />
          <span className="text-success font-medium">${income.toFixed(0)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <TrendingDown className="w-3.5 h-3.5 text-destructive" />
          <span className="text-destructive font-medium">${expenses.toFixed(0)}</span>
        </div>
      </div>
    </WidgetCard>
  );
}