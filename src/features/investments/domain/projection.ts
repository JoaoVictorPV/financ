export function annualToMonthlyRate(annualRate: number): number {
  // r_m = (1+r_a)^(1/12) - 1
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

export function futureValueNoContrib(
  pvCents: number,
  monthlyRate: number,
  months: number,
): number {
  const fv = (pvCents / 100) * Math.pow(1 + monthlyRate, months);
  return Math.round(fv * 100);
}

export function futureValueWithContrib(
  pvCents: number,
  monthlyRate: number,
  months: number,
  contribCents: number,
): number {
  const pv = pvCents / 100;
  const pmt = contribCents / 100;
  if (monthlyRate === 0) {
    const fv = pv + pmt * months;
    return Math.round(fv * 100);
  }
  const fv = pv * Math.pow(1 + monthlyRate, months) + pmt * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  return Math.round(fv * 100);
}

export function applyIROnGain(
  fvCents: number,
  pvCents: number,
  irRate: number | null | undefined,
): { fvAfterTaxCents: number; taxCents: number } {
  const rate = irRate ?? 0;
  const gain = Math.max(0, fvCents - pvCents);
  const tax = Math.round(gain * rate);
  return { fvAfterTaxCents: fvCents - tax, taxCents: tax };
}
