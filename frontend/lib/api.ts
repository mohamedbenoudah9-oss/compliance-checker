const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error ${res.status}: ${error}`);
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Criterion {
  id: number;
  checklist_id: number;
  text: string;
  description: string | null;
  order_index: number;
}

export interface Checklist {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ChecklistDetail extends Checklist {
  criteria: Criterion[];
}

export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  checklist_id: number;
  uploaded_at: string;
  status: "pending" | "processing" | "done" | "error";
}

export interface DocumentDetail extends Document {
  checklist: Checklist;
}

export interface CheckResult {
  id: number;
  document_id: number;
  criterion_id: number;
  status: "PASS" | "FAIL" | "UNCLEAR";
  evidence: string | null;
  doc_quote: string | null;
  section_ref: string | null;
  criterion_text: string | null;
  checklist_name: string | null;
}

// ── Checklists ─────────────────────────────────────────────────────────────────

export function getChecklists(): Promise<Checklist[]> {
  return request<Checklist[]>("/api/checklists");
}

export function createChecklist(data: {
  name: string;
  description?: string;
}): Promise<Checklist> {
  return request<Checklist>("/api/checklists", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getChecklist(id: number): Promise<ChecklistDetail> {
  return request<ChecklistDetail>(`/api/checklists/${id}`);
}

export function updateChecklist(
  id: number,
  data: { name?: string; description?: string }
): Promise<Checklist> {
  return request<Checklist>(`/api/checklists/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteChecklist(id: number): Promise<void> {
  return request<void>(`/api/checklists/${id}`, { method: "DELETE" });
}

// ── Criteria ───────────────────────────────────────────────────────────────────

export function addCriterion(
  checklistId: number,
  data: { text: string; description?: string; order_index?: number }
): Promise<Criterion> {
  return request<Criterion>(`/api/checklists/${checklistId}/criteria`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCriterion(
  checklistId: number,
  criterionId: number,
  data: { text?: string; description?: string; order_index?: number }
): Promise<Criterion> {
  return request<Criterion>(
    `/api/checklists/${checklistId}/criteria/${criterionId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export function deleteCriterion(
  checklistId: number,
  criterionId: number
): Promise<void> {
  return request<void>(
    `/api/checklists/${checklistId}/criteria/${criterionId}`,
    { method: "DELETE" }
  );
}

// ── Documents ──────────────────────────────────────────────────────────────────

export async function uploadDocument(formData: FormData): Promise<Document> {
  const res = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Upload error ${res.status}: ${error}`);
  }
  return res.json();
}

export function getDocuments(): Promise<Document[]> {
  return request<Document[]>("/api/documents");
}

export function getDocument(id: number): Promise<DocumentDetail> {
  return request<DocumentDetail>(`/api/documents/${id}`);
}

export function deleteDocument(id: number): Promise<void> {
  return request<void>(`/api/documents/${id}`, { method: "DELETE" });
}

// ── Checks ─────────────────────────────────────────────────────────────────────

export function runCheck(
  documentId: number
): Promise<{ message: string; document_id: number }> {
  return request(`/api/checks/run/${documentId}`, { method: "POST" });
}

export function getResults(documentId: number): Promise<CheckResult[]> {
  return request<CheckResult[]>(`/api/checks/results/${documentId}`);
}
