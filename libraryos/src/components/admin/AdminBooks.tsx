"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { C, fmt, ACCENT_COLORS, ACCENT_BGS, GENRES, addDays } from "@/lib/tokens";
import { apiBooks, apiStudents, apiAddBook, apiUpdateBook, apiDeleteBook, apiIssueBook, apiScanIsbn } from "@/lib/client";
import { findBookByIsbn } from "@/lib/isbn";
import { Badge, Modal, FInput, FSelect, Btn, Spinner, useToast } from "../shared/ui";
import { IsbnCameraReader } from "./IsbnCameraReader";

type AddStep = "scan" | "loading" | "found" | "form";

const emptyForm = () => ({
  title: "",
  author: "",
  isbn: "",
  genre: "Classic Fiction",
  cover: "📖",
  total: 1,
  available: 1,
  year: new Date().getFullYear(),
  description: "",
});

const pickGenre = (g: string) => {
  const opts = GENRES.filter((x) => x !== "All");
  return opts.includes(g) ? g : "Non-Fiction";
};

export function AdminBooks() {
  const [books, setBooks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [modal, setModal] = useState<null | "add" | "edit" | "issue" | "detail" | "catalogScan">(null);
  const [addStep, setAddStep] = useState<AddStep>("scan");
  const [addCameraKey, setAddCameraKey] = useState(0);
  const [catalogCameraKey, setCatalogCameraKey] = useState(0);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [usbAdd, setUsbAdd] = useState("");
  const [usbCatalog, setUsbCatalog] = useState("");
  const [sel, setSel] = useState<any>(null);
  const [scanFoundBook, setScanFoundBook] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm());
  const [issueForm, setIssueForm] = useState({ studentId: "", days: 30 });
  const { toast, ToastContainer } = useToast();

  const addCamId = useMemo(() => `add-isbn-cam-${Math.random().toString(36).slice(2, 11)}`, []);
  const catalogCamId = useMemo(() => `cat-isbn-cam-${Math.random().toString(36).slice(2, 11)}`, []);

  const load = async () => {
    const [b, s] = await Promise.all([apiBooks(), apiStudents()]);
    setBooks(b);
    setStudents(s);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = books.filter(
    (b) =>
      (genre === "All" || b.genre === genre) &&
      (b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        String(b.isbn).toLowerCase().includes(search.toLowerCase()))
  );

  const resetAddWizard = () => {
    setForm(emptyForm());
    setScanFoundBook(null);
    setUsbAdd("");
    setAddStep("scan");
    setAddCameraKey((k) => k + 1);
  };

  const openAddWizard = () => {
    resetAddWizard();
    setSel(null);
    setModal("add");
  };

  const openEdit = (b: any) => {
    setForm({ ...b });
    setSel(b);
    setModal("edit");
  };
  const openDetail = (b: any) => {
    setSel(b);
    setModal("detail");
  };
  const openIssue = (b: any) => {
    setSel(b);
    setIssueForm({ studentId: "", days: 30 });
    setModal("issue");
  };

  const openCatalogScan = () => {
    setUsbCatalog("");
    setCatalogBusy(false);
    setCatalogCameraKey((k) => k + 1);
    setModal("catalogScan");
  };

  const processAddScan = useCallback(async (code: string) => {
    const raw = code.trim();
    if (!raw) return;
    setAddStep("loading");
    try {
      const res = await apiScanIsbn(raw);
      if (res.exists) {
        setScanFoundBook(res.book);
        setSel(res.book);
        setAddStep("found");
        toast("This ISBN is already in your library.");
      } else {
        const meta = res.metadata || {
          title: "",
          author: "",
          year: new Date().getFullYear(),
          description: "",
          genre: "General",
          cover: "📖",
          thumbnail: null,
          publisher: "",
          pageCount: null,
        };
        setForm({
          title: meta.title,
          author: meta.author,
          isbn: raw,
          genre: pickGenre(meta.genre),
          cover: meta.cover,
          year: meta.year,
          total: 1,
          available: 1,
          description: meta.description,
          thumbnail: meta.thumbnail,
          publisher: meta.publisher,
          pageCount: meta.pageCount,
          source: meta.source,
        });
        setAddStep("form");
        if (res.metadata) {
          const sourceIcon = meta.source === "Open Library" ? "📖" : "🔍";
          toast(`${sourceIcon} Metadata from ${meta.source} — review and save.`, "ok");
        } else {
          toast("Not found in external catalogs. Fill in details below.", "ok");
        }
      }
    } catch (e: any) {
      toast(e.message ?? "Scan failed", "err");
      setAddStep("scan");
      setAddCameraKey((k) => k + 1);
    }
  }, [toast]);

  const processCatalogScan = useCallback(
    async (code: string, bookList: any[]) => {
      const raw = code.trim();
      if (!raw) return;
      setCatalogBusy(true);
      try {
        const local = findBookByIsbn(bookList, raw);
        if (local) {
          setSel(local);
          setModal("detail");
          toast("Found in your catalogue.");
          return;
        }
        const res = await apiScanIsbn(raw);
        if (res.exists) {
          setSel(res.book);
          setModal("detail");
          toast("Found in your catalogue.");
          return;
        }
        const meta = res.metadata || {
          title: "",
          author: "",
          year: new Date().getFullYear(),
          description: "",
          genre: "General",
          cover: "📖",
          thumbnail: null,
          publisher: "",
          pageCount: null,
        };
        setForm({
          title: meta.title,
          author: meta.author,
          isbn: raw,
          genre: pickGenre(meta.genre),
          cover: meta.cover,
          year: meta.year,
          total: 1,
          available: 1,
          description: meta.description,
          thumbnail: meta.thumbnail,
          publisher: meta.publisher,
          pageCount: meta.pageCount,
          source: meta.source,
        });
        setScanFoundBook(null);
        setUsbAdd("");
        setSel(null);
        setAddStep("form");
        setModal("add");
        if (res.metadata) {
          const sourceIcon = meta.source === "Open Library" ? "📖" : "🔍";
          toast(`${sourceIcon} New title — review and add to library.`, "ok");
        } else {
          toast("Not in catalogue — add details below.", "ok");
        }
      } catch (e: any) {
        toast(e.message ?? "Scan failed", "err");
        setCatalogCameraKey((k) => k + 1);
      } finally {
        setCatalogBusy(false);
      }
    },
    [toast]
  );

  const saveBook = async () => {
    try {
      if (modal === "add" && addStep === "form") {
        await apiAddBook(form);
        await load();
        toast("Book added!");
        setForm(emptyForm());
        setScanFoundBook(null);
        setUsbAdd("");
        setAddStep("scan");
        setAddCameraKey((k) => k + 1);
        return;
      }
      if (modal === "edit") {
        await apiUpdateBook(sel.id, form);
        await load();
        setModal(null);
        toast("Book updated!");
      }
    } catch (e: any) {
      toast(e.message, "err");
    }
  };

  const delBook = async (id: number) => {
    if (!confirm("Delete this book?")) return;
    try {
      await apiDeleteBook(id);
      await load();
      toast("Book deleted");
    } catch (e: any) {
      toast(e.message, "err");
    }
  };

  const issueBook = async () => {
    try {
      await apiIssueBook(sel.id, +issueForm.studentId, +issueForm.days);
      await load();
      setModal(null);
      toast("Book issued!");
    } catch (e: any) {
      toast(e.message, "err");
    }
  };

  const addStockFromScan = async () => {
    const b = scanFoundBook;
    if (!b) return;
    try {
      const updated = { ...b, total: b.total + 1, available: b.available + 1 };
      await apiUpdateBook(b.id, updated);
      await load();
      setScanFoundBook(updated);
      toast("Stock +1");
    } catch (e: any) {
      toast(e.message, "err");
    }
  };

  const closeAddModal = () => {
    setModal(null);
    resetAddWizard();
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@media(max-width:560px){.book-form-grid{grid-template-columns:1fr!important}}`}</style>
      <ToastContainer />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 26, color: C.text }}>Book Inventory</h1>
          <p style={{ margin: "4px 0 0", color: C.textLight, fontSize: 13 }}>
            {books.length} titles · {books.reduce((a, b) => a + b.total, 0)} total copies
          </p>
        </div>
        <Btn onClick={openAddWizard}>＋ Add Book</Btn>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Search title, author, ISBN…"
          style={{
            background: C.cardBg,
            border: `1.5px solid ${C.inputBorder}`,
            borderRadius: 10,
            padding: "9px 14px",
            color: C.text,
            fontSize: 13,
            outline: "none",
            flex: 1,
            minWidth: 160,
            fontFamily: "inherit",
          }}
        />
        <Btn variant="ghost" onClick={openCatalogScan} style={{ whiteSpace: "nowrap", boxShadow: "none" }}>
          📷 Scan ISBN
        </Btn>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
          {["All", "Dystopian", "Fantasy", "Classic Fiction", "Non-Fiction", "Self-Help", "Romance"].map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              style={{
                background: genre === g ? C.primary : C.cardBg,
                border: `1.5px solid ${genre === g ? C.primary : C.inputBorder}`,
                color: genre === g ? "#fff" : C.textMid,
                borderRadius: 8,
                padding: "7px 11px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: C.cardBg, borderRadius: 16, border: `1.5px solid ${C.cardBorder}`, overflow: "hidden", boxShadow: C.shadow }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 580 }}>
            <thead>
              <tr style={{ background: C.inputBg, borderBottom: `1.5px solid ${C.cardBorder}` }}>
                <th style={{ padding: "14px 16px", color: C.textMid, fontSize: 12, fontWeight: 700, width: "35%" }}>Title</th>
                <th style={{ padding: "14px 16px", color: C.textMid, fontSize: 12, fontWeight: 700, width: "20%" }}>Author</th>
                <th style={{ padding: "14px 16px", color: C.textMid, fontSize: 12, fontWeight: 700, width: "15%" }}>Category</th>
                <th style={{ padding: "14px 16px", color: C.textMid, fontSize: 12, fontWeight: 700, width: "15%" }}>Status</th>
                <th style={{ padding: "14px 16px", color: C.textMid, fontSize: 12, fontWeight: 700, width: "15%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((book, i) => {
                const bc = ACCENT_COLORS[i % ACCENT_COLORS.length];
                const bb = ACCENT_BGS[i % ACCENT_BGS.length];
                return (
                  <tr
                    key={book.id}
                    onClick={() => openDetail(book)}
                    style={{ borderBottom: `1px solid ${C.cardBorder}`, cursor: "pointer", transition: "background 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.pageBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: bb,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 19,
                            flexShrink: 0,
                          }}
                        >
                          {book.cover}
                        </div>
                        <div>
                          <div style={{ color: C.text, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{book.title}</div>
                          <div style={{ color: C.textLight, fontSize: 11, fontFamily: "monospace" }}>ISBN: {book.isbn}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px", color: C.textMid, fontSize: 13 }}>{book.author}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <Badge color={bc}>{book.genre}</Badge>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      {book.available > 0 ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: C.greenBg,
                            color: C.green,
                            padding: "3px 9px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            border: `1px solid ${C.green}25`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} /> {book.available} avail.
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: C.redBg,
                            color: C.red,
                            padding: "3px 9px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            border: `1px solid ${C.red}25`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.red }} /> Out of stock
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "13px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 5, justifyContent: "flex-end", flexWrap: "nowrap" }}>
                        <button
                          onClick={() => openIssue(book)}
                          disabled={book.available < 1}
                          style={{
                            background: C.text,
                            color: "#fff",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: 7,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: book.available < 1 ? "not-allowed" : "pointer",
                            opacity: book.available < 1 ? 0.3 : 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Issue
                        </button>
                        <button
                          onClick={() => openEdit(book)}
                          style={{
                            background: C.inputBg,
                            border: `1.5px solid ${C.inputBorder}`,
                            padding: "5px 7px",
                            borderRadius: 7,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => delBook(book.id)}
                          style={{
                            background: C.redBg,
                            border: `1.5px solid ${C.red}35`,
                            padding: "5px 7px",
                            borderRadius: 7,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: C.textLight }}>No books found matching your criteria.</div>
        )}
      </div>

      {/* Add book wizard: camera (back) + USB, then found / form */}
      {modal === "add" && (
        <Modal
          title={
            addStep === "scan"
              ? "Add book — scan barcode"
              : addStep === "found"
                ? "Already in library"
                : addStep === "loading"
                  ? "Looking up ISBN…"
                  : "Add New Book"
          }
          onClose={closeAddModal}
          width={620}
        >
          {addStep === "scan" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <p style={{ margin: 0, color: C.textMid, fontSize: 13 }}>
                Uses your device&apos;s <strong style={{ color: C.text }}>back camera</strong> automatically. USB scanners can type into the field below, then press Enter.
              </p>
              <IsbnCameraReader key={addCameraKey} elementId={addCamId} onDecoded={(t) => void processAddScan(t)} />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void processAddScan(usbAdd);
                }}
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <FInput
                  label="Or type / paste ISBN"
                  value={usbAdd}
                  onChange={(e: any) => setUsbAdd(e.target.value)}
                  placeholder="978…"
                />
                <Btn type="submit">Look up this code</Btn>
              </form>
              <Btn variant="ghost" onClick={() => setAddStep("form")} style={{ alignSelf: "flex-start" }}>
                Skip — enter book manually
              </Btn>
            </div>
          )}

          {addStep === "loading" && (
            <div style={{ padding: 32 }}>
              <Spinner />
            </div>
          )}

          {addStep === "found" && scanFoundBook && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    background: C.greenBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 36,
                  }}
                >
                  {scanFoundBook.cover}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 800, color: C.text, fontFamily: "'Lora',serif" }}>{scanFoundBook.title}</div>
                  <div style={{ color: C.textMid, fontSize: 13 }}>by {scanFoundBook.author}</div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge color={C.green}>{scanFoundBook.available} available</Badge>
                    <Badge color={C.primary}>{scanFoundBook.total} total</Badge>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Btn variant="success" onClick={() => void addStockFromScan()}>
                  +1 to stock
                </Btn>
                <Btn
                  onClick={() => {
                    setScanFoundBook(null);
                    setUsbAdd("");
                    setAddStep("scan");
                    setAddCameraKey((k) => k + 1);
                  }}
                >
                  Scan another
                </Btn>
                <Btn variant="ghost" onClick={closeAddModal}>
                  Close
                </Btn>
              </div>
            </div>
          )}

          {addStep === "form" && (
            <>
              <div className="book-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <FInput label="Title" value={form.title} onChange={(e: any) => setForm((f: any) => ({ ...f, title: e.target.value }))} />
                </div>
                <FInput label="Author" value={form.author} onChange={(e: any) => setForm((f: any) => ({ ...f, author: e.target.value }))} />
                <FInput label="ISBN" value={form.isbn} onChange={(e: any) => setForm((f: any) => ({ ...f, isbn: e.target.value }))} />
                <FSelect label="Genre" value={form.genre} onChange={(e: any) => setForm((f: any) => ({ ...f, genre: e.target.value }))}>
                  {GENRES.filter((g) => g !== "All").map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </FSelect>
                <FInput label="Cover Emoji" value={form.cover} onChange={(e: any) => setForm((f: any) => ({ ...f, cover: e.target.value }))} />
                <FInput label="Year" type="number" value={form.year} onChange={(e: any) => setForm((f: any) => ({ ...f, year: e.target.value }))} />
                <FInput label="Total Copies" type="number" value={form.total} onChange={(e: any) => setForm((f: any) => ({ ...f, total: e.target.value }))} />
                <FInput label="Available" type="number" value={form.available} onChange={(e: any) => setForm((f: any) => ({ ...f, available: e.target.value }))} />
                <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ color: C.textMid, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e: any) => setForm((f: any) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    style={{
                      background: C.inputBg,
                      border: `1.5px solid ${C.inputBorder}`,
                      borderRadius: 10,
                      padding: "10px 14px",
                      color: C.text,
                      fontSize: 14,
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, flexWrap: "wrap" }}>
                <Btn variant="ghost" onClick={closeAddModal}>
                  Cancel
                </Btn>
                <Btn onClick={() => void saveBook()}>Save to library</Btn>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Scan to find in catalogue or start add flow */}
      {modal === "catalogScan" && (
        <Modal title="Scan ISBN — find or add" onClose={() => setModal(null)} width={620}>
          {catalogBusy ? (
            <div style={{ padding: 32 }}>
              <Spinner />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <p style={{ margin: 0, color: C.textMid, fontSize: 13 }}>
                If the book is already in LibraryOS, its details open. Otherwise you get the same add-book form with any metadata we can load.
              </p>
              <IsbnCameraReader
                key={catalogCameraKey}
                elementId={catalogCamId}
                onDecoded={(t) => void processCatalogScan(t, books)}
              />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void processCatalogScan(usbCatalog, books);
                }}
              >
                <FInput label="Or type ISBN" value={usbCatalog} onChange={(e: any) => setUsbCatalog(e.target.value)} placeholder="978…" />
                <div style={{ marginTop: 12 }}>
                  <Btn type="submit">Look up</Btn>
                </div>
              </form>
            </div>
          )}
        </Modal>
      )}

      {modal === "detail" && sel && (
        <Modal title={sel.title} onClose={() => setModal(null)} width={580}>
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: 18,
                background: C.primaryBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 38,
                flexShrink: 0,
              }}
            >
              {sel.cover}
            </div>
            <div>
              <div style={{ color: C.textMid, fontSize: 13, marginBottom: 4 }}>
                by {sel.author} · {sel.year > 0 ? sel.year : `${Math.abs(sel.year)} BC`}
              </div>
              <div style={{ color: C.text, fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{sel.description}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge color={C.primary}>{sel.genre}</Badge>
                <Badge color={C.amber}>ISBN: {sel.isbn}</Badge>
                <Badge color={C.green}>
                  {sel.available}/{sel.total} available
                </Badge>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {modal === "edit" && (
        <Modal title="Edit Book" onClose={() => setModal(null)}>
          <div className="book-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <FInput label="Title" value={form.title} onChange={(e: any) => setForm((f: any) => ({ ...f, title: e.target.value }))} />
            </div>
            <FInput label="Author" value={form.author} onChange={(e: any) => setForm((f: any) => ({ ...f, author: e.target.value }))} />
            <FInput label="ISBN" value={form.isbn} onChange={(e: any) => setForm((f: any) => ({ ...f, isbn: e.target.value }))} />
            <FSelect label="Genre" value={form.genre} onChange={(e: any) => setForm((f: any) => ({ ...f, genre: e.target.value }))}>
              {GENRES.filter((g) => g !== "All").map((g) => (
                <option key={g}>{g}</option>
              ))}
            </FSelect>
            <FInput label="Cover Emoji" value={form.cover} onChange={(e: any) => setForm((f: any) => ({ ...f, cover: e.target.value }))} />
            <FInput label="Year" type="number" value={form.year} onChange={(e: any) => setForm((f: any) => ({ ...f, year: e.target.value }))} />
            <FInput label="Total Copies" type="number" value={form.total} onChange={(e: any) => setForm((f: any) => ({ ...f, total: e.target.value }))} />
            <FInput label="Available" type="number" value={form.available} onChange={(e: any) => setForm((f: any) => ({ ...f, available: e.target.value }))} />
            <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ color: C.textMid, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Description</label>
              <textarea
                value={form.description}
                onChange={(e: any) => setForm((f: any) => ({ ...f, description: e.target.value }))}
                rows={3}
                style={{
                  background: C.inputBg,
                  border: `1.5px solid ${C.inputBorder}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: C.text,
                  fontSize: 14,
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Btn>
            <Btn onClick={() => void saveBook()}>Save Changes</Btn>
          </div>
        </Modal>
      )}

      {modal === "issue" && sel && (
        <Modal title={`Issue: ${sel.title}`} onClose={() => setModal(null)}>
          <div style={{ display: "flex", gap: 14, marginBottom: 20, padding: 14, background: C.primaryBg, borderRadius: 14, border: `1.5px solid ${C.primary}25` }}>
            <span style={{ fontSize: 36 }}>{sel.cover}</span>
            <div>
              <div style={{ color: C.text, fontWeight: 700 }}>{sel.title}</div>
              <div style={{ color: C.textMid, fontSize: 13 }}>by {sel.author}</div>
              <div style={{ marginTop: 5 }}>
                <Badge color={C.green}>{sel.available} copies available</Badge>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FSelect label="Select Student" value={issueForm.studentId} onChange={(e: any) => setIssueForm((f) => ({ ...f, studentId: e.target.value }))}>
              <option value="">— choose student —</option>
              {students
                .filter((s) => s.status === "active")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.studentCode})
                  </option>
                ))}
            </FSelect>
            <FInput label="Loan Duration (days)" type="number" value={issueForm.days} onChange={(e: any) => setIssueForm((f) => ({ ...f, days: e.target.value }))} />
            {issueForm.days && (
              <div style={{ color: C.textMid, fontSize: 12 }}>
                Due date:{" "}
                <strong style={{ color: C.text }}>{fmt(addDays(+issueForm.days))}</strong>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </Btn>
            <Btn variant="success" onClick={() => void issueBook()} disabled={!issueForm.studentId}>
              Confirm Issue
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
