export default function getColumnUnits(columnExtents) {
    let max = columnExtents[1];
    let units;

    if(max >= 4000000000){
        units = "B"
    } else if(max >= 4000000){
        units = "M";
    } else if(max >= 4000){
        units = "k";
    } else {
        units = "";
    }

    return units;
}