// ==UserScript==
// @name           Reddit History
// @namespace      tag:halbersa@gmail.com,2012-02-24:ahal
// @description    Keeps track of all the submissions you viewed on Reddit
// @include        https://www.reddit.com*
// @include        http://www.reddit.com*
// @exclude        http://www.reddit.com/user/*
// @exclude        http://www.reddit.com/*/comments/*
// @exclude        http://www.reddit.com/submit
// @exclude        http://www.reddit.com/reddits/create
// @exclude        http://www.reddit.com/account-activity
// ==/UserScript==

var header = document.getElementById('header'); 
var content = document.querySelectorAll('div.content')[0];
var user = header.querySelectorAll('span.user')[0].getElementsByTagName('a')[0].innerHTML;
var history = new History(user);
append_history_tab();
add_click_listeners();


/**
 * Appends a history tab to the navbar
 */
function append_history_tab() {
  let tabMenu = header.querySelectorAll('ul.tabmenu')[0];
  let listItem = document.createElement('li'); 
  let link = document.createElement('a');

  /**
   * Displays the history tab
   */
  let click_history = function (){
    let items = tabMenu.getElementsByTagName('li');

    let reload = function(){
      location.reload();
    }

    for (var i = 0; i < items.length; ++i){
      if (items[i].className == "selected"){
        items[i].className = "";
        items[i].addEventListener('click', reload);
      }
    }
    listItem.className = "selected";

    // Build the chrome controls
    content.innerHTML = "";
    let h_controls = document.createElement('div');
    h_controls.className = 'spacer historyControls';
    let s="<input id='rhRegex' value=''/>";
    s+="<button id='rhFilter'>Filter (regex)</button>";
    s+="<button id='rhClear'>Clear All History</button>";
    s+="<div style='text-align: right; width: 50%; float: right;'>";
    s+="Limit<input id='rhLimit' value=''/>";
    s+="<button id='rhSave'>Save</button>";
    h_controls.innerHTML = s;
    content.appendChild(h_controls);

    let h_items = document.createElement('div');
    h_items.className = 'spacer historyItems';
    content.appendChild(h_items);

    // Add button listeners
    let h_filter = document.getElementById('rhFilter');
    let h_clear = document.getElementById('rhClear');
    let h_save = document.getElementById('rhSave');
    h_filter.addEventListener('click', filter);
    h_clear.addEventListener('click', clear);
    h_save.addEventListener('click', save_limit);

    let h_limit = document.getElementById('rhLimit');
    h_limit.value = GM_getValue('limit', 10000);

    show_history();
  }

  link.innerHTML = "history";
  link.href = "#";
  link.addEventListener("click", click_history, false);
  listItem.appendChild(link);
  tabMenu.appendChild(listItem);
}

/**
 * Adds a listener to each submission
 */
function add_click_listeners() {
  let siteTable = document.getElementById('siteTable');
  let submissions = siteTable.querySelectorAll('div.entry');
  for (let i = 0; i < submissions.length; ++i) {
    let s = submissions[i];
    let link = s.querySelectorAll('a.title')[0];
    let comment = s.querySelectorAll('a.comments')[0];

    /**
     * Adds the submission to history
     */
    let add_submission = function() {
      let domain = s.querySelectorAll('span.domain')[0].getElementsByTagName('a')[0];
      let sub = s.querySelectorAll('p.tagline')[0].querySelectorAll('a.subreddit')[0];
      if (sub == undefined) {
        sub = header.querySelectorAll('span.redditname')[0].getElementsByTagName('a')[0];
      }
      history.add_submission(link.innerHTML,
                             link.href,
                             comment.href,
                             sub.innerHTML,
                             sub.href,
                             domain.innerHTML,
                             domain.href);
    }
    
    link.addEventListener('click', add_submission);
    comment.addEventListener('click', add_submission);
  }
}

/**
 * Displays the history in the history tab
 */
function show_history(regex) {
  let h_controls = content.querySelectorAll('div.historyControls')[0];
  let h_items = content.querySelectorAll('div.historyItems')[0];
  let re = null;
  if (regex != undefined) {
    re = new RegExp(regex);
    let filter = document.getElementById('rhRegex');
    filter.value = regex;
  }
  let items = history.get_history(re);

  for (let i = 0; i < items.length; ++i) {
    let mod = (i % 2 == 0 ? 'even' : 'odd');
    let div = document.createElement('div');
    div.className = "thing link " + mod;
    let s = "<span class='rank' style='width:3.30ex;'>" + (i+1) + "</span>";
    s += "<div class='midcol' style='width:5ex;'><div class='arrow up'></div><div class='score unvoted'>•</div><div class='arrow down'></div></div>";
    s += "<div class='entry lcTagged' keyindex='" + i + "' style='margin-left:5px;'>";
    s += "<p class='title'><a class='title' href='" + items[i].url + "'>" + items[i].name + "</a>";
    s += "<span class='domain'> (<a href='" + items[i].domain_url + "'>" + items[i].domain_name + "</a>)</span></p>";
    s += "<p class='tagline'>last accessed on " + items[i].accessed + ", in <a href='" + items[i].sub_url + "'>" + items[i].sub_name + "</a></p>";
    s += "<ul class='flat-list buttons'><li class='first'><a class='comments' href='" + items[i].comments + "'>view comments</a></li></ul></div>";
    div.innerHTML = s;
    h_items.appendChild(div);

    let clear = document.createElement('div');
    clear.className = "clearleft";
    h_items.appendChild(clear);
  }
}

/**
 * Filter the displayed history
 */
function filter() {
  let h_items = content.querySelectorAll('div.historyItems')[0];
  let h_regex = document.getElementById('rhRegex');
  h_items.innerHTML = "";
  show_history(h_regex.value);
}

/**
 * Clear all history
 */
function clear() {
  if (confirm("Are you sure you want to permanently delete all history?")) {
    history.clear();
    let h_items = content.querySelectorAll('div.historyItems')[0];
    h_items.innerHTML = "";
  }
}

/**
 * Modify the maximum number of submissions stored
 */
function save_limit() {
  let h_limit = document.getElementById('rhLimit');
  let re = new RegExp("^([1-9]|[1-9][0-9]|[1-9][0-9][0-9]|[1-9][0-9][0-9][0-9]|[1-9][0-9][0-9][0-9][0-9])$");   // 1...99999
  if(re.test(h_limit.value)){
    GM_setValue('limit', parseInt(h_limit.value));
  } else {
    alert("Enter a number from 1 to 99999");
  }
}

/**
 * Wrapper around the localStorage object
 * Used to manipulate all operations related to history
 */
function History(user) {
  this.key = "reddit_history_" + user;
  if (localStorage.getItem(this.key) == null) {
    localStorage.setItem(this.key, JSON.stringify([]));
  }
}

History.prototype.get_history = function(regex, limit) {
  limit = limit || 100;
  let submissions = JSON.parse(localStorage[this.key]);
  let count = 0;
  let ret = [];
  while (submissions.length > 0 && count <= limit) {
    let s = submissions.pop();
    if (regex == null || regex.test(s.name)) {
      ret.push(s);
      count++;
    }
  }
  return ret;
};

History.prototype.indexOf = function(s) {
  let submissions = JSON.parse(localStorage.getItem(this.key));
  for (let i = 0; i < submissions.length; ++i) {
    let t = submissions[i];
    if (t.comments == s.comments) {
      return i;
    }
  }
  return -1;
};

History.prototype.add_submission = function(name, url, comments, sub_name, sub_url, domain_name, domain_url) {
  let s = {'name': name,
           'url': url,
           'comments': comments,
           'sub_name': sub_name,
           'sub_url': sub_url,
           'domain_name': domain_name,
           'domain_url': domain_url,
           'accessed': new Date().toDateString()};
  let submissions = JSON.parse(localStorage.getItem(this.key));

  let index = this.indexOf(s);
  if (index != -1) {
    submissions.splice(index, 1);
  }
  submissions.push(s);
  if (submissions.length > GM_getValue('limit', 10000)) {
    submissions.shift();
  }
  localStorage.setItem(this.key, JSON.stringify(submissions));
};

History.prototype.remove_submission = function(name, url) {
  let submission = {'name': name, 'url': url};
  let submissions = JSON.parse(localStorage.getItem(this.key));
  
  let index = this.indexOf(s);
  if (index != -1) {
    submissions.splice(index, 1);
    localStorage[this.key] = JSON.stringify(submissions);
  }
};

History.prototype.clear = function() {
  localStorage.setItem(this.key, JSON.stringify([]));
};

