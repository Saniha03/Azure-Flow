import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { User } from "firebase/auth";
import { Users, Save } from "lucide-react";

interface PartnerProps {
  user: User | null;
}

function Partner({ user }: PartnerProps) {
  const [partnerEmail, setPartnerEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchPartnerEmail = async () => {
      if (user) {
        const docRef = doc(db, `users/${user.uid}/settings/partner`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPartnerEmail(docSnap.data().email || "");
        }
      }
    };
    fetchPartnerEmail();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage("Please sign in to save partner email.");
      return;
    }
    if (!partnerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partnerEmail)) {
      setMessage("Please enter a valid email address.");
      return;
    }
    try {
      await setDoc(doc(db, `users/${user.uid}/settings/partner`), {
        email: partnerEmail,
      });
      setMessage("Partner email saved successfully!");
    } catch (error) {
      console.error("Error saving partner email:", error);
      setMessage("Failed to save partner email.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-royal-blue text-center flex items-center justify-center space-x-2">
        <Users size={24} />
        <span>Partner Settings</span>
      </h1>
      <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-royal-blue font-medium mb-1">
              Partner's Email Address
            </label>
            <input
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder="Enter partner's email"
              className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-sky focus:border-sky transition"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-button text-white py-3 rounded-lg hover:opacity-90 transition-opacity duration-300 flex items-center justify-center space-x-2"
          >
            <Save size={20} />
            <span>Save Partner Email</span>
          </button>
        </form>
        {message && (
          <p
            className={`mt-4 text-center ${
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

export default Partner;
