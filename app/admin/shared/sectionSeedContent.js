// Starter content so a freshly added block never previews as a totally blank section.
export function defaultSeedContent(type) {
  switch (type) {
    case 'hero':
      return { heading: 'New heading', subheading: 'Supporting subheading text.', buttons: [] }
    case 'text_block':
    case 'custom_rich_text':
      return { heading: 'Section heading', text: 'Write your content here.' }
    case 'image_block':
      return { src: '', alt: 'Description of the image' }
    case 'video_block':
      return { embed_url: '' }
    case 'two_column_layout':
      return { heading: 'Section heading', text: 'Supporting paragraph text.', src: '', alt: '' }
    case 'three_column_layout':
      return { heading: 'Section heading', columns: [{ title: 'Column title', text: 'Column text' }] }
    case 'feature_cards':
      return { heading: 'Why choose us', subheading: '', cards: [{ title: 'Feature title', text: 'Feature description' }] }
    case 'stats_section':
      return { heading: 'By the numbers', subheading: '', stats: [{ label: 'Metric', value: '100+' }] }
    case 'testimonial':
      return { heading: 'What learners say', subheading: '', items: [{ name: 'Student name', role: 'Course, Batch', quote: 'Testimonial text.' }] }
    case 'faq':
      return { heading: 'Frequently asked questions', subheading: '', items: [{ question: 'Question?', answer: 'Answer.' }] }
    case 'gallery':
      return { heading: 'Gallery', items: [] }
    case 'cta_banner':
      return { heading: 'Ready to get started?', text: '', button: { label: 'Talk to Admissions', href: '/contact' } }
    case 'pricing':
      return { heading: 'Pricing', plans: [{ name: 'Plan', price: '', period: '', description: '', features: [] }] }
    case 'team':
      return { heading: 'Our team', members: [{ name: 'Name', role: 'Role', bio: '' }] }
    case 'map':
      return { heading: 'Find us', embed_url: '', address: '' }
    case 'lead_form':
      return { heading: 'Get in touch' }
    case 'form_embed':
      return { heading: 'Contact us', form_id: '' }
    case 'location_explorer':
      return {}
    case 'interactive_learner_map':
      return { heading: 'Where our learners are', height: 520, initialZoom: 4, mapStyle: 'blue', showSearch: true, showGrowth: true }
    default:
      return { heading: '', limit: 6 }
  }
}
