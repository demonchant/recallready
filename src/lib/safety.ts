export type MatchCandidate = {
  productBrand: string;
  productModel: string;
  recallBrands: string[];
  recallModels: string[];
};

export function normalizeIdentifier(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function scoreRecallMatch(candidate: MatchCandidate) {
  const brand = normalizeIdentifier(candidate.productBrand);
  const model = normalizeIdentifier(candidate.productModel);
  const brandMatch = candidate.recallBrands.some(
    (value) => normalizeIdentifier(value) === brand,
  );
  const modelMatch = candidate.recallModels.some(
    (value) => normalizeIdentifier(value) === model,
  );

  if (brandMatch && modelMatch) return 0.99;
  if (modelMatch) return 0.9;
  if (brandMatch) return 0.45;
  return 0;
}
