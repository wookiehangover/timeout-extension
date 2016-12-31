'use strict';

import { parse } from 'url'
import timeago from 'timeago.js'

const headlines = [
  `How much of a break do you need?`,
  `Let's give it a rest for now`,
  `We all need a break sometimes.`,
  `You don't need this`,
  `You should get back to work`
]

const form = document.getElementById('form')
const time = document.getElementById('time')
const blocked = document.getElementById('blocked')
const unblock = document.getElementById('unblock')
const headline = document.getElementById('headline')

headline.innerHTML = headlines[Math.floor(Math.random() * headlines.length)]

function toggle() {
  form.classList.toggle('dn')
  blocked.classList.toggle('dn')
}

function update(value) {
  chrome.storage.sync.set(value, () => {
    console.log('updated')
    setTimeout(() => chrome.tabs.reload(), 100)
    toggle()
  })
}

chrome.tabs.query({ active: true, currentWindow: true }, tabCollection => {
  const tab = tabCollection[0]
  if (!tab) return
  const url = parse(tab.url)
  if (!url) return // TODO: close the popup if this fails

  Array.from(document.querySelectorAll('.domain')).forEach(node => {
    node.innerHTML += `<span class="underline">${url.hostname}</span>`
  })

  chrome.storage.sync.get(items => {
    for (let host in items) {
      const timeout = parseInt(items[host], 10)
      if (host === url.hostname && (timeout === 0 || Date.now() < timeout)) {
        toggle()
        time.innerHTML = new timeago().format(timeout)
      }
    }
  })

  form.addEventListener('submit', event => {
    event.preventDefault()
    const { value } = Array.from(
      document.querySelectorAll('input[name="duration"]')
    ).filter(input => input.checked).pop()

    let duration = parseInt(value, 10)
    if (duration !== 0) {
      duration = Date.now() + (duration * 6e4)
      time.innerHTML = new timeago().format(duration)
    }

    update({ [ url.hostname ]: duration })
  }, false)

  unblock.addEventListener('click', event => {
    event.preventDefault()
    chrome.storage.sync.remove(url.hostname, function() {
      toggle()
      setTimeout(() => chrome.tabs.reload(), 100)
    })
  }, false)

})
