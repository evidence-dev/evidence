
 // Get array of global color variables (set in app.css):

 export default function getColorPalette(i) {
 let colorPalette = Array.from(document.styleSheets)
  .filter(
    sheet =>
      sheet.href === null || sheet.href.startsWith(window.location.origin)
  )
  .reduce(
    (acc, sheet) =>
      (acc = [
        ...acc,
        ...Array.from(sheet.cssRules).reduce(
          (def, rule) =>
            (def =
              rule.selectorText === ":root"
                ? [
                    ...def,
                    ...Array.from(rule.style).filter(name =>
                      name.startsWith("--")
                    )
                  ]
                : def),
          []
        )
      ]),
    []
  );

  if(i != undefined){
    return colorPalette[i];
  } else {
    return colorPalette;
  }
    }