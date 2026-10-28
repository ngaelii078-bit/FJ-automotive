'use strict';

// The demo runs directly from index.html; no server or build step is needed.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const workshopPhone = '27722861957';
$('#year').textContent = new Date().getFullYear();

// Mobile navigation remains keyboard accessible and closes on selection / Escape.
const menuButton = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
function setMenu(open, returnFocus = false) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  mobileNav.hidden = !open;
  if (returnFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => setMenu(mobileNav.hidden));
$$('a', mobileNav).forEach(link => link.addEventListener('click', () => setMenu(false)));
window.matchMedia('(min-width: 861px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});

// Booking only prepares a message. Sending stays a deliberate visitor action.
const booking = $('#booking-form');
const sendBooking = $('#send-booking');
const bookingStatus = $('#booking-status');
function todayLocal() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
$('#booking-date').min = todayLocal();
function clearBookingMessage() {
  sendBooking.hidden = true;
  sendBooking.removeAttribute('href');
  bookingStatus.textContent = '';
}
booking.addEventListener('input', clearBookingMessage);
booking.addEventListener('change', clearBookingMessage);
$$('[data-service]').forEach(link => link.addEventListener('click', () => {
  $('#service-select').value = link.dataset.service;
  clearBookingMessage();
}));
booking.addEventListener('submit', event => {
  event.preventDefault();
  clearBookingMessage();
  const data = new FormData(booking);
  if (data.get('date') < todayLocal()) {
    $('#booking-date').min = todayLocal();
    bookingStatus.textContent = 'Please choose today or a future date.';
    bookingStatus.focus();
    return;
  }
  const message = [
    "Hi FJ Automotive! I'd like to request a workshop visit.", '',
    `Name: ${data.get('name').trim()}`,
    `Phone: ${data.get('phone').trim()}`,
    `Vehicle: ${data.get('vehicle').trim()}`,
    `Service: ${data.get('service')}`,
    `Preferred date: ${data.get('date')}`,
    `Notes: ${data.get('notes').trim() || 'None'}`, '',
    'Please confirm availability and pricing.'
  ].join('\n');
  sendBooking.href = `https://wa.me/${workshopPhone}?text=${encodeURIComponent(message)}`;
  sendBooking.hidden = false;
  bookingStatus.textContent = 'Your request is ready. Review and send it in WhatsApp below. The workshop will confirm your visit.';
  bookingStatus.focus({ preventScroll: true });
  sendBooking.scrollIntoView({ block: 'nearest', behavior: motionPreference.matches ? 'instant' : 'smooth' });
});

// A transparent, local guide: no AI service, tracking, or personal data storage.
const chatPanel = $('#chat-panel');
const chatToggle = $('#chat-toggle');
const chatInput = $('#chat-input');
const chatLog = $('#chat-log');
function setChat(open) {
  chatPanel.hidden = !open;
  chatToggle.setAttribute('aria-expanded', String(open));
  if (open) chatInput.focus({ preventScroll: true });
  else chatToggle.focus({ preventScroll: true });
}
chatToggle.addEventListener('click', () => setChat(chatPanel.hidden));
$('#chat-close').addEventListener('click', () => setChat(false));
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!chatPanel.hidden) setChat(false);
  else if (!mobileNav.hidden) setMenu(false, true);
});
function addMessage(text, isUser = false) {
  const message = document.createElement('div');
  message.className = `message${isUser ? ' user' : ''}`;
  message.textContent = text;
  chatLog.append(message);
  chatLog.scrollTop = chatLog.scrollHeight;
}
function reply(question) {
  addMessage(question, true);
  const text = question.toLowerCase();
  let answer;
  if (/price|cost|rate|how much/.test(text)) {
    answer = 'Sample demo prices: diagnostics from R450, minor service from R1,250, major service from R2,500, brake inspection from R350 and battery check from R150. These are illustrative, not confirmed FJ rates. Contact the workshop for a quote for your vehicle.';
  } else if (/book|appointment|availab|date/.test(text)) {
    answer = 'Use the booking form to add your car details and preferred date, then prepare your WhatsApp message. Review and send it to the workshop. Your visit is confirmed when the workshop replies; I cannot check live availability.';
  } else if (/where|location|direction|address|map/.test(text)) {
    answer = 'Find FJ Automotive at 7 Industria Street, Polokwane Ext 1, Polokwane, 0700. Use “Get directions” in the location section to open Google Maps. Please call before visiting to confirm hours.';
  } else if (/hour|open|close|weekend/.test(text)) {
    answer = 'Please call 072 286 1957 to confirm current opening hours and arrange your visit.';
  } else if (/light|engine|smoke|overheat|brake|noise|fault/.test(text)) {
    answer = 'A workshop assessment is needed to identify the cause. If the vehicle overheats, has a red oil-pressure warning, smoke or reduced braking, pull over safely, switch off and arrange professional assistance. For other symptoms, contact the workshop about a diagnostic booking. This demo cannot diagnose your car.';
  } else if (/whatsapp|phone|call|contact|human|team/.test(text)) {
    answer = 'Call 072 286 1957, or use “Let’s talk” or “Message the workshop” on this page to open WhatsApp.';
  } else if (/service|repair|battery/.test(text)) {
    answer = 'Ask about diagnostics, maintenance or mechanical repairs through the booking form. Include your make, model and symptoms. The workshop will confirm service availability and pricing for your vehicle.';
  } else {
    answer = 'I’m a demo guide with prepared answers. Try asking about prices, bookings, hours or directions. For a specific question about your car, call the workshop on 072 286 1957.';
  }
  addMessage(answer);
}
$('#chat-form').addEventListener('submit', event => {
  event.preventDefault();
  const question = chatInput.value.trim();
  if (!question) return;
  reply(question);
  chatInput.value = '';
});
$$('[data-question]').forEach(button => button.addEventListener('click', () => reply(button.dataset.question)));

// Scroll-scrubbed word reveal. Each heading is measured in document flow;
// progress eases towards the scroll position and reverses when scrolling up.
// One RAF loop runs only while progress is changing, never while the page is idle.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

// Load the film only when motion/data preferences allow it. Manual pause wins
// over automatic visibility-based resuming. A failed load keeps the poster.
const heroVideo = $('#hero-video');
const videoToggle = $('#hero-video-toggle');
const heroVisual = $('.hero-visual');
const connection = navigator.connection;
let manuallyPaused = false;
let videoFailed = false;
let heroVisible = $('.hero').getBoundingClientRect().bottom > 0;
let playAttempt = 0;
function videoAllowed() {
  return !motionPreference.matches && !connection?.saveData && !videoFailed;
}
function updateVideoButton() {
  const paused = heroVideo.paused;
  videoToggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
  $('.video-control-label', videoToggle).textContent = paused ? 'Play video' : 'Pause video';
  $('.video-control-icon use', videoToggle).setAttribute('href', paused ? '#video-play' : '#video-pause');
}
async function syncHeroVideo() {
  const attempt = ++playAttempt;
  if (!videoAllowed()) {
    heroVideo.pause();
    heroVisual.classList.remove('video-ready');
    videoToggle.hidden = true;
    return;
  }
  if (!heroVisible || document.hidden || manuallyPaused) {
    heroVideo.pause();
    return;
  }
  if (!heroVideo.getAttribute('src')) {
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.src = heroVideo.dataset.src;
  }
  try {
    await heroVideo.play();
  } catch {
    // Autoplay restrictions are normal on some devices: offer deliberate play.
    if (attempt === playAttempt && videoAllowed() && heroVisible && !document.hidden) {
      videoToggle.hidden = false;
      updateVideoButton();
    }
  }
}
heroVideo.addEventListener('playing', () => {
  if (!videoAllowed() || !heroVisible || document.hidden || manuallyPaused) {
    heroVideo.pause();
    return;
  }
  heroVisual.classList.add('video-ready');
  videoToggle.hidden = false;
  updateVideoButton();
});
heroVideo.addEventListener('pause', updateVideoButton);
heroVideo.addEventListener('error', () => {
  videoFailed = true;
  heroVisual.classList.remove('video-ready');
  videoToggle.hidden = true;
});
videoToggle.addEventListener('click', () => {
  manuallyPaused = !heroVideo.paused;
  syncHeroVideo();
});
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting;
    syncHeroVideo();
  }, { threshold: 0 }).observe($('.hero'));
}
document.addEventListener('visibilitychange', syncHeroVideo);
motionPreference.addEventListener('change', syncHeroVideo);
connection?.addEventListener('change', syncHeroVideo);
syncHeroVideo();

const clamp = value => Math.min(1, Math.max(0, value));
const revealHeadings = $$('[data-reveal]').map(heading => {
  const visual = document.createElement('span');
  visual.className = 'reveal-visual';
  visual.setAttribute('aria-hidden', 'true');
  while (heading.firstChild) visual.append(heading.firstChild);
  const readable = document.createElement('span');
  readable.className = 'sr-only';
  // Preserve the space represented by a line break in the accessible heading.
  const label = visual.cloneNode(true);
  $$('br', label).forEach(br => br.replaceWith(' '));
  readable.textContent = label.textContent.replace(/\s+/g, ' ').trim();
  heading.append(readable, visual);
  const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const words = [];
  nodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) fragment.append(document.createTextNode(part));
      else {
        const word = document.createElement('span');
        word.className = 'reveal-word';
        word.textContent = part;
        words.push(word);
        fragment.append(word);
      }
    });
    node.replaceWith(fragment);
  });
  return { heading, words, current: null, lastPainted: -1 };
});

let frame = 0;
let lastTime = 0;
function paintHeading(item, progress) {
  if (Math.abs(item.lastPainted - progress) < .00005) return;
  item.lastPainted = progress;
  const overlap = 2.4;
  item.words.forEach((word, index) => {
    const step = clamp((progress * (item.words.length + overlap - 1) - index) / overlap);
    const eased = step * step * (3 - 2 * step);
    word.style.setProperty('--word-opacity', (.16 + .84 * eased).toFixed(4));
    word.style.setProperty('--word-y', `${((1 - eased) * 11).toFixed(2)}px`);
    word.style.setProperty('--word-blur', `${((1 - eased) * 2.2).toFixed(2)}px`);
  });
}
function animateWords(time) {
  frame = 0;
  const delta = lastTime ? Math.min(time - lastTime, 64) : 16.67;
  lastTime = time;
  const ease = 1 - Math.exp(-delta / 115);
  let changing = false;
  const height = window.innerHeight;
  const scroll = window.scrollY;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - height);
  revealHeadings.forEach(item => {
    const documentTop = item.heading.getBoundingClientRect().top + scroll;
    const start = Math.max(0, documentTop - height * .91);
    // Short sections near the footer still finish before the visitor runs out of scroll.
    const end = Math.min(maxScroll, documentTop - height * .42);
    const target = motionPreference.matches ? 1 : clamp((scroll - start) / Math.max(1, end - start));
    if (item.current === null || motionPreference.matches) item.current = target;
    else item.current += (target - item.current) * ease;
    if (Math.abs(target - item.current) < .0001) item.current = target;
    else changing = true;
    paintHeading(item, item.current);
  });
  if (changing) frame = requestAnimationFrame(animateWords);
  else lastTime = 0;
}
function queueReveal() {
  if (!frame) frame = requestAnimationFrame(animateWords);
}
window.addEventListener('scroll', queueReveal, { passive: true });
window.addEventListener('resize', queueReveal, { passive: true });
window.addEventListener('pageshow', queueReveal);
motionPreference.addEventListener('change', queueReveal);
$$('details').forEach(details => details.addEventListener('toggle', queueReveal));
if (document.fonts) document.fonts.ready.then(queueReveal);
queueReveal();
