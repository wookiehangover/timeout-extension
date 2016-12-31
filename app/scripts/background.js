'use strict';

var domains = {};

function blockDomain(host) {
  var filter = {
    urls: ["http://" + host + "/*", "https://" + host + "/*"]
  };

  chrome.webRequest.onBeforeRequest.addListener(function () {
    var timeout = domains[host];
    if (timeout === 0 || Date.now() < timeout) {
      return { cancel: true };
    }
  }, filter, ["blocking"]);
}

chrome.storage.sync.get(function (items) {
  for (var host in items) {
    var timeout = parseInt(items[host], 10);
    domains[host] = timeout;
    blockDomain(host, items[host]);
  }
});

chrome.storage.onChanged.addListener(function (items, namespace) {
  for (var host in items) {
    var timeout = parseInt(items[host].newValue, 10);
    domains[host] = timeout;
    if (timeout > Date.now()) {
      blockDomain(host, timeout);
    }
  }
});