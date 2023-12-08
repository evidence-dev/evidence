---
title: Modal
sidebar_position: 30
---

<img src="/img/modal.png" alt="modal" width="600"/>

```markdown
<Modal title="Title" buttonText='Open Modal'> 

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 

</Modal>
```

## Styling

Modals support markdown in the body, but you need to leave whitespace between the text and the modal tags. 

```markdown
<Modal title="Title" buttonText='Open Modal'>

**bold** and _italic_ text is supported.

</Modal>
```

## Options

| Name       | Description | Required? | Options | Default|
| ---------- | ----------- | --------- |---------| -------|
| title      | The title of the modal. | No | -| -
| buttonText | The text displayed on the button that triggers the modal. | Yes | - 
| open       | A boolean value that determines whether the modal is closed by default. | No | true, false | false

