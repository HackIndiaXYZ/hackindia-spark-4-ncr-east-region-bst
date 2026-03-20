ML module (prototype)

Current behavior:
- Uses lightweight token-vector cosine similarity.
- Ranks input documents against a user prompt.
- Good enough for proof-of-concept without model downloads.

Next 12-hour upgrade path:
1) Add embedding model endpoint.
2) Add chunking for long files.
3) Add retrieval traces and confidence thresholds.
