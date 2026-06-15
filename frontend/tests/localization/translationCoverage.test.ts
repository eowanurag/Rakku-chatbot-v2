import enCommon from "../../src/locales/en/common.json";
import hiCommon from "../../src/locales/hi/common.json";
import hinglishCommon from "../../src/locales/hinglish/common.json";

import enServices from "../../src/locales/en/services.json";
import hiServices from "../../src/locales/hi/services.json";
import hinglishServices from "../../src/locales/hinglish/services.json";

import enTracking from "../../src/locales/en/tracking.json";
import hiTracking from "../../src/locales/hi/tracking.json";
import hinglishTracking from "../../src/locales/hinglish/tracking.json";

function assertKeysMatch(objA: any, objB: any) {
  const keysA = Object.keys(objA).sort();
  const keysB = Object.keys(objB).sort();
  expect(keysB).toEqual(expect.arrayContaining(keysA));
}

describe("Translation Namespace Keys Coverage", () => {
  it("should match keys for common.json", () => {
    assertKeysMatch(enCommon, hiCommon);
    assertKeysMatch(enCommon, hinglishCommon);
  });

  it("should match keys for services.json", () => {
    assertKeysMatch(enServices, hiServices);
    assertKeysMatch(enServices, hinglishServices);
  });

  it("should match keys for tracking.json", () => {
    assertKeysMatch(enTracking, hiTracking);
    assertKeysMatch(enTracking, hinglishTracking);
  });
});
