import { feedbackMailto } from './site-pages.js';

const params = new URLSearchParams(location.search);
const pageField = document.querySelector('#feedback-page');
const yearField = document.querySelector('#feedback-year');
const form = document.querySelector('#feedback-form');
const status = document.querySelector('#feedback-status');
if (pageField) pageField.value = params.get('from') || document.referrer || location.pathname;
if (yearField) yearField.value = params.get('year') || '';
form?.addEventListener('submit', event => {
  event.preventDefault();
  const message = document.querySelector('#feedback-message')?.value || '';
  if (!message.trim()) {
    status.textContent = 'Write a message first.';
    return;
  }
  const href = feedbackMailto({
    name: document.querySelector('#feedback-name')?.value,
    email: document.querySelector('#feedback-email')?.value,
    message,
    page: pageField?.value,
    year: yearField?.value,
  });
  status.textContent = 'Opening your email app. If nothing opens, copy the message and send it yourself.';
  location.href = href;
});
