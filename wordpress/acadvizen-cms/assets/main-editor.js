/* Acadvizen Master Admin → Main Website: blog article and page section editors, media picker,
 * device preview. Plain script (no build step). Everything saved is validated again by the
 * Main Website (lib/wordpress/contentApi.js). */
(function () {
  'use strict'

  var el = function (tag, attrs, children) {
    var node = document.createElement(tag)
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === 'text') node.textContent = attrs[key]
      else if (key === 'on') Object.keys(attrs.on).forEach(function (ev) { node.addEventListener(ev, attrs.on[ev]) })
      else if (attrs[key] !== undefined && attrs[key] !== null && attrs[key] !== false) node.setAttribute(key, attrs[key] === true ? '' : attrs[key])
    })
    ;(children || []).forEach(function (child) { if (child) node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child) })
    return node
  }
  var uid = 0
  var nextId = function (prefix) { uid += 1; return prefix + '-' + uid }

  /* Media library ------------------------------------------------------------------------------ */
  function pickImage(onPick) {
    if (!window.wp || !wp.media) { window.alert('The media library is not available on this screen.'); return }
    var frame = wp.media({ title: 'Choose an image', library: { type: 'image' }, multiple: false })
    frame.on('select', function () { var file = frame.state().get('selection').first().toJSON(); onPick(file.url, file.alt || '') })
    frame.open()
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest('.acv-media-pick')
    if (!button) return
    event.preventDefault()
    pickImage(function (url) { var input = document.getElementById(button.getAttribute('data-target')); if (input) { input.value = url; input.dispatchEvent(new Event('input', { bubbles: true })) } })
  })
  // "Main library": pick an image already in the Main Website's media library.
  document.addEventListener('click', function (event) {
    var button = event.target.closest('.acv-main-library-pick')
    if (!button || !window.acvMainLibrary) return
    var target = document.getElementById(button.getAttribute('data-target'))
    var overlay = el('div', { class: 'acv-library' })
    var panel = el('div', { class: 'acv-library-panel', role: 'dialog', 'aria-label': 'Main Website media library' })
    var search = el('input', { type: 'search', placeholder: 'Search by name or alt text' })
    var grid = el('div', { class: 'acv-library-grid' })
    var close = function () { overlay.remove() }
    var load = function () {
      grid.textContent = 'Loading…'
      var body = new FormData()
      body.append('action', 'acv_cms_main_media'); body.append('nonce', window.acvMainLibrary.nonce); body.append('search', search.value)
      fetch(window.acvMainLibrary.ajax, { method: 'POST', credentials: 'same-origin', body: body }).then(function (r) { return r.json() }).then(function (json) {
        grid.innerHTML = ''
        if (!json || !json.success) { grid.textContent = (json && json.data && json.data.message) || 'The library could not be loaded.'; return }
        if (!json.data.length) { grid.textContent = 'Nothing found.'; return }
        json.data.forEach(function (item) {
          grid.appendChild(el('button', { type: 'button', class: 'acv-library-item', title: item.name, on: { click: function () { target.value = item.url; target.dispatchEvent(new Event('input', { bubbles: true })); close() } } }, [el('img', { src: item.url, alt: item.alt || '', loading: 'lazy' }), el('span', { text: item.name || '' })]))
        })
      })
    }
    var timer = null
    search.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(load, 300) })
    panel.appendChild(el('p', {}, [search, ' ', el('button', { type: 'button', class: 'button', text: 'Close', on: { click: close } })]))
    panel.appendChild(grid)
    overlay.appendChild(panel)
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close() })
    document.body.appendChild(overlay)
    load()
  })
  // Confirmation for destructive links (trash, delete, restore a version).
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[data-confirm]')
    if (link && !window.confirm(link.getAttribute('data-confirm'))) event.preventDefault()
  })

  /* Reorderable lists: move buttons for keyboard users, drag handle for mouse users. ------------- */
  function moveItem(list, index, delta) {
    var target = index + delta
    if (target < 0 || target >= list.length) return false
    var item = list.splice(index, 1)[0]
    list.splice(target, 0, item)
    return true
  }
  function dragHandlers(container, list, onChange) {
    var from = null
    container.addEventListener('dragstart', function (e) { var card = e.target.closest('[data-index]'); if (!card) return; from = Number(card.getAttribute('data-index')); e.dataTransfer.effectAllowed = 'move' })
    container.addEventListener('dragover', function (e) { if (from !== null) e.preventDefault() })
    container.addEventListener('drop', function (e) {
      var card = e.target.closest('[data-index]')
      if (from === null || !card) return
      e.preventDefault()
      var to = Number(card.getAttribute('data-index'))
      if (to !== from) { var item = list.splice(from, 1)[0]; list.splice(to, 0, item); onChange() }
      from = null
    })
  }
  function cardTools(label, index, count, actions) {
    var bar = el('div', { class: 'acv-card-tools' })
    bar.appendChild(el('span', { class: 'acv-drag', draggable: 'true', title: 'Drag to move', 'aria-hidden': 'true', text: '⠿' }))
    bar.appendChild(el('strong', { text: label }))
    var group = el('span', { class: 'acv-card-buttons' })
    group.appendChild(el('button', { type: 'button', class: 'button button-small', 'aria-label': 'Move ' + label + ' up', disabled: index === 0, on: { click: actions.up }, text: '↑' }))
    group.appendChild(el('button', { type: 'button', class: 'button button-small', 'aria-label': 'Move ' + label + ' down', disabled: index === count - 1, on: { click: actions.down }, text: '↓' }))
    if (actions.duplicate) group.appendChild(el('button', { type: 'button', class: 'button button-small', on: { click: actions.duplicate }, text: 'Duplicate' }))
    group.appendChild(el('button', { type: 'button', class: 'button button-small acv-danger', on: { click: actions.remove }, text: 'Delete' }))
    bar.appendChild(group)
    return bar
  }
  function field(label, input, help) {
    var id = input.id || nextId('acv-f')
    input.id = id
    return el('div', { class: 'acv-ed-field' }, [el('label', { for: id, text: label }), input, help ? el('p', { class: 'description', text: help }) : null])
  }

  /* Blog article: heading / paragraph / list / image blocks (Main's blog renderer). -------------- */
  function initBlocks(root) {
    var hidden = document.getElementById(root.getAttribute('data-target'))
    var data = {}
    try { data = JSON.parse(root.getAttribute('data-blocks') || '{}') } catch (e) { data = {} }
    var blocks = Array.isArray(data.blocks) ? data.blocks.map(function (b) { return { block_type: b.block_type, content_json: Object.assign({}, b.content_json || {}) } }) : []
    var plain = root.getAttribute('data-plain') || ''
    var notice = null
    if (!blocks.length && plain.trim()) {
      blocks = plain.split(/\n{2,}/).map(function (p) { return p.trim() }).filter(Boolean).map(function (p) { return { block_type: 'paragraph', content_json: { text: p } } })
      notice = el('p', { class: 'notice notice-info inline', text: 'This article was stored as plain text. It is shown here as paragraphs; it is converted only if you change it.' })
    }
    var dirty = false
    var touch = function () { dirty = true; hidden.value = JSON.stringify({ blocks: blocks.map(function (b, i) { return { block_type: b.block_type, content_json: b.content_json, order_index: i } }) }) }
    var labels = { heading: 'Heading', paragraph: 'Paragraph', list: 'List', image: 'Image' }

    function render() {
      root.innerHTML = ''
      if (notice) root.appendChild(notice)
      var list = el('div', { class: 'acv-blocks-list' })
      blocks.forEach(function (block, index) {
        var c = block.content_json
        var card = el('div', { class: 'acv-card', 'data-index': index })
        card.appendChild(cardTools(labels[block.block_type] || block.block_type, index, blocks.length, {
          up: function () { if (moveItem(blocks, index, -1)) { touch(); render() } },
          down: function () { if (moveItem(blocks, index, 1)) { touch(); render() } },
          duplicate: function () { blocks.splice(index + 1, 0, JSON.parse(JSON.stringify(block))); touch(); render() },
          remove: function () { if (window.confirm('Delete this block?')) { blocks.splice(index, 1); touch(); render() } },
        }))
        var on = function (key, transform) { return { input: function (e) { c[key] = transform ? transform(e.target.value) : e.target.value; touch() } } }
        if (block.block_type === 'heading') {
          var level = el('select', { on: { change: function (e) { c.level = Number(e.target.value); touch() } } }, [2, 3, 4].map(function (n) { var o = el('option', { value: n, text: 'Heading ' + n }); if (Number(c.level || 2) === n) o.selected = true; return o }))
          card.appendChild(field('Text', el('input', { type: 'text', value: c.text || '', on: on('text') })))
          card.appendChild(field('Level', level))
        } else if (block.block_type === 'paragraph') {
          var ta = el('textarea', { rows: 4, on: on('text') }); ta.value = c.text || ''
          card.appendChild(field('Text', ta, 'Bold, italic and links are kept: <strong>, <em>, <a href="…">.'))
        } else if (block.block_type === 'list') {
          var lt = el('textarea', { rows: 4, on: on('items', function (v) { return v.split('\n').map(function (s) { return s.trim() }).filter(Boolean) }) }); lt.value = (c.items || []).join('\n')
          card.appendChild(field('Items (one per line)', lt))
        } else if (block.block_type === 'image') {
          var src = el('input', { type: 'url', value: c.src || '', on: on('src') })
          var pick = el('button', { type: 'button', class: 'button', text: 'Choose image', on: { click: function () { pickImage(function (url, alt) { c.src = url; if (!c.alt) c.alt = alt; touch(); render() }) } } })
          card.appendChild(field('Image address', src))
          card.appendChild(pick)
          if (c.src) card.appendChild(el('img', { class: 'acv-main-thumb', src: c.src, alt: '' }))
          card.appendChild(field('Alternative text (for screen readers and Google)', el('input', { type: 'text', value: c.alt || '', on: on('alt') })))
          card.appendChild(field('Caption', el('input', { type: 'text', value: c.caption || '', on: on('caption') })))
        }
        list.appendChild(card)
      })
      dragHandlers(list, blocks, function () { touch(); render() })
      root.appendChild(list)
      var add = el('p', { class: 'acv-add-row' }, [el('span', { text: 'Add: ' })])
      Object.keys(labels).forEach(function (type) {
        add.appendChild(el('button', { type: 'button', class: 'button', text: labels[type], on: { click: function () { blocks.push({ block_type: type, content_json: type === 'heading' ? { text: '', level: 2 } : type === 'list' ? { items: [] } : type === 'image' ? { src: '', alt: '', caption: '' } : { text: '' } }); touch(); render() } } }))
      })
      root.appendChild(add)
      if (dirty) root.appendChild(el('p', { class: 'acv-unsaved', role: 'status', text: 'Unsaved changes to the article: click Save.' }))
    }
    render()
    window.addEventListener('beforeunload', function (e) { if (dirty && !root.closest('form').dataset.submitting) { e.preventDefault(); e.returnValue = '' } })
    root.closest('form').addEventListener('submit', function () { root.closest('form').dataset.submitting = '1' })
  }

  /* Page sections: the section types the Main Website draws (components/sections). -------------- */
  var ITEM = {
    badges: [['label', 'text', 'Label']],
    cards: [['title', 'text', 'Title'], ['text', 'textarea', 'Text'], ['list', 'lines', 'Points (one per line)']],
    stats: [['value', 'text', 'Number'], ['label', 'text', 'Label']],
    columns: [['heading', 'text', 'Column title'], ['text', 'textarea', 'Text'], ['list', 'lines', 'Points (one per line)']],
    faq: [['question', 'text', 'Question'], ['answer', 'textarea', 'Answer']],
    testimonials: [['name', 'text', 'Name'], ['role', 'text', 'Role'], ['quote', 'textarea', 'Quote']],
  }
  var SECTIONS = {
    hero: { label: 'Hero banner', fields: [['heading', 'text', 'Heading'], ['subheading', 'textarea', 'Subheading'], ['badges', 'repeat:badges', 'Badges']], style: ['alignment', 'buttons'] },
    // Only what each component draws (components/sections/*.jsx); other stored keys are kept as they are.
    text_block: { label: 'Text', fields: [['heading', 'text', 'Heading'], ['text', 'textarea', 'Text'], ['list', 'lines', 'Points (one per line)']], style: ['alignment', 'card'] },
    custom_rich_text: { label: 'Rich text', fields: [['heading', 'text', 'Heading'], ['text', 'textarea', 'Text (paragraphs separated by an empty line)']], style: [] },
    feature_cards: { label: 'Feature cards', fields: [['heading', 'text', 'Heading'], ['subheading', 'text', 'Subheading'], ['cards', 'repeat:cards', 'Cards']], style: ['card', 'buttons'] },
    stats_section: { label: 'Statistics', fields: [['heading', 'text', 'Heading'], ['subheading', 'text', 'Subheading'], ['stats', 'repeat:stats', 'Statistics']], style: ['card'] },
    three_column_layout: { label: 'Three columns', fields: [['heading', 'text', 'Heading'], ['subheading', 'text', 'Subheading'], ['columns', 'repeat:columns', 'Columns']], style: ['card', 'buttons'] },
    faq: { label: 'FAQ', fields: [['heading', 'text', 'Heading'], ['subheading', 'text', 'Subheading'], ['items', 'repeat:faq', 'Questions']], style: ['card'] },
    testimonial: { label: 'Testimonials', fields: [['heading', 'text', 'Heading'], ['subheading', 'text', 'Subheading'], ['items', 'repeat:testimonials', 'Testimonials']], style: ['card'] },
    courses_feed: { label: 'Live list: courses', fields: [['heading', 'text', 'Heading'], ['text', 'textarea', 'Text above the list'], ['limit', 'text', 'How many to show (number)']], style: [] },
    tools_feed: { label: 'Live list: tools', fields: [['heading', 'text', 'Heading'], ['text', 'textarea', 'Text above the list'], ['limit', 'text', 'How many to show (number)']], style: [] },
    testimonials_feed: { label: 'Live list: testimonials', fields: [['heading', 'text', 'Heading'], ['text', 'textarea', 'Text above the list'], ['limit', 'text', 'How many to show (number)']], style: [] },
    placement_feed: { label: 'Live list: placements', fields: [['heading', 'text', 'Heading'], ['text', 'textarea', 'Text above the list'], ['limit', 'text', 'How many to show (number)']], style: [] },
    company_logos_feed: { label: 'Live list: hiring partners', fields: [['heading', 'text', 'Heading'], ['text', 'textarea', 'Text above the list'], ['limit', 'text', 'How many to show (number)']], style: [] },
    success_stories_feed: { label: 'Live list: success stories', fields: [['heading', 'text', 'Heading'], ['text', 'textarea', 'Text above the list'], ['limit', 'text', 'How many to show (number)']], style: [] },
    lead_form: { label: 'Lead form', fields: [['heading', 'text', 'Heading'], ['subheading', 'text', 'Subheading'], ['text', 'textarea', 'Text'], ['form_type', 'text', 'Form type (shown in Leads)'], ['source', 'text', 'Source (shown in Leads)'], ['name_label', 'text', 'Name field label'], ['email_label', 'text', 'Email field label'], ['phone_label', 'text', 'Phone field label'], ['submit_label', 'text', 'Button text']], style: ['alignment', 'card', 'buttons'] },
  }
  var COLOR = function (key, label) { return [key, 'color', label] }
  var STYLE_GROUPS = {
    base: [['padding', 'select:none,sm,md,lg', 'Space above and below'], COLOR('background_color', 'Background colour'), COLOR('text_color', 'Text colour'), ['font_family', 'select:,inter,poppins,montserrat,lato,open_sans,system', 'Font'], ['heading_size', 'select:,sm,md,lg', 'Heading size'], ['text_size', 'select:,sm,md,lg', 'Text size'], ['heading_weight', 'select:,300,400,500,600,700,800', 'Heading weight'], ['body_weight', 'select:,300,400,500,600', 'Text weight'], ['max_width', 'text', 'Maximum width (e.g. 960px)']],
    alignment: [['alignment', 'select:left,center,right', 'Alignment']],
    card: [COLOR('card_background', 'Card background')],
    buttons: [COLOR('button_background', 'Button colour'), COLOR('button_text_color', 'Button text colour'), COLOR('button_border_color', 'Button border colour'), ['button_radius', 'text', 'Button corner radius (e.g. 12px)']],
  }

  function input(type, value, onChange) {
    if (type === 'textarea') { var t = el('textarea', { rows: 3, on: { input: function (e) { onChange(e.target.value) } } }); t.value = value || ''; return t }
    if (type === 'lines') { var l = el('textarea', { rows: 3, on: { input: function (e) { onChange(e.target.value.split('\n').map(function (s) { return s.trim() }).filter(Boolean)) } } }); l.value = (value || []).join('\n'); return l }
    if (type === 'color') {
      var wrap = el('span', { class: 'acv-color' })
      var picker = el('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#000000', on: { input: function (e) { text.value = e.target.value; onChange(e.target.value) } } })
      var text = el('input', { type: 'text', value: value || '', placeholder: 'Default', size: 9, on: { input: function (e) { onChange(e.target.value.trim()) } } })
      wrap.appendChild(picker); wrap.appendChild(text)
      return wrap
    }
    if (type.indexOf('select:') === 0) {
      var s = el('select', { on: { change: function (e) { onChange(e.target.value) } } })
      type.slice(7).split(',').forEach(function (v) { var o = el('option', { value: v, text: v === '' ? 'Default' : v.replace('_', ' ') }); if ((value || '') === v) o.selected = true; s.appendChild(o) })
      return s
    }
    return el('input', { type: 'text', value: value || '', on: { input: function (e) { onChange(e.target.value) } } })
  }

  function repeater(items, spec, onChange) {
    var box = el('div', { class: 'acv-repeat' })
    function draw() {
      box.innerHTML = ''
      items.forEach(function (item, index) {
        var row = el('div', { class: 'acv-repeat-row' })
        spec.forEach(function (s) { row.appendChild(field(s[2], input(s[1], item[s[0]], function (v) { item[s[0]] = v; onChange() }))) })
        var kept = Object.keys(item).filter(function (k) { return !spec.some(function (s) { return s[0] === k }) && item[k] !== '' && item[k] !== null })
        if (kept.length) row.appendChild(el('p', { class: 'description', text: 'Also stored, not shown on the website, kept as it is: ' + kept.map(function (k) { return k + ' “' + String(typeof item[k] === 'object' ? JSON.stringify(item[k]) : item[k]).slice(0, 60) + '”' }).join(', ') }))
        row.appendChild(el('p', {}, [
          el('button', { type: 'button', class: 'button button-small', disabled: index === 0, text: '↑', 'aria-label': 'Move up', on: { click: function () { moveItem(items, index, -1); onChange(); draw() } } }),
          el('button', { type: 'button', class: 'button button-small', disabled: index === items.length - 1, text: '↓', 'aria-label': 'Move down', on: { click: function () { moveItem(items, index, 1); onChange(); draw() } } }),
          el('button', { type: 'button', class: 'button button-small acv-danger', text: 'Remove', on: { click: function () { items.splice(index, 1); onChange(); draw() } } }),
        ]))
        box.appendChild(row)
      })
      box.appendChild(el('button', { type: 'button', class: 'button button-small', text: '+ Add', on: { click: function () { var blank = {}; spec.forEach(function (s) { blank[s[0]] = s[1] === 'lines' ? [] : '' }); items.push(blank); onChange(); draw() } } }))
    }
    draw()
    return box
  }

  var POSITION_LABELS = { top: 'At the top', after_intro: 'After the introduction', before_faq: 'Before the questions', end: 'At the end' }
  function initSections(root) {
    var positions = (root.getAttribute('data-positions') || '').split(',').filter(Boolean)
    var pageId = root.getAttribute('data-page-id')
    var ajax = root.getAttribute('data-ajax')
    var nonce = root.getAttribute('data-nonce')
    var sections = []
    try { sections = JSON.parse(root.getAttribute('data-sections') || '[]') } catch (e) { sections = [] }
    // WordPress hands empty objects over as [] — a list would silently drop named keys, so use an object.
    var asObject = function (v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {} }
    sections.forEach(function (s) { s.content_json = asObject(s.content_json); s.style_json = asObject(s.style_json); s._dirty = false })
    var orderDirty = false

    function post(fields) {
      var body = new FormData()
      body.append('action', 'acv_cms_main_section'); body.append('nonce', nonce); body.append('page_id', pageId); body.append('parent', root.getAttribute('data-parent') || 'pages')
      Object.keys(fields).forEach(function (k) { body.append(k, fields[k]) })
      return fetch(ajax, { method: 'POST', credentials: 'same-origin', body: body }).then(function (r) { return r.json() }).then(function (json) {
        if (!json || !json.success) throw new Error((json && json.data && json.data.message) || 'The Main Website did not accept the change.')
        return json.data
      })
    }
    function status(node, text, kind) { node.textContent = text; node.className = 'acv-section-status acv-section-status--' + (kind || 'info') }

    function render() {
      root.innerHTML = ''
      var list = el('div', { class: 'acv-sections-list' })
      sections.forEach(function (section, index) {
        var schema = SECTIONS[section.type]
        var c = section.content_json
        var st = section.style_json
        var card = el('div', { class: 'acv-card acv-section' + (section.visibility === false ? ' acv-section--hidden' : ''), 'data-index': index })
        var line = el('p', { class: 'acv-section-status', role: 'status' })
        var markDirty = function () { section._dirty = true; status(line, 'Unsaved changes in this section.', 'warn') }
        card.appendChild(cardTools((schema ? schema.label : section.type) + (c.heading ? ': ' + c.heading : ''), index, sections.length, {
          up: function () { if (moveItem(sections, index, -1)) { orderDirty = true; render() } },
          down: function () { if (moveItem(sections, index, 1)) { orderDirty = true; render() } },
          duplicate: section.id ? function () {
            var copy = { type: section.type, content_json: JSON.parse(JSON.stringify(c)), style_json: JSON.parse(JSON.stringify(st)), visibility: section.visibility !== false, order_index: index + 1 }
            if (positions.length) copy.position = section.position || 'end'
            post({ op: 'save', record: JSON.stringify(copy) }).then(function (saved) { saved._dirty = false; sections.splice(index + 1, 0, saved); orderDirty = true; render() }).catch(function (err) { status(line, err.message, 'error') })
          } : null,
          remove: function () {
            if (!window.confirm('Delete this section from the page?')) return
            if (!section.id) { sections.splice(index, 1); render(); return }
            post({ op: 'delete', id: section.id }).then(function () { sections.splice(index, 1); render() }).catch(function (err) { status(line, err.message, 'error') })
          },
        }))
        if (!schema) {
          card.appendChild(el('p', { class: 'description', text: 'This kind of section is kept exactly as it is. It can be moved or deleted here; its content is edited in the Main Website admin.' }))
        } else {
          var details = el('details', { open: !section.id })
          details.appendChild(el('summary', { text: 'Content' }))
          schema.fields.forEach(function (f) {
            var key = f[0], type = f[1], label = f[2]
            if (type.indexOf('repeat:') === 0) {
              if (!Array.isArray(c[key])) c[key] = []
              details.appendChild(el('div', { class: 'acv-ed-field' }, [el('strong', { text: label }), repeater(c[key], ITEM[type.slice(7)], markDirty)]))
            } else {
              details.appendChild(field(label, input(type, c[key], function (v) { c[key] = v; markDirty() })))
            }
          })
          var known = schema.fields.map(function (f) { return f[0] }).concat(['mobile_hidden', 'desktop_hidden'])
          var extra = Object.keys(c).filter(function (k) { return known.indexOf(k) < 0 && c[k] !== '' && c[k] !== null })
          if (extra.length) details.appendChild(el('p', { class: 'description', text: 'Also stored in this section, not shown on the website, kept as it is: ' + extra.join(', ') + '.' }))
          card.appendChild(details)
          var design = el('details')
          design.appendChild(el('summary', { text: 'Design and devices' }))
          ;['base'].concat(schema.style).forEach(function (group) {
            STYLE_GROUPS[group].forEach(function (f) { design.appendChild(field(f[2], input(f[1], st[f[0]], function (v) { if (v === '' || v === null) delete st[f[0]]; else st[f[0]] = v; markDirty() }))) })
          })
          if (positions.length) {
            var where = el('select', { on: { change: function (e) { section.position = e.target.value; markDirty() } } })
            positions.forEach(function (p) { var o = el('option', { value: p, text: POSITION_LABELS[p] || p }); if ((section.position || 'end') === p) o.selected = true; where.appendChild(o) })
            design.appendChild(el('div', { class: 'acv-ed-field' }, [el('label', { text: 'Where on the page' }), where]))
          }
          design.appendChild(el('label', {}, [el('input', { type: 'checkbox', checked: !!c.mobile_hidden, on: { change: function (e) { if (e.target.checked) c.mobile_hidden = true; else delete c.mobile_hidden; markDirty() } } }), ' Hide on phones']))
          design.appendChild(el('label', {}, [el('input', { type: 'checkbox', checked: !!c.desktop_hidden, on: { change: function (e) { if (e.target.checked) c.desktop_hidden = true; else delete c.desktop_hidden; markDirty() } } }), ' Hide on tablets and computers']))
          card.appendChild(design)
          card.appendChild(el('label', {}, [el('input', { type: 'checkbox', checked: section.visibility !== false, on: { change: function (e) { section.visibility = e.target.checked; markDirty() } } }), ' Show this section']))
          card.appendChild(el('p', {}, [el('button', { type: 'button', class: 'button button-primary', text: 'Save section', on: { click: function () {
            status(line, 'Saving…')
            var record = { type: section.type, content_json: c, style_json: st, visibility: section.visibility !== false, order_index: index }
            if (positions.length) record.position = section.position || 'end'
            post({ op: 'save', id: section.id || '', record: JSON.stringify(record) }).then(function (saved) {
              section.id = saved.id; section._dirty = false
              status(line, 'Saved. The Main Website shows it within a minute' + (document.querySelector('.notice-info') ? ' in this draft.' : '.'), 'ok')
            }).catch(function (err) { status(line, err.message, 'error') })
          } } })]))
        }
        card.appendChild(line)
        list.appendChild(card)
      })
      dragHandlers(list, sections, function () { orderDirty = true; render() })
      root.appendChild(list)
      if (orderDirty) {
        var orderLine = el('p', { class: 'acv-unsaved', role: 'status', text: 'The order changed. ' })
        orderLine.appendChild(el('button', { type: 'button', class: 'button button-primary', text: 'Save order', on: { click: function () {
          post({ op: 'reorder', ids: JSON.stringify(sections.filter(function (s) { return s.id }).map(function (s) { return s.id })) }).then(function () { orderDirty = false; render() }).catch(function (err) { orderLine.textContent = err.message })
        } } }))
        root.appendChild(orderLine)
      }
      var picker = el('select', { 'aria-label': 'Section type' }, Object.keys(SECTIONS).map(function (type) { return el('option', { value: type, text: SECTIONS[type].label }) }))
      root.appendChild(el('p', { class: 'acv-add-row' }, [el('span', { text: 'Add a section: ' }), picker, el('button', { type: 'button', class: 'button', text: 'Add', on: { click: function () {
        sections.push({ type: picker.value, content_json: {}, style_json: {}, visibility: true, _dirty: true })
        render()
      } } })]))
    }
    render()
    window.addEventListener('beforeunload', function (e) { if (orderDirty || sections.some(function (s) { return s._dirty })) { e.preventDefault(); e.returnValue = '' } })
  }

  /* Device preview ----------------------------------------------------------------------------- */
  function initPreview(toolbar) {
    var frame = document.getElementById('acv-preview-frame')
    toolbar.addEventListener('click', function (e) {
      var button = e.target.closest('button[data-width]')
      if (!button) return
      frame.style.width = button.getAttribute('data-width') + 'px'
      toolbar.querySelectorAll('button[data-width]').forEach(function (b) { b.classList.toggle('button-primary', b === button) })
    })
  }

  /* Structured lists and settings (social links, labels, homepage lists) ------------------------- */
  // Edits the keys that exist (plus the field's template keys) in place; values that are not plain
  // text, numbers or switches are listed as kept. Nothing is sent until something changes, so an
  // untouched form leaves the stored value exactly as it is.
  var LONG_KEYS = ['description', 'answer', 'body', 'text', 'testimonial', 'quote', 'subtitle', 'subheading', 'content']
  function humanKey(key) { return key.replace(/_/g, ' ').replace(/^./, function (c) { return c.toUpperCase() }) }
  function scalarInput(key, value, onChange) {
    if (typeof value === 'boolean') {
      return el('label', {}, [el('input', { type: 'checkbox', checked: value, on: { change: function (e) { onChange(e.target.checked) } } }), ' ' + humanKey(key)])
    }
    var id = nextId('acv-json')
    var long = LONG_KEYS.indexOf(key) >= 0 || (typeof value === 'string' && value.length > 90)
    var input = el(long ? 'textarea' : 'input', long ? { id: id, rows: 3 } : { id: id, type: typeof value === 'number' ? 'number' : 'text' })
    input.value = value === null || value === undefined ? '' : String(value)
    input.addEventListener('input', function () { onChange(typeof value === 'number' && input.value !== '' ? Number(input.value) : input.value) })
    return el('div', { class: 'acv-ed-field' }, [el('label', { for: id, text: humanKey(key) }), input])
  }
  var isScalar = function (v) { return v === null || v === undefined || ['string', 'number', 'boolean'].indexOf(typeof v) >= 0 }
  var isLines = function (v) { return Array.isArray(v) && v.every(function (x) { return typeof x === 'string' }) }
  function linesInput(label, lines, onChange) {
    var id = nextId('acv-json')
    var input = el('textarea', { id: id, rows: Math.min(14, Math.max(3, lines.length + 1)) })
    input.value = lines.join('\n')
    input.addEventListener('input', function () { onChange(input.value.split('\n').map(function (l) { return l.trim() }).filter(Boolean)) })
    return el('div', { class: 'acv-ed-field' }, [el('label', { for: id, text: label + ' (one per line)' }), input])
  }

  function initJson(root) {
    var target = document.getElementById(root.getAttribute('data-target'))
    var shape = root.getAttribute('data-shape') || 'array'
    var template = {}
    try { template = JSON.parse(root.getAttribute('data-template') || '{}') || {} } catch (e) { template = {} }
    var value = null
    try { value = JSON.parse(root.getAttribute('data-value') || 'null') } catch (e) { value = null }
    var hint = root.getAttribute('data-hint')
    var touch = function () {
      var out = data
      if (shape === 'strings') {
        out = data
      } else if (shape === 'array') {
        // Rows left completely empty are dropped.
        out = data.filter(function (item) { return Object.keys(item).some(function (k) { var v = item[k]; return isLines(v) ? v.length > 0 : !isScalar(v) || (v !== '' && v !== null && v !== undefined) }) })
      } else {
        out = {}
        Object.keys(data).forEach(function (k) { if (data[k] !== '' && data[k] !== null && data[k] !== undefined) out[k] = data[k] })
      }
      target.value = JSON.stringify(out)
    }
    var data
    if (shape === 'strings') data = isLines(value) ? value.slice() : []
    else if (shape === 'array') data = Array.isArray(value) ? value.map(function (item) { return item && typeof item === 'object' && !Array.isArray(item) ? item : { value: item } }) : []
    else data = value && typeof value === 'object' && !Array.isArray(value) ? value : {}

    function keysOf(item) {
      var keys = Object.keys(template)
      Object.keys(item).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k) })
      return keys
    }
    function objectFields(obj, container) {
      var kept = []
      keysOf(obj).forEach(function (key) {
        var current = key in obj ? obj[key] : (template[key] !== undefined ? template[key] : '')
        if (isLines(current)) { container.appendChild(linesInput(humanKey(key), current, function (v) { obj[key] = v; touch() })); return }
        if (!isScalar(current)) { kept.push(humanKey(key)); return }
        container.appendChild(scalarInput(key, current, function (v) { obj[key] = v; touch() }))
      })
      if (kept.length) container.appendChild(el('p', { class: 'description', text: 'Also stored here and kept as it is: ' + kept.join(', ') + '.' }))
    }
    function render() {
      root.innerHTML = ''
      if (hint) root.appendChild(el('p', { class: 'description', text: hint }))
      if (shape === 'strings') {
        root.appendChild(linesInput('Items', data, function (v) { data = v; touch() }))
        return
      }
      if (shape !== 'array') {
        var box = el('div', { class: 'acv-card' })
        objectFields(data, box)
        root.appendChild(box)
        return
      }
      data.forEach(function (item, index) {
        var card = el('div', { class: 'acv-card', 'data-index': index })
        card.appendChild(cardTools('Item ' + (index + 1), index, data.length, {
          up: function () { if (moveItem(data, index, -1)) { touch(); render() } },
          down: function () { if (moveItem(data, index, 1)) { touch(); render() } },
          remove: function () { data.splice(index, 1); touch(); render() },
        }))
        objectFields(item, card)
        root.appendChild(card)
      })
      root.appendChild(el('p', {}, [el('button', { type: 'button', class: 'button', text: '+ Add', on: { click: function () {
        var blank = {}
        keysOf(data[0] || {}).forEach(function (k) { var sample = data[0] ? data[0][k] : template[k]; blank[k] = typeof sample === 'boolean' ? true : typeof sample === 'number' ? 0 : isLines(sample) ? [] : isScalar(sample) ? '' : sample })
        data.push(blank); touch(); render()
      } } })]))
    }
    render()
  }

  // A colour picker fills the colour's text field; the field stays empty (website default) until used.
  document.addEventListener('input', function (event) {
    var pick = event.target.closest('.acv-color-pick')
    if (!pick) return
    var input = document.getElementById(pick.getAttribute('data-target'))
    if (input) input.value = pick.value
  })

  document.addEventListener('DOMContentLoaded', function () {
    var blocks = document.getElementById('acv-blocks'); if (blocks) initBlocks(blocks)
    var sections = document.getElementById('acv-sections'); if (sections) initSections(sections)
    var toolbar = document.querySelector('.acv-preview-toolbar'); if (toolbar) initPreview(toolbar)
    document.querySelectorAll('.acv-json').forEach(initJson)
  })
})()
