import re
from dataclasses import dataclass, field
from typing import List


@dataclass
class QueryAnalysis:
    intent: str
    entities: List[str] = field(default_factory=list)
    needs_multiple_sources: bool = False
    comparison_sides: List[str] = field(default_factory=list)
    raw_question: str = ''


_STOP_WORDS = {
    'what', 'are', 'the', 'is', 'of', 'and', 'or', 'to', 'in', 'on', 'for',
    'with', 'a', 'an', 'please', 'explain', 'list', 'define', 'tell', 'me',
    'about', 'how', 'why', 'does', 'do', 'be', 'been', 'being', 'compare',
    'describe', 'summarize', 'summarise', 'give', 'provide', 'between',
    'difference', 'differences', 'vs', 'versus', 'contrast', 'show', 'can',
    'could', 'would', 'should', 'from', 'inside', 'document', 'documents',
}

_DEFINITION_PATTERNS = [
    re.compile(r'\bwhat\s+(?:is|are)\b', re.I),
    re.compile(r'\bdefine\b', re.I),
    re.compile(r'\bdefinition\s+of\b', re.I),
    re.compile(r'\bexplain\b', re.I),
    re.compile(r'\bdescribe\b', re.I),
    re.compile(r'\bmeaning\s+of\b', re.I),
]

_LIST_PATTERNS = [
    re.compile(r'\blist\b', re.I),
    re.compile(r'\bname\s+the\b', re.I),
    re.compile(r'\bwhat\s+are\s+the\b', re.I),
    re.compile(r'\b(?:two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:values?|activities|steps?|types?|principles?|phases?|stages?|components?|elements?|characteristics?|features?|benefits?|advantages?|disadvantages?|reasons?)\b', re.I),
    re.compile(r'\bcomponents?|characteristics?|principles?|values?|activities?|types?\b', re.I),
]

_COMPARISON_PATTERNS = [
    re.compile(r'\bcompare\b', re.I),
    re.compile(r'\bvs\.?\b', re.I),
    re.compile(r'\bversus\b', re.I),
    re.compile(r'\bdifference(?:s)?\s+between\b', re.I),
    re.compile(r'\bcontrast\b', re.I),
    re.compile(r'\bhow\s+(?:does|do|is|are)\s+.+\s+(?:differ|different)\b', re.I),
]

_STEPS_PATTERNS = [
    re.compile(r'\bhow\s+(?:to|do|does)\b', re.I),
    re.compile(r'\bsteps?|process|procedure|phases?|stages?\b', re.I),
]

_PROS_CONS_PATTERNS = [
    re.compile(r'\badvantages?|disadvantages?|pros?\s+and\s+cons?|benefits?|drawbacks?|limitations?|weaknesses?|strengths?\b', re.I),
]

_EXAMPLES_PATTERNS = [
    re.compile(r'\bexamples?|instances?|such\s+as|illustrate\b', re.I),
]

_SUMMARY_PATTERNS = [
    re.compile(r'\bsummarise|summarize|summary|overview\b', re.I),
]


def _normalise_question(question: str) -> str:
    return re.sub(r'\s+', ' ', re.sub(r'[^a-zA-Z0-9\s\-]', ' ', question.lower())).strip()


def _extract_entities(question: str) -> List[str]:
    cleaned = _normalise_question(question)
    words = []
    for word in cleaned.split():
        if word in _STOP_WORDS:
            continue
        if len(word) >= 3 or (len(word) == 2 and word.isalnum()):
            words.append(word)

    entities: List[str] = []
    for n in (4, 3, 2):
        for i in range(len(words) - n + 1):
            phrase = ' '.join(words[i:i + n]).strip()
            if phrase:
                entities.append(phrase)
    entities.extend(words)

    seen = set()
    deduped: List[str] = []
    for entity in entities:
        if entity not in seen:
            seen.add(entity)
            deduped.append(entity)
    return deduped[:12]


def _clean_side(side: str) -> str:
    side = _normalise_question(side)
    side = re.sub(r'^(compare|contrast|difference between|differences between)\s+', '', side).strip()
    return side


def _extract_comparison_sides(question: str) -> List[str]:
    q = _normalise_question(question)

    patterns = [
        r'between\s+(.+?)\s+and\s+(.+)$',
        r'compare\s+(.+?)\s+and\s+(.+)$',
        r'contrast\s+(.+?)\s+and\s+(.+)$',
        r'(.+?)\s+(?:vs|versus)\s+(.+)$',
    ]
    for pattern in patterns:
        match = re.search(pattern, q)
        if match:
            left = _clean_side(match.group(1))
            right = _clean_side(match.group(2))
            if left and right and left != right:
                return [left, right]
    return []


def _matches(patterns: List[re.Pattern], question: str) -> bool:
    return any(pattern.search(question) for pattern in patterns)


def analyze_query(question: str) -> QueryAnalysis:
    q = question.strip()
    entities = _extract_entities(q)

    if _matches(_COMPARISON_PATTERNS, q):
        sides = _extract_comparison_sides(q)
        return QueryAnalysis('comparison', entities, True, sides, q)

    if _matches(_PROS_CONS_PATTERNS, q):
        return QueryAnalysis('pros_cons', entities, False, [], q)

    if _matches(_STEPS_PATTERNS, q):
        return QueryAnalysis('steps', entities, False, [], q)

    if _matches(_LIST_PATTERNS, q):
        return QueryAnalysis('list', entities, False, [], q)

    if _matches(_EXAMPLES_PATTERNS, q):
        return QueryAnalysis('examples', entities, False, [], q)

    if _matches(_SUMMARY_PATTERNS, q):
        return QueryAnalysis('summary', entities, True, [], q)

    if _matches(_DEFINITION_PATTERNS, q):
        return QueryAnalysis('definition', entities, False, [], q)

    return QueryAnalysis('general', entities, False, [], q)
