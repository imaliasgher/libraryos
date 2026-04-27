"use client";
import { useState } from "react";
import { C } from "@/lib/tokens";
import { FInput, Btn, useToast, Spinner } from "../shared/ui";

export function AdminSettings() {
  const { toast, ToastContainer } = useToast();
  const [wiping, setWiping] = useState(false);

  const wipeDatabase = async () => {
    if (!window.confirm("🚨 WARNING: This will permanently delete ALL Books, Students, and Transactions. Are you absolutely sure?")) return;
    
    setWiping(true);
    try {
      const res = await fetch("/api/settings/reset", { method: "POST" });
      if (!res.ok) throw new Error("Failed to clear database");
      toast("Mock data fully wiped from system!", "ok");
    } catch (e: any) {
      toast("Error wiping database", "err");
    } finally {
      setWiping(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "10px 0" }}>
      <ToastContainer />
      
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 28, color: C.text }}>System Settings</h1>
        <p style={{ margin: "4px 0 0", color: C.textLight, fontSize: 14 }}>Global configurations and dangerously destructive operations.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        
        {/* Profile Settings Segment */}
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: 30, boxShadow: C.shadow }}>
          <h2 style={{ fontSize: 18, margin: "0 0 20px", color: C.text }}>Admin Profile</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FInput label="Admin Email" value="admin@library.edu" disabled style={{ opacity: 0.6 }} />
            <FInput label="Library Name" value="University Open Library" onChange={() => {}} />
            <FInput label="Time Zone" value="Asia/Kolkata" disabled style={{ opacity: 0.6 }} />
          </div>
          <div style={{ marginTop: 20 }}>
            <Btn variant="ghost" onClick={() => toast("Profile updated!")}>Save Profile</Btn>
          </div>
        </div>

        {/* Global Policy Settings */}
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: 30, boxShadow: C.shadow }}>
          <h2 style={{ fontSize: 18, margin: "0 0 20px", color: C.text }}>Lending Policies</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FInput label="Default Borrow Period (Days)" type="number" value="30" onChange={() => {}} />
            <FInput label="Daily Overdue Fine (₹)" type="number" value="10" onChange={() => {}} />
            <FInput label="Max Books Per Student" type="number" value="5" onChange={() => {}} />
          </div>
          <div style={{ marginTop: 20 }}>
            <Btn variant="ghost" onClick={() => toast("Policies updated!")}>Apply Defaults</Btn>
          </div>
        </div>

        {/* DANGER ZONE */}
        <div style={{ background: C.redBg, border: `2px dashed ${C.red}45`, borderRadius: 18, padding: 30, boxShadow: C.shadow }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 15 }}>
            <div style={{ fontSize: 24 }}>🚨</div>
            <h2 style={{ fontSize: 18, margin: 0, color: C.red, fontWeight: 700 }}>Danger Zone</h2>
          </div>
          <p style={{ color: C.red, opacity: 0.8, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
            Clicking the button below will instantly permanently drop all `Book`, `Student`, and `Transaction` records from the active mapped database.
            Only the core `admin@library.edu` login account will survive the purge.
          </p>
          
          <Btn variant="danger" onClick={wipeDatabase} disabled={wiping} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {wiping ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #fff", borderTopColor: "transparent", animation: "spin 0.6s linear infinite" }} /> : "🗑️"}
            {wiping ? "Wiping Database..." : "Wipe Mock Database"}
          </Btn>
        </div>

      </div>
    </div>
  );
}
