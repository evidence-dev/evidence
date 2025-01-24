---
title: Modal
description: Display a pop-up dialog when a button is clicked.
sidebar_position: 1
---

<DocTab>
    <div slot='preview'>
        <Modal title="Title" buttonText='Open Modal'> 
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
        Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
        </Modal>
    </div>

```markdown
<Modal title="Title" buttonText='Open Modal'> 

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 

</Modal>
```
</DocTab>

## Styling

Modals support markdown in the body, but you need to leave whitespace between the text and the modal tags. 

<DocTab>
    <div slot='preview'>
        <Modal title="Title" buttonText='Open Modal'>

        **bold** and _italic_ text is supported.

        </Modal>
    </div>

```markdown
<Modal title="Title" buttonText='Open Modal'>

**bold** and _italic_ text is supported.

</Modal>
```
</DocTab>


## Including Components

```sql orders_by_month
select order_month, sum(sales) as sales_usd0k from needful_things.orders
group by all
```

You can include components inside a Modal, like charts or tables:

<DocTab>
    <div slot='preview'>
        <Modal title='Chart Example' buttonText='Click to See Chart'>
            <LineChart
                data={orders_by_month}
                x=order_month
                y=sales_usd0k
            />
        </Modal>
    </div>

```svelte
<Modal title='Chart Example' buttonText='Click to See Chart'>
    <LineChart
        data={orders_by_month}
        x=order_month
        y=sales_usd0k
    />
</Modal>
```
</DocTab>

## Options

<PropListing
    name=buttonText
    description="The text displayed on the button that triggers the modal."
    required
    options=string
/>
<PropListing
    name=title
    description="The title of the modal. Visible at the top of the modal when it is open"
    options=string
/>
<PropListing
    name=open
    description="A boolean value that determines whether the modal is closed by default."
    options={['true', 'false']}
    default=false
/>