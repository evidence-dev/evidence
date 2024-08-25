data = data.astype(str)
for col in data.columns:
    # Iterate through all data and stringify all columns in upper case
    data[col] = data[col].apply(lambda x: str(x))

