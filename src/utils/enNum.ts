export function enNum(s: string | number | null | undefined): string {
  return String(s ?? '').replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}
