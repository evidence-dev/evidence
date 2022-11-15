# Basic example of `<CodeBlock>`

<script>
    const jsSnip = `
function helloWorld() {
    console.log("Hello World")
}
`
    const pySnip = `
def hello_world():
    print("Hello World!")
`

    const recursion = `
<CodeBlock
    source={\`
function helloWorld() {
    console.log("Hello World")
}
    \`}
    showLineNumbers
    language="javascript"
/>`
</script>
## Javascript
<CodeBlock
    source={jsSnip}
    showLineNumbers
    language="javascript"
/>

## Python
<CodeBlock
    source={pySnip}
    showLineNumbers
    language="python"
/>

## Example Usage
<CodeBlock
    source={recursion}
    showLineNumbers
    language="html"/>