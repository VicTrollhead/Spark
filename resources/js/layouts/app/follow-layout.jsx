import { motion } from 'framer-motion';
import { UserCheck, Users } from 'lucide-react';
import { useState } from 'react';

export default function FollowLayout({ children }) {
    const [activeTab, setActiveTab] = useState('followers');

    const tabs = [
        { key: 'followers', label: 'Followers', icon: <Users className="h-5 w-5" /> },
        { key: 'following', label: 'Following', icon: <UserCheck className="h-5 w-5" /> },
    ];

    return (
        <div className="flex h-full">
            <div className="flex w-1/4 min-w-[180px] flex-col space-y-2 border-r border-gray-700 p-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 rounded-md px-4 py-3 text-white transition ${
                            activeTab === tab.key ? 'bg-blue-500' : 'hover:bg-gray-800'
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="flex-1 p-6"
            >
                {children(activeTab)}
            </motion.div>
        </div>
    );
}
