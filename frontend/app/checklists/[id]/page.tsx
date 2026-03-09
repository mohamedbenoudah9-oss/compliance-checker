"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getChecklist,
  updateChecklist,
  deleteChecklist,
  addCriterion,
  updateCriterion,
  deleteCriterion,
  type ChecklistDetail,
  type Criterion,
} from "@/lib/api";

export default function ChecklistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const checklistId = Number(params.id);

  const [checklist, setChecklist] = useState<ChecklistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Checklist editing
  const [editingChecklist, setEditingChecklist] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingChecklist, setSavingChecklist] = useState(false);

  // New criterion form
  const [newText, setNewText] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [addingCriterion, setAddingCriterion] = useState(false);

  // Inline criterion editing
  const [editingCriterionId, setEditingCriterionId] = useState<number | null>(null);
  const [editCriterionText, setEditCriterionText] = useState("");
  const [editCriterionDescription, setEditCriterionDescription] = useState("");
  const [savingCriterionId, setSavingCriterionId] = useState<number | null>(null);
  const [deletingCriterionId, setDeletingCriterionId] = useState<number | null>(null);

  useEffect(() => {
    if (!checklistId) return;
    loadChecklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklistId]);

  async function loadChecklist() {
    try {
      setLoading(true);
      const data = await getChecklist(checklistId);
      setChecklist(data);
      setEditName(data.name);
      setEditDescription(data.description ?? "");
    } catch (err) {
      setError("Failed to load checklist.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveChecklist() {
    if (!editName.trim()) return;
    setSavingChecklist(true);
    try {
      const updated = await updateChecklist(checklistId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setChecklist((prev) =>
        prev ? { ...prev, name: updated.name, description: updated.description } : prev
      );
      setEditingChecklist(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingChecklist(false);
    }
  }

  async function handleDeleteChecklist() {
    if (!confirm("Delete this checklist and all its criteria?")) return;
    await deleteChecklist(checklistId);
    router.push("/checklists");
  }

  async function handleAddCriterion(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    setAddingCriterion(true);
    try {
      const nextOrder = (checklist?.criteria?.length ?? 0);
      const criterion = await addCriterion(checklistId, {
        text: newText.trim(),
        description: newDescription.trim() || undefined,
        order_index: nextOrder,
      });
      setChecklist((prev) =>
        prev ? { ...prev, criteria: [...prev.criteria, criterion] } : prev
      );
      setNewText("");
      setNewDescription("");
    } catch (err) {
      console.error(err);
    } finally {
      setAddingCriterion(false);
    }
  }

  function startEditCriterion(criterion: Criterion) {
    setEditingCriterionId(criterion.id);
    setEditCriterionText(criterion.text);
    setEditCriterionDescription(criterion.description ?? "");
  }

  async function handleSaveCriterion(criterion: Criterion) {
    setSavingCriterionId(criterion.id);
    try {
      const updated = await updateCriterion(checklistId, criterion.id, {
        text: editCriterionText.trim(),
        description: editCriterionDescription.trim() || undefined,
      });
      setChecklist((prev) =>
        prev
          ? {
              ...prev,
              criteria: prev.criteria.map((c) =>
                c.id === criterion.id ? updated : c
              ),
            }
          : prev
      );
      setEditingCriterionId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCriterionId(null);
    }
  }

  async function handleDeleteCriterion(criterionId: number) {
    if (!confirm("Delete this criterion?")) return;
    setDeletingCriterionId(criterionId);
    try {
      await deleteCriterion(checklistId, criterionId);
      setChecklist((prev) =>
        prev
          ? { ...prev, criteria: prev.criteria.filter((c) => c.id !== criterionId) }
          : prev
      );
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingCriterionId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-xl border border-red-200">
        {error ?? "Checklist not found."}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {editingChecklist ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full max-w-lg px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full max-w-lg px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveChecklist}
                disabled={savingChecklist}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {savingChecklist ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditingChecklist(false)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{checklist.name}</h1>
              {checklist.description && (
                <p className="mt-1 text-gray-500">{checklist.description}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                Created {new Date(checklist.created_at).toLocaleDateString()} &middot;{" "}
                {checklist.criteria.length} criteria
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-4">
              <button
                onClick={() => setEditingChecklist(true)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteChecklist}
                className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Criteria Table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Criteria</h2>
        {checklist.criteria.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No criteria yet. Add one below.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Criterion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {checklist.criteria.map((criterion, index) => (
                  <tr key={criterion.id} className="hover:bg-gray-50">
                    {editingCriterionId === criterion.id ? (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3" colSpan={2}>
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editCriterionText}
                              onChange={(e) => setEditCriterionText(e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                            <input
                              type="text"
                              value={editCriterionDescription}
                              onChange={(e) =>
                                setEditCriterionDescription(e.target.value)
                              }
                              placeholder="Description (optional)"
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm space-x-2">
                          <button
                            onClick={() => handleSaveCriterion(criterion)}
                            disabled={savingCriterionId === criterion.id}
                            className="text-gray-900 font-medium hover:underline disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCriterionId(null)}
                            className="text-gray-500 hover:underline"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {criterion.text}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {criterion.description ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm space-x-3">
                          <button
                            onClick={() => startEditCriterion(criterion)}
                            className="text-gray-700 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCriterion(criterion.id)}
                            disabled={deletingCriterionId === criterion.id}
                            className="text-red-600 hover:underline disabled:opacity-50"
                          >
                            {deletingCriterionId === criterion.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Criterion Form */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Add Criterion
        </h2>
        <form
          onSubmit={handleAddCriterion}
          className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Criterion Text <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              required
              placeholder="e.g. The document must include a privacy policy section."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Optional clarification..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={addingCriterion || !newText.trim()}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {addingCriterion ? "Adding..." : "Add Criterion"}
          </button>
        </form>
      </div>
    </div>
  );
}
