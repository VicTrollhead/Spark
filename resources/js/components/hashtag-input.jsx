import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

export const HashtagInput = forwardRef(function HashtagInput({ onChange, placeholder }, ref) {
    const [tags, setTags] = useState([]);
    const [input, setInput] = useState('');

    const addTag = (tag) => {
        const clean = tag.trim().replace(/^#/, '');
        if (clean && !tags.includes(clean)) {
            const newTags = [...tags, clean];
            setTags(newTags);
            onChange?.(newTags);
        }
    };

    const removeTag = (index) => {
        const newTags = tags.filter((_, i) => i !== index);
        setTags(newTags);
        onChange?.(newTags);
    };

    useImperativeHandle(ref, () => ({
        reset: () => {
            setTags([]);
            setInput('');
            onChange?.([]);
        },
    }));

    const handleKeyDown = (e) => {
        if (['Enter', ' ', ','].includes(e.key)) {
            e.preventDefault();
            if (input.trim()) {
                addTag(input);
                setInput('');
            }
        }
    };

    return (
        <div className="flex w-full flex-wrap items-center gap-2 rounded-md  bg-gray-100 p-1.5 text-neutral-900 transition-colors focus-within:ring-2 focus-within:ring-blue-500 dark:bg-neutral-900 dark:text-white dark:focus-within:ring-blue-600">
            {tags.map((tag, index) => (
                <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 bg-zinc-200 px-2 py-1 text-sm text-black dark:bg-zinc-800 dark:text-white"
                >
                    #{tag}
                    <button type="button" onClick={() => removeTag(index)} className="transition hover:text-red-500">
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
            <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="placeholder:text-muted-foreground flex-1 border-none bg-transparent text-sm text-black shadow-none outline-none dark:text-white"
            />
        </div>
    );
});
