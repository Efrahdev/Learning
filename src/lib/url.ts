/**
 * Builds a link inside the site, adding the base path (/Learning/).
 * Always use this for internal links, so moving the site only means changing astro.config.mjs.
 *   url('physics/') → '/Learning/physics/'
 */
const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

export function url(path = ''): string {
  return BASE + path.replace(/^\/+/, '');
}
