"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getDocument, getResults, type DocumentDetail, type CheckResult } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

export default function ResultsPage() {
  const params = useParams();
  const documentId = Number(params.id);

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [doc, res] = await Promise.all([
        getDocument(documentId),
        getResults(documentId),
      ]);
      setDocument(doc);
      setResults(res);

      // If still processing, continue polling
      if (doc.status === "processing" || doc.status === "pending") {
        setPolling(true);
      } else {
        setPolling(false);
      }
    } catch (err) {
      setError("Failed to load results.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll every 3 seconds while processing
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(() => {
      loadData();
    }, 3000);
    return () => clearInterval(interval);
  }, [polling, loadData]);

  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const unclearCount = results.filter((r) => r.status === "UNCLEAR").length;
  const total = results.length;
  const passPercent = total > 0 ? Math.round((passCount / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading results...</div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-xl border border-red-200">
        {error ?? "Document not found."}
      </div>
    );
  }

  const isProcessing = document.status === "processing" || document.status === "pending";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {document.original_filename}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Checklist:{" "}
              <Link
                href={`/checklists/${document.checklist_id}`}
                className="text-gray-900 font-medium hover:underline"
              >
                {document.checklist.name}
              </Link>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Uploaded {new Date(document.uploaded_at).toLocaleString()}
            </p>
          </div>
          <StatusBadge status={document.status} className="mt-1" />
        </div>

        {isProcessing && (
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
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
            Compliance check is running... This page will update automatically.
          </div>
        )}

        {document.status === "error" && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            An error occurred during the compliance check. Please try again.
          </div>
        )}

        {/* Summary cards */}
        {total > 0 && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{passCount}</div>
                <div className="text-xs text-green-600 font-medium mt-0.5">Passed</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-700">{failCount}</div>
                <div className="text-xs text-red-600 font-medium mt-0.5">Failed</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-700">{unclearCount}</div>
                <div className="text-xs text-yellow-600 font-medium mt-0.5">Unclear</div>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{passCount} of {total} criteria passed</span>
                <span>{passPercent}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${passPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Detailed Results
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Criterion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Evidence
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Document Quote
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Section
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((result, index) => (
                  <tr
                    key={result.id}
                    className={`align-top ${
                      result.status === "FAIL"
                        ? "bg-red-50/30"
                        : result.status === "PASS"
                        ? "bg-green-50/20"
                        : "bg-yellow-50/20"
                    }`}
                  >
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                      {result.criterion_text}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={result.status} />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-sm">
                      {result.evidence ?? "—"}
                    </td>
                    <td className="px-4 py-4 max-w-sm">
                      {result.doc_quote ? (
                        <blockquote className="border-l-4 border-gray-300 pl-3 text-sm text-gray-600 italic">
                          {result.doc_quote}
                        </blockquote>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {result.section_ref ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results.length === 0 && document.status === "done" && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No results found. The checklist may have no criteria.
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href="/upload"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Check Another Document
        </Link>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
