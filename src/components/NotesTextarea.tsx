"use client";

import { useRef } from "react";

/**
 * A plain-text notes box with light outliner conveniences:
 *  - Tab / Shift+Tab indents / outdents the current line (2 spaces).
 *  - Enter after a bullet ("- ") continues the list at the same indent;
 *    pressing Enter on an empty bullet ends the list.
 * Uncontrolled (works with a form's defaultValue + submit).
 */
export function NotesTextarea(props: {
  id?: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function apply(value: string, caret: number) {
    const ta = ref.current;
    if (!ta) return;
    ta.value = value;
    ta.selectionStart = ta.selectionEnd = caret;
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget;
    const { value, selectionStart, selectionEnd } = ta;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;

    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        // outdent: strip up to 2 leading spaces on this line
        const removed = value.slice(lineStart).match(/^ {1,2}/)?.[0].length ?? 0;
        if (removed === 0) return;
        apply(
          value.slice(0, lineStart) + value.slice(lineStart + removed),
          Math.max(lineStart, selectionStart - removed),
        );
      } else {
        // indent: 2 spaces at the line start
        apply(
          value.slice(0, lineStart) + "  " + value.slice(lineStart),
          selectionStart + 2,
        );
      }
      return;
    }

    if (e.key === "Enter" && selectionStart === selectionEnd) {
      const line = value.slice(lineStart, selectionStart);
      const m = line.match(/^(\s*)([-*])\s(.*)$/);
      if (!m) return;
      const [, indent, bullet, content] = m;
      e.preventDefault();
      if (content.trim() === "") {
        // empty bullet → end the list (clear the line)
        apply(value.slice(0, lineStart) + value.slice(selectionStart), lineStart);
      } else {
        const insert = `\n${indent}${bullet} `;
        apply(
          value.slice(0, selectionStart) + insert + value.slice(selectionStart),
          selectionStart + insert.length,
        );
      }
    }
  }

  return (
    <textarea
      ref={ref}
      id={props.id}
      name={props.name}
      rows={props.rows}
      defaultValue={props.defaultValue}
      placeholder={props.placeholder}
      onKeyDown={onKeyDown}
      className={props.className}
    />
  );
}
