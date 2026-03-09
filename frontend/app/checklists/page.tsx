"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getChecklists,
  getChecklist,
  deleteChecklist,
  type Checklist,
  type ChecklistDetail,
} from "@/lib/api";

interface ChecklistWithCount extends Checklist {
  criteriaCount?: number;
}

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<ChecklistWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadChecklists();
  }, []);

  async function loadChecklists() {
    try {
      setLoading(true);
      const lists = await getChecklists();
      // Fetch criteria counts in parallel
      const details = await Promise.all(
        lists.map((l) => getChecklist(l.id).catch(() => null))
      );
      const withCounts: ChecklistWithCount[] = lists.map((l, i) => ({
        ...l,
        criteriaCount: (details[i] as ChecklistDetail | null)?.criteria?.length ?? 0,
      }));
      setChecklists(withCounts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this checklist? This will also remove all associated criteria and results.")) return;
    setDeletingId(id);
    try {
      await deleteChecklist(id);
      setChecklists((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete checklist.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading checklists...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Checklists</h1>
          <p className="mt-1 text-gray-500">
            Manage your compliance rule sets.
          </p>
        </div>
        <Link
          href="/checklists/new"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          New Checklist
        </Link>
      </div>

      {checklists.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No checklists yet.</p>
          <Link
            href="/checklists/new"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700"
          >
            Create your first checklist
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criteria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {checklists.map((checklist) => (
                <tr key={checklist.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {checklist.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {checklist.description ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {checklist.criteriaCount ?? 0} criteria
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(checklist.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm space-x-3">
                    <Link
                      href={`/checklists/${checklist.id}`}
                      className="text-gray-900 font-medium hover:underline"
                    >
                      View / Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(checklist.id)}
                      disabled={deletingId === checklist.id}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === checklist.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
