from typing import List, Dict


def chunk_sections(
    sections: List[Dict],
    max_tokens: int = 120000,
) -> List[List[Dict]]:
    """
    Groups sections into batches that fit within max_tokens.
    Rough estimate: 1 token ≈ 4 characters.

    If a single section exceeds max_tokens, it is split by paragraphs first.

    Returns a list of batches, where each batch is a list of section dicts.
    """
    max_chars = max_tokens * 4
    batches: List[List[Dict]] = []
    current_batch: List[Dict] = []
    current_chars = 0

    expanded = _expand_large_sections(sections, max_chars)

    for section in expanded:
        section_chars = len(section.get("title", "")) + len(section.get("content", ""))

        if current_chars + section_chars > max_chars and current_batch:
            batches.append(current_batch)
            current_batch = []
            current_chars = 0

        current_batch.append(section)
        current_chars += section_chars

    if current_batch:
        batches.append(current_batch)

    return batches


def _expand_large_sections(sections: List[Dict], max_chars: int) -> List[Dict]:
    """
    Splits any section whose content exceeds max_chars into paragraph-level sub-sections.
    """
    result: List[Dict] = []

    for section in sections:
        content = section.get("content", "")
        title = section.get("title", "")
        index = section.get("index", 0)
        section_chars = len(title) + len(content)

        if section_chars <= max_chars:
            result.append(section)
            continue

        # Split by double newlines (paragraphs), then re-group
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        if not paragraphs:
            # Fall back to sentence split
            paragraphs = [s.strip() for s in content.split(". ") if s.strip()]

        sub_index = 0
        current_parts: List[str] = []
        current_len = 0

        for para in paragraphs:
            para_len = len(para)

            if current_len + para_len > max_chars and current_parts:
                result.append({
                    "title": f"{title} (part {sub_index + 1})",
                    "content": "\n\n".join(current_parts),
                    "index": index,
                })
                sub_index += 1
                current_parts = []
                current_len = 0

            current_parts.append(para)
            current_len += para_len

        if current_parts:
            result.append({
                "title": f"{title} (part {sub_index + 1})" if sub_index > 0 else title,
                "content": "\n\n".join(current_parts),
                "index": index,
            })

    return result
