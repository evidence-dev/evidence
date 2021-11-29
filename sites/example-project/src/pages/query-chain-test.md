<script>
    let vvv = 129
    </script>

```qone
select 135 as num, "A" as string
```

```qtwo
select num, string from ${qone}
```

```qthree
select * from ${qtwo}
```