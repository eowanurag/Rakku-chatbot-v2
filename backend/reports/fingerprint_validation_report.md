# Submission Fingerprint Lifecycle Validation Report

## Executive Summary
* **Status**: **PASS**
* **Verification Method**: Automated integration tests in `tests/security/fingerprint_lifecycle.spec.ts`
* **Mechanism**: Persistent DB-backed SHA256 hash deduplication

---

## Technical Details

To prevent duplicate submission race conditions and client double-submits, we implemented a robust backend-level Submission Fingerprint Lifecycle:

1. **Deterministic Hashing**:
   * Generates a SHA256 checksum based on:
     ```text
     SHA256(citizenId + serviceType + JSON.stringify(normalizedPayload))
     ```
   * All generated hashes are consistent 64-character hexadecimal strings.

2. **Payload Normalization**:
   * Dynamically filters out transient keys such as `sessionId`, `timestamp`, `createdAt`, `updatedAt`, and other non-semantic metadata before generating the hash. This ensures structural edits or microsecond delays do not change the fingerprint.

3. **Window Checking**:
   * Compares the generated hash against the persistent `SubmissionFingerprint` database table.
   * If a matching fingerprint exists within a 5-minute window, the request is flagged as a duplicate.

4. **Startup & Scheduled Table Pruning**:
   * Enforces bounded table growth by deleting records older than **24 hours**.
   * Integrates an automated cleanup task run on application startup (`OnModuleInit` lifecycle hook of NestJS).
   * Safe for multi-instance production environments without memory leak risk.

---

## Automated Test Results

The behavior was validated successfully in `tests/security/fingerprint_lifecycle.spec.ts`:

* **Consistency Validation**: Hashing the same payload returns identical output.
* **Normalization Validation**: Hashing payloads with different `timestamp` or `sessionId` values but matching core content yields identical hashes.
* **Duplicate Detection Validation**:
  * First submission checks out as non-duplicate.
  * Subsequent submissions within the window are flagged as duplicates.
* **Pruning & Cleanup Validation**:
  * Artificially inserted record older than 25 hours is correctly identified and pruned by `cleanupFingerprints()`.
  * Recent record (less than 24 hours old) is preserved.
