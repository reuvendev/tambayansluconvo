'use client';

import React, { useEffect, useRef, useState } from 'react';

type Side = 'you' | 'anonymous';
type CanvasFormat = 'auto' | 'post' | 'story' | 'square';

type ReplySnapshot = {
  side: Side;
  text: string;
};

type MockMessage = {
  id: string;
  side: Side;
  text: string;
  image?: string;
  replyTo?: ReplySnapshot;
  reactions: string[];
};

type IconName =
  | 'send'
  | 'moon'
  | 'sun'
  | 'image'
  | 'reply'
  | 'edit'
  | 'trash'
  | 'download'
  | 'x'
  | 'shield'
  | 'refresh'
  | 'check';

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    reply: <><path d="m9 17-5-5 5-5" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v7m4-7v7" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></>,
    x: <path d="M18 6 6 18M6 6l12 12" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    refresh: <><path d="M20 11a8 8 0 0 0-14.8-4M4 4v5h5M4 13a8 8 0 0 0 14.8 4M20 20v-5h-5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const EMOJIS = ['❤️', '👍', '😂', '🔥', '😮', '😢'];
const FORMAT_LABELS: Record<CanvasFormat, string> = {
  auto: 'Full conversation',
  post: 'Instagram post · 4:5',
  story: 'Story / Reel · 9:16',
  square: 'Square · 1:1',
};

const FORMAT_RATIOS: Record<Exclude<CanvasFormat, 'auto'>, string> = {
  post: '4 / 5',
  story: '9 / 16',
  square: '1 / 1',
};

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ConversationCreatorPage() {
  const [messages, setMessages] = useState<MockMessage[]>([]);
  const [sender, setSender] = useState<Side>('you');
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [text, setText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | undefined>();
  const [replyTo, setReplyTo] = useState<ReplySnapshot | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [format, setFormat] = useState<CanvasFormat>('post');
  const [peerName, setPeerName] = useState('Anonymous Louisian');
  const [peerSchool, setPeerSchool] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState('');

  const captureRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedMessage = messages.find((message) => message.id === selectedId);
  const canSend = Boolean(text.trim() || attachedImage);

  const colors = darkMode
    ? {
        bg: '#0a0a0a',
        surface: '#171717',
        surfaceAlt: '#0a0a0a',
        border: '#262626',
        bodyText: '#f5f5f5',
        dim: '#a3a3a3',
        subtle: '#737373',
        myBubble: '#525252',
        otherBubble: '#171717',
        myText: '#ffffff',
        otherText: '#f5f5f5',
      }
    : {
        bg: '#fafafa',
        surface: '#ffffff',
        surfaceAlt: '#fafafa',
        border: '#e5e5e5',
        bodyText: '#171717',
        dim: '#737373',
        subtle: '#a3a3a3',
        myBubble: '#171717',
        otherBubble: '#ffffff',
        myText: '#ffffff',
        otherText: '#171717',
      };

  // Only the preview is scrolled. A fixed-size exported image shows the newest messages.
  useEffect(() => {
    if (format !== 'auto' && messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
    }
  }, [messages, format]);

  function clearComposer() {
    setText('');
    setAttachedImage(undefined);
    setReplyTo(undefined);
    setEditingId(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function sendMessage() {
    if (!canSend) return;

    if (editingId) {
      setMessages((existing) =>
        existing.map((message) =>
          message.id === editingId
            ? { ...message, text: text.trim(), image: attachedImage, side: sender, replyTo }
            : message,
        ),
      );
      clearComposer();
      return;
    }

    const next: MockMessage = {
      id: createId(),
      side: sender,
      text: text.trim(),
      image: attachedImage,
      replyTo,
      reactions: [],
    };
    setMessages((existing) => [...existing, next]);
    setSelectedId(next.id);
    clearComposer();
    if (autoSwitch) setSender(sender === 'you' ? 'anonymous' : 'you');
  }

  function startReply(message: MockMessage) {
    setReplyTo({ side: message.side, text: message.text || (message.image ? 'Photo' : '') });
    setEditingId(null);
    setText('');
    setAttachedImage(undefined);
    inputRef.current?.focus();
  }

  function startEdit(message: MockMessage) {
    setEditingId(message.id);
    setSender(message.side);
    setText(message.text);
    setAttachedImage(message.image);
    setReplyTo(message.replyTo);
    inputRef.current?.focus();
  }

  function deleteMessage(id: string) {
    setMessages((existing) => existing.filter((message) => message.id !== id));
    setSelectedId((current) => (current === id ? null : current));
    if (editingId === id) clearComposer();
  }

  function toggleReaction(id: string, emoji: string) {
    setMessages((existing) =>
      existing.map((message) =>
        message.id === id
          ? {
              ...message,
              reactions: message.reactions.includes(emoji)
                ? message.reactions.filter((item) => item !== emoji)
                : [...message.reactions, emoji],
            }
          : message,
      ),
    );
  }

  async function attachPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setNotice('Please choose a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice('Photo must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Could not read the image.'));
        reader.readAsDataURL(file);
      });
      setAttachedImage(dataUrl);
      setNotice('');
    } catch {
      setNotice('The image could not be opened.');
    }
  }

  function resetConversation() {
    if (messages.length && !window.confirm('Clear the entire sample conversation?')) return;
    setMessages([]);
    setSelectedId(null);
    setSender('you');
    clearComposer();
    setNotice('');
  }

  async function downloadImage() {
    if (!captureRef.current || messages.length === 0 || isExporting) return;
    setIsExporting(true);
    setNotice('');

    try {
      // Imported on demand: this page makes no server or database calls.
      const { toPng } = await import('html-to-image');
      if (document.fonts?.ready) await document.fonts.ready;

      const node = captureRef.current;
      const width = node.getBoundingClientRect().width;
      if (width <= 0) throw new Error('The preview is not visible.');

      const dataUrl = await toPng(node, {
        cacheBust: true,
        backgroundColor: colors.bg,
        pixelRatio: 1080 / width, // Always export 1080 px wide, even on phones.
      });

      const a = document.createElement('a');
      a.download = `tambayanslu-conversation-${format}-${Date.now()}.png`;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Conversation export failed:', error);
      setNotice('Could not export the PNG. Try fewer messages or smaller photos.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 px-3 py-6 font-sans text-neutral-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">
              TambayanSLU • Creative tools
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Conversation Creator</h1>
            <p className="mt-2 max-w-xl text-sm text-neutral-500">
              Make sample anonymous chats for social media. Everything happens in your browser — no Firebase,
              no database, and no real chat room.
            </p>
          </div>
          <button
            type="button"
            onClick={resetConversation}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wide hover:bg-neutral-50"
          >
            <Icon name="refresh" size={14} /> Clear chat
          </button>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(300px,370px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider">1. Conversation settings</h2>
              <label className="mt-4 block font-mono text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Chat header name
              </label>
              <input
                value={peerName}
                maxLength={40}
                onChange={(event) => setPeerName(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                placeholder="Anonymous Louisian"
              />
              <label className="mt-4 block font-mono text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                School badge (optional)
              </label>
              <select
                value={peerSchool}
                onChange={(event) => setPeerSchool(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">No school shown</option>
                {['SAMCIS', 'SEA', 'SOM', 'SONAHBS', 'STELA', 'SOL'].map((school) => (
                  <option key={school} value={school}>{school}</option>
                ))}
              </select>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    Image size
                  </label>
                  <select
                    value={format}
                    onChange={(event) => setFormat(event.target.value as CanvasFormat)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-2.5 text-xs outline-none focus:border-emerald-500"
                  >
                    {(Object.keys(FORMAT_LABELS) as CanvasFormat[]).map((key) => (
                      <option key={key} value={key}>{FORMAT_LABELS[key]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    Appearance
                  </label>
                  <button
                    type="button"
                    onClick={() => setDarkMode((current) => !current)}
                    className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-2.5 text-xs hover:bg-neutral-100"
                  >
                    <Icon name={darkMode ? 'sun' : 'moon'} size={14} /> {darkMode ? 'Dark mode' : 'Light mode'}
                  </button>
                </div>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">
                Fixed social-media sizes display the newest messages when the chat is too long. Select
                “Full conversation” to export everything.
              </p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider">2. Write the chat</h2>
              <p className="mt-1 text-xs text-neutral-500">Choose either side. Both participants are controlled here.</p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {(['you', 'anonymous'] as Side[]).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setSender(side)}
                    className={`rounded-xl border px-3 py-3 font-mono text-xs font-bold transition-colors ${
                      sender === side
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                    }`}
                    aria-pressed={sender === side}
                  >
                    {side === 'you' ? 'You →' : '← Anonymous'}
                  </button>
                ))}
              </div>

              <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={autoSwitch}
                  onChange={(event) => setAutoSwitch(event.target.checked)}
                  className="accent-emerald-600"
                />
                Switch sides after sending
              </label>

              {editingId && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <span>Editing a message</span>
                  <button type="button" onClick={clearComposer} className="underline">Cancel</button>
                </div>
              )}

              {replyTo && (
                <div className="mt-3 flex items-start justify-between gap-2 rounded-xl border-l-2 border-emerald-500 bg-neutral-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-bold text-emerald-700">
                      Replying to {replyTo.side === 'you' ? 'You' : 'Anonymous'}
                    </p>
                    <p className="truncate text-xs text-neutral-600">{replyTo.text}</p>
                  </div>
                  <button type="button" aria-label="Cancel reply" onClick={() => setReplyTo(undefined)}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
              )}

              <textarea
                ref={inputRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                rows={4}
                placeholder="Type a message..."
                className="mt-3 w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm outline-none focus:border-emerald-500"
              />

              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={attachPhoto} className="hidden" />
              {attachedImage && (
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={attachedImage} alt="Attached preview" className="h-14 w-14 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1 text-xs text-neutral-500">Photo attached locally</span>
                  <button type="button" onClick={() => setAttachedImage(undefined)} title="Remove photo">
                    <Icon name="x" size={15} />
                  </button>
                </div>
              )}
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  title="Attach photo"
                  aria-label="Attach photo"
                >
                  <Icon name="image" size={17} />
                </button>
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!canSend}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-3 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name={editingId ? 'check' : 'send'} size={15} />
                  {editingId ? 'Save message' : 'Add message'}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-neutral-400">Enter to send · Shift+Enter for a new line</p>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider">3. Message actions</h2>
              <p className="mt-1 text-xs text-neutral-500">Click any bubble in the preview to select it.</p>
              {selectedMessage ? (
                <>
                  <p className="mt-3 truncate rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                    <span className="font-semibold">{selectedMessage.side === 'you' ? 'You' : 'Anonymous'}: </span>
                    {selectedMessage.text || (selectedMessage.image ? 'Photo' : '')}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => startReply(selectedMessage)} className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-2 py-2 text-xs hover:bg-neutral-50">
                      <Icon name="reply" size={13} /> Reply
                    </button>
                    <button type="button" onClick={() => startEdit(selectedMessage)} className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-2 py-2 text-xs hover:bg-neutral-50">
                      <Icon name="edit" size={13} /> Edit
                    </button>
                    <button type="button" onClick={() => deleteMessage(selectedMessage.id)} className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-2 py-2 text-xs text-red-600 hover:bg-red-50">
                      <Icon name="trash" size={13} /> Delete
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => toggleReaction(selectedMessage.id, emoji)}
                        aria-pressed={selectedMessage.reactions.includes(emoji)}
                        className={`rounded-lg border px-2 py-1.5 text-base hover:bg-neutral-100 ${
                          selectedMessage.reactions.includes(emoji)
                            ? 'border-emerald-400 bg-emerald-50'
                            : 'border-neutral-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-neutral-200 p-4 text-center text-xs text-neutral-400">
                  No message selected
                </div>
              )}
            </section>
          </div>

          <section className="min-w-0 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider">Preview</h2>
                <p className="mt-1 text-[11px] text-neutral-500">{messages.length} messages · {FORMAT_LABELS[format]}</p>
              </div>
              <button
                type="button"
                onClick={downloadImage}
                disabled={messages.length === 0 || isExporting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wide text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="download" size={15} /> {isExporting ? 'Creating PNG...' : 'Download PNG'}
              </button>
            </div>

            {notice && <p role="status" className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{notice}</p>}

            <div className="mx-auto w-full max-w-[540px] overflow-hidden rounded-xl border border-neutral-200 shadow-md">
              {/* Only this element is exported. Editor tools and buttons are outside it. */}
              <div
                ref={captureRef}
                className="flex w-full flex-col overflow-hidden font-sans"
                style={{
                  backgroundColor: colors.bg,
                  color: colors.bodyText,
                  aspectRatio: format === 'auto' ? undefined : FORMAT_RATIOS[format],
                  minHeight: format === 'auto' ? 610 : undefined,
                }}
              >
                {/* Matches TambayanSLU's anonymous chat header. */}
                <div
                  className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-mono text-[11px] font-bold uppercase tracking-wider">
                          Chatting with: <span className="text-emerald-500">{peerName.trim() || 'Anonymous Louisian'}</span>
                        </p>
                        {peerSchool && (
                          <span className="shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px]" style={{ borderColor: colors.border, color: colors.dim }}>
                            {peerSchool}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[10px]" style={{ color: colors.subtle }}>Conversation preview</p>
                    </div>
                  </div>
                  <span className="rounded-lg border px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider" style={{ color: colors.dim, borderColor: colors.border }}>
                    Sample
                  </span>
                </div>

                <div
                  ref={messagesScrollRef}
                  className={`min-h-0 flex-1 px-4 py-5 ${format === 'auto' ? '' : 'overflow-y-auto'}`}
                  style={{ scrollbarWidth: 'none' }}
                >
                  <div className="mx-auto w-full max-w-[460px] space-y-4">
                    <div className="flex justify-center">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-wide"
                        style={{ color: colors.dim, backgroundColor: colors.surface, borderColor: colors.border }}
                      >
                        <Icon name="shield" size={12} /> Sample anonymous conversation
                      </span>
                    </div>

                    {messages.length === 0 && (
                      <div className="pt-16 text-center font-mono text-xs" style={{ color: colors.subtle }}>
                        Your conversation will appear here.
                      </div>
                    )}

                    {messages.map((message) => {
                      const isMe = message.side === 'you';
                      return (
                        <div key={message.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {/* No sender nickname above each message. */}
                          <div className="w-fit max-w-[88%] sm:max-w-[82%]">
                            <div
                              onClick={() => setSelectedId(message.id)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  setSelectedId(message.id);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              title="Select message to edit, reply, react, or delete"
                              className={`cursor-pointer break-words px-3.5 py-2.5 text-sm leading-relaxed ${
                                isMe ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'
                              }`}
                              style={{
                                backgroundColor: isMe ? colors.myBubble : colors.otherBubble,
                                color: isMe ? colors.myText : colors.otherText,
                                border: isMe ? '1px solid transparent' : `1px solid ${colors.border}`,
                              }}
                            >
                              {message.replyTo && (
                                <div
                                  className="mb-2 rounded-lg border-l-2 px-2.5 py-1.5 text-xs"
                                  style={{
                                    backgroundColor: isMe ? 'rgba(0,0,0,0.18)' : colors.surfaceAlt,
                                    borderColor: isMe ? 'rgba(255,255,255,0.7)' : '#059669',
                                  }}
                                >
                                  <p className="font-mono text-[10px] font-bold">
                                    {message.replyTo.side === 'you' ? 'You' : 'Anonymous'}
                                  </p>
                                  <p className="max-w-[270px] truncate opacity-80">{message.replyTo.text}</p>
                                </div>
                              )}
                              {message.image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={message.image}
                                  alt="Chat photo"
                                  className={`block max-h-[250px] w-full max-w-[310px] rounded-lg object-contain ${message.text ? 'mb-2' : ''}`}
                                />
                              )}
                              {message.text && <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{message.text}</p>}
                            </div>
                            {message.reactions.length > 0 && (
                              <div className={`mt-1.5 flex flex-wrap gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {message.reactions.map((emoji) => (
                                  <span
                                    key={emoji}
                                    className="rounded-full border px-2 py-0.5 font-mono text-[11px]"
                                    style={{ color: colors.dim, backgroundColor: colors.surface, borderColor: colors.border }}
                                  >
                                    {emoji} <strong>1</strong>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Faux input bar belongs to the exported chat image; all editing happens in the side panel. */}
                <div className="shrink-0 border-t px-3 py-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <div className="mx-auto flex max-w-[460px] items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" style={{ borderColor: colors.border, color: colors.dim }}>
                      <Icon name="image" size={16} />
                    </div>
                    <div className="flex h-10 min-w-0 flex-1 items-center rounded-xl border px-3 text-xs" style={{ borderColor: colors.border, color: colors.subtle, backgroundColor: colors.bg }}>
                      Type your anonymous message...
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: darkMode ? '#059669' : '#171717' }}>
                      <Icon name="send" size={16} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-wider" style={{ color: colors.subtle }}>
                    <span>Sample conversation • Made for social media</span>
                    <span className="shrink-0 font-bold lowercase tracking-normal" style={{ color: darkMode ? '#34d399' : '#047857' }}>tambayanslu.com</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="mx-auto mt-3 max-w-[540px] text-center text-[11px] text-neutral-500">
              Branding and the “Sample conversation” label are included in the exported image.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
