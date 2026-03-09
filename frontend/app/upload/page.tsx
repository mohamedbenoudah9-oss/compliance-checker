"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getChecklists, uploadDocument, runCheck, type Checklist } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getChecklists()
      .then((lists) => {
        setChecklists(lists);
        if (lists.length > 0) {
          setSelectedChecklistId(String(lists[0].id));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile || !selectedChecklistId) return;

    setSubmitting(true);
    setError(null);

    try {
      setStatusMessage("Uploading document...");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("checklist_id", selectedChecklistId);

      const document = await uploadDocument(formData);

      setStatusMessage("Triggering compliance check...");
      await runCheck(document.id);

      setStatusMessage("Check started! Redirecting to results...");
      router.push(`/results/${document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
      setSubmitting(false);
      setStatusMessage("");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Document</h1>
        <p className="mt-1 text-gray-500">
          Upload a PDF or DOCX and run a compliance check against a checklist.
        </p>
      </div>

      {checklists.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800">
          <p className="font-medium">No checklists found.</p>
          <p className="mt-1 text-sm">
            You need to{" "}
            <a href="/checklists/new" className="underline font-medium">
              create a checklist
            </a>{" "}
            before you can run a compliance check.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
        >
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Click to change</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500">
                    Click to select a file
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF or DOCX</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Checklist Selection */}
          <div>
            <label
              htmlFor="checklist"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Checklist <span className="text-red-500">*</span>
            </label>
            <select
              id="checklist"
              value={selectedChecklistId}
              onChange={(e) => setSelectedChecklistId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {checklists.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Status message while submitting */}
          {submitting && statusMessage && (
            <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              {statusMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedFile || !selectedChecklistId}
            className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Processing..." : "Run Compliance Check"}
          </button>
        </form>
      )}
    </div>
  );
}
