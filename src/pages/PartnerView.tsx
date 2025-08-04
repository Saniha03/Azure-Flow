import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const PartnerView = () => {
  const [entries, setEntries] = useState([]);
  const [email, setEmail] = useState("");

  const fetchEntries = async () => {
    const q = query(
      collection(db, "users"),
      where("shared_entries.partner_email", "==", email)
    );
    const querySnapshot = await getDocs(q);
    const sharedEntries = [];
    querySnapshot.forEach((doc) => {
      doc.data().shared_entries.forEach((entry) => {
        if (entry.partner_email === email) sharedEntries.push(entry.entry);
      });
    });
    setEntries(sharedEntries);
  };

  useEffect(() => {
    if (email) fetchEntries();
  }, [email]);

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <button onClick={fetchEntries}>Load Entries</button>
      {entries.map((entry, index) => (
        <div key={index}>
          <p>Date: {entry.date}</p>
          <p>Flow: {entry.flow}</p>
          {/* Add more fields as needed */}
        </div>
      ))}
    </div>
  );
};

export default PartnerView;
