/**
 * Get map image URL from CDN
 * @param {string} mapName - Map name
 * @returns {string} Map image URL
 */
export function getMapImageUrl(mapName) {
  return `https://cdn.jsdelivr.net/gh/wiruwiru/MapsImagesCDN-CS/avif/${mapName}.avif`
}