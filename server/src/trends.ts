export interface TrendSummary {
  averageMood: number;
  moodTrendDirection: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  emotionFrequencies: Record<string, number>;
  tagFrequencies: Record<string, number>;
  correlations: string[];
  totalEntries: number;
}

interface EntryLike {
  mood: number;
  emotions: string[];
  tags: string[];
  date: string;
}

/**
 * Calculates a summary of emotional and trigger trends from list of entries.
 */
export function calculateTrends(entries: EntryLike[]): TrendSummary {
  const totalEntries = entries.length;
  
  if (totalEntries === 0) {
    return {
      averageMood: 0,
      moodTrendDirection: 'insufficient_data',
      emotionFrequencies: {},
      tagFrequencies: {},
      correlations: [],
      totalEntries: 0
    };
  }

  // 1. Average Mood
  const totalMood = entries.reduce((sum, e) => sum + e.mood, 0);
  const averageMood = Math.round((totalMood / totalEntries) * 10) / 10;

  // 2. Trend Direction (comparing first half vs second half sorted by date)
  let moodTrendDirection: 'improving' | 'declining' | 'stable' | 'insufficient_data' = 'stable';
  if (totalEntries >= 4) {
    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const half = Math.floor(sortedEntries.length / 2);
    const firstHalfAvg = sortedEntries.slice(0, half).reduce((sum, e) => sum + e.mood, 0) / half;
    const secondHalfAvg = sortedEntries.slice(half).reduce((sum, e) => sum + e.mood, 0) / (sortedEntries.length - half);

    const diff = secondHalfAvg - firstHalfAvg;
    if (diff > 0.25) {
      moodTrendDirection = 'improving';
    } else if (diff < -0.25) {
      moodTrendDirection = 'declining';
    } else {
      moodTrendDirection = 'stable';
    }
  } else {
    moodTrendDirection = 'insufficient_data';
  }

  // 3. Frequencies
  const emotionFrequencies: Record<string, number> = {};
  const tagFrequencies: Record<string, number> = {};

  for (const entry of entries) {
    for (const emotion of entry.emotions) {
      emotionFrequencies[emotion] = (emotionFrequencies[emotion] || 0) + 1;
    }
    for (const tag of entry.tags) {
      tagFrequencies[tag] = (tagFrequencies[tag] || 0) + 1;
    }
  }

  // 4. Low Mood (mood <= 2) co-occurrence analysis
  const lowMoodEntries = entries.filter(e => e.mood <= 2);
  const correlations: string[] = [];

  if (lowMoodEntries.length > 0) {
    const lowMoodTags: Record<string, number> = {};
    const lowMoodEmotions: Record<string, number> = {};

    for (const entry of lowMoodEntries) {
      for (const tag of entry.tags) {
        lowMoodTags[tag] = (lowMoodTags[tag] || 0) + 1;
      }
      for (const emotion of entry.emotions) {
        lowMoodEmotions[emotion] = (lowMoodEmotions[emotion] || 0) + 1;
      }
    }

    // Sort tags and emotions by their frequency in low mood entries
    const sortedLowTags = Object.entries(lowMoodTags)
      .sort((a, b) => b[1] - a[1]);
    const sortedLowEmotions = Object.entries(lowMoodEmotions)
      .sort((a, b) => b[1] - a[1]);

    const formatTagName = (tag: string) => tag.replace('_', ' ');

    // Compile 1-2 hedged co-occurrence pattern statements
    if (sortedLowTags.length > 0) {
      const [topTag, count] = sortedLowTags[0];
      const percentage = Math.round((count / lowMoodEntries.length) * 100);
      if (percentage >= 40) {
        correlations.push(
          `Your lower-mood days seem to frequently co-occur with topics related to "${formatTagName(topTag)}" (${percentage}% of low mood days).`
        );
      }
    }

    if (sortedLowEmotions.length > 0) {
      const [topEmotion, count] = sortedLowEmotions[0];
      const percentage = Math.round((count / lowMoodEntries.length) * 100);
      if (percentage >= 45) {
        correlations.push(
          `When your mood is low, you often describe feeling "${topEmotion}" (${percentage}% of these days).`
        );
      }
    }
    
    // Fallback simple correlation if we have low mood entries but none hit the threshold
    if (correlations.length === 0 && sortedLowTags.length > 0) {
      const topTag = sortedLowTags[0][0];
      correlations.push(
        `There is a subtle co-occurrence pattern between lower mood and "${formatTagName(topTag)}".`
      );
    }
  }

  // Ensure we always return at least an encouraging statement if there are no low-mood entries
  if (correlations.length === 0) {
    correlations.push("We haven't detected any low-mood clusters. Keep taking regular breaks during your study sessions!");
  }

  return {
    averageMood,
    moodTrendDirection,
    emotionFrequencies,
    tagFrequencies,
    correlations,
    totalEntries
  };
}
