import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Settings as SettingsIcon, Save,  } from "lucide-react";

interface SettingsProps {
  user: User | null;
}

interface SettingsData {
  partnerEmail: string;
  notifications: {
    dailyReminder: boolean;
    periodReminder: boolean;
    ovulationReminder: boolean;
  };
  displayName: string;
}

function Settings({ user }: SettingsProps) {
  const [settings, setSettings] = useState<SettingsData>({
    partnerEmail: "",
    notifications: {
      dailyReminder: true,
      periodReminder: true,
      ovulationReminder: true,
    },
    displayName: user?.displayName || "",
  });
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const docRef = doc(db, `users/${user.uid}/settings/partner`);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setSettings({
              ...settings,
              partnerEmail: docSnap.data().email || "",
            });
          }
          setSettings((prev) => ({
            ...prev,
            displayName: user.displayName || prev.displayName,
          }));
        } catch (error) {
          console.error("Error fetching settings:", error);
          setMessage("Failed to load settings.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchSettings();
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("notifications.")) {
      const key = name.split(".")[1] as keyof SettingsData["notifications"];
      setSettings((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, [key]: value === "true" },
      }));
    } else {
      setSettings((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage("Please sign in to save settings.");
      return;
    }
    setIsLoading(true);
    try {
      await setDoc(doc(db, `users/${user.uid}/settings/partner`), {
        email: settings.partnerEmail,
      });
      setMessage("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("Failed to save settings.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold text-royal-blue text-center flex items-center justify-center space-x-2">
        <SettingsIcon size={24} />
        <span>Settings</span>
      </h1>
      <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-royal-blue mb-3">
              Partner Email
            </h2>
            <input
              type="email"
              name="partnerEmail"
              value={settings.partnerEmail}
              onChange={handleChange}
              placeholder="Enter partner email"
              className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-royal-blue mb-3">
              Notifications
            </h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="notifications.dailyReminder"
                  checked={settings.notifications.dailyReminder}
                  onChange={handleChange}
                  value={
                    settings.notifications.dailyReminder ? "false" : "true"
                  }
                  className="h-4 w-4 text-royal-blue focus:ring-royal-blue border-gray-200 rounded"
                />
                <span className="text-gray-700">Daily Logging Reminder</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="notifications.periodReminder"
                  checked={settings.notifications.periodReminder}
                  onChange={handleChange}
                  value={
                    settings.notifications.periodReminder ? "false" : "true"
                  }
                  className="h-4 w-4 text-royal-blue focus:ring-royal-blue border-gray-200 rounded"
                />
                <span className="text-gray-700">Period Start Reminder</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="notifications.ovulationReminder"
                  checked={settings.notifications.ovulationReminder}
                  onChange={handleChange}
                  value={
                    settings.notifications.ovulationReminder ? "false" : "true"
                  }
                  className="h-4 w-4 text-royal-blue focus:ring-royal-blue border-gray-200 rounded"
                />
                <span className="text-gray-700">Ovulation Reminder</span>
              </label>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-royal-blue mb-3">
              Account
            </h2>
            <div>
              <label className="block text-royal-blue text-sm font-medium mb-1">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={settings.displayName}
                onChange={handleChange}
                placeholder="Enter display name"
                className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-royal-blue focus:border-transparent"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">
                Display name can be updated via your Google account.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-royal-blue to-blue-600 text-white py-2 px-4 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
            >
              <Save size={16} />
              <span>Save Settings</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setSettings({
                  partnerEmail: "",
                  notifications: {
                    dailyReminder: true,
                    periodReminder: true,
                    ovulationReminder: true,
                  },
                  displayName: user?.displayName || "",
                })
              }
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded-xl hover:bg-gray-300 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
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
  );
}

export default Settings;
