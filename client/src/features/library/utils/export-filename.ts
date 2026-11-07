export function buildExportFilename(
  entity: string,
  extension: string,
  date: Date = new Date(),
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const cleanExt = extension.replace(/^\./, '');
  return `${entity}-${year}-${month}-${day}.${cleanExt}`;
}
