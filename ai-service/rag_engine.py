import json
import os
import re

class RAGEngine:
    def __init__(self, kb_path: str = None):
        if kb_path is None:
            kb_path = os.path.join(os.path.dirname(__file__), "knowledge_base.json")
        
        self.kb_items = []
        try:
            if os.path.exists(kb_path):
                with open(kb_path, "r", encoding="utf-8") as f:
                    self.kb_items = json.load(f)
            else:
                print(f"Warning: Knowledge base not found at {kb_path}")
        except Exception as e:
            print(f"Error loading knowledge base: {e}")

    def _tokenize(self, text: str) -> set:
        # Lowercase, strip punctuation and split into tokens
        clean_text = re.sub(r'[^\w\s]', '', text.lower())
        return set([word for word in clean_text.split() if len(word) > 2])

    def retrieve(self, query: str, top_k: int = 2) -> list:
        if not self.kb_items or not query:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        ranked_items = []
        for item in self.kb_items:
            q_tokens = self._tokenize(item.get("question", ""))
            a_tokens = self._tokenize(item.get("answer", ""))
            
            # Count word matches, putting more weight on question matches
            q_overlap = len(query_tokens.intersection(q_tokens))
            a_overlap = len(query_tokens.intersection(a_tokens))
            
            score = (q_overlap * 2.0) + (a_overlap * 0.5)
            
            if score > 0:
                ranked_items.append((score, item))

        # Sort by score descending
        ranked_items.sort(key=lambda x: x[0], reverse=True)
        return [item for score, item in ranked_items[:top_k]]
