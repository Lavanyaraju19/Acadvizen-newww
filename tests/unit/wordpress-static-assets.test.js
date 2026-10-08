import test from 'node:test'
import assert from 'node:assert/strict'

import { staticAssetPath, STATIC_CACHE_CONTROL } from '../../lib/wordpress/staticAssets.js'

test('maps /_acv/c and /_acv/i static files to wp-content and wp-includes', () => {
  assert.equal(staticAssetPath('c', ['plugins', 'elementor', 'assets', 'css', 'frontend.min.css']), '/wp-content/plugins/elementor/assets/css/frontend.min.css')
  assert.equal(staticAssetPath('c', ['plugins', 'elementor', 'assets', 'lib', 'eicons', 'fonts', 'eicons.woff2']), '/wp-content/plugins/elementor/assets/lib/eicons/fonts/eicons.woff2')
  assert.equal(staticAssetPath('i', ['js', 'jquery', 'jquery.min.js']), '/wp-includes/js/jquery/jquery.min.js')
  // WooCommerce ships a font whose name contains a comma.
  assert.equal(staticAssetPath('c', ['plugins', 'woocommerce', 'assets', 'fonts', 'Inter-VariableFont_slnt,wght.woff2']), '/wp-content/plugins/woocommerce/assets/fonts/Inter-VariableFont_slnt,wght.woff2')
})

test('refuses anything that is not a static file in wp-content or wp-includes', () => {
  for (const [area, segments] of [
    ['x', ['a.css']],
    ['c', []],
    ['c', ['..', 'wp-config.php']],
    ['c', ['plugins', '..', '..', 'wp-config.css']],
    ['c', ['plugins', 'evil.php']],
    ['c', ['uploads', 'secret.txt']],
    ['c', ['debug.log']],
    ['c', ['uploads', 'video.mp4']],
    ['c', ['uploads', 'wc-logs', 'x.json']],
    ['c', ['plugins', 'a b', 'x.css']],
    ['c', ['plugins', 'x%2F..', 'y.css']],
    ['i', ['js', 'x.css\u0000.php']],
  ]) {
    assert.equal(staticAssetPath(area, segments), null, `${area}/${segments.join('/')}`)
  }
})

test('static responses are CDN-cacheable', () => {
  assert.match(STATIC_CACHE_CONTROL, /s-maxage=\d+/)
  assert.match(STATIC_CACHE_CONTROL, /^public/)
})
