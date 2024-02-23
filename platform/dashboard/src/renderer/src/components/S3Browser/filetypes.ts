const filetypeLookup = {
  py: "Python",
  md: "Markdown",
  json: "JSON",
  txt: "Text",
  mk: "Makefile",
  Makefile: "Makefile",
  sdc: "Synopsys Design Constraint",
  v: "Verilog",
  gitignore: "Text",
  tcl: "TCL",
  cfg: "Text",
}

export function filetypeFromName(name: string) {
  const extIdx = name.lastIndexOf(".")
  if (extIdx >= 0) {
    const ext = name.slice(extIdx + 1)
    return filetypeLookup[ext] || undefined
  } else {
    // maybe we have an entry for the whole name?
    return filetypeLookup[name.slice(name.lastIndexOf("/") + 1)]
  }
}

/**
 * This is imperfect: i.e. if `filetypeLookup` has a mapping for the
 * file extension of the file with `name`, then it is viewable by
 * us, as in the `viewContent()` function knows what to do.
 */
export function hasViewableContent(name: string) {
  return !!filetypeFromName(name)
}
