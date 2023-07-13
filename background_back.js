// URL pattern array to whitelist
let whitelist = [];

const urlConfig = [
  {
    urlPattern: 'docs.google.com',
    idExtractor: (url) => {
      const match = url.match(/\/document\/d\/([^/]+)/);
      return match ? match[1] : null;
    }
  },
  {
    urlPattern: 'docs.google.com/spreadsheets',
    idExtractor: (url) => {
      const match = url.match(/\/spreadsheets\/d\/([^/]+)/);
      return match ? match[1] : null;
    }
  },
  {
    urlPattern: 'docs.google.com/presentation',
    idExtractor: (url) => {
      const match = url.match(/\/presentation\/d\/([^/]+)/);
      return match ? match[1] : null;
    }
  }
];

// Function to check if a URL matches any special processing pattern
function isSpecialUrl(url) {
  return urlConfig.some(config => url.includes(config.urlPattern));
}

// Function to extract the document ID from a special URL
function extractDocumentId(url) {
  const config = urlConfig.find(config => url.includes(config.urlPattern));
  return config ? config.idExtractor(url) : null;
}



// Fetch whitelist from file
fetch(chrome.runtime.getURL('whitelist.txt'))
  .then(response => response.text())
  .then(data => {
    whitelist = data.split('\n').filter(url => url.trim() !== '');
   // console.log('Whitelist:', whitelist);
  })
  .catch(error => {
    console.error('Error fetching whitelist:', error);
  });


// Listen for updates to the whitelist
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === "local" && "whitelist" in changes) {
    whitelist = changes.whitelist.newValue;
  }
});

// Dictionary to track loaded tabs
let loadedTabs = {};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // Check if the tab update is complete and has a URL
  if (changeInfo.status === "complete" && tab.url) {
    // Check if it's the first load of the specific tab or the URL has changed
    if (!loadedTabs[tabId] || loadedTabs[tabId].tabUrl !== tab.url) {
      // Perform duplicate check for the first load or URL change of the specific tab
      console.log('Tab loaded or URL changed:', tab.url);

      // Check if the URL is in the whitelist
      const isWhitelisted = whitelist.some(url => tab.url === url);

      if (isWhitelisted) {
        return; // If the URL is whitelisted, return without performing further actions
      }

      // Create a URL pattern from the current tab's URL
      let urlPattern = new URL(tab.url).href;
      let urlPatternOrigin = new URL(tab.url).origin; 

      console.log('urlPattern:', urlPattern);
      console.log('urlPatternOrigin', urlPatternOrigin);

      // Check if it's a special URL
      if (isSpecialUrl(tab.url)) {
        // Extract the document ID for special URLs
        const documentId = extractDocumentId(tab.url);
        console.log('Special URL - Document ID:', documentId);
        // Perform special processing using the document ID
        // ...
      } else {
        console.log('Normal URL - URL Pattern:', urlPattern);
        console.log('Normal URL - URL Pattern Origin:', urlPatternOrigin);
        // Perform normal processing using the URL pattern
        // ...
      }



      // Query Chrome tabs with a matching URL pattern /*
      chrome.tabs.query({url: `${urlPattern}`}, function(tabs) {
        console.log('Inside Dupe Checker', tabs.length);
        if (tabs.length > 1) {
          // If duplicate tabs are found, create a notification
          chrome.notifications.create({
            type: "basic",
            title: "MODOK Duplicate Checker",
            message: "This URL is already open in another tab.",
            iconUrl: "images/dupes.png",
            buttons: [
              { title: 'Continue' },
              { title: 'Take me to existing tab' }
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

    // Update the loadedTabs dictionary with the new tab URL
    loadedTabs[tabId] = {
      tabId: tabId,
      tabUrl: tab.url
    };

    console.log('Loaded Tabs:', loadedTabs);
  }
});


chrome.tabs.onRemoved.addListener(function(tabId) {
  // Remove the tab from the loadedTabs dictionary when it is closed
  delete loadedTabs[tabId];
});



chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
  if (buttonIndex === 1) {
    chrome.notifications.clear(notificationId);

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var currentTab = tabs[0];
      console.log(tabs);
      var urlPattern = new URL(currentTab.url).origin + '/*';

      chrome.tabs.query({ url: urlPattern }, function (tabs) {
        if (tabs.length > 1) {
          for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].id !== currentTab.id) {
              chrome.tabs.update(tabs[i].id, { active: true }, function () {
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
    chrome.tabs.query({ url: "*://*/*" }, function (tabs) {
      var urlMap = {};
      for (var i = 0; i < tabs.length; i++) {
        if (urlMap.hasOwnProperty(tabs[i].url)) {
          chrome.tabs.remove(tabs[i].id);
        } else {
          urlMap[tabs[i].url] = true;
        }
      }
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var currentTab = tabs[0];
        var urlPattern = currentTab.url;
        chrome.tabs.query({ url: urlPattern }, function (tabs) {
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
