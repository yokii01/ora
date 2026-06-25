const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safeFetch } from '@/lib/safeFetch';

import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Trash2, ArrowUpRight, ArrowDownRight,
  Calculator, RefreshCw, Calendar, X, Globe, ChevronLeft, ChevronRight,
  Sparkles, Activity, Star,
  Utensils, Car, Home, Lightbulb, Gamepad2, Heart, GraduationCap,
  ShoppingBag, PiggyBank, Briefcase, Laptop, MoreHorizontal,
  PieChart as PieChartIcon, Scale, Trophy, PartyPopper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format, subMonths, startOfMonth, eachDayOfInterval, endOfMonth } from 'date-fns';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  XAxis, YAxis, CartesianGrid, Area, AreaChart,
  BarChart, Bar, ReferenceLine
} from 'recharts';

const CategoryIconMap = {
  food: Utensils, transport: Car, housing: Home, utilities: Lightbulb, entertainment: Gamepad2,
  health: Heart, education: GraduationCap, shopping: ShoppingBag, savings: PiggyBank, salary: Briefcase,
  freelance: Laptop, investment: TrendingUp, other: MoreHorizontal
};

const getCategoryIcon = (category, className) => {
  const Icon = CategoryIconMap[category] || MoreHorizontal;
  return <Icon className={className} />;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/80 backdrop-blur-xl border border-border/60 p-3 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        {label && <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm font-semibold">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="capitalize">{entry.name}:</span>
            <span>${Number(entry.value).toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const COLORS = ['hsl(245,58%,51%)', 'hsl(170,55%,45%)', 'hsl(32,85%,55%)', 'hsl(340,65%,55%)', 'hsl(200,70%,50%)', 'hsl(152,60%,42%)', 'hsl(280,60%,55%)'];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

import { useApiQuery } from '@/hooks/useApi';

const RATE_CACHE_KEY = 'oras_currency_rates_v1';
const CURRENCY_CODES = CURRENCIES.map(currency => currency.code);

function processCurrencyData(data) {
  if (data.result !== 'success') throw new Error('Currency service returned invalid data');
  const supportedRates = Object.fromEntries(CURRENCY_CODES.map(code => [code, data.rates[code]]).filter(([, rate]) => Number.isFinite(rate)));
  return {
    rates: supportedRates,
    marketDate: data.time_last_update_utc,
    fetchedAt: new Date().toISOString(),
    cached: false,
  };
}

// ─── Dashboard 1: Spending by Category ───────────────────────────────────────
function SpendingCategoryChart({ transactions }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const expenses = transactions.filter(t => t.type === 'expense');
  const categoryData = expenses.reduce((acc, t) => {
    const cat = t.category || 'other';
    acc[cat] = (acc[cat] || 0) + t.amount;
    return acc;
  }, {});
  const total = Object.values(categoryData).reduce((s, v) => s + v, 0);
  const pieData = Object.entries(categoryData).map(([name, value]) => ({
    name, value, pct: total > 0 ? ((value / total) * 100).toFixed(1) : 0
  })).sort((a, b) => b.value - a.value);

  const activeCat = pieData.find(d => d.name === activeCategory);
  const catTx = transactions.filter(t => t.category === activeCategory && t.type === 'expense').slice(0, 5);

  if (pieData.length === 0) return (
    <div className="text-center py-10 text-muted-foreground text-sm">
      Add expenses to see spending breakdown
    </div>
  );

  return (
    <div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%" cy="50%"
              innerRadius={52} outerRadius={82}
              paddingAngle={3}
              dataKey="value"
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
              animationBegin={200}
              onClick={(d) => setActiveCategory(activeCategory === d.name ? null : d.name)}
            >
              {pieData.map((d, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                  opacity={activeCategory && activeCategory !== d.name ? 0.35 : 1}
                  stroke={activeCategory === d.name ? 'white' : 'transparent'}
                  strokeWidth={2}
                  style={{ cursor: 'pointer', filter: activeCategory === d.name ? `drop-shadow(0 0 6px ${COLORS[i % COLORS.length]})` : 'none' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown */}
      <div className="space-y-2 mt-2">
        {pieData.map((d, i) => (
          <motion.div
            key={d.name}
            onClick={() => setActiveCategory(activeCategory === d.name ? null : d.name)}
            whileHover={{ x: 2 }}
            className={cn('flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all', activeCategory === d.name ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50')}
          >
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-xs capitalize flex-1 flex items-center gap-1.5">{getCategoryIcon(d.name, "w-3.5 h-3.5 text-muted-foreground")} {d.name.replace('_', ' ')}</span>
            <span className="text-xs text-muted-foreground">{d.pct}%</span>
            <span className="text-xs font-semibold">${d.value.toFixed(2)}</span>
          </motion.div>
        ))}
      </div>

      {/* Active category detail */}
      <AnimatePresence>
        {activeCat && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-3 bg-primary/5 rounded-2xl p-4 border border-primary/20">
            <p className="text-sm font-semibold mb-2 capitalize flex items-center gap-1.5">{getCategoryIcon(activeCat.name, "w-4 h-4 text-primary")} {activeCat.name} — ${activeCat.value.toFixed(2)}</p>
            {catTx.map(tx => (
              <div key={tx.id} className="flex justify-between text-xs text-muted-foreground py-1 border-b border-border/40 last:border-0">
                <span>{tx.title}</span>
                <span>${tx.amount.toFixed(2)}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Dashboard 2: Monthly Spending Trend ─────────────────────────────────────
function SpendingTrendChart({ transactions }) {
  const [range, setRange] = useState('monthly');

  const getDailyData = () => {
    const now = new Date();
    const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const spent = transactions
        .filter(t => t.type === 'expense' && t.date === dayStr)
        .reduce((s, t) => s + t.amount, 0);
      return { date: format(day, 'd'), spent, full: dayStr };
    });
  };

  const getMonthlyData = () => {
    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(new Date(), 5 - i);
      const label = format(month, 'MMM');
      const monthStr = format(month, 'yyyy-MM');
      const spent = transactions
        .filter(t => t.type === 'expense' && t.date?.startsWith(monthStr))
        .reduce((s, t) => s + t.amount, 0);
      const income = transactions
        .filter(t => t.type === 'income' && t.date?.startsWith(monthStr))
        .reduce((s, t) => s + t.amount, 0);
      return { date: label, spent, income };
    });
  };

  const data = range === 'monthly' ? getMonthlyData() : getDailyData();
  const values = data.map(d => d.spent).filter(v => v > 0);
  const maxDay = data.reduce((m, d) => d.spent > m.spent ? d : m, data[0] || {});
  const minDay = data.filter(d => d.spent > 0).reduce((m, d) => d.spent < m.spent ? d : m, data.find(d => d.spent > 0) || {});
  const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['daily', 'monthly'].map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={cn('px-3 py-1 rounded-full text-xs font-medium capitalize transition-all',
              range === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
            {r}
          </button>
        ))}
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(245,58%,51%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(245,58%,51%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="spent" stroke="hsl(245,58%,51%)" strokeWidth={2.5} fill="url(#spendGrad)" dot={false} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: 'Highest Day', value: maxDay?.date ? `${maxDay.date} ($${maxDay.spent?.toFixed(0)})` : '—', icon: TrendingUp, color: 'text-destructive' },
          { label: 'Avg Spending', value: `$${avg.toFixed(2)}`, icon: Activity, color: 'text-info' },
          { label: 'Lowest Day', value: minDay?.date ? `${minDay.date} ($${minDay.spent?.toFixed(0)})` : '—', icon: TrendingDown, color: 'text-success' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-muted/40 rounded-xl p-3 text-center">
            <Icon className={cn('w-4 h-4 mx-auto mb-1', color)} />
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-xs font-semibold mt-0.5">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard 3: Income vs Expense Analytics ────────────────────────────────
function IncomeExpenseChart({ transactions }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const label = format(month, 'MMM');
    const monthStr = format(month, 'yyyy-MM');
    const income = transactions.filter(t => t.type === 'income' && t.date?.startsWith(monthStr)).reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense' && t.date?.startsWith(monthStr)).reduce((s, t) => s + t.amount, 0);
    return { month: label, income, expense, net: income - expense };
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsPct = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0;

  const prevMonth = months[months.length - 2];
  const currMonth = months[months.length - 1];
  const expenseChange = prevMonth?.expense > 0 ? (((currMonth?.expense - prevMonth?.expense) / prevMonth?.expense) * 100).toFixed(1) : 0;

  return (
    <div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={months} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="income" fill="hsl(152,60%,42%)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
            <Bar dataKey="expense" fill="hsl(245,58%,51%)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-3 mt-2 mb-4">
        <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full bg-success" /> Income</div>
        <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full bg-primary" /> Expenses</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-success/10 rounded-2xl p-4">
          <p className="text-xs text-success/80 mb-1">Savings Rate</p>
          <p className="text-2xl font-bold text-success">{savingsPct}%</p>
        </div>
        <div className={cn('rounded-2xl p-4', parseFloat(expenseChange) < 0 ? 'bg-success/10' : 'bg-destructive/10')}>
          <p className="text-xs text-muted-foreground mb-1">vs Last Month</p>
          <p className={cn('text-lg font-bold', parseFloat(expenseChange) < 0 ? 'text-success' : 'text-destructive')}>
            {expenseChange > 0 ? '+' : ''}{expenseChange}%
          </p>
          <p className="text-[10px] text-muted-foreground">spending</p>
        </div>
      </div>
      {expenseChange !== 0 && (
        <div className={cn('mt-3 text-xs rounded-xl px-3 py-2 flex items-center gap-1.5', parseFloat(expenseChange) < 0 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
          {parseFloat(expenseChange) < 0 ? <PartyPopper className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          {parseFloat(expenseChange) < 0
            ? `You spent ${Math.abs(expenseChange)}% less than last month`
            : `Spending increased by ${expenseChange}% this month`}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard 4: Financial Health Score ─────────────────────────────────────
function FinancialHealthScore({ transactions }) {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = totalIncome - totalExpense;
  const savingsPct = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
  const recurring = transactions.filter(t => t.recurring).length;
  const diversity = new Set(transactions.filter(t => t.type === 'expense').map(t => t.category)).size;

  let score = 50;
  if (savingsPct > 20) score += 20;
  else if (savingsPct > 10) score += 10;
  else if (savingsPct < 0) score -= 20;
  if (diversity >= 5) score += 10;
  if (recurring >= 2) score += 5;
  if (totalIncome > 0) score += 10;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const scoreColor = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 75 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';

  const circumference = 2 * Math.PI * 54;
  const dash = (score / 100) * circumference;

  const tips = [
    savings < 0 && 'Your expenses exceed income — try cutting non-essentials',
    savingsPct < 20 && 'Aim to save at least 20% of your income each month',
    diversity < 3 && 'Diversify your spending categories for better budgeting',
    totalIncome === 0 && 'Log your income to get a complete picture',
  ].filter(Boolean);

  return (
    <div>
      <div className="flex flex-col items-center py-4">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <motion.circle
              cx="60" cy="60" r="54" fill="none"
              stroke={scoreColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${dash} ${circumference}` }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black" style={{ color: scoreColor }}>{score}</span>
            <span className="text-xs font-semibold text-muted-foreground mt-0.5">{scoreLabel}</span>
          </div>
        </div>
        <p className="text-sm font-semibold mt-3">Financial Health Score</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Savings Rate', value: `${Math.max(0, savingsPct).toFixed(1)}%`, good: savingsPct >= 20 },
          { label: 'Expense Diversity', value: `${diversity} categories`, good: diversity >= 5 },
          { label: 'Recurring Items', value: `${recurring} items`, good: recurring >= 1 },
          { label: 'Income Logged', value: totalIncome > 0 ? `$${totalIncome.toFixed(0)}` : 'None', good: totalIncome > 0 },
        ].map(({ label, value, good }) => (
          <div key={label} className={cn('rounded-xl p-3', good ? 'bg-success/10' : 'bg-muted/50')}>
            <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
            <p className={cn('text-sm font-bold', good ? 'text-success' : 'text-foreground')}>{value}</p>
          </div>
        ))}
      </div>

      {tips.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> AI Recommendations
          </p>
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
              <Star className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tools ────────────────────────────────────────────────────────────────────
function FinanceCalculator() {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState(null);
  const calc = () => {
    try { setResult(Function(`"use strict"; return (${expr.replace(/[^0-9+\-*/().% ]/g, '')})`)());} catch { setResult('Error'); }
  };
  const buttons = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'];
  return (
    <div className="bg-muted/50 rounded-2xl p-4 space-y-3">
      <div className="bg-card rounded-xl p-3 text-right">
        <p className="text-xs text-muted-foreground">{expr || '0'}</p>
        {result !== null && <p className="text-2xl font-bold text-primary">{typeof result === 'number' ? result.toFixed(2) : result}</p>}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {buttons.map(b => (
          <button key={b} onClick={() => b === '=' ? calc() : setExpr(p => p + b)}
            className={cn('h-10 rounded-xl text-sm font-semibold transition-all active:scale-95', b === '=' ? 'bg-primary text-primary-foreground' : b.match(/[+\-*/]/) ? 'bg-primary/15 text-primary' : 'bg-card hover:bg-muted border border-border/60')}>
            {b}
          </button>
        ))}
      </div>
      <button onClick={() => { setExpr(''); setResult(null); }} className="w-full py-2 rounded-xl bg-muted text-xs font-medium text-muted-foreground">Clear</button>
    </div>
  );
}

function CurrencyConverter() {
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const {
    data: rawData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useApiQuery({
    queryKey: ['currency-rates'],
    url: 'https://open.er-api.com/v6/latest/USD',
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  const data = rawData ? processCurrencyData(rawData) : null;

  const convert = () => {
    const a = parseFloat(amount) || 0;
    if (!data?.rates?.[from] || !data?.rates?.[to]) return null;
    return (a / data.rates[from] * data.rates[to]).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };
  const toCurr = CURRENCIES.find(c => c.code === to);
  const converted = convert();

  return (
    <div className="bg-muted/50 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', error ? 'bg-destructive' : data?.cached ? 'bg-warning' : 'bg-success')} />
          <span className="truncate">
            {isLoading
              ? 'Loading current rates...'
              : error && !data
                ? 'Rates unavailable'
                : data?.cached
                  ? 'Offline cached rates'
                  : `Market rates: ${data?.marketDate || 'latest'}`}
          </span>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="flex shrink-0 items-center gap-1 hover:text-foreground disabled:opacity-50">
          <RefreshCw className={cn('w-3 h-3', isFetching && 'animate-spin')} />
          Refresh
        </button>
      </div>
      <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Amount" className="rounded-xl" />
      <div className="flex items-center gap-2">
        <Select value={from} onValueChange={setFrom}>
          <SelectTrigger className="rounded-xl flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>)}</SelectContent>
        </Select>
        <button onClick={() => { const t = from; setFrom(to); setTo(t); }} className="p-2 rounded-lg hover:bg-muted">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
        <Select value={to} onValueChange={setTo}>
          <SelectTrigger className="rounded-xl flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="bg-card rounded-xl p-3 text-center">
        <p className="text-xs text-muted-foreground mb-1">{amount} {from} =</p>
        {isLoading ? (
          <LoadingSpinner inline className="w-6 h-6 mx-auto my-1 animate-spin text-primary" />
        ) : converted ? (
          <p className="text-2xl font-bold text-primary">{toCurr?.symbol}{converted} {to}</p>
        ) : (
          <p className="text-sm font-medium text-destructive">Unable to convert while rates are unavailable</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          {data?.fetchedAt ? `Updated ${new Date(data.fetchedAt).toLocaleString()}` : 'Waiting for exchange-rate data'}
        </p>
      </div>
    </div>
  );
}

const DASHBOARDS = [
  { id: 'category', label: 'Category', icon: PieChartIcon, title: 'Spending by Category' },
  { id: 'trend', label: 'Trend', icon: TrendingUp, title: 'Monthly Trend' },
  { id: 'income', label: 'Income vs Expense', icon: Scale, title: 'Income vs Expense' },
  { id: 'health', label: 'Health Score', icon: Trophy, title: 'Financial Health' },
];

const LAST_DASHBOARD_KEY = 'oras_last_finance_dashboard';

export default function Finance() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [showCalc, setShowCalc] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const savedDash = parseInt(localStorage.getItem(LAST_DASHBOARD_KEY) || '0', 10);
  const [dashIndex, setDashIndex] = useState(savedDash);
  const dragStartX = useRef(null);
  const queryClient = useQueryClient();

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => db.entities.Transaction.list('-date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Transaction.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); setShowAdd(false); setEditTx(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Transaction.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const monthTx = transactions.filter(t => !t.date || t.date.startsWith(selectedMonth));
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const balance = income - expenses;
  const filtered = monthTx.filter(t => typeFilter === 'all' || t.type === typeFilter);

  const openAdd = (type) => {
    setEditTx({ title: '', amount: '', type, category: 'other', date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
    setShowAdd(true);
  };

  const saveTx = () => {
    if (!editTx?.title?.trim() || !editTx.amount) return;
    createMutation.mutate({ ...editTx, amount: parseFloat(editTx.amount) });
  };

  const goToDash = (index) => {
    const i = Math.max(0, Math.min(DASHBOARDS.length - 1, index));
    setDashIndex(i);
    localStorage.setItem(LAST_DASHBOARD_KEY, String(i));
  };

  const handleDragStart = (e) => { dragStartX.current = e.touches?.[0]?.clientX || e.clientX; };
  const handleDragEnd = (e) => {
    if (dragStartX.current === null) return;
    const endX = e.changedTouches?.[0]?.clientX || e.clientX;
    const diff = dragStartX.current - endX;
    if (Math.abs(diff) > 50) goToDash(dashIndex + (diff > 0 ? 1 : -1));
    dragStartX.current = null;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button onClick={() => setShowConverter(!showConverter)} size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs">
            <Globe className="w-3.5 h-3.5" /> Currency
          </Button>
          <Button onClick={() => setShowCalc(!showCalc)} size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs">
            <Calculator className="w-3.5 h-3.5" /> Calc
          </Button>
          <Button onClick={() => openAdd('income')} size="sm" variant="outline" className="gap-1.5 rounded-xl text-success border-success/30">
            <ArrowUpRight className="w-4 h-4" /> Income
          </Button>
          <Button onClick={() => openAdd('expense')} size="sm" className="gap-1.5 rounded-xl">
            <ArrowDownRight className="w-4 h-4" /> Expense
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-2">
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={() => {
            const d = new Date(selectedMonth + '-01');
            d.setMonth(d.getMonth() - 1);
            setSelectedMonth(format(d, 'yyyy-MM'));
          }}
          className="p-2 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
        <div className="flex-1 text-center">
          <span className="text-sm font-semibold">
            {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
          </span>
          {selectedMonth === format(new Date(), 'yyyy-MM') && (
            <span className="ml-2 text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">Current</span>
          )}
        </div>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={() => {
            const d = new Date(selectedMonth + '-01');
            d.setMonth(d.getMonth() + 1);
            const next = format(d, 'yyyy-MM');
            if (next <= format(new Date(), 'yyyy-MM')) setSelectedMonth(next);
          }}
          disabled={selectedMonth >= format(new Date(), 'yyyy-MM')}
          className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-30">
          <ChevronRight className="w-4 h-4" />
        </motion.button>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          max={format(new Date(), 'yyyy-MM')}
          className="bg-muted/50 border border-border/50 rounded-full px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary/40 w-32"
        />
      </div>

      {/* Inline Tools */}
      <AnimatePresence>
        {showCalc && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5"><Calculator className="w-4 h-4" /> Calculator</h3>
              <button onClick={() => setShowCalc(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <FinanceCalculator />
          </motion.div>
        )}
        {showConverter && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5"><Globe className="w-4 h-4" /> Currency Converter</h3>
              <button onClick={() => setShowConverter(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <CurrencyConverter />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Balance', value: balance, color: balance >= 0 ? 'text-success' : 'text-destructive', bg: balance >= 0 ? 'bg-success/10' : 'bg-destructive/10' },
          { label: 'Income', value: income, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Expenses', value: expenses, color: 'text-destructive', bg: 'bg-destructive/10' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={cn('capsule-ui p-4 text-center border-white/10', c.bg)}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{c.label}</p>
            <p className={cn('text-lg font-black mt-1', c.color)}>${Math.abs(c.value).toFixed(0)}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Dashboard Slider ───────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
        {/* Dashboard Nav */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <h3 className="font-semibold text-sm">{DASHBOARDS[dashIndex].title}</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="w-7 h-7 rounded-full" onClick={() => goToDash(dashIndex - 1)} disabled={dashIndex === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="w-7 h-7 rounded-full" onClick={() => goToDash(dashIndex + 1)} disabled={dashIndex === DASHBOARDS.length - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div
          className="px-4 pb-4 overflow-hidden"
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={dashIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {dashIndex === 0 && <SpendingCategoryChart transactions={transactions} />}
              {dashIndex === 1 && <SpendingTrendChart transactions={transactions} />}
              {dashIndex === 2 && <IncomeExpenseChart transactions={transactions} />}
              {dashIndex === 3 && <FinancialHealthScore transactions={transactions} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {DASHBOARDS.map((_, i) => (
            <button key={i} onClick={() => goToDash(i)}
              className={cn('transition-all rounded-full', i === dashIndex ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60')} />
          ))}
        </div>
      </div>

      {/* Dashboard Tab Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {DASHBOARDS.map((d, i) => (
          <button key={d.id} onClick={() => goToDash(i)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              i === dashIndex ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
            <span><d.icon className="w-3.5 h-3.5" /></span>{d.label}
          </button>
        ))}
      </div>

      {/* Transactions */}
      <Tabs value={typeFilter} onValueChange={setTypeFilter}>
        <TabsList className="bg-muted/50 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg text-xs">All</TabsTrigger>
          <TabsTrigger value="income" className="rounded-lg text-xs">Income</TabsTrigger>
          <TabsTrigger value="expense" className="rounded-lg text-xs">Expenses</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((tx, i) => (
            <motion.div key={tx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ delay: i * 0.02 }} whileHover={{ x: 2 }}
              className="flex items-center gap-3 p-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 group hover:shadow-lg hover:bg-white/5 transition-all">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm">{getCategoryIcon(tx.category, "w-4 h-4 text-muted-foreground")}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.title}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{tx.category?.replace('_', ' ')} · {tx.date ? format(new Date(tx.date), 'MMM d') : ''}</p>
              </div>
              <span className={cn('font-semibold text-sm', tx.type === 'income' ? 'text-success' : 'text-foreground')}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount?.toFixed(2)}
              </span>
              <button onClick={() => deleteMutation.mutate(tx.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 transition-all">
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editTx?.type === 'income' ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-destructive" />}
              Add {editTx?.type === 'income' ? 'Income' : 'Expense'}
            </DialogTitle>
          </DialogHeader>
          {editTx && (
            <div className="space-y-4">
              <Input placeholder="Title" value={editTx.title} onChange={(e) => setEditTx({ ...editTx, title: e.target.value })} className="rounded-xl" />
              <Input type="number" placeholder="Amount" value={editTx.amount} onChange={(e) => setEditTx({ ...editTx, amount: e.target.value })} className="rounded-xl" />
              <Select value={editTx.category} onValueChange={(v) => setEditTx({ ...editTx, category: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(CategoryIconMap).map(c => <SelectItem key={c} value={c}><div className="flex items-center gap-2">{getCategoryIcon(c, "w-4 h-4")} <span>{c.replace('_', ' ')}</span></div></SelectItem>)}</SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Input type="date" value={editTx.date || ''} onChange={(e) => setEditTx({ ...editTx, date: e.target.value })} className="rounded-xl" />
              </div>
              <Input placeholder="Notes (optional)" value={editTx.notes || ''} onChange={(e) => setEditTx({ ...editTx, notes: e.target.value })} className="rounded-xl" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={saveTx} className="rounded-xl">Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
