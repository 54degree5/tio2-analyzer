/* Spectra visual sample analyzer — UI (web port of the PySide6 desktop app) */
(function () {
'use strict';
const C = window.Core;
const COLORS = ['#1938d7', '#22252d', '#7984b8', '#af6a3a', '#6d7298', '#4d7c83'];
const MAXSIDE = 1000;
const STATUS_IDLE = '';
const $ = (s, r) => (r || document).querySelector(s);
const tick = () => new Promise((r) => setTimeout(r, 0));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const I18N = {
  ru: {
    'header.caption':'АНАЛИЗ ИЗОБРАЖЕНИЙ','nav.workspace':'Анализ','nav.results':'Результаты','nav.method':'Демо-анализ','nav.audience':'Для кого','header.start':'Начать анализ',
    'hero.eyebrow':'SPECTRA / АНАЛИЗ ИЗОБРАЖЕНИЙ','hero.title':'Анализ цвета <br><span>по фотографиям</span>','hero.copy':'Загрузите серию снимков, сравните изменение цвета и получите первый измеримый результат прямо в браузере.','hero.start':'Начать анализ','hero.upload':'Загрузить изображения','hero.meta1':'Проверка входных данных','hero.meta2':'Авто режим выбирает параметры','hero.meta3':'Результат можно сверить с прибором',
    'preview.label':'РАБОЧИЙ СЦЕНАРИЙ','preview.demo':'ДЕМО','preview.sample':'ОДИН ОБРАЗЕЦ','preview.title':'Серия фото → результат','preview.time':'6 кадров · 10 мин','preview.input':'ВХОД','preview.series':'Серия кадров','preview.scene':'одна сцена и одинаковый свет','preview.check':'ПРОВЕРКА','preview.auto':'Авто режим','preview.signal':'сигнал и область образца','preview.output':'РЕЗУЛЬТАТ','preview.chart':'график для сравнения условий','preview.firstResult':'Первичная оценка','preview.pilot':'Пилот для учебной лаборатории',
    'workflow.upload':'Загрузить изображения','workflow.uploadNote':'Добавьте серию снимков','workflow.compare':'Сравнить результат','workflow.compareNote':'Оригинал и обработка','workflow.read':'Прочитать анализ','workflow.readNote':'График и измеримые показатели',
    'analysis.kicker':'РАБОЧАЯ ОБЛАСТЬ / 01','analysis.title':'Анализ образца','analysis.note':'Демо или собственная серия фотографий','output.kicker':'ИНТЕНСИВНОСТЬ ВО ВРЕМЕНИ','output.title':'Изменение цвета во времени','output.all':'ВСЕ СЕРИИ','output.compare':'Сравнить результаты','table.number':'№','table.experiment':'Эксперимент','table.k':'k, с⁻¹','table.half':'t₁/₂',
    'method.kicker':'ДЕМО-АНАЛИЗ','method.title':'Получите результат в Word','method.copy':'Загрузите серию фотографий или откройте демо. На выходе — короткий отчёт с графиком, показателями и ограничениями метода.','method.step1':'Загрузите серию фото','method.step1copy':'Минимум два кадра одного образца, одна сцена и заданный интервал между снимками.','method.step2':'Мы проверим серию','method.step2copy':'Сервис проверит формат, размер, одинаковость сцены и устойчивость сигнала.','method.step3':'Получите расчёт','method.step3copy':'Авто режим выберет параметры и рассчитает динамику цвета, k и t½.','method.step4':'Скачайте Word-отчёт','method.step4copy':'Файл можно передать преподавателю, руководителю лаборатории или использовать для следующего опыта.','method.input':'ВХОД','method.check':'ПРОВЕРКА','method.signal':'РАСЧЁТ','method.output':'ОТЧЁТ','method.offerKicker':'ДЕМО-АНАЛИЗ','method.offerTitle':'Результат приходит Word-файлом','method.offerCopy':'В отчёте будут краткий вывод, параметры серии, график, основные показатели и ограничения метода.','method.disclaimer':'Сейчас это демонстрационная выдача. Реальную оплату подключим после фиксации цены и условий.','method.order':'Заказать демо-анализ','method.download':'Скачать пример отчёта','method.orderNote':'Сейчас кнопка показывает демо-сценарий: после получения серии фотографий клиент получает Word-отчёт. Для реальной оплаты нужно подключить цену и платёжную ссылку.','method.close':'Закрыть',
    'audience.kicker':'КОМУ НУЖНО','audience.title':'Когда нужен быстрый первый результат','audience.copy':'Spectra помогает быстро проверить, меняется ли цвет образца, прежде чем занимать дорогой прибор или повторять опыт.','audience.schoollabel':'ДЛЯ УЧЕБНЫХ ЗАНЯТИЙ','audience.universitylabel':'ДЛЯ ПЕРВИЧНОЙ ПРОВЕРКИ','audience.userlabel':'ДЛЯ САМОСТОЯТЕЛЬНОЙ РАБОТЫ','audience.school':'Школа или STEM-центр','audience.schoolcopy':'Демонстрации, лабораторные и проектные работы без отдельного спектрофотометра.','audience.schooltag':'Занятия и проекты','audience.university':'Учебная лаборатория','audience.universitycopy':'Быстро сравнить серию и понять, какой опыт стоит проверить точным прибором.','audience.universitytag':'Пилот на реальных данных','audience.rnd':'Студент, преподаватель или школьник','audience.rndcopy':'Загрузить серию фото, проверить входные данные и получить ориентир по изменению цвета.','audience.rndtag':'Понятный сценарий',
    'plans.kicker':'КАК ПОЛУЧИТЬ ОТЧЁТ','plans.title':'Сначала демо, потом доступ для команды','plans.copy':'Начните с одного демо-анализа на реальной серии фотографий. Если сценарий подходит, подключим класс или лабораторию.','plans.demo':'Демо-анализ','plans.democopy':'Загрузите серию и получите Word-отчёт с графиком и основными показателями.','plans.demoTag':'WORD-ФАЙЛ','plans.pilot':'Пилот лаборатории','plans.pilotcopy':'Проверим несколько серий, настроим рабочий сценарий и сверим результат с прибором.','plans.pilotTag':'ЗАПУСК','plans.team':'Доступ для команды','plans.teamcopy':'Доступ для класса, лаборатории или небольшой команды с общим рабочим процессом.','plans.teamTag':'ДЛЯ КОМАНДЫ',
    'limits.kicker':'ЧТО ВАЖНО УЧЕСТЬ','limits.title':'Чтобы результату можно было доверять','limits.copy':'Spectra помогает быстро увидеть динамику цвета. Для точного или официального измерения результат нужно подтвердить прибором.','limits.one':'Камера, расстояние и освещение должны оставаться одинаковыми.','limits.two':'Авто режим помогает начать, но не заменяет контроль эксперимента.','limits.three':'Перед публикацией, сертификацией или важным решением результат нужно сверить со спектрофотометром.','footer.ready':'Добавьте эксперимент, чтобы начать','footer.caption':'Доступный анализ образца',
    addPhotos:'＋ Добавить фотографии',demo:'Демо',demoName:'Демо-серия',seriesTitle:'Серия фотографий',seriesHint:'Минимум 2 кадра · одна сцена · одинаковое освещение.',validationHint:'Проверим формат, размер, одинаковую сцену и устойчивость сигнала.',noPhotos:'Нет фотографий',demoSynthetic:'Демо · синтетические данные',prev:'Предыдущее',next:'Следующее',play:'Пуск',pause:'Пауза',frame:'Кадр {n} из {total}',thumbCount:'← {middle} →\n{n} фото',analysisSettings:'Параметры анализа',interval:'Интервал между фото',channel:'Канал анализа',wavelength:'λ (нм):',threshold:'Настройка анализа',autoMode:'Авто режим',autoHint:'Авто режим выбирает канал, длину волны и порог. Интервал времени задаётся вами.',howCalculated:'Как это считается',rename:'Переименовать',delete:'Удалить эксперимент',viewOriginal:'Оригинал',viewMask:'Маска пятна',viewDetection:'Детекция',previewEyebrow:'ОТ СВЕТА К ДАННЫМ',previewHeading:'Образец под наблюдением',previewMode:'Режим просмотра',previewCaption:'Исходный кадр → выделение пятна → анализ',previewBrand:'Spectra / АНАЛИЗ',noSample:'Здесь появится ваш образец',noSampleHint:'Добавьте фотографии или откройте демо',metricK:'Константа k, с⁻¹',metricKNote:'Скорость изменения красителя',metricHalf:'Время t½',metricHalfNote:'Время снижения сигнала вдвое',ready:'Готово к анализу',loading:'Загрузка фотографий…',generating:'Генерация демо…',checking:'Проверка не пройдена',photoCount:'{n} фото',autoSelected:'Авто режим выбрал {label}.',experiment:'Эксперимент {n}',experimentPrefix:'Эксперимент №',notEnough:'Нужно ≥2 фото',noTrend:'Нет тренда',
    minFrames:'Для расчёта кинетики нужно минимум 2 фотографии одной серии.',imageTooSmall:'Изображения слишком маленькие. Нужны кадры минимум 160×120 px.',brightness:'Яркость',colorChannel:'Цветовой канал по λ',saturation:'Насыщенность'
  },
  en: {
    'header.caption':'IMAGE ANALYSIS','nav.workspace':'Analysis','nav.results':'Results','nav.method':'Demo report','nav.audience':'Who it is for','header.start':'Start analysis',
    'hero.eyebrow':'SPECTRA / IMAGE WORKSPACE','hero.title':'Color analysis <br><span>from photos</span>','hero.copy':'Upload a series of images, compare the change in color and get a first measurable result in your browser.','hero.start':'Start analysis','hero.upload':'Upload images','hero.meta1':'Input check included','hero.meta2':'Auto mode selects parameters','hero.meta3':'Compare the result with an instrument',
    'preview.label':'WORKSPACE PREVIEW','preview.demo':'DEMO','preview.sample':'ONE SAMPLE','preview.title':'Image series → result','preview.time':'6 frames · 10 min','preview.input':'INPUT','preview.series':'Image series','preview.scene':'one scene and same lighting','preview.check':'CHECK','preview.auto':'Auto mode','preview.signal':'signal and sample area','preview.output':'OUTPUT','preview.chart':'chart for comparing conditions','preview.firstResult':'First estimate','preview.pilot':'Pilot for a teaching lab',
    'workflow.upload':'Upload images','workflow.uploadNote':'Add a series of frames','workflow.compare':'Compare result','workflow.compareNote':'Original and processed','workflow.read':'Read the analysis','workflow.readNote':'Chart and measurable metrics',
    'analysis.kicker':'WORKSPACE / 01','analysis.title':'Sample analysis','analysis.note':'Demo or your own image series','output.kicker':'INTENSITY OVER TIME','output.title':'Color change over time','output.all':'ALL EXPERIMENTS','output.compare':'Compare results','table.number':'No.','table.experiment':'Experiment','table.k':'k, s⁻¹','table.half':'t₁/₂',
    'method.kicker':'DEMO REPORT','method.title':'Get the result as a Word file','method.copy':'Upload a photo series or open the demo. The result is a short report with a chart, metrics and method limits.','method.step1':'Upload a photo series','method.step1copy':'At least two frames of the same sample, one scene and a defined interval between images.','method.step2':'We check the series','method.step2copy':'The service checks the format, size, scene consistency and signal stability.','method.step3':'Get the calculation','method.step3copy':'Auto mode chooses parameters and calculates color dynamics, k and t½.','method.step4':'Download the Word report','method.step4copy':'Share the file with a teacher or lab lead, or use it to choose the next experiment.','method.input':'INPUT','method.check':'CHECK','method.signal':'CALCULATION','method.output':'REPORT','method.offerKicker':'DEMO REPORT','method.offerTitle':'The result arrives as a Word file','method.offerCopy':'The report includes a short conclusion, series parameters, chart, key metrics and method limits.','method.disclaimer':'This is a demo delivery for now. Real payment will be connected after the price and terms are fixed.','method.order':'Order a demo analysis','method.download':'Download a sample report','method.orderNote':'This button shows the demo flow: after receiving a photo series, the client gets a Word report. Real payment still needs a price and payment link.','method.close':'Close',
    'audience.kicker':'WHO NEEDS IT','audience.title':'When you need a quick first result','audience.copy':'Spectra helps check whether a sample is changing before taking time on an expensive instrument or repeating the experiment.','audience.schoollabel':'FOR TEACHING','audience.universitylabel':'FOR FIRST-PASS CHECKS','audience.userlabel':'FOR INDEPENDENT WORK','audience.school':'School or STEM center','audience.schoolcopy':'Demonstrations, lab classes and project work without a separate spectrophotometer.','audience.schooltag':'Teaching and projects','audience.university':'Teaching lab','audience.universitycopy':'Quickly compare a series and decide which experiment should be checked with a precise instrument.','audience.universitytag':'Pilot with real data','audience.rnd':'Student, teacher or pupil','audience.rndcopy':'Upload a photo series, check the input and get a first estimate of the color change.','audience.rndtag':'Clear workflow',
    'plans.kicker':'GET THE REPORT','plans.title':'Start with a demo, then scale to a team','plans.copy':'Begin with one demo analysis on a real photo series. If the workflow fits, connect a class or lab.','plans.demo':'Demo analysis','plans.democopy':'Upload a series and receive a Word report with a chart and key metrics.','plans.demoTag':'WORD FILE','plans.pilot':'Lab pilot','plans.pilotcopy':'Review several series, configure the workflow and compare the result with an instrument.','plans.pilotTag':'START PILOT','plans.team':'Team access','plans.teamcopy':'Access for a class, lab or small team with one shared workflow.','plans.teamTag':'FOR A TEAM',
    'limits.kicker':'WHAT TO KEEP IN MIND','limits.title':'What makes the result reliable','limits.copy':'Spectra helps you see color dynamics quickly. For precise or official measurement, confirm the result with an instrument.','limits.one':'Keep the camera, distance and lighting the same.','limits.two':'Auto mode helps you start, but does not replace experimental control.','limits.three':'Before publication, certification or an important decision, verify the result with a spectrophotometer.','footer.ready':'Add an experiment to begin','footer.caption':'Accessible sample analysis',
    addPhotos:'＋ Add images',demo:'Demo',demoName:'Demo series',seriesTitle:'Image series',seriesHint:'At least 2 frames · one scene · same lighting.',validationHint:'We check the format, size, scene consistency and signal stability.',noPhotos:'No images',demoSynthetic:'Demo · synthetic data',prev:'Previous',next:'Next',play:'Play',pause:'Pause',frame:'Frame {n} of {total}',thumbCount:'← {middle} →\n{n} images',analysisSettings:'Analysis settings',interval:'Time between images',channel:'Analysis channel',wavelength:'λ (nm):',threshold:'Analysis threshold',autoMode:'Auto mode',autoHint:'Auto mode selects the channel, wavelength and threshold. Set the time interval yourself.',howCalculated:'How it works',rename:'Rename',delete:'Delete experiment',viewOriginal:'Original',viewMask:'Spot mask',viewDetection:'Detection',previewEyebrow:'FROM LIGHT TO DATA',previewHeading:'Sample under observation',previewMode:'View mode',previewCaption:'Original frame → spot mask → analysis',previewBrand:'Spectra / ANALYSIS',noSample:'Your sample will appear here',noSampleHint:'Add images or open the demo',metricK:'Rate constant k, s⁻¹',metricKNote:'Colorant change rate',metricHalf:'Half-life t½',metricHalfNote:'Time for the signal to drop by half',ready:'Ready to analyze',loading:'Loading images…',generating:'Generating demo…',checking:'Input check failed',photoCount:'{n} images',autoSelected:'Auto mode selected {label}.',experiment:'Experiment {n}',experimentPrefix:'Experiment no.',notEnough:'Need ≥2 images',noTrend:'No trend',minFrames:'Kinetics requires at least two images from one series.',imageTooSmall:'Images are too small. Frames must be at least 160×120 px.',brightness:'Brightness',colorChannel:'Color channel by λ',saturation:'Saturation'
  }
};
I18N.ru['method.disclaimer'] = 'Сначала посмотрите пример отчёта, затем закажите анализ своей серии.';
I18N.ru['method.orderNote'] = 'После получения серии фотографий вы получите Word-отчёт с графиком и основными показателями.';
I18N.en['method.disclaimer'] = 'View the sample report first, then order an analysis of your own series.';
I18N.en['method.orderNote'] = 'After receiving your photo series, you will get a Word report with a chart and key metrics.';
I18N.ru['deleteConfirm'] = 'Удалить «{name}»?';
I18N.en['deleteConfirm'] = 'Delete “{name}”?';
I18N.ru['needMoreFrames'] = 'Добавьте ещё одну фотографию этой серии.';
I18N.en['needMoreFrames'] = 'Add one more photo from the same series.';
I18N.ru['frameQueueTitle'] = 'Кадры серии';
I18N.en['frameQueueTitle'] = 'Series frames';
I18N.ru['frameQueueCount'] = '{n} фото · порядок используется в расчёте';
I18N.en['frameQueueCount'] = '{n} images · this order is used for analysis';
I18N.ru['frameMoveLeft'] = 'Переместить кадр левее';
I18N.en['frameMoveLeft'] = 'Move frame left';
I18N.ru['frameMoveRight'] = 'Переместить кадр правее';
I18N.en['frameMoveRight'] = 'Move frame right';
I18N.ru['frameRemove'] = 'Удалить кадр';
I18N.en['frameRemove'] = 'Remove frame';
Object.assign(I18N.ru, {
  validationHint: 'Проверим, что сцена совпадает и область образца заметно меняется.',
  flatFrame: 'Среди кадров есть однотонное изображение или кадр без различимых деталей.',
  shapeMismatch: 'Пропорции кадров различаются. Выберите исходные фото одной серии без обрезки.',
  differentScene: 'Сцена или ракурс меняются между кадрами. Выберите фото одного образца, снятые с неподвижной камеры.',
  noLocalSignal: 'Изменение в области образца слишком слабое. Выберите кадры с различимым изменением цвета или яркости при одинаковом освещении.',
  unreadablePhotos: 'Не удалось открыть «{name}». Проверьте файл или сохраните его в JPG, PNG или WebP.',
  rejectedPhotos: 'Серия не добавлена. {reason}',
});
Object.assign(I18N.en, {
  validationHint: 'We check that the scene matches and that the sample area visibly changes.',
  flatFrame: 'One of the frames is a solid color or has no discernible detail.',
  shapeMismatch: 'The frames have different proportions. Choose uncropped photos from one series.',
  differentScene: 'The scene or camera angle changes between frames. Choose photos of one sample taken with a fixed camera.',
  noLocalSignal: 'The change in the sample area is too weak. Choose frames with a discernible change in color or brightness under consistent lighting.',
  unreadablePhotos: 'Could not open “{name}”. Check the file or save it as JPG, PNG, or WebP.',
  rejectedPhotos: 'Series rejected. {reason}',
});
let currentLang = localStorage.getItem('spectra-lang') === 'en' ? 'en' : 'ru';
function tr(key, vars = {}) {
  let value = (I18N[currentLang] && I18N[currentLang][key]) || I18N.ru[key] || key;
  return String(value).replace(/\{(\w+)\}/g, (_, name) => vars[name] === undefined ? `{${name}}` : vars[name]);
}
function applyStaticI18n() {
  document.documentElement.lang = currentLang;
  document.title = currentLang === 'en' ? 'Spectra — accessible color-change analysis' : 'Spectra — доступный анализ изменения цвета';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = tr(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = tr(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-lang]').forEach((el) => el.classList.toggle('active', el.dataset.lang === currentLang));
}
window.SpectraI18n = { get lang() { return currentLang; }, set(lang) { currentLang = lang === 'en' ? 'en' : 'ru'; localStorage.setItem('spectra-lang', currentLang); applyStaticI18n(); window.__app && window.__app.retranslate && window.__app.retranslate(); } };

function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k];
    if (v === null || v === undefined) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}

/* ============================ dialogs ============================ */
function dialog({ icon, text, input, buttons }) {
  return new Promise((resolve) => {
    const m = $('#modal'), prevFocus = document.activeElement;
    const le = input !== undefined ? h('input', { class: 'le', type: 'text', value: input, spellcheck: 'false' }) : null;
    const finish = (v) => {
      document.removeEventListener('keydown', onKey, true);
      m.classList.remove('on'); m.textContent = '';
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      resolve(v);
    };
    const val = (b) => (le && b.value === 'ok' ? le.value : b.value);
    const btnEls = buttons.map((b, i) => h('button', {
      class: 'q' + (i === buttons.length - 1 ? ' def' : ''), type: 'button', onclick: () => finish(val(b)),
    }, b.label));
    const dlg = h('div', { class: 'dlg', role: 'dialog', 'aria-modal': 'true' },
      h('div', { class: 'body' },
        icon ? h('div', { class: 'ic' }, icon) : null,
        h('div', { class: 'tx' }, h('div', null, text), le)),
      h('div', { class: 'btns' }, btnEls));
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); finish(buttons[0].value === 'ok' ? null : buttons[0].value); }
      else if (e.key === 'Enter' && document.activeElement !== btnEls[0] ) {
        e.preventDefault(); finish(val(buttons[buttons.length - 1]));
      } else if (e.key === 'Tab') {
        const f = [...dlg.querySelectorAll('input,button')], i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      }
      e.stopPropagation();
    }
    m.textContent = ''; m.append(dlg); m.classList.add('on');
    document.addEventListener('keydown', onKey, true);
    (le || btnEls[btnEls.length - 1]).focus();
    if (le) le.select();
  });
}
const alertBox = (text) => ($('#modal').classList.contains('on') ? Promise.resolve(true)
  : dialog({ icon: '⚠️', text, buttons: [{ label: 'OK', value: true }] }));
const confirmBox = (text) => dialog({
  icon: '❔', text, buttons: [{ label: 'Отмена', value: false }, { label: 'Удалить', value: true }],
});
const promptBox = (text, init) => dialog({
  text, input: init, buttons: [{ label: 'Отмена', value: null }, { label: 'OK', value: 'ok' }],
});

/* ============================ widgets ============================ */
class Viewer {
  constructor() {
    this.el = h('div', { class: 'viewer' });
    this.cv = h('canvas');
    this.el.append(this.cv);
    this.ctx = this.cv.getContext('2d');
    this.buf = document.createElement('canvas');
    this.bctx = this.buf.getContext('2d');
    this.has = false; this.id = null;
    new ResizeObserver(() => this.paint()).observe(this.el);
  }
  setSize(w, hh) { this.el.style.width = w + 'px'; this.el.style.height = hh + 'px'; }
  setFrame(fr) {
    if (!fr.id) fr.id = new ImageData(fr.rgba, fr.w, fr.h);
    this.id = null;
    this.buf.width = fr.w; this.buf.height = fr.h;
    this.bctx.putImageData(fr.id, 0, 0);
    this.has = true; this.paint();
  }
  data(w, hh) {
    if (!this.id || this.id.width !== w || this.id.height !== hh) {
      this.id = new ImageData(w, hh); this.buf.width = w; this.buf.height = hh;
    }
    return this.id.data;
  }
  commit() { this.bctx.putImageData(this.id, 0, 0); this.has = true; this.paint(); }
  clear() { this.has = false; this.paint(); }
  paint() {
    const W = this.el.clientWidth, H = this.el.clientHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1, pw = Math.round(W * dpr), ph = Math.round(H * dpr);
    if (this.cv.width !== pw || this.cv.height !== ph) { this.cv.width = pw; this.cv.height = ph; }
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, pw, ph);
    if (!this.has) return;
    const s = Math.min(pw / this.buf.width, ph / this.buf.height);
    const dw = Math.round(this.buf.width * s), dh = Math.round(this.buf.height * s);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.buf, (pw - dw) >> 1, (ph - dh) >> 1, dw, dh);
  }
}

class Spin {
  constructor(o) {
    this.min = o.min; this.max = o.max; this.dec = o.dec; this.suffix = o.suffix || '';
    this.step = o.step || 1; this.cb = o.onChange || (() => {}); this._v = o.value;
    this.inp = h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', 'aria-label': o.label || '' });
    const up = h('button', { type: 'button', tabindex: '-1', 'aria-label': '+' }, '▲');
    const dn = h('button', { type: 'button', tabindex: '-1', 'aria-label': '−' }, '▼');
    this.buttons = [up, dn];
    this.el = h('div', { class: 'spin' }, this.inp, h('div', { class: 'sb' }, up, dn));
    this.show();
    this.inp.addEventListener('focus', () => setTimeout(() => this.inp.select(), 0));
    this.inp.addEventListener('blur', () => this.commit());
    this.inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { this.commit(); this.inp.select(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.bump(1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); this.bump(-1); }
      e.stopPropagation();
    });
    this.hold(up, 1); this.hold(dn, -1);
  }
  hold(btn, dir) {
    let t1, t2;
    const stop = () => { clearTimeout(t1); clearInterval(t2); };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault(); this.bump(dir); stop();
      t1 = setTimeout(() => { t2 = setInterval(() => this.bump(dir), 60); }, 400);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
  }
  clampv(v) { return +clamp(v, this.min, this.max).toFixed(this.dec); }
  show() { this.inp.value = this._v.toFixed(this.dec) + this.suffix; }
  get value() { return this._v; }
  set(v, emit) {
    const nv = this.clampv(v), ch = nv !== this._v;
    this._v = nv; this.show();
    if (emit && ch) this.cb(nv);
  }
  setDisabled(disabled) {
    this.inp.disabled = disabled;
    this.buttons.forEach((button) => { button.disabled = disabled; });
    this.el.classList.toggle('disabled', disabled);
  }
  commit() {
    const t = parseFloat(this.inp.value.replace(',', '.'));
    if (isNaN(t)) { this.show(); return; }
    this.set(t, true); this.show();
  }
  bump(d) { this.commit(); this.set(this._v + d * this.step, true); }
}

/* ============================ image loading ============================ */
async function loadFrame(file) {
  let src, w, hh, close = () => {};
  try {
    const bmp = await createImageBitmap(file);
    src = bmp; w = bmp.width; hh = bmp.height; close = () => bmp.close && bmp.close();
  } catch (e) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      src = img; w = img.naturalWidth; hh = img.naturalHeight;
    } finally { URL.revokeObjectURL(url); }
  }
  const s = Math.min(1, MAXSIDE / Math.max(w, hh));
  const cw = Math.max(1, Math.round(w * s)), ch = Math.max(1, Math.round(hh * s));
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cw, ch);
  ctx.imageSmoothingQuality = 'high'; ctx.drawImage(src, 0, 0, cw, ch);
  close();
  return C.makeFrame(cw, ch, ctx.getImageData(0, 0, cw, ch).data);
}
function resized(fr, w, hh) {
  if (fr.w === w && fr.h === hh) return fr;
  if (fr._rs && fr._rs.w === w && fr._rs.h === hh) return fr._rs;
  const a = document.createElement('canvas'); a.width = fr.w; a.height = fr.h;
  a.getContext('2d').putImageData(new ImageData(fr.rgba, fr.w, fr.h), 0, 0);
  const b = document.createElement('canvas'); b.width = w; b.height = hh;
  const bc = b.getContext('2d', { willReadFrequently: true });
  bc.imageSmoothingQuality = 'high'; bc.drawImage(a, 0, 0, w, hh);
  fr._rs = C.makeFrame(w, hh, bc.getImageData(0, 0, w, hh).data);
  return fr._rs;
}

/* ============================ experiment ============================ */
const CH_ITEMS = ['Яркость', 'Цветовой канал по λ', 'Насыщенность'];

class Experiment {
  constructor() {
    this.custom = ''; this.frames = []; this.k = null; this.tHalf = null;
    this.times = []; this.norm = []; this.pidx = 0; this.autoThr = null; this.timer = null; this.demoIdx = 0; this.isDemo = false; this.autoMode = true; this.autoChoice = null;
    this.raf = 0;
    this.seriesCheck = 'needMoreFrames';
    this.loadingPhotos = false;
    this.importIssue = null;
    this.build();
  }
  build() {
    const E = this;
    E.file = h('input', { type: 'file', multiple: '', accept: 'image/*,.tif,.tiff', hidden: '' });
    E.file.addEventListener('change', () => { const f = [...E.file.files]; E.file.value = ''; E.addFiles(f); });
    E.btnAdd = h('button', { class: 'q accent', type: 'button', onclick: () => E.file.click() }, tr('addPhotos'));
    E.btnDemo = h('button', { class: 'q', type: 'button', title: tr('demo'), onclick: () => E.demo() }, tr('demo'));

    E.tf = new Viewer(); E.tl = new Viewer();
    E.cnt = h('div', { class: 'cnt' });
    E.bp = h('button', { class: 'q', type: 'button', 'aria-label': tr('prev'), onclick: () => E.nav(-1) }, '◀');
    E.bn = h('button', { class: 'q', type: 'button', 'aria-label': tr('next'), onclick: () => E.nav(1) }, '▶');
    E.bPlay = h('button', { class: 'q', type: 'button', 'aria-label': tr('play'), onclick: () => E.togglePlay() }, '⏵');
    E.lblNav = h('div', { class: 'lbl' }, tr('frame', { n: '—', total: '—' }));

    E.spinDt = new Spin({ min: 0.1, max: 1e8, value: 60, dec: 1, suffix: ' с', step: 1, label: 'Δt', onChange: () => E.runIfReady() });
    E.sel = h('select', { class: 'q grow', 'aria-label': tr('channel') }, [tr('brightness'), tr('colorChannel'), tr('saturation')].map((t, i) => h('option', { value: i }, t)));
    E.chOptions = [...E.sel.options];
    E.sel.addEventListener('change', () => E.onCh());
    E.spinWl = new Spin({ min: 300, max: 850, value: 440, dec: 0, suffix: ' нм', step: 1, label: 'λ', onChange: () => E.onWl() });
    E.sw = h('span', { class: 'sw' }, '■');
    E.warn = h('span', { class: 'warn' });
    E.wlLabel = h('span', null, tr('wavelength'));
    E.wlRow = h('div', { class: 'row wlrow' }, E.wlLabel, E.spinWl.el, E.sw, E.warn);
    E.rng = h('input', { class: 'rng grow', type: 'range', min: 1, max: 500, value: 50, 'aria-label': 'Порог OD' });
    E.rng.addEventListener('input', () => E.onThr());
    E.rng.addEventListener('change', () => E.onThrRelease());
    E.tv = h('span', { class: 'tv' }, '0.050');
    E.chkIn = h('input', { type: 'checkbox', checked: '', 'aria-label': 'Авто режим' });
    E.chkIn.addEventListener('change', () => E.onAuto(E.chkIn.checked));
    E.autoText = h('span', null, tr('autoMode'));
    E.chk = h('label', { class: 'chk' }, E.chkIn, h('span', { class: 'bx' }), E.autoText);
    E.rng.disabled = true; E.setRng(50);

    E.lblK = h('span', { class: 'result' }, '—');
    E.lblTh = h('span', { class: 'result' }, '—');
    E.info = h('div', { class: 'sci' });
    E.btnDel = h('button', { class: 'q danger', type: 'button', onclick: () => App.del(E) }, tr('delete'));

    E.sourceBadge = h('span', { class: 'tag' }, tr('noPhotos'));
    E.quality = h('p', { class: 'hint quality-note', role: 'status', hidden: '' });
    E.importStatus = h('p', { class: 'hint quality-note', role: 'status', hidden: '' });
    E.uploadTitle = h('span', null, tr('seriesTitle'));
    E.seriesHint = h('p', { class: 'hint' }, tr('seriesHint'));
    E.validationHint = h('p', { class: 'hint validation-hint' }, tr('validationHint'));
    E.frameQueue = h('div', { class: 'frame-queue', hidden: '' });
    const upload = h('section', { class: 'upload-card', id: 'upload-card' }, E.file,
      h('div', { class: 'upload-heading' }, h('span', { class: 'step' }, '01'), E.uploadTitle, E.sourceBadge),
      h('div', { class: 'addrow' }, E.btnAdd),
      E.seriesHint, E.validationHint, E.importStatus, E.quality, E.frameQueue);
    const frames = h('section', { class: 'frames-card' },
      h('div', { class: 'thumbs' }, E.tf.el, E.cnt, E.tl.el),
      h('div', { class: 'nav' }, E.bp, E.lblNav, E.bn, E.bPlay));
    E.settingsTitle = h('span', null, tr('analysisSettings'));
    E.dtLabel = h('span', null, tr('interval'));
    E.channelLabel = h('span', null, tr('channel'));
    E.thresholdLabel = h('span', null, tr('threshold'));
    E.autoHint = h('p', { class: 'hint' }, tr('autoHint'));
    const settings = h('details', { class: 'grp settings', open: '' },
      h('summary', null, h('span', { class: 'step' }, '02'), E.settingsTitle),
      h('div', { class: 'col' },
        h('div', { class: 'row' }, E.dtLabel, E.spinDt.el),
        h('div', { class: 'row' }, E.channelLabel, E.sel), E.wlRow,
        h('div', { class: 'row threshold-row' }, E.thresholdLabel, E.tv, E.chk, E.rng), E.autoHint));
    E.scienceTitle = h('span', null, tr('howCalculated'));
    E.scienceHint = h('p', { class: 'hint' }, currentLang === 'en' ? 'Use the same lighting and camera settings for every frame. A wavelength channel selects R, G or B; this is not a spectral measurement.' : 'Снимайте при одинаковом освещении и настройках камеры. Цветовой канал по λ выбирает R, G или B; это не спектральное измерение.');
    const science = h('details', { class: 'grp science' }, h('summary', null, E.scienceTitle),
      h('div', { class: 'col' }, ['A = −log₁₀(I/I₀)', 'I₀ — 95-й перцентиль яркости фона и образца',
        'ln(⟨A⟩(t)/⟨A⟩(0)) = −k·t', 't₁/₂ = ln(2)/k'].map(t => h('div', { class: 'formula-l' }, t)),
        E.scienceHint));
    E.metricKLabel = h('span', { class: 'metric-label' }, tr('metricK'));
    E.metricKNote = h('span', { class: 'metric-note' }, tr('metricKNote'));
    E.metricHalfLabel = h('span', { class: 'metric-label' }, tr('metricHalf'));
    E.metricHalfNote = h('span', { class: 'metric-note' }, tr('metricHalfNote'));
    const metrics = h('div', { class: 'results', 'aria-label': tr('analysisSettings') },
      h('div', { class: 'metric' }, E.metricKLabel, E.lblK, E.metricKNote),
      h('div', { class: 'metric' }, E.metricHalfLabel, E.lblTh, E.metricHalfNote));
    E.renameButton = h('button', { class: 'q text-button', type: 'button', onclick: () => App.rename(App.exps.indexOf(E)) }, tr('rename'));
    const actions = h('div', { class: 'experiment-actions' }, E.renameButton, E.btnDel);
    const left = h('div', { class: 'left' }, upload, metrics, frames, settings, science, actions);

    E.vo = new Viewer(); E.vm = new Viewer(); E.vr = new Viewer();
    E.vo.el.classList.add('active');
    const viewers = [E.vo, E.vm, E.vr];
    const modeKeys = ['viewOriginal', 'viewMask', 'viewDetection'];
    const modes = modeKeys.map((key) => tr(key));
    const modeButtons = modes.map((name, i) => h('button', {
      class: 'preview-mode' + (i === 0 ? ' active' : ''), type: 'button', 'aria-pressed': String(i === 0),
      onclick: () => {
        viewers.forEach((v, j) => { v.el.classList.toggle('active', j === i); v.paint(); });
        modeButtons.forEach((btn, j) => { btn.classList.toggle('active', j === i); btn.setAttribute('aria-pressed', String(j === i)); });
      },
    }, name));
    E.emptyTitle = h('strong', null, tr('noSample'));
    E.emptyHint = h('span', null, tr('noSampleHint'));
    E.previewEmpty = h('div', { class: 'preview-empty' }, h('span', { 'aria-hidden': 'true' }, '◎'), E.emptyTitle, E.emptyHint);
    E.previewEyebrow = h('span', { class: 'eyebrow' }, tr('previewEyebrow'));
    E.previewHeading = h('h2', null, tr('previewHeading'));
    E.previewCaption = h('span', null, tr('previewCaption'));
    E.previewBrand = h('span', null, tr('previewBrand'));
    const prev = h('section', { class: 'prev' },
      h('div', { class: 'preview-heading' }, h('div', null, E.previewEyebrow, E.previewHeading), h('span', { class: 'live-dot', 'aria-hidden': 'true' })),
      h('div', { class: 'preview-modes', 'aria-label': tr('previewMode') }, modeButtons),
      h('div', { class: 'preview-stage' }, E.vo.el, E.vm.el, E.vr.el, E.previewEmpty),
      h('div', { class: 'preview-caption' }, E.previewCaption, E.previewBrand),
      E.info);
    E.modeButtons = modeButtons;
    E.previewModes = prev.querySelector('.preview-modes');
    E.root = h('div', { class: 'exp-root', role: 'tabpanel' }, left, prev);
    E.updWl();
    E.setModeUi(true);
    E.modeButtons.slice(1).forEach((button) => { button.disabled = true; });
  }

  retranslate() {
    this.btnAdd.textContent = tr('addPhotos');
    if (this.btnDemo) { this.btnDemo.textContent = tr('demo'); this.btnDemo.title = tr('demo'); }
    this.bp.setAttribute('aria-label', tr('prev'));
    this.bn.setAttribute('aria-label', tr('next'));
    this.bPlay.setAttribute('aria-label', this.timer ? tr('pause') : tr('play'));
    this.autoText.textContent = tr('autoMode');
    this.uploadTitle.textContent = tr('seriesTitle');
    this.seriesHint.textContent = tr('seriesHint');
    this.validationHint.textContent = tr('validationHint');
    this.sourceBadge.textContent = this.isDemo ? tr('demoSynthetic') : (this.frames.length ? tr('photoCount', { n: this.frames.length }) : tr('noPhotos'));
    this.settingsTitle.textContent = tr('analysisSettings');
    this.dtLabel.textContent = tr('interval');
    this.channelLabel.textContent = tr('channel');
    this.thresholdLabel.textContent = tr('threshold');
    this.wlLabel.textContent = tr('wavelength');
    this.spinDt.suffix = currentLang === 'en' ? ' s' : ' с';
    this.spinWl.suffix = currentLang === 'en' ? ' nm' : ' нм';
    this.spinDt.show();
    this.spinWl.show();
    this.sel.setAttribute('aria-label', tr('channel'));
    [tr('brightness'), tr('colorChannel'), tr('saturation')].forEach((label, i) => { if (this.chOptions[i]) this.chOptions[i].textContent = label; });
    this.autoHint.textContent = tr('autoHint');
    this.scienceTitle.textContent = tr('howCalculated');
    this.scienceHint.textContent = currentLang === 'en' ? 'Use the same lighting and camera settings for every frame. A wavelength channel selects R, G or B; this is not a spectral measurement.' : 'Снимайте при одинаковом освещении и настройках камеры. Цветовой канал по λ выбирает R, G или B; это не спектральное измерение.';
    this.previewModes.setAttribute('aria-label', tr('previewMode'));
    this.metricKLabel.textContent = tr('metricK');
    this.metricKNote.textContent = tr('metricKNote');
    this.metricHalfLabel.textContent = tr('metricHalf');
    this.metricHalfNote.textContent = tr('metricHalfNote');
    this.renameButton.textContent = tr('rename');
    this.btnDel.textContent = tr('delete');
    this.emptyTitle.textContent = tr('noSample');
    this.emptyHint.textContent = tr('noSampleHint');
    this.previewEyebrow.textContent = tr('previewEyebrow');
    this.previewHeading.textContent = tr('previewHeading');
    this.previewCaption.textContent = tr('previewCaption');
    this.previewBrand.textContent = tr('previewBrand');
    this.modeButtons.forEach((button, i) => { button.textContent = tr(['viewOriginal', 'viewMask', 'viewDetection'][i]); });
    this.renderImportStatus();
    this.renderCheck();
    this.renderFrameQueue();
    if (this.frames.length) { this.updThumbs(); this.updPrev(); }
    if (this.tHalf !== null) this.lblTh.textContent = currentLang === 'en' ? C.fmtHalf(this.tHalf).replace('мин', 'min') : C.fmtHalf(this.tHalf);
  }

  /* ---- helpers ---- */
  get chIdx() { return +this.sel.value; }
  get auto() { return this.chkIn.checked; }
  setRng(v) { this.rng.value = v; this.rng.style.setProperty('--p', ((v - 1) / 499 * 100) + '%'); }
  wlOut() { const wl = this.spinWl.value; return wl < 380 || wl > 750; }
  chParams() {
    const i = this.chIdx;
    if (i === 0) return ['gray', 0];
    if (i === 1) return this.wlOut() ? null : ['bgr', C.wavelengthToBgrIndex(this.spinWl.value)];
    return ['saturation', 0];
  }
  applyParams(p) {
    this.spinDt.set(p.dt, false); this.sel.value = String(p.ch); this.spinWl.set(p.wl, false);
    this.chkIn.checked = true; this.autoMode = true; this.setModeUi(true); this.setRng(50); this.tv.textContent = '0.050';
    this.wlRow.classList.toggle('on', p.ch === 1); this.updWl();
  }

  setModeUi(auto) {
    this.autoMode = auto;
    this.rng.disabled = auto;
    this.sel.disabled = auto;
    this.spinWl.setDisabled(auto);
    this.wlRow.classList.toggle('auto-locked', auto);
  }

  renderImportStatus() {
    const issue = this.importIssue;
    const text = this.loadingPhotos ? tr('loading') : issue ? tr('rejectedPhotos', { reason: tr(issue.key, issue.vars) }) : '';
    this.importStatus.textContent = text;
    this.importStatus.hidden = !text;
    this.importStatus.classList.toggle('quality-error', !this.loadingPhotos && !!issue);
  }

  renderCheck() {
    let text = '';
    if (this.frames.length && this.seriesCheck) text = tr(this.seriesCheck);
    else if (this.autoChoice) text = tr('autoSelected', { label: this.autoChoice[currentLang] });
    this.quality.textContent = text;
    this.quality.hidden = !text;
    this.quality.classList.toggle('quality-error', !!this.seriesCheck && this.seriesCheck !== 'needMoreFrames');
  }

  updateSeriesCheck() {
    this.seriesCheck = this.isDemo && this.frames.length >= 2 ? '' : C.checkPhotoSeries(this.frames);
    this.renderCheck();
  }

  renderFrameQueue() {
    const queue = this.frameQueue;
    queue.textContent = '';
    queue.hidden = !this.frames.length;
    if (!this.frames.length) return;
    const head = h('div', { class: 'frame-queue-head' },
      h('strong', null, tr('frameQueueTitle')),
      h('span', null, tr('frameQueueCount', { n: this.frames.length })));
    const grid = h('div', { class: 'frame-queue-grid' });
    this.frames.forEach((fr, i) => {
      const canvas = h('canvas', { class: 'frame-thumb', width: '112', height: '76' });
      if (!fr.id) fr.id = new ImageData(fr.rgba, fr.w, fr.h);
      const buffer = document.createElement('canvas');
      buffer.width = fr.w; buffer.height = fr.h;
      buffer.getContext('2d').putImageData(fr.id, 0, 0);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f1f3f8'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(buffer, 0, 0, canvas.width, canvas.height);
      const left = h('button', { type: 'button', class: 'frame-action', 'aria-label': tr('frameMoveLeft'), title: tr('frameMoveLeft'), onclick: () => this.moveFrame(i, i - 1) }, '←');
      const right = h('button', { type: 'button', class: 'frame-action', 'aria-label': tr('frameMoveRight'), title: tr('frameMoveRight'), onclick: () => this.moveFrame(i, i + 1) }, '→');
      left.disabled = i === 0;
      right.disabled = i === this.frames.length - 1;
      const remove = h('button', { type: 'button', class: 'frame-action remove', 'aria-label': tr('frameRemove'), title: tr('frameRemove'), onclick: () => this.removeFrame(i) }, '×');
      grid.append(h('article', { class: 'frame-item' }, canvas, h('span', { class: 'frame-index' }, String(i + 1).padStart(2, '0')), h('div', { class: 'frame-actions' }, left, right, remove)));
    });
    queue.append(head, grid);
  }

  moveFrame(from, to) {
    if (to < 0 || to >= this.frames.length) return;
    const [frame] = this.frames.splice(from, 1);
    this.frames.splice(to, 0, frame);
    this.pidx = clamp(this.pidx, 0, this.frames.length - 1);
    this.autoThr = null;
    this.updateSeriesCheck();
    this.renderFrameQueue(); this.updThumbs(); this.run();
  }

  removeFrame(index) {
    if (index < 0 || index >= this.frames.length) return;
    this.frames.splice(index, 1);
    this.pidx = clamp(this.pidx, 0, Math.max(0, this.frames.length - 1));
    this.autoThr = null;
    this.sourceBadge.textContent = this.isDemo ? tr('demoSynthetic') : (this.frames.length ? tr('photoCount', { n: this.frames.length }) : tr('noPhotos'));
    this.sourceBadge.classList.toggle('demo-badge', this.isDemo && this.frames.length > 0);
    this.previewEmpty.hidden = !!this.frames.length;
    this.updateSeriesCheck();
    this.renderFrameQueue();
    if (this.frames.length) this.updThumbs();
    else { this.tf.clear(); this.tl.clear(); this.lblNav.textContent = tr('frame', { n: '—', total: '—' }); this.info.textContent = ''; }
    this.run();
  }

  /* ---- events ---- */
  async addFiles(files) {
    if (!files.length || this.loadingPhotos) return;
    this.loadingPhotos = true;
    this.btnAdd.disabled = true;
    this.importIssue = null;
    this.renderImportStatus();
    try {
      const ordered = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      const frames = [];
      for (const file of ordered) {
        try {
          if (!/^image\//.test(file.type) && !/\.(png|jpe?g|bmp|tiff?|webp)$/i.test(file.name)) throw new TypeError();
          frames.push(await loadFrame(file));
        } catch {
          this.importIssue = { key: 'unreadablePhotos', vars: { name: file.name } };
          return;
        }
        if (!this.root.isConnected) return;
      }
      const replacingDemo = this.isDemo;
      const combined = replacingDemo ? frames : [...this.frames, ...frames];
      const check = C.checkPhotoSeries(combined);
      if (check && check !== 'needMoreFrames') {
        this.importIssue = { key: check };
        return;
      }
      if (replacingDemo) this.custom = '';
      this.isDemo = false;
      this.setFrames(combined);
      if (replacingDemo) App.renderTabs();
    } finally {
      this.loadingPhotos = false;
      this.btnAdd.disabled = false;
      this.renderImportStatus();
    }
  }
  async demo() {
    if (this.loadingPhotos) return;
    this.importIssue = null; this.renderImportStatus();
    const def = C.DEMOS[this.demoIdx++ % C.DEMOS.length];
    App.status(tr('generating')); if (this.btnDemo) this.btnDemo.disabled = true;
    await tick();
    const frames = C.renderDemo(def);
    if (this.btnDemo) this.btnDemo.disabled = false; App.status(STATUS_IDLE);
    if (!this.custom) this.custom = def.name;
    this.applyParams({ dt: def.dt, ch: def.ch, wl: def.wl });
    this.isDemo = true; this.setFrames(frames);
    App.renderTabs();
  }
  setFrames(frames) {
    this.stop(); this.frames = frames; this.pidx = 0; this.autoThr = null; this.autoChoice = null;
    this.updateSeriesCheck();
    this.sourceBadge.textContent = this.isDemo ? tr('demoSynthetic') : tr('photoCount', { n: frames.length });
    this.sourceBadge.classList.toggle('demo-badge', this.isDemo);
    this.previewEmpty.hidden = !!frames.length;
    this.renderFrameQueue();
    this.updThumbs();
    if (this.autoMode && !this.isDemo) this.autoTune();
    this.run();
  }
  updThumbs() {
    if (!this.frames.length) return;
    const a = this.frames[0], b = this.frames[this.frames.length - 1], hh = 90;
    const w = Math.max(110, Math.trunc(hh * Math.max(a.w / a.h, b.w / b.h)) + 12);
    this.tf.setSize(w, hh); this.tl.setSize(w, hh);
    this.tf.setFrame(a); this.tl.setFrame(b);
    const n = this.frames.length;
    this.cnt.textContent = tr('thumbCount', { middle: Math.max(0, n - 2), n });
  }
  nav(d) {
    if (!this.frames.length) return;
    this.pidx = clamp(this.pidx + d, 0, this.frames.length - 1);
    this.updPrev(); App.plot.draw();
  }
  togglePlay() {
    if (this.timer) { this.stop(); return; }
    if (this.frames.length < 2) return;
    this.bPlay.textContent = '⏸'; this.bPlay.setAttribute('aria-label', tr('pause'));
    if (this.pidx >= this.frames.length - 1) this.pidx = -1;
    const step = () => {
      this.pidx = (this.pidx + 1) % this.frames.length;
      this.updPrev(); App.plot.draw();
    };
    step();
    this.timer = setInterval(step, 520);
  }
  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.bPlay.textContent = '⏵'; this.bPlay.setAttribute('aria-label', tr('play'));
  }

  autoTune() {
    if (this.seriesCheck) return;
    const candidates = [
      { ch: 0, wl: 540, label: { ru: 'яркость', en: 'brightness' } },
      { ch: 1, wl: 450, label: { ru: 'синий канал', en: 'the blue channel' } },
      { ch: 1, wl: 540, label: { ru: 'зелёный канал', en: 'the green channel' } },
      { ch: 1, wl: 660, label: { ru: 'красный канал', en: 'the red channel' } },
      { ch: 2, wl: 540, label: { ru: 'насыщенность', en: 'saturation' } },
    ];
    const scored = candidates.map((candidate) => {
      const cp = candidate.ch === 0 ? ['gray', 0] : candidate.ch === 1 ? ['bgr', C.wavelengthToBgrIndex(candidate.wl)] : ['saturation', 0];
      const values = this.frames.map((fr) => C.seriesValue(C.analyze(fr, cp[0], cp[1], 0, true)));
      const first = values[0], last = values[values.length - 1];
      const drop = first > 1e-8 ? (first - last) / first : -1;
      let stable = 0;
      for (let i = 1; i < values.length; i++) if (values[i] <= values[i - 1] * 1.08) stable++;
      const monotonic = stable / Math.max(1, values.length - 1);
      return { ...candidate, score: Math.max(0, drop) * 0.7 + monotonic * 0.3 };
    }).sort((a, b) => b.score - a.score)[0];
    this.sel.value = String(scored.ch);
    this.spinWl.set(scored.wl, false);
    this.wlRow.classList.toggle('on', scored.ch === 1);
    this.updWl();
    this.autoThr = null;
    this.setAutoThreshold();
    this.autoChoice = scored.label;
    this.renderCheck();
  }

  onCh() {
    const i = this.chIdx;
    this.wlRow.classList.toggle('on', i === 1);
    if (this.frames.length) {
      if (i === 1 && this.wlOut()) { alertBox(`λ=${this.spinWl.value.toFixed(0)} нм вне спектра!`); return; }
      if (this.auto) this.setAutoThreshold();
      this.updPrev(); this.runIfReady();
    }
  }
  onWl() {
    this.updWl();
    if (this.frames.length) {
      if (this.chIdx === 1 && this.wlOut()) { alertBox(`λ=${this.spinWl.value.toFixed(0)} нм вне спектра!`); return; }
      if (this.auto) this.setAutoThreshold();
      this.updPrev(); this.runIfReady();
    }
  }
  updWl() {
    const wl = this.spinWl.value;
    if (wl < 380 || wl > 750) {
      this.warn.textContent = '⚠ Вне спектра!'; this.sw.style.color = '#808080';
    } else {
      this.warn.textContent = '';
      const [r, g, b] = C.wavelengthToRgb(wl);
      this.sw.style.color = `rgb(${r},${g},${b})`;
    }
  }
  onThr() {
    const v = +this.rng.value;
    this.tv.textContent = (v / 1000).toFixed(3);
    this.setRng(v);
    if (!this.auto && this.frames.length && !this.raf) {
      this.raf = requestAnimationFrame(() => { this.raf = 0; this.updPrev(); });
    }
  }
  onThrRelease() { if (!this.auto) this.runIfReady(); }
  onAuto(checked) {
    this.setModeUi(checked);
    if (this.frames.length) {
      if (checked) this.autoTune();
      else { this.autoThr = null; this.autoChoice = null; this.renderCheck(); }
      this.updPrev(); this.runIfReady();
    }
  }
  runIfReady() { if (this.frames.length > 1) this.run(); }

  /* ---- analysis ---- */
  setAutoThreshold() {
    if (this.seriesCheck) return;
    const cp = this.chParams(); if (!cp) return;
    const r = C.analyze(this.frames[this.pidx], cp[0], cp[1], 0, true);
    this.autoThr = r.thr;
    this.setRng(clamp(Math.trunc(this.autoThr * 1000), 1, 500));
    this.tv.textContent = this.autoThr.toFixed(3);
  }
  analysisThreshold() {
    if (this.auto) {
      if (this.autoThr === null) this.setAutoThreshold();
      return this.autoThr !== null ? this.autoThr : this.rng.value / 1000;
    }
    return this.rng.value / 1000;
  }
  updPrev() {
    if (!this.frames.length) return;
    const fr = this.frames[this.pidx];
    this.lblNav.textContent = tr('frame', { n: this.pidx + 1, total: this.frames.length });
    this.vo.setFrame(fr);
    if (this.seriesCheck) {
      this.vm.clear(); this.vr.clear(); this.info.textContent = '';
      return;
    }
    const cp = this.chParams(); if (!cp) return;
    const thr = this.analysisThreshold();
    const r = C.analyze(fr, cp[0], cp[1], thr, false);
    C.previewInto(fr, r, this.vm.data(fr.w, fr.h), this.vr.data(fr.w, fr.h));
    this.vm.commit(); this.vr.commit();
    this.tv.textContent = thr.toFixed(3);
    this.info.textContent = `I₀=${r.I0.toFixed(1)} | <A>=${r.meanOd.toFixed(4)} | ${currentLang === 'en' ? 'Spot' : 'Пятно'}: ${(r.stainPct * 100).toFixed(1)}% | ${currentLang === 'en' ? 'Threshold' : 'Порог'}: ${r.thr.toFixed(4)}`;
  }
  run() {
    this.modeButtons.slice(1).forEach((button) => { button.disabled = !!this.seriesCheck; });
    if (this.seriesCheck) {
      this.modeButtons[0].click();
      this.lblK.textContent = '—'; this.lblTh.textContent = '—';
      this.k = null; this.tHalf = null; this.times = []; this.norm = [];
      if (this.frames.length) this.updPrev();
      else { this.vo.clear(); this.vm.clear(); this.vr.clear(); }
      App.updRes(); return;
    }
    const cp = this.chParams(); if (!cp) return;
    const thr = this.analysisThreshold();
    const w0 = this.frames[0].w, h0 = this.frames[0].h, mods = [], modsFg = [];
    for (const fr of this.frames) {
      const r = C.analyze(resized(fr, w0, h0), cp[0], cp[1], thr, false);
      mods.push(C.seriesValue(r)); modsFg.push(r.meanOd);
    }
    const dt = this.spinDt.value;
    let kin = C.kinetics(mods, dt);
    if (kin.k === null || kin.k <= 0) kin = C.kinetics(modsFg, dt);
    this.k = kin.k; this.tHalf = kin.tHalf; this.times = kin.times; this.norm = kin.norm;
    this.lblK.textContent = kin.k !== null ? C.fmtE(kin.k, 3) : tr('noTrend');
    this.lblTh.textContent = currentLang === 'en' ? C.fmtHalf(kin.tHalf).replace('мин', 'min') : C.fmtHalf(kin.tHalf);
    this.updPrev(); App.updRes();
  }
  destroy() { this.stop(); this.root.remove(); }
}

/* ============================ plot ============================ */
class Plot {
  constructor(cv) {
    this.cv = cv; this.ctx = cv.getContext('2d'); this.ds = []; this.hover = null;
    new ResizeObserver(() => this.draw()).observe(cv.parentElement);
    cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); this.hover = { x: e.clientX - r.left, y: e.clientY - r.top }; this.draw(); });
    cv.addEventListener('pointerleave', () => { this.hover = null; this.draw(); });
  }
  set(ds) { this.ds = ds; this.draw(); }
  draw() {
    const par = this.cv.parentElement, W = par.clientWidth, H = par.clientHeight;
    if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1;
    if (this.cv.width !== Math.round(W * dpr) || this.cv.height !== Math.round(H * dpr)) {
      this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr);
    }
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    const ml = W < 400 ? 48 : 58, mr = 18, mt = 18, mb = 50, pw = W - ml - mr, ph = H - mt - mb;
    if (pw < 50 || ph < 50) return;
    let mxT = 1.0, mxA = 1.05;
    for (const d of this.ds) {
      for (const t of d.times) if (t > mxT) mxT = t;
      for (const a of d.areas) if (a > mxA) mxA = a;
    }
    const mono = 'Consolas, "SF Mono", Menlo, monospace', sans = '-apple-system, "Segoe UI", Arial, sans-serif';
    ctx.lineWidth = 1; ctx.strokeStyle = '#a3b4b0'; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(ml, mt + ph + .5); ctx.lineTo(ml + pw, mt + ph + .5); ctx.moveTo(ml + .5, mt); ctx.lineTo(ml + .5, mt + ph); ctx.stroke();
    ctx.font = `10px ${mono}`; ctx.fillStyle = '#667d76'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 6; i++) {
      const val = mxA * i / 5, y = mt + ph - Math.trunc(ph * i / 5);
      ctx.strokeStyle = '#e4ede9'; ctx.setLineDash([1, 2]); ctx.beginPath(); ctx.moveTo(ml, y + .5); ctx.lineTo(ml + pw, y + .5); ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign = 'right'; ctx.fillText(val.toFixed(2), ml - 6, y);
    }
    const nxt = mxT > 0 ? Math.min(6, Math.max(2, Math.trunc(mxT / 100) + 1)) : 2;
    for (let i = 0; i <= nxt; i++) {
      const val = mxT * i / nxt, x = ml + Math.trunc(pw * i / nxt);
      ctx.strokeStyle = '#e4ede9'; ctx.setLineDash([1, 2]); ctx.beginPath(); ctx.moveTo(x + .5, mt); ctx.lineTo(x + .5, mt + ph); ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign = 'center'; ctx.fillText(val.toFixed(0), x, mt + ph + 13);
    }
    ctx.fillStyle = '#667d76'; ctx.font = `12px ${sans}`; ctx.textAlign = 'center';
    ctx.fillText(currentLang === 'en' ? 'Time, s' : 'Время, с', ml + pw / 2, mt + ph + 38);
    ctx.save(); ctx.translate(14, mt + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('<A>(t)/<A>(0)', 0, 0); ctx.restore();


    const cur = App.exps[App.cur];
    const pts = [];
    for (const d of this.ds) {
      if (d.times.length < 2 || d.areas.length < 2) continue;
      const p = [];
      for (let i = 0; i < Math.min(d.times.length, d.areas.length); i++) {
        p.push([ml + Math.trunc(pw * d.times[i] / mxT), mt + ph - Math.trunc(ph * d.areas[i] / mxA)]);
      }
      ctx.strokeStyle = d.color; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath(); p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.fillStyle = d.color;
      for (const [x, y] of p) { ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); }
      if (d.exp === cur && d.exp.frames.length) {
        const q = p[clamp(d.exp.pidx, 0, p.length - 1)];
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#163c33'; ctx.beginPath(); ctx.arc(q[0], q[1], 6, 0, 7); ctx.stroke();
      }
      p.forEach((q, i) => pts.push({ x: q[0], y: q[1], d, i }));
    }
    if (this.hover) {
      let best = null, bd = 14;
      for (const q of pts) { const dd = Math.hypot(q.x - this.hover.x, q.y - this.hover.y); if (dd < bd) { bd = dd; best = q; } }
      if (best) {
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#163c33'; ctx.beginPath(); ctx.arc(best.x, best.y, 6, 0, 7); ctx.stroke();
        const lines = [best.d.name, `t = ${best.d.times[best.i].toFixed(0)} с`, `<A>/<A>₀ = ${best.d.areas[best.i].toFixed(3)}`];
        ctx.font = `11px ${sans}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 14, bh = lines.length * 15 + 8;
        let bx = best.x + 12, by = best.y - bh - 8;
        if (bx + bw > W - 4) bx = Math.max(4, best.x - bw - 12);
        if (by < 4) by = best.y + 12;
        ctx.fillStyle = '#163c33'; ctx.strokeStyle = '#163c33'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(bx + .5, by + .5, bw, bh, 4); ctx.fill(); ctx.stroke();
        lines.forEach((l, i) => { ctx.fillStyle = i ? '#e8e8e8' : best.d.color; ctx.fillText(l, bx + 7, by + 5 + i * 15); });
      }
    }
  }
}

/* ============================ app ============================ */
const App = {
  exps: [], cur: -1, plot: null,
  status(t) { $('#status').textContent = t || tr('ready'); },
  label(e, i) {
    const base = tr('experiment', { n: String(i + 1).padStart(2, '0') });
    return e.custom ? `${base} — ${e.custom}` : base;
  },
  parseCustom(name) {
    const prefix = tr('experimentPrefix');
    if (name.startsWith(prefix)) { const p = name.split(' — '); return p.length >= 2 ? p.slice(1).join(' — ').trim() : ''; }
    return name.trim();
  },
  retranslate() {
    this.exps.forEach((e) => e.retranslate());
    this.renderTabs();
    this.updRes();
    this.status('');
  },
  renderTabs() {
    const bar = $('#tabbar'); bar.textContent = '';
    this.exps.forEach((e, i) => {
      const t = e.custom || this.label(e, i);
      const el = h('button', {
        class: 'tab' + (i === this.cur ? ' sel' : ''), type: 'button', role: 'tab', 'data-t': t,
        'aria-selected': String(i === this.cur), id: `tab-${i}`, 'aria-controls': `experiment-${i}`, title: 'Двойной клик — переименовать',
        tabindex: i === this.cur ? '0' : '-1',
        onkeydown: ev => {
          let target = i;
          if (ev.key === 'ArrowRight') target = (i + 1) % this.exps.length;
          else if (ev.key === 'ArrowLeft') target = (i + this.exps.length - 1) % this.exps.length;
          else if (ev.key === 'Home') target = 0;
          else if (ev.key === 'End') target = this.exps.length - 1;
          else return;
          ev.preventDefault(); ev.stopPropagation(); this.activate(target); $('#tabbar .sel').focus();
        },
        onclick: () => this.activate(i), ondblclick: () => this.rename(i),
      }, t);
      const remove = h('button', {
        class: 'tab-delete', type: 'button', 'aria-label': `${tr('delete')}: ${t}`, title: tr('delete'),
        onclick: ev => { ev.preventDefault(); ev.stopPropagation(); this.del(e); },
      }, '×');
      const item = h('div', { class: 'tab-wrap' }, el, remove);
      e.root.id = `experiment-${i}`; e.root.setAttribute('aria-labelledby', `tab-${i}`);
      bar.append(item);
    });
    bar.append(h('button', { class: 'tab plus', type: 'button', 'data-t': '+', 'aria-label': 'Новый эксперимент', onclick: () => this.add() }, '+ Новый'));
    const sel = bar.querySelector('.sel');
    if (sel) { const l = sel.offsetLeft, r = l + sel.offsetWidth; if (l < bar.scrollLeft) bar.scrollLeft = l - 6; else if (r > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = r - bar.clientWidth + 6; }
  },
  activate(i) {
    this.cur = i;
    this.exps.forEach((e, j) => { e.root.classList.toggle('on', j === i); if (j !== i) e.stop(); });
    this.renderTabs(); this.updRes();
  },
  add() {
    const e = new Experiment();
    this.exps.push(e); $('#pane').append(e.root);
    this.activate(this.exps.length - 1);
    return e;
  },
  async del(e) {
    const i = this.exps.indexOf(e);
    if (i < 0) return;
    if (await confirmBox(tr('deleteConfirm', { name: this.label(e, i) }))) {
      e.destroy(); this.exps.splice(i, 1);
      this.activate(this.exps.length ? Math.min(i, this.exps.length - 1) : -1);
    }
  },
  async rename(i) {
    const e = this.exps[i]; if (!e) return;
    const text = await promptBox('Название эксперимента:', e.custom || this.label(e, i));
    if (text !== null && text.trim()) { e.custom = this.parseCustom(text.trim()); this.renderTabs(); this.updRes(); }
  },
  updRes() {
    const rows = $('#rows'); rows.textContent = '';
    const ds = [];
    this.exps.forEach((e, i) => {
      const color = COLORS[i % COLORS.length], name = this.label(e, i);
      const ms = [tr('brightness'), `λ = ${e.spinWl.value.toFixed(0)} ${currentLang === 'en' ? 'nm' : 'нм'}`, tr('saturation')][e.chIdx];
      const td = (t, label) => h('td', { 'data-label': label }, t);
      rows.append(h('tr', { class: i === this.cur ? 'sel' : '', tabindex: '0', 'aria-label': `Открыть ${name}`, onclick: () => this.activate(i), onkeydown: ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); this.activate(i); } } },
        td(String(i + 1).padStart(2, '0'), tr('table.number')),
        td(h('span', { class: 'table-name' }, h('i', { style: `background:${color}` }), h('span', null, h('strong', null, e.custom || name), h('small', null, `${e.frames.length} ${currentLang === 'en' ? 'images' : 'фото'} · ${ms}`))), tr('table.experiment')),
        td(e.k !== null ? C.fmtE(e.k, 4) : '—', 'k, s⁻¹'), td(currentLang === 'en' ? C.fmtHalf(e.tHalf).replace('мин', 'min') : C.fmtHalf(e.tHalf), 't₁/₂')));
      if (e.times.length && e.norm.length) ds.push({ name, color, times: e.times, areas: e.norm, exp: e });
    });
    $('#experiment-count').textContent = this.exps.length;
    const legend = $('#legend'); legend.textContent = '';
    ds.forEach(d => legend.append(h('span', { class: 'legend-item' }, h('i', { style: `background:${d.color}` }), d.exp.custom || d.name)));
    if (!this.exps.length) rows.append(h('tr', { class: 'empty-row' }, h('td', { colspan: 4 }, tr('footer.ready'))));
    this.plot.set(ds);
  },
};

/* ============================ boot ============================ */
function initChrome() {
  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.addEventListener('click', () => window.SpectraI18n.set(button.dataset.lang));
  });
  const orderButton = $('[data-demo-order]');
  if (orderButton) orderButton.addEventListener('click', async () => {
    const choice = await dialog({
      icon: '▣',
      text: tr('method.orderNote'),
      buttons: [
        { label: tr('method.close'), value: false },
        { label: tr('method.download'), value: 'download' },
      ],
    });
    if (choice === 'download') {
      const link = document.createElement('a');
      link.href = 'demo-analysis-report.docx';
      link.download = currentLang === 'en' ? 'Spectra_demo_analysis_report.docx' : 'Spectra_демо-анализ_отчёт.docx';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  });
  const menu = $('.mobile-menu'), nav = $('.site-nav');
  if (menu && nav) menu.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menu.setAttribute('aria-expanded', String(open));
  });
  if (nav) nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    if (menu) menu.setAttribute('aria-expanded', 'false');
  }));

  /* drag & drop photos */
  let depth = 0;
  const hasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  window.addEventListener('dragenter', (e) => { if (hasFiles(e)) { depth++; document.body.classList.add('drag'); } });
  window.addEventListener('dragleave', (e) => { if (hasFiles(e) && --depth <= 0) { depth = 0; document.body.classList.remove('drag'); } });
  window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault(); depth = 0; document.body.classList.remove('drag');
    const exp = App.exps[App.cur] || App.add();
    exp.addFiles([...e.dataTransfer.files]);
  });

  /* keyboard */
  window.addEventListener('keydown', (e) => {
    if ($('#modal').classList.contains('on') || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === 'SUMMARY' || t.tagName === 'INPUT' && t.type !== 'range' && t.type !== 'checkbox' || t.tagName === 'SELECT')) return;
    const exp = App.exps[App.cur]; if (!exp) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); exp.nav(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); exp.nav(1); }
    else if (e.key === ' ' && !(t && (t.tagName === 'BUTTON' || t.tagName === 'LABEL'))) { e.preventDefault(); exp.togglePlay(); }
  });
}

async function boot() {
  applyStaticI18n();
  App.plot = new Plot($('#plot'));
  initChrome();
  App.renderTabs(); App.updRes();
  App.status('Загрузка демо…');
  for (let i = 0; i < C.DEMOS.length; i++) {
    const e = App.add();
    e.demoIdx = i;
    await tick();
    await e.demo();
    e.demoIdx = i + 1;
  }
  App.activate(0);
  App.retranslate();
  App.status(STATUS_IDLE);
}
window.__app = App;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
