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

        chrome.storage.sync.get("articles", function(storage) {
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
                    tile.setAttribute("data-lang", articles[i].lang);
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

    function readArticleButtonClick(event) {
        event.stopPropagation();
        var button = event.currentTarget;
        var tile = button.parentNode;
        var slug = tile.getAttribute("data-slug");
        var lang = tile.getAttribute("data-lang");
        var url = "http://" + lang + ".wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&titles=" + slug + "&format=json&rvparse";

        document.body.classList.add("read");

        transition.morph(tile, "full", function(container) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.addEventListener("load", function() {
                var response = JSON.parse(xhr.responseText);
                var pages = response.query.pages;
                var titleText, page, body, toolbar, row, closeButton, title, content;

                for (var prop in pages) {
                    if (!pages[prop].revisions) {
                        break;
                    }
                    page = pages[prop].revisions[0]["*"];
                    titleText = pages[prop].title;
                    page = page
                        .replace(/\"\/\/upload\.wikimedia\.org/g, "\"http://upload.wikimedia.org")
                        .replace(/ style="font-size:88%"/g, " md-font-color=\"grey\"");
                    break;
                }

                body = document.createElement("md-body");
                body.id = "read-article";

                toolbar = document.createElement("md-toolbar");
                toolbar.setAttribute("md-color", "cyan");

                row = document.createElement("md-row");
                row.setAttribute("md-type", "standard");

                closeButton = document.createElement("md-icon-button");
                closeButton.setAttribute("md-image", "icon: close");
                closeButton.addEventListener("click", closeArticle);

                title = document.createElement("md-text");
                title.textContent = titleText;

                row.appendChild(closeButton);
                row.appendChild(title);

                toolbar.appendChild(row);

                content = document.createElement("md-content");
                content.innerHTML = page;

                body.appendChild(toolbar);
                body.appendChild(content);

                paperkit.initElement(body);

                container.appendChild(body);

                console.log(page);
            });
            xhr.send();
        });
    }

    function closeArticle() {
        document.body.classList.remove("read");
        transition.morphBack();
    }
})();
