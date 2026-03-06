// src/lib/client.ts  — thin typed wrappers around fetch

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...options });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

const j = (body: unknown) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// Auth
export const apiLogin   = (email: string, password: string) => req("/api/auth/login", { method: "POST", ...j({ email, password }) });
export const apiLogout  = () => req("/api/auth/logout", { method: "POST" });
export const apiMe      = () => req<any>("/api/auth/me");

// Books
export const apiBooks       = () => req<any[]>("/api/books");
export const apiAddBook     = (data: any) => req<any>("/api/books", { method: "POST", ...j(data) });
export const apiUpdateBook  = (id: number, data: any) => req<any>(`/api/books/${id}`, { method: "PUT", ...j(data) });
export const apiDeleteBook  = (id: number) => req<any>(`/api/books/${id}`, { method: "DELETE" });

// Students
export const apiStudents      = () => req<any[]>("/api/students");
export const apiAddStudent    = (data: any) => req<any>("/api/students", { method: "POST", ...j(data) });
export const apiUpdateStudent = (id: number, data: any) => req<any>(`/api/students/${id}`, { method: "PUT", ...j(data) });
export const apiDeleteStudent = (id: number) => req<any>(`/api/students/${id}`, { method: "DELETE" });
export const apiStudent       = (id: number) => req<any>(`/api/students/${id}`);

// Transactions
export const apiTransactions  = (studentId?: number) => req<any[]>(`/api/transactions${studentId ? `?studentId=${studentId}` : ""}`);
export const apiIssueBook     = (bookId: number, studentId: number, days: number) =>
  req<any>("/api/transactions", { method: "POST", ...j({ action: "issue", bookId, studentId, days }) });
export const apiBorrowBook    = (bookId: number, days = 30) =>
  req<any>("/api/transactions", { method: "POST", ...j({ action: "issue", bookId, days }) });
export const apiReturnBook    = (txId: number) =>
  req<any>(`/api/transactions/${txId}`, { method: "PUT", ...j({ action: "return" }) });

// Dashboard
export const apiDashboard = () => req<any>("/api/dashboard");
