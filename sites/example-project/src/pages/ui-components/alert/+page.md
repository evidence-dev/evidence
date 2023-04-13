<script>
    let sticky = false
    $: console.log(sticky)
</script>

## Alert!

<label>
    Make the alert sticky
    <input type="checkbox" bind:checked={sticky}>
</label>

<Alert {sticky}>
This is the default alert{#if sticky}; it is also sticky!{/if}
</Alert>

<Alert status="info">
This is the informational alert
</Alert>

<Alert status="success">
This is the successful alert
</Alert>

<Alert status="warning">
This is the warning alert
</Alert>

<Alert status="danger">
This is the dangerous alert
</Alert>

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas sollicitudin est nisi, et varius quam eleifend quis. Donec non pulvinar arcu. Donec vitae lacus iaculis, mollis eros at, convallis eros. Curabitur in risus nibh. Nunc placerat, est a sodales mollis, risus tellus blandit lectus, quis varius nulla nulla et dui. Phasellus diam leo, sodales quis massa at, tempor hendrerit urna. Nunc eget diam id velit varius auctor at ut felis. Suspendisse sit amet feugiat lacus. Curabitur ultrices neque in odio accumsan, at maximus lorem tincidunt. In tincidunt pretium facilisis. Pellentesque bibendum sapien nunc, et finibus magna volutpat vel.

Nulla augue nunc, mattis ut imperdiet eget, aliquet id lorem. Aenean et lectus vitae mauris efficitur accumsan. Sed fringilla arcu ullamcorper, vehicula magna ac, finibus eros. Nulla elementum imperdiet justo. In hac habitasse platea dictumst. Proin ligula risus, tristique ac fringilla ut, pretium non augue. Nullam auctor eu nibh in fringilla. Etiam varius eros vel fermentum tincidunt. Nulla nisl tortor, auctor at nulla nec, malesuada volutpat dui. Cras aliquet lorem non commodo blandit.

In sollicitudin in nisl quis iaculis. Integer nec elit a enim laoreet commodo. Curabitur blandit, libero non iaculis feugiat, sapien mauris maximus lectus, interdum porttitor ex mauris ac turpis. In varius facilisis sem id sollicitudin. Nunc a luctus ex. Praesent eros quam, ultricies eget leo sit amet, sagittis rhoncus nibh. Pellentesque efficitur enim eu erat consectetur, ut interdum quam interdum.

Integer bibendum faucibus mauris. Proin non lorem sapien. Nam lobortis leo et fringilla porta. Ut imperdiet tellus ligula, ac molestie eros imperdiet tempor. Donec quis congue leo. Vestibulum bibendum vulputate augue ac scelerisque. Maecenas a volutpat neque, et pharetra libero. Etiam ac enim molestie, ultricies sem ac, euismod elit. Etiam blandit convallis augue, ut sodales sapien venenatis at. Maecenas scelerisque, elit nec feugiat imperdiet, ipsum augue eleifend magna, vel molestie erat metus id nisl. Quisque elementum nunc a facilisis commodo.

Nunc vel mauris nulla. Nullam id ultrices nunc. Ut vel turpis fringilla, congue sem a, pellentesque metus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec scelerisque faucibus massa non bibendum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Suspendisse potenti.
