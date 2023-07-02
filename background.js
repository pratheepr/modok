// URL pattern array to whitelist
let whitelist = [];

// Fetch whitelist from file
fetch(chrome.runtime.getURL('whitelist.txt'))
  .then(response => response.text())
  .then(data => {
    whitelist = data.split('\n').filter(url => url.trim() !== '');
    console.log('Whitelist:', whitelist);
  })
  .catch(error => {
    console.error('Error fetching whitelist:', error);
  });


// Listen for updates to the whitelist
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === "local" && "whitelist" in changes) {
    whitelist = changes.whitelist.newValue;
  }
});


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === "complete" && tab.url) {
    // Check if the URL is in the whitelist
    const isWhitelisted = whitelist.some(url => tab.url === url);
    console.log(whitelist);
    console.log('isWhitelisted:', isWhitelisted);

    if (isWhitelisted) {
      return;
    }

    const urlPattern = new URL(tab.url).href;
    console.log(urlPattern);
    chrome.tabs.query({url: `${urlPattern}/*`}, function(tabs) {
      if (tabs.length > 1) {
        console.log('inside duplicates');
        chrome.notifications.create({
          type: "basic",
          title: "URL Duplicate Checker",
          message: "This URL is already open in another tab.",
          iconUrl: "images/dupes.png",
          buttons: [
            { title: 'Continue' },
            { title: 'Take me to existing tab' },
            { title: 'Smash All Dupes' }
          ],
          priority: 2
        }, function(notificationId) {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          }
        });
      }
    });
  }
});

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
  if (buttonIndex === 1) {
    chrome.notifications.clear(notificationId);

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var currentTab = tabs[0];
      var urlPattern = new URL(currentTab.url).origin + '/*';

      chrome.tabs.query({url: urlPattern}, function(tabs) {
        if (tabs.length > 1) {
          for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].id !== currentTab.id) {
              chrome.tabs.update(tabs[i].id, { active: true }, function() {
                if (chrome.runtime.lastError) {
                  console.error(chrome.runtime.lastError.message);
                } else {
                  chrome.tabs.remove(currentTab.id);
                }
              });
              break;
            }
          }
        }
      });
    });

  } else if (buttonIndex === 2) {
    chrome.notifications.clear(notificationId);
    chrome.tabs.query({url: "*://*/*"}, function(tabs) {
      var urlMap = {};
      for (var i = 0; i < tabs.length; i++) {
        if (urlMap.hasOwnProperty(tabs[i].url)) {
          chrome.tabs.remove(tabs[i].id);
        } else {
          urlMap[tabs[i].url] = true;
        }
      }
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var currentTab = tabs[0];
        var urlPattern = currentTab.url;
        chrome.tabs.query({url: urlPattern}, function(tabs) {
          if (tabs.length > 1) {
            for (var i = 0; i < tabs.length; i++) {
              if (tabs[i].id !== currentTab.id) {
                chrome.tabs.update(tabs[i].id, { active: true });
                break;
              }
            }
          }
        });
      });
    });
  }
});
