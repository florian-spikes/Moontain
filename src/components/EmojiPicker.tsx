
import { useState, useRef, useEffect } from 'react';

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
    {
        label: 'Entreprise',
        emojis: ['🏢', '🏗️', '🏭', '🏪', '🏬', '🏛️', '🏠', '🏡', '💼', '🤝', '💡', '⚡', '📊', '📈', '📉', '💶', '💵', '💳', '🧾', '📆', '📋', '📁', '📂', '🗂️', '🗃️', '🔒', '🔑', '✉️', '📧', '📞', '☎️', '📠', '🖨️', '📅', '📝', '📌', '📎', '🗞️', '📚', '⚖️'],
    },
    {
        label: 'Tech',
        emojis: ['💻', '🖥️', '⌨️', '🖱️', '📱', '📲', '🔋', '🔌', '📡', '💾', '💿', '📀', '🧠', '⚙️', '🔍', '🔎', '📐', '📏', '🔗', '🤖', '🌐', '🎮', '🕹️', '🎙️', '🎛️', '👨‍💻', '👩‍💻', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍🏫', '👩‍🏫'],
    },
    {
        label: 'Artisanat',
        emojis: ['🚧', '👷', '👷‍♀️', '🔧', '🛠️', '🔨', '⛏️', '🪚', '🪛', '⚙️', '🔩', '🧲', '🪜', '🧱', '🪵', '🚜', '🚚', '🛻', '🦺', '🥽', '🧤', '🔥', '💧', '🛢️', '☢️', '🧹', '🧺', '🧻', '🧼', '🧽', '🪠'],
    },
    {
        label: 'Commerce',
        emojis: ['🛍️', '🛒', '🏷️', '🔖', '📦', '🎁', '🍷', '🍺', '🍻', '🥂', '☕', '🍵', '🍽️', '🍴', '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥗', '🍝', '🍜', '🍲', '🍣', '🍱', '🥐', '🥖', '🥨', '🧀', '🍎', '🍓', '🥑', '🥩'],
    },
    {
        label: 'Nature',
        emojis: ['🌿', '🌱', '🌳', '🌲', '🌴', '🌵', '🌾', '🌸', '🌺', '🌻', '🌹', '🌷', '🐄', '🐖', '🐏', '🐔', '🌍', '🌎', '🌏', '🌊', '☀️', '⛅', '⛈️', '❄️', '☄️', '🍁', '🍃', '🍄', '🍅', '🌽', '🥕', '🥔'],
    },
    {
        label: 'Transport',
        emojis: ['🚀', '✈️', '🛫', '🛬', '🚁', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚛', '🚜', '🛵', '🏍️', '🚲', '🛴', '🚂', '🚄', '🚆', '🚢', '🛥️', '⛵', '⚓', '🛣️', '🛤️', '⛽', '🚦', '🛑'],
    },
    {
        label: 'Santé',
        emojis: ['⚕️', '🏥', '🩺', '💊', '💉', '🩹', '🩸', '🦠', '🧬', '🫀', '🫁', '🦷', '🦴', '👁️', '🧘', '🧘‍♀️', '🏃', '🏃‍♀️', '🏋️', '🏋️‍♀️', '🚴', '🚴‍♀️', '🏊', '🏊‍♀️', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🥊', '🥋'],
    },
    {
        label: 'Créatif',
        emojis: ['🎨', '🎬', '🎤', '🎧', '🎵', '🎶', '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '📷', '📸', '📹', '🎥', '📽️', '🎭', '🎫', '🎪', '🎉', '🎊', '🎈', '🪄', '✒️', '🖋️', '🖌️', '🖍️', '✂️', '🧵', '🧶', '👗', '👔'],
    },
];

interface EmojiPickerProps {
    value: string;
    onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="emoji-picker-container" ref={ref}>
            <button
                type="button"
                className="emoji-trigger"
                onClick={() => setIsOpen(!isOpen)}
                title="Choisir un emoji"
            >
                <span className="emoji-preview">{value}</span>
            </button>

            {isOpen && (
                <div className="emoji-dropdown animate-slide-up">
                    <div className="emoji-tabs">
                        {EMOJI_CATEGORIES.map((cat, i) => (
                            <button
                                key={cat.label}
                                type="button"
                                className={`emoji-tab ${i === activeCategory ? 'emoji-tab-active' : ''}`}
                                onClick={() => setActiveCategory(i)}
                            >
                                {cat.emojis[0]}
                            </button>
                        ))}
                    </div>
                    <div className="emoji-category-label">{EMOJI_CATEGORIES[activeCategory].label}</div>
                    <div className="emoji-grid">
                        {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                className={`emoji-item ${emoji === value ? 'emoji-item-selected' : ''}`}
                                onClick={() => {
                                    onChange(emoji);
                                    setIsOpen(false);
                                }}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .emoji-picker-container {
                    position: relative;
                    display: inline-block;
                }
                .emoji-trigger {
                    width: 64px;
                    height: 64px;
                    border-radius: var(--radius-xl);
                    background: var(--bg-app);
                    border: 2px dashed var(--border-light);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all var(--transition-smooth);
                }
                .emoji-trigger:hover {
                    border-color: var(--primary);
                    background: var(--primary-light);
                }
                .emoji-preview {
                    font-size: 1.75rem;
                    line-height: 1;
                }
                .emoji-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    z-index: 50;
                    width: 320px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-light);
                    border-radius: var(--radius-xl);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.25);
                    overflow: hidden;
                }
                .emoji-tabs {
                    display: flex;
                    gap: 2px;
                    padding: 8px 8px 0;
                    border-bottom: 1px solid var(--border);
                }
                .emoji-tab {
                    flex: 1;
                    padding: 6px;
                    font-size: 1rem;
                    border-radius: var(--radius-md) var(--radius-md) 0 0;
                    background: transparent;
                    cursor: pointer;
                    transition: background var(--transition-fast);
                    border: none;
                }
                .emoji-tab:hover {
                    background: var(--bg-surface-hover);
                }
                .emoji-tab-active {
                    background: var(--primary-light);
                }
                .emoji-category-label {
                    padding: 8px 12px 4px;
                    font-size: 0.6875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: var(--text-muted);
                }
                .emoji-grid {
                    display: grid;
                    grid-template-columns: repeat(8, 1fr);
                    gap: 2px;
                    padding: 4px 8px 12px;
                    max-height: 200px;
                    overflow-y: auto;
                }
                .emoji-item {
                    width: 100%;
                    aspect-ratio: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    border: none;
                    background: transparent;
                }
                .emoji-item:hover {
                    background: var(--bg-surface-hover);
                    transform: scale(1.15);
                }
                .emoji-item-selected {
                    background: var(--primary-light);
                    box-shadow: inset 0 0 0 2px var(--primary);
                }
            `}</style>
        </div>
    );
}
