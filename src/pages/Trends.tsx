import { useState, useEffect } from "react";
import { db } from "../firebase"; // Assuming this is the same as in other files
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { User } from "firebase/auth";
import { TrendingUp, AlertCircle } from "lucide-react";

interface TrendsProps {
  user: User | null;
}

interface Entry {
  id?: string;
  date: string;
  flow: string;
  symptoms: string[];
  sleep: string;
  steps: string;
  exercise: string;
  diet: string;
  cervical: string;
  mood: string;
  notes: string;
  timestamp: Date;
}

interface CycleStats {
  avgCycleLength: number | null;
  avgPeriodDuration: number | null;
  commonSymptoms: { symptom: string; count: number }[];
}

function Trends({ user }: TrendsProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [cycleStats, setCycleStats] = useState<CycleStats>({
    avgCycleLength: null,
    avgPeriodDuration: null,
    commonSymptoms: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchEntries = async () => {
      if (user) {
        setIsLoading(true);
        setError("");
        try {
          const q = query(
            collection(db, `users/${user.uid}/entries`),
            orderBy("date", "asc")
          );
          const querySnapshot = await getDocs(q);
          const fetchedEntries = querySnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
              } as Entry)
          );
          setEntries(fetchedEntries);
          calculateStats(fetchedEntries);
        } catch (err) {
          console.error("Error fetching entries:", err);
          setError("Failed to load your data. Please try again.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("Please sign in to view your trends.");
      }
    };
    fetchEntries();
  }, [user]);

  const calculateStats = (entriesData: Entry[]) => {
    if (entriesData.length < 2) {
      setCycleStats({
        avgCycleLength: null,
        avgPeriodDuration: null,
        commonSymptoms: [],
      });
      return;
    }

    // Sort entries by date (already sorted asc)
    const sortedEntries = [...entriesData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Find period starts and durations
    const periodStarts: Date[] = [];
    const periodDurations: number[] = [];
    let currentPeriodStart: Date | null = null;
    let currentDuration = 0;

    sortedEntries.forEach((entry, index) => {
      const isFlow = entry.flow !== "None";
      if (isFlow) {
        if (!currentPeriodStart) {
          currentPeriodStart = new Date(entry.date);
          if (periodStarts.length > 0) {
            // Calculate cycle length from previous period start
            const prevStart = periodStarts[periodStarts.length - 1];
            const cycleLength =
              (currentPeriodStart.getTime() - prevStart.getTime()) /
              (1000 * 60 * 60 * 24);
            // We don't push yet, as we need full cycles
          }
          periodStarts.push(currentPeriodStart);
        }
        currentDuration++;
      } else {
        if (currentPeriodStart) {
          periodDurations.push(currentDuration);
          currentPeriodStart = null;
          currentDuration = 0;
        }
      }

      // Handle last period if ongoing
      if (index === sortedEntries.length - 1 && currentPeriodStart) {
        periodDurations.push(currentDuration);
      }
    });

    // Calculate avg cycle length (differences between consecutive starts)
    let totalCycleLength = 0;
    let cycleCount = 0;
    for (let i = 1; i < periodStarts.length; i++) {
      const length =
        (periodStarts[i].getTime() - periodStarts[i - 1].getTime()) /
        (1000 * 60 * 60 * 24);
      totalCycleLength += length;
      cycleCount++;
    }
    const avgCycleLength = cycleCount > 0 ? totalCycleLength / cycleCount : null;

    // Avg period duration
    const avgPeriodDuration =
      periodDurations.length > 0
        ? periodDurations.reduce((a, b) => a + b, 0) / periodDurations.length
        : null;

    // Common symptoms
    const symptomCounts: { [key: string]: number } = {};
    entriesData.forEach((entry) => {
      entry.symptoms.forEach((symptom) => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
    });
    const commonSymptoms = Object.entries(symptomCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) // Top 5
      .map(([symptom, count]) => ({ symptom, count }));

    setCycleStats({
      avgCycleLength: avgCycleLength ? Math.round(avgCycleLength) : null,
      avgPeriodDuration: avgPeriodDuration ? Math.round(avgPeriodDuration) : null,
      commonSymptoms,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-royal-blue to-blue-600 text-white p-6 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <TrendingUp size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trends & Insights</h1>
            <p className="text-blue-100 opacity-90">Your health patterns at a glance</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center space-x-2">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cycle Stats Card */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-royal-blue mb-4">Cycle Statistics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Cycle Length</span>
                <span className="font-bold text-royal-blue">
                  {cycleStats.avgCycleLength
                    ? `${cycleStats.avgCycleLength} days`
                    : "Not enough data"}
                </span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Period Duration</span>
                <span className="font-bold text-royal-blue">
                  {cycleStats.avgPeriodDuration
                    ? `${cycleStats.avgPeriodDuration} days`
                    : "Not enough data"}
                </span>
              </div>
            </div>
          </div>

          {/* Common Symptoms Card */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-royal-blue mb-4">Common Symptoms</h2>
            {cycleStats.commonSymptoms.length > 0 ? (
              <ul className="space-y-3">
                {cycleStats.commonSymptoms.map(({ symptom, count }) => (
                  <li key={symptom} className="flex justify-between items-center">
                    <span className="text-gray-600">{symptom}</span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {count} occurrences
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No symptoms logged yet.</p>
            )}
          </div>
        </div>
      )}

      {!error && entries.length < 10 && (
        <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex items-center space-x-2">
          <AlertCircle size={20} />
          <p>Log more entries for accurate trends (at least 2-3 cycles recommended).</p>
        </div>
      )}
    </div>
  );
}

export default Trends;
