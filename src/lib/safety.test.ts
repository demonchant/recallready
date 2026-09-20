import { describe, expect, it } from "vitest";
import { normalizeIdentifier, scoreRecallMatch } from "./safety";

describe("recall model matching", () => {
  it("normalizes punctuation and spacing before comparison", () => {
    expect(normalizeIdentifier("cw af 900")).toBe("CWAF900");
    expect(normalizeIdentifier("CW/AF.900")).toBe("CWAF900");
  });

  it("scores an exact brand and model match at high confidence", () => {
    expect(
      scoreRecallMatch({
        productBrand: "CookWell",
        productModel: "CW AF900",
        recallBrands: ["CookWell"],
        recallModels: ["CWAF900", "CW AF910"],
      }),
    ).toBe(0.99);
  });

  it("does not flag a brand match alone as an actionable recall", () => {
    expect(
      scoreRecallMatch({
        productBrand: "CookWell",
        productModel: "CW AF700",
        recallBrands: ["CookWell"],
        recallModels: ["CW AF900"],
      }),
    ).toBeLessThan(0.8);
  });
});
