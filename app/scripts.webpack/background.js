'use strict'

import { parse } from 'url'

const domains = {}
const { get, remove } = chrome.storage.sync

function updateIcon(active=false) {
  const iconPath = active ? 'images/icon-active-38.png' : 'images/icon-38.png'
  chrome.browserAction.setIcon({ path: iconPath })
}

function blockDomain(host) {
  const filter = {
    urls: [
      `http://${host}/*`,
      `https://${host}/*`,
    ]
  }

  chrome.webRequest.onBeforeRequest.addListener(
    () => {
      const timeout = domains[host]
      if (timeout === 0 || Date.now() < timeout) {
        updateIcon(true)
        return { cancel: true }
      }
    },
    filter,
    [ "blocking" ]
  )
}

get(items => {
  for (let host in items) {
    const timeout = parseInt(items[host], 10)
    domains[host] = timeout

    if (Date.now() > timeout && timeout !== 0) {
      remove(host)
    } else {
      blockDomain(host, items[host])
    }
  }
})

chrome.storage.onChanged.addListener((items, namespace) => {
  for (let host in items) {
    const timeout = parseInt(items[host].newValue, 10)
    domains[host] = timeout
    if (timeout > Date.now()) {
      blockDomain(host, timeout)
    }
  }
})

chrome.tabs.onActivated.addListener(event => {
  chrome.tabs.get(event.tabId, activeTab => {
    const { hostname } = parse(activeTab.url)
    get(hostname, payload => {
      const timeout = payload[hostname]
      if (timeout === 0 || Date.now() < timeout) {
        updateIcon(true)
      } else {
        updateIcon()
      }
    })
  })
})
