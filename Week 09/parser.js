const { match } = require("assert");
const css = require("css");

const EOF = Symbol("EOF");

let currentToken = null;
let currentAttribute = null;
let currentTextNode = null;

let stack = [{ type: "document", children: [] }];

let rules = [];
function addCSSRules(text) {
  const ast = css.parse(text);
  rules.push(...ast.stylesheet.rules);
}

function matchSelector(element, selector) {
  if (!selector || !element.attributes) return false;

  if (selector.charAt(0) === "#") {
    const elementId = element.attributes.find((attr) => attr.name === "id")
      ?.value;
    if (elementId === selector.replace("#", "")) {
      return true;
    }
  } else if (selector.charAt(0) === ".") {
    const elementClass = element.attributes.find(
      (attr) => attr.name === "class"
    )?.value;
    if (elementClass === selector.replace(".", "")) {
      return true;
    }
  } else if (element.tagName === selector) {
    return true;
  }
  return false;
}

function specificity(selector) {
  const p = [0, 0, 0, 0];
  const selectorParts = selector.split(" ");
  for (const part of selectorParts) {
    if (part.charAt(0) === "#") p[1] += 1;
    else if (part.charAt(0) === ".") p[2] += 1;
    else p[3] += 1;
  }
  return p;
}

function compareSpecificity(sp1, sp2) {
  if (sp1[0] - sp2[0]) return sp1[0] - sp2[0];
  if (sp1[1] - sp2[1]) return sp1[1] - sp2[1];
  if (sp1[2] - sp2[2]) return sp1[2] - sp2[2];

  return sp1[3] - sp2[3];
}

function computeCSS(element) {
  const elements = stack.slice().reverse();

  if (!element.computedStyle) element.computedStyle = {};

  for (const rule of rules) {
    const selectorParts = rule.selectors[0].split(" ").reverse();

    if (!matchSelector(element, selectorParts[0])) continue;

    let selectorIndex = 1;
    for (let i = 0; i < elements.length; i++) {
      if (matchSelector(elements[i], selectorParts[selectorIndex])) {
        selectorIndex++;
      }
    }
    if (selectorIndex >= selectorParts.length) {
      // matched
      const currentSpecificity = specificity(rule.selectors[0]);
      const computedStyle = element.computedStyle;
      for (const declaration of rule.declarations) {
        const { property, value } = declaration;
        if (!computedStyle[property]) {
          computedStyle[property] = {};
        }

        if (!computedStyle[property].specificity) {
          computedStyle[property].value = value;
          computedStyle[property].specificity = currentSpecificity;
        } else if (
          compareSpecificity(
            computedStyle[property].specificity,
            currentSpecificity
          ) < 0
        ) {
          computedStyle[property].value = value;
          computedStyle[property].specificity = currentSpecificity;
        }
      }
    }
  }
}

function emit(token) {
  let top = stack[stack.length - 1];

  if (token.type === "startTag") {
    let element = {
      type: "element",
      children: [],
      attributes: [],
    };

    element.tagName = token.tagName;

    for (const p in token) {
      if (p !== "type" && p !== "tagName") {
        element.attributes.push({
          name: p,
          value: token[p],
        });
      }
    }

    computeCSS(element);

    top.children.push(element);
    element.parent = top;

    if (!token.isSelfClosing) stack.push(element);

    currentTextNode = null;
  } else if (token.type === "endTag") {
    if (top.tagName !== token.tagName) {
      throw new Error("Tag start end mismatch");
    } else {
      if (top.tagName === "style") {
        addCSSRules(top.children[0].content);
      }
      stack.pop();
    }

    currentToken = null;
  } else if (token.type === "text") {
    if (currentTextNode === null) {
      currentTextNode = {
        type: "text",
        content: "",
      };
      top.children.push(currentTextNode);
    }
    currentTextNode.content += token.content;
  }
}

function data(c) {
  if (c === "<") {
    return tagOpen;
  } else if (c === EOF) {
    emit({
      type: "EOF",
    });
    return;
  } else {
    emit({
      type: "text",
      content: c,
    });
    return data;
  }
}

function tagOpen(c) {
  if (c === "/") {
    return endTagOpen;
  } else if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: "startTag",
      tagName: "",
    };
    return tagName(c);
  } else {
    return;
  }
}

function endTagOpen(c) {
  if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: "endTag",
      tagName: "",
    };
    return tagName(c);
  } else if (c === ">") {
  } else if (c === EOF) {
  } else {
  }
}

function tagName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (c === "/") {
    return selfClosingStartTag;
  } else if (c.match(/^[a-zA-Z]$/)) {
    currentToken.tagName += c;
    return tagName;
  } else if (c === ">") {
    emit(currentToken);
    return data;
  } else {
    return tagName;
  }
}

function beforeAttributeName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (c === "/" || c === ">" || c === EOF) {
    return afterAttributeName(c);
  } else if (c === "=") {
  } else {
    currentAttribute = {
      name: "",
      value: "",
    };
    return attributeName(c);
  }
}
function attributeName(c) {
  if (c.match(/^[\t\n\f ]$/) || c === "/" || c === ">" || c === EOF) {
    return afterAttributeName(c);
  } else if (c === "=") {
    return beforeAttributeValue;
  } else if (c === "\u0000") {
  } else if (c === '"' || c === "'" || c === "<") {
  } else {
    currentAttribute.name += c;
    return attributeName;
  }
}
function beforeAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/) || c === "/" || c === ">" || c === EOF) {
    return beforeAttributeValue;
  } else if (c === '"') {
    return doubleQuotedAttributeValue;
  } else if (c === "'") {
    return singleQuotedAttributeValue;
  } else if (c === ">") {
  } else {
    return unquotedAttributeValue(c);
  }
}

function doubleQuotedAttributeValue(c) {
  if (c === '"') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  } else if (c === "\u0000") {
  } else if (c === EOF) {
  } else {
    currentAttribute.value += c;
    return doubleQuotedAttributeValue;
  }
}

function singleQuotedAttributeValue(c) {
  if (c === "'") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  } else if (c === "\u0000") {
  } else if (c === EOF) {
  } else {
    currentAttribute.value += c;
    return singleQuotedAttributeValue;
  }
}

function unquotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return beforeAttributeName;
  } else if (c === "/") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return selfClosingStartTag;
  } else if (c === ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (c === "\u0000") {
  } else if (c === "'" || c === '"' || c === "<" || c === "=" || c === "`") {
  } else if (c === EOF) {
  } else {
    currentAttribute.value += c;
    return unquotedAttributeValue;
  }
}

function afterQuotedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (c === "/") {
    return selfClosingStartTag;
  } else if (c === ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (c === EOF) {
  } else {
    currentAttribute.value += c;
    return doubleQuotedAttributeValue;
  }
}
function afterAttributeName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return afterAttributeName;
  } else if (c === "/") {
    return selfClosingStartTag;
  } else if (c === "=") {
    return beforeAttributeValue;
  } else if (c === ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (c === EOF) {
  } else {
    currentToken[currentAttribute.name] = currentAttribute.value;
    currentAttribute = {
      name: "",
      value: "",
    };
    return attributeName(c);
  }
}
function selfClosingStartTag(c) {
  if (c === ">") {
    currentToken.isSelfClosing = true;
    emit(currentToken);
    return data;
  } else if (c === "EOF") {
  } else {
  }
}
module.exports.parseHTML = function parseHTML(html) {
  let state = data;
  for (const c of html) {
    state = state(c);
  }
  state = state(EOF);

  // integration test: dom parsing and css computing with specificity
  console.log(
    stack[0].children[0].children[2].children[1].children[1].tagName === "img"
  );
  console.log(
    stack[0].children[0].children[2].children[1].children[1].computedStyle.width
      .value === "100px"
  );
  console.log(
    stack[0].children[0].children[2].children[1].children[1].computedStyle[
      "background-color"
    ].value === "#ff5000"
  );
};
