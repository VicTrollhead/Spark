import { useState } from "react";

export default function HashtagInput({ onChange }) {
    const [input, setInput] = useState("");
    const [hashtags, setHashtags] = useState([]);

    const handleKeyDown = (e) => {
        if (["Enter", ",", " "].includes(e.key)) {
            e.preventDefault();
            addTag(input.trim());
        }
    };

    const addTag = (tag) => {
        if (!tag) return;
        const formatted = tag.startsWith("#") ? tag : `#${tag}`;
        const lower = formatted.toLowerCase();

        if (!hashtags.includes(lower)) {
            const updated = [...hashtags, lower];
            setHashtags(updated);
            onChange(updated);
        }

        setInput("");
    };

    const removeTag = (tagToRemove) => {
        const updated = hashtags.filter(tag => tag !== tagToRemove);
        setHashtags(updated);
        onChange(updated);
    };

    return (
        <div className="flex flex-wrap items-center gap-2 border p-2 rounded bg-gray-100 dark:bg-neutral-900">
            {hashtags.map((tag, i) => (
                <div key={i} className="bg-blue-200 text-blue-800 px-2 py-1 rounded flex items-center">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-2 text-red-500">&times;</button>
                </div>
            ))}
            <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add hashtags..."
                className="flex-grow bg-transparent outline-none text-sm text-black dark:text-white"
            />
        </div>
    );
}
