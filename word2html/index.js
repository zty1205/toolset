const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const prettier = require('prettier');
const { fsResource } = require('../utils');

const DIR = path.resolve(__dirname, '../targets/word');
const DIST = path.resolve(__dirname, '../dist');
const COMMON_CSS = path.resolve(__dirname, '../public/css/common.css');
const COMMON_JS = path.resolve(__dirname, '../public/js/flexible.js');
const HTML_TEMPLATE_PATH = path.resolve(__dirname, './template.html');
const VUE_TEMPLATE_PATH = path.resolve(__dirname, './template.vue');
const REACT_TEMPLATE_PATH = path.resolve(__dirname, './template.jsx');

function createTemplate(template, options) {
  for (let k in options) {
    template = template.replace(k, options[k]);
  }
  return template.replace(/\<p\>/g, '<p class="t-indent">');
}

async function handleHtml(name, content) {
  const title = name.split('.')[0];
  const cssContent = await fsResource(COMMON_CSS);
  const jsContent = await fsResource(COMMON_JS);

  const HTML_TEMPLATE = fs.readFileSync(HTML_TEMPLATE_PATH, { encoding: 'utf-8' });

  const html = createTemplate(HTML_TEMPLATE, {
    TEMPLATE_TITLE: title,
    TEMPLATE_CONTENT: content,
    '/* TEMPLATE_CSS */': cssContent,
    '// TEMPLATE_JS': jsContent
  });

  fs.writeFile(`${DIST}/${title}.html`, prettier.format(html, { semi: true, parser: 'html' }), (err) => {
    if (err) {
      return console.error(err);
    }
    console.log(`-- ${title}.html end --`);
  });
}

async function handleVue(name, content) {
  const title = name.split('.')[0];
  const VUE_TEMPLATE = fs.readFileSync(VUE_TEMPLATE_PATH, { encoding: 'utf-8' });

  const html = createTemplate(VUE_TEMPLATE, {
    TEMPLATE_CONTENT: content
  });

  fs.writeFile(`${DIST}/${title}.vue`, prettier.format(html, { semi: true, parser: 'vue' }), (err) => {
    if (err) {
      return console.error(err);
    }
    console.log(`-- ${title}.vue end --`);
  });
}

async function handleReact(name, content) {
  const title = name.split('.')[0];
  const REACT_TEMPLATE = fs.readFileSync(REACT_TEMPLATE_PATH, { encoding: 'utf-8' });

  const html = createTemplate(REACT_TEMPLATE, {
    '// TEMPLATE_JS': `return <div>${content}</div>`
  });

  fs.writeFile(`${DIST}/${title}.jsx`, prettier.format(html, { semi: true, parser: 'babel' }), (err) => {
    if (err) {
      return console.error(err);
    }
    console.log(`-- ${title}.jsx end --`);
  });
}

function runner(fileName) {
  if (!/\.docx/.test(fileName)) return;

  console.log(`-- runner ${fileName} start --`);

  function transformDocument(element) {
    if (element.type === 'paragraph' && !element.children.length) {
      return { ...element, styleName: 'br' };
    }
    if (!element.styleName) {
      return { ...element, styleName: 'p indent' };
    }
    return element;
  }

  const options = {
    styleMap: [
      "p[style-name='Section Title'] => h1:fresh", // 默认
      "p[style-name='Subsection Title'] => h2:fresh", // 默认
      "p[style-name='heading 3'] => h3.ql-align-center", // 自定义 会有两个类
      "p[style-name='br'] => br", // 自定义
      'u => span.t-underline' // 自定义
    ],
    ignoreEmptyParagraphs: true,
    transformDocument: mammoth.transforms.paragraph(transformDocument)
  };
  mammoth
    .convertToHtml(
      {
        path: `${DIR}/${fileName}`
      },
      options
    )
    .then((result) => {
      [handleHtml, handleVue, handleReact].forEach((f) => f(fileName, result.value));
    });
}

function main() {
  const files = fs.readdirSync(DIR) || [];
  for (let i = 0; i < files.length; i++) {
    runner(files[i]);
  }
}

main();
