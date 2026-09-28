/**
 * Path to the downloadable company catalog PDF. Points into
 * public/documents/ — no file exists there yet, so the link is currently
 * inert until a real PDF is supplied by the project owner. Kept as a single
 * constant (rather than hardcoded in CatalogDownload.jsx) so dropping the
 * real file into public/documents/ is a one-line change.
 */
export const CATALOG_FILE_PATH = '/documents/ar-group-catalog.pdf'
