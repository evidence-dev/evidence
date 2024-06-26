```sql needful_things
select * from needful_things.orders
limit 5
```

<ButtonGroup name=Dimension>
  <ButtonGroupItem valueLabel='First Name' value='first_name' default/>
  <ButtonGroupItem valueLabel='State' value='state'/>
  <ButtonGroupItem valueLabel='Channel' value='channel'/>
</ButtonGroup>

<DataTable data={needful_things}>
  <Column id=id/>
  <Column id=last_name/>
  <Column id=item/>
  <Column id=category/>
  <Column id={inputs.Dimension}/>
</DataTable>



