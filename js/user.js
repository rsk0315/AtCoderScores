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

function removeWeirdChars(s, r=/[^\w-]+/g) {
    return s.replace(r, '');
}

function isEmpty(s) {
    // JS わからんのでアレなんですけど，冗長だったりしますか
    return (s === undefined || s === null || s == '' || s == []);
}

function jumpProcess() {
    // あれ？ ここではそのまま .val() を投げるだけで
    // 後でよしなにやってもらえますか？
    var queryObj = {
        lbound: $('#difficulty_min').val(),
        ubound: $('#difficulty_max').val(),
        user_name: $('input[name=form_username]').val(),
        rival_name: $('input[name=form_rivalname]').val(),
        writers: $('input[name=form_writer]').val(),
        // user_name: removeWeirdChars(
        //     $('input[name=form_username]').val(), /[^\w,-]+|,.*/g
        // ),
        // rival_name: $('input[name=form_rivalname]').val()
        //     .replace(/[^\w,-]/g, '').match(/\w+/g).join(', '),
        // writers: removeWeirdChars(
        //     $('input[name=form_writer]').val(), /[^\w|-]+/g
        // ),
        hide_ac: $('input[name=hide_ac]:checked').val(),

        show_abc: $('input[name=show_abc]:checked').val(),
        show_arc: $('input[name=show_arc]:checked').val(),
        show_agc: $('input[name=show_agc]:checked').val(),
        show_apc: $('input[name=show_apc]:checked').val(),
        show_other: $('input[name=show_other]:checked').val(),
        show_upcoming: $('input[name=show_upcoming]:checked').val(),

        include_partial: $('input[name=include_partial]:checked').val(),
    };
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
    var imageXpath = "//img[contains(@src, '/public/img/icon/crown')]";
    var imageURL = 'https://atcoder.jp/user/' + name;
    var imageYQL = (
        YQL_HTML_BASE + '&q='
            + 'select * from htmlstring where '
            + 'url="' + imageURL + '" and xpath="' + imageXpath + '"'
            + '&tsurai=' + curTime
    );
    var imageName = null;

    var userXpath = "//a[@class='username']/span";
    var userYQL = (
        YQL_HTML_BASE + '&q='
            + 'select * from htmlstring where '
            + 'url="https://atcoder.jp/user/' + name
            + '" and xpath="' + userXpath + '"' + '&tsurai=' + curTime
    );

    $.when(
        $.ajax({
            type: 'GET',
            url: imageYQL,
            dataType: 'json',
            cache: false,
        }),
        $.ajax({
            type: 'GET',
            url: userYQL,
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
            // console.log(name);
            // console.log('User not found.');
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

                // // XXX 複数人やるようになったのでこれではだめです
                // $('input[name=form_'+who+'name]').val($(userAttr).text());
                if (who == 'user') {
                    $('input[name=form_username]').val($(userAttr).text());
                } else {
                    // console.log($('input[name=form_rivalname]'));
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
                    // jumpProcess();
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

        // FIXME ユーザ入力が TSuTa_j とかだった場合に Tsuta_J に
        // 直す処理をできるはずなので，そのうちやります．
        // やりました．無限ループになることはないはずですが，
        // なった場合はこれをやめます．
        $progName.html($a);
        $acCountName.html($a.clone());

        // imageName ???
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

    $('.panel-heading').on('click', function() {
        $($(this).data('target')).collapse('toggle');
    });

    $('[data-toggle=tooltip]').tooltip();

    // ここちょっとその場しのぎ感がありますよね．
    // まぁ 2500 点問題が出たら考えます
    const UB_MAX = 1000000;  // 強気にいっちゃえ〜〜〜（手のひら返し）

    // URL パラメータをパース
    var currentURL = $(location).attr('search');
    var params = $.url(currentURL).param();
    var userName, rivalNames, hideAC, lb, ub;
    var showABC, showARC, showAGC, showAPC, showOther, showUpcoming;
    var writers;
    var includePartial;

    userName = params.user_name;
    rivalNames = params.rival_name;
    writers = params.writers;
    hideAC = params.hide_ac;
    lb = params.lbound;
    ub = params.ubound;

    userName = isEmpty(userName)? '':removeWeirdChars(
        // , を使ってしまった人がアにならないように，, より左だけを持ってきます
        userName, /[^\w,-]+|,.*/g
    );
    var rivals = (
        isEmpty(rivalNames)?
            [] : rivalNames.replace(/[^\w,-]/g, '').match(/\w+/g)
    );
    // 'foo,,bar,F?O?O,baz' みたいなクエリは 'foo, bar, baz' に直したいです
    // if (rivals.length > 0)
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
    writers = isEmpty(writers)? '' : removeWeirdChars(writers, /[^\w|-]+/g);
    hideAC = (hideAC == 'on');  // */index.html では false
    showUpcoming = (params.show_upcoming == 'on');
    includePartial = (params.include_partial == 'on');
    lb = isEmpty(lb)? 0 : parseInt(removeWeirdChars(lb));
    ub = isEmpty(ub)? UB_MAX : parseInt(removeWeirdChars(ub));

    showABC = (params.show_abc != '');  // */index.html では true
    showARC = (params.show_arc != '');
    showAGC = (params.show_agc != '');
    showAPC = (params.show_apc != '');
    showOther = (params.show_other != '');

    // パース結果をフォームに反映・保存
    $('input[name=form_username]').val(userName);
    $('input[name=form_rivalname]').val(rivals.join(', '));
    $('input[name=form_writer]').val(writers);
    $('input[name=hide_ac]').prop('checked', hideAC);
    $('#difficulty_min').val(lb);
    $('#difficulty_max').val(ub);

    $('input[name=show_abc]').prop('checked', showABC);
    $('input[name=show_arc]').prop('checked', showARC);
    $('input[name=show_agc]').prop('checked', showAGC);
    $('input[name=show_apc]').prop('checked', showAPC);
    $('input[name=show_other]').prop('checked', showOther);
    $('input[name=show_upcoming]').prop('checked', showUpcoming);

    $('input[name=include_partial]').prop('checked', includePartial);

    $('.selectpicker').selectpicker('refresh');

    if (lb > ub) {
        var tmp = lb;
        lb = ub;
        ub = tmp;
    }

    // ライバル達用のテーブルをつくっちゃいましょう
    // ついでにいろいろ用意します
    var rivalIndex = {};
    // if (rivals.length > 0)
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
    var queryAP = (
        'select * from json where '
            + 'url="http://beta.kenkoooo.com/atcoder/atcoder-api/results?user='
            + userName + '&rivals=' + rivals.join(',')
            + '&tsurai=' + curTime + '"'
    );

    // 開催前のコンテストを調べてあげよー！
    var contestXpath = "//div[@id='collapse-contest']/div[2]//tr//td[2]//a";
    var queryUC = (
        YQL_HTML_BASE + '&q='
            + 'select * from htmlstring where '
            + 'url="https://atcoder.jp/?lang=ja" and xpath="'
            + contestXpath + '"&tsurai=' + curTime
    );

    // console.log(YQL_JSON_BASE);
    // console.log(queryAP);
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
            url: queryUC,
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
        // if (rivals.length > 0)
        {
            $.each(rivalIndex, function(i, name) {
                setEachRivalAC.push(new Set());
                setEachRivalNotAC.push(new Set());
            });
        }

        if (dataAP[0].query.results !== null) {
            var userNameLC = userName.toLowerCase();
            $(dataAP[0].query.results.json.json).each(function() {
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
                // if (rivals.length == 0)
                //     return;

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
                // } else {
                //     // if (this.user_id.toLowerCase() == rivalNameLC)
                //     // なんかライバルは提出するだけで AC の判定になって
                //     // いたんですが（）．対戦相手に有利な理不尽バトル漫画かな？
                //     if (this.result == 'AC') {
                //         setRivalAC.add(pid);
                //         setRivalNotAC.delete(pid);
                //     } else /* if (this.result != 'CE') */ {
                //         if (!setRivalNotAC.has(pid)) {
                //             // ここの分岐もおかしいね（ア
                //             setRivalNotAC.add(pid);
                //         }
                //     }
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
                $('#error').append(
                    $('<ul>').css('font-weight', 'normal')
                        .append(
                            $('<li>').text(
                                'おそらく AtCoder Problems さんの API は'
                                    + '正常なのですが，それを取得するための'
                                    + 'YQL の不具合でこけています．ユーザ名の'
                                    +' 組み合わせをご報告いただけると'
                                    + '捗るかもしれません．'
                            )
                        )
                        .append(
                            $('<li>').text(
                                'あるいは正常に虚無が'
                                    + '返ってきただけかもしれません．'
                            )
                        )
                );
            }
            // console.log(dataAP);
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
            var contestScreenName = task['contestScreenName'];
            var kind = contestScreenName.match(axcRE);
            if (kind !== null) {
                if (kind[1] == 'b' && !showABC) return;
                if (kind[1] == 'r' && !showARC) return;
                if (kind[1] == 'g' && !showAGC) return;
                if (kind[1] == 'p' && !showAPC) return;
            } else if (!showOther) {
                return;
            }

            // 開催前コンテストを弾きます
            if (!showUpcoming && setUpcoming.has(contestScreenName))
                return;

            // 得点帯で弾きます
            var point = parseInt(task['fullScore']);
            // console.log('? '+point);
            if (!(lb <= point && point <= ub)) {
                // TODO 部分点を許容して云々する場合はそうします
                if (!includePartial)
                    return

                var partial = task['partialScore'];
                if (partial === null)
                    return;

                var validPartial = partial.match(/\d+/g).filter(
                    score => (lb <= parseInt(score) && parseInt(score) <= ub)
                );
                if (validPartial.length == 0)
                    return;
            }

            // // AC 済を弾きます
            // if (hideAC && setUserAC.has(task['taskScreenName']))
            //     return;
            // いいえ，ここでは弾きません

            if (setShowingWriters !== null) {
                var cap = task['writers'].filter(
                    writer => setShowingWriters.has(writer[0].toLowerCase())
                );
                if (cap.length == 0)
                    return;
            }

            // ...


            // 試練に耐え抜いた子たちです
            // console.log(task);
            points.add(parseInt(point));
            tasks.push(task);
        });

        {
            // 点数テーブルを書きます．set の順番がアなので困ります
            var pointList = Array.from(points).sort(function(x, y) {
                return x-y;
            });
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

                // if (rivals.length == 0)
                //     return;

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

                // if (setRivalAC.has(pid)) {
                //     selectAndAdd('#prog_rival_'+point, 1);
                //     selectAndAdd('#prog_rival_total', point);
                //     selectAndAdd('#num_rival_ac', 1);
                // } else if (setRivalNotAC.has(pid)) {
                //     selectAndAdd('#num_rival_not_ac', 1);
                // } else {
                //     selectAndAdd('#num_rival_unsubmitted', 1);
                // }

                // if (rivals.length > 0)
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

                var ptColor = window.getComputedStyle(
                    document.getElementById('prog_whole_'+point)
                ).backgroundColor.match(/\d+/g).join(',');

                {
                    var alpha = $('prog_whole_'+point).text() == '0'? 0:(
                        parseInt($('#prog_user_'+point).text())
                            / parseInt($('#prog_whole_'+point).text())
                    );

                    $('#prog_user_'+point).css(
                        'background-color',
                        'rgba(' + ptColor + ',' + alpha + ')'
                    );
                }

                // if (rivals.length == 0)
                //     return;

                $.each($('tr.progress_rival'), function(j, $tr) {
                    var id = $tr.id;
                    var suffix = id.replace(/progress_/, '');

                    var alpha = $('prog_whole_'+point).text() == '0'? 0:(
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
        // $('#ac_count').attr('style', 'display: table');
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
        // if (rivals.length > 0)
        {
            $.each(rivals, function(i, name) {
                prettifyUserName('rival'+i, name);
            });
        }
        $('.result_rival').css('display', 'block');
        $('.progress_rival').attr('style', 'display: table-row');
        $('.ac_count_rival').attr('style', 'display: table-row');
    }

    $('#difficulty_submit').on('click', jumpProcess);

    $.each(['username', 'rivalname', 'writer'], function(i, who) {
        // ループなんてしないで入力するやつをセレクタでが〜っとやっちゃえば？
        $(document).on('keypress', 'input[name=form_'+who+']', function(e) {
            if (e.keyCode == 13) {
                jumpProcess();
            } else {
                $.noop();
            }
        });
    });
});  
