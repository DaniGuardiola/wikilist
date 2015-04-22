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
        var tile, icon, name;

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

                    tile.appendChild(icon);
                    tile.appendChild(name);

                    articleList.appendChild(tile);
                }
            }
            paperkit.init();
        });
    }

    function articleTileClick(event) {
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
})();
