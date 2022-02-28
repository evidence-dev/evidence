export default function formatTitle(column, columnFormat) {

    // Get format tag from end of column name (if supplied):
    let fmt = columnFormat;

    // Remove the format tag from the column name (only if preceded by
    // an underscore):
    let colname = column.replace("_"+fmt,"");
    let suffix = "";
    
    // Add special formatting depending on format of column name:
    switch(fmt){
        case "pct": 
            // take name exluding fmt tag (colnam)
            colname = colname
            break;
        case "usd": 
            colname = colname;
            suffix = " ($)";
            break;
        case "cad": 
            colname = colname;
            suffix = " ($)";
            break;
        case "eur": 
            colname = colname;
            suffix = " (€)";
            break;
        case "gbp": 
            colname = colname;
            suffix =  " (£)";
            break;
        case "chf": 
            colname = colname;
            suffix = " (CHF)";
            break;
        case "str":
            colname = colname;
            break;
        case "date": 
            // take name including fmt tag (column)
            colname = column;
            break;
        default: 
            colname = column;
    }

    // Allow some acronyms to remain fully capitalized in titles:
    let acronyms = [
        "id"
    ]

    // Allow some joining words to remain fully lowercased in title:
    let lowercase = [
        "of",
        "the",
        "and",
        "in"
    ]

    // Set name to proper casing:
    function toTitleCase(str) {
        return str.replace(
        /\w\S*/g,
        function(txt) {
            if(!acronyms.includes(txt) && !lowercase.includes(txt)){
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            } else if(acronyms.includes(txt)){
                return txt.toUpperCase();
            } else {
                return txt.toLowerCase();
            }
        });
    }

    // Remove all underscores before passing to title case function:
    colname = toTitleCase(colname.replace(/_/g, ' '))
    colname = colname + suffix;

    return colname;
}
  
