// 入力文字エスケープ
function selectorEscape(val){
    return val.replace(/[ !"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, '\\$&');
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

$(window).on("load", function() {
    /*
    var PointArray = [   100,  200,  300,  400,  500,  600,  700,  800,  900, 1000,
                        1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000,
                        2100, 2200, 2300, 2400, 2500];
    */

    $("#mainconttable").tablesorter();

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

    UserName  = isEmpty(UserName)  ? ""    : selectorEscape(UserName);
    RivalName = isEmpty(RivalName) ? ""    : selectorEscape(RivalName);
    HideAC    = isEmpty(HideAC)    ? "off" : selectorEscape(HideAC);
    lb        = isEmpty(lb)        ?  100  : parseInt(selectorEscape(lb));
    ub        = isEmpty(ub)        ? 2400  : parseInt(selectorEscape(ub));

    // パラメータをフォームに反映 (入力情報の保存)
    $('input[name=form_username]').val(UserName);
    $('input[name=form_rivalname]').val(RivalName);
    $('input[name=form_notac]').prop('checked', (HideAC == "on"));
    $('#difficulty_min').val(lb);
    $('#difficulty_max').val(ub);
    $('.selectpicker').selectpicker('refresh');

    // 難易度絞り込み
    // 逆でも対応する優しい世界
    if (lb > ub) {
        var temp = lb;
        lb = ub; ub = temp;
    }

    for (var point = 100; point <= 4200; point += 100) {
        // lb 以上 ub 以下の要素に関しては表示し、そうでなければ表示しない

        // 100 点刻みでない配点は出さないでください＞＜（AtCoder さんへ）
        // ↑ AtCoder さんわざわざこのコード読まないでしょ
        if(lb <= point && point <= ub) {
            $(".dif_" + point).css('display', 'table-row');
        }
        else {
            $(".dif_" + point).css('display', 'none');
        }
    }

    // JSON を取ってきて提出状況に応じて色を付ける
    var set_user_ac      = new Set();
    var set_user_not_ac  = new Set();
    var set_rival_ac     = new Set();
    var set_rival_not_ac = new Set();
    var set_all_problems = new Set();
    {   
        // 指定された難易度範囲の問題総数を数える
        var $query = $("#mainconttable>tbody>tr:visible").find('td:not([class^=mask])');
        for (var i = 0; i < $query.length; ++i) {
            set_all_problems.add($query[i].className);
        }
    }
    var url = 'https://query.yahooapis.com/v1/public/yql?callback=?';
    var query  = 'select * from json where url="http://beta.kenkoooo.com/atcoder/atcoder-api/results?user=' + UserName + '&rivals=' + RivalName + '"';
    $.getJSON(url,
        { q: query, format: 'json'},
        function(data) {
            if(data.query.results == null) return;
            $(data.query.results.json.json).each(function() {
                // ちゃんと表に存在して、かつ表示得点範囲内にあるやつかどうかを見よう
                var pid = this.problem_id;
                if ($('td.'+pid).length
                            && $('td.'+pid).parent().css('display') != 'none') {
                    // AC のものとそうでないものは分けて set に入れよう
                    // 全提出が返ってくるので AC している問題について set_user_not_ac に
                    // 突っ込まれる可能性も普通にあるけど、後でうまいことやる
                    
                    // User の提出
                    if(this.user_id == UserName) {
                        if(this.result == "AC") {
                            set_user_ac.add(pid);
                            set_user_not_ac.delete(pid);
                        }
                        else {
                            if(!set_user_ac.has(pid)) {
                                set_user_not_ac.add(pid);
                            }
                        }
                    }
                    // Rival の提出
                    else {
                        if(this.result == "AC") {
                            set_rival_ac.add(pid);
                            set_rival_not_ac.delete(pid);
                        }
                        else {
                            if(!set_rival_ac.has(pid)) {
                                set_rival_not_ac.add(pid);
                            }
                        }
                    }
                }
            })

            // 全問題を舐めて、表に色を付ける
            set_all_problems.forEach(function(pid) {
                // 自分が AC してたら青
                if(set_user_ac.has(pid)) {
                    if(HideAC == "on") {
                        $('td.'+pid).parent().css('display', 'none');
                    }
                    $('td.'+pid).removeClass("warning");
                    $('td.'+pid).removeClass("danger");
                    $('td.'+pid).addClass("success");
                }
                else {
                    // rival だけが AC してたら赤
                    if(set_rival_ac.has(pid)) {
                        $('td.'+pid).removeClass("success");
                        $('td.'+pid).removeClass("warning");
                        $('td.'+pid).addClass("danger");
                    }
                    // rival も AC していなくて、自分が提出している問題であれば黄色
                    else if(set_user_not_ac.has(pid)) {
                        $('td.'+pid).removeClass("success");
                        $('td.'+pid).removeClass("danger");
                        $('td.'+pid).addClass("warning");
                    }
                }
            })

            // AC数などを表示
            document.getElementById("num_user_ac").innerHTML = set_user_ac.size;
            document.getElementById("num_user_not_ac").innerHTML = set_user_not_ac.size;
            document.getElementById("num_user_unsubmitted").innerHTML =
                set_all_problems.size - set_user_ac.size - set_user_not_ac.size;

            document.getElementById("num_rival_ac").innerHTML = set_rival_ac.size;
            document.getElementById("num_rival_not_ac").innerHTML = set_rival_not_ac.size;
            document.getElementById("num_rival_unsubmitted").innerHTML =
            set_all_problems.size - set_rival_ac.size - set_rival_not_ac.size;
        });

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
    if(UserName  == "") $(".result_user").css('display', 'none');
    else $(".result_user").css('display', 'block');
    if(RivalName == "") $(".result_rival").css('display', 'none');
    else $(".result_rival").css('display', 'block');
});

/*
$(window).on('load resize', function(){
    // navbarの高さを取得する
    var height = $('.navbar').height();
    // bodyのpaddingにnavbarの高さを設定する
    $('body').css('padding-top',height + 20); 
});
*/
