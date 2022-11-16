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

## List of supported languages
Language support is provided by [prismjs](https://prismjs.com/).
These languages are available for use in Evidence

### Javascript
```javascript
function helloWorld() {
    console.log("Hello World")
}
```

### HTML
```html
<div>
    Hello World
</div>
```

### CSS
```css
body {
    background-color: blue;
}
```

### SQL
```sql
SELECT 'Hello World';
```

### Python
```python
def hello_world():
    print("Hello World")
```

### Typescript
```typescript
function helloWorld(name: string): void {
    print(`Hello ${name}`)
}
```

### Java
```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World!")
    }
}
```

### Bash
```bash
echo "Hello World"
```

### C#
```csharp
{
    static void Main()
    {
        System.Console.WriteLine("Hello, World!");
    }
}
```

### PHP
```pHp
<?php
  echo 'Hello World!';
?>
```

### C
```c
#include <stdio.h>

main()
{
    printf("Hello World!\n");
}
```

### PowerShell
```powershell
'Hello World!'
```

### Go
```go
package main
import "fmt"
func main() {
 fmt.Printf("Hello World\n")
}
```

### Rust
```rust
fn main() {
    println!("Hello World!");
}
```

### Kotlin
```kotlin
fun main(args : Array<String>) {
    println("Hello, world!")
}
```

### Dart
```dart
main() {
   print('Hello world!');
}
```

### Ruby
```ruby
puts "Hello World!"
```

### R
```r
> print("Hello World!")
[1] "Hello World!"
```

### MATLAB
```matlab
disp('Hello World');
```
### DAX
```dax
Sales:=CALCULATE(FactSales[Sales], 
                 PREVIOUSQUARTER(DimDate[DateKey]))
```

### JSON
```json
{
    "hello": "world!"
}
```
### YAML
```yaml
hello:
  world: true
```

### Markdown
```markdown
# Hello World
```

### Generic Code Block
```code
Test
```