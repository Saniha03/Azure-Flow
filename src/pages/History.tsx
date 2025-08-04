import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { User } from "firebase/auth";
import {
  Download,
  Filter,
  X,
  CalendarIcon,
  Droplet,
  Heart,
  Activity,
} from "lucide-react";

interface HistoryProps {
  user: User | null;
}

interface HistoryEntry {
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

function History({ user }: HistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterSymptom, setFilterSymptom] = useState<string>("");
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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
    const fetchData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const q = query(
            collection(db, `users/${user.uid}/entries`),
            orderBy("date", "desc")
          );
          const querySnapshot = await getDocs(q);
          const entries = querySnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
              } as HistoryEntry)
          );
          setHistory(entries);
        } catch (error) {
          console.error("Error fetching history:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
  }, [user]);

  const getFlowColor = (flow: string): string => {
    switch (flow) {
      case "Light":
        return "bg-pink-200 text-pink-800";
      case "Medium":
        return "bg-pink-400 text-white";
      case "Heavy":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const exportCSV = () => {
    if (!history.length) {
      alert("No entries to export.");
      return;
    }

    const headers = [
      "Date,Flow,Symptoms,Mood,Sleep,Steps,Exercise,Diet,Cervical Fluid,Notes,Timestamp",
    ];
    const csv = [
      headers,
      ...history.map((entry) =>
        [
          entry.date,
          entry.flow,
          `"${entry.symptoms.join(";") || "None"}"`,
          entry.mood || "N/A",
          entry.sleep || "N/A",
          entry.steps || "N/A",
          `"${entry.exercise || "N/A"}"`,
          `"${entry.diet || "N/A"}"`,
          entry.cervical || "N/A",
          `"${entry.notes || "N/A"}"`,
          entry.timestamp.toISOString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `azureflow_history_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = filterSymptom
    ? history.filter((entry) => entry.symptoms.includes(filterSymptom))
    : history;

  const handleEntryClick = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
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
            <CalendarIcon size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Health History
            </h1>
            <p className="text-blue-100 opacity-90">
              Review your wellness journey
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Export */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Filter by symptom:
            </span>
            <select
              value={filterSymptom}
              onChange={(e) => setFilterSymptom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent"
            >
              <option value="">All symptoms</option>
              {symptoms.map((symptom) => (
                <option key={symptom} value={symptom}>
                  {symptom}
                </option>
              ))}
            </select>
            {filterSymptom && (
              <button
                onClick={() => setFilterSymptom("")}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={exportCSV}
            disabled={!history.length}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Export Data</span>
          </button>
        </div>

        {/* History Entries */}
        {filteredHistory.length === 0 ? (
          <p className="text-gray-600 text-center py-6">
            No entries found{filterSymptom ? ` for "${filterSymptom}"` : ""}.
          </p>
        ) : (
          <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredHistory.map((entry) => (
              <div
                key={entry.id}
                onClick={() => handleEntryClick(entry)}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md hover:bg-gray-50 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold text-gray-800">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    {entry.flow !== "None" && entry.flow !== "" && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getFlowColor(
                          entry.flow
                        )}`}
                      >
                        <Droplet size={12} className="inline mr-1" />
                        {entry.flow}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {entry.mood && (
                      <span className="text-sm text-gray-600">
                        <Heart
                          size={14}
                          className="inline mr-1 text-pink-500"
                        />
                        {entry.mood}
                      </span>
                    )}
                    {entry.symptoms.length > 0 && (
                      <span className="text-sm text-gray-600 truncate max-w-xs">
                        {entry.symptoms.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {entry.notes && (
                    <p>
                      {entry.notes.substring(0, 100)}
                      {entry.notes.length > 100 ? "..." : ""}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-2">
                    {entry.sleep && (
                      <span className="flex items-center">
                        <Activity size={14} className="mr-1 text-blue-500" />
                        {entry.sleep} hrs
                      </span>
                    )}
                    {entry.steps && (
                      <span className="flex items-center">
                        <Activity size={14} className="mr-1 text-yellow-500" />
                        {entry.steps} steps
                      </span>
                    )}
                    {entry.exercise && (
                      <span className="flex items-center">
                        <Activity size={14} className="mr-1 text-green-500" />
                        {entry.exercise}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Entry Details */}
      {isModalOpen && selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-royal-blue">
                Entry for {new Date(selectedEntry.date).toLocaleDateString()}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <span className="font-semibold text-gray-700">Flow: </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getFlowColor(
                    selectedEntry.flow
                  )}`}
                >
                  {selectedEntry.flow || "None"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Symptoms: </span>
                {selectedEntry.symptoms.length
                  ? selectedEntry.symptoms.join(", ")
                  : "None"}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Mood: </span>
                {selectedEntry.mood || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Sleep: </span>
                {selectedEntry.sleep || "N/A"} hours
              </div>
              <div>
                <span className="font-semibold text-gray-700">Steps: </span>
                {selectedEntry.steps || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Exercise: </span>
                {selectedEntry.exercise || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Diet: </span>
                {selectedEntry.diet || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  Cervical Fluid:{" "}
                </span>
                {selectedEntry.cervical || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Notes: </span>
                {selectedEntry.notes || "N/A"}
              </div>
              <div>
                <span className="font-semibold text-gray-700">Timestamp: </span>
                {selectedEntry.timestamp.toLocaleString()}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gradient-to-r from-royal-blue to-blue-600 text-white py-2 px-4 rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
