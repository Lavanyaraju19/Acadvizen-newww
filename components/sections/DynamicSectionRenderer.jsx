import CtaBannerSection from './CtaBannerSection'
import FaqSection from './FaqSection'
import FeatureCardsSection from './FeatureCardsSection'
import GallerySection from './GallerySection'
import HeroSection from './HeroSection'
import ImageSection from './ImageSection'
import DataFeedSection from './DataFeedSection'
import LeadFormSection from './LeadFormSection'
import RichTextSection from './RichTextSection'
import StatsSection from './StatsSection'
import TestimonialSection from './TestimonialSection'
import TextSection from './TextSection'
import ThreeColumnSection from './ThreeColumnSection'
import TwoColumnSection from './TwoColumnSection'
import VideoSection from './VideoSection'

const SECTION_COMPONENTS = {
  hero: HeroSection,
  text_block: TextSection,
  image_block: ImageSection,
  video_block: VideoSection,
  two_column_layout: TwoColumnSection,
  three_column_layout: ThreeColumnSection,
  testimonial: TestimonialSection,
  faq: FaqSection,
  gallery: GallerySection,
  cta_banner: CtaBannerSection,
  stats_section: StatsSection,
  feature_cards: FeatureCardsSection,
  custom_rich_text: RichTextSection,
  testimonials_feed: DataFeedSection,
  placement_feed: DataFeedSection,
  recruiters_feed: DataFeedSection,
  instructors_feed: DataFeedSection,
  certifications_feed: DataFeedSection,
  success_stories_feed: DataFeedSection,
  metrics_counters: DataFeedSection,
  trust_badges_feed: DataFeedSection,
  community_events_feed: DataFeedSection,
  cta_block_ref: DataFeedSection,
  lead_form: LeadFormSection,
}

function normalizeType(type) {
  return String(type || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

export default function DynamicSectionRenderer({ section }) {
  const normalizedType = normalizeType(section?.type)
  const Component = SECTION_COMPONENTS[normalizedType]
  if (!Component) return null
  return <Component section={section} />
}

export function renderDynamicSections(sections = []) {
  return sections
    .filter((section) => section?.visibility !== false)
    .sort((a, b) => Number(a?.order_index || 0) - Number(b?.order_index || 0))
    .map((section) => (
      <DynamicSectionRenderer key={section.id || `${section.type}-${section.order_index}`} section={section} />
    ))
}
