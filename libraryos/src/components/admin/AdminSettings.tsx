"use client";
import { useState } from "react";
import { C } from "@/lib/tokens";
import { FInput, Btn, useToast, Spinner } from "../shared/ui";

export function AdminSettings() {
  const { toast, ToastContainer } = useToast();
  const [wiping, setWiping] = useState(false);

  const exportData = async () => {
    try {
      const res = await fetch("/api/settings/export");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `library_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      toast("Export started!", "ok");
    } catch (e) {
      toast("Export failed", "err");
    }
  };

  const importData = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("⚠️ This will overwrite ALL current data with the backup file. Continue?")) return;

    setWiping(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        const res = await fetch("/api/settings/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json)
        });
        const data = await res.json();
        if (res.ok) {
          toast("Data restored successfully!", "ok");
          setTimeout(() => window.location.reload(), 1500);
        } else {
          toast(data.error || "Import failed", "err");
        }
      } catch (err) {
        toast("Invalid JSON file", "err");
      } finally {
        setWiping(false);
      }
    };
    reader.readAsText(file);
  };

  const wipeDatabase = async () => {
    if (!window.confirm("🚨 WARNING: This will permanently delete ALL Books, Students, and Transactions. Are you absolutely sure?")) return;
    
    setWiping(true);
    try {
      const res = await fetch("/api/settings/reset", { method: "POST" });
      if (!res.ok) throw new Error("Failed to clear database");
      toast("System reset successfully!", "ok");
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      toast("Error wiping database", "err");
    } finally {
      setWiping(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "10px 0" }}>
      <ToastContainer />
      <style>{`
        @media (max-width: 640px) {
          .settings-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 28, color: C.text }}>System Settings</h1>
        <p style={{ margin: "4px 0 0", color: C.textLight, fontSize: 14 }}>Global configurations and backup management.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        
        {/* Profile Settings Segment */}
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: 30, boxShadow: C.shadow }}>
          <h2 style={{ fontSize: 18, margin: "0 0 20px", color: C.text }}>Admin Profile</h2>
          <div className="settings-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FInput label="Account Role" value="Library Administrator" disabled style={{ opacity: 0.6 }} />
            <FInput label="System Edition" value="LibraryOS Kids" disabled style={{ opacity: 0.6 }} />
            <FInput label="Time Zone" value="Asia/Kolkata" disabled style={{ opacity: 0.6 }} />
          </div>
          <div style={{ marginTop: 14, padding: "10px 14px", background: C.primaryBg, borderRadius: 10, border: `1px solid ${C.primary}25`, fontSize: 12, color: C.textMid }}>
            ℹ️ Security Note: Admin credentials are fixed. To reset or change the admin password, please contact system support.
          </div>
        </div>

        {/* Backup & Restore */}
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: 30, boxShadow: C.shadow }}>
          <h2 style={{ fontSize: 18, margin: "0 0 10px", color: C.text }}>Backup & Restore</h2>
          <p style={{ color: C.textLight, fontSize: 13, marginBottom: 20 }}>Download a full backup of your library data or restore from a previous file.</p>
          
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Btn onClick={exportData} style={{ background: C.green, color: "#fff" }}>📥 Export Database (JSON)</Btn>
            <div style={{ position: "relative" }}>
              <input type="file" accept=".json" onChange={importData} 
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 2 }} />
              <Btn variant="ghost" style={{ border: `1.5px solid ${C.primary}`, color: C.primary }}>📤 Import Backup File</Btn>
            </div>
          </div>
        </div>

        {/* Global Policy Settings */}
        <div style={{ background: C.cardBg, border: `1.5px solid ${C.cardBorder}`, borderRadius: 18, padding: 30, boxShadow: C.shadow }}>
          <h2 style={{ fontSize: 18, margin: "0 0 20px", color: C.text }}>Library Rules</h2>
          <div className="settings-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FInput label="Loan Duration (Days)" type="number" value="30" disabled style={{ opacity: 0.7 }} />
            <FInput label="Overdue Fee (₹)" type="number" value="10" disabled style={{ opacity: 0.7 }} />
            <FInput label="Max Books Allowed" type="number" value="5" disabled style={{ opacity: 0.7 }} />
          </div>
          <div style={{ marginTop: 14, padding: "10px 14px", background: C.amberBg, borderRadius: 10, border: `1px solid ${C.amber}25`, fontSize: 12, color: C.textMid }}>
            ℹ️ These rules apply to all students. Higher reading levels do not currently grant extra book allowances.
          </div>
        </div>

        {/* DANGER ZONE */}
        <div style={{ background: C.redBg, border: `2px dashed ${C.red}45`, borderRadius: 18, padding: 30, boxShadow: C.shadow }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 15 }}>
            <div style={{ fontSize: 24 }}>🚨</div>
            <h2 style={{ fontSize: 18, margin: 0, color: C.red, fontWeight: 700 }}>System Reset</h2>
          </div>
          <p style={{ color: C.red, opacity: 0.8, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
            This action will PERMANENTLY ERASE all books, student records, and transaction histories. 
            Use this only if you want to start the library inventory from scratch.
          </p>
          
          <Btn variant="danger" onClick={wipeDatabase} disabled={wiping} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {wiping ? <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #fff", borderTopColor: "transparent", animation: "spin 0.6s linear infinite" }} /> : "🗑️"}
            {wiping ? "Cleaning System..." : "Clear All Library Data"}
          </Btn>
        </div>

      </div>
    </div>
  );
}
