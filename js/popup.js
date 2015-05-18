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

  function addWaves() {
    var buttons = document.querySelectorAll("md-icon-button,md-tile");
    console.log(buttons);
    for (var i = buttons.length - 1; i >= 0; i--) {
      if (buttons[i] && !buttons[i].matches("md-tile>*")) {
        Waves.attach(buttons[i], ".button" ["waves-circle"]);
      }
    }
    Waves.init();
  }

  function init() {
    var articleList = document.getElementById("article-list");
    var tile, icon, name, read, remove;

    addWaves();

    chrome.storage.local.get("articles", function(storage) {
      var articles = storage.articles ? storage.articles : [];
      if (articles.length < 1) {
        tile = document.createElement("md-tile");
        tile.style.display = "flex";
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
          tile.style.display = "flex";
          tile.setAttribute("data-slug", articles[i].slug);
          tile.setAttribute("data-name", articles[i].name);
          tile.setAttribute("data-lang", articles[i].lang);
          tile.setAttribute("data-offline", articles[i].offline || false);
          tile.addEventListener("click", readArticleClick);

          name = document.createElement("md-text");
          name.textContent = articles[i].name;

          remove = document.createElement("md-icon-button");
          remove.setAttribute("md-image", "icon: bookmark-remove");
          remove.classList.add("hidden");
          remove.addEventListener("click", removeArticleClick);

          read = document.createElement("md-icon-button");
          read.setAttribute("md-image", "icon: launch");
          read.classList.add("hidden");
          read.addEventListener("click", articleTileClick);

          tile.appendChild(name);
          tile.appendChild(remove);
          tile.appendChild(read);

          articleList.appendChild(tile);
        }
      }
      paperkit.init();
      addWaves();
    });
  }

  function removeArticleClick(event) {
    event.stopPropagation();
    var button = event.currentTarget;
    var tile = button.parentNode;
    tile.parentNode.removeChild(tile);
    removeArticle({
      "slug": tile.getAttribute("data-slug"),
      "lang": tile.getAttribute("data-lang")
    });
  }

  function removeArticle(articleInfo) {
    chrome.storage.local.get("articles", function(storage) {
      var articles = storage.articles ? storage.articles : [];
      findArticle(articles, articleInfo, function(articles, i) {
        articles.splice(i, 1);
        return articles;
      });
    });
  }

  function articleTileClick(event) {
    event.stopPropagation();
    var tile = event.currentTarget.parentNode;
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

  function goToArticleIndex(event) {
    var body = event.currentTarget.parentNode.parentNode.parentNode;
    var content = body.querySelector("md-content");
    var toc = content.querySelector("#toc");

    content.scrollTop = toc.offsetTop - 56;
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

  function unsaveArticle(articleInfo) {
    console.log("asdflkajsdñlfka");
    chrome.storage.local.get("articles", function(storage) {
      var modify = {
        "offline": false,
        "content": null
      };
      var articles = storage.articles ? storage.articles : [];
      var article = findArticle(articles, articleInfo, modify);
      var tile = document.querySelector("#article-list md-tile[data-slug=\"" + article.slug + "\"]");
      tile.setAttribute("data-offline", "false");
      unsaveArticleDone();
    });
  }

  function saveArticleDone() {
    var button = document.getElementById("save-button");
    button.setAttribute("md-fill", "cyan-900");
    button.classList.add("on");
  }

  function unsaveArticleDone() {
    var button = document.getElementById("save-button");
    button.removeAttribute("md-fill");
  }

  function saveArticleFromReader(event) {
    var button = event.currentTarget;
    var body = button.parentNode.parentNode.parentNode;
    var articleInfo = {
      "lang": body.getAttribute("data-lang"),
      "slug": body.getAttribute("data-slug")
    };
    if (button.classList.contains("on")) {
      unsaveArticle(articleInfo);
      button.classList.remove("on");
    } else {
      button.setAttribute("md-fill", "grey-400");
      saveArticle(articleInfo);
      button.classList.add("on");
    }
  }

  function readArticleClick(event) {
    event.stopPropagation();
    var tile = event.currentTarget;
    var slug = tile.getAttribute("data-slug");
    var lang = tile.getAttribute("data-lang");
    var name = tile.getAttribute("data-name");
    var offline = tile.getAttribute("data-offline") === "true" || false;
    var url = "http://" + lang + ".wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&titles=" + slug + "&format=json&rvparse";

    document.body.classList.add("read");

    transition.morph(tile, "full", function(container) {
      var body, toolbar, row, closeButton, title, space, tocButton, saveButton, openButton, content;

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

      tocButton = document.createElement("md-icon-button");
      tocButton.id = "toc-button";
      tocButton.classList.add("hidden");
      tocButton.setAttribute("md-image", "icon: format_list_numbered");
      tocButton.addEventListener("click", goToArticleIndex);

      saveButton = document.createElement("md-icon-button");
      saveButton.id = "save-button";
      saveButton.classList.add("hidden");
      saveButton.setAttribute("md-image", "icon: pin");
      saveButton.addEventListener("click", saveArticleFromReader);

      openButton = document.createElement("md-icon-button");
      openButton.setAttribute("md-image", "icon: open_in_new");
      openButton.addEventListener("click", openArticleFromReader);

      row.appendChild(closeButton);
      row.appendChild(title);
      row.appendChild(space);
      row.appendChild(tocButton);
      row.appendChild(saveButton);
      row.appendChild(openButton);

      toolbar.appendChild(row);

      content = document.createElement("md-content");

      body.appendChild(toolbar);
      body.appendChild(content);

      paperkit.initElement(body);

      container.appendChild(body);
      addWaves();

      if (offline) {
        saveButton.classList.add("on");
        saveButton.classList.remove("hidden");
        saveButton.setAttribute("md-fill", "cyan-900");
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

  function articleLoad(response, clean) {
    response = response.srcElement.responseText;
    if (!clean) {
      response = JSON.parse(response);
    }
    var page;
    var body = document.getElementById("read-article");
    var content = body.querySelector("md-content");
    var toolbar = body.querySelector("md-toolbar");

    var lang = body.getAttribute("data-lang");
    var slug = body.getAttribute("data-slug");

    if (response.query) {
      var pages = response.query.pages;
      for (var prop in pages) {
        if (!pages[prop].revisions) {
          break;
        }
        page = pages[prop].revisions[0]["*"];
        toolbar.querySelector("md-row>md-text").innerHTML = "<span class=\"lang\">" + lang + "</span> " + pages[prop].title;
        break;
      }
    } else {
      page = response;
    }

    page = page
      .replace(/\"\/\/upload\.wikimedia\.org/g, "\"http://upload.wikimedia.org")
      .replace(/style="font-size:88%"/g, "md-font-color=\"grey\"")
      .replace(/ style="-moz-column-count:2; -webkit-column-count:2; column-count:2; list-style-type: decimal;"/g, "")
      .replace(/style="font-size:110%"/g, "md-typo=\"caption\"")
      .replace(/style="padding:0.1em;background:#e6e6ff;font-weight:normal;"/g, "class=\"NavHead\"")
      .replace(/background:lightgray;/g, "");

    content.innerHTML = page;

    var i, liElement, refTitle, refList = content.querySelectorAll(".reflist,.listaref");
    var links = content.querySelectorAll("a");
    for (i = links.length - 1; i >= 0; i--) {
      var thisSlug = links[i].getAttribute("href").split("/")[2];
      links[i].setAttribute("data-slug", thisSlug);
      links[i].removeAttribute("href");

      links[i].addEventListener("click", function(e) {
        e.preventDefault();
        var link = e.currentTarget;
        var slug = link.getAttribute("data-slug");
        var saveButton = document.getElementById("save-button");

        saveButton.setAttribute("md-fill", "grey-400");
        /*if (offline) {
          saveButton.setAttribute("md-fill", "cyan-900");
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
        }*/

        var url = "http://" + lang + ".wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&titles=" + encodeURIComponent(slug) + "&format=json&rvparse";

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xhr.addEventListener("load", articleLoad);
        xhr.send();
      });
    }

    for (i = refList.length - 1; i >= 0; i--) {
      refTitle = refList[i].previousElementSibling;
      liElement = refList[i].querySelector("ol.references");
      if (refTitle && liElement) {
        refTitle.classList.add("reference-title");
      }
    }

    var refOl = document.querySelectorAll(".references");
    for (i = refOl.length - 1; i >= 0; i--) {
      if (refOl[i].parentNode.tagName.toLowerCase()) {
        refTitle = refOl[i].previousElementSibling;
        if (refTitle) {
          refTitle.classList.add("reference-title");
        }
      }
    }

    var removeStyleElements = document.querySelectorAll(".vertical-navbox,.NavHead,.infobox,.reflist,.listaref");
    for (i = removeStyleElements.length - 1; i >= 0; i--) {
      removeStyleElements[i].removeAttribute("style");
    }

    if (content.querySelector("#toc")) {
      body.querySelector("#toc-button").classList.remove("hidden");
    }
    addWaves();
  }

  function closeArticle() {
    document.body.classList.remove("read");
    transition.morphBack();
  }



  function findArticle(articles, articleInfo, callback) {
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
        if (callback && typeof callback === "object") {
          for (var prop in callback) {
            articles[i][prop] = callback[prop];
          }
        } else if (callback && typeof callback === "function") {
          articles = callback(articles, i);
        }
        chrome.storage.local.set({
          "articles": articles
        });
        article = articles[i];
        break;
      }
      required = 2;
    }
    return article;
  }

})();
