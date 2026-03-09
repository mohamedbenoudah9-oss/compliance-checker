"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDocuments, getChecklists, type Document, type Checklist } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDocuments(), getChecklists()])
      .then(([docs, lists]) => {
        setDocuments(docs);
        setChecklists(lists);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const doneDocuments = documents.filter((d) => d.status === "done");
  const recentDocuments = documents.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">
          Overview of your compliance checking activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500">Total Documents</div>
          <div className="mt-1 text-4xl font-bold text-gray-900">
            {documents.length}
          </div>
          <div className="mt-1 text-xs text-gray-400">
            {doneDocuments.length} completed
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500">Total Checklists</div>
          <div className="mt-1 text-4xl font-bold text-gray-900">
            {checklists.length}
          </div>
          <div className="mt-1 text-xs text-gray-400">compliance rule sets</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500">Checks Run</div>
          <div className="mt-1 text-4xl font-bold text-gray-900">
            {doneDocuments.length}
          </div>
          <div className="mt-1 text-xs text-gray-400">documents analyzed</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link
          href="/upload"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Upload Document
        </Link>
        <Link
          href="/checklists/new"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          New Checklist
        </Link>
      </div>

      {/* Recent Documents */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Documents
        </h2>
        {recentDocuments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No documents uploaded yet.{" "}
            <Link href="/upload" className="text-gray-900 underline">
              Upload your first document
            </Link>
            .
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {recentDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {doc.original_filename}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {doc.status === "done" && (
                        <Link
                          href={`/results/${doc.id}`}
                          className="text-gray-900 font-medium hover:underline"
                        >
                          View Results
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
