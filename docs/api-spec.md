# API Specification: Part Submission

## 1. File Naming Convention
- **Format:** `part-####.json`
- **Pattern:** `^part-\d{4}\.json$`
- **Example:** `part-0001.json`, `part-0042.json`
- **Logic:** Sequential increment based on the highest existing ID in `src/data/parts`.

## 2. JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["title", "fabricationMethod", "typeOfPart", "imageSrc", "platform"],
  "properties": {
    "title": {
      "type": "string",
      "minLength": 3,
      "description": "Name of the part"
    },
    "fabricationMethod": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Methods used to create the part (e.g., '3d Printed', 'CNC')"
    },
    "typeOfPart": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1,
      "maxItems": 2,
      "description": "Category tags. MUST contain exactly 1 primary category. 'OEM' is the only valid secondary tag."
    },
    "imageSrc": {
      "type": "string",
      "format": "uri-reference",
      "description": "URL or path to the part image"
    },
    "externalUrl": {
      "type": "string",
      "format": "uri",
      "description": "Link to the source or product page"
    },
    "dropboxUrl": {
      "type": "string",
      "format": "uri",
      "description": "Direct download link if available"
    },
    "dropboxZipLastUpdated": {
      "type": "string",
      "format": "date",
      "description": "YYYY-MM-DD"
    },
    "platform": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Compatible platforms or board models"
    }
  }
}
```

## 3. Validation Rules
1.  **Tag Constraint:** `typeOfPart` must have exactly one value from the allowed categories list.
2.  **Secondary Tag:** The **ONLY** allowed second tag is `"OEM"`.
    - Valid: `["Motor"]`
    - Valid: `["Motor", "OEM"]`
    - Invalid: `["Motor", "Wheel"]`
    - Invalid: `["OEM"]` (Must have a primary category)

## 4. Error Handling
- **GitHub 403/504:** Return `503 System Busy`.
- **Validation Failure:** Return `400 Bad Request` with specific error message.
- **ID Generation Failure:** If next ID cannot be verified securely, return `500 Internal Server Error`.
