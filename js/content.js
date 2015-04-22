"use strict";
(function() {
    var button;
    var states = {
        "initial": {
            "html": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6h-6v-2h6v-6h2v6h6v2z"/><path d="M0 0h24v24h-24z" fill="none"/></svg>'
        },
        "done": {
            "html": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24h-24z" fill="none"/><path d="M9 16.17l-4.17-4.17-1.42 1.41 5.59 5.59 12-12-1.41-1.41z"/></svg>'
        },
        "fail": {
            "html": '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24h-24z" fill="none"/><path d="M19.35 10.04c-.68-3.45-3.71-6.04-7.35-6.04-1.48 0-2.85.43-4.01 1.17l1.46 1.46c.76-.4 1.63-.63 2.55-.63 3.04 0 5.5 2.46 5.5 5.5v.5h1.5c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45c1.27-.91 2.11-2.39 2.11-4.07 0-2.64-2.05-4.78-4.65-4.96zm-16.35-4.77l2.75 2.74c-3.19.14-5.75 2.76-5.75 5.99 0 3.31 2.69 6 6 6h11.73l2 2 1.27-1.27-16.73-16.73-1.27 1.27zm4.73 4.73l8 8h-9.73c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z"/></svg>'
        }
    };

    function init() {
        button = document.createElement("button");
        button.id = "wikilist-button";
        setButton("initial");
        button.addEventListener("click", buttonClickListener);
        document.body.appendChild(button);
    }

    function buttonClickListener() {
        addArticle();
    }

    function addArticleSuccess() {
        setButton("done");
        setTimeout(function() {
            button.classList.add("hidden");
        }, 1000);
    }

    function addArticleFailure(why) {
        setButton("fail");
        setTimeout(function() {
            if (why === "done") {
                setButton("done");
                setTimeout(function() {
                    button.classList.add("hidden");
                }, 1000);
            } else {
                setButton("initial");
            }
        }, 2000);
    }

    function setButton(state) {
        if (states[state]) {
            button.setAttribute("data-state", state);
            if (states[state].html) {
                button.innerHTML = states[state].html;
            }
        } else {
            throw "State " + state + " does not exists";
        }
    }

    function addArticle() {
        chrome.storage.sync.get("articles", function(storage) {
            var articles = storage.articles ? storage.articles : [];
            var articleInfo = getArticleInfo();
            if (!findArticle(articles, articleInfo)) {
                articles.push({
                    "slug": articleInfo.slug,
                    "name": articleInfo.name,
                    "lang": articleInfo.lang,
                    "from": articleInfo.from
                });
                chrome.storage.sync.set({
                    "articles": articles
                }, addArticleSuccess);
            } else {
                addArticleFailure("done");
            }
        });
    }

    function findArticle(articles, articleInfo) {
        var required = 2;
        var article = false;
        for (var i = articles.length - 1; i >= 0; i--) {
            if (articles[i].lang === articleInfo.lang) {
                required = required - 1;
            }
            if (articles[i].name === articleInfo.name) {
                required = required - 1;
            }
            if (required <= 0) {
                article = articles[i];
            }
            required = 2;
        }
        return article;
    }

    function getArticleInfo() {
        var tmp;
        var url = {};
        if (document.location.host.indexOf("wikiwand") > -1) {
            url.from = "wikiwand";
            tmp = document.location.pathname.split("/");
            url.lang = tmp[1];
            url.slug = tmp[2];
            url.name = document.querySelector("#article_content_wrapper > section.title_wrapper > h1 > span:nth-child(1)").textContent;
        } else {
            url.from = "wikipedia";
            tmp = document.location.host.split(".");
            url.lang = tmp[0];
            tmp = document.location.pathname.split("/");
            url.slug = tmp[2];
            url.name = document.querySelector("#firstHeading").textContent;
        }
        return url;
    }

    init();
})();
