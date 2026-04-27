"use client";
import { useState, useRef, useEffect } from "react";
import { C, GENRES } from "@/lib/tokens";
import { apiScanIsbn, apiAddBook, apiUpdateBook } from "@/lib/client";
import { FInput, FSelect, Btn, Spinner, useToast, Badge } from "../shared/ui";

export function AdminScanner() {
  const [isbn, setIsbn] = useState("");
  const [status, setStatus] = useState<"idle" | "scanning" | "found" | "new">("idle");
  const [mode, setMode] = useState<"usb" | "camera">("usb");
  const [bookData, setBookData] = useState<any>(null); // For found DB book
  const [form, setForm] = useState<any>({}); // For new book
  const { toast, ToastContainer } = useToast();
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the hidden/styled input for barcode scanners
  useEffect(() => {
    if (status === "idle" && mode === "usb") {
      inputRef.current?.focus();
    }
  }, [status, mode]);

  // Keep focus on page interaction so scanner doesn't misfire
  useEffect(() => {
    const handleGlobalClick = () => {
      if (status === "idle" && mode === "usb") inputRef.current?.focus();
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [status, mode]);

  // Html5 QrCode Scanner Logic
  useEffect(() => {
    if (mode === "camera" && status === "idle") {
      const { Html5QrcodeScanner } = require("html5-qrcode");
      
      const scanner = new Html5QrcodeScanner("qr-reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0
      }, false);
      
      scanner.render(
        (decodedText: string) => {
          setIsbn(decodedText);
          scanner.clear();
          setMode("usb");
          executeScan(decodedText);
        }, 
        () => { /* ignore scan frame errors */ }
      );

      return () => {
        scanner.clear().catch((e: any) => console.error("Failed to clear scanner", e));
      };
    }
  }, [mode, status]);

  const executeScan = async (code: string) => {
    if (!code.trim()) return;
    setIsbn(code);
    setStatus("scanning");
    try {
      const res = await apiScanIsbn(code);
      if (res.exists) {
        setBookData(res.book);
        setStatus("found");
        toast("Book located in inventory!");
      } else {
        const meta = res.metadata || { title: "", author: "", year: new Date().getFullYear(), description: "", genre: "General", cover: "📖", thumbnail: null, publisher: "", pageCount: null };
        setForm({
          title: meta.title, author: meta.author, isbn: code, genre: meta.genre,
          cover: meta.cover, year: meta.year, total: 1, available: 1,
          description: meta.description, thumbnail: meta.thumbnail,
          publisher: meta.publisher, pageCount: meta.pageCount,
        });
        setStatus("new");
        toast(res.metadata ? `✅ Found: "${meta.title}" — Confirm & save below.` : "ISBN not found in Google Books. Enter details manually.", "ok");
      }
    } catch (err: any) {
      toast(err.message || "Failed to scan", "err");
      setStatus("idle");
      setIsbn("");
    }
  };

  const handleAddStock = async () => {
    if (!bookData) return;
    try {
      const updated = { ...bookData, total: bookData.total + 1, available: bookData.available + 1 };
      await apiUpdateBook(bookData.id, updated);
      toast("Stock increased by +1!");
      setBookData(updated);
    } catch (err: any) {
      toast(err.message, "err");
    }
  };

  const saveNewBook = async () => {
    if (!form.title || !form.author) return toast("Title and Author required", "err");
    try {
      await apiAddBook(form);
      toast("New book added to library!");
      setStatus("idle");
      setIsbn("");
    } catch (err: any) {
      toast(err.message, "err");
    }
  };

  const resetScanner = () => {
    setStatus("idle");
    setIsbn("");
    setBookData(null);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 0" }}>
      <ToastContainer />
      <style>{`@media(max-width:560px){.scan-form-grid{grid-template-columns:1fr!important}.scan-header{flex-direction:column!important;align-items:flex-start!important}}`}</style>
      
      <div className="scan-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 28, color: C.text }}>QR & Barcode Scanner</h1>
          <p style={{ margin: "4px 0 0", color: C.textLight, fontSize: 14 }}>Scan an ISBN barcode to update stock or add new books.</p>
        </div>
        {status === "idle" && (
          <div style={{ display: "flex", background: C.inputBg, border: `1.5px solid ${C.inputBorder}`, padding: 4, borderRadius: 12 }}>
            <button onClick={() => setMode("usb")} style={{ padding: "8px 16px", borderRadius: 8, background: mode === "usb" ? C.primary : "transparent", color: mode === "usb" ? "#fff" : C.textMid, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>USB Scanner</button>
            <button onClick={() => setMode("camera")} style={{ padding: "8px 16px", borderRadius: 8, background: mode === "camera" ? C.primary : "transparent", color: mode === "camera" ? "#fff" : C.textMid, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>Device Camera</button>
          </div>
        )}
      </div>

      {status === "idle" || status === "scanning" ? (
        <div style={{ background: C.cardBg, border: `2px dashed ${status === "scanning" ? C.primary : C.cardBorder}`, borderRadius: 20, padding: 40, textAlign: "center", boxShadow: C.shadow, transition: "all 0.3s" }}>
          {status === "scanning" ? (
            <div style={{ padding: 40 }}><Spinner /></div>
          ) : mode === "camera" ? (
            <div style={{ maxWidth: 500, margin: "0 auto" }}>
              <div id="qr-reader" style={{ borderRadius: 16, overflow: "hidden", border: `2px solid ${C.cardBorder}` }}></div>
              <p style={{ color: C.textMid, fontSize: 13, marginTop: 20 }}>Point your device camera closely at the book's barcode.</p>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); executeScan(isbn); }}>
              <div style={{ fontSize: 60, marginBottom: 20, animation: "pulse 2s infinite" }}>📷</div>
              <h2 style={{ color: C.text, fontSize: 20, margin: "0 0 10px" }}>Ready to Scan</h2>
              <p style={{ color: C.textMid, fontSize: 13, marginBottom: 30 }}>Ensure your USB barcode scanner is plugged in, or type the code below and hit Enter.</p>
              
              <div style={{ maxWidth: 400, margin: "0 auto", position: "relative" }}>
                <input 
                  ref={inputRef}
                  value={isbn} 
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="Scan or type ISBN..."
                  style={{ width: "100%", padding: "16px 20px", fontSize: 20, textAlign: "center", borderRadius: 14, border: `1.5px solid ${C.primary}55`, background: C.primaryBg, color: C.text, outline: "none", boxShadow: `0 4px 15px ${C.primary}20` }}
                />
              </div>
            </form>
          )}
        </div>
      ) : status === "found" && bookData ? (
        <div style={{ background: C.greenBg, border: `1.5px solid ${C.green}40`, borderRadius: 20, padding: 30, boxShadow: C.shadow }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
            <div style={{ background: C.green, color: "#fff", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✓</div>
            <div style={{ color: C.green, fontWeight: 700, fontSize: 16 }}>Existing Book Located</div>
          </div>
          
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: `1px solid ${C.green}20`, display: "flex", gap: 24 }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, background: C.greenBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, flexShrink: 0 }}>{bookData.cover}</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: "0 0 6px", color: C.text, fontSize: 22, fontFamily: "'Lora',serif" }}>{bookData.title}</h2>
              <div style={{ color: C.textMid, fontSize: 14, marginBottom: 12 }}>by {bookData.author} · ISBN: {bookData.isbn}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <Badge color={C.green}>{bookData.available} Available</Badge>
                <Badge color={C.primary}>{bookData.total} Total Stock</Badge>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 160 }}>
              <Btn onClick={handleAddStock} variant="success" style={{ padding: "12px 16px", flex: 1 }}>+1 to Stock</Btn>
              <Btn onClick={resetScanner} variant="ghost" style={{ padding: "12px 16px", border: `1px solid ${C.inputBorder}` }}>Scan Another</Btn>
            </div>
          </div>
        </div>
      ) : status === "new" ? (
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 20, padding: 30, boxShadow: C.shadow }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
            <div style={{ background: C.primary, color: "#fff", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✨</div>
            <div style={{ color: C.primaryDark, fontWeight: 700, fontSize: 16 }}>New Book Discovery</div>
            <div style={{ color: C.textMid, fontSize: 13, marginLeft: "auto" }}>ISBN: {isbn}</div>
          </div>

          {/* Google Books Preview Card */}
          {(form.thumbnail || form.title) && (
            <div style={{ display: "flex", gap: 18, padding: 18, background: C.primaryBg, borderRadius: 16, border: `1.5px solid ${C.primary}20`, marginBottom: 20, alignItems: "flex-start" }}>
              {form.thumbnail ? (
                <img src={form.thumbnail} alt={form.title} style={{ width: 70, height: 100, objectFit: "cover", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 70, height: 100, background: C.inputBg, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, flexShrink: 0 }}>{form.cover}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.text, fontWeight: 800, fontSize: 17, fontFamily: "'Lora',serif", marginBottom: 4, lineHeight: 1.3 }}>{form.title || "Unknown Title"}</div>
                <div style={{ color: C.textMid, fontSize: 13, marginBottom: 8 }}>by {form.author || "Unknown Author"}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {form.genre && <span style={{ background: C.primaryBg, color: C.primaryDark, border: `1px solid ${C.primary}30`, borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>{form.genre}</span>}
                  {form.year && <span style={{ background: C.inputBg, color: C.textMid, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: "2px 9px", fontSize: 11 }}>{form.year}</span>}
                  {form.publisher && <span style={{ background: C.inputBg, color: C.textMid, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: "2px 9px", fontSize: 11 }}>{form.publisher}</span>}
                  {form.pageCount && <span style={{ background: C.inputBg, color: C.textMid, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: "2px 9px", fontSize: 11 }}>{form.pageCount}pp</span>}
                </div>
              </div>
            </div>
          )}

          <div className="scan-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: C.pageBg, padding: 24, borderRadius: 16, border: `1px solid ${C.cardBorder}` }}>
            <div style={{ gridColumn: "1/-1" }}><FInput label="Title" value={form.title} onChange={(e: any) => setForm((f: any) => ({ ...f, title: e.target.value }))} /></div>
            <FInput label="Author" value={form.author} onChange={(e: any) => setForm((f: any) => ({ ...f, author: e.target.value }))} />
            <FInput label="ISBN" value={form.isbn} onChange={(e: any) => setForm((f: any) => ({ ...f, isbn: e.target.value }))} />
            <FSelect label="Genre" value={form.genre} onChange={(e: any) => setForm((f: any) => ({ ...f, genre: e.target.value }))}>{GENRES.filter(g => g !== "All").map(g => <option key={g}>{g}</option>)}</FSelect>
            <FInput label="Cover Emoji" value={form.cover} onChange={(e: any) => setForm((f: any) => ({ ...f, cover: e.target.value }))} />
            <FInput label="Year" type="number" value={form.year} onChange={(e: any) => setForm((f: any) => ({ ...f, year: e.target.value }))} />
            <FInput label="Initial Copies" type="number" value={form.total} onChange={(e: any) => setForm((f: any) => ({ ...f, total: parseInt(e.target.value), available: parseInt(e.target.value) }))} />
            <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ color: C.textMid, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Description</label>
              <textarea value={form.description} onChange={(e: any) => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={4}
                style={{ background: C.inputBg, border: `1.5px solid ${C.inputBorder}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }} />
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 14, justifyContent: "flex-end", marginTop: 24 }}>
            <Btn variant="ghost" onClick={resetScanner}>Cancel Scan</Btn>
            <Btn onClick={saveNewBook}>Save to Library</Btn>
          </div>
        </div>
      ) : null}
    </div>
  );
}
