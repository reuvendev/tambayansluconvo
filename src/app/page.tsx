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
  | 'check'
  | 'more';

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
    more: <><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></>,
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
  const [format, setFormat] = useState<CanvasFormat>('story');
  const [peerName, setPeerName] = useState('Anonymous Louisian');
  const [myName, setMyName] = useState('You');
  const [iosImage, setIosImage] = useState<string | null>(null);
  const [peerSchool, setPeerSchool] = useState('');
  const [peerStreak, setPeerStreak] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState('');
  const [mobilePanel, setMobilePanel] = useState<'write' | 'style' | 'actions' | null>(null);

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
      setMobilePanel(null);
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
    setMobilePanel(null);
    if (autoSwitch) setSender(sender === 'you' ? 'anonymous' : 'you');
  }

  function startReply(message: MockMessage) {
    setReplyTo({ side: message.side, text: message.text || (message.image ? 'Photo' : '') });
    setEditingId(null);
    setText('');
    setAttachedImage(undefined);
    setMobilePanel('write');
    inputRef.current?.focus();
  }

  function startEdit(message: MockMessage) {
    setEditingId(message.id);
    setSender(message.side);
    setText(message.text);
    setAttachedImage(message.image);
    setReplyTo(message.replyTo);
    setMobilePanel('write');
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
    if (messages.length && !window.confirm('Clear the entire conversation?')) return;
    setMessages([]);
    setSelectedId(null);
    setSender('you');
    clearComposer();
    setNotice('');
    setMobilePanel(null);
  }

  function undoLast() {
    setMessages((existing) => existing.slice(0, -1));
    setSelectedId(null);
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

      const filename = `tambayanslu-conversation-${format}-${Date.now()}.png`;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isIOS) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file] });
            setNotice('In the share sheet, choose Save Image to add it to Photos.');
          } catch (shareError) {
            if ((shareError as Error).name !== 'AbortError') {
              setIosImage(dataUrl);
            }
          }
        } else {
          setIosImage(dataUrl);
        }
      } else {
        const a = document.createElement('a');
        a.download = filename;
        a.href = dataUrl;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error('Conversation export failed:', error);
      setNotice('Could not export the PNG. Try fewer messages or smaller photos.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#f4f5f5] px-3 pb-24 pt-4 font-sans text-neutral-900 sm:px-6 lg:pb-10 lg:pt-7">
      {iosImage && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-black/90 p-5 text-white" role="dialog" aria-modal="true" aria-label="Save image to Photos">
          <p className="text-center text-sm font-semibold">Save to Photos</p>
          <p className="text-center text-xs text-neutral-300">Touch and hold the image, then choose Save to Photos or Add to Photos.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={iosImage} alt="Your conversation image, hold to save" className="max-h-[65dvh] max-w-full object-contain" />
          <button type="button" onClick={() => setIosImage(null)} className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-black">Close</button>
        </div>
      )}
      <div className="mx-auto max-w-[1240px]">
        <header className="mb-5 flex items-center justify-between gap-3 lg:mb-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-sm">
              <Icon name="send" size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">TambayanSLU</p>
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-xl">Conversation Creator</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={undoLast}
              disabled={messages.length === 0}
              className="hidden items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium shadow-sm transition hover:bg-neutral-50 disabled:opacity-40 sm:inline-flex"
            >
              <Icon name="refresh" size={14} /> Undo last
            </button>
            <button
              type="button"
              onClick={downloadImage}
              disabled={!messages.length || isExporting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 sm:px-4"
            >
              <Icon name="download" size={15} /> <span>{isExporting ? 'Exporting...' : 'Export PNG'}</span>
            </button>
          </div>
        </header>

        {notice && (
          <p role="status" className="mx-auto mb-4 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs text-amber-900">{notice}</p>
        )}

        {mobilePanel && (
          <button
            type="button"
            aria-label="Close editor panel"
            onClick={() => setMobilePanel(null)}
            className="fixed inset-0 z-40 bg-neutral-950/45 backdrop-blur-[2px] lg:hidden"
          />
        )}

        <main className="grid items-start gap-5 lg:grid-cols-[minmax(270px,315px)_minmax(0,1fr)_minmax(220px,260px)] lg:gap-6">
          <aside className="contents lg:order-1 lg:block lg:space-y-4">
            <section className={`${mobilePanel === 'write' ? 'fixed inset-x-0 bottom-0 z-50 max-h-[84dvh] overflow-y-auto rounded-t-[26px] shadow-2xl' : 'hidden'} border border-neutral-200 bg-white p-5 lg:static lg:block lg:max-h-none lg:rounded-2xl lg:p-5 lg:shadow-sm`}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Write a message</h2>
                  <p className="mt-1 text-xs text-neutral-500">Choose a side, then add your message.</p>
                </div>
                <button type="button" onClick={() => setMobilePanel(null)} className="rounded-lg border border-neutral-200 p-2 text-neutral-600 lg:hidden" aria-label="Close composer"><Icon name="x" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 p-1">
                {(['you', 'anonymous'] as Side[]).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setSender(side)}
                    aria-pressed={sender === side}
                    className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition ${sender === side ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:bg-white/70'}`}
                  >
                    {side === 'you' ? 'You →' : '← Anonymous'}
                  </button>
                ))}
              </div>
              <label className="mt-3 flex items-center gap-2 text-[12px] text-neutral-600">
                <input type="checkbox" checked={autoSwitch} onChange={(event) => setAutoSwitch(event.target.checked)} className="accent-emerald-600" />
                Auto-switch sides
              </label>

              {editingId && <div className="mt-3 flex justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"><span>Editing message</span><button type="button" className="underline" onClick={clearComposer}>Cancel</button></div>}
              {replyTo && (
                <div className="mt-3 flex items-start justify-between gap-2 rounded-lg border-l-[3px] border-emerald-500 bg-neutral-100 px-3 py-2">
                  <div className="min-w-0"><p className="text-[11px] font-semibold text-emerald-700">Replying to {replyTo.side === 'you' ? 'You' : 'Anonymous'}</p><p className="truncate text-xs text-neutral-500">{replyTo.text}</p></div>
                  <button type="button" aria-label="Cancel reply" onClick={() => setReplyTo(undefined)}><Icon name="x" size={14} /></button>
                </div>
              )}
              <textarea
                ref={inputRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault(); sendMessage();
                  }
                }}
                rows={4}
                placeholder="Type a message..."
                className="mt-3 w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[14px] outline-none focus:border-emerald-500"
              />
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={attachPhoto} className="hidden" />
              {attachedImage && (
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-neutral-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={attachedImage} alt="Attached image" className="h-12 w-12 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1 text-xs text-neutral-500">Photo added</span>
                  <button type="button" onClick={() => setAttachedImage(undefined)} aria-label="Remove attachment"><Icon name="x" size={16} /></button>
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} aria-label="Attach photo" title="Attach photo" className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50"><Icon name="image" size={18} /></button>
                <button
                  type="button" onClick={sendMessage} disabled={!canSend}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-3 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
                ><Icon name={editingId ? 'check' : 'send'} size={16} /> {editingId ? 'Save changes' : 'Add message'}</button>
              </div>
              <p className="mt-3 hidden text-[11px] text-neutral-400 lg:block">Enter to send · Shift+Enter for a new line</p>
            </section>

            <section className={`${mobilePanel === 'style' ? 'fixed inset-x-0 bottom-0 z-50 max-h-[84dvh] overflow-y-auto rounded-t-[26px] shadow-2xl' : 'hidden'} border border-neutral-200 bg-white p-5 lg:static lg:block lg:max-h-none lg:rounded-2xl lg:shadow-sm`}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Chat appearance</h2>
                <button type="button" onClick={() => setMobilePanel(null)} className="rounded-lg border border-neutral-200 p-2 lg:hidden" aria-label="Close appearance settings"><Icon name="x" /></button>
              </div>
              <label className="block text-[11px] font-semibold text-neutral-600" htmlFor="my-name">Your message name</label>
              <input id="my-name" value={myName} maxLength={40} onChange={(event) => setMyName(event.target.value)} className="mt-1.5 mb-4 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" placeholder="You" />
              <label className="block text-[11px] font-semibold text-neutral-600" htmlFor="peer-name">Chat header name / other person's name</label>
              <input id="peer-name" value={peerName} maxLength={40} onChange={(event) => setPeerName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" placeholder="Anonymous Louisian" />
              <label className="mt-4 block text-[11px] font-semibold text-neutral-600" htmlFor="peer-school">School badge</label>
              <select id="peer-school" value={peerSchool} onChange={(event) => setPeerSchool(event.target.value)} className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
                <option value="">No school shown</option>
                {['SAMCIS', 'SEA', 'SOM', 'SONAHBS', 'STELA', 'SOL'].map((school) => <option key={school} value={school}>{school}</option>)}
              </select>
              <label className="mt-4 block text-[11px] font-semibold text-neutral-600" htmlFor="peer-streak">Chat partner streak</label>
              <input id="peer-streak" type="number" min="0" max="9999" step="1" value={peerStreak} onChange={(event) => setPeerStreak(Math.min(9999, Math.max(0, Number.parseInt(event.target.value, 10) || 0)))} className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
              <p className="mt-1 text-[11px] text-neutral-500">Shows 🔥 and the streak count beside the school badge, like the real chat. Set 0 to hide.</p>
              <label className="mt-4 block text-[11px] font-semibold text-neutral-600" htmlFor="image-format">Image format</label>
              <select id="image-format" value={format} onChange={(event) => setFormat(event.target.value as CanvasFormat)} className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500">
                {(Object.keys(FORMAT_LABELS) as CanvasFormat[]).map((key) => <option key={key} value={key}>{FORMAT_LABELS[key]}</option>)}
              </select>
              <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-neutral-200 px-3 py-3">
                <div><p className="text-xs font-semibold">Dark appearance</p><p className="text-[11px] text-neutral-500">Match Tambayan's dark chat</p></div>
                <button type="button" onClick={() => setDarkMode((current) => !current)} aria-pressed={darkMode} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${darkMode ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'}`}>
                  <Icon name={darkMode ? 'moon' : 'sun'} size={14} /> {darkMode ? 'Dark' : 'Light'}
                </button>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-neutral-400">The preview uses the selected image size. Longer chats show the newest messages; Full conversation includes all messages.</p>
            </section>
          </aside>

          <section className="order-1 min-w-0 lg:order-2">
            <div className="mb-3 flex items-center justify-between gap-3 lg:mb-4">
              <div className="min-w-0"><h2 className="text-sm font-semibold">Chat preview</h2><p className="mt-0.5 text-[11px] text-neutral-500">{messages.length} {messages.length === 1 ? 'message' : 'messages'} · {FORMAT_LABELS[format]}</p></div>
              <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 font-mono text-[10px] text-neutral-500">Mobile view</span>
            </div>
            <div className="mx-auto w-full max-w-[410px] overflow-hidden rounded-[24px] border-[5px] border-neutral-800 bg-white shadow-[0_18px_55px_rgba(0,0,0,0.16)]">
              {/* Export only the chat screen. The device border and all editing controls are excluded. */}
              <div
                ref={captureRef}
                className="flex w-full flex-col overflow-hidden font-sans"
                style={{
                  backgroundColor: colors.bg,
                  color: colors.bodyText,
                  aspectRatio: format === 'auto' ? undefined : FORMAT_RATIOS[format],
                  minHeight: format === 'auto' ? 650 : undefined,
                }}
              >
                <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="max-w-[172px] truncate font-mono text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-emerald-500">{peerName.trim() || 'Anonymous Louisian'}</span>
                        </p>
                        {peerSchool && <span className="shrink-0 rounded border px-1 py-0.5 font-mono text-[8px]" style={{ color: colors.dim, borderColor: colors.border }}>{peerSchool}</span>}
                        {peerStreak > 0 && <span className="shrink-0 rounded border px-1 py-0.5 font-mono text-[8px]" style={{ color: colors.dim, borderColor: colors.border, backgroundColor: colors.surfaceAlt }}>🔥 {peerStreak}</span>}
                      </div>
                      <p className="mt-0.5 font-mono text-[9px] text-emerald-500">Online</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded-lg border px-2 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wide" style={{ borderColor: colors.border, backgroundColor: colors.surfaceAlt }}>End Chat</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border" style={{ borderColor: colors.border, color: colors.dim }}><Icon name="more" size={15} /></span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border" style={{ borderColor: colors.border, color: colors.dim }}><Icon name={darkMode ? 'sun' : 'moon'} size={14} /></span>
                  </div>
                </div>

                <div className="relative min-h-0 flex-1">
                  <div ref={messagesScrollRef} className={`px-3 pb-14 pt-4 ${format === 'auto' ? '' : 'h-full overflow-y-auto'}`} style={{ scrollbarWidth: 'none' }}>
                    <div className="mx-auto w-full max-w-[440px] space-y-3.5">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wide" style={{ color: colors.dim, borderColor: colors.border, backgroundColor: colors.surface }}><Icon name="shield" size={11} /> Anonymous Room Active</span>
                      </div>
                      {messages.length === 0 && (
                        <div className="pt-20 text-center font-mono text-xs" style={{ color: colors.subtle }}>No messages yet</div>
                      )}
                      {messages.map((message) => {
                        const isMe = message.side === 'you';
                        return (
                          <div key={message.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="w-fit max-w-[85%]">
                              <div className="mb-1 px-1 font-mono text-[10px]" style={{ color: colors.dim }}>
                                {isMe ? (myName.trim() || 'You') : (peerName.trim() || 'Anonymous Louisian')}
                              </div>
                              <button
                                type="button"
                                onClick={() => { setSelectedId(message.id); setMobilePanel('actions'); }}
                                title="Select message"
                                className={`block w-full cursor-pointer break-words px-3.5 py-2.5 text-left text-[13px] leading-[1.5] ${isMe ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'}`}
                                style={{
                                  backgroundColor: isMe ? colors.myBubble : colors.otherBubble,
                                  color: isMe ? colors.myText : colors.otherText,
                                  border: isMe ? '1px solid transparent' : `1px solid ${colors.border}`,
                                }}
                              >
                                {message.replyTo && (
                                  <div className="mb-2 rounded-md border-l-2 px-2.5 py-1.5 text-[11px]" style={{ backgroundColor: isMe ? 'rgba(0,0,0,0.18)' : colors.surfaceAlt, borderColor: isMe ? 'rgba(255,255,255,.7)' : '#059669' }}>
                                    <p className="font-mono text-[10px] font-semibold">{message.replyTo.side === 'you' ? (myName.trim() || 'You') : (peerName.trim() || 'Anonymous Louisian')}</p>
                                    <p className="max-w-[240px] truncate opacity-80">{message.replyTo.text}</p>
                                  </div>
                                )}
                                {message.image && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={message.image} alt="Chat attachment" className={`block max-h-56 w-full max-w-[290px] rounded-lg object-contain ${message.text ? 'mb-2' : ''}`} />
                                )}
                                {message.text && <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{message.text}</p>}
                              </button>
                              {message.reactions.length > 0 && (
                                <div className={`mt-1.5 flex flex-wrap gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  {message.reactions.map((emoji) => <span key={emoji} className="rounded-full border px-2 py-0.5 font-mono text-[10px]" style={{ color: colors.dim, backgroundColor: colors.surface, borderColor: colors.border }}>{emoji} <strong>1</strong></span>)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border px-2.5 py-1 font-mono text-[11px] font-bold tracking-tight" style={{ backgroundColor: darkMode ? 'rgba(23,23,23,.94)' : 'rgba(255,255,255,.94)', color: darkMode ? '#34d399' : '#047857', borderColor: colors.border }}>
                    tambayanslu.com
                  </div>
                </div>

                <div className="shrink-0 border-t px-3 py-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border" style={{ borderColor: colors.border, color: colors.dim }}><Icon name="image" size={16} /></div>
                    <div className="flex h-9 min-w-0 flex-1 items-center rounded-xl border px-3 text-[11px]" style={{ borderColor: colors.border, color: colors.subtle, backgroundColor: colors.bg }}>Type your anonymous message...</div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: darkMode ? '#059669' : '#171717' }}><Icon name="send" size={15} /></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mx-auto mt-4 max-w-[410px] text-center text-[11px] leading-5 text-neutral-500">Tap a chat bubble to edit, reply, or react. Only the chat screen is exported.</p>
          </section>

          <aside className="contents lg:order-3 lg:block">
            <section className={`${mobilePanel === 'actions' ? 'fixed inset-x-0 bottom-0 z-50 max-h-[84dvh] overflow-y-auto rounded-t-[26px] shadow-2xl' : 'hidden'} border border-neutral-200 bg-white p-5 lg:static lg:block lg:max-h-none lg:rounded-2xl lg:shadow-sm`}>
              <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">Message actions</h2><button type="button" onClick={() => setMobilePanel(null)} className="rounded-lg border border-neutral-200 p-2 lg:hidden" aria-label="Close message actions"><Icon name="x" /></button></div>
              <p className="mt-1 text-xs text-neutral-500">Tap any bubble in the preview.</p>
              {selectedMessage ? (
                <>
                  <p className="mt-4 truncate rounded-xl bg-neutral-100 px-3 py-2.5 text-xs text-neutral-700"><span className="font-bold">{selectedMessage.side === 'you' ? 'You' : 'Anonymous'}:</span> {selectedMessage.text || (selectedMessage.image ? 'Photo' : '')}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => startReply(selectedMessage)} className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-1 py-3 text-[11px] hover:bg-neutral-50"><Icon name="reply" size={16} /> Reply</button>
                    <button type="button" onClick={() => startEdit(selectedMessage)} className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-1 py-3 text-[11px] hover:bg-neutral-50"><Icon name="edit" size={16} /> Edit</button>
                    <button type="button" onClick={() => { deleteMessage(selectedMessage.id); setMobilePanel(null); }} className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-red-200 px-1 py-3 text-[11px] text-red-600 hover:bg-red-50"><Icon name="trash" size={16} /> Delete</button>
                  </div>
                  <p className="mb-2 mt-5 text-[11px] font-semibold text-neutral-600">Reactions</p>
                  <div className="grid grid-cols-6 gap-1">
                    {EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => toggleReaction(selectedMessage.id, emoji)} aria-pressed={selectedMessage.reactions.includes(emoji)} className={`flex h-10 items-center justify-center rounded-lg border text-base ${selectedMessage.reactions.includes(emoji) ? 'border-emerald-400 bg-emerald-50' : 'border-neutral-200 hover:bg-neutral-50'}`}>{emoji}</button>)}
                  </div>
                </>
              ) : <div className="mt-4 rounded-xl border border-dashed border-neutral-200 p-5 text-center text-xs text-neutral-400">No message selected</div>}
              <div className="mt-6 border-t border-neutral-100 pt-4">
                <button type="button" onClick={undoLast} disabled={!messages.length} className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 py-2.5 text-xs hover:bg-neutral-50 disabled:opacity-40"><Icon name="refresh" size={14} /> Undo last message</button>
                <button type="button" onClick={resetConversation} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs text-red-600 hover:bg-red-50"><Icon name="trash" size={14} /> Clear conversation</button>
              </div>
            </section>
          </aside>
        </main>
      </div>

      {/* Mobile: the editor is a bottom sheet so the preview stays centered and uncluttered. */}
      <nav aria-label="Creator tools" className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 gap-1 rounded-[20px] border border-neutral-200 bg-white/95 p-2 shadow-[0_8px_35px_rgba(0,0,0,0.2)] backdrop-blur-lg lg:hidden">
        <button type="button" onClick={() => setMobilePanel('write')} className="flex flex-col items-center gap-1 rounded-xl bg-neutral-900 px-1 py-2 text-[10px] font-semibold text-white"><Icon name="edit" size={17} /> Write</button>
        <button type="button" onClick={() => setMobilePanel('actions')} className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium text-neutral-600 hover:bg-neutral-100"><Icon name="reply" size={17} /> Message</button>
        <button type="button" onClick={() => setMobilePanel('style')} className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium text-neutral-600 hover:bg-neutral-100"><Icon name={darkMode ? 'moon' : 'sun'} size={17} /> Style</button>
        <button type="button" disabled={!messages.length || isExporting} onClick={downloadImage} className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"><Icon name="download" size={17} /> Export</button>
      </nav>
    </div>
  );
}
