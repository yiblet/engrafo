module.exports = function(document) {
  let body = document.querySelector("body");
  let div = document.createElement("div");
  div.id = "popover";
  body.appendChild(div);
};
