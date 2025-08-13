import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { User } from "firebase/auth";
import { Save } from "lucide-react";

interface LogEntryProps {
  user: User | null;
}

interface Entry {
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

function LogEntry({ user }: LogEntryProps) {
  const today = new Date().toISOString().split("T")[0];
  const [entry, setEntry] = useState<Entry>({
    date: today,
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!entry.date) newErrors.date = "Date is required";
    if (
      entry.sleep &&
      (parseFloat(entry.sleep) < 0 || parseFloat(entry.sleep) > 24)
    )
      newErrors.sleep = "Sleep must be between 0 and 24 hours";
    if (entry.steps && parseInt(entry.steps) < 0)
      newErrors.steps = "Steps cannot be negative";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setEntry({ ...entry, [name]: value });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSymptomToggle = (symptom: string) => {
    setEntry((prev) => {
      const symptoms = prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom];
      return { ...prev, symptoms };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to save entries.");
      return;
    }
    if (!validateForm()) {
      alert("Please fix form errors before submitting.");
      return;
    }
    try {
      await addDoc(collection(db, `users/${user.uid}/entries`), {
        ...entry,
        timestamp: new Date(),
      });
      alert("Entry saved!");
      setEntry({
        date: today,
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
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-4xl font-bold text-royal-blue text-center tracking-tight flex items-center justify-center space-x-2">
        <Save size={28} />
        <span>Log Entry</span>
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 space-y-6"
      >
        <div>
          <label className="block text-royal-blue font-semibold mb-2">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={entry.date}
            onChange={handleChange}
            className={`w-full border p-3 rounded-lg focus:ring-2 transition-all duration-200 ${
              errors.date
                ? "border-red-500"
                : "border-gray-200 focus:ring-sky-500 focus:border-sky-500"
            }`}
            required
          />
          {errors.date && (
            <p className="text-red-500 text-sm mt-1">{errors.date}</p>
          )}
        </div>
        <div>
          <label className="block text-royal-blue font-semibold mb-2">
            Flow
          </label>
          <select
            name="flow"
            value={entry.flow}
            onChange={handleChange}
            className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
          >
            <option value="None">None</option>
            <option value="Light">Light</option>
            <option value="Medium">Medium</option>
            <option value="Heavy">Heavy</option>
          </select>
        </div>
        <div>
          <label className="block text-royal-blue font-semibold mb-2">
            Symptoms
          </label>
          <div className="grid grid-cols-2 gap-4">
            {symptoms.map((symptom) => (
              <label key={symptom} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={entry.symptoms.includes(symptom)}
                  onChange={() => handleSymptomToggle(symptom)}
                  className="h-5 w-5 text-sky-500 focus:ring-sky-500 border-gray-200 rounded"
                />
                <span className="text-gray-700">{symptom}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-royal-blue font-semibold mb-2">
            Mood
          </label>
          <input
            type="text"
            name="mood"
            value={entry.mood}
            onChange={handleChange}
            placeholder="How are you feeling?"
            className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-royal-blue font-semibold mb-2">
            Sleep Hours
          </label>
          <input
            type="number"
            name="sleep"
            value={entry.sleep}
            onChange={handleChange}
            placeholder="Hours slept"
            className={`w-full border p-3 rounded-lg focus:ring-2 transition-all duration-200 ${
              errors.sleep
                ? "border-red-500"
                : "border-gray-200 focus:ring-sky-500 focus:border-sky-500"
            }`}
          />
          {errors.sleep && (
            <p className="text-red-500 text-sm mt-1">{errors.sleep}</p>
          )}
        </div>
        <div>
          <label className="block text-royal-blue font-semibold mb-2">
            Steps
          </label>
          <input
            type="number"
            name="steps"
            value={entry.steps}
            onChange={handleChange}
            placeholder="Number of steps"
            className={`w-full border p-3 rounded-lg focus:ring-2 transition-all duration-200 ${
              errors.steps
                ? "border-red-500"
                : "border-gray-200 focus:ring-sky-500 focus:border-sky-500"
            }`}
          />
          {errors.steps && (
            <p className="text-red-500 text-sm mt-1">{errors.steps}</p>
          )}
        </div>
        <div>
          <label className="block text-royal-blue font-semibold mb-2">
            Exercise
          </label>
          <input
            type="text"
            name="exercise"
            value={entry.exercise}
            onChange={handleChange}
            placeholder="Exercise description"
            className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
          />
        </div>
        <div>
          <label className="block text-royal-blue font-semibold mb-2">
            Diet
          </label>
          <textarea
            name="diet"
            value={entry.diet}
            onChange={handleChange}
            placeholder="Diet notes"
            className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
            rows={3}
          ></textarea>
        </div>
        <div>
          <label className="block text-royal-blue font-semibold mb-2">
            Cervical Fluid
          </label>
          <select
            name="cervical"
            value={entry.cervical}
            onChange={handleChange}
            className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
          >
            <option value="">Select fluid type</option>
            <option value="Dry">Dry</option>
            <option value="Sticky">Sticky</option>
            <option value="Creamy">Creamy</option>
            <option value="Egg White">Egg White</option>
          </select>
        </div>
        <div>
          <label className="block text-royal-blue font-semibold mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={entry.notes ?? ""}
            onChange={handleChange}
            placeholder="Additional notes"
            className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
            rows={3}
            maxLength={500}
            aria-describedby="notes-hint"
          ></textarea>
          <p id="notes-hint" className="text-xs text-gray-500 mt-1">
            {(entry.notes ?? "").length}/500 characters
          </p>
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-royal-blue to-blue-600 text-white py-3 rounded-lg hover:scale-105 transition-transform duration-200 flex items-center justify-center space-x-2"
        >
          <Save size={20} />
          <span>Save Entry</span>
        </button>
      </form>
    </div>
  );
}

export default LogEntry;
