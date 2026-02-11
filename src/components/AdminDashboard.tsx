import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';

export default function AdminDashboard() {
    const [waitlist, setWaitlist] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            // Simple client-side check, Firestore rules handle real security
            auth.onAuthStateChanged(user => {
                if (!user) navigate('/admin');
                else fetchData();
            });
        };

        const fetchData = async () => {
            try {
                const waitlistQuery = query(collection(db, 'waitlist'), orderBy('timestamp', 'desc'));
                const contactQuery = query(collection(db, 'contact'), orderBy('timestamp', 'desc'));

                const [waitlistSnap, contactSnap] = await Promise.all([
                    getDocs(waitlistQuery),
                    getDocs(contactQuery)
                ]);

                setWaitlist(waitlistSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setContacts(contactSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (e) {
                console.error("Error fetching data:", e);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [navigate]);

    const handleLogout = () => {
        signOut(auth);
        navigate('/admin');
    };

    if (loading) return <div className="p-8 text-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-transparent p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Admin Dashboard
                    </h1>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                        Logout
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Waitlist Section */}
                    <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
                        <h2 className="text-xl font-semibold text-white mb-4">Waitlist ({waitlist.length})</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-gray-300">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="py-2">Email</th>
                                        <th className="py-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {waitlist.map(item => (
                                        <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                            <td className="py-2">{item.email}</td>
                                            <td className="py-2 text-sm text-gray-400">
                                                {item.timestamp?.toDate?.().toLocaleDateString() || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
                        <h2 className="text-xl font-semibold text-white mb-4">Messages ({contacts.length})</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-gray-300">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="py-2">Email</th>
                                        <th className="py-2">Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contacts.map(item => (
                                        <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                            <td className="py-2 font-medium">{item.email}</td>
                                            <td className="py-2 text-sm text-gray-400 truncate max-w-xs" title={JSON.stringify(item)}>
                                                {item.idea || 'See details...'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
