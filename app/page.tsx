"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { BadgeCheck, Camera, Check, Download, ImagePlus, Moon, MoreHorizontal, Pencil, Plus, Reply, Send, Share2, SmilePlus, Sun, Trash2, X } from "lucide-react";
import { toPng } from "html-to-image";
import { getChatTheme } from "./chatStyles";

type Sender = "user" | "partner" | "system";
type Message = { id: string; sender: Sender; text: string; photo?: string; replyTo?: string; reaction?: string; time: string; unsent?: boolean };
const reactions = ["❤️", "😂", "👍", "😮", "😢"];
const id = () => crypto.randomUUID();
const now = () => new Date().toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });

export default function ConversationMaker() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sender, setSender] = useState<Sender>("user");
  const [draft, setDraft] = useState("");
  const [name, setName] = useState("Anonymous Louisian");
  const [department, setDepartment] = useState("SAMCIS");
  const [verified, setVerified] = useState(false);
  const [role, setRole] = useState("TEAM");
  const [dark, setDark] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [reactionFor, setReactionFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [exportSize, setExportSize] = useState("full");
  const [showTime, setShowTime] = useState(true);
  const [showSent, setShowSent] = useState(true);
  const [customTime, setCustomTime] = useState("");
  const captureRef = useRef<HTMLDivElement>(null);
  const wasPreviewBeforeExport = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const target = messages.find(m => m.id === replyTo);
  const theme = getChatTheme(dark);
  const colors = dark ? { bg: "#0b1220", bubble: "#1e293b", text: "#f8fafc", muted: "#94a3b8", line: "#334155", card: "#172338", secondary: "#1e293b" } : { bg: "#f4f8ff", bubble: "#ffffff", text: "#0f172a", muted: "#64748b", line: "#dbeafe", card: "#ffffff", secondary: "#eff6ff" };
  useEffect(() => { if (!preview) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages.length, preview]);
  function addMessage() {
    if (!draft.trim() && !photo) return;
    setMessages(prev => [...prev, { id: id(), sender, text: draft.trim(), ...(photo ? { photo } : {}), ...(replyTo ? { replyTo } : {}), time: customTime.trim() || now() }]);
    setDraft(""); setPhoto(null); setReplyTo(null); setActive(null);
  }
  function updateMessage(mid: string, patch: Partial<Message>) { setMessages(prev => prev.map(m => m.id === mid ? { ...m, ...patch } : m)); }
  function removeMessage(mid: string) { setMessages(prev => prev.filter(m => m.id !== mid)); setActive(null); }
  function chooseFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image."); return; }
    if (file.size > 12 * 1024 * 1024) { setError("Image must be smaller than 12 MB."); return; }
    const reader = new FileReader(); reader.onload = () => { setPhoto(String(reader.result)); setError(""); }; reader.readAsDataURL(file);
  }
  async function exportImage(share: boolean) {
    if (!captureRef.current || busy) return;
    setBusy(true); setError("");
    try {
      wasPreviewBeforeExport.current = preview;
      flushSync(() => setPreview(true));
      const node = captureRef.current;
      await document.fonts.ready;
      const presets: Record<string, { width: number; height: number }> = {
        square: { width: 1080, height: 1080 },
        portrait: { width: 1080, height: 1350 },
        story: { width: 1080, height: 1920 },
        landscape: { width: 1920, height: 1080 },
      };
      const preset = presets[exportSize];
      // Capture the entire conversation first, then fit it inside the selected canvas.
      // This avoids cropping messages in square, story and landscape exports.
      const contentWidth = Math.max(node.scrollWidth, node.clientWidth);
      const contentHeight = Math.max(node.scrollHeight, node.clientHeight);
      const source = await toPng(node, { pixelRatio: 2, backgroundColor: colors.bg, cacheBust: true, width: contentWidth, height: contentHeight, style: { height: `${contentHeight}px`, maxHeight: "none", overflow: "visible" } });
      let url = source;
      if (preset) {
        const img = new Image();
        img.src = source;
        await img.decode();
        const canvas = document.createElement("canvas");
        canvas.width = preset.width;
        canvas.height = preset.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const margin = 28;
        const scale = Math.min((canvas.width - margin * 2) / img.width, (canvas.height - margin * 2) / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        url = canvas.toDataURL("image/png");
      }
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "tambayanslu-conversation.png", { type: "image/png" });
      if (share && navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: "TambayanSLU Conversation" }); return; }
      const link = document.createElement("a"); link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove();
    } catch (e) { if ((e as Error).name !== "AbortError") setError("Could not export. Try fewer or smaller photos."); }
    finally { setPreview(wasPreviewBeforeExport.current); setBusy(false); }
  }
  return <main className="maker" style={{ background: dark ? "#080f1d" : "#eef4ff", color: colors.text }}>
    <style>{`
      .maker, .maker * { box-sizing:border-box } .maker { min-height:100dvh; font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; padding:18px; } .maker button,.maker input,.maker select,.maker textarea { font:inherit } .maker input,.maker textarea,.maker select { font-size:16px; } .maker button { cursor:pointer } .maker .layout { max-width:1330px;margin:auto;display:grid;grid-template-columns:330px minmax(0,1fr);gap:20px;align-items:start } .maker .panel { background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:18px;box-shadow:0 5px 24px #1e40af0a } .maker .field { width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--text);outline:none } .maker label { font-size:12px;font-weight:700;display:block;margin:13px 0 6px } .maker .btn { border:1px solid var(--line);background:var(--secondary);color:var(--text);padding:10px 12px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;gap:7px;font-size:13px;font-weight:700 } .maker .btn.blue { background:#2563eb;color:white;border-color:#2563eb } .maker .btn:disabled { opacity:.5;cursor:not-allowed } .maker .chat-outer { max-width:430px;margin:0 auto;width:100%;padding:13px;background:#172338;border:1px solid #40516b;border-radius:42px;box-shadow:0 22px 65px #0f172a30; } .maker .phone-label{text-align:center;font-size:12px;font-weight:750;letter-spacing:.04em;color:var(--text);margin-bottom:13px} .maker .chat-outer .export-area{border-radius:29px!important;} .maker .phone-home{height:5px;width:112px;background:#94a3b8;border-radius:10px;margin:12px auto 0;} .maker .chat-scroll { height:min(68dvh,740px);overflow-y:auto;overscroll-behavior:contain;padding:20px 14px 12px; } .maker .chat-row { display:flex;margin-bottom:21px } .maker .bubble { padding:11px 15px;border-radius:22px;font-size:14px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;box-shadow:0 4px 14px #0f172a12;max-width:100%;width:fit-content } .maker .actions { display:flex;gap:5px;margin-top:6px;flex-wrap:wrap } .maker .tiny { border:1px solid var(--line);border-radius:9px;background:var(--secondary);color:var(--text);padding:5px 7px;font-size:11px;display:inline-flex;align-items:center;gap:4px } .maker .export-area { background:radial-gradient(ellipse 85% 45% at 50% -10%,#dbeafe 0%,transparent 75%),linear-gradient(180deg,#f8fbff 0%,#eef5ff 65%,#f8fafc 100%); } .maker .composer { display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--panel);border-radius:35px;padding:6px 7px 6px 12px;min-width:0; } .maker .composer input { min-width:0;flex:1;border:0;outline:none;background:transparent;color:var(--text) } .maker .side { position:sticky;top:18px;max-height:calc(100dvh - 36px);overflow-y:auto } .maker .watermark { text-align:center;font-size:12px;font-weight:800;letter-spacing:.035em;padding:12px 0 18px;color:#64748b } .maker .message-photo { display:block;max-width:100%;width:auto;max-height:350px;object-fit:contain;border-radius:12px;margin-top:5px } .maker .chat-title { background:var(--panel);border:1px solid var(--line);border-radius:25px;display:flex;align-items:center;gap:10px;padding:12px 14px;box-shadow:0 10px 35px #2563eb14 } .maker .tool-row { display:flex;gap:8px;flex-wrap:wrap } .maker .mobile-edit { display:none } .maker .chat-outer .capture-content { min-height:260px; } @media(max-width:850px){ .maker{padding:10px} .maker .layout{display:flex;flex-direction:column;gap:12px}.maker .side{position:static;max-height:none;width:100%}.maker .chat-outer{width:100%;max-width:430px;padding:8px;border-radius:32px}.maker .chat-outer .export-area{border-radius:25px!important}.maker .chat-scroll{height:min(54dvh,560px)}.maker .panel{padding:13px;border-radius:18px}.maker .mobile-edit{display:block} } @media(max-width:390px){.maker .bubble{font-size:13px}.maker .chat-scroll{padding:15px 9px}.maker .btn{padding:9px 10px}} 
    `}</style>
    <div className="layout" style={{ "--panel": colors.card, "--line": colors.line, "--text": colors.text, "--secondary": colors.secondary } as React.CSSProperties}>
      <aside className="panel side">
        <div style={{ fontSize:18,fontWeight:850 }}>TambayanSLU</div><div style={{fontSize:12,color:colors.muted,marginTop:2}}>Conversation Maker</div>
        <label>Chatmate name</label><input className="field" value={name} maxLength={50} onChange={e=>setName(e.target.value)} />
        <label>Department / subtitle</label><input className="field" value={department} maxLength={60} onChange={e=>setDepartment(e.target.value)} />
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)} id="verified"/><label htmlFor="verified" style={{margin:0}}>Show verified team badge</label></div>
        {verified && <><label>Badge role</label><input className="field" value={role} onChange={e=>setRole(e.target.value)} maxLength={24}/></>}
        <label>Message sender</label><select className="field" value={sender} onChange={e=>setSender(e.target.value as Sender)}><option value="user">You (right)</option><option value="partner">Chatmate (left)</option><option value="system">System notice (center)</option></select>
        <label>Custom message time (optional)</label><input className="field" placeholder="e.g. 7:30 PM" value={customTime} onChange={e=>setCustomTime(e.target.value)} maxLength={24}/>
        <div style={{display:"flex",gap:14,marginTop:14,flexWrap:"wrap"}}><label style={{margin:0}}><input type="checkbox" checked={showTime} onChange={e=>setShowTime(e.target.checked)}/> Timestamps</label><label style={{margin:0}}><input type="checkbox" checked={showSent} onChange={e=>setShowSent(e.target.checked)}/> Sent status</label></div>
        <div className="tool-row" style={{marginTop:16}}><button className="btn" onClick={()=>setDark(v=>!v)}>{dark?<Sun size={15}/>:<Moon size={15}/>} {dark?"Light":"Dark"}</button><button className="btn" onClick={()=>setPreview(v=>!v)}>{preview?"Edit mode":"Clean preview"}</button><button className="btn" onClick={()=>{if(confirm("Clear all messages?"))setMessages([])}}><Trash2 size={14}/> Clear</button></div>
        <div style={{height:1,background:colors.line,margin:"18px 0"}}/>
        <div style={{fontSize:13,fontWeight:750,marginBottom:10}}>Export conversation</div>
        <label htmlFor="export-size">Image size</label>
        <select id="export-size" className="field" value={exportSize} onChange={e=>setExportSize(e.target.value)}>
          <option value="full">Full conversation (all messages)</option>
          <option value="square">Square (1080 × 1080)</option>
          <option value="portrait">Portrait (1080 × 1350)</option>
          <option value="story">Story / Reel (1080 × 1920)</option>
          <option value="landscape">Landscape (1920 × 1080)</option>
        </select>
        <p style={{fontSize:11,color:colors.muted,lineHeight:1.5}}>Fixed-size exports fit the full chat inside the selected image. Very long chats may appear smaller. Use Full conversation to keep text readable.</p>
        <div className="tool-row"><button className="btn blue" disabled={busy} onClick={()=>void exportImage(false)}><Download size={16}/>{busy?"Exporting...":"Download PNG"}</button><button className="btn" disabled={busy} onClick={()=>void exportImage(true)}><Share2 size={16}/> Share / Save</button></div>
        <p style={{fontSize:11,color:colors.muted,lineHeight:1.6}}>On iPhone, tap Share / Save and choose Save Image when available. On Android, download the PNG or use the share menu. Gallery behavior depends on the browser.</p>
        {error && <p role="alert" style={{fontSize:12,color:"#e11d48"}}>{error}</p>}
      </aside>
      <section className="chat-outer">
        <div className="phone-label" style={{color:"#dbeafe"}}>MOBILE CHAT PREVIEW · 390 PX</div>
        <div ref={captureRef} className="export-area tslu-chat-room" style={{...theme.room,position:"relative",inset:"auto",height:"auto",minHeight:740,zIndex:1,borderRadius:0,overflow:"hidden",border:`1px solid ${colors.line}`,width:"100%"}}>
          <style>{`.tslu-chat-room,.tslu-chat-room *{box-sizing:border-box}.tslu-chat-room button,.tslu-chat-room input{font-family:inherit}.tslu-chat-room .tslu-message-actions{opacity:0;transition:opacity .12s}.tslu-chat-room .tslu-message-column:hover .tslu-message-actions,.tslu-chat-room .tslu-message-column:focus-within .tslu-message-actions{opacity:1}@media(hover:none){.tslu-chat-room .tslu-message-actions{opacity:1}}@media(max-width:370px){.tslu-chat-room .tslu-header{gap:6px!important;padding:8px!important}}`}</style>
          <header style={theme.headerWrap} className="tslu-header-wrap"><div style={theme.header} className="tslu-header">
            <div style={theme.info}><div style={theme.eyebrow}>CHATTING WITH</div><div style={theme.nameLine}><h1 style={theme.name}>{name||"Anonymous Louisian"}</h1>{verified&&<span style={{display:"inline-flex",alignItems:"center",gap:4,flexShrink:0,color:dark?"#93c5fd":"#2563eb",fontSize:10,fontWeight:800}}><BadgeCheck size={17} fill={dark?"#1d4ed8":"#2563eb"} color="#fff" strokeWidth={2.2}/>{role.toUpperCase()}</span>}<span style={theme.dot}/></div><p style={theme.school}>{department} · Connected</p></div>
            <div style={theme.headerActions}><button type="button" style={theme.roundButton} aria-label="More options"><MoreHorizontal size={20}/></button></div>
          </div></header>
          <section className="tslu-scroll" style={{...theme.scroll,flex:"1 1 auto",height:preview?"auto":"min(66dvh,610px)",overflowY:preview?"visible":"auto",padding:"18px 12px 12px"}}>
            <div style={theme.conversation}><p style={theme.conversationLabel}>TambayanSLU  ·  Anonymous Chat</p><div style={{...theme.stack,marginTop:messages.length?"auto":0}}>
              {messages.map(m=>{const outgoing=m.sender==="user";const original=messages.find(x=>x.id===m.replyTo);if(m.sender==="system")return <div key={m.id} style={theme.systemRow}><span style={theme.systemNotice}>{m.text}</span>{!preview&&<button className="tiny" onClick={()=>removeMessage(m.id)}><Trash2 size={12}/></button>}</div>;return <div key={m.id} style={{...theme.row,justifyContent:outgoing?"flex-end":"flex-start"}}><div className="tslu-message-column" style={{...theme.column,alignItems:outgoing?"flex-end":"flex-start",position:"relative"}}>
                <div style={{position:"relative",maxWidth:"100%"}}><div className="tslu-message-bubble" style={{...theme.bubble,borderBottomRightRadius:outgoing?8:22,borderBottomLeftRadius:outgoing?22:8,background:m.unsent?(dark?"#182337":"#f1f5f9"):outgoing?"#2563eb":dark?"#1e293b":"#ffffff",color:m.unsent?(dark?"#94a3b8":"#64748b"):outgoing?"#ffffff":dark?"#f1f5f9":"#1e293b",border:m.unsent?"1px dashed #64748b66":outgoing?"1px solid transparent":dark?"1px solid #334155":"1px solid #e2e8f0"}}>
                  {m.replyTo&&<button type="button" onClick={()=>document.getElementById(`chat-message-${m.replyTo}`)?.scrollIntoView({behavior:"smooth",block:"center"})} style={{display:"block",width:"100%",marginBottom:8,padding:"5px 9px",textAlign:"left",border:0,borderLeft:"3px solid #93c5fd",borderRadius:6,background:outgoing?"rgba(255,255,255,.16)":dark?"#334155":"#eff6ff",color:outgoing?"#eff6ff":dark?"#cbd5e1":"#475569",fontSize:11,cursor:"pointer"}}><span style={{display:"block",fontWeight:800,marginBottom:2}}>{original?.sender==="user"?"You":"Chatmate"}</span><span style={{display:"block",maxWidth:260,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{original?.unsent?"Message unsent":original?.photo?"Photo":original?.text||"Original message unavailable"}</span></button>}
                  <div id={`chat-message-${m.id}`}>{m.unsent?<span style={{fontStyle:"italic",fontWeight:400}}>Message unsent</span>:m.photo?<><img src={m.photo} alt="Shared chat photo" style={{display:"block",maxWidth:"min(100%, 300px)",maxHeight:320,width:"auto",height:"auto",borderRadius:12,objectFit:"contain"}}/>{m.text&&<div style={{marginTop:6}}>{m.text}</div>}</>:m.text}</div>
                </div>{!preview&&!m.unsent&&<div className="tslu-message-actions" style={{position:"absolute",bottom:0,zIndex:3,...(outgoing?{right:"calc(100% + 4px)"}:{left:"calc(100% + 4px)"}),display:"flex",alignItems:"center",gap:1,padding:2,borderRadius:12,background:dark?"#1e293b":"#eff6ff"}}><button className="tiny" title="Reply" onClick={()=>setReplyTo(m.id)}><Reply size={15}/></button><button className="tiny" title="React" onClick={()=>setReactionFor(reactionFor===m.id?null:m.id)}><SmilePlus size={15}/></button><button className="tiny" title="Actions" onClick={()=>setActive(active===m.id?null:m.id)}><MoreHorizontal size={16}/></button></div>}</div>
                {m.reaction&&!m.unsent&&<div style={{display:"flex",position:"relative",zIndex:2,marginTop:-9,paddingInline:9}}><span style={{fontSize:12,background:dark?"#1e293b":"#eff6ff",border:`1px solid ${colors.line}`,padding:"2px 7px",borderRadius:20}}>{m.reaction} 1</span></div>}
                {!preview&&reactionFor===m.id&&<div className="actions">{reactions.map(r=><button key={r} className="tiny" style={{fontSize:18}} onClick={()=>{updateMessage(m.id,{reaction:m.reaction===r?undefined:r});setReactionFor(null)}}>{r}</button>)}</div>}
                {!preview&&active===m.id&&<div className="actions"><button className="tiny" onClick={()=>{const value=prompt("Edit message",m.text);if(value!==null)updateMessage(m.id,{text:value});setActive(null)}}><Pencil size={12}/> Edit</button><button className="tiny" onClick={()=>{updateMessage(m.id,{unsent:!m.unsent});setActive(null)}}>{m.unsent?"Restore":"Unsend"}</button><button className="tiny" onClick={()=>removeMessage(m.id)}><Trash2 size={12}/> Delete</button><button className="tiny" onClick={()=>{setSender(m.sender);setActive(null)}}>Use sender</button></div>}
                {showTime&&<span style={theme.time}>{m.time}{outgoing&&showSent&&!m.unsent?" · Sent":""}</span>}
              </div></div>})}
            </div><div ref={bottomRef} style={{height:1,flexShrink:0}}/></div>
          </section>
          <footer style={theme.footer} className="tslu-footer">
            {!preview&&target&&<div style={{maxWidth:1160,margin:"0 auto 10px",display:"flex",alignItems:"center",gap:9,padding:"8px 12px",borderLeft:"3px solid #3b82f6",borderRadius:9,background:dark?"#1e293b":"#eaf2ff",color:dark?"#e2e8f0":"#334155"}}><Reply size={17}/><div style={{flex:1,minWidth:0,fontSize:11}}>Replying to {target.sender==="user"?"your message":"chatmate"}: {target.photo?"Photo":target.text}</div><button className="tiny" onClick={()=>setReplyTo(null)}><X size={15}/></button></div>}
            {!preview&&photo&&<div style={{maxWidth:1160,margin:"0 auto 10px",display:"flex",alignItems:"center",gap:10}}><img src={photo} alt="Selected photo" style={{width:80,height:80,objectFit:"cover",borderRadius:14}}/><button className="tiny" onClick={()=>setPhoto(null)}><X size={15}/></button></div>}
            <div style={theme.dock}><button type="button" style={theme.end} onClick={()=>{if(confirm("Clear the conversation?"))setMessages([])}}>End</button><div style={theme.composer}><input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{chooseFile(e.target.files?.[0]);e.target.value=""}}/><button type="button" onClick={()=>fileRef.current?.click()} style={{...theme.roundButton,width:35,height:35,border:0,background:"transparent",boxShadow:"none"}} aria-label="Attach photo"><ImagePlus size={20}/></button><input style={theme.input} type="text" aria-label="Chat message" placeholder="Say hi!" value={preview?"":draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addMessage()}}}/><button type="button" style={theme.send} onClick={addMessage} aria-label="Send message"><Send size={19}/></button></div></div>
          </footer>
          <div style={{textAlign:"center",fontSize:11,fontWeight:800,letterSpacing:".035em",padding:"0 0 12px",color:dark?"#94a3b8":"#64748b"}}>tambayanslu.com</div>
        </div>
        <div className="phone-home" aria-hidden="true" />
        {!preview&&<div className="panel" style={{marginTop:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}><span style={{fontSize:12,color:colors.muted}}>Adding as: <strong>{sender==="user"?"You":sender==="partner"?"Chatmate":"System"}</strong></span><button className="btn" onClick={()=>setSender(sender==="user"?"partner":"user")}>Switch sender</button></div>}
      </section>
    </div>
  </main>;
}
