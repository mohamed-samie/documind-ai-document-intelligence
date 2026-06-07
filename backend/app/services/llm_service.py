from typing import Dict, List, Optional

from groq import Groq

from app.core.config import settings


def get_groq_client() -> Groq:
    if not settings.GROQ_API_KEY:
        raise ValueError('GROQ_API_KEY is missing. Add it to backend/.env')
    return Groq(api_key=settings.GROQ_API_KEY)


def build_context(chunks: List[Dict], max_chunks: int = 8) -> str:
    parts: List[str] = []
    for index, chunk in enumerate(chunks[:max_chunks], start=1):
        file_name = chunk.get('file_name', 'Unknown file')
        page_number = chunk.get('page_number', '?')
        section_title = chunk.get('section_title', '')
        content = chunk.get('content', '')
        if section_title:
            label = f'Source {index}: {file_name}, section "{section_title}", page {page_number}'
        else:
            label = f'Source {index}: {file_name}, page {page_number}'
        parts.append(f'{label}\n{content}')
    return '\n\n---\n\n'.join(parts)


_INTENT_INSTRUCTIONS: Dict[str, str] = {
    'definition': 'Start with a direct one-sentence definition, then add brief supporting details only if supported.',
    'list': 'Use a clean numbered list and include all relevant items mentioned in the context.',
    'steps': 'Use a numbered sequence of steps.',
    'pros_cons': 'Use labelled sections such as Advantages and Disadvantages when both are supported.',
    'examples': 'List examples clearly and briefly.',
    'comparison': 'Use a structured comparison. Prefer a compact markdown table when both sides have evidence.',
    'summary': 'Provide a concise summary of the main points from the context.',
    'general': '',
}


def _intent_instruction(intent: Optional[str]) -> str:
    return _INTENT_INSTRUCTIONS.get(intent or 'general', '')


def generate_answer(question: str, chunks: List[Dict], intent: Optional[str] = None) -> str:
    context = build_context(chunks)
    system_prompt = f'''
You are DocuMind, a reliable AI assistant for business and educational documents.

Answer the user's question using ONLY the provided context.

Rules:
1. Do NOT use outside knowledge.
2. Do NOT invent facts.
3. If the answer is not clearly supported by the context, say exactly:
"I could not find enough information in the uploaded documents."
4. If supported, start with a natural citation such as:
"According to [file name], page [page number]..." or
"According to [file name], section '[section title]'..."
5. Answer the exact question only.
6. Do NOT add unsolicited notes, warnings, or comparisons.
7. Do not mention source numbers or chunk numbers.
8. Keep the answer concise but complete.

{_intent_instruction(intent)}
'''.strip()

    user_prompt = f'Question:\n{question}\n\nContext:\n{context}\n\nAnswer based only on the context.'
    response = get_groq_client().chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[{'role': 'system', 'content': system_prompt}, {'role': 'user', 'content': user_prompt}],
        temperature=0.1,
        max_tokens=600,
    )
    return response.choices[0].message.content or ''


def generate_comparison_answer(question: str, chunks_a: List[Dict], label_a: str, chunks_b: List[Dict], label_b: str) -> str:
    context_a = build_context(chunks_a, max_chunks=4)
    context_b = build_context(chunks_b, max_chunks=4)
    system_prompt = '''
You are DocuMind, a reliable AI assistant for business and educational documents.

Answer using ONLY the provided evidence.

Rules:
1. Do NOT use outside knowledge.
2. Do NOT invent facts.
3. If one side lacks evidence, say so clearly.
4. Output a concise comparison.
5. Use this exact structure:
   - One short opening sentence with file/page reference.
   - A compact markdown table with columns: Aspect | Side A | Side B.
   - One short conclusion.
6. Do not create long sections.
7. Do not mention source numbers or chunk numbers.
'''.strip()
    user_prompt = f'''
Question:
{question}

Side A label:
{label_a}

Evidence for Side A:
{context_a}

Side B label:
{label_b}

Evidence for Side B:
{context_b}

Create the comparison table now.
'''.strip()
    response = get_groq_client().chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[{'role': 'system', 'content': system_prompt}, {'role': 'user', 'content': user_prompt}],
        temperature=0.1,
        max_tokens=550,
    )
    return response.choices[0].message.content or ''
