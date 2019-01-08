// adds uids to paragraphs and spans
module.exports = document => {
  for (let selector of ["p", "h1", "h2", "h3", "h4", "h5", "h6"]) {
    let nodes = document.querySelectorAll(selector);
    let counter = 0;
    for (let node of nodes) {
      node.id = `${selector}-${(counter++).toString()}`;
    }
  }
};
