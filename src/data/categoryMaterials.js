import { products } from './products'

// Real AR Group brand/product-line names for the categories the Products
// landing page expands inline (see components/sections/ExpandedProductCategory.jsx).
// Sourced directly from data/products.js#brands (already verified — see that
// file's header comment) so this never drifts from the single source of
// truth; adding a material here means adding it to products.js first.
//
// Currently EMPTY on purpose: every category's brand names (Fire Stop/
// Hensotherm/Hensomastik, Bivratech/Vibratech/Vibrabsorber/Vibrafoam Purasys,
// Sylomer/Decidamp SP150/Sorbermel/Sorberbarrier/Damtec) have no real photo
// or other verified content — rendering them would just be a no-photo
// placeholder tile (see ui/ImagePlaceholder's "[IMAGE: ...]" text), which
// the public site must never show as a finished product card. Re-add a
// category key here ONLY once real photography/content exists for its
// brand tiles; until then, categories rely solely on real CMS products
// (see useProducts/ExpandedProductCategory's `categoryProducts`) — e.g.
// passiveFireProtection's 4 real Proflame products already do.
const EXPANDABLE_CATEGORY_KEYS = []

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// image/detailImage are placeholder paths only — no files exist at these
// paths yet (see ui/ImagePlaceholder, used until real photography lands).
// Once a real photo is added under public/images/products/materials/<category>/,
// swap the corresponding ImagePlaceholder for a real <img src=...> — the
// path is already correct, no other code needs to change.
export const categoryMaterials = Object.fromEntries(
  EXPANDABLE_CATEGORY_KEYS.map((categoryKey) => {
    const category = products.find((product) => product.key === categoryKey)
    const materials = category.brands.map((name) => {
      const slug = slugify(name)
      return {
        slug,
        name,
        image: `/images/products/materials/${categoryKey}/${slug}.jpg`,
        detailImage: `/images/products/materials/${categoryKey}/${slug}-detail.jpg`,
      }
    })
    return [categoryKey, materials]
  }),
)
