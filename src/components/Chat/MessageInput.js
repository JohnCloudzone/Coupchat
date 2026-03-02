'use client';
import { useState, useRef, useCallback } from 'react';
import EmojiPicker from './EmojiPicker';

export default function MessageInput({ onSend, onTyping }) {
    const [text, setText] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewImage, setPreviewImage] = useState(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);

    const handleSend = useCallback(() => {
        if (!text.trim() && !previewImage) return;
        onSend(text.trim(), previewImage);
        setText('');
        setPreviewImage(null);
        setShowEmoji(false);
        inputRef.current?.focus();
    }, [text, previewImage, onSend]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('Image too large! Max 5MB.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Only image files are allowed.');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        const reader = new FileReader();
        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
        };
        reader.onload = () => {
            // Compress if needed
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxSize = 800;
                let { width, height } = img;

                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = (height / width) * maxSize;
                        width = maxSize;
                    } else {
                        width = (width / height) * maxSize;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressed = canvas.toDataURL('image/jpeg', 0.7);
                setPreviewImage(compressed);
                setUploading(false);
                setUploadProgress(100);
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const fakeEvent = { target: { files: [file] } };
            handleImageUpload(fakeEvent);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const addEmoji = (emoji) => {
        setText(prev => prev + emoji);
        inputRef.current?.focus();
    };

    return (
        <div className="px-3 pb-3 pt-1 flex-shrink-0 pb-safe relative"
            onDrop={handleDrop} onDragOver={handleDragOver}>
            {/* Image Preview */}
            {previewImage && (
                <div className="mb-2 relative inline-block animate-slide-up">
                    <img src={previewImage} alt="Preview" className="h-20 rounded-xl object-cover" />
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Upload Progress */}
            {uploading && (
                <div className="mb-2">
                    <div className="h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%`, background: 'var(--gradient-primary)' }} />
                    </div>
                </div>
            )}

            {/* Emoji Picker */}
            {showEmoji && (
                <div className="absolute bottom-full left-3 mb-2 z-30">
                    <EmojiPicker onSelect={addEmoji} onClose={() => setShowEmoji(false)} />
                </div>
            )}

            {/* Input Area */}
            <div className="chat-input-area flex items-end gap-2 px-3 py-2">
                {/* Emoji Button */}
                <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    className={`p-2 rounded-lg flex-shrink-0 transition-colors text-lg
            ${showEmoji ? 'bg-[var(--accent)] bg-opacity-20' : 'hover:bg-[var(--bg-tertiary)]'}`}
                >
                    😊
                </button>

                {/* Image Upload */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg flex-shrink-0 hover:bg-[var(--bg-tertiary)] transition-colors text-lg"
                >
                    📷
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                />

                {/* Text Input */}
                <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        onTyping?.();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 bg-transparent outline-none text-sm resize-none max-h-24"
                    style={{ color: 'var(--text-primary)' }}
                />

                {/* Send Button */}
                <button
                    onClick={handleSend}
                    disabled={!text.trim() && !previewImage}
                    className={`p-2.5 rounded-xl flex-shrink-0 transition-all duration-300
            ${text.trim() || previewImage
                            ? 'hover:scale-105 shadow-lg'
                            : 'opacity-40 cursor-not-allowed'
                        }`}
                    style={{ background: text.trim() || previewImage ? 'var(--gradient-primary)' : 'var(--bg-tertiary)', color: 'white' }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
