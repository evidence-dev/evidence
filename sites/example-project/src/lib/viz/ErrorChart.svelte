<script>
    export let error;
    export let chartType;
</script>

<div width=100% class="error">
    <div class="chart-type">{chartType}</div>
    <div class="message">{error}</div>
</div>

<style>
    .error{
        justify-content: center;
        align-items: center;
        text-align: center;
        background-color: #fdf1f1;
        border-radius: 4px;
        padding-left: 30px;
        padding-right: 30px;
        padding-top: 20px;
        height: 150px;
        margin-top: 20px;
        margin-bottom: 20px;
        font-family: var(--ui-font-family);
        font-weight: normal;
        color: rgb(112, 111, 111);
        border: 1px solid #f8e9e9;
        font-size: 0.8rem;
    }

    .chart-type{
        font-weight: bold;
        text-align: center;
        float: center;
        font-size: 1.2rem;
        padding-top:8%;
    }

    .message{
        text-align: center;
        padding-left: 30px;
        padding-right: 30px;
    }
</style>