import FormEmbedRenderer from '../cms/FormEmbedRenderer'
import {
  normalizeContent,
  safeString,
  sectionPaddingClass,
  sectionVisibilityClass,
} from './sectionUtils'

export default function FormEmbedSection({ section }) {
  const content = normalizeContent(section)
  if (!content.form_id) return null

  return (
    <div className={`${sectionPaddingClass(content)} ${sectionVisibilityClass(content)}`}>
      <FormEmbedRenderer
        formId={safeString(content.form_id)}
        heading={safeString(content.heading)}
        text={safeString(content.text)}
      />
    </div>
  )
}
