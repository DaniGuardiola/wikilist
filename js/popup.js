"use strict";
var paperkit = new Paperkit();

var Wikilist = {};
Wikilist.openRandomArticle = function() {
  chrome.tabs.create({
    "url": "http://en.wikipedia.org/wiki/Special:Random"
  });
};

(function() {
  window.addEventListener("load", function() {
    init();
  });

  function init() {
    var articleList = document.getElementById("article-list");
    var tile, icon, name, read;

    chrome.storage.local.get("articles", function(storage) {
      var articles = storage.articles ? storage.articles : [];
      if (articles.length < 1) {
        tile = document.createElement("md-tile");
        tile.addEventListener("click", Wikilist.openRandomArticle);

        icon = document.createElement("md-icon");
        icon.setAttribute("md-image", "icon: dice");

        name = document.createElement("md-text");
        name.textContent = "Go to random article? :)";

        tile.appendChild(icon);
        tile.appendChild(name);

        articleList.appendChild(tile);
      } else {
        for (var i = articles.length - 1; i >= 0; i--) {
          tile = document.createElement("md-tile");
          tile.setAttribute("data-slug", articles[i].slug);
          tile.setAttribute("data-name", articles[i].name);
          tile.setAttribute("data-lang", articles[i].lang);
          tile.setAttribute("data-offline", articles[i].offline || false);
          tile.addEventListener("click", articleTileClick);

          icon = document.createElement("md-icon");
          icon.setAttribute("md-image", "icon: wikipedia");

          name = document.createElement("md-text");
          name.textContent = articles[i].name;

          read = document.createElement("md-icon-button");
          read.setAttribute("md-image", "icon: fullscreen");
          read.classList.add("hidden");
          read.addEventListener("click", readArticleButtonClick);

          tile.appendChild(icon);
          tile.appendChild(name);
          tile.appendChild(read);

          articleList.appendChild(tile);
        }
      }
      paperkit.init();
    });
  }

  function articleTileClick(event) {
    event.stopPropagation();
    var tile = event.currentTarget;
    openArticle({
      "lang": tile.getAttribute("data-lang"),
      "slug": tile.getAttribute("data-slug")
    });
  }

  function openArticle(articleInfo) {
    var url = "http://" + articleInfo.lang + ".wikipedia.org/wiki/" + articleInfo.slug;
    chrome.tabs.create({
      "url": url
    });
  }

  function openArticleFromReader(event) {
    var body = event.currentTarget.parentNode.parentNode.parentNode;
    openArticle({
      "lang": body.getAttribute("data-lang"),
      "slug": body.getAttribute("data-slug")
    });
  }

  function saveArticle(articleInfo) {
    var url = "http://" + articleInfo.lang + ".wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&titles=" + articleInfo.slug + "&format=json&rvparse";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.addEventListener("load", function(response) {
      response = JSON.parse(response.srcElement.responseText);
      chrome.storage.local.get("articles", function(storage) {
        var page, pages = response.query.pages;
        for (var prop in pages) {
          if (!pages[prop].revisions) {
            break;
          }
          page = pages[prop].revisions[0]["*"];
          break;
        }
        var modify = {
          "offline": true,
          "content": page
        };
        var articles = storage.articles ? storage.articles : [];
        var article = findArticle(articles, articleInfo, modify);
        var tile = document.querySelector("#article-list>md-tile[data-slug=\"" + article.slug + "\"]");
        tile.setAttribute("data-offline", "true");
        saveArticleDone();
      });
    });
    xhr.send();
  }

  function saveArticleDone() {
    console.log("HOLAAAAAAAAAAp");
  }

  function saveArticleFromReader(event) {
    var body = event.currentTarget.parentNode.parentNode.parentNode;
    saveArticle({
      "lang": body.getAttribute("data-lang"),
      "slug": body.getAttribute("data-slug")
    });
  }

  function readArticleButtonClick(event) {
    event.stopPropagation();
    var button = event.currentTarget;
    var tile = button.parentNode;
    var slug = tile.getAttribute("data-slug");
    var lang = tile.getAttribute("data-lang");
    var name = tile.getAttribute("data-name");
    var offline = tile.getAttribute("data-offline") === "true" || false;
    var url = "http://" + lang + ".wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&titles=" + slug + "&format=json&rvparse";

    document.body.classList.add("read");

    transition.morph(tile, "full", function(container) {
      var body, toolbar, row, closeButton, title, space, saveButton, openButton, content;

      body = document.createElement("md-body");
      body.id = "read-article";
      body.setAttribute("data-name", name);
      body.setAttribute("data-slug", slug);
      body.setAttribute("data-lang", lang);
      body.setAttribute("data-offline", offline);

      toolbar = document.createElement("md-toolbar");
      toolbar.setAttribute("md-color", "cyan");
      toolbar.setAttribute("md-shadow", "shadow-1");

      row = document.createElement("md-row");
      row.setAttribute("md-type", "standard");

      closeButton = document.createElement("md-icon-button");
      closeButton.setAttribute("md-image", "icon: close");
      closeButton.addEventListener("click", closeArticle);

      title = document.createElement("md-text");
      title.innerHTML = "<span class=\"lang\">" + body.getAttribute("data-lang") + "</span> " + body.getAttribute("data-name");

      space = document.createElement("md-space");

      saveButton = document.createElement("md-icon-button");
      saveButton.setAttribute("md-image", "icon: download");
      saveButton.addEventListener("click", saveArticleFromReader);

      openButton = document.createElement("md-icon-button");
      openButton.setAttribute("md-image", "icon: open_in_new");
      openButton.addEventListener("click", openArticleFromReader);

      row.appendChild(closeButton);
      row.appendChild(title);
      row.appendChild(space);
      row.appendChild(saveButton);
      row.appendChild(openButton);

      toolbar.appendChild(row);

      content = document.createElement("md-content");

      body.appendChild(toolbar);
      body.appendChild(content);

      paperkit.initElement(body);

      container.appendChild(body);

      if (offline) {
        chrome.storage.local.get("articles", function(storage) {
          var articles = storage.articles ? storage.articles : [];
          var article = findArticle(articles, {
            "lang": lang,
            "slug": slug
          });
          articleLoad({
            "srcElement": {
              "responseText": article.content
            }
          }, true);
        });
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xhr.addEventListener("load", articleLoad);
        xhr.send();
      }
    });
  }

  function articleLoad(response, content) {
  	response = response.srcElement.responseText;
  	if (!content) {
    	response = JSON.parse(response);
  	}
    var page;
    var body = document.getElementById("read-article");
    var content = body.querySelector("md-content");
    var toolbar = body.querySelector("md-toolbar");

    if (response.query) {
      var pages = response.query.pages;
      for (var prop in pages) {
        if (!pages[prop].revisions) {
          break;
        }
        page = pages[prop].revisions[0]["*"];
        toolbar.querySelector("md-row>md-text").innerHTML = "<span class=\"lang\">" + body.getAttribute("data-lang") + "</span> " + pages[prop].title;
        break;
      }
    } else {
      page = response;
    }

    page = page
      .replace(/\"\/\/upload\.wikimedia\.org/g, "\"http://upload.wikimedia.org")
      .replace(/style="font-size:88%"/g, "md-font-color=\"grey\"")
      .replace(/ style="-moz-column-count:2; -webkit-column-count:2; column-count:2; list-style-type: decimal;"/g, "")
      .replace(/style="font-size:110%"/g, "md-typo=\"caption\"");

    content.innerHTML = page;
  }

  function closeArticle() {
    document.body.classList.remove("read");
    transition.morphBack();
  }



  function findArticle(articles, articleInfo, modify) {
    var required = 2;
    var article = false;
    for (var i = articles.length - 1; i >= 0; i--) {
      if (articles[i].lang === articleInfo.lang) {
        required = required - 1;
      }
      if (articles[i].slug === articleInfo.slug || articles[i].name === articleInfo.name) {
        required = required - 1;
      }
      if (required <= 0) {
        if (modify) {
          for (var prop in modify) {
            articles[i][prop] = modify[prop];
          }
          chrome.storage.local.set({
            "articles": articles
          });
        }
        article = articles[i];
        break;
      }
      required = 2;
    }
    return article;
  }

})();
