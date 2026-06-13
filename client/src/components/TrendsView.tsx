import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { BarChart2, Calendar, Sparkles, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import type { TrendData, TrendDirection } from '@shared/types';

interface TrendsViewProps {
  localOnly: boolean;
  refreshTrigger: number;
}

interface LocalEntry {
  mood: number;
  emotions: string[];
  tags: string[];
  date: string;
}

// Client-side replication of trends engine for local-only privacy fallback
function calculateLocalTrends(entries: LocalEntry[]): TrendData {
  const totalEntries = entries.length;
  if (totalEntries === 0) {
    return {
      averageMood: 0,
      moodTrendDirection: 'insufficient_data',
      emotionFrequencies: {},
      tagFrequencies: {},
      correlations: [],
      totalEntries: 0,
    };
  }

  const totalMood = entries.reduce((sum, e) => sum + e.mood, 0);
  const averageMood = Math.round((totalMood / totalEntries) * 10) / 10;

  let moodTrendDirection: TrendDirection = 'stable';
  if (totalEntries >= 4) {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const half = Math.floor(sorted.length / 2);
    const firstHalfAvg = sorted.slice(0, half).reduce((sum, e) => sum + e.mood, 0) / half;
    const secondHalfAvg =
      sorted.slice(half).reduce((sum, e) => sum + e.mood, 0) / (sorted.length - half);
    const diff = secondHalfAvg - firstHalfAvg;
    if (diff > 0.25) moodTrendDirection = 'improving';
    else if (diff < -0.25) moodTrendDirection = 'declining';
  } else {
    moodTrendDirection = 'insufficient_data';
  }

  const emotionFrequencies: Record<string, number> = {};
  const tagFrequencies: Record<string, number> = {};

  for (const entry of entries) {
    for (const emo of entry.emotions) {
      emotionFrequencies[emo] = (emotionFrequencies[emo] || 0) + 1;
    }
    for (const tag of entry.tags) {
      tagFrequencies[tag] = (tagFrequencies[tag] || 0) + 1;
    }
  }

  const lowMoodEntries = entries.filter((e) => e.mood <= 2);
  const correlations: string[] = [];

  if (lowMoodEntries.length > 0) {
    const lowTags: Record<string, number> = {};
    const lowEmos: Record<string, number> = {};

    for (const e of lowMoodEntries) {
      for (const t of e.tags) lowTags[t] = (lowTags[t] || 0) + 1;
      for (const em of e.emotions) lowEmos[em] = (lowEmos[em] || 0) + 1;
    }

    const sortedTags = Object.entries(lowTags).sort((a, b) => b[1] - a[1]);
    const sortedEmos = Object.entries(lowEmos).sort((a, b) => b[1] - a[1]);

    if (sortedTags.length > 0) {
      const [tag, count] = sortedTags[0];
      const pct = Math.round((count / lowMoodEntries.length) * 100);
      if (pct >= 40)
        correlations.push(
          `Your lower-mood days seem to frequently co-occur with topics related to "${tag.replace('_', ' ')}" (${pct}% of low mood days).`
        );
    }
    if (sortedEmos.length > 0) {
      const [emo, count] = sortedEmos[0];
      const pct = Math.round((count / lowMoodEntries.length) * 100);
      if (pct >= 45)
        correlations.push(
          `When your mood is low, you often describe feeling "${emo}" (${pct}% of these days).`
        );
    }
    if (correlations.length === 0 && sortedTags.length > 0) {
      correlations.push(
        `There is a subtle co-occurrence pattern between lower mood and "${sortedTags[0][0].replace('_', ' ')}".`
      );
    }
  }

  if (correlations.length === 0) {
    correlations.push(
      "We haven't detected any low-mood clusters yet. Continue prioritizing sleep and regular study breaks!"
    );
  }

  return {
    averageMood,
    moodTrendDirection,
    emotionFrequencies,
    tagFrequencies,
    correlations,
    totalEntries,
  };
}

export default function TrendsView({ localOnly, refreshTrigger }: TrendsViewProps) {
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [historyList, setHistoryList] = useState<LocalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (localOnly) {
      try {
        const localData = localStorage.getItem('local_entries');
        const parsed: LocalEntry[] = localData ? JSON.parse(localData) : [];
        setHistoryList(parsed);
        const computed = calculateLocalTrends(parsed);
        setTrends(computed);
      } catch (e) {
        console.error('Failed to parse local entries:', e);
      } finally {
        setLoading(false);
      }
    } else {
      // Cloud sync mode
      try {
        const response = await fetch('/api/trends');
        const data = await response.json();
        if (response.ok && data.trends) {
          setTrends(data.trends);
          // To be robust, let's fetch local fallback if cloud is empty
        }
      } catch (err) {
        console.error('Fetch trends error:', err);
        // Fallback to local entries if api fails
        const localData = localStorage.getItem('local_entries');
        const parsed = localData ? JSON.parse(localData) : [];
        setTrends(calculateLocalTrends(parsed));
      } finally {
        setLoading(false);
      }
    }
  }, [localOnly]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="animate-spin text-brand-500" size={32} />
        <p className="text-sm text-slate-500">Aggregating check-ins and compiling trends...</p>
      </div>
    );
  }

  const total = trends?.totalEntries || 0;

  if (total === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4 space-y-4 animate-fade-in">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <BarChart2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">No Trends Available Yet</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Log a mood check-in or journal entry on the <strong>Today</strong> tab. Once you begin
          logging, we will plot your mood over time and surface co-occurring triggers.
        </p>
      </div>
    );
  }

  // Formatting frequencies data for recharts
  const emotionsChartData = Object.entries(trends?.emotionFrequencies || {})
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const tagsChartData = Object.entries(trends?.tagFrequencies || {})
    .map(([name, value]) => ({ name: name.replace('_', ' '), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Generate data for Line chart.
  // In cloud mode we use entries, in local mode we use historyList.
  // Let's create dummy dates or sort actual dates for the timeline.
  const chartTimeline = historyList
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((h) => ({
      date: h.date.substring(5), // MM-DD format
      mood: h.mood,
    }));

  // Month grid values helper (30 squares representing recent mood history)
  const gridEntries = [...historyList].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  const moodColorMap = (mood: number) => {
    switch (mood) {
      case 1:
        return 'bg-slate-700 hover:scale-105'; // low unpleasant
      case 2:
        return 'bg-rose-300 hover:scale-105'; // high unpleasant
      case 3:
        return 'bg-slate-200 hover:scale-105'; // neutral
      case 4:
        return 'bg-teal-300 hover:scale-105'; // low pleasant
      case 5:
        return 'bg-indigo-300 hover:scale-105'; // high pleasant
      default:
        return 'bg-slate-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Your Study Well-being Trends</h1>
          <p className="text-xs text-slate-500">
            Insights and co-occurrences compiled in code from your logs
          </p>
        </div>
        <button
          onClick={loadData}
          className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all"
          title="Refresh trends"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Average Mood Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Average Mood
          </span>
          <div className="flex items-baseline gap-2 py-2">
            <span className="text-4xl font-extrabold text-slate-800">{trends?.averageMood}</span>
            <span className="text-sm text-slate-400 font-semibold">/ 5</span>
          </div>
          <span className="text-xs text-slate-500">Based on {total} check-ins.</span>
        </div>

        {/* Trend Indicator Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Mood Trend
          </span>
          <div className="py-2 flex items-center gap-2">
            {trends?.moodTrendDirection === 'improving' && (
              <div className="flex items-center gap-1.5 text-teal-600 font-bold text-lg">
                <TrendingUp size={24} />
                <span>Improving</span>
              </div>
            )}
            {trends?.moodTrendDirection === 'declining' && (
              <div className="flex items-center gap-1.5 text-rose-600 font-bold text-lg">
                <TrendingDown size={24} />
                <span>Declining</span>
              </div>
            )}
            {trends?.moodTrendDirection === 'stable' && (
              <div className="flex items-center gap-1.5 text-slate-600 font-bold text-lg">
                <span>Stable</span>
              </div>
            )}
            {trends?.moodTrendDirection === 'insufficient_data' && (
              <span className="text-sm text-slate-500 font-semibold italic">
                Awaiting more logs...
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">Needs 4+ entries to compute.</span>
        </div>

        {/* Local Storage Indicator */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Data Location
          </span>
          <div className="py-2">
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full uppercase tracking-wider">
              {localOnly ? 'Local Device' : 'Cloud Sync'}
            </span>
          </div>
          <span className="text-xs text-slate-500">Wipeable anytime from Resources page.</span>
        </div>
      </div>

      {/* Mood Over Time Line Chart */}
      {chartTimeline.length >= 2 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Mood Over Time</h3>
          <div className="h-48 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartTimeline} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#94a3b8" />
                <ChartTooltip />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly grid and correlations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Month grid */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Calendar size={18} className="text-indigo-500" />
            <span>Recent Check-in Colors (Max 30)</span>
          </h3>

          <div className="flex flex-wrap gap-2.5 pt-2">
            {gridEntries.length > 0 ? (
              gridEntries.map((e, idx) => (
                <div
                  key={idx}
                  className={`w-7 h-7 rounded-lg cursor-help transition-all shadow-xs ${moodColorMap(e.mood)}`}
                  title={`Date: ${e.date}, Mood: ${e.mood}/5`}
                />
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No entry grid data.</span>
            )}
          </div>

          {/* Color legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-500 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-indigo-300" />
              <span>High Pleasant (5)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-teal-300" />
              <span>Low Pleasant (4)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-slate-200" />
              <span>Neutral (3)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-rose-300" />
              <span>High Unpleasant (2)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-slate-700" />
              <span>Low Unpleasant (1)</span>
            </div>
          </div>
        </div>

        {/* Trigger Correlations */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Sparkles size={18} className="text-brand-500" />
            <span>Stressor Patterns (Computed in Code)</span>
          </h3>

          <div className="space-y-3 pt-1">
            {trends?.correlations && trends.correlations.length > 0 ? (
              trends.correlations.map((statement, idx) => (
                <div
                  key={idx}
                  className="bg-brand-50/50 border border-brand-100 p-3.5 rounded-2xl text-xs text-brand-900 leading-relaxed font-medium"
                >
                  {statement}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">
                Insufficient logs to compute co-occurrence stressors.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Frequencies Bar Charts */}
      {emotionsChartData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Top Emotions */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Top Emotions Logged</h3>
            <div className="h-40 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={emotionsChartData}
                  layout="vertical"
                  margin={{ left: -10, right: 10, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                  <ChartTooltip />
                  <Bar dataKey="value" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Triggers */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Top Triggers Logged</h3>
            <div className="h-40 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tagsChartData}
                  layout="vertical"
                  margin={{ left: -10, right: 10, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                  <ChartTooltip />
                  <Bar dataKey="value" fill="#2dd4bf" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
