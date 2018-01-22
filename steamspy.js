"use strict";
(function () {
    var root = {};
    (function (root, factory) {
        'use strict';
        if (typeof define === 'function' && define.amd) {
            define(factory);
        } else if (typeof exports === 'object') {
            module.exports = factory();
        } else {
            root.Sanitizer = factory();
        }
    }(root, function () {
        'use strict';

        var Sanitizer = {
            _entity: /[&<>"'/]/g,

            _entities: {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                '\'': '&apos;',
                '/': '&#x2F;'
            },

            getEntity: function (s) {
                return Sanitizer._entities[s];
            },

            /**
             * Escapes HTML for all values in a tagged template string.
             */
            escapeHTML: function (strings, ...values) {
                var result = '';

                for (var i = 0; i < strings.length; i++) {
                    result += strings[i];
                    if (i < values.length) {
                        result += String(values[i]).replace(Sanitizer._entity,
                            Sanitizer.getEntity);
                    }
                }

                return result;
            },
            /**
             * Escapes HTML and returns a wrapped object to be used during DOM insertion
             */
            createSafeHTML: function (strings, ...values) {
                var escaped = Sanitizer.escapeHTML(strings, ...values);
                return {
                    __html: escaped,
                    toString: function () {
                        return '[object WrappedHTMLObject]';
                    },
                    info: 'This is a wrapped HTML object. See https://developer.mozilla.or' +
                    'g/en-US/Firefox_OS/Security/Security_Automation for more.'
                };
            },
            /**
             * Unwrap safe HTML created by createSafeHTML or a custom replacement that
             * underwent security review.
             */
            unwrapSafeHTML: function (...htmlObjects) {
                var markupList = htmlObjects.map(function (obj) {
                    return obj.__html;
                });
                return markupList.join('');
            }
        };

        return Sanitizer;

    }));


    steamSpy();

    function steamSpy() {
        var meta = document.querySelector(".rightcol.game_meta_data");
        if (meta !== undefined) {
            getSteamSpyData(function (error, respone) {
                if (error) {
                    return;
                }
                respone["steam_spy_url"] = "http://steamspy.com/app/" + respone.appid;
                respone["average_forever"] = convertMinsToHrsMins(respone["average_forever"]);
                respone["average_2weeks"] = convertMinsToHrsMins(respone["average_2weeks"]);
                respone["median_forever"] = convertMinsToHrsMins(respone["median_forever"]);
                respone["median_2weeks"] = convertMinsToHrsMins(respone["median_2weeks"]);
                var spyEl = htmlToElement(templateStr(respone));
                meta.insertBefore(spyEl, meta.firstChild);
            });
        }
    }

    /**
     * @param {String} html representing a single element
     * @return {Element}
     */
    function htmlToElement(html) {
        var template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = root.Sanitizer.escapeHTML(html);
        return template.content.firstChild;
    }

    function getSteamSpyData(cb) {
        // window.location.pathname example: /app/667660/Photon_Rush/
        // then split by "/" [ "", "app", "667660", "Photon_Rush", "" ]
        var split = window.location.pathname.split("/");
        if (split.length > 3) {
            var steamAppId = split[2];

            var req = new XMLHttpRequest();
            req.open('GET', 'http://steamspy.com/api.php?request=appdetails&appid=' + steamAppId, true);
            req.onreadystatechange = function () {
                if (req.readyState === 4) {
                    if (req.status === 200)
                        cb(undefined, JSON.parse(req.responseText));
                    else
                        cb(req.status);
                }
            };
            req.send(null);
        } else {
            cb("Invalid url");
        }
    }

    function convertMinsToHrsMins(mins) {
        let h = Math.floor(mins / 60);
        let m = mins % 60;
        h = h < 10 ? '0' + h : h;
        m = m < 10 ? '0' + m : m;
        return `${h}:${m}`;
    }

    function templateStr(p) {
        return `<div>
   <div class="block responsive_apppage_details_left game_details underlined_links">
      <div class="block_content">
         <div class="block_content_inner">
            <div class="details_block">
               <b>Owners:</b> ${p.owners} ± ${p.owners_variance}<br>
               <b>Players (2 weeks):</b> ${p.players_2weeks} ± ${p.players_2weeks_variance}<br>
               <b>Players total:</b> ${p.players_forever} ± ${p.players_forever_variance}<br>
               <b>Peak concurrent players yesterday:</b> ${p.ccu} <br>
               <b>Playtime (2 weeks):</b> ${p.average_2weeks} (AVG) ${p.median_2weeks} (MDN)<br>
               <b>Playtime total:</b> ${p.average_forever} (AVG) ${p.median_forever} (MDN)<br>
            </div>
            <div class="details_block">
               <br>
               <a class="linkbar" href="${p.steam_spy_url}" rel="noopener">
               See more on steamspy
               </a>
            </div>
         </div>
      </div>
   </div>
</div>

`;
    }
}());