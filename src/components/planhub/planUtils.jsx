export const PLAN_TYPES = [
  { type: 'trip', label: 'Trip Planner', emoji: '✈️', color: 'blue', unsplashQuery: 'travel destination' },
  { type: 'study', label: 'Study Planner', emoji: '📚', color: 'green', unsplashQuery: 'study books education' },
  { type: 'career', label: 'Career Planner', emoji: '💼', color: 'orange', unsplashQuery: 'career professional' },
  { type: 'data_analyst', label: 'Data Analyst Roadmap', emoji: '📊', color: 'purple', unsplashQuery: 'data analysis chart' },
  { type: 'daily', label: 'Daily Planner', emoji: '🌅', color: 'pink', unsplashQuery: 'morning coffee notebook' },
  { type: 'weekly', label: 'Weekly Planner', emoji: '📅', color: 'teal', unsplashQuery: 'calendar planning' },
  { type: 'fitness', label: 'Fitness Planner', emoji: '💪', color: 'red', unsplashQuery: 'fitness gym workout' },
  { type: 'finance', label: 'Finance Planner', emoji: '💰', color: 'emerald', unsplashQuery: 'finance money' },
  { type: 'event', label: 'Event Planner', emoji: '🎉', color: 'rose', unsplashQuery: 'event celebration party' },
  { type: 'project', label: 'Project Planner', emoji: '🚀', color: 'indigo', unsplashQuery: 'office project workspace' },
  { type: 'startup', label: 'Startup Planner', emoji: '💡', color: 'amber', unsplashQuery: 'startup innovation' },
  { type: 'habit', label: 'Habit Planner', emoji: '🔄', color: 'sky', unsplashQuery: 'running habit success' },
  { type: 'content', label: 'Content Planner', emoji: '🎬', color: 'fuchsia', unsplashQuery: 'content creation social media' },
  { type: 'exam', label: 'Exam Planner', emoji: '📝', color: 'cyan', unsplashQuery: 'exam studying paper' },
  { type: 'relocation', label: 'Relocation Planner', emoji: '🏠', color: 'orange', unsplashQuery: 'house moving home' },
];

export const STATUS_CONFIG = {
  active: { label: 'Active', bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
  upcoming: { label: 'Upcoming', bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400' },
  completed: { label: 'Completed', bg: 'bg-muted', text: 'text-muted-foreground' },
  paused: { label: 'Paused', bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' },
  draft: { label: 'Draft', bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
};

const IMAGE_MAP = {
  trip: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
  study: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80',
  career: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
  data_analyst: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
  daily: 'https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?w=600&q=80',
  weekly: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80',
  fitness: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=600&q=80',
  finance: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80',
  event: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80',
  project: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&q=80',
  startup: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80',
  habit: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=600&q=80',
  content: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80',
  exam: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&q=80',
  relocation: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
};

export function getCoverImage(type) {
  return IMAGE_MAP[type] || 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&q=80';
}

// Format: array of steps, each step has an array of fields
export const PLAN_QUESTIONS = {
  trip: [
    { title: "Where to?", fields: [{ id: 'destination', label: 'Destination', type: 'text', placeholder: 'e.g. Paris, France', required: true }, { id: 'starting_location', label: 'Starting Location', type: 'text', placeholder: 'e.g. New York', required: true }] },
    { title: "Budget & Duration", fields: [{ id: 'budget', label: 'Budget ($)', type: 'number', placeholder: '2000' }, { id: 'days', label: 'Number of Days', type: 'number', placeholder: '7' }] },
    { title: "Who's going?", fields: [{ id: 'companions', label: 'Who are you traveling with?', type: 'select', options: ['Solo', 'Friends', 'Family', 'Partner'] }] },
    { title: "Travel Style", fields: [{ id: 'travel_style', label: 'Travel Style', type: 'select', options: ['Budget', 'Balanced', 'Luxury'] }] },
    { title: "Interests", fields: [{ id: 'interests', label: 'Interests', type: 'multiselect', options: ['Nature', 'Food', 'Adventure', 'Culture', 'Shopping', 'Photography', 'Festivals'] }] },
    { title: "Transport", fields: [{ id: 'transport', label: 'Preferred Transport', type: 'select', options: ['Flight', 'Train', 'Car', 'Bus'] }] },
    { title: "Hotels", fields: [{ id: 'hotel_pref', label: 'Hotel Preferences', type: 'select', options: ['5-Star', 'Boutique', 'Budget', 'Hostel', 'Airbnb'] }] },
    { title: "Notes", fields: [{ id: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any dietary restrictions or must-sees?' }] }
  ],
  study: [
    { title: "Subject", fields: [{ id: 'subject', label: 'Subject/Topic', type: 'text', required: true }, { id: 'current_level', label: 'Current Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] }] },
    { title: "Goals", fields: [{ id: 'goal', label: 'Primary Goal', type: 'text', placeholder: 'e.g. Speak fluently' }, { id: 'deadline', label: 'Target Deadline', type: 'date' }] },
    { title: "Availability", fields: [{ id: 'hours_per_week', label: 'Hours per Week', type: 'number' }, { id: 'preferred_time', label: 'Preferred Time', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Weekends'] }] },
    { title: "Resources", fields: [{ id: 'resources', label: 'Available Resources', type: 'textarea', placeholder: 'Books, online courses...' }] }
  ],
  career: [
    { title: "Current Status", fields: [{ id: 'current_role', label: 'Current Role', type: 'text', required: true }, { id: 'industry', label: 'Industry', type: 'text' }] },
    { title: "Target", fields: [{ id: 'target_role', label: 'Target Role', type: 'text', required: true }, { id: 'timeline', label: 'Timeline (months)', type: 'number' }] },
    { title: "Skills", fields: [{ id: 'skills_to_learn', label: 'Skills to Develop', type: 'textarea' }, { id: 'certifications', label: 'Desired Certifications', type: 'text' }] },
    { title: "Networking", fields: [{ id: 'networking_goals', label: 'Networking Goals', type: 'textarea' }] }
  ],
  data_analyst: [
    { title: "Background", fields: [{ id: 'current_skills', label: 'Current Skills', type: 'textarea', placeholder: 'e.g. Basic Excel', required: true }] },
    { title: "Focus", fields: [{ id: 'tools_focus', label: 'Tools to Learn', type: 'multiselect', options: ['Python', 'SQL', 'Tableau', 'PowerBI', 'R', 'Excel'] }] },
    { title: "Timeline", fields: [{ id: 'timeline', label: 'Timeline (months)', type: 'number', placeholder: '6' }] },
    { title: "Goal", fields: [{ id: 'end_goal', label: 'End Goal', type: 'select', options: ['Get a job', 'Upskill current role', 'Freelance', 'Personal interest'] }] }
  ],
  daily: [
    { title: "Focus", fields: [{ id: 'main_focus', label: 'Main Focus for Today', type: 'text', required: true }] },
    { title: "Schedule", fields: [{ id: 'wake_time', label: 'Wake Up Time', type: 'text', placeholder: '7:00 AM' }, { id: 'sleep_time', label: 'Sleep Time', type: 'text' }] },
    { title: "Priorities", fields: [{ id: 'top_3', label: 'Top 3 Tasks', type: 'textarea', placeholder: '1.\n2.\n3.' }] },
    { title: "Wellness", fields: [{ id: 'wellness', label: 'Wellness Activity', type: 'text', placeholder: 'e.g. 30m walk' }] }
  ],
  weekly: [
    { title: "Weekly Goal", fields: [{ id: 'main_goal', label: 'Main Goal for the Week', type: 'text', required: true }] },
    { title: "Projects", fields: [{ id: 'projects', label: 'Active Projects', type: 'textarea' }] },
    { title: "Habits", fields: [{ id: 'habits_focus', label: 'Habits to Track', type: 'text' }] },
    { title: "Review", fields: [{ id: 'last_week_review', label: 'Last Week Review', type: 'textarea', placeholder: 'What went well? What didn\'t?' }] }
  ],
  fitness: [
    { title: "Current Stats", fields: [{ id: 'current_weight', label: 'Current Weight', type: 'text' }, { id: 'fitness_level', label: 'Fitness Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] }] },
    { title: "Goals", fields: [{ id: 'fitness_goal', label: 'Main Goal', type: 'select', options: ['Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility'], required: true }] },
    { title: "Preferences", fields: [{ id: 'workout_style', label: 'Workout Style', type: 'select', options: ['Gym', 'Home Workout', 'Running', 'Yoga', 'Swimming'] }, { id: 'days_per_week', label: 'Days per Week', type: 'number' }] },
    { title: "Diet", fields: [{ id: 'dietary_pref', label: 'Dietary Preferences', type: 'text', placeholder: 'e.g. High protein, Vegan' }] }
  ],
  finance: [
    { title: "Current State", fields: [{ id: 'monthly_income', label: 'Monthly Income ($)', type: 'number' }, { id: 'current_savings', label: 'Current Savings ($)', type: 'number' }] },
    { title: "Goals", fields: [{ id: 'financial_goal', label: 'Primary Goal', type: 'text', required: true, placeholder: 'e.g. Save $10k for a house' }, { id: 'target_date', label: 'Target Date', type: 'date' }] },
    { title: "Expenses", fields: [{ id: 'fixed_expenses', label: 'Fixed Monthly Expenses ($)', type: 'number' }] },
    { title: "Strategy", fields: [{ id: 'strategy', label: 'Preferred Strategy', type: 'select', options: ['Aggressive Saving', 'Debt Payoff', 'Investing Focus', 'Balanced'] }] }
  ],
  event: [
    { title: "Event Details", fields: [{ id: 'event_name', label: 'Event Name', type: 'text', required: true }, { id: 'event_type', label: 'Event Type', type: 'select', options: ['Party', 'Conference', 'Wedding', 'Meetup'] }] },
    { title: "Logistics", fields: [{ id: 'date', label: 'Date', type: 'date' }, { id: 'guests', label: 'Expected Guests', type: 'number' }] },
    { title: "Budget & Venue", fields: [{ id: 'budget', label: 'Budget ($)', type: 'number' }, { id: 'venue_pref', label: 'Venue Preference', type: 'text' }] },
    { title: "Requirements", fields: [{ id: 'special_reqs', label: 'Special Requirements', type: 'textarea', placeholder: 'Catering, AV equipment...' }] }
  ],
  project: [
    { title: "Project Overview", fields: [{ id: 'project_name', label: 'Project Name', type: 'text', required: true }, { id: 'objective', label: 'Objective', type: 'textarea' }] },
    { title: "Scope", fields: [{ id: 'deliverables', label: 'Key Deliverables', type: 'textarea' }, { id: 'deadline', label: 'Deadline', type: 'date' }] },
    { title: "Resources", fields: [{ id: 'team_size', label: 'Team Size', type: 'number' }, { id: 'budget', label: 'Budget ($)', type: 'number' }] },
    { title: "Risks", fields: [{ id: 'risks', label: 'Potential Risks', type: 'textarea' }] }
  ],
  startup: [
    { title: "The Idea", fields: [{ id: 'startup_name', label: 'Startup Name', type: 'text', required: true }, { id: 'problem_solved', label: 'Problem Being Solved', type: 'textarea' }] },
    { title: "Market", fields: [{ id: 'target_audience', label: 'Target Audience', type: 'text' }, { id: 'competitors', label: 'Main Competitors', type: 'text' }] },
    { title: "Business Model", fields: [{ id: 'revenue_model', label: 'Revenue Model', type: 'select', options: ['SaaS', 'E-commerce', 'Ad-based', 'Freemium', 'Marketplace'] }] },
    { title: "Launch", fields: [{ id: 'launch_timeline', label: 'Launch Timeline (months)', type: 'number' }, { id: 'initial_budget', label: 'Initial Budget ($)', type: 'number' }] }
  ],
  habit: [
    { title: "The Habit", fields: [{ id: 'habit_name', label: 'Habit to Build/Break', type: 'text', required: true }, { id: 'type', label: 'Type', type: 'select', options: ['Build a new habit', 'Break an old habit'] }] },
    { title: "Triggers", fields: [{ id: 'cue', label: 'Cue / Trigger', type: 'text', placeholder: 'When will you do this?' }, { id: 'reward', label: 'Reward', type: 'text' }] },
    { title: "Frequency", fields: [{ id: 'frequency', label: 'Frequency', type: 'select', options: ['Daily', 'Weekly', 'Weekdays only'] }] },
    { title: "Obstacles", fields: [{ id: 'obstacles', label: 'Potential Obstacles', type: 'textarea' }] }
  ],
  content: [
    { title: "Platform", fields: [{ id: 'platform', label: 'Primary Platform', type: 'select', options: ['YouTube', 'Instagram', 'TikTok', 'Blog', 'Podcast'], required: true }, { id: 'niche', label: 'Content Niche', type: 'text' }] },
    { title: "Audience", fields: [{ id: 'target_audience', label: 'Target Audience', type: 'text' }] },
    { title: "Frequency", fields: [{ id: 'posting_freq', label: 'Posting Frequency', type: 'select', options: ['Daily', '2-3 times/week', 'Weekly', 'Monthly'] }] },
    { title: "Goals", fields: [{ id: 'content_goal', label: 'Primary Goal', type: 'select', options: ['Grow audience', 'Monetize', 'Brand awareness', 'Lead generation'] }] }
  ],
  exam: [
    { title: "The Exam", fields: [{ id: 'exam_name', label: 'Exam Name', type: 'text', required: true }, { id: 'exam_date', label: 'Exam Date', type: 'date' }] },
    { title: "Current Status", fields: [{ id: 'current_score', label: 'Current/Practice Score', type: 'text' }, { id: 'target_score', label: 'Target Score', type: 'text' }] },
    { title: "Weaknesses", fields: [{ id: 'weak_areas', label: 'Weak Areas', type: 'textarea' }] },
    { title: "Study Plan", fields: [{ id: 'study_hours_per_day', label: 'Study Hours / Day', type: 'number' }] }
  ],
  relocation: [
    { title: "Locations", fields: [{ id: 'moving_from', label: 'Moving From', type: 'text', required: true }, { id: 'moving_to', label: 'Moving To', type: 'text', required: true }] },
    { title: "Timeline", fields: [{ id: 'move_date', label: 'Target Move Date', type: 'date' }] },
    { title: "Logistics", fields: [{ id: 'housing_status', label: 'Housing Status', type: 'select', options: ['Secured', 'Looking to rent', 'Looking to buy'] }, { id: 'hiring_movers', label: 'Hiring Movers?', type: 'select', options: ['Yes', 'No, DIY'] }] },
    { title: "Budget", fields: [{ id: 'moving_budget', label: 'Moving Budget ($)', type: 'number' }] }
  ]
};