/**
 * Minimal additions the Main Website makes to a WordPress-rendered document before serving it.
 * The document itself (layout, CSS, JS, widgets) is never altered: only the Main Website's own
 * analytics are added, because these pages bypass the Next.js root layout that normally adds them.
 */

export function injectBeforeHeadClose(html, snippet) {
  if (!snippet) return html
  const index = html.search(/<\/head\s*>/i)
  return index === -1 ? `${snippet}${html}` : `${html.slice(0, index)}${snippet}${html.slice(index)}`
}

export function injectAfterBodyOpen(html, snippet) {
  if (!snippet) return html
  const match = /<body\b[^>]*>/i.exec(html)
  if (!match) return html
  const end = match.index + match[0].length
  return `${html.slice(0, end)}${snippet}${html.slice(end)}`
}

const ID_PATTERN = /^[A-Z0-9-]+$/i

// GTM/GA follow `enabled`; the Meta pixel follows `metaPixelEnabled` (default: `enabled`), as on
// the Main Website's own pages where the pixel does not depend on the GA/GTM switch.
export function buildAnalyticsSnippets({ enabled, gtmId, gaId, metaPixelId, metaPixelEnabled = enabled }) {
  const head = []
  const body = []
  if (enabled && gtmId && ID_PATTERN.test(gtmId)) {
    head.push(`<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');</script>`)
    body.push(`<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`)
  }
  if (enabled && gaId && ID_PATTERN.test(gaId)) {
    head.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');</script>`)
  }
  if (metaPixelEnabled && metaPixelId && /^\d+$/.test(metaPixelId)) {
    head.push(`<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');</script>`)
  }
  return { head: head.join(''), body: body.join('') }
}

export function prepareBridgedDocument(html, analytics) {
  const snippets = buildAnalyticsSnippets(analytics)
  return injectAfterBodyOpen(injectBeforeHeadClose(String(html || ''), snippets.head), snippets.body)
}
