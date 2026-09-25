// src/utils/banglaShaping/shapeTree.ts
//
// Generic version of the pattern used in invoiceTextFields.ts. Instead of
// hand-writing a parallel `Shaped<Doc>Fields` interface and a manual
// Promise.all list for every single PDF document (as invoiceTextFields.ts
// does for the invoice), shapeTree() walks ANY nested object/array and
// shapes every BnFieldSpec leaf it finds, in parallel, preserving the same
// shape. This is the recommended way to wire up new documents
// (CenterSummaryPdfDocument, CustomerStatementPdfDocument, etc.) — it's
// much less code than the invoice's approach.
//
// Usage in a new PDF document component:
//
//   import { bn } from "../utils/banglaShaping/shapeTree";
//   import { shapeTree } from "../utils/banglaShaping/shapeTree";
//
//   function buildFields(data: MyReportData) {
//     return {
//       title: bn("কেন্দ্রীয় আর্থিক সারাংশ", "anekBanglaBold", 14),
//       rows: data.rows.map((r) => ({
//         name: bn(r.serviceName, "kalpurush", 8),
//         total: bn(moneyBn(r.total), "kalpurush", 8),
//       })),
//     };
//   }
//
//   // before building the <Document> element:
//   const fields = buildFields(data);
//   const shaped = await shapeTree(fields);
//   // shaped.title -> ShapedRun, shaped.rows[i].name -> ShapedRun, etc.
//   // TypeScript infers this automatically — no extra types to write.

import { fixBanglaText } from "../banglaLayout";
import { shapeRun, type ShapedRun } from "./shapeRun";
import { BN_FONT_URLS, type BnFieldSpec, type BnFont } from "./invoiceTextFields";

/** Build a single shape-able field. Applies canonical Unicode normalization. */
export function bn(
  text: string | number | null | undefined,
  font: BnFont,
  size: number
): BnFieldSpec {
  return { text: fixBanglaText(text ?? ""), font, size };
}

// A tree of fields: a single spec, undefined (for conditional fields),
// an array of trees, or an object whose values are trees.
export type BnFieldTree =
  | BnFieldSpec
  | undefined
  | BnFieldTree[]
  | { [key: string]: BnFieldTree };

// Mirrors BnFieldTree's shape but with ShapedRun in place of BnFieldSpec —
// TypeScript works this out automatically for whatever tree you pass in.
export type Shaped<T> = T extends BnFieldSpec
  ? ShapedRun
  : T extends undefined
  ? undefined
  : T extends Array<infer U>
  ? Array<Shaped<U>>
  : T extends object
  ? { [K in keyof T]: Shaped<T[K]> }
  : T;

function isFieldSpec(x: any): x is BnFieldSpec {
  return (
    x &&
    typeof x === "object" &&
    typeof x.text === "string" &&
    typeof x.font === "string" &&
    typeof x.size === "number"
  );
}

async function shapeNode(node: any): Promise<any> {
  if (node === undefined || node === null) return undefined;

  if (isFieldSpec(node)) {
    const fontUrl = BN_FONT_URLS[node.font as keyof typeof BN_FONT_URLS];
    return shapeRun(node.text, fontUrl, node.size);
  }

  if (Array.isArray(node)) {
    return Promise.all(node.map((item) => shapeNode(item)));
  }

  if (typeof node === "object") {
    const entries = Object.entries(node);
    const shapedEntries = await Promise.all(
      entries.map(async ([key, value]) => [key, await shapeNode(value)] as const)
    );
    return Object.fromEntries(shapedEntries);
  }

  // Anything else (numbers, booleans, strings that aren't BnFieldSpecs) is
  // passed through untouched — lets a tree mix shaped and unshaped data.
  return node;
}

/**
 * Shapes every BnFieldSpec leaf in `tree`, in parallel, preserving the
 * exact same nested shape (objects stay objects, arrays stay arrays).
 * Call this BEFORE constructing your <Document> element.
 */
export async function shapeTree<T extends BnFieldTree>(tree: T): Promise<Shaped<T>> {
  return shapeNode(tree);
}
