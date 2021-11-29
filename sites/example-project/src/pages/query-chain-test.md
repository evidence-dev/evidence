<script>
    let vvv = 129
    </script>

```qone
select {vvv} as num, "A" as string
```

```qtwo
select num, string from ${qone}
```

```qthree
select * from ${qtwo}
```