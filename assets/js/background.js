// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


chrome.tabs.onActivated.addListener(function(activeInfo) {
  //insertDictionaryScript();
  console.log(activeInfo);
  chrome.tabs.get(activeInfo.tabId, function(tab){
    //console.log(tab.url);
    //chrome.declarativeContent.ShowPageAction();
    //let regexTest = /https:\/\/(.*lightning\.force\.com|.*salesforce\.com)(.*\/)([0-9A-Za-z]{15,18})\\??.*$/
    let regexTest = /https:\/\/(.*lightning\.force\.com|.*salesforce\.com)\\??.*$/
    if(regexTest.test(tab.url)){
      chrome.pageAction.show(activeInfo.tabId);
    }else{
      chrome.pageAction.hide(activeInfo.tabId);
    }
    
 });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  //insertDictionaryScript();
  console.log(tabId);
  //let regexTest = /https:\/\/(.*lightning\.force\.com|.*salesforce\.com)(.*\/)([0-9A-Za-z]{15,18})\\??.*$/
  let regexTest = /https:\/\/(.*lightning\.force\.com|.*salesforce\.com)\\??.*$/
  if(regexTest.test(tab.url)){
    chrome.pageAction.show(tabId);
  }else{
    chrome.pageAction.hide(tabId);
  }
});
