// 入力文字エスケープ
function selectorEscape(val){
    //return val.replace(/[ !"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, '\\$&');
    // エスケープ（エスケープとは言ってない）
    return val.replace(/[^\w-]+/g, '');
}

// パラメータが空であるかどうか (未定義または空文字列)
function isEmpty(val) {
    return val == undefined || val == "";
}

// パラメータ付き URL を作ってそこに飛ぶ
function jumpProcess() {
    // URL の変更
    var QueryObj = {
        lbound: $("#difficulty_min").val(),
        ubound: $("#difficulty_max").val(),
        user_name: selectorEscape($("input[name=form_username]").val()),
        rival_name: selectorEscape($("input[name=form_rivalname]").val()),
        hide_ac: $("input[name=hide_ac]:checked").val(),

        show_abc: $("input[name=show_abc]:checked").val(),
        show_arc: $("input[name=show_arc]:checked").val(),
        show_agc: $("input[name=show_agc]:checked").val(),
        show_apc: $("input[name=show_apc]:checked").val(),
        show_other: $("input[name=show_other]:checked").val(),
        show_upcoming: $("input[name=show_upcoming]:checked").val(),
    };
    window.location.href = "index.html?" + $.param(QueryObj);
}

function appendTask(table, point, task, count, status) {
    var $tr = $('<tr>').attr({class: 'dif_'+point});
    var $td, $a;

    // みんなは，「XSS」って，知ってるかな？
    // ...しないようにしようね！

    // 点数
    $td = $('<td>');
    $td.append(point);
    $td.addClass('mask_'+point);
    $tr.append($td);

    // 問題名とリンク
    $td = $('<td>').attr({class: task['screen_name']});
    $td.addClass(status);
    $a = $('<a>').text(task['ctitle']+': '+task['char']).attr({
        href: task['trad_url']
    });
    $td.append($a);
    $td.append(' ');
    $a = $('<a>').text('[beta]').attr({
        href: task['beta_url']
    });
    $td.append($a);
    $tr.append($td);

    // writer さんたち．このリンクも beta にした方がいいのかしら．
    $td = $('<td>').attr({class: task['screen_name']});
    $td.addClass(status);
    $.each(task['writers'], function(i, writer) {
        var name = writer[0], color = writer[1];
        if (name == '' || name === null)
            return;

        if (i > 0)
            $td.append(', ');

        if (color == '' || color === null) {
            // 'anonymous', 'other', etc.
            $td.append('<span>'+name+'</span>');
        } else if (color == 'username') {
            $td.append($('<a>').text(name).attr({
                class: 'username',
                href: 'https://atcoder.jp/user/'+name,
            }));
        } else {
            // ここが綺麗じゃないような気がするので修正が入るかもしれません．
            $a = $('<a>').attr({
                class: 'username',
                href: 'https://atcoder.jp/user/'+name,
            });
            $a.append($('<span>').text(name).attr({
                class: color,
            }));
            $td.append($a);
        }
    });
    $tr.append($td);

    // 部分点
    $td = $('<td>').attr({class: task['screen_name']});
    $td.addClass(status);
    if (task['partial'] !== null) {
        $td.text(task['partial'])
    } else {
        $td.text('-');
    }
    $tr.append($td);

    // もし問題の順番がおかしくなる案件が観測された場合には
    // この 2 行をコメントアウトします．こっちの方が速く
    // 動作しているっぽいので現状こっちで様子を見ます．
    $(table).append($tr);
    return;

    var timer = setInterval(function() {
        if ($(table+'>tr').length < count) return;
        clearInterval(timer);

        $(table).append($tr);
    }, 10);
};

function setTable() {
    // スクロール可能なテーブル．もっとマシな書き方がありそう定期
    // スクロールバーの上に余白があるの，気持ち悪いかも？
    var width = $('#mainconttable').width();
    $('.scroll').attr({
        width: width+'px',
        style: "white-space: nowrap",
    }).css('overflow-x', 'auto');
}

var timerSet = false;
$(window).on('resize', function() {
    if (timerSet !== false) {
        clearTimeout(timerSet);
    }
    timerSet = setTimeout(function() {
        setTable();
    }, 200);
});

function prettifyUser(who, name) {
    // えびちゃんこだわりポイントみたいなの，正直どうかと思うんですよね
    // えびより

    // 色が変わるスパンはそんなに短くない（一週間単位）なので
    // キャッシュの長さは長めでいいよなぁと思うのだけど，
    // せっかく色昇格してもなかなか変わらないとアレなので参る．
    // コンテストのありそうな土日の夜中だけ早めにするとかもできるけど，
    // 面倒なので，今のところ 30 分で更新にします

    var cacheExpires = 30 * 60 * 1000;  // ms
    var curTime = Math.floor(Date.now()/cacheExpires);

    var imageXpath = "//img[contains(@src, '/public/img/icon/crown')]";
    var imageUrl = "https://atcoder.jp/user/" + name;
    var imageYql = (
        "https://query.yahooapis.com/v1/public/yql?format=json&"
            + "env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&q="
            + 'select * from htmlstring where '
            + 'url="' + imageUrl + '" and xpath="' + imageXpath + '"'
            + '&tsurai=' + curTime
    );
    var imgName = null;

    var userXpath = "//a[@class='username']/span"
    var userUrl = "https://atcoder.jp/user/" + name;
    var userYql = (
        "https://query.yahooapis.com/v1/public/yql?format=json&"
            + "env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&q="
            + 'select * from htmlstring where '
            + 'url="' + userUrl + '" and xpath="'+userXpath+'"'
            + '&tsurai=' + curTime
    );

    $.ajax({
        type: 'GET',
        url: imageYql,
        // dataType: 'json',
        cache: false,
    }).done(function(data) {
        var reply = data.query.results.result;
        if (reply != '') {
            imgName = reply.match(/crown\d+.gif/)[0];
        }

        $.ajax({
            type: 'GET',
            url: userYql,
            dataType: 'json',
            cache: false,
        }).done(function(data) {
            var reply = data.query.results.result;
            var html = $.parseHTML(reply);
            html = (html === null ? null : html[0]);
                
            var $a = $('<a>').attr({
                href: userUrl,
            }).text(name);
            if (html !== null) {
                // これが null だった場合たぶん存在しないユーザなので
                // 何かしらの例外処理をやるかもです
                var style = $(html).attr('style') || '';
                var class_ = $(html).attr('class') || '';

                if (class_.match(/user-\w+/)) {
                  $a.attr({class: class_});
                } else if (style.match(/color:#[\dA-Fa-f]{3}[\dA-Fa-f]{3}?/)) {
                  $a.attr({style: style});
                }
            }
            $('#prog_'+who+'_name').html($a);
            $('#ac_count_'+who+'_name').html($a.clone());

            if (imgName != '' && imgName !== null) {
                var $img = $('<img>').attr({
                    src: './img/'+imgName,
                });
                $('#prog_'+who+'_name').prepend(' ');
                $('#prog_'+who+'_name').prepend($img);
                $('#ac_count_'+who+'_name').prepend(' ');
                $('#ac_count_'+who+'_name').prepend($img.clone());
            }
        })
    });
}

$(window).on("load", function() {
    var width = $('#mainconttable').width();
    setTimeout(function() {
        setTable();
    }, 0);

    // 難易度の MAX (割る 100)
    const MAX_D = 24;

    // URL パース
    // ここだけ UpperCamelCase なのがアレなのでそのうち直します
    var UserUrl = $(location).attr('search');
    var Params = $.url(UserUrl).param();
    var UserName, RivalName, HideAC, lb, ub;
    var showABC, showARC, showAGC, showAPC, showOther;
    var showUpcoming;

    // console.log(Params);

    // = の記号の位置を揃えるの，新しい要素を加えるときに面倒なので
    // どうにかするかもしれません．
    // 見やすいだろうと言われると見やすい気はするんですけどね...

    // パラメータの取得と反映
    UserName  = Params.user_name;
    RivalName = Params.rival_name;
    HideAC    = Params.hide_ac;
    lb        = Params.lbound;
    ub        = Params.ubound;

    UserName  = isEmpty(UserName)  ? ""          : selectorEscape(UserName);
    RivalName = isEmpty(RivalName) ? ""          : selectorEscape(RivalName);
    // .../index.html でアクセスしたときは false になっていてほしい
    HideAC    = (HideAC == "on");
    showUpcoming = (Params.show_upcoming == "on");
    // ↑こういうところだぞ（揃えるやつ）
    lb        = isEmpty(lb)        ? 100         : parseInt(selectorEscape(lb));
    ub        = isEmpty(ub)        ? MAX_D * 100 : parseInt(selectorEscape(ub));

    // .../index.html でアクセスしたときは true になっていてほしい
    showABC   = (Params.show_abc != "");
    showARC   = (Params.show_arc != "");
    showAGC   = (Params.show_agc != "")
    showAPC   = (Params.show_apc != "");
    showOther = (Params.show_other != "");

    // パラメータをフォームに反映 (入力情報の保存)
    $('input[name=form_username]').val(UserName);
    $('input[name=form_rivalname]').val(RivalName);
    $('input[name=hide_ac]').prop('checked', HideAC);
    $('#difficulty_min').val(lb);
    $('#difficulty_max').val(ub);
    
    $('input[name=show_abc]').prop('checked', showABC);
    $('input[name=show_arc]').prop('checked', showARC);
    $('input[name=show_agc]').prop('checked', showAGC);
    $('input[name=show_apc]').prop('checked', showAPC);
    $('input[name=show_other]').prop('checked', showOther);
    $('input[name=show_upcoming]').prop('checked', showUpcoming);

    $('.selectpicker').selectpicker('refresh');

    // 難易度絞り込み
    // 逆でも対応する優しい世界
    if (lb > ub) {
        var temp = lb;
        lb = ub; ub = temp;
    }

    // API をぺちぺちします．
    var url = 'https://query.yahooapis.com/v1/public/yql?callback=?';
    var cacheExpires = 300 * 1000;  // ms
    // キャッシュを効かせる時間は変更するかもしれません．
    // 300 秒という値になにかこだわりがあるわけではありません．

    var curTime = Math.floor(Date.now()/cacheExpires);
    // 1 行 79 文字過激派しゃん...
    // （変な所で改行が入るよりは見やすいかなぁと思っています）
    var query = (
        'select * from json where '
            + 'url="http://beta.kenkoooo.com/atcoder/atcoder-api/results?user='
            + UserName + '&rivals=' + RivalName + '&tsurai=' + curTime + '"'
    );

    // JSON を取ってきて提出状況に応じて色を付ける
    var setUserAC = new Set();
    var setUserNotAC = new Set();
    var setRivalAC = new Set();
    var setRivalNotAC = new Set();
    var setAllProblems = new Set();
    // problem より task がいいのかなぁみたいな気持ちになっています

    var STATE_FLAGS = {
        USER_AC: 1,
        USER_SUBMITTED: 1<<1,
        RIVAL_AC: 1<<2,
        RIVAL_SUBMITTED: 1<<3,
    };

    var count = 0;
    $.getJSON(
        url, {q: query, format: 'json'},
        function(data) {
            // var tic = Date.now();
            if (data.query.results === null) return;

            $(data.query.results.json.json).each(function() {
                var pid = this.problem_id;

                if (this.user_id == UserName) {
                    if (this.result == "AC") {
                        setUserAC.add(pid);
                        setUserNotAC.delete(pid);
                    } else {
                        if (!setUserAC.has(pid)) {
                            setUserNotAC.add(pid);
                        }
                    }
                } else {
                    if (this.result == "AC") {
                        setRivalAC.add(pid);
                        setRivalNotAC.delete(pid);
                    } else {
                        if (!setRivalNotAC.has(pid)) {
                            setRivalNotAC.add(pid);
                        }
                    }
                }
            });
            // var toc = Date.now();
            // console.log(toc-tic+' ms in $.getJSON()');
        }
    ).done(function() {
        var setUpcoming = new Set();
        if (!showUpcoming) {
            var xpath = (
                "//div[@id='collapse-contest']/div[2]"
                    + "//tr//td[2]//a"
            );
            var url = "https://atcoder.jp/?lang=ja";
            var yql = (
                "https://query.yahooapis.com/v1/public/yql?format=json"
                    + "&env=store%3A%2F%2Fdatatables.org%2F"
                    + "alltableswithkeys&q="
                    + 'select * from htmlstring where '
                    + 'url="' + url + '" and xpath="' + xpath + '"'
                    + '&tsurai=' + curTime
            );
            var cacheExpires = 60 * 60 * 1000;  // ms
            var curTime = Math.floor(Date.now()/cacheExpires);
            $.ajax({
                type: 'GET',
                url: yql,
                async: false,
                // async でやってると，setUpcoming が用意される前に
                // 出力されてしまってつらくなる．別にいい方法があれば
                // 嬉しいなぁ．というかちょくちょくボトルネックを作る
                // 設計になっていてひどいのはそれはそうなんだよなぁ．
                // ボトルネックが増えるたびにインデントが深くなる方法は
                // すきじゃないので，そういうのじゃないのがいいです．
            }).done(function(data) {
                var links = data.query.results.result;
                var tradURL = /https:\/\/([\w-]+)\.contest\.atcoder\.jp/;
                var BetaURL = /https:\/\/beta\.atcoder\.jp\/contests\/([w-]+)/;
                $.each(links.split('\n'), function(i, link) {
                    var href = $(link).attr('href');
                    var prefix = (
                        href.match(tradURL)[1] || href.match(BetaURL)[1]
                    );
                    if (!prefix) {
                        // tsurai
                    }
                    setUpcoming.add(prefix);
                    // console.log(prefix);
                });
            });
        }

        $.ajax({
            dataType: 'json',
            url: './tasks.json',
            mimeType: 'application/json',
            data: {},
            success: function(data) {
                var showTable = (UserName.length > 0 || RivalName.length > 0);
                if (showTable) {
                    setTimeout(function() {
                        document.getElementById('progresstable').style
                            .display = 'table'

                        document.getElementById('ac_count').style
                            .display = 'table'

                        document.getElementById('num_user_ac').innerHTML = 0;
                        document.getElementById('num_user_not_ac')
                            .innerHTML = 0;

                        document.getElementById('num_rival_ac').innerHTML = 0;
                        document.getElementById('num_rival_not_ac')
                            .innerHTML = 0;
                    }, 0);
                }

                // 点数ごとに，総問題数およびユーザ/ライバルの AC 数を持っておく．
                // ライバルはユーザではないの？ みたいな疑問があるけど気にしない．
                var countAll = Array(MAX_D);
                var countUserAC = Array(MAX_D);
                var countRivalAC = Array(MAX_D);
                for (var i=0; i<MAX_D; ++i) {
                    // countAll[i] は O(1) でわかるのでそのときにやる
                    // ↑ foo.length を O(1) だと思って言っています
                    // ↑ と思ったけどやっぱり逐一やることにしました
                    countAll[i] = 0;
                    countUserAC[i] = 0;
                    countRivalAC[i] = 0;
                }

                // 総合得点
                var totalWhole = 0;
                var totalUser = 0;
                var totalRival = 0;

                var numUserAC = 0;
                var numUserNotAC = 0;
                var numUserUnsubmitted = 0;

                var numRivalAC = 0;
                var numRivalNotAC = 0;
                var numRivalUnsubmitted = 0;
                $.each(data, function(point, tasks) {
                    // 冷静に考えると，あつかいやすい JSON を作っておいて，
                    // getJSON の段階でフィルタをかけられるようにすると
                    // こんなまどろっこしいことをする必要がないのでは？
                    // これはえびちゃんが悪いですね．具体的な方針を考えます．

                    // コンテスト絞り込みとかは getJSON の時点で済ませて
                    // しまいたいです．そうすればもらった時点で存在する得点帯か
                    // どうかがわかるので，後から 'none' にする必要がなくなり，
                    // テーブルの形状の変更がなくなって（見栄えが）いいです

                    // と思ったけど YQL 使ってなかったね（ア）
                    // （クロスオリジンでないため）．
                    // select * ... where (contest_type = ... OR ...)
                    //   AND NOT (prefix = ... OR ...)
                    // みたいなことをしたかった．クエリをぺちぺちする前に
                    // 開催前コンテストを取得してそれを使う感じで．

                    // あっとこーだーはほとんど遅延しないからそこまで動的に
                    // しなくてもいいかもだけど，たぶんこの方が楽．

                    /*
                      というかブロックコメントって知っていますか？
                    */

                    // 知っています．

                    // まぁそのうち書き直します．わりと大幅に書き換えることに
                    // なるだろうなぁ．というかえびちゃん-readable な JSON を
                    // 生成しないと目視での確認がしにくいことに気付いたので
                    // そっちも直さないとね．

                    // 冷静に考えてこういうお気持ちは別ファイルに書くべきだね．

                    var iPt = Math.floor(point/100)-1;

                    var idHead = 'prog_head_' + point;
                    var idWhole = 'prog_whole_' + point;
                    var idUser = 'prog_user_' + point;
                    var idRival = 'prog_rival_' + point;

                    var elHead = document.getElementById(idHead);
                    var elWhole = document.getElementById(idWhole);
                    var elUser = document.getElementById(idUser);
                    var elRival = document.getElementById(idRival);

                    var ptColor =
                        window.getComputedStyle(elWhole).backgroundColor
                        .match(/\d+/g).join(',');

                    elUser.style.backgroundColor =
                        'rgba(' + ptColor + ',' + 0.0 + ')';
                    elRival.style.backgroundColor =
                        'rgba(' + ptColor + ',' + 0.0 + ')';

                    // 点数が指定範囲外であれば最初から書かないことにしましょう
                    if (!(lb <= point && point <= ub) || tasks.length == 0) {
                        setTimeout(function(elHead, elWhole, elUser, elRival) {
                            elHead.style.display = 'none';
                            elWhole.style.display = 'none';
                            elUser.style.display = 'none';
                            elRival.style.display = 'none';
                        }.bind(null, elHead, elWhole, elUser, elRival), 0);
                        return;
                    }

                    $.each(tasks, function(i, task) {
                        var pid = task['screen_name'];

                        // if (pid.match(/abc\d+/)) {
                        //     if (!showABC) return;
                        // } else if (pid.match(/arc\d+/)) {
                        //     if (!showARC) return;
                        // } else if (pid.match(/agc\d+/)) {
                        //     if (!showAGC) return;
                        // } else if (pid.match(/apc\d+/)) {
                        //     if (!showAPC) return;
                        // } else {
                        //     if (!showOther) return;
                        // }
                        // ↑ これだと other のマッチをはぶけるけど，
                        // より軽そうな短絡評価を利用できない．
                        // 下のとどっちがいいかはそのうち考える．
                        // /a([brgp])c\d+/ とかをしてマッチ部分をえいえいすると
                        // 効率いいのかも？

                        if (!showABC && pid.match(/abc\d+/)) return;
                        if (!showARC && pid.match(/arc\d+/)) return;
                        if (!showAGC && pid.match(/agc\d+/)) return;
                        if (!showAPC && pid.match(/apc\d+/)) return;
                        if (!showOther && !pid.match(/a[brgp]c\d+/)) return;

                        var prefix = task['beta_url'].split('/')[4];
                        if (!showUpcoming && setUpcoming.has(prefix)) {
                            return;
                        }

                        setTimeout(function(point, task, count) {
                            var pid = task['screen_name'];

                            var idUser = 'prog_user_' + point;
                            var idRival = 'prog_rival_' + point;
                            var idWhole = 'prog_whole_' + point;
                            var elUser = document.getElementById(idUser);
                            var elRival = document.getElementById(idRival);
                            var elWhole = document.getElementById(idWhole);
                            var ptColor =
                                window.getComputedStyle(elWhole).backgroundColor
                                .match(/\d+/g).join(',');
                            var iPt = Math.floor(point/100)-1;
                            var state = 0;

                            if (setUserAC.has(pid)) {
                                state |= STATE_FLAGS.USER_AC;
                                state |= STATE_FLAGS.USER_SUBMITTED;
                                totalUser += parseInt(point);
                                document.getElementById('num_user_ac')
                                    .innerHTML = ++numUserAC;
                                document.getElementById('prog_user_total')
                                    .innerHTML = totalUser;
                            } else if (setUserNotAC.has(pid)) {
                                state |= STATE_FLAGS.USER_SUBMITTED;
                                document.getElementById('num_user_not_ac')
                                    .innerHTML = ++numUserNotAC;
                            } else {
                                document.getElementById('num_user_unsubmitted')
                                    .innerHTML = ++numUserUnsubmitted;
                            }

                            if (setRivalAC.has(pid)) {
                                state |= STATE_FLAGS.RIVAL_AC;
                                state |= STATE_FLAGS.RIVAL_SUBMITTED;
                                totalRival += parseInt(point);
                                document.getElementById('num_rival_ac')
                                    .innerHTML = ++numRivalAC;
                                document.getElementById('prog_rival_total')
                                    .innerHTML = totalRival;
                            } else if (setRivalNotAC.has(pid)) {
                                state |= STATE_FLAGS.RIVAL_SUBMITTED;
                                document.getElementById('num_rival_not_ac')
                                    .innerHTML = ++numRivalNotAC;
                            } else {
                                document
                                    .getElementById('num_rival_unsubmitted')
                                    .innerHTML = ++numRivalUnsubmitted;
                            }

                            var st = null;
                            if (state & STATE_FLAGS.USER_AC) {
                                // 他の class になっていないはずなので
                                // removeClass していません（まずい？）
                                // $('td.'+pid).addClass('success');
                                st = 'success';
                                ++countUserAC[iPt];
                            } else if (state & STATE_FLAGS.RIVAL_AC) {
                                // $('td.'+pid).addClass('danger');
                                st = 'danger';
                            } else if (state & STATE_FLAGS.USER_SUBMITTED) {
                                // $('td.'+pid).addClass('warning');
                                st = 'warning';
                            } else /* if (state & STATE_FLAGS.RIVAL_SUBMITTED) */ {
                                // 自分は未提出 && ライバルは提出（未 AC）
                                // みたいな場合はどうしますか？
                                // Problems は黄色にしていたようななかったような
                            }

                            if (!(HideAC && (state & STATE_FLAGS.USER_AC))) {
                                // 問題を追加するよ
                                // AC 非表示の場合は，表示はしないけど
                                // 諸々のカウントはすることにしています
                                appendTask(
                                    '#mainconttable>tbody', point, task, count,
                                    st
                                );
                            }

                            if (state & STATE_FLAGS.RIVAL_AC) {
                                ++countRivalAC[iPt];
                            }

                            elWhole.innerHTML = ++countAll[iPt];
                            elUser.innerHTML = countUserAC[iPt];
                            elRival.innerHTML = countRivalAC[iPt];

                            totalWhole += parseInt(point);
                            document.getElementById('prog_whole_total')
                                .innerHTML = totalWhole;

                            // 濃淡を変える
                            // rgba の a だけスマートに変える方法ないですか？
                            // ↑ 575（えびより）
                            elUser.style.backgroundColor = (
                                'rgba(' + ptColor + ','
                                    + countUserAC[iPt] / countAll[iPt] + ')'
                            );

                            elRival.style.backgroundColor = (
                                'rgba(' + ptColor + ','
                                    + countRivalAC[iPt] / countAll[iPt] + ')'
                            );
                        }.bind(null, point, task, count), 0);
                        // 問題の処理おわり

                        if (!(HideAC && setUserAC.has(task['screen_name']))) {
                            ++count;
                        }
                    });  // その得点における全問題の処理おわり
                });  // 全問題の処理おわり
            }
        }).done(function() {
            var timer = setInterval(function() {
                // console.log($('#mainconttable>tbody>tr').length+' '+count);
                if ($('#mainconttable>tbody>tr').length < count) return;
                clearInterval(timer);

                for (var i=1; i<=MAX_D; ++i) {
                    var point = 100*i;
                    var idHead = 'prog_head_' + point;
                    var idWhole = 'prog_whole_' + point;
                    var idUser = 'prog_user_' + point;
                    var idRival = 'prog_rival_' + point;

                    var elHead = document.getElementById(idHead);
                    var elWhole = document.getElementById(idWhole);
                    var elUser = document.getElementById(idUser);
                    var elRival = document.getElementById(idRival);

                    // console.log(point+' '+elWhole.innerHTML);
                    if (elWhole.innerHTML == "0") {
                        elHead.style.display = 'none';
                        elWhole.style.display = 'none';
                        elUser.style.display = 'none';
                        elRival.style.display = 'none';
                    }
                }

                $("#mainconttable").tablesorter();
            }, 10);
        })
    });

    // こういうのいらないですか？
    prettifyUser('user', UserName);
    prettifyUser('rival', RivalName);

    // ボタンを押したらパラメータ付き URL に飛ぶ
    $("#difficulty_submit").click(jumpProcess);

    // テキストフォームで Enter キーを押したらパラメータ付き URL に飛ぶ
    $(document).on("keypress", "input[name=form_username]", function(e) {
        if(e.keyCode == 13) jumpProcess();
        else $.noop();
    });
    $(document).on("keypress", "input[name=form_rivalname]", function(e) {
        if(e.keyCode == 13) jumpProcess();
        else $.noop();
    });

    // User, Rival の進捗状況を表示するかどうか (空文字列なら表示しない)
    if (UserName  == "") {
        $(".result_user").css('display', 'none');
        document.getElementById('progress_user').style.display = 'none';
        document.getElementById('ac_count_user').style.display = 'none';
    } else {
        $(".result_user").css('display', 'block');
        document.getElementById('progress_user').style.display = 'table-row';
        document.getElementById('ac_count_user').style.display = 'table-row';
    }

    if (RivalName == "") {
        $(".result_rival").css('display', 'none');
        document.getElementById('progress_rival').style.display = 'none';
        document.getElementById('ac_count_rival').style.display = 'none';
    } else {
        $(".result_rival").css('display', 'block');
        document.getElementById('progress_rival').style.display = 'table-row';
        document.getElementById('ac_count_rival').style.display = 'table-row';
    }
});

/*
$(window).on('load resize', function(){
    // navbarの高さを取得する
    var height = $('.navbar').height();
    // bodyのpaddingにnavbarの高さを設定する
    $('body').css('padding-top',height + 20); 
});
*/
