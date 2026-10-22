/* Плавный скролл колесом (в духе Lenis): перехватываем wheel и лерпим
   позицию окна. Скролл остаётся нативным (window.scrollTo), поэтому
   sticky-элементы, якоря и IntersectionObserver продолжают работать.
   Тач и reduced-motion не трогаем: там нативная инерция лучше. */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (matchMedia('(pointer: coarse)').matches) return;
  /* как у Lenis по умолчанию (lerp 0.1 при 60 fps): затухание считается
     от времени между кадрами, а не на кадр — иначе на мониторах 120–144 Гц
     скролл вдвое резче. Больше — резче, меньше — вязче */
  var LAMBDA = 6;
  var target = window.scrollY, current = target, raf = null, last = 0;
  function maxY(){ return document.documentElement.scrollHeight - window.innerHeight; }

  /* под курсором свой вертикальный скролл (сайдбар, диалог) и ему есть куда
     крутиться — колесо отдаём ему, окно не трогаем */
  function innerScroller(el, d){
    for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement){
      if (el.scrollHeight <= el.clientHeight) continue;
      var oy = getComputedStyle(el).overflowY;
      if (oy !== 'auto' && oy !== 'scroll') continue;
      if (d < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
    }
    return false;
  }

  addEventListener('wheel', function(e){
    if (e.ctrlKey || e.shiftKey) return;                 /* пинч-зум и горизонталь с Shift */
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; /* горизонтальный свайп тачпада */
    if (document.querySelector('dialog[open]')) return;  /* открыт просмотр картинки */
    var d = e.deltaY;
    if (e.deltaMode === 1) d *= 100 / 6; else if (e.deltaMode === 2) d *= window.innerHeight;
    if (innerScroller(e.target, d)) return;
    e.preventDefault();
    target = Math.max(0, Math.min(maxY(), target + d));
    if (!raf){ last = performance.now(); raf = requestAnimationFrame(step); }
  }, {passive:false});

  function step(now){
    var dt = Math.min((now - last) / 1000, 0.1); /* после фоновой вкладки не прыгаем */
    last = now;
    current += (target - current) * (1 - Math.exp(-LAMBDA * dt));
    if (Math.abs(target - current) < 0.5){ current = target; raf = null; }
    else raf = requestAnimationFrame(step);
    /* behavior:'instant' обязателен: на html стоит scroll-behavior:smooth,
       и scrollTo(0,y) каждый кадр запускал бы ещё и браузерную анимацию —
       два сглаживания дерутся, и скролл дёргается */
    window.scrollTo({top: current, behavior: 'instant'});
  }

  /* скролл изменили не колесом (якорь, клавиатура, скроллбар) — догоняем */
  addEventListener('scroll', function(){
    if (!raf){ target = current = window.scrollY; }
  }, {passive:true});
})();
