import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { User } from "firebase/auth";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Calendar as CalendarIcon,
  Save,
  Trash,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CalendarProps {
  user: User | null;
}

interface CalendarEntry {
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

function CalendarPage({ user }: CalendarProps) {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CalendarEntry>({
    date: new Date().toISOString().split("T")[0],
    flow: "None",
    symptoms: [],
    sleep: "",
    steps: "",
    exercise: "",
    diet: "",
    cervical: "",
    mood: "",
    notes: "",
    timestamp: new Date(),
  });
  const [manualCycleStats, setManualCycleStats] = useState<{
    avgCycleLength: number | null;
    avgPeriodDuration: number | null;
  }>({
    avgCycleLength: null,
    avgPeriodDuration: null,
  });
  const [message, setMessage] = useState<string>("");
  const [tooltip, setTooltip] = useState<{
    date: string;
    entry: CalendarEntry | null;
    x: number;
    y: number;
  } | null>(null);

  const symptoms = [
    "Cramps",
    "Headache",
    "Bloating",
    "Mood Swings",
    "Nausea",
    "Back Pain",
    "Breast Tenderness",
    "Fatigue",
    "Acne",
    "Food Cravings",
    "Insomnia",
    "Anxiety",
  ];

  useEffect(() => {
    const fetchEntries = async () => {
      if (user) {
        const q = query(collection(db, `users/${user.uid}/entries`));
        const querySnapshot = await getDocs(q);
        const fetchedEntries = querySnapshot.docs.map(
          (doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              timestamp: data.timestamp instanceof Date ? data.timestamp : data.timestamp?.toDate?.() || new Date(),
            } as CalendarEntry;
          }
        );
        setEntries(fetchedEntries);
      }
    };
    fetchEntries();

    const fetchManualStats = async () => {
      if (user) {
        const docRef = doc(db, `users/${user.uid}/settings/cycleStats`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setManualCycleStats({
              avgCycleLength: data.avgCycleLength ?? null,
              avgPeriodDuration: data.avgPeriodDuration ?? null,
            }
          );
        }
      }
    };
    fetchManualStats();
  }, [user]);

  const saveManualStats = async () => {
    if (!user) {
      setMessage("Please sign in to save cycle stats.");
      return;
    }

    if (
      !manualCycleStats.avgCycleLength ||
      !manualCycleStats.avgPeriodDuration
    ) {
      setMessage("Please enter both cycle length and period duration.");
      return;
    }

    if (
      manualCycleStats.avgCycleLength < 21 ||
      manualCycleStats.avgCycleLength > 35
    ) {
      setMessage("Cycle length should be between 21-35 days.");
      return;
    }

    try {
      await setDoc(doc(db, `users/${user.uid}/settings/cycleStats`), {
        avgCycleLength: manualCycleStats.avgCycleLength,
        avgPeriodDuration: manualCycleStats.avgPeriodDuration,
      });
      setMessage("Cycle stats saved successfully!");
    } catch (error) {
      console.error("Error saving cycle stats:", error);
      setMessage("Failed to save cycle stats.");
    }
  };

  const calculateCycleStats = (entries: CalendarEntry[]) => {
    if (manualCycleStats.avgCycleLength && manualCycleStats.avgPeriodDuration) {
      const lastPeriod =
        entries
          .filter((entry) => entry.flow !== "None")
          .map((entry) => new Date(entry.date))
          .sort((a, b) => b.getTime() - a.getTime())[0] || new Date();

      const nextPeriodDate = new Date(lastPeriod);
      nextPeriodDate.setDate(
        lastPeriod.getDate() + (manualCycleStats.avgCycleLength ?? 28)
      );
      const nextOvulationDate = new Date(nextPeriodDate);
      nextOvulationDate.setDate(nextPeriodDate.getDate() - 14);

      return {
        avgCycleLength: manualCycleStats.avgCycleLength,
        avgPeriodDuration: manualCycleStats.avgPeriodDuration,
        nextPeriod: nextPeriodDate.toLocaleDateString(),
        nextOvulation: nextOvulationDate.toLocaleDateString(),
      };
    }

    const periodDates = entries
      .filter((entry) => entry.flow !== "None")
      .map((entry) => new Date(entry.date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (periodDates.length < 2) {
      return {
        avgCycleLength: null,
        avgPeriodDuration: null,
        nextPeriod: null,
        nextOvulation: null,
      };
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
          cycleLengths.reduce((sum, len) => sum + len, 0) / cycleLengths.length
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
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
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

    return {
      avgCycleLength,
      avgPeriodDuration,
      nextPeriod: nextPeriodDate.toLocaleDateString(),
      nextOvulation: nextOvulationDate.toLocaleDateString(),
    };
  };

  const cycleStats = calculateCycleStats(entries);

  const getCyclePhase = (
    date: Date,
    entries: CalendarEntry[],
    avgCycleLength: number | null
  ) => {
    if (!avgCycleLength || !manualCycleStats.avgCycleLength) return "";
    const dateString = date.toISOString().split("T")[0];
    const periodEntry = entries.find(
      (entry) => entry.date === dateString && entry.flow !== "None"
    );
    if (periodEntry) return "menstrual";

    const lastPeriod =
      entries
        .filter((entry) => entry.flow !== "None")
        .map((entry) => new Date(entry.date))
        .sort((a, b) => b.getTime() - a.getTime())[0] || new Date();

    const daysSinceLastPeriod = Math.floor(
      (date.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24)
    );
    const cycleDay = daysSinceLastPeriod % manualCycleStats.avgCycleLength;

    if (cycleDay < (manualCycleStats.avgPeriodDuration ?? 5)) return "menstrual";
    if (cycleDay >= (manualCycleStats.avgPeriodDuration ?? 5) && cycleDay < 14)
      return "follicular";
    if (cycleDay >= 14 && cycleDay < 16) return "ovulatory";
    return "luteal";
  };

  const tileClassName = ({ date }: { date: Date }) => {
    const dateString = date.toISOString().split("T")[0];
    const hasEntry = entries.some((entry) => entry.date === dateString);
    const phase = getCyclePhase(date, entries, cycleStats.avgCycleLength);
    if (hasEntry && phase === "menstrual")
      return "bg-red-400 text-white rounded-full";
    if (hasEntry) return "bg-blue-300 text-white rounded-full";
    if (phase === "menstrual") return "bg-red-200 text-white rounded-full";
    if (phase === "follicular") return "bg-blue-200 text-white rounded-full";
    if (phase === "ovulatory") return "bg-green-200 text-white rounded-full";
    if (phase === "luteal") return "bg-yellow-200 text-white rounded-full";
    return "";
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateString = date.toISOString().split("T")[0];
    const entry = entries.find((e) => e.date === dateString) || null;
    setSelectedEntry(entry);
    setFormData(
      entry || {
        date: dateString,
        flow: "None",
        symptoms: [],
        sleep: "",
        steps: "",
        exercise: "",
        diet: "",
        cervical: "",
        mood: "",
        notes: "",
        timestamp: new Date(),
      }
    );
    setIsModalOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSymptomToggle = (symptom: string) => {
    setFormData((prev) => {
      const symptoms = prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom];
      return { ...prev, symptoms };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage("Please sign in to save entries.");
      return;
    }
    try {
      if (selectedEntry && selectedEntry.id) {
        await updateDoc(
          doc(db, `users/${user.uid}/entries`, selectedEntry.id),
          {
            ...formData,
            timestamp: new Date(),
          }
        );
        setMessage("Entry updated successfully!");
      } else {
        await addDoc(collection(db, `users/${user.uid}/entries`), {
          ...formData,
          timestamp: new Date(),
        });
        setMessage("Entry saved successfully!");
      }
      setIsModalOpen(false);
      const q = query(collection(db, `users/${user.uid}/entries`));
      const querySnapshot = await getDocs(q);
      const fetchedEntries = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date(),
          } as CalendarEntry)
      );
      setEntries(fetchedEntries);
    } catch (error) {
      console.error("Error saving entry:", error);
      setMessage("Failed to save entry.");
    }
  };

  const handleDelete = async () => {
    if (!user || !selectedEntry || !selectedEntry.id) {
      return setMessage("Please sign in and select an entry to delete.");
    }
    try {
      await deleteDoc(doc(db, `users/${user.uid}/entries`, selectedEntry.id));
      setEntries(entries.filter((e) => e.id !== selectedEntry.id));
      setSelectedEntry(null);
      setIsModalOpen(false);
      setMessage("Entry deleted successfully!");
    } catch (error) {
      console.error("Error deleting entry:", error);
      setMessage("Failed to delete entry.");
    }
  };

  const handleExport = () => {
    if (!entries.length) {
      setMessage("No entries to export.");
      return;
    }
    const csvContent = [
      "Date,Flow,Symptoms,Mood,Sleep,Steps,Exercise,Diet,Cervical Fluid,Notes",
      ...entries.map((entry) =>
        [
          entry.date,
          entry.flow,
          `"${entry.symptoms.join(", ") || "None"}"`,
          entry.mood || "N/A",
          entry.sleep || "N/A",
          entry.steps || "N/A",
          `"${entry.exercise || "N/A"}"`,
          `"${entry.diet || "N/A"}"`,
          entry.cervical || "N/A",
          `"${entry.notes || "N/A"}"`,
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "azureflow_entries.csv";
    link.click();
    setMessage("Entries exported successfully!");
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 5 + i
  );

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = months.indexOf(e.target.value);
    const newDate = new Date(selectedDate);
    newDate.setMonth(newMonth);
    setSelectedDate(newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newYear);
    setSelectedDate(newDate);
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualCycleStats((prev) => ({
      ...prev,
      [name]: value ? parseInt(value) : null,
    }));
  };

  // Fixed tooltip handlers with proper mouse event handling
  const handleTileMouseEnter = (event: React.MouseEvent, date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    const entry = entries.find((e) => e.date === dateString) || null;
    
    // Get mouse position relative to viewport
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    
    setTooltip({ 
      date: dateString, 
      entry,
      x,
      y
    });
  };

  const handleTileMouseLeave = () => {
    setTooltip(null);
  };

  // Custom tile content to add mouse event handlers
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    
    return (
      <div
        className="w-full h-full absolute inset-0 z-10"
        onMouseEnter={(e) => handleTileMouseEnter(e, date)}
        onMouseLeave={handleTileMouseLeave}
      />
    );
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-royal-blue text-center flex items-center justify-center space-x-2">
        <CalendarIcon size={24} />
        <span>Calendar</span>
      </h1>
      <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              onClick={goToToday}
              className="bg-gradient-to-r from-royal-blue to-blue-600 text-white py-2 px-4 rounded-xl hover:shadow-lg transition-all duration-200"
            >
              Today
            </button>
            <select
              value={months[selectedDate.getMonth()]}
              onChange={handleMonthChange}
              className="border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedDate.getFullYear()}
              onChange={handleYearChange}
              className="border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExport}
            className="bg-gradient-to-r from-royal-blue to-blue-600 text-white py-2 px-4 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2 mt-2 sm:mt-0"
          >
            <Download size={16} />
            <span>Export Entries</span>
          </button>
        </div>
        <div className="max-w-md mx-auto relative">
          <Calendar
            value={selectedDate}
            onClickDay={handleDateClick}
            tileClassName={tileClassName}
            tileContent={tileContent}
            className="border-none rounded-lg"
            prevLabel={<ChevronLeft className="text-royal-blue" />}
            nextLabel={<ChevronRight className="text-royal-blue" />}
            prev2Label={null}
            next2Label={null}
          />
          
          {/* Fixed tooltip positioning and styling */}
          {tooltip && (
            <div 
              className="fixed z-50 bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs pointer-events-none"
              style={{
                left: `${tooltip.x}px`,
                top: `${tooltip.y - 10}px`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <p className="text-sm font-semibold">{new Date(tooltip.date).toLocaleDateString()}</p>
              {tooltip.entry ? (
                <div className="text-xs text-gray-600">
                  <p>
                    <strong>Flow:</strong> {tooltip.entry.flow}
                  </p>
                  <p>
                    <strong>Symptoms:</strong>{" "}
                    {tooltip.entry.symptoms.length > 0 ? tooltip.entry.symptoms.join(", ") : "None"}
                  </p>
                  <p>
                    <strong>Mood:</strong> {tooltip.entry.mood || "N/A"}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-600">No entry</p>
              )}
            </div>
          )}
          
          <style>{`
            .react-calendar {
              width: 100%;
              background: transparent;
            }
            .react-calendar__tile {
              position: relative;
            }
            .react-calendar__tile--active {
              background: #3b82f6 !important;
              color: white;
              border-radius: 9999px;
            }
            .react-calendar__tile--now {
              background: #93c5fd !important;
              border-radius: 9999px;
            }
            .react-calendar__navigation button {
              color: #1e3a8a;
              font-weight: bold;
            }
            .react-calendar__month-view__weekdays {
              color: #1e3a8a;
              font-weight: 600;
            }
          `}</style>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold text-royal-blue mb-2">
            Cycle Phase Legend
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-200 rounded-full"></div>
              <span className="text-gray-600">Menstrual</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-200 rounded-full"></div>
              <span className="text-gray-600">Follicular</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-200 rounded-full"></div>
              <span className="text-gray-600">Ovulatory</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-200 rounded-full"></div>
              <span className="text-gray-600">Luteal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-300 rounded-full"></div>
              <span className="text-gray-600">Entry</span>
            </div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold text-royal-blue mb-2">
            Manual Cycle Settings
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-royal-blue text-sm font-medium mb-1">
                Avg Cycle Length (days)
              </label>
              <input
                type="number"
                name="avgCycleLength"
                value={manualCycleStats.avgCycleLength || ""}
                onChange={handleManualChange}
                min="1"
                max="100"
                className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent"
                placeholder="e.g., 28"
              />
            </div>
            <div>
              <label className="block text-royal-blue text-sm font-medium mb-1">
                Avg Period Duration (days)
              </label>
              <input
                type="number"
                name="avgPeriodDuration"
                value={manualCycleStats.avgPeriodDuration || ""}
                onChange={handleManualChange}
                min="1"
                max="10"
                className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent"
                placeholder="e.g., 5"
              />
            </div>
          </div>
          <button
            onClick={saveManualStats}
            className="bg-gradient-to-r from-royal-blue to-blue-600 text-white py-2 px-4 rounded-xl hover:shadow-lg transition-all duration-200"
          >
            Save Cycle Settings
          </button>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold text-royal-blue mb-2">
            Cycle Summary
          </h2>
          <p className="text-gray-600">
            <strong>Average Cycle Length:</strong>{" "}
            {manualCycleStats.avgCycleLength
              ? `${manualCycleStats.avgCycleLength} days`
              : cycleStats.avgCycleLength
              ? `${cycleStats.avgCycleLength} days`
              : "Not enough data"}
          </p>
          <p className="text-gray-600">
            <strong>Average Period Duration:</strong>{" "}
            {manualCycleStats.avgPeriodDuration
              ? `${manualCycleStats.avgPeriodDuration} days`
              : cycleStats.avgPeriodDuration
              ? `${cycleStats.avgPeriodDuration} days`
              : "Not enough data"}
          </p>
          <p className="text-gray-600">
            <strong>Next Period:</strong>{" "}
            {cycleStats.nextPeriod || "Not enough data"}
          </p>
          <p className="text-gray-600">
            <strong>Next Ovulation:</strong>{" "}
            {cycleStats.nextOvulation || "Not enough data"}
          </p>
        </div>
        {selectedDate && !isModalOpen && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold text-royal-blue mb-2">
              {selectedDate.toLocaleDateString()}
            </h2>
            {selectedEntry ? (
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Flow:</strong> {selectedEntry.flow}
                </p>
                <p>
                  <strong>Symptoms:</strong>{" "}
                  {selectedEntry.symptoms.join(", ") || "None"}
                </p>
                <p>
                  <strong>Mood:</strong> {selectedEntry.mood || "N/A"}
                </p>
                <p>
                  <strong>Sleep:</strong> {selectedEntry.sleep || "N/A"} hours
                </p>
                <p>
                  <strong>Steps:</strong> {selectedEntry.steps || "N/A"}
                </p>
                <p>
                  <strong>Exercise:</strong> {selectedEntry.exercise || "N/A"}
                </p>
                <p>
                  <strong>Diet:</strong> {selectedEntry.diet || "N/A"}
                </p>
                <p>
                  <strong>Cervical Fluid:</strong>{" "}
                  {selectedEntry.cervical || "N/A"}
                </p>
                <p>
                  <strong>Notes:</strong> {selectedEntry.notes || "N/A"}
                </p>
              </div>
            ) : (
              <p className="text-gray-600">No entry for this date.</p>
            )}
          </div>
        )}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-100">
              <h2 className="text-lg font-semibold text-royal-blue mb-4">
                {selectedEntry ? "Edit Entry" : "Add Entry"} for{" "}
                {selectedDate?.toLocaleDateString()}
              </h2>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-royal-blue text-sm font-medium mb-1">
                    Flow
                  </label>
                  <select
                    name="flow"
                    value={formData.flow}
                    onChange={handleFormChange}
                    className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent"
                  >
                    <option value="None">None</option>
                    <option value="Light">Light</option>
                    <option value="Medium">Medium</option>
                    <option value="Heavy">Heavy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-royal-blue text-sm font-medium mb-1">
                    Symptoms
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {symptoms.map((symptom) => (
                      <label
                        key={symptom}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={formData.symptoms.includes(symptom)}
                          onChange={() => handleSymptomToggle(symptom)}
                          className="h-4 w-4 text-royal-blue focus:ring-royal-blue border-gray-200 rounded"
                        />
                        <span className="text-gray-700">{symptom}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-royal-blue text-sm font-medium mb-1">
                    Mood
                  </label>
                  <input
                    type="text"
                    name="mood"
                    value={formData.mood}
                    onChange={handleFormChange}
                    placeholder="How are you feeling?"
                    className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-royal-blue text-sm font-medium mb-1">
                      Sleep Hours
                    </label>
                    <input
                      type="number"
                      name="sleep"
                      value={formData.sleep}
                      onChange={handleFormChange}
                      placeholder="Hours"
                      className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-royal-blue text-sm font-medium mb-1">
                      Steps
                    </label>
                    <input
                      type="number"
                      name="steps"
                      value={formData.steps}
                      onChange={handleFormChange}
                      placeholder="Steps"
                      className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-royal-blue text-sm font-medium mb-1">
                    Exercise
                  </label>
                  <input
                    type="text"
                    name="exercise"
                    value={formData.exercise}
                    onChange={handleFormChange}
                    placeholder="Exercise description"
                    className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-royal-blue text-sm font-medium mb-1">
                    Diet
                  </label>
                  <textarea
                    name="diet"
                    value={formData.diet}
                    onChange={handleFormChange}
                    placeholder="Diet notes"
                    className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent min-h-[80px]"
                    rows={3}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-royal-blue text-sm font-medium mb-1">
                    Cervical Fluid
                  </label>
                  <select
                    name="cervical"
                    value={formData.cervical}
                    onChange={handleFormChange}
                    className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="Dry">Dry</option>
                    <option value="Sticky">Sticky</option>
                    <option value="Creamy">Creamy</option>
                    <option value="Egg White">Egg White</option>
                  </select>
                </div>
                <div>
                  <label className="block text-royal-blue text-sm font-medium mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes ?? ""}
                    onChange={handleFormChange}
                    placeholder="Additional notes"
                    className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent min-h-[80px]"
                    rows={3}
                    maxLength={500}
                    aria-describedby="notes-hint"
                  ></textarea>
                  <p id="notes-hint" className="text-xs text-gray-500 mt-1">
                    {(formData.notes ?? "").length}/500 characters
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-royal-blue to-blue-600 text-white py-2 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Save size={16} />
                    <span>Save</span>
                  </button>
                  {selectedEntry && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 text-white py-2 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <Trash size={16} />
                      <span>Delete</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl hover:bg-gray-300 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Email sharing is unavailable in the free version.
                </p>
              </form>
              {message && (
                <p
                  className={`mt-3 text-center text-sm ${
                    message.includes("successfully")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarPage;
