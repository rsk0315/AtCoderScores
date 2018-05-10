/*
  未来のえびちゃんへ
  えびちゃん，何も考えずに書くと引用符をシングルの方で書きがちなので，
  見つけたらダブルの方に直してください．中に引用符が入っている場合は
  その限りではありませんのでご注意を．
  ...と思ったんですけど，シングルに統一してしまいましょう．

  基本的には lowerCamelCase を使いますが，HTML 内ではどうするかとかは
  考え中です．あと userUrl みたいなのはたぶん推奨されなくて userURL が
  望ましいと思うので，よしなにやってください．

  エディタの word wrap で見づらくなりがちなので，一行あたりの文字数は
  79 文字以下を目安にしましょう．

  XSS には気をつけてくださいね．

  パラメータを追加するときは jumpProcess のところと
  $(window).on('load', ...) のところにも変更を入れてくださいね．
*/

// function removeWeirdChars(s, r=/[^\w-]+/g) {
//     return s.replace(r, '');
// }

function isEmpty(s) {
    // JS わからんのでアレなんですけど，冗長だったりしますか
    return (s === undefined || s === null || s == '' || s == []);
}

var contestTags = [
    'abc', 'arc', 'agc', 'apc',
    'codefes', 'dwango', 'yahoo', 'tenka1', 'ddcc', 'colocon', 's8pc',
    'uncategorized'
];
var contestTypes = ['qual', 'final', 'other_type'];

var UB_MAX = 1000000;  // // 強気にいっちゃえ〜〜〜

function jumpProcess() {
    // あれ？ ここではそのまま .val() を投げるだけで
    // 後でよしなにやってもらえますか？

    var queryObj = {};
    // パラメータ，冗長になりすぎる気がするので，デフォルトのものと
    // 同じときは省略することにしちゃいましょう．
    {
        // デフォルト値が定数のもの
        var lbound = $('#difficulty_min').val();
        var ubound = $('#difficulty_max').val();
        if ($('input[name=enable_free]').is(':checked')) {
            var lbStr = $('#free_min').val().replace(/\s+/g, '');
            var ubStr = $('#free_max').val().replace(/\s+/g, '');
            console.log(lbStr+' '+ubStr);
            if (lbStr.match(/\D/) || ubStr.match(/\D/)) {
                alert('ぽまえ〜，絶対に悪意あるだろ〜');
            }
            
            lbound = parseInt(lbStr.replace(/\D+/g, ''));
            ubound = parseInt(ubStr.replace(/\D+/g, ''));
            if (isNaN(lbound))
                lbound = 0;
            if (isNaN(ubound))
                ubound = UB_MAX;
        }
        if (lbound != 0)
            queryObj['lbound'] = lbound;
        if (ubound != UB_MAX)
            queryObj['ubound'] = ubound;

        // まずいですよ！
        // if (String(lbound)+String(ubound) == '114514') {
        //     alert('先輩！？ 何してんすか！');
        // }
    }
    {
        // デフォルト値を動的につくるもの
        var showContests = '';
        var showAllContests = '';
        $.each(contestTags, function(i, name) {
            if (i > 0) showAllContests += ',';
            showAllContests += name;

            if ($('input[name=show_'+name+']:checked').val()) {
                if (showContests != '') showContests += ',';
                showContests += name;
            }
        });

        var showTypes = '';
        var showAllTypes = '';
        $.each(contestTypes, function(i, name) {
            if (i > 0) showAllTypes += ',';
            showAllTypes += name;

            if ($('input[name=show_'+name+']:checked').val()) {
                if (showTypes != '') showTypes += ',';
                showTypes += name;
            }
        });

        if (showContests != showAllContests)
            queryObj['show_contests'] = showContests;
        if (showTypes != showAllTypes)
            queryObj['show_type'] = showTypes;
    }
    {
        // デフォルト値が空のもの
        var user = $('input[name=form_username]').val();
        var rivals = $('input[name=form_rivalname]').val();
        var writers = $('input[name=form_writer]').val();
        if (!isEmpty(user))
            queryObj['user'] = user;
        if (!isEmpty(rivals))
            queryObj['rivals'] = rivals;
        if (!isEmpty(writers))
            queryObj['writers'] = writers;
    }
    {
        // デフォルト値が false のもの
        // この判定で大丈夫ですか？ 一意になってるか不安なんですけど
        if ($('input[name=hide_ac]').is(':checked'))
            queryObj['hide_ac'] = 'on';
        if ($('input[name=show_upcoming]').is(':checked'))
            queryObj['show_upcoming'] = 'on';
        if ($('input[name=include_partial]').is(':checked'))
            queryObj['include_partial'] = 'on';
    }
    {
        // デフォルト値が true のもの
        // あれば
    }
    window.location.href = 'index.html?' + $.param(queryObj);
}

function colorForPoint(point) {
    if (point <= 100) {
        return 'point_gray';
    } else if (point <= 200) {
        return 'point_brown';
    } else if (point <= 300) {
        return 'point_green';
    } else if (point <= 400) {
        return 'point_cyan';
    } else if (point <= 600) {
        return 'point_blue';
    } else if (point <= 800) {
        return 'point_yellow';
    } else if (point <= 1100) {
        return 'point_orange';
    } else if (point <= 1500) {
        return 'point_red';
    } else if (point <= 1900) {
        return 'point_silver';
    } else if (point <= 3000) {
        return 'point_gold';
    } else {
        console.log('tsurai');
        return 'point_tsurai';
    }
}

function appendTask(tbody, task, count, status) {
    var $tr = $('<tr>');
    var point = task['fullScore'];

    if (status == 'hidden') {
        $tr.attr('style', 'display: none');
    }

    {
        // 点数に応じて色を決めます．
        var $td = $('<td>').text(point);
        $td.addClass(colorForPoint(point));
        $tr.append($td);
    }

    // 複数のクラスをまとめてやるのってどうするんですか？
    var $tdCommon = $('<td>').attr({class: task['taskScreenName']});
    $tdCommon.addClass(status);
    
    {
        // 問題名およびそれへのリンクを貼ります．
        // 問題名は  TaskName を指しているわけではありません．
        // ここらへんの用語は */standings/json で出てくるものに
        // 準拠したいと思います．
        var $td = $tdCommon.clone();
        // ここちゃんとエスケープするべきかもしれません？
        // そんなことないか
        $('<a>').text(task['contestTitle']+': '+task['taskChar'])
            .attr({href: task['traditionalURL']})
            .appendTo($td);

        $td.append(' [');
        $('<a>').text('beta').attr({href: task['betaURL']}).appendTo($td);
        $td.append(']');
        $tr.append($td);
    }

    {
        // writer さんたちのリンクは beta にしましょう．
        var $td = $tdCommon.clone();

        $.each(task['writers'], function(i, writer) {
            var name = writer[0], color = writer[1];
            if (isEmpty(name))
                return;

            if (i > 0)
                $td.append(', ');

            if (isEmpty(color)) {
                $td.append($('<span>').text(name));
            } else /* if (color == 'username') */ {
                $td.append($('<a>').text(name).attr({
                    // これまずかったら後々変えます
                    class: color,
                    href: 'https://beta.atcoder.jp/user/'+name,
                }));
            }
        });
        $tr.append($td);
    }

    // 部分点
    {
        var $td = $tdCommon.clone();

        // これまずかったら変えます．そういうのばっかりですね．
        $td.text(task['partialScore'] || '-');
        $tr.append($td);
    }

    $(tbody).append($tr);
    return;

    // 問題の順序関係に対して robust なやつです．
    // パフォーマンスの関係で上の fragile なやり方をしていますが，
    // 問題が観測されたらこっちにします．
    var timer = setInterval(function() {
        if ($(tbody+'>tr').length < count) return;

        clearInterval(timer);
        $(tbody).append($tr);
    }, 10);
}

function makeScrollableTable() {
    var width = $('#mainconttable').width();
    $('.scroll').attr({
        width: width+'px',
        style: 'white-space: nowrap',
    }).css('overflow-x', 'auto');
}

var timerSet = false;
$(window).on('resize', function() {
    if (timerSet !== false) {
        clearTimeout(timerSet);
    }

    // setInterval だとだめな気がする．timerSet のスコープ的な意味で
    timerSet = setTimeout(function() {
        makeScrollableTable();
    }, 200);
})

var YQL_HTML_BASE = (
    'https://query.yahooapis.com/v1/public/yql?format=json'
        + '&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys'
);
var YQL_JSON_BASE = (
    'https://query.yahooapis.com/v1/public/yql?callback=?'
);

var hasAlerted = false;
function prettifyUserName(who, name) {
    // one of えびちゃんこだわりポイント

    // who: "user" または "rival\d+"
    // name: "rsk0315" みたいなの

    var cacheExpires = 30 * 60 * 1000;  // ms
    var curTime = Math.floor(Date.now()/cacheExpires);

    // クエリ文字列ってちゃんとパーセントエンコードしなきゃまずいですか？
    // 適当にエンコードしたら落ちたんですけど
    var imageXpath = "//img[contains(@src, '/public/img/icon/crown')]";
    var imageURL = 'https://atcoder.jp/user/' + name + '?tsurai=' + curTime;
    var imageYQL = (
        'select * from htmlstring where '
            + 'url="' + imageURL + '" and xpath="' + imageXpath + '"'
    );
    var imageName = null;

    var userXpath = "//a[@class='username']/span";
    var userYQL = (
        'select * from htmlstring where '
            + 'url="https://atcoder.jp/user/' + name + '?tsurai=' + curTime
            + '" and xpath="' + userXpath + '"'
    );

    $.when(
        $.ajax({
            type: 'GET',
            url: YQL_HTML_BASE,
            data: {q: imageYQL},
            dataType: 'json',
            cache: false,
        }),
        $.ajax({
            type: 'GET',
            url: YQL_HTML_BASE,
            data: {q: userYQL},
            dataType: 'json',
            cache: false,
        })
    ).done(function(dataImage, dataUser) {
        var userAttr = $.parseHTML(dataUser[0].query.results.result);
        userAttr = (userAttr && userAttr[0]);  // null[0] がアなので

        var userURL = 'https://beta.atcoder.jp/user/' + name;
        var $a = $('<a>').attr({href: userURL}).text(name);
        if (userAttr === null) {
            // 存在しないと思われるユーザに対する処理，どうしましょう
            // アラートでも出しときますか？ さすがにうるさい？
            $('#warning').append(
                $('<li>').text(name+' は存在しないユーザ名ではありませんか？')
            );
        } else {
            // $a.text($(userAttr).text());
            if (name != $(userAttr).text()) {
                // 大文字と小文字を間違っていた場合，正しい方に飛ばしましょう

                // user と rival の両方を間違った場合は二回ジャンプしますが，
                // case-insensitive な人間に対する慈悲はありません．
                // 非同期で通信しているため，他方がどうかを気にしようとすると
                // 面倒なことになります．それよりも case-sensitive な人間に
                // なってもらう方がお互いのためです．
                // Atcoder scores ではないんですよ．

                if (who == 'user') {
                    $('input[name=form_username]').val($(userAttr).text());
                } else {
                    $('input[name=form_rivalname]').val(
                        $('input[name=form_rivalname]').val().replace(
                            RegExp('\\b'+name+'\\b'), $(userAttr).text()
                        )
                    );
                }

                if (!hasAlerted) {
                    // 警告は一度だけです．
                    hasAlerted = true;
                    $('#warning').append(
                        $('<li>').text(
                            'ユーザ名の表記の誤りを検出しました．'
                        ).append(
                            $('<button>')
                                .text('訂正して再読み込み')
                                .on('click', jumpProcess)
                        )
                    )
                }
            }

            // null.match がアなので
            var style = $(userAttr).attr('style') || '';
            var class_ = $(userAttr).attr('class') || '';

            if (class_.match(/user-\w+/)) {
                $a.attr({class: class_});
            } else if (style.match(/color:#[\dA-Fa-f]{3}[\dA-Fa-f]{3}?/)) {
                $a.attr({style: style});
            }
        }

        var $progName = $('#prog_'+who+'_name');
        var $acCountName = $('#ac_count_'+who+'_name');

        $progName.html($a);
        $acCountName.html($a.clone());

        var imgTag = dataImage[0].query.results.result;
        if (!isEmpty(imgTag)) {
            imageName = imgTag.match(/crown\d+\.gif/)[0];
        }

        if (!isEmpty(imageName)) {
            var $img = $('<img>').attr({src: './img/'+imageName});
            $progName.prepend(' ').prepend($img);
            $acCountName.prepend(' ').prepend($img.clone());
        }
    })
}

function selectAndAdd(selector, num) {
    $(selector).text(parseInt($(selector).text())+num);
}

$(window).on('load', function() {
    var width = $('#mainconttable').width();
    setTimeout(function() {
        makeScrollableTable();
    }, 0);

    // if ($(window).width() < 768) {
    //     $('.panel-collapse').removeClass('in').collapse('hide');
    // }
    $('.panel-heading').on('click', function() {
        $($(this).data('target')).collapse('toggle');
    });

    $('[data-toggle=tooltip]').tooltip();

    $('input').on('keypress', function(e) {
        if (e.keyCode == 13) {
            jumpProcess();
        } else {
            $.noop();
        }
    });

    $('input[name=enable_free]').on('change', function() {
        var checked = $(this).is(':checked');
        $('#difficulty_min').prop('disabled', checked);
        $('#difficulty_max').prop('disabled', checked);
        $('#free_min').prop('disabled', !checked);
        $('#free_max').prop('disabled', !checked);
        $('.selectpicker').selectpicker('refresh');
    });

    $('ul input:checkbox').on('change', function() {
        var checked = $(this).is(':checked');
        // find でやると再帰的にぐわ〜ってなって計算量がやばいことに
        // なりそうで怖かった．children がたくさんあってつらいけど
        $(this).parent('li').children('ul').children('li')
            .children('input:checkbox').each(function(i, checkbox) {
                // 自分より下のチェックボックスに伝播する
                $(checkbox).prop('checked', checked);
            });

        var $parent = $(this).parent('li').parent('ul').parent('li')
            .children('input:checkbox');
        var $child = $(this);

        var allOf = checked;
        var noneOf = !allOf;
        while ($parent.length == 1) {
            $child.parent('li').parent('ul').children('li')
                .children('input:checkbox').each(function(i, checkbox) {
                    if ($(checkbox).is(':checked')) {
                        noneOf = false;
                    } else {
                        allOf = false;
                    }
                    if ($(checkbox).is(':indeterminate')) {
                        allOf = noneOf = false;
                    }
                });

            // まとめてぐわ〜ってしたかったにょに．:indetermindate が
            // 機能してくれない
            // var $tmp = $child.parent('li').parent('ul').children('li');
            // if ($tmp.children('input:checkbox:indeterminate').length > 0) {
            //     allOf = noneOf = false;
            // } else if ($tmp.children('input:checkbox:checked').length > 0) {
            //     noneOf = false;
            //     if ($tmp.children('input:checkbox:not(checked)').length > 0) {
            //         allOf = false;
            //     }
            // } else {
            //     allOf = false;
            // }

            if (allOf) {
                $parent.prop('checked', true);
                $parent.prop('indeterminate', false);
            } else if (noneOf) {
                $parent.prop('checked', false);
                $parent.prop('indeterminate', false);
            } else {            
                $parent.prop('checked', false);
                $parent.prop('indeterminate', true);
            }

            $child = $parent;
            $parent = $parent.parent('li').parent('ul').parent('li')
                .children('input:checkbox');
        }
    });

    $('#difficulty_min').append($('<option>').attr({value: 0}).text(0));
    for (var i=100; i<=2400; i+=100) {
        var $option = $('<option>').attr({value: i}).text(i);
        $('#difficulty_min').append($option);
        $('#difficulty_max').append($option.clone());
    }
    $('#difficulty_max').append(
        $('<option>').attr({value: UB_MAX}).text(UB_MAX)
    );

    // <span class="glyphicon glyphicon-question-sign" aria-hidden="true" data-html="true" data-toggle="tooltip" title="" ="ユーザ名を指定すると進捗を表示します．大文字と小文字を間違った場合は訂正してあげます．" />
    var $tooltip = $('<span>').attr({
        class: 'glyphicon glyphicon-question-sign',
        'aria-hidden': 'true',
        'data-html': 'true',
        'data-toggle': 'tooltip',
        title: '',
    });

    // URL パラメータをパース
    var currentURL = $(location).attr('search');
    var params = $.url(currentURL).param();
    var userName, rivalNames, hideAC, lb, ub;
    var showUpcoming;
    var showContests, showTypes;
    var writers;
    var includePartial;

    userName = params.user;
    rivalNames = params.rivals;
    writers = params.writers;
    hideAC = params.hide_ac;
    lb = params.lbound;
    ub = params.ubound;

    // , を使ってしまった人がアにならないように，, より左だけを持ってきます
    userName = isEmpty(userName)? '':userName.replace(/[^\w,-]+|,.*/g, '');
    var rivals = (
        isEmpty(rivalNames)?
            [] : rivalNames.replace(/[^\w,-]/g, '').match(/\w+/g)
    );
    // 'foo,,bar,F?O?O,baz' みたいなクエリは 'foo, bar, baz' に直したいです
    {
        var setRivals = new Set();
        var tmp = Array();
        var userNameLC = userName.toLowerCase();
        $.each(rivals, function(i, rivalName) {
            if (rivalName.toLowerCase() == userNameLC)
                return;
            if (setRivals.has(rivalName.toLowerCase()))
                return;

            tmp.push(rivalName);
            setRivals.add(rivalName.toLowerCase());
        });
        rivals = tmp;
    }
    writers = isEmpty(writers)? '' : writers.replace(/[^\w|-]+/g, '');
    hideAC = (hideAC == 'on');  // */index.html では false
    showUpcoming = (params.show_upcoming == 'on');
    includePartial = (params.include_partial == 'on');
    lb = isEmpty(lb)? 0 : parseInt(lb.replace(/\D+/, ''));
    ub = isEmpty(ub)? UB_MAX : parseInt(ub.replace(/\D+/, ''));

    showContests = params.show_contests;

    var allOfOtherContests, noneOfOtherContests;
    var setShowContests = new Set();
    var setAllContests = new Set();
    $.each(contestTags, function(i, name) {
        setAllContests.add(name);
    });
    if (showContests === undefined) {
        // defaults to all contests
        $.each(contestTags, function(i, name) {
            setShowContests.add(name);
        });
        allOfOtherContests = true;
        noneOfOtherContests = false;
    } else {
        showContests = showContests.replace(/[^\w,-]+/g, '');
        $.each(showContests.split(','), function(i, name) {
            // 存在しないコンテスト名が入っても問題ないよね（たぶん）
            setShowContests.add(name);
        });
        allOfOtherContests = true;
        noneOfOtherContests = true;
        // ループが回らないとアになるけど，回るため．
        $.each(contestTags, function(i, name) {
            if (name.match(/a[brgp]c/)) return;
            if (setShowContests.has(name)) {
                noneOfOtherContests = false;
            } else {
                allOfOtherContests = false;
            }
        });
    }
    
    showTypes = params.show_type;

    var setShowTypes = new Set();
    if (showTypes === undefined) {
        $.each(contestTypes, function(i, name) {
            setShowTypes.add(name);
        });
    } else {
        showTypes = showTypes.replace(/[^\w,]+/g, '');
        $.each(showTypes.split(','), function(i, name) {
            setShowTypes.add(name);
        });
    }

    // パース結果をフォームに反映・保存
    $('input[name=form_username]').val(userName);
    $('input[name=form_rivalname]').val(rivals.join(', '));
    $('input[name=form_writer]').val(writers);
    $('input[name=hide_ac]').prop('checked', hideAC);
    $('#difficulty_min').val(lb);
    $('#difficulty_max').val(ub);

    $.each(contestTags, function(i, name) {
        if (setShowContests.has(name)) {
            $('input[name=show_'+name+']').prop('checked', true);
        }
    });
    if (allOfOtherContests) {
        $('input[name=show_other]').prop('checked', true);
    } else if (noneOfOtherContests) {
        $('input[name=show_other]').prop('checked', false);
    } else {
        $('input[name=show_other]').prop('indeterminate', true);
    }

    {
        var allOf = true;
        var noneOf = true;
        $.each(['b', 'r', 'g', 'p'], function(i, ch) {
            if (setShowContests.has('a'+ch+'c')) {
                noneOf = false;
            } else {
                allOf = false;
            }
        });
        
        if (allOf) {
            $('input[name=show_axc]').prop('checked', true);
        } else if (noneOf) {
            $('input[name=show_axc]').prop('checked', false);
        } else {
            $('input[name=show_axc]').prop('indeterminate', true);
        }
    }

    $('input[name=show_qual]').prop('checked', setShowTypes.has('qual'));
    $('input[name=show_final]').prop('checked', setShowTypes.has('final'));
    $('input[name=show_other_type]')
        .prop('checked', setShowTypes.has('other_type'));

    $('input[name=show_upcoming]').prop('checked', showUpcoming);

    $('input[name=include_partial]').prop('checked', includePartial);

    if (lb > ub) {
        var tmp = lb;
        lb = ub;
        ub = tmp;
    }
    
    var lbIsValid =
        ($('#difficulty_min').children('option[value='+lb+']').length > 0);
    var ubIsValid =
        ($('#difficulty_max').children('option[value='+ub+']').length > 0)

    if (lbIsValid && ubIsValid) {
        $('#difficulty_min').selectpicker('val', lb);
        $('#difficulty_max').selectpicker('val', ub);
    } else {
        $('#difficulty_min').selectpicker('val', 0);
        $('#difficulty_max').selectpicker('val', UB_MAX);
        $('#difficulty_min').prop('disabled', true);
        $('#difficulty_max').prop('disabled', true);

        $('input[name=enable_free]').prop('checked', true);
        $('#free_min').val(lb);
        $('#free_max').val(ub);
        $('#free_min').prop('disabled', false);
        $('#free_max').prop('disabled', false);
    }
    $('.selectpicker').selectpicker('refresh');

    // ライバル達用のテーブルをつくっちゃいましょう
    // ついでにいろいろ用意します
    var rivalIndex = {};
    {
        $.each(rivals, function(i, name) {
            rivalIndex[name.toLowerCase()] = i;

            {
                var $tr = $('<tr>').attr({
                    class: 'progress_rival',
                    id: 'progress_rival'+i,
                });
                $tr.append($('<td>').text(name).attr({
                    class: 'prog_rival_name',
                    id: 'prog_rival'+i+'_name',
                }));
                $tr.append($('<td>').text('0').attr({
                    class: 'prog_rival_total',
                    id: 'prog_rival'+i+'_total',
                }));
                $('#progresstable>tbody').append($tr);
            }

            {
                var $tr = $('<tr>').attr({
                    class: 'ac_count_rival',
                    id: 'ac_count_rival'+i,
                });
                $tr.append($('<td>').text(name).attr({
                    class: 'ac_count_rival_name',
                    id: 'ac_count_rival'+i+'_name',
                }));
                $tr.append($('<td>').text('0').attr({
                    class: 'num_rival_ac',
                    id: 'num_rival'+i+'_ac',
                }));
                $tr.append($('<td>').text('0').attr({
                    class: 'num_rival_not_ac',
                    id: 'num_rival'+i+'_not_ac',
                }));
                $tr.append($('<td>').text('0').attr({
                    class: 'num_rival_unsubmitted',
                    id: 'num_rival'+i+'_unsubmitted',
                }));
                $('#ac_count>tbody').append($tr);
            }
        });
    }
                

    // べっ，別に API のことなんて好きじゃないんだからっ（ぺちんぺちん）
    var cacheExpires = 300 * 1000;  // ms
    var curTime = Math.floor(Date.now()/cacheExpires);  // これ関数化すべきかも
    // json.result, json.user_id, json.problem_id だけとればいいけどそれでもだめ
    var queryAP = (
        'select * from json where '
            + 'url="http://beta.kenkoooo.com/atcoder/atcoder-api/results?user='
            + userName + '&rivals=' + rivals.join(',')
            + '&tsurai=' + curTime + '"'
    );

    // 開催前のコンテストを調べてあげよー！
    var contestXpath = "//div[@id='collapse-contest']/div[2]//tr//td[2]//a";
    var queryUC = (
        'select * from htmlstring where '
            + 'url="https://atcoder.jp/?lang=ja&tsurai=' + curTime + '"'
            + 'and xpath="' + contestXpath + '"'
    );

    $.when(
        // AtCoder Problems の API
        $.ajax({
            type: 'GET',
            dataType: 'json',
            url: YQL_JSON_BASE,
            data: {q: queryAP, format: 'json'},
            cache: false,
        }),
        // 開催前のコンテスト確認．なんで data: {...} で投げないんですか？
        // FIXME?
        $.ajax({
            type: 'GET',
            dataType: 'json',
            url: YQL_HTML_BASE,
            data: {q: queryUC},
        }),
        // 私のつくった JSON（私ではなく私のスクリプトが，ですね）
        $.ajax({
            dataType: 'json',
            url: './tasks.json',
            mimeType: 'application/json',
            data: {},
        })
    ).done(function(dataAP, dataUC, dataSC) {
        var setUpcoming = new Set();
        if (!showUpcoming) {
            // まずは開催中のコンテストを set に詰めましょう
            var links = dataUC[0].query.results.result;
            var tradURL = /https:\/\/([\w-]+)\.contest\.atcoder\.jp/;
            var BetaURL = /https:\/\/beta\.atcoder\.jp\/contests\/([\w-]+)/;
            $.each(links.split('\n'), function(i, link) {
                var href = $(link).attr('href');
                var contestScreenName = (
                    href.match(tradURL)[1] || href.match(BetaURL)[1]
                );
                if (!contestScreenName) {
                    // tsurai
                }
                setUpcoming.add(contestScreenName);
            });
            // 詰め終わりました
        }

        // 次に，AC した問題とかを調べます．
        var setUserAC = new Set();
        var setUserNotAC = new Set();
        var setRivalAC = new Set();
        var setRivalNotAC = new Set();
        var setEachRivalAC = Array();
        var setEachRivalNotAC = Array();
        {
            $.each(rivalIndex, function(i, name) {
                setEachRivalAC.push(new Set());
                setEachRivalNotAC.push(new Set());
            });
        }

        if (dataAP[0].query.results !== null) {
            var userNameLC = userName.toLowerCase();
            $(dataAP[0].query.results.json.json).each(function() {
                if (this.result == 'CE') return;
                var pid = this.problem_id;

                if (this.user_id.toLowerCase() == userNameLC) {
                    if (this.result == 'AC') {
                        setUserAC.add(pid);
                        setUserNotAC.delete(pid);
                    } else /* if (this.result != 'CE') */ {
                        if (!setUserAC.has(pid)) {
                            setUserNotAC.add(pid);
                        }
                    }
                    return;
                }
                if (rivals.length == 0)
                    return;

                var index = rivalIndex[this.user_id.toLowerCase()];
                if (this.result == 'AC') {
                    setRivalAC.add(pid);
                    setRivalNotAC.delete(pid);
                    setEachRivalAC[index].add(pid);
                    setEachRivalNotAC[index].delete(pid);
                } else {
                    if (!setRivalAC.has(pid)) {
                        setRivalNotAC.add(pid);
                    }
                    if (!setEachRivalAC[index].has(pid)) {
                        setEachRivalNotAC[index].add(pid);
                    }
                }
            });
        } else if (!(isEmpty(userName) && isEmpty(rivals))) {
            $('#error').append(
                $('<li>').text('進捗状況を正しく取得できませんでした．')
            );

            var invalid = $('#warning>li:contains(存在しないユーザ名)');
            var users = rivals.length;
            if (!isEmpty(userName))
                ++users;

            if (invalid.length < users) {
                $tt = $tooltip.clone().attr({
                    'data-original-title':
                    'ユーザ一人だけでこれを超えるような状況になった場合は'
                        + 'どうしたらいいんだろう．困りましたね．'
                }).tooltip()
                $tt.removeClass('glyphicon-question-sign')
                $tt.addClass('glyphicon-exclamation-sign');

                $('#error').append(
                    $('<ul>').css('font-weight', 'normal')
                        .append(
                            $('<li>').text(
                                /*
                                'おそらく AtCoder Problems さんの API は'
                                    + '正常なのですが，それを取得するための'
                                    + 'YQL の不具合でこけています．ユーザ名の'
                                    +' 組み合わせをご報告いただけると'
                                    + '捗るかもしれません．'
                                */
                                'YQL が捌けるデータの上限（1536 kB くらい？）'
                                    + 'を超えてしまっているかもしれません．'
                            ).append($tt)
                        )
                        .append(
                            $('<li>').text(
                                'あるいは正常に虚無が'
                                    + '返ってきただけかもしれません．'
                            )
                        )

                    // ここ，存在しないユーザとか提出のないユーザとか，
                    // 各種コーナーケースの処理が実質不可能なので，
                    // 考えられる理由を全て述べることにします． 
                );
            }
        }
        // 調べ終わりました

        // 問題のリストアップをする前に，リスト全部を一度なめます
        // 各種フィルタをかけて，生き残った問題の点数の種類を知りたいです

        var points = new Set();
        var tasks = Array();
        var axcRE = /a([brgp])c\d+/;

        var setShowingWriters = null;
        if (!isEmpty(writers)) {
            setShowingWriters = new Set();
            $.each(writers.split(/\|/g), function(i, writer) {
                setShowingWriters.add(writer.toLowerCase());
            });
        }

        $.each(dataSC[0], function(i, task) {
            // コンテストの種類で弾きます
            var conCat = task['contestCategory'][0];
            var conQF = task['contestCategory'][1];
            // console.log(task['taskScreenName']+' '+conCat+' '+conQF);
            if (conCat === null)
                conCat = 'uncategorized';
            if (conQF === null)
                conQF = 'other_type';

            if (!setShowContests.has(conCat))
                return;
            if (!setShowTypes.has(conQF))
                return;

            var contestScreenName = task['contestScreenName'];

            // 開催前コンテストを弾きます
            if (!showUpcoming && setUpcoming.has(contestScreenName))
                return;

            // 得点帯で弾きます
            var point = parseInt(task['fullScore']);
            if (!(lb <= point && point <= ub)) {
                // TODO 部分点を許容して云々する場合はそうします
                if (!includePartial)
                    return

                var partial = task['partialScore'];
                if (partial === null)
                    return;

                var validPartial = partial.match(/\d+/g).filter(function(score) {
                    return (lb <= parseInt(score) && parseInt(score) <= ub);
                });
                if (validPartial.length == 0)
                    return;
            }

            // // AC 済を弾きます
            // if (hideAC && setUserAC.has(task['taskScreenName']))
            //     return;
            // いいえ，ここでは弾きません

            if (setShowingWriters !== null) {
                var cap = task['writers'].filter(function(writer) {
                    return setShowingWriters.has(writer[0].toLowerCase());
                });
                if (cap.length == 0)
                    return;
            }

            // ...


            // 試練に耐え抜いた子たちです
            points.add(parseInt(point));
            tasks.push(task);
        });

        if (tasks.length < 1) {
            $('#warning').append($('<li>').text('該当する項目はありません．'));
        }

        {
            // 点数テーブルを書きます．set の順番がアなので困ります
            // var pointList = Array.from(points).sort(function(x, y) {
            //     return x-y;
            // });
            // IE が Array.from 使えないってマジ？ 自分，対応やめていいっすか？
            var pointList;
            if (Array.from !== undefined) {
                pointList = Array.from(points).sort(function(x, y) {
                    return x-y;
                });
            } else {
                $('#warning').append('<li>').text(
                    'Internet Explorer をお使いの方へ．正しく動かなかったら'
                        + 'ごめんなさい．えびより．'
                    // むしろ Microsoft が謝ってほしい（傲慢）
                    // Edge だと動くはずだから Edge を使ってほしい
                    // あと IE 以外でこのメッセージが出た場合はごめんなさい
                    // User Agent で判別するのはアになりがちなのでしません
                );
                pointList = Array();
                points.forEach(function(point) {
                    pointList.push(point);
                });
                pointList.sort(function(x, y) {
                    return x-y;
                });
            }
                
            $.each(pointList, function(i, point) {
                $('#progresstable>thead>tr').append(
                    $('<th>').text(point)
                        .attr('id', 'prog_head_'+point)
                        .attr('class', colorForPoint(point))
                );

                $('#progress_whole').append(
                    $('<td>').text('0')
                        .attr('id', 'prog_whole_'+point)
                        .attr('class', colorForPoint(point))
                );

                $('#progress_user').append(
                    $('<td>').text('0')
                        .attr('id', 'prog_user_'+point)
                        .attr('class', colorForPoint(point))
                        .css('background-color', 'transparent')
                );

                if (rivals.length == 0)
                    return;

                $.each($('tr.progress_rival'), function(i, $tr) {
                    var id = $tr.id;
                    var suffix = id.replace(/progress_/, '');
                    // if (suffix == 'whole') return;
                    $('#'+id).append(
                        $('<td>').text('0')
                            .attr('id', 'prog_'+suffix+'_'+point)
                            .attr('class', colorForPoint(point))
                            .css('background-color', 'transparent')
                    );
                });
            });
        }

        $.each(tasks, function(i, task) {
            setTimeout(function(count, task) {
                // 問題をテーブルに追加するにあたり，AC の状態を確認します
                var pid = task['taskScreenName'];
                var status = null;
                if (setUserAC.has(pid)) {
                    status = (hideAC? 'hidden':'success');
                } else if (setRivalAC.has(pid)) {
                    status = 'danger';
                } else if (setUserNotAC.has(pid)) {
                    status = 'warning';
                }

                appendTask('#mainconttable>tbody', task, count, status);


                // 進捗表を更新します
                // mutex 的なのをしないと嘘の値になってしまいそう？
                // 足される順番自体はどうでもいいんだけどね．
                // や，setTimeout にこだわらなければいいと言えばそんな気もする
                var point = task['fullScore'];

                selectAndAdd('#prog_whole_'+point, 1);
                selectAndAdd('#prog_whole_total', point);
                if (setUserAC.has(pid)) {
                    selectAndAdd('#prog_user_'+point, 1);
                    selectAndAdd('#prog_user_total', point);
                    selectAndAdd('#num_user_ac', 1);
                } else if (setUserNotAC.has(pid)) {
                    selectAndAdd('#num_user_not_ac', 1);
                } else {
                    selectAndAdd('#num_user_unsubmitted', 1);
                }

                {
                    $.each($('tr.progress_rival'), function(j, $tr) {
                        var id = $tr.id;
                        var suffix = id.replace(/progress_/, '');

                        if (setEachRivalAC[j].has(pid)) {
                            selectAndAdd('#prog_'+suffix+'_'+point, 1);
                            selectAndAdd('#prog_'+suffix+'_total', point);
                            selectAndAdd('#num_'+suffix+'_ac', 1);
                        } else if (setEachRivalNotAC[j].has(pid)) {
                            selectAndAdd('#num_'+suffix+'_not_ac', 1);
                        } else {
                            selectAndAdd('#num_'+suffix+'_unsubmitted', 1);
                        }
                    });
                }

                // var ptColor = window.getComputedStyle(
                //     document.getElementById('prog_whole_'+point)
                // ).backgroundColor.match(/\d+/g).join(',');

                var ptColor = $('.'+colorForPoint(point))
                    .css('backgroundColor').match(/\d+/g)
                    .slice(0, 3).join(',');

                {
                    var alpha = $('#prog_whole_'+point).text() == '0'? 0:(
                        parseInt($('#prog_user_'+point).text())
                            / parseInt($('#prog_whole_'+point).text())
                    );

                    $('#prog_user_'+point).css(
                        'background-color',
                        'rgba(' + ptColor + ',' + alpha + ')'
                    );
                }

                if (rivals.length == 0)
                    return;

                $.each($('tr.progress_rival'), function(j, $tr) {
                    var id = $tr.id;
                    var suffix = id.replace(/progress_/, '');

                    var alpha = $('#prog_whole_'+point).text() == '0'? 0:(
                        parseInt($('#prog_'+suffix+'_'+point).text())
                            / parseInt($('#prog_whole_'+point).text())
                    );

                    $('#prog_'+suffix+'_'+point).css(
                        'background-color',
                        'rgba(' + ptColor + ',' + alpha + ')'
                    );
                });
            }.bind(null, i, task), 0);
        });

        var timer = setInterval(function() {
            if ($('#mainconttable>tbody>tr').length < tasks.length) return;

            clearInterval(timer);
            $('#mainconttable').tablesorter();
        });
    });


    if (!isEmpty(userName) || !isEmpty(rivals)) {
        $('#progresstable').attr('style', 'display: table');
        $('#ac_count').css({
            display: 'table',
            'white-space': 'nowrap',
        });
    }

    if (isEmpty(userName)) {
        $('.result_user').css('display', 'none');
        $('#progress_user').attr('style', 'display: none');
        $('#ac_count_user').attr('style', 'display: none');
    } else {
        prettifyUserName('user', userName);
        $('.result_user').css('display', 'block');
        $('#progress_user').attr('style', 'display: table-row');
        $('#ac_count_user').attr('style', 'display: table-row');
    }

    if (isEmpty(rivals)) {
        $('.result_rival').css('display', 'none');
        $('.progress_rival').attr('style', 'display: none');
        $('.ac_count_rival').attr('style', 'display: none');
    } else {
        $.each(rivals, function(i, name) {
            prettifyUserName('rival'+i, name);
        });
        $('.result_rival').css('display', 'block');
        $('.progress_rival').attr('style', 'display: table-row');
        $('.ac_count_rival').attr('style', 'display: table-row');
    }

    $('#difficulty_submit').on('click', jumpProcess);

    // $.each(['username', 'rivalname', 'writer'], function(i, who) {
    //     // ループなんてしないで入力するやつをセレクタでが〜っとやっちゃえば？
    //     $(document).on('keypress', 'input[name=form_'+who+']', function(e) {
    //         if (e.keyCode == 13) {
    //             jumpProcess();
    //         } else {
    //             $.noop();
    //         }
    //     });
    // });
});  
