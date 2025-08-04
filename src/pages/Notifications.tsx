import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { db } from "../firebase";
import { collection, getDocs, query, updateDoc, doc } from "firebase/firestore";
import { Bell, X, CheckCircle } from "lucide-react";

interface NotificationsProps {
  user: User | null;
}

interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

function Notifications({ user }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const q = query(collection(db, `users/${user.uid}/notifications`));
          const querySnapshot = await getDocs(q);
          const fetchedNotifications = querySnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
              } as Notification)
          );
          setNotifications(fetchedNotifications);
        } catch (error) {
          console.error("Error fetching notifications:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/notifications`, id), {
        read: true,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const clearAll = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, `users/${user.uid}/notifications`));
      const querySnapshot = await getDocs(q);
      const batch = querySnapshot.docs.map((doc) =>
        updateDoc(doc.ref, { read: true })
      );
      await Promise.all(batch);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error clearing notifications:", error);
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
        <Bell size={24} />
        <span>Notifications</span>
      </h1>
      <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-royal-blue">
            Your Notifications
          </h2>
          <button
            onClick={clearAll}
            disabled={notifications.every((n) => n.read)}
            className="bg-gradient-to-r from-royal-blue to-blue-600 text-white py-2 px-4 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
        {notifications.length === 0 ? (
          <p className="text-gray-600 text-center py-6">
            No notifications available.
          </p>
        ) : (
          <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 ${
                  notification.read ? "bg-gray-50" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell size={20} className="text-royal-blue" />
                    <div>
                      <p className="text-gray-800">{notification.message}</p>
                      <p className="text-sm text-gray-500">
                        {notification.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-royal-blue hover:text-blue-700"
                    >
                      <CheckCircle size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;