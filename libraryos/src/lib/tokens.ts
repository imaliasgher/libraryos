// src/lib/tokens.ts
export const C = {
  pageBg:      "#f7f3ee",
  sidebarBg:   "#fffefb",
  cardBg:      "#ffffff",
  cardBorder:  "#e8dfd4",
  inputBg:     "#faf6f1",
  inputBorder: "#ddd4c6",
  text:        "#3b2f26",
  textMid:     "#7a6b60",
  textLight:   "#b0a097",
  primary:     "#9c7fe8",
  primaryBg:   "#f0ebfd",
  primaryDark: "#7155c0",
  green:       "#58b88a",
  greenBg:     "#eaf6f0",
  amber:       "#e49a40",
  amberBg:     "#fef5e6",
  red:         "#de6b6b",
  redBg:       "#fdf0f0",
  blue:        "#68aee0",
  blueBg:      "#edf5fc",
  pink:        "#e67f9e",
  pinkBg:      "#fdeef4",
  teal:        "#59b6bd",
  tealBg:      "#eaf5f7",
  shadow:      "0 2px 10px rgba(100,75,50,0.07)",
  shadowMd:    "0 6px 22px rgba(100,75,50,0.11)",
  shadowLg:    "0 24px 60px rgba(100,75,50,0.15)",
} as const;

export const ACCENT_COLORS = [C.primary, C.green, C.amber, C.pink, C.blue, C.teal, C.red];
export const ACCENT_BGS    = [C.primaryBg, C.greenBg, C.amberBg, C.pinkBg, C.blueBg, C.tealBg, C.redBg];

export const GENRES = [
  "All","Classic Fiction","Historical Fiction","Dystopian","Romance",
  "Fantasy","Science Fiction","Coming-of-age","Adventure","Non-Fiction","Self-Help","Philosophy",
];
export const DEPARTMENTS = [
  "Nursery", "Pre-KG", "KG-1", "KG-2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
];

// helpers
export const fmt = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const calcFine = (dueDate: string, returnDate?: string | null) => {
  const ref = returnDate ? new Date(returnDate) : new Date();
  return Math.max(0, Math.floor((ref.getTime() - new Date(dueDate).getTime()) / 86400000)) * 10;
};

export const daysLeft = (due: string) =>
  Math.floor((new Date(due).getTime() - Date.now()) / 86400000);

export const todayStr = () => new Date().toISOString().split("T")[0];
export const addDays  = (n = 30) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; };
export const initials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
