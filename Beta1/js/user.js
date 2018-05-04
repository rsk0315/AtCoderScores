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
        hide_ac: $("input[name=form_not_ac]:checked").val(),

        show_abc: $("input[name=filter_abc]:checked").val(),
        show_arc: $("input[name=filter_arc]:checked").val(),
        show_agc: $("input[name=filter_agc]:checked").val(),
        show_apc: $("input[name=filter_apc]:checked").val(),
        show_other: $("input[name=filter_other]:checked").val(),
    };
    window.location.href = "index.html?" + $.param(QueryObj);
}

function appendTask($table, point, task) {
    var $tr = $('<tr>').attr({
        class: 'dif_'+point,
    });
    $table.append($tr);
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
    if (task['partial'] !== null) {
        $td.text(task['partial'])
    } else {
        $td.text('-');
    }
    $tr.append($td);
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
        dataType: 'json',
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
                var style = $(html).attr('style');
                var class_ = $(html).attr('class');
                
                if (style === undefined) style = '';
                if (class_ === undefined) class_ = '';

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

var timerSet = false;
$(window).on('resize', function() {
    if (timerSet !== false) {
        clearTimeout(timerSet);
    }
    timerSet = setTimeout(function() {
        setTable();
    }, 200);
});

$(window).on("load", function() {
    var width = $('#mainconttable').width();
    setTimeout(function() {
        setTable();
    }, 0);

    // 難易度の MAX (割る 100)
    const MAX_D = 24;

    // URL パース
    var UserUrl = $(location).attr('search');
    var Params = $.url(UserUrl).param();
    var UserName, RivalName, HideAC, lb, ub;
    var showABC, showARC, showAGC, showAPC, showOther;

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
    // HideAC    = isEmpty(HideAC)    ? "off"       : selectorEscape(HideAC);
    // HideAC    = (!isEmpty(HideAC));
    // .../index.html でアクセスしたときは false になっていてほしい
    HideAC    = (HideAC == "on");
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
    $('input[name=form_not_ac]').prop('checked', HideAC);
    $('#difficulty_min').val(lb);
    $('#difficulty_max').val(ub);
    
    $('input[name=filter_abc]').prop('checked', showABC);
    $('input[name=filter_arc]').prop('checked', showARC);
    $('input[name=filter_agc]').prop('checked', showAGC);
    $('input[name=filter_apc]').prop('checked', showAPC);
    $('input[name=filter_other]').prop('checked', showOther);

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
    ).done(function() {$.ajax({
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
                    document.getElementById('num_user_not_ac').innerHTML = 0;

                    document.getElementById('num_rival_ac').innerHTML = 0;
                    document.getElementById('num_rival_not_ac').innerHTML = 0;
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
                    setTimeout(function(point, task_) {
                        var pid = task_['screen_name'];

                        if (pid.match(/abc\d+/)) {
                            if (!showABC) return;
                        } else if (pid.match(/arc\d+/)) {
                            if (!showARC) return;
                        } else if (pid.match(/agc\d+/)) {
                            if (!showAGC) return;
                        } else if (pid.match(/apc\d+/)) {
                            if (!showAPC) return;
                        } else {
                            if (!showOther) return;
                        }

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
                            document.getElementById('num_rival_unsubmitted')
                                .innerHTML = ++numRivalUnsubmitted;
                        }

                        if (!(HideAC && (state & STATE_FLAGS.USER_AC))) {
                            // 問題を追加するよ
                            // AC 非表示の場合は，表示はしないけど
                            // 諸々のカウントはすることにしています
                            appendTask(
                                $('#mainconttable>tbody'), point, task_
                            );
                        }

                        if (state & STATE_FLAGS.USER_AC) {
                            // 他の class になっていないはずなので
                            // removeClass していません（まずい？）
                            $('td.'+pid).addClass('success');
                            ++countUserAC[iPt];
                        } else if (state & STATE_FLAGS.RIVAL_AC) {
                            $('td.'+pid).addClass('danger');
                        } else if (state & STATE_FLAGS.USER_SUBMITTED) {
                            $('td.'+pid).addClass('warning');
                        } else /* if (state & STATE_FLAGS.RIVAL_SUBMITTED) */ {
                            // 自分は未提出 && ライバルは提出（未 AC）
                            // みたいな場合はどうしますか？
                            // Problems は黄色にしていたようななかったような
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
                    }.bind(null, point, task), 0);
                    // 問題の処理おわり

                });  // その得点における全問題の処理おわり

                // あれ？ そういえば camelCase と snake_case が混在していますね
                // そのうち（たぶん前者に）統一します
            });  // 全問題の処理おわり
        }
    }).done(function() {
        // setTimeout しないで生で書くとうまくいかない
        setTimeout(function() {

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

                if (elWhole.innerHTML == "0") {
                    elHead.style.display = 'none';
                    elWhole.style.display = 'none';
                    elUser.style.display = 'none';
                    elRival.style.display = 'none';
                }
            }

            $("#mainconttable").tablesorter();
        }, 0);
    })});

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
