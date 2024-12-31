---
title: Note
sidebar_position: 1
---

Use the `Note` component to display small, styled text for additional context or information

## Default usage

<DocTab>
<div slot='preview'>
    <Note>
        This is a note for additional context.
    </Note>
</div>

```markdown
<Note>
    This is a note for additional context.
</Note>
```
</DocTab>

### Custom styling

<DocTab>
<div slot='preview'>
    <Note class="text-negative">
        This is a custom-styled note.
    </Note>
</div>

```markdown
<Note class="text-negative">
    This is a custom-styled note.
</Note>
```
</DocTab>

## Options

<PropListing 
    name="class"
>

Pass custom classes to style the note. Supports [Tailwind classes](https://tailwindcss.com).
</PropListing>
