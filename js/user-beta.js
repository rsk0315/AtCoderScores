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
*/

function removeWeirdChars(s, r=/[^\w-]+/g) {
    return s.replace(r, '');
}

function isEmpty(s) {
    // JS わからんのでアレなんですけど，冗長だったりしますか
    return (s === undefined || s === null || s == '' /* || s == [] */);
}

function jumpProcess() {
    var queryObj = {
        lbound: $('#difficulty_min').val(),
        ubound: $('#difficulty_max').val(),
        user_name: removeWeirdChars($('input[name=form_username]').val()),
        rival_name: removeWeirdChars($('input[name=form_rivalname]').val()),
        writers: removeWeirdChars(
            $('input[name=form_writer]').val(), /[^\w|-]+/g
        ),
        hide_ac: $('input[name=hide_ac]:checked').val(),

        show_abc: $('input[name=show_abc]:checked').val(),
        show_arc: $('input[name=show_arc]:checked').val(),
        show_agc: $('input[name=show_agc]:checked').val(),
        show_apc: $('input[name=show_apc]:checked').val(),
        show_other: $('input[name=show_other]:checked').val(),
        show_upcoming: $('input[name=show_upcoming]:checked').val(),

        include_partial: $('input[name=include_partial]:checked').val(),
    };
    window.location.href = 'index-beta.html?' + $.param(queryObj);
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

    // who: "user" または "rival"
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
            console.log('User not found.');
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
                $('input[name=form_'+who+'name]').val($(userAttr).text());
                if (!hasAlerted) {
                    // 警告は一度だけです．
                    hasAlerted = true;
                    alert(
                        'ユーザ名の大文字小文字を修正して再読み込みします．'
                            + '無限に再読み込みされるようなことがあれば'
                            + 'ご報告ください．すみません．'
                    );
                    jumpProcess();
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

    // ここちょっとその場しのぎ感がありますよね．
    // まぁ 2500 点問題が出たら考えます
    const UB_MAX = 1000000;  // 強気にいっちゃえ〜〜〜

    // URL パラメータをパース
    var currentURL = $(location).attr('search');
    var params = $.url(currentURL).param();
    var userName, rivalName, hideAC, lb, ub;
    var showABC, showARC, showAGC, showAPC, showOther, showUpcoming;
    var writers;
    var includePartial;

    userName = params.user_name;
    rivalName = params.rival_name;
    writers = params.writers;
    hideAC = params.hide_ac;
    lb = params.lbound;
    ub = params.ubound;

    userName = isEmpty(userName)? '':removeWeirdChars(userName);
    rivalName = isEmpty(rivalName)? '':removeWeirdChars(rivalName);
    writers = isEmpty(writers)? '':removeWeirdChars(writers, /[^\w|-]+/g);
    hideAC = (hideAC == 'on');  // */index.html では false
    showUpcoming = (params.show_upcoming == 'on');
    includePartial = (params.include_partial == 'on');
    lb = isEmpty(lb)? 0:parseInt(removeWeirdChars(lb));
    ub = isEmpty(ub)? UB_MAX:parseInt(removeWeirdChars(ub));

    showABC = (params.show_abc != '');  // */index.html では true
    showARC = (params.show_arc != '');
    showAGC = (params.show_agc != '');
    showAPC = (params.show_apc != '');
    showOther = (params.show_other != '');

    // パース結果をフォームに反映・保存
    $('input[name=form_username]').val(userName);
    $('input[name=form_rivalname]').val(rivalName);
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

    // べっ，別に API のことなんて好きじゃないんだからっ（ぺちんぺちん）
    var cacheExpires = 300 * 1000;  // ms
    var curTime = Math.floor(Date.now()/cacheExpires);  // これ関数化すべきかも
    var queryAP = (
        'select * from json where '
            + 'url="http://beta.kenkoooo.com/atcoder/atcoder-api/results?user='
            + userName + '&rivals=' + rivalName + '&tsurai=' + curTime + '"'
    );

    // 開催前のコンテストを調べてあげよー！
    var contestXpath = "//div[@id='collapse-contest']/div[2]//tr//td[2]//a";
    var queryUC = (
        YQL_HTML_BASE + '&q='
            + 'select * from htmlstring where '
            + 'url="https://atcoder.jp/?lang=ja" and xpath="'
            + contestXpath + '"&tsurai=' + curTime
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
            url: queryUC,
        }),
        // 私のつくった JSON（私ではなく私のスクリプトが，ですね）
        $.ajax({
            dataType: 'json',
            url: './tasks-beta.json',
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
        if (dataAP[0].query.results !== null) {
            var userNameLC = userName.toLowerCase();
            var rivalNameLC = rivalName.toLowerCase();
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
                } else {
                    if (this.user_id.toLowerCase() == rivalNameLC) {
                        setRivalAC.add(pid);
                        setRivalNotAC.delete(pid);
                    } else /* if (this.result != 'CE') */ {
                        if (!setRivalNotAC.has(pid)) {
                            setRivalNotAC.add(pid);
                        }
                    }
                }
            });
        }
        // 調べ終わりました

        // 問題のリストアップをする前に，リスト全部を一度なめます
        // 各種フィルタをかけて，生き残った問題の点数の種類を知りたいです

        var points = new Set();
        var tasks = Array();
        var axcRE = /a([brgp])c\d+/;
        // console.log(dataSC[0]);

        var setShowingWriters = null;
        if (!isEmpty(writers)) {
            setShowingWriters = new Set();
            $.each(writers.split(/[,|]/g), function(i, writer) {
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

            // TODO writer で弾きます
            if (setShowingWriters !== null) {
                var cap = task['writers'].filter(
                    writer => setShowingWriters.has(writer[0].toLowerCase())
                );
                // console.log(cap);
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
                // console.log(point);

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

                $.each(['user', 'rival'], function(j, id_) {
                    $('#progress_'+id_).append(
                        $('<td>').text('0')
                            .attr('id', 'prog_'+id_+'_'+point)
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

                if (setRivalAC.has(pid)) {
                    selectAndAdd('#prog_rival_'+point, 1);
                    selectAndAdd('#prog_rival_total', point);
                    selectAndAdd('#num_rival_ac', 1);
                } else if (setRivalNotAC.has(pid)) {
                    selectAndAdd('#num_rival_not_ac', 1);
                } else {
                    selectAndAdd('#num_rival_unsubmitted', 1);
                }

                var ptColor = window.getComputedStyle(
                    document.getElementById('prog_whole_'+point)
                ).backgroundColor.match(/\d+/g).join(',');

                $.each(['user', 'rival'], function(j, name) {
                    var alpha = $('prog_whole_'+point).text() == '0'? 0:(
                        parseInt($('#prog_'+name+'_'+point).text())
                            / parseInt($('#prog_whole_'+point).text())
                    );

                    $('#prog_'+name+'_'+point).css(
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


    if (!isEmpty(userName) || !isEmpty(rivalName)) {
        $('#progresstable').attr('style', 'display: table');
        $('#ac_count').attr('style', 'display: table');
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


    if (isEmpty(rivalName)) {
        $('.result_rival').css('display', 'none');
        $('#progress_rival').attr('style', 'display: none');
        $('#ac_count_rival').attr('style', 'display: none');
    } else {
        prettifyUserName('rival', rivalName);
        $('.result_rival').css('display', 'block');
        $('#progress_rival').attr('style', 'display: table-row');
        $('#ac_count_rival').attr('style', 'display: table-row');
    }

    $('#difficulty_submit').click(jumpProcess);

    $.each(['username', 'rivalname', 'writer'], function(i, who) {
        $(document).on('keypress', 'input[name=form_'+who+']', function(e) {
            if (e.keyCode == 13) {
                jumpProcess();
            } else {
                $.noop();
            }
        });
    });
});  
