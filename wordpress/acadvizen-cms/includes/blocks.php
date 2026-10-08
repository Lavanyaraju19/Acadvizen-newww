<?php
/**
 * Converts a blog's editor HTML into the plain structured blocks the Main Website's blog
 * renderer already understands (heading / paragraph / list / quote / image / video).
 *
 * The Main Website never receives raw HTML: every block carries plain text or a URL, which
 * the Main Website renders as escaped text. Shortcodes and content filters from other
 * plugins are intentionally NOT run, so nothing Enrollment-specific leaks into the output.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const MAX_BLOCKS      = 400;
const MAX_TEXT_LENGTH = 10000;

function content_to_blocks( string $html ): array {
	$html = trim( wpautop( strip_shortcodes( $html ) ) );
	if ( '' === $html || ! class_exists( '\\DOMDocument' ) ) {
		return array();
	}

	$document = new \DOMDocument();
	$previous = libxml_use_internal_errors( true );
	$document->loadHTML( '<?xml encoding="utf-8" ?><div id="acv-root">' . $html . '</div>', LIBXML_NONET );
	libxml_clear_errors();
	libxml_use_internal_errors( $previous );

	$root = $document->getElementById( 'acv-root' );
	if ( ! $root ) {
		return array();
	}

	$blocks = array();
	collect_blocks( $root, $blocks );
	return array_slice( $blocks, 0, MAX_BLOCKS );
}

function collect_blocks( \DOMNode $parent, array &$blocks ): void {
	foreach ( $parent->childNodes as $node ) {
		if ( count( $blocks ) >= MAX_BLOCKS ) {
			return;
		}

		if ( XML_TEXT_NODE === $node->nodeType ) {
			push_paragraph( $blocks, $node->textContent );
			continue;
		}
		if ( XML_ELEMENT_NODE !== $node->nodeType ) {
			continue;
		}

		$tag = strtolower( $node->nodeName );
		switch ( $tag ) {
			case 'h1':
			case 'h2':
			case 'h3':
			case 'h4':
			case 'h5':
			case 'h6':
				$text = clean_text( $node->textContent );
				if ( '' !== $text ) {
					$level    = max( 2, min( 4, (int) substr( $tag, 1 ) ) );
					$blocks[] = array(
						'block_type'   => 'heading',
						'content_json' => array( 'text' => $text, 'level' => $level ),
					);
				}
				break;

			case 'ul':
			case 'ol':
				$items = array();
				foreach ( $node->childNodes as $item ) {
					if ( XML_ELEMENT_NODE === $item->nodeType && 'li' === strtolower( $item->nodeName ) ) {
						$text = clean_text( $item->textContent );
						if ( '' !== $text ) {
							$items[] = $text;
						}
					}
				}
				if ( $items ) {
					$blocks[] = array(
						'block_type'   => 'list',
						'content_json' => array( 'items' => $items ),
					);
				}
				break;

			case 'blockquote':
				$cite   = $node->getElementsByTagName( 'cite' )->item( 0 );
				$author = $cite ? clean_text( $cite->textContent ) : '';
				if ( $cite ) {
					$cite->parentNode->removeChild( $cite );
				}
				$text = clean_text( $node->textContent );
				if ( '' !== $text ) {
					$blocks[] = array(
						'block_type'   => 'quote',
						'content_json' => array_filter( array( 'text' => $text, 'author' => $author ) ),
					);
				}
				break;

			case 'figure':
				$image   = $node->getElementsByTagName( 'img' )->item( 0 );
				$caption = $node->getElementsByTagName( 'figcaption' )->item( 0 );
				if ( $image ) {
					push_image( $blocks, $image, $caption ? clean_text( $caption->textContent ) : '' );
				} else {
					push_embed( $blocks, $node );
				}
				break;

			case 'img':
				push_image( $blocks, $node, '' );
				break;

			case 'iframe':
				push_embed( $blocks, $node );
				break;

			case 'p':
				// wpautop() can wrap images and embeds in a paragraph; they become their own
				// blocks after the paragraph text.
				$media = array();
				foreach ( array( 'img', 'iframe' ) as $media_tag ) {
					foreach ( $node->getElementsByTagName( $media_tag ) as $element ) {
						$media[] = $element;
					}
				}
				foreach ( $media as $element ) {
					$element->parentNode->removeChild( $element );
				}
				push_paragraph( $blocks, text_with_line_breaks( $node ) );
				foreach ( $media as $element ) {
					if ( 'img' === strtolower( $element->nodeName ) ) {
						push_image( $blocks, $element, '' );
					} else {
						push_embed( $blocks, $element );
					}
				}
				break;

			case 'div':
			case 'section':
			case 'article':
			case 'main':
			case 'header':
			case 'footer':
			case 'aside':
				collect_blocks( $node, $blocks );
				break;

			case 'script':
			case 'style':
			case 'noscript':
			case 'template':
			case 'form':
			case 'hr':
			case 'br':
				break;

			default:
				push_paragraph( $blocks, text_with_line_breaks( $node ) );
		}
	}
}

function clean_text( string $text ): string {
	$text = html_entity_decode( $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	$text = preg_replace( '/[ \t\x{00A0}]+/u', ' ', $text );
	$text = preg_replace( '/\s*\n\s*/', "\n", (string) $text );
	return mb_substr( trim( (string) $text ), 0, MAX_TEXT_LENGTH );
}

/**
 * Paragraph text with <br> preserved as newlines (the Main renderer keeps line breaks).
 */
function text_with_line_breaks( \DOMNode $node ): string {
	$skipped = array( 'script', 'style', 'noscript', 'template', 'iframe', 'object', 'embed', 'form' );
	$text    = '';
	foreach ( $node->childNodes as $child ) {
		$tag = XML_ELEMENT_NODE === $child->nodeType ? strtolower( $child->nodeName ) : '';
		if ( in_array( $tag, $skipped, true ) ) {
			continue;
		}
		if ( 'br' === $tag ) {
			$text .= "\n";
		} elseif ( '' !== $tag ) {
			$text .= text_with_line_breaks( $child );
		} else {
			$text .= str_replace( "\n", ' ', $child->textContent );
		}
	}
	return $text;
}

function push_paragraph( array &$blocks, string $text ): void {
	$text = clean_text( $text );
	if ( '' !== $text ) {
		$blocks[] = array(
			'block_type'   => 'paragraph',
			'content_json' => array( 'text' => $text ),
		);
	}
}

function push_image( array &$blocks, \DOMElement $image, string $caption ): void {
	$src = esc_url_raw( (string) $image->getAttribute( 'src' ), array( 'http', 'https' ) );
	if ( '' === $src ) {
		return;
	}
	$blocks[] = array(
		'block_type'   => 'image',
		'content_json' => array_filter(
			array(
				'src'     => $src,
				'alt'     => clean_text( (string) $image->getAttribute( 'alt' ) ),
				'caption' => $caption,
			)
		),
	);
}

/**
 * Only YouTube / Vimeo embeds are passed through (as an embed URL, never as HTML).
 */
function push_embed( array &$blocks, \DOMElement $node ): void {
	$frame = 'iframe' === strtolower( $node->nodeName ) ? $node : $node->getElementsByTagName( 'iframe' )->item( 0 );
	if ( ! $frame ) {
		push_paragraph( $blocks, text_with_line_breaks( $node ) );
		return;
	}
	$src = esc_url_raw( (string) $frame->getAttribute( 'src' ), array( 'https' ) );
	if ( preg_match( '#^https://(www\.)?(youtube\.com/embed/|youtube-nocookie\.com/embed/|player\.vimeo\.com/video/)#i', $src ) ) {
		$blocks[] = array(
			'block_type'   => 'video',
			'content_json' => array_filter(
				array(
					'embed_url' => $src,
					'title'     => clean_text( (string) $frame->getAttribute( 'title' ) ),
				)
			),
		);
	}
}
