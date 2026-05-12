import type { ColorParam, Lesson } from './types';

// ══════════════════════════════════════════════════════════════
//  TIER 1 — FOUNDATIONS  (lessons 01 – 12)
// ══════════════════════════════════════════════════════════════

export const LESSONS: Lesson[] = [
  {
    id: 'lesson_01',
    title: 'Your first box',
    concept: 'Everything on a web page is a box. This is a div — an invisible container that CSS can paint any color, any size. The browser lays these boxes out to build every website you\'ve ever seen. Drag the sliders to see the box change in real time.',
    html: '<div class="box"></div>',
    css: '.box {\n  width: 200px;\n  height: 200px;\n  background-color: #3b82f6;\n}',
    parameters: [
      { label: 'Width',  property: 'width',            type: 'slider', min: 50, max: 500, default: 200, unit: 'px' },
      { label: 'Height', property: 'height',           type: 'slider', min: 50, max: 500, default: 200, unit: 'px' },
      { label: 'Color',  property: 'background-color', type: 'color',  default: '#3b82f6' }
    ],
    next_concept: 'Rounded corners'
  },
  {
    id: 'lesson_02',
    title: 'Rounded corners',
    concept: 'border-radius rounds the corners of any box. Start at 0 for sharp corners, and drag the slider up. Hit 100px on a 200×200 square and you get a perfect circle. This single property does a surprising amount of visual work on modern websites.',
    html: '<div class="box"></div>',
    css: '.box {\n  width: 200px;\n  height: 200px;\n  background-color: #8b5cf6;\n  border-radius: 0px;\n}',
    parameters: [
      { label: 'Border Radius', property: 'border-radius', type: 'slider', min: 0, max: 100, default: 0, unit: 'px' }
    ],
    next_concept: 'Borders'
  },
  {
    id: 'lesson_03',
    title: 'Borders',
    concept: 'The border property draws a visible frame around your box. It takes three ingredients: thickness (in px), style (solid, dashed, dotted...), and color. You can control each one independently using border-width, border-style, and border-color.',
    html: '<div class="box"></div>',
    css: '.box {\n  width: 200px;\n  height: 200px;\n  background-color: #f1f5f9;\n  border-width: 2px;\n  border-style: solid;\n  border-color: #6366f1;\n}',
    parameters: [
      { label: 'Border Width', property: 'border-width', type: 'slider', min: 0, max: 20, default: 2, unit: 'px' },
      { label: 'Border Style', property: 'border-style', type: 'select', options: ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge'], default: 'solid' },
      { label: 'Border Color', property: 'border-color', type: 'color',  default: '#6366f1' }
    ],
    next_concept: 'Text inside a box'
  },
  {
    id: 'lesson_04',
    title: 'Text inside a box',
    concept: 'The <p> tag (paragraph) holds text. CSS properties on the .text class control how that text looks — font-size sets letter height in pixels, color sets the text color, font-family switches between typeface styles. Notice the p tag lives inside the div.',
    html: '<div class="box">\n  <p class="text">Hello, world!</p>\n</div>',
    css: '.box {\n  width: 300px;\n  padding: 20px;\n  background-color: #f8fafc;\n  border: 1px solid #e2e8f0;\n}\n\n.text {\n  font-size: 16px;\n  color: #1e293b;\n  font-family: sans-serif;\n  margin: 0;\n}',
    parameters: [
      { label: 'Font Size',   property: 'font-size',   selector: '.text', type: 'slider', min: 8,  max: 72, default: 16, unit: 'px' },
      { label: 'Text Color',  property: 'color',       selector: '.text', type: 'color',  default: '#1e293b' },
      { label: 'Font Family', property: 'font-family', selector: '.text', type: 'select', options: ['sans-serif', 'serif', 'monospace', 'cursive'], default: 'sans-serif' }
    ],
    next_concept: 'Padding vs margin'
  },
  {
    id: 'lesson_05',
    title: 'Spacing inside and outside',
    concept: 'Padding is space INSIDE the box — between the border and the content. Margin is space OUTSIDE the box — between this box and everything around it. The yellow area shows the margin zone. The blue box\'s size includes the padding.',
    html: '<div class="outer">\n  <div class="box">Content</div>\n</div>',
    css: '.outer {\n  background-color: #fef9c3;\n  outline: 2px dashed #eab308;\n  display: inline-block;\n}\n\n.box {\n  background-color: #3b82f6;\n  color: white;\n  font-family: sans-serif;\n  font-size: 14px;\n  padding: 20px;\n  margin: 20px;\n}',
    parameters: [
      { label: 'Padding (inside space)',  property: 'padding', selector: '.box', type: 'slider', min: 0, max: 60, default: 20, unit: 'px' },
      { label: 'Margin (outside space)',  property: 'margin',  selector: '.box', type: 'slider', min: 0, max: 60, default: 20, unit: 'px' }
    ],
    next_concept: 'Your first button'
  },
  {
    id: 'lesson_06',
    title: 'Your first button',
    concept: 'The <button> element is interactive by default. The :hover pseudo-class applies styles only when the cursor is over the element — it\'s CSS that responds to user action, no JavaScript needed. Try hovering over the button in the preview.',
    html: '<button class="btn">Click me</button>',
    css: '.btn {\n  background-color: #6366f1;\n  color: white;\n  font-size: 16px;\n  padding: 12px 24px;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n  font-family: sans-serif;\n  transition: background-color 0.15s;\n}\n\n.btn:hover {\n  background-color: #4f46e5;\n}',
    parameters: [
      { label: 'Background Color', property: 'background-color', selector: '.btn', type: 'color',  default: '#6366f1' },
      { label: 'Border Radius',    property: 'border-radius',    selector: '.btn', type: 'slider', min: 0, max: 50, default: 8, unit: 'px' },
      { label: 'Font Size',        property: 'font-size',        selector: '.btn', type: 'slider', min: 10, max: 32, default: 16, unit: 'px' }
    ],
    next_concept: 'Two boxes side by side'
  },
  {
    id: 'lesson_07',
    title: 'Two boxes side by side',
    concept: 'By default, divs stack vertically like paragraphs. Adding display: flex to a container flips that — its children line up horizontally. The gap property controls the breathing room between them. Flexbox is one of the most useful tools in CSS.',
    html: '<div class="row">\n  <div class="box">Box 1</div>\n  <div class="box">Box 2</div>\n  <div class="box">Box 3</div>\n</div>',
    css: '.row {\n  display: flex;\n  gap: 16px;\n  align-items: center;\n}\n\n.box {\n  width: 100px;\n  height: 100px;\n  background-color: #6366f1;\n  color: white;\n  font-family: sans-serif;\n  font-size: 13px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 8px;\n}',
    parameters: [
      { label: 'Gap between boxes', property: 'gap',              selector: '.row', type: 'slider', min: 0, max: 60, default: 16, unit: 'px' },
      { label: 'Box Color',         property: 'background-color', selector: '.box', type: 'color',  default: '#6366f1' }
    ],
    next_concept: 'Making a card'
  },
  {
    id: 'lesson_08',
    title: 'Making a card',
    concept: 'A card groups related content — an image area, a title, descriptive text — into one self-contained box. Cards are everywhere on the web: product listings, blog posts, user profiles. This is your first multi-element component built from scratch.',
    html: '<div class="card">\n  <div class="card-image"></div>\n  <div class="card-body">\n    <h3 class="card-title">Card Title</h3>\n    <p class="card-text">A short description that tells the viewer what this card is about.</p>\n  </div>\n</div>',
    css: '.card {\n  width: 280px;\n  border-radius: 12px;\n  overflow: hidden;\n  border: 1px solid #e2e8f0;\n  background-color: white;\n  font-family: sans-serif;\n}\n\n.card-image {\n  width: 100%;\n  height: 160px;\n  background-color: #6366f1;\n}\n\n.card-body {\n  padding: 16px;\n}\n\n.card-title {\n  font-size: 18px;\n  color: #1e293b;\n  margin: 0 0 8px 0;\n}\n\n.card-text {\n  font-size: 14px;\n  color: #64748b;\n  margin: 0;\n  line-height: 1.5;\n}',
    parameters: [
      { label: 'Card Width',    property: 'width',            selector: '.card',       type: 'slider', min: 180, max: 420, default: 280, unit: 'px' },
      { label: 'Card Radius',   property: 'border-radius',    selector: '.card',       type: 'slider', min: 0,   max: 30,  default: 12,  unit: 'px' },
      { label: 'Image Color',   property: 'background-color', selector: '.card-image', type: 'color',  default: '#6366f1' }
    ],
    next_concept: 'Colors in depth'
  },
  {
    id: 'lesson_09',
    title: 'Colors in depth',
    concept: 'CSS lets you write colors three ways: as hex (#ff0000), as rgb(255, 0, 0), or by name (red). They describe exactly the same color — just different notations. Designers use hex most often. Pick a color below and watch all three representations update live.',
    html: '<div class="demo">\n  <div class="swatch"></div>\n  <div class="formats">\n    <p class="fmt fmt-hex">Hex: #3b82f6</p>\n    <p class="fmt fmt-rgb">RGB: rgb(59, 130, 246)</p>\n    <p class="fmt fmt-name">Named: blue (approximate)</p>\n  </div>\n</div>',
    css: '.demo {\n  display: flex;\n  align-items: center;\n  gap: 28px;\n  font-family: monospace;\n}\n\n.swatch {\n  width: 140px;\n  height: 140px;\n  border-radius: 12px;\n  background-color: #3b82f6;\n  flex-shrink: 0;\n}\n\n.formats {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.fmt {\n  font-size: 15px;\n  color: #1e293b;\n  margin: 0;\n  padding: 8px 12px;\n  background: #f1f5f9;\n  border-radius: 6px;\n}',
    parameters: [
      { label: 'Color (watch all formats update)', property: 'background-color', selector: '.swatch', type: 'color', default: '#3b82f6', show_formats: true }
    ],
    next_concept: 'Shadows'
  },
  {
    id: 'lesson_10',
    title: 'Shadows',
    concept: 'box-shadow adds a shadow beneath any element, giving it depth. It takes five values: how far left/right (x), how far up/down (y), how soft the edge is (blur), how big the shadow grows (spread), and what color it is. Subtle shadows make UIs feel physical.',
    html: '<div class="box"></div>',
    css: '.box {\n  width: 200px;\n  height: 200px;\n  background-color: white;\n  border-radius: 12px;\n  box-shadow: 4px 4px 12px 0px rgba(0, 0, 0, 0.5);\n}',
    parameters: [
      { label: 'X offset (left/right)', property: 'box-shadow', shadow_component: 'x',      type: 'slider', min: -30, max: 30, default: 4,  unit: 'px' },
      { label: 'Y offset (up/down)',    property: 'box-shadow', shadow_component: 'y',      type: 'slider', min: -30, max: 30, default: 4,  unit: 'px' },
      { label: 'Blur (softness)',       property: 'box-shadow', shadow_component: 'blur',   type: 'slider', min: 0,   max: 60, default: 12, unit: 'px' },
      { label: 'Spread (size)',         property: 'box-shadow', shadow_component: 'spread', type: 'slider', min: -20, max: 30, default: 0,  unit: 'px' },
      { label: 'Shadow Color',          property: 'box-shadow', shadow_component: 'color',  type: 'color',  default: '#000000' } as ColorParam
    ],
    next_concept: 'Images'
  },
  {
    id: 'lesson_11',
    title: 'Images',
    concept: 'The <img> tag embeds an image. The src attribute is the URL of the image. object-fit controls how the image fills its container: \'cover\' crops to fill the space, \'contain\' shows the whole image (with empty space), \'fill\' stretches it. Try each option.',
    html: '<div class="frame">\n  <img class="photo" src="https://picsum.photos/seed/learnspace/600/400" alt="A sample photo" />\n</div>',
    css: '.frame {\n  width: 320px;\n  height: 220px;\n  border-radius: 12px;\n  overflow: hidden;\n  border: 2px solid #e2e8f0;\n}\n\n.photo {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  display: block;\n}',
    parameters: [
      { label: 'Frame Width',  property: 'width',      selector: '.frame', type: 'slider', min: 100, max: 500, default: 320, unit: 'px' },
      { label: 'Frame Height', property: 'height',     selector: '.frame', type: 'slider', min: 80,  max: 400, default: 220, unit: 'px' },
      { label: 'Object Fit',   property: 'object-fit', selector: '.photo', type: 'select', options: ['cover', 'contain', 'fill', 'none'], default: 'cover' }
    ],
    next_concept: 'Mini layout — putting it all together'
  },
  {
    id: 'lesson_12',
    title: 'Building a mini layout',
    concept: 'Every website is a layout: nav bar at the top, content in the middle, footer at the bottom. You already know every CSS property used here. Look at how flexbox, padding, color, border-radius, and font-size combine to make something that looks like a real site.',
    html: '<div class="page">\n  <nav class="nav">\n    <span class="nav-logo">MyBrand</span>\n    <div class="nav-links">\n      <a class="nav-link" href="#">Home</a>\n      <a class="nav-link" href="#">About</a>\n      <a class="nav-link" href="#">Work</a>\n    </div>\n  </nav>\n  <main class="content">\n    <h1 class="headline">Welcome to my page</h1>\n    <p class="body-text">This is the main content area. Every CSS property here is one you\'ve already learned in a previous lesson.</p>\n    <button class="cta-btn">Get Started</button>\n  </main>\n  <footer class="footer">\n    <p class="footer-text">Made with HTML &amp; CSS</p>\n  </footer>\n</div>',
    css: '.page {\n  font-family: sans-serif;\n  display: flex;\n  flex-direction: column;\n  min-height: 400px;\n}\n\n.nav {\n  background-color: #0f172a;\n  padding: 16px 24px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.nav-logo {\n  color: white;\n  font-size: 20px;\n  font-weight: bold;\n}\n\n.nav-links {\n  display: flex;\n  gap: 24px;\n}\n\n.nav-link {\n  color: #94a3b8;\n  text-decoration: none;\n  font-size: 14px;\n}\n\n.content {\n  padding: 48px 24px;\n  flex: 1;\n  background-color: #f8fafc;\n}\n\n.headline {\n  font-size: 36px;\n  color: #0f172a;\n  margin: 0 0 16px 0;\n}\n\n.body-text {\n  font-size: 16px;\n  color: #64748b;\n  margin: 0 0 28px 0;\n  max-width: 480px;\n  line-height: 1.6;\n}\n\n.cta-btn {\n  background-color: #6366f1;\n  color: white;\n  border: none;\n  padding: 12px 24px;\n  border-radius: 8px;\n  font-size: 16px;\n  cursor: pointer;\n  font-family: sans-serif;\n}\n\n.footer {\n  background-color: #1e293b;\n  padding: 16px 24px;\n}\n\n.footer-text {\n  color: #64748b;\n  font-size: 13px;\n  margin: 0;\n}',
    parameters: [
      { label: 'Nav Background', property: 'background-color', selector: '.nav',      type: 'color',  default: '#0f172a' },
      { label: 'Accent Color',   property: 'background-color', selector: '.cta-btn',  type: 'color',  default: '#6366f1' },
      { label: 'Headline Size',  property: 'font-size',        selector: '.headline', type: 'slider', min: 18, max: 64, default: 36, unit: 'px' }
    ],
    next_concept: 'Flexbox alignment'
  },

  // ══════════════════════════════════════════════════════════════
  //  TIER 2 — INTERMEDIATE  (lessons 13 – 24)
  // ══════════════════════════════════════════════════════════════

  {
    id: 'lesson_13',
    title: 'Flexbox alignment',
    concept: 'justify-content moves children along the main axis (left→right by default). align-items moves them on the cross axis (top→bottom). Together these two lines of CSS replace every old centering hack on the web. Set both to \'center\' and your content is perfectly centered — no math needed.',
    html: '<div class="row">\n  <div class="box">A</div>\n  <div class="box">B</div>\n  <div class="box">C</div>\n</div>',
    css: '.row {\n  display: flex;\n  justify-content: flex-start;\n  align-items: center;\n  gap: 12px;\n  width: 380px;\n  height: 180px;\n  background-color: #f1f5f9;\n  padding: 12px;\n  border-radius: 10px;\n}\n\n.box {\n  width: 72px;\n  height: 72px;\n  background-color: #6366f1;\n  color: white;\n  font-family: sans-serif;\n  font-size: 18px;\n  font-weight: bold;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 8px;\n}',
    parameters: [
      { label: 'justify-content (horizontal)', property: 'justify-content', selector: '.row', type: 'select', options: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'], default: 'flex-start' },
      { label: 'align-items (vertical)',       property: 'align-items',     selector: '.row', type: 'select', options: ['flex-start', 'flex-end', 'center', 'stretch'], default: 'center' },
      { label: 'Box color',                    property: 'background-color', selector: '.box', type: 'color',  default: '#6366f1' }
    ],
    next_concept: 'Flex direction & wrap'
  },
  {
    id: 'lesson_14',
    title: 'Flex direction & wrap',
    concept: 'flex-direction: column stacks children top-to-bottom instead of left-to-right. flex-wrap: wrap lets items overflow onto a new row when the container runs out of room — exactly like words wrapping in a paragraph. These two properties unlock almost every layout variation.',
    html: '<div class="grid">\n  <div class="tile">1</div>\n  <div class="tile">2</div>\n  <div class="tile">3</div>\n  <div class="tile">4</div>\n  <div class="tile">5</div>\n  <div class="tile">6</div>\n</div>',
    css: '.grid {\n  display: flex;\n  flex-direction: row;\n  flex-wrap: wrap;\n  gap: 10px;\n  width: 320px;\n  background-color: #f8fafc;\n  padding: 12px;\n  border-radius: 10px;\n}\n\n.tile {\n  width: 88px;\n  height: 88px;\n  background-color: #0ea5e9;\n  color: white;\n  font-family: sans-serif;\n  font-size: 20px;\n  font-weight: bold;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 8px;\n}',
    parameters: [
      { label: 'flex-direction', property: 'flex-direction', selector: '.grid', type: 'select', options: ['row', 'row-reverse', 'column', 'column-reverse'], default: 'row' },
      { label: 'flex-wrap',      property: 'flex-wrap',      selector: '.grid', type: 'select', options: ['nowrap', 'wrap', 'wrap-reverse'], default: 'wrap' },
      { label: 'Gap',            property: 'gap',            selector: '.grid', type: 'slider', min: 0, max: 40, default: 10, unit: 'px' }
    ],
    next_concept: 'Text alignment & spacing'
  },
  {
    id: 'lesson_15',
    title: 'Text alignment & spacing',
    concept: 'text-align decides where text sits in its box: left, center, right, or justified. letter-spacing adds air between individual characters — great for headings and labels. line-height controls vertical space between lines; 1.5–1.6 is the sweet spot for readable body text.',
    html: '<div class="card">\n  <h2 class="heading">Design is not just what it looks like</h2>\n  <p class="body">Design is how it works. Every decision about spacing, alignment, and rhythm sends a signal to the reader about what matters most on the page.</p>\n</div>',
    css: '.card {\n  width: 340px;\n  padding: 28px;\n  background-color: white;\n  border-radius: 12px;\n  border: 1px solid #e2e8f0;\n  font-family: sans-serif;\n}\n\n.heading {\n  font-size: 20px;\n  color: #0f172a;\n  text-align: left;\n  letter-spacing: 0px;\n  margin: 0 0 14px 0;\n  line-height: 1.3;\n}\n\n.body {\n  font-size: 15px;\n  color: #64748b;\n  text-align: left;\n  line-height: 1.6;\n  margin: 0;\n}',
    parameters: [
      { label: 'text-align (heading)',      property: 'text-align',     selector: '.heading', type: 'select', options: ['left', 'center', 'right', 'justify'], default: 'left' },
      { label: 'letter-spacing (heading)',  property: 'letter-spacing', selector: '.heading', type: 'slider', min: -2, max: 10, default: 0, unit: 'px' },
      { label: 'line-height (body)',        property: 'line-height',    selector: '.body',    type: 'select', options: ['1.2', '1.4', '1.6', '1.8', '2.0', '2.4'], default: '1.6' }
    ],
    next_concept: 'Transitions'
  },
  {
    id: 'lesson_16',
    title: 'Transitions',
    concept: 'transition makes a CSS property animate smoothly instead of snapping. You tell it which property to animate, how long to take, and how to accelerate. \'ease-in-out\' starts slow, speeds up, slows down — it feels natural because that\'s how physical objects move. Hover the button in the preview.',
    html: '<button class="btn">Hover over me</button>',
    css: '.btn {\n  background-color: #6366f1;\n  color: white;\n  font-size: 16px;\n  font-family: sans-serif;\n  padding: 14px 28px;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n  transition-property: background-color, transform;\n  transition-duration: 300ms;\n  transition-timing-function: ease-in-out;\n}\n\n.btn:hover {\n  background-color: #4f46e5;\n  transform: scale(1.06);\n}',
    parameters: [
      { label: 'Duration (ms)',  property: 'transition-duration',        selector: '.btn', type: 'slider', min: 50, max: 2000, default: 300, unit: 'ms' },
      { label: 'Easing',         property: 'transition-timing-function', selector: '.btn', type: 'select', options: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'], default: 'ease-in-out' },
      { label: 'Button color',   property: 'background-color',           selector: '.btn', type: 'color',  default: '#6366f1' }
    ],
    next_concept: 'Gradients'
  },
  {
    id: 'lesson_17',
    title: 'Gradients',
    concept: 'linear-gradient blends from one color to another along a direction you choose in degrees (0deg = top→bottom, 90deg = left→right, 135deg = diagonal). Gradients go on background-image, not background-color. The gradient here is fixed — use the shape sliders to explore how it fills different containers.',
    html: '<div class="swatch">\n  <p class="label">Gradient</p>\n</div>',
    css: '.swatch {\n  width: 280px;\n  height: 180px;\n  border-radius: 16px;\n  background-image: linear-gradient(135deg, #6366f1, #ec4899);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.label {\n  font-family: sans-serif;\n  font-size: 12px;\n  color: rgba(255,255,255,0.8);\n  letter-spacing: 0.14em;\n  margin: 0;\n  text-transform: uppercase;\n}',
    parameters: [
      { label: 'Width',         property: 'width',         selector: '.swatch', type: 'slider', min: 100, max: 460, default: 280, unit: 'px' },
      { label: 'Height',        property: 'height',        selector: '.swatch', type: 'slider', min: 60,  max: 320, default: 180, unit: 'px' },
      { label: 'Border Radius', property: 'border-radius', selector: '.swatch', type: 'slider', min: 0,   max: 90,  default: 16,  unit: 'px' }
    ],
    next_concept: 'Positioning'
  },
  {
    id: 'lesson_18',
    title: 'Positioning',
    concept: 'position: relative keeps an element in the normal flow but lets you nudge it with top/left/right/bottom. position: absolute removes it from flow entirely — it positions relative to the nearest ancestor that has position: relative. This is how notification badges, tooltips, and overlay labels are built.',
    html: '<div class="scene">\n  <div class="card">\n    <div class="badge">NEW</div>\n    <p class="card-text">This card has an absolutely positioned badge anchored to its top-right corner.</p>\n  </div>\n</div>',
    css: '.scene {\n  padding: 24px;\n  display: inline-block;\n}\n\n.card {\n  position: relative;\n  width: 260px;\n  padding: 24px;\n  background-color: white;\n  border: 1px solid #e2e8f0;\n  border-radius: 12px;\n  font-family: sans-serif;\n}\n\n.badge {\n  position: absolute;\n  top: -10px;\n  right: 16px;\n  background-color: #ef4444;\n  color: white;\n  font-size: 10px;\n  font-weight: bold;\n  padding: 4px 8px;\n  border-radius: 20px;\n  letter-spacing: 0.08em;\n}\n\n.card-text {\n  font-size: 14px;\n  color: #64748b;\n  margin: 0;\n  line-height: 1.6;\n}',
    parameters: [
      { label: 'Badge top (nudge up/down)', property: 'top',              selector: '.badge', type: 'slider', min: -30, max: 30, default: -10, unit: 'px' },
      { label: 'Badge right',               property: 'right',            selector: '.badge', type: 'slider', min: -10, max: 60, default: 16,  unit: 'px' },
      { label: 'Badge color',               property: 'background-color', selector: '.badge', type: 'color',  default: '#ef4444' }
    ],
    next_concept: 'Z-index & stacking'
  },
  {
    id: 'lesson_19',
    title: 'Z-index & stacking',
    concept: 'When elements overlap, z-index controls which one sits on top. Higher = closer to the viewer — think stacked pieces of paper. Z-index only works on positioned elements (position: relative, absolute, or fixed). Drag the sliders to flip which card appears in front.',
    html: '<div class="scene">\n  <div class="card card-back">Back (z:1)</div>\n  <div class="card card-front">Front (z:2)</div>\n</div>',
    css: '.scene {\n  position: relative;\n  width: 300px;\n  height: 200px;\n}\n\n.card {\n  position: absolute;\n  width: 210px;\n  height: 140px;\n  border-radius: 14px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-family: sans-serif;\n  font-size: 14px;\n  font-weight: bold;\n  color: white;\n}\n\n.card-back {\n  background-color: #6366f1;\n  top: 30px;\n  left: 40px;\n  z-index: 1;\n}\n\n.card-front {\n  background-color: #ec4899;\n  top: 10px;\n  left: 10px;\n  z-index: 2;\n}',
    parameters: [
      { label: 'Front card z-index', property: 'z-index', selector: '.card-front', type: 'slider', min: 0, max: 10, default: 2, unit: '' },
      { label: 'Back card z-index',  property: 'z-index', selector: '.card-back',  type: 'slider', min: 0, max: 10, default: 1, unit: '' }
    ],
    next_concept: 'CSS Grid basics'
  },
  {
    id: 'lesson_20',
    title: 'CSS Grid basics',
    concept: 'CSS Grid turns a container into a two-dimensional grid of rows and columns. grid-template-columns defines the columns: \'1fr\' means one equal fraction of space, so \'repeat(3, 1fr)\' gives three equal columns. Grid is best for page-level two-dimensional layouts; Flexbox handles one-directional rows.',
    html: '<div class="grid">\n  <div class="cell">1</div>\n  <div class="cell">2</div>\n  <div class="cell">3</div>\n  <div class="cell">4</div>\n  <div class="cell">5</div>\n  <div class="cell">6</div>\n</div>',
    css: '.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 12px;\n  width: 360px;\n}\n\n.cell {\n  background-color: #6366f1;\n  color: white;\n  font-family: sans-serif;\n  font-size: 18px;\n  font-weight: bold;\n  padding: 28px;\n  border-radius: 10px;\n  text-align: center;\n}',
    parameters: [
      { label: 'Columns',    property: 'grid-template-columns', selector: '.grid', type: 'select', options: ['repeat(1, 1fr)', 'repeat(2, 1fr)', 'repeat(3, 1fr)', 'repeat(4, 1fr)', '200px 1fr', '1fr 2fr 1fr'], default: 'repeat(3, 1fr)' },
      { label: 'Gap',        property: 'gap',              selector: '.grid', type: 'slider', min: 0, max: 40, default: 12, unit: 'px' },
      { label: 'Cell color', property: 'background-color', selector: '.cell', type: 'color',  default: '#6366f1' }
    ],
    next_concept: 'Overflow & scroll'
  },
  {
    id: 'lesson_21',
    title: 'Overflow & scroll',
    concept: 'When content is taller than its container, overflow decides what happens. \'hidden\' clips it at the edge. \'scroll\' always shows a scrollbar. \'auto\' adds a scrollbar only when needed — that\'s the one most designers reach for. Resize the height slider to see the overflow behaviour change.',
    html: '<div class="box">\n  <p>Line 1 — The quick brown fox</p>\n  <p>Line 2 — jumps over the lazy dog</p>\n  <p>Line 3 — CSS is the language of the web</p>\n  <p>Line 4 — Overflow controls what you see</p>\n  <p>Line 5 — Scroll to reveal hidden content</p>\n  <p>Line 6 — The end of the list</p>\n</div>',
    css: '.box {\n  width: 280px;\n  height: 100px;\n  overflow: hidden;\n  background-color: #f8fafc;\n  border: 1px solid #e2e8f0;\n  border-radius: 10px;\n  padding: 12px 16px;\n  font-family: sans-serif;\n  font-size: 14px;\n  color: #334155;\n  line-height: 1.8;\n}',
    parameters: [
      { label: 'overflow', property: 'overflow', selector: '.box', type: 'select', options: ['visible', 'hidden', 'scroll', 'auto'], default: 'hidden' },
      { label: 'Height',   property: 'height',   selector: '.box', type: 'slider', min: 60, max: 260, default: 100, unit: 'px' }
    ],
    next_concept: 'CSS transforms'
  },
  {
    id: 'lesson_22',
    title: 'CSS transforms',
    concept: 'transform lets you rotate, scale, or skew an element without disturbing the layout around it — it\'s like picking up a piece of paper and tilting it while everything else stays put. CSS variables (--rotate and --skewX on :root) let one slider drive multiple rules at once.',
    html: '<div class="scene">\n  <div class="box">Transform me</div>\n</div>',
    css: ':root {\n  --rotate: 0deg;\n  --skewX: 0deg;\n}\n\n.scene {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  height: 220px;\n}\n\n.box {\n  width: 180px;\n  height: 100px;\n  background-color: #6366f1;\n  color: white;\n  font-family: sans-serif;\n  font-size: 15px;\n  font-weight: 600;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 10px;\n  transform: rotate(var(--rotate)) skewX(var(--skewX));\n  transition: transform 0.2s ease;\n}',
    parameters: [
      { label: 'Rotate (degrees)', property: '--rotate', selector: ':root', type: 'slider', min: -180, max: 180, default: 0, unit: 'deg' },
      { label: 'Skew X (degrees)', property: '--skewX',  selector: ':root', type: 'slider', min: -30,  max: 30,  default: 0, unit: 'deg' },
      { label: 'Box color',        property: 'background-color', selector: '.box', type: 'color', default: '#6366f1' }
    ],
    next_concept: 'CSS variables'
  },
  {
    id: 'lesson_23',
    title: 'CSS variables',
    concept: 'Custom properties (CSS variables) let you define a value once and reuse it everywhere. Declare with a -- prefix on :root, then pull it in with var(). Change one variable and every element using it updates instantly — this is how design systems keep colors consistent across an entire product.',
    html: '<div class="ui">\n  <button class="btn">Primary action</button>\n  <div class="highlight">Highlighted section</div>\n  <span class="badge">Tag</span>\n</div>',
    css: ':root {\n  --accent: #6366f1;\n}\n\n.ui {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n  width: 240px;\n  font-family: sans-serif;\n}\n\n.btn {\n  background-color: var(--accent);\n  color: white;\n  border: none;\n  padding: 12px 20px;\n  border-radius: 8px;\n  font-size: 15px;\n  cursor: pointer;\n}\n\n.highlight {\n  background-color: var(--accent);\n  color: white;\n  padding: 12px 16px;\n  border-radius: 8px;\n  font-size: 14px;\n}\n\n.badge {\n  display: inline-block;\n  background-color: var(--accent);\n  color: white;\n  font-size: 11px;\n  font-weight: bold;\n  padding: 4px 10px;\n  border-radius: 20px;\n  letter-spacing: 0.06em;\n  align-self: flex-start;\n}',
    parameters: [
      { label: 'Accent color — updates all three elements', property: '--accent', selector: ':root', type: 'color', default: '#6366f1' }
    ],
    next_concept: 'Typography in depth'
  },
  {
    id: 'lesson_24',
    title: 'Typography in depth',
    concept: 'font-weight controls boldness from 100 (thin) to 900 (black); 400 is normal, 700 is bold. letter-spacing adds air between characters — negative values tighten text. line-height sets the gap between lines; body text reads best at 1.5–1.7. These three properties define the personality of any typeface.',
    html: '<div class="card">\n  <p class="overline">Typography</p>\n  <h1 class="heading">Type sets the tone</h1>\n  <p class="body">Every font choice, every spacing decision, every weight variation sends a message before the reader processes a single word. Good typography is invisible — bad typography is all you see.</p>\n</div>',
    css: '.card {\n  width: 340px;\n  padding: 32px;\n  background-color: white;\n  border-radius: 14px;\n  border: 1px solid #e2e8f0;\n  font-family: sans-serif;\n}\n\n.overline {\n  font-size: 11px;\n  font-weight: 600;\n  letter-spacing: 0.14em;\n  text-transform: uppercase;\n  color: #6366f1;\n  margin: 0 0 10px 0;\n}\n\n.heading {\n  font-size: 28px;\n  font-weight: 700;\n  color: #0f172a;\n  margin: 0 0 16px 0;\n  line-height: 1.2;\n  letter-spacing: 0px;\n}\n\n.body {\n  font-size: 15px;\n  font-weight: 400;\n  color: #64748b;\n  line-height: 1.6;\n  margin: 0;\n}',
    parameters: [
      { label: 'Heading font-weight',    property: 'font-weight',    selector: '.heading', type: 'select', options: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], default: '700' },
      { label: 'Heading letter-spacing', property: 'letter-spacing', selector: '.heading', type: 'slider', min: -4, max: 14, default: 0, unit: 'px' },
      { label: 'Body line-height',       property: 'line-height',    selector: '.body',    type: 'select', options: ['1.2', '1.4', '1.6', '1.8', '2.0', '2.4'], default: '1.6' }
    ],
    next_concept: 'Form field styling'
  },

  // ══════════════════════════════════════════════════════════════
  //  TIER 3 — ADVANCED  (lessons 25 – 36)
  // ══════════════════════════════════════════════════════════════

  {
    id: 'lesson_25',
    title: 'Form field styling',
    concept: 'Browser-default inputs look different on every OS. appearance: none wipes that styling so you control everything. From there, padding, border, border-radius, and font-size work exactly like on any other element. The :focus pseudo-class adds styles when the field is active — that glowing ring is CSS, not magic.',
    html: '<div class="form">\n  <label class="label">Your name</label>\n  <input class="input" type="text" placeholder="e.g. Alex Chen" />\n  <label class="label">Email</label>\n  <input class="input" type="email" placeholder="you@example.com" />\n  <button class="submit">Submit</button>\n</div>',
    css: '.form {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  width: 300px;\n  font-family: sans-serif;\n}\n\n.label {\n  font-size: 13px;\n  font-weight: 600;\n  color: #374151;\n  margin-top: 6px;\n}\n\n.input {\n  appearance: none;\n  padding: 10px;\n  font-size: 14px;\n  font-family: sans-serif;\n  border: 1.5px solid #d1d5db;\n  border-radius: 8px;\n  color: #111827;\n  background-color: white;\n  outline: none;\n  transition: border-color 0.15s;\n}\n\n.input:focus {\n  border-color: #6366f1;\n  box-shadow: 0 0 0 3px rgba(99,102,241,0.15);\n}\n\n.submit {\n  margin-top: 10px;\n  background-color: #6366f1;\n  color: white;\n  border: none;\n  padding: 11px 20px;\n  border-radius: 8px;\n  font-size: 15px;\n  font-family: sans-serif;\n  cursor: pointer;\n}',
    parameters: [
      { label: 'Input padding',       property: 'padding',          selector: '.input',  type: 'slider', min: 4, max: 24, default: 10, unit: 'px' },
      { label: 'Input border-radius', property: 'border-radius',    selector: '.input',  type: 'slider', min: 0, max: 30, default: 8,  unit: 'px' },
      { label: 'Input border-color',  property: 'border-color',     selector: '.input',  type: 'color',  default: '#d1d5db' },
      { label: 'Submit button color', property: 'background-color', selector: '.submit', type: 'color',  default: '#6366f1' }
    ],
    next_concept: 'CSS animation'
  },
  {
    id: 'lesson_26',
    title: 'CSS animation',
    concept: '@keyframes defines a named sequence of CSS states. You list what the element should look like at 0%, 50%, 100% of the cycle — the browser fills in the smooth motion between them. Attach it with animation-name and control timing with animation-duration. No JavaScript needed.',
    html: '<div class="stage">\n  <div class="ball"></div>\n</div>',
    css: '@keyframes bounce {\n  0%   { transform: translateY(0px); }\n  50%  { transform: translateY(-80px); }\n  100% { transform: translateY(0px); }\n}\n\n.stage {\n  display: flex;\n  align-items: flex-end;\n  justify-content: center;\n  height: 180px;\n  border-bottom: 3px solid #e2e8f0;\n}\n\n.ball {\n  width: 56px;\n  height: 56px;\n  background-color: #6366f1;\n  border-radius: 50%;\n  animation-name: bounce;\n  animation-duration: 800ms;\n  animation-timing-function: ease-in-out;\n  animation-iteration-count: infinite;\n}',
    parameters: [
      { label: 'Duration (ms)',   property: 'animation-duration',        selector: '.ball', type: 'slider', min: 200, max: 3000, default: 800, unit: 'ms' },
      { label: 'Timing function', property: 'animation-timing-function', selector: '.ball', type: 'select', options: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'], default: 'ease-in-out' },
      { label: 'Ball color',      property: 'background-color',          selector: '.ball', type: 'color',  default: '#6366f1' }
    ],
    next_concept: 'Opacity & transparency'
  },
  {
    id: 'lesson_27',
    title: 'Opacity & transparency',
    concept: 'opacity sets how see-through an entire element is: 0 is invisible, 1 is fully opaque. It affects the element and all its children. rgba() achieves transparency on a single color property — the fourth number is the alpha. Unlike opacity, rgba only affects that one declaration, not child elements.',
    html: '<div class="scene">\n  <div class="background">Background content visible here</div>\n  <div class="overlay">Overlay layer</div>\n</div>',
    css: '.scene {\n  position: relative;\n  width: 300px;\n  height: 160px;\n}\n\n.background {\n  width: 100%;\n  height: 100%;\n  background-color: #3b82f6;\n  border-radius: 12px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-family: sans-serif;\n  font-size: 14px;\n  color: white;\n  font-weight: 600;\n}\n\n.overlay {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  background-color: #0f172a;\n  border-radius: 12px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-family: sans-serif;\n  font-size: 14px;\n  color: white;\n  opacity: 0.6;\n}',
    parameters: [
      { label: 'Overlay opacity',  property: 'opacity',          selector: '.overlay',    type: 'select', options: ['0', '0.1', '0.25', '0.5', '0.6', '0.75', '0.9', '1'], default: '0.6' },
      { label: 'Overlay color',    property: 'background-color', selector: '.overlay',    type: 'color',  default: '#0f172a' },
      { label: 'Background color', property: 'background-color', selector: '.background', type: 'color',  default: '#3b82f6' }
    ],
    next_concept: 'Profile card'
  },
  {
    id: 'lesson_28',
    title: 'Profile card',
    concept: 'A profile card assembles everything you\'ve learned: a circular avatar (border-radius: 50%), name and role (typography), a short bio (line-height), stats in a flex row, and a CTA button. Nothing here is new — it\'s existing knowledge organized into a real-world component.',
    html: '<div class="profile-card">\n  <img src="https://picsum.photos/seed/avatar42/200/200" alt="Avatar" class="avatar" />\n  <h2 class="name">Alex Rivera</h2>\n  <p class="role">Frontend Developer</p>\n  <p class="bio">Building things for the web. Loves CSS, clean code, and great coffee.</p>\n  <div class="stats">\n    <div class="stat"><span class="stat-num">142</span><span class="stat-label">Projects</span></div>\n    <div class="stat"><span class="stat-num">2.4k</span><span class="stat-label">Followers</span></div>\n    <div class="stat"><span class="stat-num">317</span><span class="stat-label">Following</span></div>\n  </div>\n  <button class="follow-btn">Follow</button>\n</div>',
    css: '.profile-card {\n  width: 300px;\n  background-color: white;\n  border-radius: 20px;\n  border: 1px solid #e2e8f0;\n  padding: 28px 24px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  font-family: sans-serif;\n  text-align: center;\n}\n\n.avatar {\n  width: 80px;\n  height: 80px;\n  border-radius: 50%;\n  object-fit: cover;\n  margin-bottom: 14px;\n  border: 3px solid #e2e8f0;\n}\n\n.name {\n  font-size: 20px;\n  font-weight: 700;\n  color: #0f172a;\n  margin: 0 0 4px 0;\n}\n\n.role {\n  font-size: 13px;\n  color: #6366f1;\n  font-weight: 600;\n  margin: 0 0 12px 0;\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n}\n\n.bio {\n  font-size: 13px;\n  color: #64748b;\n  line-height: 1.6;\n  margin: 0 0 20px 0;\n}\n\n.stats {\n  display: flex;\n  gap: 24px;\n  margin-bottom: 20px;\n  border-top: 1px solid #f1f5f9;\n  border-bottom: 1px solid #f1f5f9;\n  padding: 14px 0;\n  width: 100%;\n  justify-content: center;\n}\n\n.stat {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 2px;\n}\n\n.stat-num {\n  font-size: 18px;\n  font-weight: 700;\n  color: #0f172a;\n}\n\n.stat-label {\n  font-size: 10px;\n  color: #94a3b8;\n  text-transform: uppercase;\n  letter-spacing: 0.06em;\n}\n\n.follow-btn {\n  background-color: #6366f1;\n  color: white;\n  border: none;\n  padding: 10px 32px;\n  border-radius: 8px;\n  font-size: 14px;\n  font-weight: 600;\n  font-family: sans-serif;\n  cursor: pointer;\n  width: 100%;\n}',
    parameters: [
      { label: 'Avatar size',         property: 'width',            selector: '.avatar',       type: 'slider', min: 48, max: 140, default: 80, unit: 'px' },
      { label: 'Card border-radius',  property: 'border-radius',    selector: '.profile-card', type: 'slider', min: 0,  max: 40,  default: 20, unit: 'px' },
      { label: 'Accent / role color', property: 'color',            selector: '.role',         type: 'color',  default: '#6366f1' },
      { label: 'Follow button color', property: 'background-color', selector: '.follow-btn',   type: 'color',  default: '#6366f1' }
    ],
    next_concept: 'Toast notification'
  },
  {
    id: 'lesson_29',
    title: 'Toast notification',
    concept: 'A toast is a temporary status message that appears over the UI — success, warning, error. The colored left border signals the type before you read a word. The icon, message, and close button are laid out with flexbox. This is a complete, production-usable component built entirely with what you know.',
    html: '<div class="toast">\n  <span class="toast-icon">✓</span>\n  <div class="toast-body">\n    <p class="toast-title">Changes saved</p>\n    <p class="toast-msg">Your profile has been updated successfully.</p>\n  </div>\n  <button class="toast-close">✕</button>\n</div>',
    css: '.toast {\n  display: flex;\n  align-items: flex-start;\n  gap: 12px;\n  width: 340px;\n  background-color: white;\n  border: 1px solid #e2e8f0;\n  border-left: 4px solid #22c55e;\n  border-radius: 10px;\n  padding: 14px 16px;\n  box-shadow: 0 4px 16px rgba(0,0,0,0.08);\n  font-family: sans-serif;\n}\n\n.toast-icon {\n  font-size: 18px;\n  color: #22c55e;\n  font-weight: bold;\n  flex-shrink: 0;\n  margin-top: 1px;\n}\n\n.toast-body {\n  flex: 1;\n}\n\n.toast-title {\n  font-size: 14px;\n  font-weight: 700;\n  color: #0f172a;\n  margin: 0 0 3px 0;\n}\n\n.toast-msg {\n  font-size: 13px;\n  color: #64748b;\n  margin: 0;\n  line-height: 1.5;\n}\n\n.toast-close {\n  background: none;\n  border: none;\n  font-size: 14px;\n  color: #94a3b8;\n  cursor: pointer;\n  flex-shrink: 0;\n  padding: 0;\n  margin-top: 1px;\n}',
    parameters: [
      { label: 'Accent border',    property: 'border-left',      selector: '.toast',      type: 'select', options: ['4px solid #22c55e', '4px solid #3b82f6', '4px solid #f59e0b', '4px solid #ef4444', '4px solid #8b5cf6'], default: '4px solid #22c55e' },
      { label: 'Icon color',       property: 'color',            selector: '.toast-icon', type: 'color',  default: '#22c55e' },
      { label: 'Background color', property: 'background-color', selector: '.toast',      type: 'color',  default: '#ffffff' }
    ],
    next_concept: 'Pricing card'
  },
  {
    id: 'lesson_30',
    title: 'Pricing card',
    concept: 'A pricing card communicates plan value at a glance: tier, price, feature list, call to action. The \'recommended\' treatment — a distinct border, badge, or background — directs the eye to the option you want people to choose. Every element here uses skills you already have.',
    html: '<div class="pricing-card">\n  <div class="plan-badge">POPULAR</div>\n  <h3 class="plan-name">Pro</h3>\n  <div class="price-row"><span class="price">$29</span><span class="per">/month</span></div>\n  <ul class="features">\n    <li class="feature">✓ Unlimited projects</li>\n    <li class="feature">✓ Priority support</li>\n    <li class="feature">✓ Custom domain</li>\n    <li class="feature">✓ Analytics dashboard</li>\n  </ul>\n  <button class="cta-btn">Get started</button>\n</div>',
    css: '.pricing-card {\n  width: 280px;\n  background-color: white;\n  border: 2px solid #6366f1;\n  border-radius: 20px;\n  padding: 32px 24px;\n  font-family: sans-serif;\n  position: relative;\n  text-align: center;\n}\n\n.plan-badge {\n  position: absolute;\n  top: -14px;\n  left: 50%;\n  transform: translateX(-50%);\n  background-color: #6366f1;\n  color: white;\n  font-size: 10px;\n  font-weight: bold;\n  padding: 4px 14px;\n  border-radius: 20px;\n  letter-spacing: 0.1em;\n}\n\n.plan-name {\n  font-size: 22px;\n  font-weight: 700;\n  color: #0f172a;\n  margin: 8px 0 16px 0;\n}\n\n.price-row {\n  display: flex;\n  align-items: baseline;\n  justify-content: center;\n  gap: 4px;\n  margin-bottom: 24px;\n}\n\n.price {\n  font-size: 44px;\n  font-weight: 800;\n  color: #6366f1;\n}\n\n.per {\n  font-size: 14px;\n  color: #94a3b8;\n}\n\n.features {\n  list-style: none;\n  padding: 0;\n  margin: 0 0 28px 0;\n  text-align: left;\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.feature {\n  font-size: 14px;\n  color: #475569;\n}\n\n.cta-btn {\n  background-color: #6366f1;\n  color: white;\n  border: none;\n  padding: 13px 0;\n  border-radius: 10px;\n  font-size: 15px;\n  font-weight: 600;\n  font-family: sans-serif;\n  cursor: pointer;\n  width: 100%;\n}',
    parameters: [
      { label: 'Accent color',       property: 'background-color', selector: '.plan-badge',   type: 'color',  default: '#6366f1' },
      { label: 'Price color',        property: 'color',            selector: '.price',        type: 'color',  default: '#6366f1' },
      { label: 'CTA button color',   property: 'background-color', selector: '.cta-btn',      type: 'color',  default: '#6366f1' },
      { label: 'Card border-radius', property: 'border-radius',    selector: '.pricing-card', type: 'slider', min: 0, max: 40, default: 20, unit: 'px' }
    ],
    next_concept: 'Navigation bar'
  },
  {
    id: 'lesson_31',
    title: 'Navigation bar',
    concept: 'A nav bar is a flex row: logo on the left, links in the middle, a CTA button at the far end. space-between pushes items to opposite sides. The :hover on nav links is pure CSS. This exact pattern appears on almost every commercial website — you now have all the tools to build it.',
    html: '<nav class="navbar">\n  <span class="logo">Acme</span>\n  <div class="nav-links">\n    <a class="nav-link" href="#">Product</a>\n    <a class="nav-link" href="#">Pricing</a>\n    <a class="nav-link" href="#">Docs</a>\n    <a class="nav-link" href="#">Blog</a>\n  </div>\n  <button class="nav-cta">Sign up free</button>\n</nav>',
    css: '.navbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0 24px;\n  height: 60px;\n  background-color: #0f172a;\n  border-radius: 12px;\n  width: 560px;\n}\n\n.logo {\n  font-size: 20px;\n  font-weight: 800;\n  color: white;\n  font-family: sans-serif;\n  letter-spacing: -0.02em;\n}\n\n.nav-links {\n  display: flex;\n  gap: 28px;\n}\n\n.nav-link {\n  font-family: sans-serif;\n  font-size: 14px;\n  color: #94a3b8;\n  text-decoration: none;\n  transition: color 0.15s;\n}\n\n.nav-link:hover {\n  color: white;\n}\n\n.nav-cta {\n  background-color: #6366f1;\n  color: white;\n  border: none;\n  padding: 8px 18px;\n  border-radius: 7px;\n  font-size: 13px;\n  font-weight: 600;\n  font-family: sans-serif;\n  cursor: pointer;\n}',
    parameters: [
      { label: 'Nav background', property: 'background-color', selector: '.navbar',    type: 'color',  default: '#0f172a' },
      { label: 'Link color',     property: 'color',            selector: '.nav-link',  type: 'color',  default: '#94a3b8' },
      { label: 'CTA color',      property: 'background-color', selector: '.nav-cta',   type: 'color',  default: '#6366f1' },
      { label: 'Link gap',       property: 'gap',              selector: '.nav-links', type: 'slider', min: 8, max: 60, default: 28, unit: 'px' }
    ],
    next_concept: 'Grid template areas'
  },
  {
    id: 'lesson_32',
    title: 'Grid template areas',
    concept: 'grid-template-areas lets you name regions of a grid as readable ASCII art in your CSS: \'header header\' means the top row is one wide named region. Changing the template string rewires the entire page layout. This is the most readable way to define complex page structures — no pixel math required.',
    html: '<div class="layout">\n  <header class="hd">Header</header>\n  <aside class="sd">Sidebar</aside>\n  <main class="mn">Main Content</main>\n  <footer class="ft">Footer</footer>\n</div>',
    css: '.layout {\n  display: grid;\n  grid-template-columns: 180px 1fr;\n  grid-template-areas: "hd hd" "sd mn" "ft ft";\n  gap: 10px;\n  width: 500px;\n  height: 280px;\n  font-family: sans-serif;\n  font-size: 13px;\n  font-weight: 600;\n}\n\n.hd { grid-area: hd; background-color: #6366f1; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; }\n.sd { grid-area: sd; background-color: #e0e7ff; color: #3730a3; border-radius: 8px; display: flex; align-items: center; justify-content: center; }\n.mn { grid-area: mn; background-color: #f8fafc; color: #334155; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; }\n.ft { grid-area: ft; background-color: #1e293b; color: #94a3b8; border-radius: 8px; display: flex; align-items: center; justify-content: center; }',
    parameters: [
      { label: 'Layout template',  property: 'grid-template-areas',   selector: '.layout', type: 'select', options: ['"hd hd" "sd mn" "ft ft"', '"hd hd" "mn mn" "sd ft"', '"sd hd" "sd mn" "sd ft"'], default: '"hd hd" "sd mn" "ft ft"' },
      { label: 'Column split',     property: 'grid-template-columns', selector: '.layout', type: 'select', options: ['120px 1fr', '180px 1fr', '240px 1fr', '1fr 1fr', '1fr 2fr'], default: '180px 1fr' },
      { label: 'Gap',              property: 'gap',                   selector: '.layout', type: 'slider', min: 0, max: 30, default: 10, unit: 'px' }
    ],
    next_concept: 'Loading spinner'
  },
  {
    id: 'lesson_33',
    title: 'Loading spinner',
    concept: 'A CSS-only spinner is a circle with one colored arc. You get this with border: thick solid transparent on all four sides, then set border-top-color to a visible color — that creates the arc. A @keyframes animation rotates it continuously. Two properties and one animation rule is all it takes.',
    html: '<div class="stage">\n  <div class="spinner"></div>\n</div>',
    css: '@keyframes spin {\n  0%   { transform: rotate(0deg); }\n  100% { transform: rotate(360deg); }\n}\n\n.stage {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  height: 160px;\n}\n\n.spinner {\n  width: 56px;\n  height: 56px;\n  border-radius: 50%;\n  border: 5px solid #e2e8f0;\n  border-top-color: #6366f1;\n  animation-name: spin;\n  animation-duration: 700ms;\n  animation-timing-function: linear;\n  animation-iteration-count: infinite;\n}',
    parameters: [
      { label: 'Size',             property: 'width',              selector: '.spinner', type: 'slider', min: 24,  max: 120,  default: 56,  unit: 'px' },
      { label: 'Border thickness', property: 'border',             selector: '.spinner', type: 'select', options: ['3px solid #e2e8f0', '5px solid #e2e8f0', '8px solid #e2e8f0', '12px solid #e2e8f0'], default: '5px solid #e2e8f0' },
      { label: 'Arc color',        property: 'border-top-color',   selector: '.spinner', type: 'color',  default: '#6366f1' },
      { label: 'Speed (ms)',       property: 'animation-duration', selector: '.spinner', type: 'slider', min: 200, max: 2000, default: 700, unit: 'ms' }
    ],
    next_concept: 'Button group & states'
  },
  {
    id: 'lesson_34',
    title: 'Button group & states',
    concept: 'Real UIs have multiple button variants: primary for the main action, secondary for alternatives, danger for destructive actions. They share a base .btn class but each adds a modifier like .btn-primary. This is how CSS scales — shared rules, small targeted overrides. Hover each button in the preview.',
    html: '<div class="btn-group">\n  <button class="btn btn-primary">Save changes</button>\n  <button class="btn btn-secondary">Cancel</button>\n  <button class="btn btn-danger">Delete</button>\n</div>',
    css: '.btn-group {\n  display: flex;\n  gap: 10px;\n  align-items: center;\n  flex-wrap: wrap;\n}\n\n.btn {\n  font-family: sans-serif;\n  font-size: 14px;\n  font-weight: 600;\n  padding: 10px 20px;\n  border-radius: 8px;\n  border: none;\n  cursor: pointer;\n  transition: opacity 0.15s, transform 0.1s;\n}\n\n.btn:hover {\n  opacity: 0.85;\n  transform: translateY(-1px);\n}\n\n.btn-primary {\n  background-color: #6366f1;\n  color: white;\n}\n\n.btn-secondary {\n  background-color: #f1f5f9;\n  color: #334155;\n  border: 1.5px solid #cbd5e1;\n}\n\n.btn-danger {\n  background-color: #ef4444;\n  color: white;\n}',
    parameters: [
      { label: 'Primary color', property: 'background-color', selector: '.btn-primary', type: 'color',  default: '#6366f1' },
      { label: 'Danger color',  property: 'background-color', selector: '.btn-danger',  type: 'color',  default: '#ef4444' },
      { label: 'Border radius', property: 'border-radius',    selector: '.btn',         type: 'slider', min: 0,  max: 50, default: 8,  unit: 'px' },
      { label: 'Font size',     property: 'font-size',        selector: '.btn',         type: 'slider', min: 11, max: 24, default: 14, unit: 'px' }
    ],
    next_concept: 'Hero section'
  },
  {
    id: 'lesson_35',
    title: 'Hero section',
    concept: 'A hero section is the first thing visitors see — it must communicate value instantly. It combines a bold headline, a subheadline, two CTA buttons (primary + ghost secondary), and a strong background. Every major website has one. The pattern is consistent because it works.',
    html: '<section class="hero">\n  <div class="hero-content">\n    <p class="hero-eyebrow">Introducing v2.0</p>\n    <h1 class="hero-headline">Build faster.<br>Ship better.</h1>\n    <p class="hero-sub">The all-in-one platform for modern teams. From idea to production in days, not months.</p>\n    <div class="hero-actions">\n      <button class="hero-cta-primary">Start for free</button>\n      <button class="hero-cta-ghost">See the demo →</button>\n    </div>\n  </div>\n</section>',
    css: '.hero {\n  background-color: #0f172a;\n  padding: 64px 40px;\n  border-radius: 16px;\n  width: 540px;\n}\n\n.hero-content {\n  max-width: 420px;\n}\n\n.hero-eyebrow {\n  font-family: sans-serif;\n  font-size: 12px;\n  font-weight: 600;\n  color: #6366f1;\n  letter-spacing: 0.1em;\n  text-transform: uppercase;\n  margin: 0 0 16px 0;\n}\n\n.hero-headline {\n  font-family: sans-serif;\n  font-size: 48px;\n  font-weight: 800;\n  color: white;\n  line-height: 1.1;\n  margin: 0 0 20px 0;\n  letter-spacing: -0.02em;\n}\n\n.hero-sub {\n  font-family: sans-serif;\n  font-size: 16px;\n  color: #94a3b8;\n  line-height: 1.7;\n  margin: 0 0 32px 0;\n}\n\n.hero-actions {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n}\n\n.hero-cta-primary {\n  background-color: #6366f1;\n  color: white;\n  border: none;\n  padding: 13px 26px;\n  border-radius: 9px;\n  font-size: 15px;\n  font-weight: 600;\n  font-family: sans-serif;\n  cursor: pointer;\n}\n\n.hero-cta-ghost {\n  background-color: transparent;\n  color: #94a3b8;\n  border: 1.5px solid #334155;\n  padding: 12px 22px;\n  border-radius: 9px;\n  font-size: 15px;\n  font-weight: 500;\n  font-family: sans-serif;\n  cursor: pointer;\n}',
    parameters: [
      { label: 'Background',             property: 'background-color', selector: '.hero',             type: 'color',  default: '#0f172a' },
      { label: 'Headline size',          property: 'font-size',        selector: '.hero-headline',    type: 'slider', min: 28, max: 72, default: 48, unit: 'px' },
      { label: 'Primary CTA color',      property: 'background-color', selector: '.hero-cta-primary', type: 'color',  default: '#6366f1' },
      { label: 'Eyebrow / accent color', property: 'color',            selector: '.hero-eyebrow',     type: 'color',  default: '#6366f1' }
    ],
    next_concept: 'Feature grid'
  },
  {
    id: 'lesson_36',
    title: 'Feature grid',
    concept: 'A features section breaks a product\'s value into scannable chunks: icon, short title, one-sentence description, repeated in a grid. CSS Grid auto-fills the columns so the layout adapts to any number of cards. This pattern — icon + heading + copy in a grid — is the most common content block on marketing sites.',
    html: '<section class="features">\n  <h2 class="section-title">Why FableCode?</h2>\n  <div class="feature-grid">\n    <div class="feature-card">\n      <div class="icon">&#128640;</div>\n      <h3 class="feat-title">Instant feedback</h3>\n      <p class="feat-desc">See every CSS change reflected live in the preview. No guessing, no reloading.</p>\n    </div>\n    <div class="feature-card">\n      <div class="icon">&#9889;</div>\n      <h3 class="feat-title">Learn by doing</h3>\n      <p class="feat-desc">Sliders replace documentation. You feel the property change before you memorize the name.</p>\n    </div>\n    <div class="feature-card">\n      <div class="icon">&#127912;</div>\n      <h3 class="feat-title">Real components</h3>\n      <p class="feat-desc">Every lesson builds something you\'d actually ship — buttons, cards, navbars, heroes.</p>\n    </div>\n  </div>\n</section>',
    css: '.features {\n  width: 560px;\n  font-family: sans-serif;\n}\n\n.section-title {\n  font-size: 26px;\n  font-weight: 800;\n  color: #0f172a;\n  margin: 0 0 28px 0;\n  text-align: center;\n  letter-spacing: -0.01em;\n}\n\n.feature-grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 16px;\n}\n\n.feature-card {\n  background-color: #f8fafc;\n  border: 1px solid #e2e8f0;\n  border-radius: 14px;\n  padding: 24px 20px;\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.icon {\n  font-size: 28px;\n  line-height: 1;\n}\n\n.feat-title {\n  font-size: 15px;\n  font-weight: 700;\n  color: #0f172a;\n  margin: 0;\n}\n\n.feat-desc {\n  font-size: 13px;\n  color: #64748b;\n  margin: 0;\n  line-height: 1.6;\n}',
    parameters: [
      { label: 'Columns',         property: 'grid-template-columns', selector: '.feature-grid', type: 'select', options: ['repeat(1, 1fr)', 'repeat(2, 1fr)', 'repeat(3, 1fr)'], default: 'repeat(3, 1fr)' },
      { label: 'Gap',             property: 'gap',              selector: '.feature-grid', type: 'slider', min: 0,  max: 40, default: 16, unit: 'px' },
      { label: 'Card background', property: 'background-color', selector: '.feature-card', type: 'color',  default: '#f8fafc' },
      { label: 'Card radius',     property: 'border-radius',    selector: '.feature-card', type: 'slider', min: 0,  max: 30, default: 14, unit: 'px' }
    ],
    next_concept: 'Sandbox — build freely'
  },

  // ══════════════════════════════════════════════════════════════
  //  SANDBOX
  // ══════════════════════════════════════════════════════════════

  {
    id: 'sandbox',
    title: 'Sandbox',
    concept: 'Build whatever you want. You know enough to start.',
    html: '',
    css: '',
    parameters: [],
    sandbox: true,
    next_concept: null
  }
];

// Lesson type used for imports in other files
export type { Lesson } from './types';

// Also re-export param types as needed
export type { ColorParam } from './types';
