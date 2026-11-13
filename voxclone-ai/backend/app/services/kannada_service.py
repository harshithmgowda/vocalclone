import re
from typing import Tuple

KANNADA_RANGE = re.compile(r'[\u0C80-\u0CFF]')

def is_kannada(text: str) -> bool:
    """Checks whether the text contains Kannada characters."""
    return bool(KANNADA_RANGE.search(text))

def kannada_to_phonetic(text: str) -> str:
    """
    Translates Kannada unicode text into natural Latin phonetics
    optimized for F5-TTS neural flow-matching speech synthesis.
    """
    if not is_kannada(text):
        return text

    text = text.replace('\u200c', '').replace('\u200d', '')

    vowels = {
        '\u0C85': 'a', '\u0C86': 'aa', '\u0C87': 'i', '\u0C88': 'ee',
        '\u0C89': 'u', '\u0C8A': 'oo', '\u0C8B': 'ru', '\u0C8E': 'e',
        '\u0C8F': 'ee', '\u0C90': 'ai', '\u0C92': 'o', '\u0C93': 'oo',
        '\u0C94': 'au'
    }

    consonants = {
        '\u0C95': 'k', '\u0C96': 'kh', '\u0C97': 'g', '\u0C98': 'gh', '\u0C99': 'ng',
        '\u0C9A': 'ch', '\u0C9B': 'chh', '\u0C9C': 'j', '\u0C9D': 'jh', '\u0C9E': 'ny',
        '\u0C9F': 't', '\u0CA0': 'th', '\u0CA1': 'd', '\u0CA2': 'dh', '\u0CA3': 'n',
        '\u0CA4': 'th', '\u0CA5': 'thh', '\u0CA6': 'd', '\u0CA7': 'dh', '\u0CA8': 'n',
        '\u0CAA': 'p', '\u0CAB': 'ph', '\u0CAC': 'b', '\u0CAD': 'bh', '\u0CAE': 'm',
        '\u0CAF': 'y', '\u0CB0': 'r', '\u0CB1': 'r', '\u0CB2': 'l', '\u0CB3': 'l',
        '\u0CB5': 'v', '\u0CB6': 'sh', '\u0CB7': 'sh', '\u0CB8': 's', '\u0CB9': 'h'
    }

    matras = {
        '\u0CBE': 'aa', '\u0CBF': 'i', '\u0CC0': 'ee', '\u0CC1': 'u',
        '\u0CC2': 'oo', '\u0CC3': 'ru', '\u0CC6': 'e', '\u0CC7': 'ee',
        '\u0CC8': 'ai', '\u0CCA': 'o', '\u0CCB': 'oo', '\u0CCC': 'au'
    }

    virama = '\u0CCD'
    anusvara = '\u0C82'
    visarga = '\u0C83'

    result = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch in vowels:
            result.append(vowels[ch])
            i += 1
        elif ch in consonants:
            c = consonants[ch]
            if i + 1 < n:
                next_ch = text[i + 1]
                if next_ch == virama:
                    result.append(c)
                    i += 2
                elif next_ch in matras:
                    result.append(c + matras[next_ch])
                    i += 2
                elif next_ch == anusvara:
                    result.append(c + 'am')
                    i += 2
                elif next_ch == visarga:
                    result.append(c + 'aha')
                    i += 2
                else:
                    result.append(c + 'a')
                    i += 1
            else:
                result.append(c + 'a')
                i += 1
        elif ch == anusvara:
            result.append('m')
            i += 1
        elif ch == visarga:
            result.append('h')
            i += 1
        else:
            result.append(ch)
            i += 1

    return ''.join(result)

