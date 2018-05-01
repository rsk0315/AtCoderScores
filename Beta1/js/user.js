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
        hide_ac: $("input[name=form_notac]:checked").val()
    };
    window.location.href = "index.html?" + $.param(QueryObj);
}

function append_task($table, point, task) {
    // $table.append('<tr class="dif_'+point+'">');
    // var $tr = $table.find('tr:last');
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
    }).css('overflow-x', 'auto');
}

var timer_set = false;
$(window).on('resize', function() {
    if (timer_set !== false) {
        clearTimeout(timer_set);
    }
    timer_set = setTimeout(function() {
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

    // パラメータの取得と反映
    UserName  = Params.user_name;
    RivalName = Params.rival_name;
    HideAC    = Params.hide_ac;
    lb        = Params.lbound;
    ub        = Params.ubound;

    UserName  = isEmpty(UserName)  ? ""          : selectorEscape(UserName);
    RivalName = isEmpty(RivalName) ? ""          : selectorEscape(RivalName);
    // HideAC    = isEmpty(HideAC)    ? "off"       : selectorEscape(HideAC);
    HideAC    = (isEmpty(HideAC) == "on");
    lb        = isEmpty(lb)        ? 100         : parseInt(selectorEscape(lb));
    ub        = isEmpty(ub)        ? MAX_D * 100 : parseInt(selectorEscape(ub));

    // なんで HideAC が true/false じゃないんですか？ あとで直しますね
    // 直しました

    // パラメータをフォームに反映 (入力情報の保存)
    $('input[name=form_username]').val(UserName);
    $('input[name=form_rivalname]').val(RivalName);
    $('input[name=form_notac]').prop('checked', HideAC);
    $('#difficulty_min').val(lb);
    $('#difficulty_max').val(ub);
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
    var set_user_AC = new Set();
    var set_user_not_AC = new Set();
    var set_rival_AC = new Set();
    var set_rival_not_AC = new Set();
    var set_all_problems = new Set();
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
                        set_user_AC.add(pid);
                        set_user_not_AC.delete(pid);
                    } else {
                        if (!set_user_AC.has(pid)) {
                            set_user_not_AC.add(pid);
                        }
                    }
                } else {
                    if (this.result == "AC") {
                        set_rival_AC.add(pid);
                        set_rival_not_AC.delete(pid);
                    } else {
                        if (!set_rival_not_AC.has(pid)) {
                            set_rival_not_AC.add(pid);
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

                    var link_user = (
                        '<a href="https://atcoder.jp/user/' + UserName + '">'
                            + UserName + '</a>'
                    );
                    var link_rival = (
                        '<a href="https://atcoder.jp/user/' + RivalName + '">'
                            + RivalName + '</a>'
                    );

                    document.getElementById('prog_user_name')
                        .innerHTML = link_user;
                    document.getElementById('prog_rival_name')
                        .innerHTML = link_rival;

                    document.getElementById('num_user_ac')
                        .innerHTML = set_user_AC.size;
                    document.getElementById('num_user_not_ac')
                        .innerHTML = set_user_not_AC.size;

                    document.getElementById('num_rival_ac')
                        .innerHTML = set_rival_AC.size;
                    document.getElementById('num_rival_not_ac')
                        .innerHTML = set_rival_not_AC.size;
                }, 0);
            }

            // 点数ごとに，総問題数およびユーザ/ライバルの AC 数を持っておく．
            // ライバルはユーザではないの？ みたいな疑問があるけど気にしない．
            var count_all = Array(MAX_D);
            var count_user_AC = Array(MAX_D);
            var count_rival_AC = Array(MAX_D);
            for (var i=0; i<MAX_D; ++i) {
                // count_all[i] は O(1) でわかるのでそのときにやる
                // ↑ foo.length を O(1) だと思って言っています
                count_user_AC[i] = 0;
                count_rival_AC[i] = 0;
            }

            // 総合得点
            var total_whole = 0;
            var total_user = 0;
            var total_rival = 0;

            var num_user_AC = 0;
            var num_user_not_AC = 0;
            var num_user_unsubmitted = 0;

            var num_rival_AC = 0;
            var num_rival_not_AC = 0;
            var num_rival_unsubmitted = 0;

            $.each(data, function(point, tasks) {
                var i_pt = Math.floor(point/100)-1;
                count_all[i_pt] = tasks.length;

                var id_head = 'prog_head_' + point;
                var id_whole = 'prog_whole_' + point;
                var id_user = 'prog_user_' + point;
                var id_rival = 'prog_rival_' + point;

                var el_head = document.getElementById(id_head);
                var el_whole = document.getElementById(id_whole);
                var el_user = document.getElementById(id_user);
                var el_rival = document.getElementById(id_rival);

                var pt_color =
                    window.getComputedStyle(el_whole).backgroundColor
                    .match(/\d+/g).join(',');

                el_user.style.backgroundColor =
                    'rgba(' + pt_color + ',' + 0.0 + ')';
                el_rival.style.backgroundColor =
                    'rgba(' + pt_color + ',' + 0.0 + ')';

                // 点数が指定範囲外であれば最初から書かないことにしましょう
                if (!(lb <= point && point <= ub) || tasks.length == 0) {
                    setTimeout(function(el_head, el_whole, el_user, el_rival) {
                        el_head.style.display = 'none';
                        el_whole.style.display = 'none';
                        el_user.style.display = 'none';
                        el_rival.style.display = 'none';
                    }.bind(null, el_head, el_whole, el_user, el_rival), 0);
                    return;
                }

                $.each(tasks, function(i, task) {
                    setTimeout(function(point, task_) {
                        var id_user = 'prog_user_' + point;
                        var id_rival = 'prog_rival_' + point;
                        var id_whole = 'prog_whole_' + point;
                        var el_user = document.getElementById(id_user);
                        var el_rival = document.getElementById(id_rival);
                        var el_whole = document.getElementById(id_whole);
                        var pt_color =
                            window.getComputedStyle(el_whole).backgroundColor
                            .match(/\d+/g).join(',');
                        var i_pt = Math.floor(point/100)-1;
                        var pid = task_['screen_name'];

                        var state = 0;

                        if (!(HideAC && state & STATE_FLAGS.USER_AC)) {
                            // 問題を追加するよ
                            append_task(
                                $('#mainconttable>tbody'), point, task_
                            );
                        }

                        if (set_user_AC.has(pid)) {
                            state |= STATE_FLAGS.USER_AC;
                            state |= STATE_FLAGS.USER_SUBMITTED;
                            total_user += parseInt(point);
                            document.getElementById('num_user_ac')
                                .innerHTML = ++num_user_AC;
                            document.getElementById('prog_user_total')
                                .innerHTML = total_user;
                        } else if (set_user_not_AC.has(pid)) {
                            state |= STATE_FLAGS.USER_SUBMITTED;
                            document.getElementById('num_user_not_ac')
                                .innerHTML = ++num_user_not_AC;
                        } else {
                            document.getElementById('num_user_unsubmitted')
                                .innerHTML = ++num_user_unsubmitted;
                        }

                        if (set_rival_AC.has(pid)) {
                            state |= STATE_FLAGS.RIVAL_AC;
                            state |= STATE_FLAGS.RIVAL_SUBMITTED;
                            total_rival += parseInt(point);
                            document.getElementById('num_rival_ac')
                                .innerHTML = ++num_rival_AC;
                            document.getElementById('prog_rival_total')
                                .innerHTML = total_rival;
                        } else if (set_rival_not_AC.has(pid)) {
                            state |= STATE_FLAGS.RIVAL_SUBMITTED;
                            document.getElementById('num_rival_not_ac')
                                .innerHTML = ++num_rival_not_AC;
                        } else {
                            document.getElementById('num_rival_unsubmitted')
                                .innerHTML = ++num_rival_unsubmitted;
                        }

                        if (state & STATE_FLAGS.USER_AC) {
                            // 他の class になっていないはずなので
                            // removeClass していません（まずい？）
                            $('td.'+pid).addClass('success');
                            ++count_user_AC[i_pt];
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
                            ++count_rival_AC[i_pt];
                        }

                        el_whole.innerHTML = count_all[i_pt];  // ここ無駄？
                        el_user.innerHTML = count_user_AC[i_pt];
                        el_rival.innerHTML = count_rival_AC[i_pt];

                        total_whole += parseInt(point);
                        document.getElementById('prog_whole_total')
                            .innerHTML = total_whole;

                        // 濃淡を変える
                        // rgba の a だけスマートに変える方法ないですか？
                        // ↑ 575（えびより）
                        el_user.style.backgroundColor = (
                            'rgba(' + pt_color + ','
                                + count_user_AC[i_pt] / count_all[i_pt] + ')'
                        );

                        el_rival.style.backgroundColor = (
                            'rgba(' + pt_color + ','
                                + count_rival_AC[i_pt] / count_all[i_pt] + ')'
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
            $("#mainconttable").tablesorter();
        }, 0);
    })});


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
    } else {
        $(".result_user").css('display', 'block');
        document.getElementById('progress_user').style.display = 'table-row';
    }

    if (RivalName == "") {
        $(".result_rival").css('display', 'none');
        document.getElementById('progress_rival').style.display = 'none';
    } else {
        $(".result_rival").css('display', 'block');
        document.getElementById('progress_rival').style.display = 'table-row';
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
