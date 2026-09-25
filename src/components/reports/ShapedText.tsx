// src/components/reports/ShapedText.tsx
//
// Drop-in replacement for react-pdf's <Text>, for a string already shaped
// via shapeRun()/shapeInvoiceTextFields(). Renders glyph outlines as
// <Path>s inside an <Svg>, so it does a little style translation that
// plain <Text> doesn't need:
//
// - `color`      -> used as the SVG fill (unless the `fill` prop is given)
// - `textAlign`  -> converted to `alignItems` on the wrapping <View>,
//                   since textAlign has no effect on a View/Svg in react-pdf
// - layout props (width, margin*, padding*, border*, backgroundColor, etc.)
//   are passed through to the wrapping <View> untouched, so existing
//   react-pdf style objects (e.g. the ones used with the old <Text>) can be
//   reused as-is
// - font props (fontFamily, fontSize, fontWeight, lineHeight) are dropped
//   from the View style — they only mattered for <Text> layout. The actual
//   font/size used for shaping is whatever was passed to shapeRun().

import { Svg, Path, View } from "@react-pdf/renderer";
import type { ShapedRun } from "../../utils/banglaShaping/shapeRun";

type RNStyle = Record<string, any>;

function mergeStyle(style?: RNStyle | RNStyle[]): RNStyle {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.filter(Boolean));
  return style;
}

interface ShapedTextProps {
  run: ShapedRun | null | undefined;
  style?: RNStyle | RNStyle[];
  /** Overrides style.color as the glyph fill color, if given. */
  fill?: string;
}

export function ShapedText({ run, style, fill }: ShapedTextProps) {
  if (!run) return null;

  const merged = mergeStyle(style);
  const {
    color,
    textAlign,
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    ...layoutStyle
  } = merged;

  const alignItems =
    textAlign === "right" ? "flex-end" : textAlign === "center" ? "center" : "flex-start";

  // Without this, a shaped run wider than its column (e.g. a long
  // comma-joined service list) draws past the View's boundary and visually
  // overlaps whatever sits in the next column — react-pdf's own <Text>
  // avoids this by wrapping to multiple lines, which this Svg-based
  // approach doesn't do (yet). Clipping is a safe default: it never
  // affects a box that's already exactly its content's size, and it turns
  // "garbled overlapping text" into "cleanly cut off text" for anything
  // that's actually too long for its column.
  return (
    <View style={{ ...layoutStyle, alignItems, overflow: "hidden" }}>
      <Svg width={run.width} height={run.height}>
        {run.glyphs.map((g, i) => (
          <Path key={i} d={g.d} fill={fill ?? color ?? "#000000"} transform={g.transform} />
        ))}
      </Svg>
    </View>
  );
}

interface ShapedTextWrapProps {
  /** One ShapedRun per "word"/chip (e.g. one per service name). Falsy
   * entries are skipped. */
  runs: Array<ShapedRun | null | undefined>;
  style?: RNStyle | RNStyle[];
  fill?: string;
  /** Horizontal gap between chips, in pt. Default 3. */
  gap?: number;
  /** Vertical gap between wrapped lines, in pt. Default 2. */
  lineGap?: number;
}

/**
 * Like ShapedText, but for a *list* of pre-shaped chips that should wrap
 * onto multiple lines when they don't fit the available width — e.g. a
 * comma-joined list of service names in a table cell. Instead of one big
 * <Svg> (which just overflows/gets clipped, see ShapedText above), this
 * renders each chip as its own small <Svg> inside a `flexDirection: "row",
 * flexWrap: "wrap"` container. react-pdf's underlying Yoga layout engine
 * does the actual line-wrapping — the row/cell then grows taller on its
 * own to fit however many lines that takes, no manual height math needed.
 *
 * Bake any trailing punctuation (e.g. a comma) into each chip's text
 * *before* shaping it — see buildCustomerStatementFields for an example
 * ("সেবা ১,", "সেবা ২,", "সেবা ৩") — so it wraps as part of that word
 * rather than floating alone at the start of the next line.
 */
export function ShapedTextWrap({ runs, style, fill, gap = 3, lineGap = 2 }: ShapedTextWrapProps) {
  const merged = mergeStyle(style);
  const {
    color,
    textAlign,
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    ...layoutStyle
  } = merged;

  const justifyContent = textAlign === "right" ? "flex-end" : textAlign === "center" ? "center" : "flex-start";

  const items = runs.filter((r): r is ShapedRun => Boolean(r));
  if (items.length === 0) return null;

  return (
    <View
      style={{
        ...layoutStyle,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent,
        alignItems: "flex-start",
      }}
    >
      {items.map((run, i) => (
        <Svg
          key={i}
          width={run.width}
          height={run.height}
          style={{ marginRight: gap, marginBottom: lineGap }}
        >
          {run.glyphs.map((g, j) => (
            <Path key={j} d={g.d} fill={fill ?? color ?? "#000000"} transform={g.transform} />
          ))}
        </Svg>
      ))}
    </View>
  );
}
