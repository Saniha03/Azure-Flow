import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { db } from "../firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Edit, CalendarIcon } from "lucide-react";

interface HomeProps {
  user: User | null;
}

interface CycleStats {
  avgCycleLength: number | null;
  avgPeriodDuration: number | null;
  nextPeriod: string | null;
  nextOvulation: string | null;
}

function Home({ user }: HomeProps) {
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString());
  const [cycleStats, setCycleStats] = useState<CycleStats>({
    avgCycleLength: null,
    avgPeriodDuration: null,
    nextPeriod: null,
    nextOvulation: null,
  });
  const [healthTip, setHealthTip] = useState<string>("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCycleStats = async () => {
      if (user) {
        try {
          const q = query(collection(db, `users/${user.uid}/entries`));
          const querySnapshot = await getDocs(q);
          const entries = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date(),
          }));

          const periodDates = entries
            .filter((entry) => entry.flow !== "None")
            .map((entry) => new Date(entry.date))
            .sort((a, b) => a.getTime() - b.getTime());

          if (periodDates.length < 2) {
            setCycleStats({
              avgCycleLength: null,
              avgPeriodDuration: null,
              nextPeriod: null,
              nextOvulation: null,
            });
            return;
          }

          const cycleLengths: number[] = [];
          for (let i = 1; i < periodDates.length; i++) {
            const diff =
              (periodDates[i].getTime() - periodDates[i - 1].getTime()) /
              (1000 * 60 * 60 * 24);
            cycleLengths.push(diff);
          }
          const avgCycleLength = cycleLengths.length
            ? Math.round(
                cycleLengths.reduce((sum, len) => sum + len, 0) /
                  cycleLengths.length
              )
            : 28;

          const periodGroups: Date[][] = [];
          let currentGroup: Date[] = [];
          let prevDate = periodDates[0];
          periodDates.forEach((date) => {
            if (
              !currentGroup.length ||
              (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24) <= 1
            ) {
              currentGroup.push(date);
            } else {
              periodGroups.push(currentGroup);
              currentGroup = [date];
            }
            prevDate = date;
          });
          if (currentGroup.length) periodGroups.push(currentGroup);
          const periodDurations = periodGroups.map((group) => {
            const start = group[0];
            const end = group[group.length - 1];
            return (
              (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1
            );
          });
          const avgPeriodDuration = periodDurations.length
            ? Math.round(
                periodDurations.reduce((sum, dur) => sum + dur, 0) /
                  periodDurations.length
              )
            : 5;

          const lastPeriod = periodDates[periodDates.length - 1];
          const nextPeriodDate = new Date(lastPeriod);
          nextPeriodDate.setDate(lastPeriod.getDate() + avgCycleLength);
          const nextOvulationDate = new Date(nextPeriodDate);
          nextOvulationDate.setDate(nextPeriodDate.getDate() - 14);

          setCycleStats({
            avgCycleLength,
            avgPeriodDuration,
            nextPeriod: nextPeriodDate.toLocaleDateString(),
            nextOvulation: nextOvulationDate.toLocaleDateString(),
          });

          // Random health tip
          const tips = [
            "Stay hydrated during your period!",
            "Light exercise can ease cramps.",
            "Track your mood to notice patterns.",
            "Eat iron-rich foods to boost energy.",
          ];
          setHealthTip(tips[Math.floor(Math.random() * tips.length)]);
        } catch (error) {
          console.error("Error fetching cycle stats:", error);
        }
      }
    };
    fetchCycleStats();
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-4xl font-bold text-royal-blue text-center tracking-tight flex items-center justify-center space-x-2">
        <CalendarIcon size={28} />
        <span>Welcome to AzureFlow💙{user ? `, ${user.displayName}` : ""}</span>
      </h1>
      <p className="text-lg text-gray-600 text-center">
        Track your cycle with ease
      </p>
      <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-royal-blue mb-3">
              Current Time
            </h2>
            <p className="text-3xl font-mono text-gray-800">{time}</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-royal-blue mb-3">
              Next Cycle
            </h2>
            <p className="text-gray-600">
              <strong>Next Period:</strong>{" "}
              {cycleStats.nextPeriod || "Not enough data"}
            </p>
            <p className="text-gray-600">
              <strong>Next Ovulation:</strong>{" "}
              {cycleStats.nextOvulation || "Not enough data"}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-royal-blue mb-3">
            Health Tip
          </h2>
          <p className="text-gray-600 italic">
            {healthTip || "Loading tip..."}
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <Link
            to="/log"
            className="bg-gradient-to-r from-royal-blue to-blue-600 text-white py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <Edit size={20} />
            <span>Log Today’s Entry</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
