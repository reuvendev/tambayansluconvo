"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Camera, Check, Download, ImagePlus, Moon, MoreHorizontal, Pencil, Plus, Reply, Send, Share2, SmilePlus, Sun, Trash2, X } from "lucide-react";
import { toPng } from "html-to-image";

type Sender = "user" | "partner" | "system";
type Message = { id: string; sender: Sender; text: string; photo?: string; replyTo?: string; reaction?: string; time: string; unsent?: boolean };
const reactions = ["❤️", "😂", "👍", "😮", "😢"];
const id = () => crypto.randomUUID();
const now = () => new Date().toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });

export default function ConversationMaker() {
  const [messages, setMessages] = useState<Message[]>([{ id: "welcome", sender: "partner", text: "Hello!", time: "7:00 PM" }, { id: "reply", sender: "user", text: "Hi! Kumusta?", time: "7:01 PM" }]);
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
  const [showTime, setShowTime] = useState(true);
  const [showSent, setShowSent] = useState(true);
  const [customTime, setCustomTime] = useState("");
  const captureRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const target = messages.find(m => m.id === replyTo);
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
      const node = captureRef.current;
      await document.fonts.ready;
      const url = await toPng(node, { pixelRatio: 2, backgroundColor: colors.bg, cacheBust: true, width: node.scrollWidth, height: node.scrollHeight, style: { height: `${node.scrollHeight}px`, maxHeight: "none", overflow: "visible" } });
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "tambayanslu-conversation.png", { type: "image/png" });
      if (share && navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: "TambayanSLU Conversation" }); return; }
      const link = document.createElement("a"); link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove();
    } catch (e) { if ((e as Error).name !== "AbortError") setError("Could not export. Try fewer or smaller photos."); }
    finally { setBusy(false); }
  }
  return <main className="maker" style={{ background: dark ? "#080f1d" : "#eef4ff", color: colors.text }}>
    <style>{`
      .maker, .maker * { box-sizing:border-box } .maker { min-height:100dvh; font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; padding:18px; } .maker button,.maker input,.maker select,.maker textarea { font:inherit } .maker input,.maker textarea,.maker select { font-size:16px; } .maker button { cursor:pointer } .maker .layout { max-width:1330px;margin:auto;display:grid;grid-template-columns:330px minmax(0,1fr);gap:20px;align-items:start } .maker .panel { background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:18px;box-shadow:0 5px 24px #1e40af0a } .maker .field { width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--text);outline:none } .maker label { font-size:12px;font-weight:700;display:block;margin:13px 0 6px } .maker .btn { border:1px solid var(--line);background:var(--secondary);color:var(--text);padding:10px 12px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;gap:7px;font-size:13px;font-weight:700 } .maker .btn.blue { background:#2563eb;color:white;border-color:#2563eb } .maker .btn:disabled { opacity:.5;cursor:not-allowed } .maker .chat-outer { max-width:850px;margin:auto;width:100%; } .maker .chat-scroll { height:min(68dvh,740px);overflow-y:auto;overscroll-behavior:contain;padding:20px 14px 12px; } .maker .chat-row { display:flex;margin-bottom:21px } .maker .bubble { padding:11px 15px;border-radius:22px;font-size:14px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;box-shadow:0 4px 14px #0f172a12;max-width:100%;width:fit-content } .maker .actions { display:flex;gap:5px;margin-top:6px;flex-wrap:wrap } .maker .tiny { border:1px solid var(--line);border-radius:9px;background:var(--secondary);color:var(--text);padding:5px 7px;font-size:11px;display:inline-flex;align-items:center;gap:4px } .maker .export-area { background:radial-gradient(ellipse 85% 45% at 50% -10%,#dbeafe 0%,transparent 75%),linear-gradient(180deg,#f8fbff 0%,#eef5ff 65%,#f8fafc 100%); } .maker .composer { display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--panel);border-radius:35px;padding:6px 7px 6px 12px;min-width:0; } .maker .composer input { min-width:0;flex:1;border:0;outline:none;background:transparent;color:var(--text) } .maker .side { position:sticky;top:18px;max-height:calc(100dvh - 36px);overflow-y:auto } .maker .watermark { text-align:center;font-size:12px;font-weight:800;letter-spacing:.035em;padding:12px 0 18px;color:#64748b } .maker .message-photo { display:block;max-width:100%;width:auto;max-height:350px;object-fit:contain;border-radius:12px;margin-top:5px } .maker .chat-title { background:var(--panel);border:1px solid var(--line);border-radius:25px;display:flex;align-items:center;gap:10px;padding:12px 14px;box-shadow:0 10px 35px #2563eb14 } .maker .tool-row { display:flex;gap:8px;flex-wrap:wrap } .maker .mobile-edit { display:none } .maker .chat-outer .capture-content { min-height:260px; } @media(max-width:850px){ .maker{padding:10px} .maker .layout{display:flex;flex-direction:column;gap:12px}.maker .side{position:static;max-height:none;width:100%}.maker .chat-outer{width:100%}.maker .chat-scroll{height:min(54dvh,560px)}.maker .panel{padding:13px;border-radius:18px}.maker .mobile-edit{display:block} } @media(max-width:390px){.maker .bubble{font-size:13px}.maker .chat-scroll{padding:15px 9px}.maker .btn{padding:9px 10px}} 
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
        <div className="tool-row"><button className="btn blue" disabled={busy} onClick={()=>void exportImage(false)}><Download size={16}/>{busy?"Exporting...":"Download PNG"}</button><button className="btn" disabled={busy} onClick={()=>void exportImage(true)}><Share2 size={16}/> Share / Save</button></div>
        <p style={{fontSize:11,color:colors.muted,lineHeight:1.6}}>On iPhone, tap Share / Save and choose Save Image when available. On Android, download the PNG or use the share menu. Gallery behavior depends on the browser.</p>
        {error && <p role="alert" style={{fontSize:12,color:"#e11d48"}}>{error}</p>}
      </aside>
      <section className="chat-outer">
        <div ref={captureRef} className="export-area" style={{borderRadius:25,overflow:"hidden",border:`1px solid ${colors.line}`,background:dark?"radial-gradient(ellipse 85% 45% at 50% -10%,#172f5a 0%,transparent 75%),linear-gradient(180deg,#0b1220 0%,#0f172a 65%,#0b1220 100%)":undefined}}>
          <div style={{padding:"12px 12px 0"}}><div className="chat-title" style={{background:dark?"#0f172a":"#ffffff",borderColor:colors.line}}>
            <div style={{minWidth:0,flex:1}}><div style={{fontSize:9,fontWeight:800,letterSpacing:".09em",color:colors.muted}}>CHATTING WITH</div><div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}><strong style={{fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name||"Anonymous Louisian"}</strong>{verified&&<span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:10,color:"#2563eb",fontWeight:800}}><BadgeCheck size={16} fill="#2563eb" color="white"/>{role.toUpperCase()}</span>}<span style={{width:8,height:8,background:"#3b82f6",borderRadius:20,flexShrink:0}}/></div><div style={{fontSize:10,color:colors.muted,marginTop:2}}>{department} · Connected</div></div><MoreHorizontal size={20} color="#2563eb"/>
          </div></div>
          <div className="chat-scroll" style={{height:preview?"auto":undefined,overflow:preview?"visible":undefined}}><div className="capture-content" style={{display:"flex",flexDirection:"column",justifyContent:"flex-end"}}><p style={{textAlign:"center",fontSize:10,color:colors.muted,margin:"0 0 24px",fontWeight:650}}>TambayanSLU · Anonymous Chat</p>
            {messages.map(m=>{const outgoing=m.sender==="user";const original=messages.find(x=>x.id===m.replyTo);return <div key={m.id} className="chat-row" style={{justifyContent:m.sender==="system"?"center":outgoing?"flex-end":"flex-start"}}><div style={{maxWidth:m.sender==="system"?"90%":"82%",display:"flex",flexDirection:"column",alignItems:outgoing?"flex-end":m.sender==="system"?"center":"flex-start",minWidth:0}}>
              <div className="bubble" style={{background:m.sender==="system"?colors.secondary:outgoing?"#2563eb":colors.bubble,color:outgoing?"#fff":colors.text,border:m.sender==="system"||!outgoing?`1px solid ${colors.line}`:"1px solid transparent",borderBottomRightRadius:outgoing?8:22,borderBottomLeftRadius:!outgoing&&m.sender!=="system"?8:22,fontSize:m.sender==="system"?11:14}}>
                {m.replyTo&&<div style={{borderLeft:"3px solid #93c5fd",background:outgoing?"#ffffff24":colors.secondary,padding:"6px 9px",borderRadius:6,marginBottom:8,fontSize:11}}><strong>{original?.sender==="user"?"You":"Chatmate"}</strong><div style={{maxWidth:260,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{original?.unsent?"Message unsent":original?.photo?"Photo":original?.text||"Original message unavailable"}</div></div>}
                {m.unsent?<i style={{opacity:.75}}>Message unsent</i>:<>{m.text}{m.photo&&<img className="message-photo" src={m.photo} alt="Chat attachment"/>}</>}
              </div>
              {m.reaction&&!m.unsent&&<span style={{fontSize:12,background:colors.secondary,border:`1px solid ${colors.line}`,padding:"2px 7px",borderRadius:20,marginTop:-7,zIndex:1}}>{m.reaction} 1</span>}
              {showTime&&m.sender!=="system"&&<span style={{fontSize:10,color:colors.muted,marginTop:4}}>{m.time}{outgoing&&showSent&&!m.unsent?" · Sent":""}</span>}
              {!preview&&<div className="actions"><button className="tiny" onClick={()=>{setReplyTo(m.id);setActive(null)}} title="Reply"><Reply size={13}/></button><button className="tiny" onClick={()=>{setReactionFor(reactionFor===m.id?null:m.id);setActive(null)}} title="React"><SmilePlus size={13}/></button><button className="tiny" onClick={()=>setActive(active===m.id?null:m.id)} title="More"><MoreHorizontal size={13}/></button></div>}
              {!preview&&reactionFor===m.id&&<div className="actions">{reactions.map(r=><button key={r} className="tiny" style={{fontSize:18}} onClick={()=>{updateMessage(m.id,{reaction:m.reaction===r?undefined:r});setReactionFor(null)}}>{r}</button>)}</div>}
              {!preview&&active===m.id&&<div className="actions"><button className="tiny" onClick={()=>{const value=prompt("Edit message",m.text);if(value!==null)updateMessage(m.id,{text:value});setActive(null)}}><Pencil size={12}/> Edit</button><button className="tiny" onClick={()=>{updateMessage(m.id,{unsent:!m.unsent});setActive(null)}}>{m.unsent?"Restore":"Unsend"}</button><button className="tiny" onClick={()=>removeMessage(m.id)}><Trash2 size={12}/> Delete</button><button className="tiny" onClick={()=>{setSender(m.sender);setActive(null)}}>Use sender</button></div>}
            </div></div>})}
            <div ref={bottomRef}/></div></div>
          <div className="watermark">tambayanslu.com</div>
        </div>
        {!preview&&<div className="panel" style={{marginTop:12}}>
          {target&&<div style={{background:colors.secondary,padding:9,borderRadius:10,marginBottom:10,display:"flex",gap:8,alignItems:"center",fontSize:12}}><Reply size={15}/><span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Replying to {target.sender==="user"?"You":"Chatmate"}: {target.photo?"Photo":target.text}</span><button className="tiny" onClick={()=>setReplyTo(null)}><X size={14}/></button></div>}
          {photo&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><img src={photo} alt="Selected attachment" style={{height:70,width:70,objectFit:"cover",borderRadius:12}}/><button className="tiny" onClick={()=>setPhoto(null)}><X size={14}/> Remove</button></div>}
          <div className="composer"><input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{chooseFile(e.target.files?.[0]);e.target.value=""}}/><button title="Attach photo" aria-label="Attach photo" onClick={()=>fileRef.current?.click()} style={{border:0,background:"transparent",color:"#2563eb",padding:5}}><ImagePlus size={21}/></button><input value={draft} maxLength={2000} placeholder={sender==="system"?"Add system notice...":"Say hi!"} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addMessage()}}}/><button title="Add message" onClick={addMessage} disabled={!draft.trim()&&!photo} style={{border:0,background:"#2563eb",color:"white",width:38,height:38,borderRadius:40,display:"grid",placeItems:"center"}}><Send size={18}/></button></div>
          <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginTop:9,fontSize:11,color:colors.muted}}><span>Adding as: <strong>{sender==="user"?"You":sender==="partner"?"Chatmate":"System"}</strong></span><button className="tiny" onClick={()=>setSender(sender==="user"?"partner":"user")}><Plus size={13}/> Switch sender</button></div>
        </div>}
      </section>
    </div>
  </main>;
}
