import json
import re
from typing import List, Dict, Any

from openai import OpenAI


QWEN_BASE_URL = "https://apis.iflow.cn/v1"
QWEN_MODEL = "deepseek-v3"


def check_document(
    document_text_sections: List[Dict],
    criteria: List[Any],
    api_key: str,
) -> List[Dict]:
    """
    Runs compliance checking using Qwen3-235b via iflow OpenAI-compatible API.

    Args:
        document_text_sections: List of section dicts {"title", "content", "index"}
        criteria: List of Criterion ORM objects with .id, .text, .description
        api_key: iflow API key

    Returns:
        List of dicts: {criterion_id, status, evidence, doc_quote, section_ref}
        Aggregation rule: if criterion is PASS in any chunk → PASS overall.
    """
    from services.chunker import chunk_sections

    client = OpenAI(api_key=api_key, base_url=QWEN_BASE_URL)

    # Build criteria list text
    criteria_text = "\n".join(
        f"{i + 1}. [ID:{c.id}] {c.text}" + (f" — {c.description}" if c.description else "")
        for i, c in enumerate(criteria)
    )

    # Group sections into token-safe batches
    batches = chunk_sections(document_text_sections, max_tokens=120000)

    # Map criterion_id → best result found so far
    # Priority: PASS > UNCLEAR > FAIL (PASS wins the moment it appears)
    STATUS_PRIORITY = {"PASS": 2, "UNCLEAR": 1, "FAIL": 0}
    aggregated: Dict[int, Dict] = {}

    for batch in batches:
        section_text = "\n\n".join(
            f"### {sec['title']}\n{sec['content']}" for sec in batch
        )

        prompt = (
            f"DOCUMENT SECTION:\n{section_text}\n\n"
            f"CRITERIA:\n{criteria_text}\n\n"
            "For each criterion return a JSON object in an array. "
            "Return ONLY the JSON array with no other text, markdown, or explanation.\n"
            "Schema for each item:\n"
            '{"criterion_id": <int>, "status": "PASS"|"FAIL"|"UNCLEAR", '
            '"evidence": "<explanation>", "quote": "<exact quote from doc or empty string>", '
            '"section": "<section title or location>"}'
        )

        try:
            response = client.chat.completions.create(
                model=QWEN_MODEL,
                max_tokens=4096,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a document compliance auditor. "
                            "Analyze the provided document section and check each criterion carefully. "
                            "Return ONLY a valid JSON array, no other text."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
            )
            raw = response.choices[0].message.content.strip()
        except Exception as exc:
            # If Claude call fails for this batch, mark all criteria as UNCLEAR
            for c in criteria:
                if c.id not in aggregated:
                    aggregated[c.id] = {
                        "criterion_id": c.id,
                        "status": "UNCLEAR",
                        "evidence": f"API error: {exc}",
                        "doc_quote": "",
                        "section_ref": "",
                    }
            continue

        # Parse JSON — strip any accidental markdown fences
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        try:
            results = json.loads(raw)
        except json.JSONDecodeError:
            # Attempt to extract JSON array from the response
            match = re.search(r"\[.*\]", raw, re.DOTALL)
            if match:
                try:
                    results = json.loads(match.group())
                except json.JSONDecodeError:
                    results = []
            else:
                results = []

        for item in results:
            cid = item.get("criterion_id")
            if cid is None:
                continue

            status = item.get("status", "UNCLEAR").upper()
            if status not in STATUS_PRIORITY:
                status = "UNCLEAR"

            evidence = item.get("evidence", "")
            quote = item.get("quote", "")
            section = item.get("section", "")

            existing = aggregated.get(cid)
            if existing is None:
                aggregated[cid] = {
                    "criterion_id": cid,
                    "status": status,
                    "evidence": evidence,
                    "doc_quote": quote,
                    "section_ref": section,
                }
            else:
                existing_priority = STATUS_PRIORITY.get(existing["status"], 0)
                new_priority = STATUS_PRIORITY.get(status, 0)

                if new_priority > existing_priority:
                    aggregated[cid] = {
                        "criterion_id": cid,
                        "status": status,
                        "evidence": evidence,
                        "doc_quote": quote,
                        "section_ref": section,
                    }
                elif new_priority == existing_priority and status == "PASS":
                    # Keep the one with the richer evidence
                    if len(evidence) > len(existing["evidence"]):
                        aggregated[cid]["evidence"] = evidence
                        aggregated[cid]["doc_quote"] = quote
                        aggregated[cid]["section_ref"] = section

    # Ensure every criterion has a result
    for c in criteria:
        if c.id not in aggregated:
            aggregated[c.id] = {
                "criterion_id": c.id,
                "status": "UNCLEAR",
                "evidence": "Criterion was not addressed in the document.",
                "doc_quote": "",
                "section_ref": "",
            }

    return list(aggregated.values())
