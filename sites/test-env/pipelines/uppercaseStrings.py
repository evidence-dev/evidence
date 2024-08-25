# Pandas has decided that strings are objects
for col in data.select_dtypes(include=[object]):
    data[col] = data[col].str.upper()
