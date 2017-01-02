'use strict';

import { parse } from 'url'
import timeago from 'timeago.js'

const { get, set, remove } = chrome.storage.sync

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
const disable = document.getElementById('unblock')
const headline = document.getElementById('headline')

headline.innerHTML = headlines[Math.floor(Math.random() * headlines.length)]

function toggle() {
  form.classList.toggle('dn')
  blocked.classList.toggle('dn')
}

function update(value) {
  set(value, () => {
    console.log('updated')
    setTimeout(() => chrome.tabs.reload(), 100)
    chrome.browserAction.setIcon({ path: 'images/icon-active-38.png' })
    toggle()
  })
}

function unblock(hostname) {
  remove(hostname, () => {
    toggle()
    chrome.browserAction.setIcon({ path: 'images/icon-38.png' })
    setTimeout(() => chrome.tabs.reload(), 100)
  })
}


chrome.tabs.query({ active: true, currentWindow: true }, tabCollection => {
  const tab = tabCollection[0]
  if (!tab) return
  const { hostname } = parse(tab.url)
  if (!hostname) return // TODO: close the popup if this fails

  // Add the Hostname to the DOM
  Array.from(document.querySelectorAll('.domain')).forEach(node => {
    node.innerHTML += `<span class="underline">${hostname}</span>`
  })

  // Toggle the tap if the current Host is in timeout
  get(items => {
    for (let host in items) {
      const timeout = parseInt(items[host], 10)
      if (host === hostname && (timeout === 0 || Date.now() < timeout)) {
        toggle()
        time.innerHTML = new timeago().format(timeout)
      }
    }
  })

  // Save the form value on submit
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

    update({ [ hostname ]: duration })
  }, false)

  // Turn off blocking when you click the button
  disable.addEventListener('click', event => {
    event.preventDefault()
    unblock(hostname)
  }, false)

})
