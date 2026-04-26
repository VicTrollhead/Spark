import React, { useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ImageIcon, SendIcon, X } from 'lucide-react';

export default function MessageInput({ chatId, otherUserId, groupChatId, onTyping, onChatCreated }) {
    const { translations } = usePage().props;
    const [message, setMessage] = useState('');
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const clearInput = () => {
        setMessage('');
        setFiles([]);
        setPreviews([]);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if ((message.trim() === '' && files.length === 0) || isSending) {
            return;
        }

        const text = message;
        const mediaFiles = [...files];
        const hasMedia = mediaFiles.length > 0;

        clearInput();
        setIsSending(true);

        if (hasMedia) {
            const formData = new FormData();
            formData.append('text', text);

            if (groupChatId) {
                formData.append('groupChatId', groupChatId);
                mediaFiles.forEach((file) => formData.append('media[]', file));

                fetch('/chat/group/post-message', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                        'Accept': 'application/json',
                    },
                    body: formData,
                })
                    .catch((err) => {
                        console.error('Message send failed:', err);
                        setMessage(text);
                    })
                    .finally(() => setIsSending(false));
            } else {
                // Direct chat - use chatId or otherUserId for lazy creation
                if (chatId) {
                    formData.append('chatId', chatId);
                } else if (otherUserId) {
                    formData.append('otherUserId', otherUserId);
                }
                mediaFiles.forEach((file) => formData.append('media[]', file));

                fetch('/chat/user-chat/post-message', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                        'Accept': 'application/json',
                    },
                    body: formData,
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.chat_id && !chatId && onChatCreated) {
                            onChatCreated(data.chat_id);
                        }
                    })
                    .catch((err) => {
                        console.error('Message send failed:', err);
                        setMessage(text);
                    })
                    .finally(() => setIsSending(false));
            }
        } else {
            // Text-only messages
            const options = {
                preserveScroll: true,
                onFinish: () => setIsSending(false),
                onError: () => {
                    setMessage(text);
                    setIsSending(false);
                },
            };

            if (groupChatId) {
                router.post('/chat/group/post-message', { groupChatId, text }, options);
            } else if (!chatId && !otherUserId) {
                // Everyone chat
                router.post('/chat/message', { text }, options);
            } else if (chatId) {
                router.post('/chat/user-chat/post-message', { chatId, text }, options);
            } else if (otherUserId) {
                // Lazy creation: send with otherUserId, get chat_id back
                fetch('/chat/user-chat/post-message', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ otherUserId, text }),
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.chat_id && onChatCreated) {
                            onChatCreated(data.chat_id);
                        }
                    })
                    .catch((err) => {
                        console.error('Message send failed:', err);
                        setMessage(text);
                    })
                    .finally(() => setIsSending(false));
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            sendMessage(e);
        }
    };

    const handleChange = (e) => {
        const el = e.target;
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
        setMessage(el.value);

        if (onTyping && el.value.trim()) {
            if (!typingTimeoutRef.current) {
                onTyping();
            }
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                typingTimeoutRef.current = null;
            }, 2000);
        }
    };

    const handleFileSelect = (e) => {
        const selected = Array.from(e.target.files).slice(0, 4 - files.length);
        const newFiles = [...files, ...selected].slice(0, 4);
        setFiles(newFiles);

        const newPreviews = newFiles.map((file) => {
            if (file.type.startsWith('image/')) {
                return URL.createObjectURL(file);
            }
            return null;
        });
        setPreviews(newPreviews);
        e.target.value = '';
    };

    const removeFile = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        if (previews[index]) {
            URL.revokeObjectURL(previews[index]);
        }
        setPreviews(newFiles.map((file) => (file.type.startsWith('image/') ? URL.createObjectURL(file) : null)));
    };

    const showFileUpload = chatId || otherUserId || groupChatId;
    const canSend = (message.trim() !== '' || files.length > 0) && !isSending;

    return (
        <div className="flex flex-col gap-2">
            {previews.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative flex-shrink-0">
                            {preview ? (
                                <img src={preview} alt="" className="h-16 w-16 rounded-md object-cover" />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gray-200 text-xs dark:bg-neutral-700">
                                    {files[index]?.name?.split('.').pop()}
                                </div>
                            )}
                            <button
                                onClick={() => removeFile(index)}
                                className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5 text-white"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex h-10 w-full gap-2">
                {showFileUpload && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={files.length >= 4}
                            className="rounded-lg px-2 text-gray-500 hover:text-gray-700 disabled:opacity-40 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <ImageIcon className="h-5 w-5" />
                        </button>
                    </>
                )}
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={translations['Write...']}
                    autoComplete="off"
                    className="max-h-32 w-full flex-grow resize-none overflow-y-auto rounded-full border border-gray-200 px-4 py-2 text-sm text-black focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:ring-blue-800"
                />
                <button
                    onClick={sendMessage}
                    type="button"
                    disabled={!canSend}
                    aria-label={translations['Send message']}
                    className={`rounded-full px-4 py-2 text-sm text-white transition-colors ${
                        canSend
                            ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                            : 'cursor-not-allowed bg-gray-300 dark:bg-neutral-700'
                    }`}
                >
                    <SendIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
