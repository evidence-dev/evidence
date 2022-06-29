<script>
  import "./format-grid.css";
  import { blur } from 'svelte/transition';
  import { defaultExample, formatExample } from "$lib/modules/formats";
  export let formats;
  let selectedCurrency;
</script>

<select bind:value={selectedCurrency}>
  <option name=usd id=usd value=usd>USD - United States Dollar</option>
  <option name=eur id=eur value=eur>EUR - Euro</option>
  <option name=jpy id=jpy value=jpy>JPY - Japanese Yen</option>
  <option name=gbp id=gbp value=gbp>GBP - Pound Sterling</option>
  <option name=aud id=aud value=aud>AUD - Australian Dollar</option>
  <option name=cad id=cad value=cad>CAD - Canadian Dollar</option>
  <option name=chf id=chf value=chf>CHF - Swiss Franc</option>
  <option name=cny id=cny value=cny>CNY - Renminbi</option>
  <option name=hkd id=hkd value=hkd>HKD - Hong Kong Dollar</option>
  <option name=nzd id=nzd value=nzd>NZD - New Zealand Dollar</option>
  <option name=sek id=sek value=sek>SEK - Swedish Krona</option>
  <option name=krw id=krw value=krw>KRW - South Korean Won</option>
  <option name=sgd id=sgd value=sgd>SGD - Singapore Dollar</option>
  <option name=nok id=nok value=nok>NOK - Norwegian Krone</option>
  <option name=mxn id=mxn value=mxn>MXN - Mexican Peso</option>
  <option name=inr id=inr value=inr>INR - Indian Rupee</option>
  <option name=rub id=rub value=rub>RUB - Russian Ruble</option>
  <option name=zar id=zar value=zar>ZAR - South African Rand</option>
  <option name=try id=try value=try>TRY - Turkish Lira</option>
  <option name=brl id=brl value=brl>BRL - Brazilian Real</option>
  <option name=twd id=twd value=twd>TWD - New Taiwan Dollar</option>
  <option name=dkk id=dkk value=dkk>DKK - Danish Krone</option>
  <option name=pln id=pln value=pln>PLN - Polish Złoty</option>
  <option name=thb id=thb value=thb>THB - Thai Baht</option>
  <option name=idr id=idr value=idr>IDR - Indonesian Rupiah</option>
  <option name=huf id=huf value=huf>HUF - Hungarian Forint</option>
  <option name=czk id=czk value=czk>CZK - Czech Koruna</option>
  <option name=ils id=ils value=ils>ILS - Israeli New Shekel</option>
  <option name=clp id=clp value=clp>CLP - Chilean Peso</option>
  <option name=php id=php value=php>PHP - Philippine Peso</option>
  <option name=aed id=aed value=aed>AED - Uae Dirham</option>
  <option name=cop id=cop value=cop>COP - Colombian Peso</option>
  <option name=sar id=sar value=sar>SAR - Saudi Riyal</option>
  <option name=myr id=myr value=myr>MYR - Malaysian Ringgit</option>
  <option name=ron id=ron value=ron>RON - Romanian Leu</option>
</select>

<div class="tableContainer">
<table class="formatTable" width="100%" transition:blur>
  <thead>
    <th class="align_left narrow_column">Format Tag</th>
    <th class="align_left wide_column">Format Code</th>
    <th class="align_left wide_column">Example Input</th>
    <th class="align_right wide_column">Example Output</th>
  </thead>
  {#each formats.filter(d => d.parentFormat === selectedCurrency) as format}
    <tr>
      <td transition:blur>{format.formatTag} </td>
      <td transition:blur>{format.formatCode} </td>
      <td transition:blur>
        <input
          id="id_format_row{format.formatTag}"
          placeholder={format.exampleInput || defaultExample(format.valueType)}
          bind:value={format.userInput}
          on:blur={(format.userInput = undefined)}
          class="align_left input_box"
        />
      </td>
      <td class="align_right" transition:blur>{formatExample(format)}</td>
    </tr>
  {/each}
</table>
</div>

<style>
  .formatTable {
    font-size: 12px;
  }

  .tableContainer {
    border: 1px solid var(--gray-light, #eee);
    border-radius: 4px;
    padding: 8px 4px 8px 4px;
  }

  select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;   
        padding:0.75em;
        width: 100%;
        border: 1px solid var(--grey-200); 
        font-family: var(--ui-font-family);
        color: var(--grey-800); 
        margin: 0.5em 0 1.5em 0;
        transition: all 400ms;
        cursor: pointer;
    }

        select:hover{
            border: 1px solid var(--grey-300);
            transition: all 400ms;
            box-shadow: 0 5px 5px 2px hsl(0deg 0% 97%);
    }

        select:focus {
            outline: none;

    }
</style>
