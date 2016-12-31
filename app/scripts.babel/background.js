'use strict'

const domains = {}

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
        return { cancel: true }
      }
    },
    filter,
    [ "blocking" ]
  )
}

chrome.storage.sync.get(items => {
  for (let host in items) {
    const timeout = parseInt(items[host], 10)
    domains[host] = timeout
    blockDomain(host, items[host])
  }
})

chrome.storage.onChanged.addListener(function(items, namespace) {
  for (let host in items) {
    const timeout = parseInt(items[host].newValue, 10)
    domains[host] = timeout
    if (timeout > Date.now()) {
      blockDomain(host, timeout)
    }
  }
});
