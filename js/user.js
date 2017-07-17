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
        del_accept: $("input[name=form_notac]:checked").val()
    };
    window.location.href = "index.html?" + $.param(QueryObj);
}

$(window).on("load", function() {
    var PointArray = [   100,  200,  300,  400,  500,  600,  700,  800,  900, 1000,
                        1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000,
                        2100, 2200, 2300, 2400, 2500];

    $("#mainconttable").tablesorter();

    // URL パース
    var UserUrl = $(location).attr('search');
    var Params = $.url(UserUrl).param();
    var UserName, DelAccept, lb, ub;

    // パラメータの取得と反映
    UserName  = Params.user_name;
    DelAccept = Params.del_accept;
    lb        = Params.lbound;
    ub        = Params.ubound;

    UserName  = isEmpty(UserName)  ? ""    : selectorEscape(UserName);
    DelAccept = isEmpty(DelAccept) ? "off" : selectorEscape(DelAccept);
    lb        = isEmpty(lb)        ?  100  : parseInt(selectorEscape(lb));
    ub        = isEmpty(ub)        ? 2400  : parseInt(selectorEscape(ub));

    // パラメータをフォームに反映 (入力情報の保存)
    $('input[name=form_username]').val(UserName);
    // var flag = (DelAccept == "on" ? true : false);
    $('input[name=form_notac]').prop('checked', (DelAccept == "on"));
    $('#difficulty_min').val(lb);
    $('#difficulty_max').val(ub);
    $('.selectpicker').selectpicker('refresh');

    // 難易度絞り込み
    // 逆でも対応する優しい世界
    if (lb > ub) {
        var temp = lb;
        lb = ub; ub = temp;
    }

    for (var i = 0; i < PointArray.length; i++) {
        // lb 以上 ub 以下の要素に関しては表示し、そうでなければ表示しない
        if(lb <= PointArray[i] && PointArray[i] <= ub) {
            $(".dif_" + PointArray[i]).css('display', 'table-row');
        }
        else {
            $(".dif_" + PointArray[i]).css('display', 'none');
        }
    }

    // JSON を取ってきて提出状況に応じて色を付ける
    var url = 'https://query.yahooapis.com/v1/public/yql?callback=?';
    var query = 'select * from json where url="http://kenkoooo.com/atcoder-api/problems?user=' + UserName + '"';
    $.getJSON(url,
        { q: query, format: 'json'},
        function(data) {
            if(data.query.results == null) return;
            $(data.query.results.json.json).each(function() {
                if (this.status == "AC") {
                    // AC していないもののみ表示 (AC の要素を消す)
                    if(DelAccept == "on") {
                        $('td.'+this.id).parent().css('display', 'none');
                    }

                    $('td.'+this.id).addClass("success");
                    $('td.'+this.id).removeClass("warning");
                }
                else if (this.status != "") {
                    $('td.'+this.id).removeClass("success");
                    $('td.'+this.id).addClass("warning");
                }
            })
        });

    // ボタンを押したらパラメータ付き URL に飛ぶ
    $("#difficulty_submit").click(jumpProcess);

    // Enter キーを押したらパラメータ付き URL に飛ぶ
    $(document).on("keypress", "input[name=form_username]", function(e) {
        if(e.keyCode == 13) jumpProcess();
        else $.noop();
    });
});

/*
$(window).on('load resize', function(){
    // navbarの高さを取得する
    var height = $('.navbar').height();
    // bodyのpaddingにnavbarの高さを設定する
    $('body').css('padding-top',height + 20); 
});
*/
