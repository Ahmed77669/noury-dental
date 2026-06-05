import re

def normalize_arabic(text: str) -> str:
    """
    Cleans and normalizes Arabic text for consistent search mapping.
    1. Removes Arabic diacritics (tashkeel).
    2. Normalizes Alif variants (أ, إ, آ) to bare Alif (ا).
    3. Normalizes Taa Marbouta (ة) to Haa (ه) or vice versa, but typically standardizes to Alif/Haa.
    4. Normalizes Ya (ى) to Ya (ي).
    5. Cleans extra whitespaces.
    """
    if not text:
        return ""
    
    # 1. Remove Arabic diacritics (tashkeel)
    tashkeel_pattern = re.compile(r'[\u064B-\u065F]')
    text = re.sub(tashkeel_pattern, '', text)
    
    # 2. Normalize Alif variants
    text = re.sub(r'[أإآ]', 'ا', text)
    
    # 3. Normalize Taa Marbouta to Haa
    text = re.sub(r'ة', 'ه', text)
    
    # 4. Normalize Ya variants
    text = re.sub(r'ى', 'ي', text)
    
    # 5. Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def clean_text(text: str) -> str:
    """
    General text cleaning: strips HTML tags, removes URLs, normalizes whitespace.
    """
    if not text:
        return ""
    
    # Remove HTML tags
    text = re.sub(r'<[^>]*>', ' ', text)
    
    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    
    # Remove excessive spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text
