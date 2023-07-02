//get all tabs and highlight the current tab

function high(x)
{

  x.addEventListener("click", function () {
    chrome.tabs.query({}, function (tabs) {
      var tabList = document.getElementById("tabList");
      tabs.forEach(function (tab) {
        var li = document.createElement("li");
        // li.textContent = tab.title+" "+"(-  "+tab.url+" )";
        li.textContent = tab.title;
        
       
        if (tab.active) {
          li.classList.add("current-tab");
        }
  
        tabList.appendChild(li);
        
        li.addEventListener('click', async () => {
          // need to focus window as well as the active tab
          await chrome.tabs.update(tab.id, { active: true });
          await chrome.windows.update(tab.windowId, { focused: true });
        });

      
      });
    });
  });
} 
//deletes dups 
function delete_dupes(x)
{

x.addEventListener("click", function() {
    chrome.tabs.query({url: "*://*/*"}, function(tabs) {
      var urlMap = {};
      for (var i = 0; i < tabs.length; i++) {
        if (urlMap.hasOwnProperty(tabs[i].url)) {
          chrome.tabs.remove(tabs[i].id);
        } else {
          urlMap[tabs[i].url] = true;
        }
      }
      
    });
  });
}
// toggles show tabs
function toggle(x)
{
  x.addEventListener("click", function (){
    var checkBox = document.getElementById("showtabs");
  var text = document.getElementById("tabList");
  if (checkBox.checked == true){
    text.style.display = "block";
  } else {
     text.style.display = "none";
  }
  });
 
}

//search tabs
document.addEventListener('DOMContentLoaded', function() {
  var searchInput = document.getElementById('searchInput');
  var tabList = document.getElementById('search');

  // Fetch and display the open tabs
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(function(tab) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      
      a.innerText = tab.title;
    
      li.appendChild(a);
      tabList.appendChild(li);

      li.addEventListener('click', async () => {
        // need to focus window as well as the active tab
        await chrome.tabs.update(tab.id, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });
      });

    });
  });

  // Handle search functionality
  searchInput.addEventListener('input', function() {
    var searchText = searchInput.value.toLowerCase();
    var tabs = tabList.getElementsByTagName('li');

    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var title = tab.innerText.toLowerCase();

      if (title.indexOf(searchText) > -1) {
        tab.style.display = '';
      } else {
        tab.style.display = 'none';
      }
    }
  });
});

//organize tabs
function organize(x)
{
x.addEventListener('click', function() {
  var tabList = document.getElementById('group');

  // Fetch and group the open tabs by their titles
  chrome.tabs.query({ currentWindow: true }, function(tabs) {
    var tabGroups = {};

    tabs.forEach(function(tab) {
      var tabTitle = tab.title;
      if (tabGroups.hasOwnProperty(tabTitle)) {
        tabGroups[tabTitle].push(tab);
      } else {
        tabGroups[tabTitle] = [tab];
      }
    });

    for (var title in tabGroups) {
      if (tabGroups.hasOwnProperty(title)) {
        var tabGroup = tabGroups[title];
        var li = document.createElement('li');
        li.innerText = title;

        var ul = document.createElement('ul');
        tabGroup.forEach(function(tab) {
          var tabItem = document.createElement('li');
          var a = document.createElement('a');
          a.href = tab.title;
          a.innerText = tab.url;
          
          tabItem.appendChild(a);
          ul.appendChild(tabItem);
          tabItem.addEventListener('click', async () => {
            // need to focus window as well as the active tab
            await chrome.tabs.update(tab.id, { active: true });
            await chrome.windows.update(tab.windowId, { focused: true });
          });
        });

        li.appendChild(ul);
       tabList.appendChild(li);
      }
      
    }
  });
});
}


 //--------------executing area------------------------------------------------------------------------------------------

 var remove_dupe=document.getElementById("remove-all-dupes-btn");
 var showtabs= document.getElementById("showtabs");
 var group=document.getElementById("organize-all-dupes-btn")
high(showtabs);
toggle(showtabs);
delete_dupes(remove_dupe);
organize(group);




  
 