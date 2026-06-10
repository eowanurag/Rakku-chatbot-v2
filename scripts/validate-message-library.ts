import * as fs from 'fs';
import * as path from 'path';

const LIBRARY_PATH = path.resolve(__dirname, '../shared/message_library.json');

function validate() {
  console.log(`[VALIDATION] Reading message library from: ${LIBRARY_PATH}`);
  if (!fs.existsSync(LIBRARY_PATH)) {
    console.error(`Error: File not found at ${LIBRARY_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(LIBRARY_PATH, 'utf-8');
  let data: any;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.error('Error: Failed to parse JSON content.');
    console.error(err);
    process.exit(1);
  }

  // Check version and messages
  if (!data.version) {
    console.error('Error: "version" is missing in message library.');
    process.exit(1);
  }
  if (!data.messages || typeof data.messages !== 'object') {
    console.error('Error: "messages" object is missing or invalid.');
    process.exit(1);
  }

  console.log(`[VALIDATION] Version: ${data.version}, Updated At: ${data.updatedAt}`);

  const requiredLangs = ['en', 'hi', 'hinglish'];
  let hasErrors = false;

  for (const [key, val] of Object.entries(data.messages)) {
    if (!val || typeof val !== 'object') {
      console.error(`Error: Key "${key}" does not have a valid translations object.`);
      hasErrors = true;
      continue;
    }

    // Check missing translations
    for (const lang of requiredLangs) {
      if (!(lang in (val as any))) {
        console.error(`Error: Key "${key}" is missing translation for language "${lang}".`);
        hasErrors = true;
      } else {
        const text = (val as any)[lang];
        if (typeof text !== 'string' || text.trim() === '') {
          console.error(`Error: Key "${key}" has an empty or invalid translation for language "${lang}".`);
          hasErrors = true;
        }
      }
    }

    // Check placeholder consistency
    if (!hasErrors) {
      const placeholdersByLang: Record<string, Set<string>> = {};
      const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;

      for (const lang of requiredLangs) {
        const text = (val as any)[lang];
        const placeholders = new Set<string>();
        let match;
        while ((match = placeholderRegex.exec(text)) !== null) {
          placeholders.add(match[1]);
        }
        placeholdersByLang[lang] = placeholders;
      }

      // Compare placeholders between languages
      const enPlaceholders = placeholdersByLang['en'];
      for (const lang of ['hi', 'hinglish']) {
        const currentPlaceholders = placeholdersByLang[lang];
        // Check if both sets are identical
        for (const p of enPlaceholders) {
          if (!currentPlaceholders.has(p)) {
            console.error(`Error: Key "${key}" has placeholder "{${p}}" in "en" but missing in "${lang}".`);
            hasErrors = true;
          }
        }
        for (const p of currentPlaceholders) {
          if (!enPlaceholders.has(p)) {
            console.error(`Error: Key "${key}" has placeholder "{${p}}" in "${lang}" but missing in "en".`);
            hasErrors = true;
          }
        }
      }
    }
  }

  if (hasErrors) {
    console.error('[VALIDATION] Message library validation FAILED.');
    process.exit(1);
  } else {
    console.log('[VALIDATION] Message library validation PASSED successfully.');
  }
}

validate();
