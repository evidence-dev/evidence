# Including Code in Your Evidence Files

## Usage
When injecting examples of code, you can simply use code blocks as normal.
Note that a language indication is required, otherwise it will be interpreted as a query.

Here are some examples:
### Valid
Javascript Code Block
```markdown
&#96;&#96;&#96;javascript
function helloWorld() {
    console.log("Hello World");
}
&#96;&#96;&#96;
```
Code Block without Syntax Highlighting
```markdown
&#96;&#96;&#96;code
function helloWorld() {
    console.log("Hello World");
}
&#96;&#96;&#96;
```


### Invalid
Does not have any language indicator
```markdown
&#96;&#96;&#96;
function helloWorld() {
    console.log("Hello World");
}
&#96;&#96;&#96;
```

## Basic Examples
Here are rendered codeblocks that with various languages

### Javascript
```javascript
function helloWorld() {
    console.log("Hello World")
}
```

### Python
```python
def hello_world():
    print("Hello World")
```

### R
```r
> print("Hello World!")
[1] "Hello World!"
```

### Generic Code Block
```code
Test
```

## List of supported languages

Language support is provided by [prismjs](https://prismjs.com/).
These languages are available for use in Evidence
 - JavaScript
 - HTML
 - CSS
 - SQL
 - Python
 - TypeScript
 - Java
 - Bash
 - C#
 - C++
 - PHP
 - C
 - PowerShell
 - Go
 - Rust
 - Kotlin
 - Dart
 - Ruby
 - Assembly
 - R
 - MATLAB
 - DAX
 - JSON
 - YAML