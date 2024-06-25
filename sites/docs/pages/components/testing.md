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
  <Column id=id num=1/>
  <Column id=last_name num=2/>
  <Column id=item num=3/>
  <Column id=category num=4/>
  <Column id={inputs.Dimension} num=5/>
</DataTable>



