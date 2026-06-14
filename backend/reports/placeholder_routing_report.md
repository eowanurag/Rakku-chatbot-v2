# Placeholder Routing UX Validation Report

## Executive Summary
* **Status**: **PASS**
* **Goal**: Prevent unverified placeholder stations from exposing invalid details, coordinates, or authority claims.
* **Verification Method**: Automated integration tests in `tests/jurisdiction-routing/placeholder_routing.spec.ts`.

---

## Technical Implementation

To prevent poor citizen experience and broken integration states, placeholder stations are filtered out of public-facing directory details:

1. **Station Criteria**:
   Stations marked with `isPlaceholder: true` in the database registry represent temporary or unverified routing points for districts.

2. **UX Restrictions (Provisional Mode)**:
   When resolving or displaying a placeholder station:
   * **Phone numbers** are returned as `null`.
   * **Coordinates** (`latitude`, `longitude`) are returned as `null` to prevent broken GIS/GPS calculations.
   * **Maps links** are returned as an empty string `""`.
   * **Distance calculations** are returned as `null`.

3. **User Message Override**:
   Rather than showing typical verified contact claims, the following user response is returned exactly:
   ```text
   Jurisdiction identified.

   This district is currently using a provisional routing configuration.

   Your request has been routed successfully and will be reviewed by the appropriate authority.
   ```

---

## Automated Test Results

The behavior was validated successfully in `tests/jurisdiction-routing/placeholder_routing.spec.ts`:

* **Placeholder Station Verification (e.g., District Amroha)**:
  * verified phone is `null`.
  * verified coordinates are `null`.
  * verified mapsUrl is `""`.
  * returned message contains the exact provisional routing warning block.
* **Verified Station Verification (e.g., District Lucknow)**:
  * verified phone is present.
  * verified coordinates are present.
  * verified mapsUrl points to Google Maps correctly.
  * message override is omitted.
