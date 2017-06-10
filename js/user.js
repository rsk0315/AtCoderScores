$(window).on("load", function() {
    var PointArray = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
                        1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000,
                        2100, 2200, 2300, 2400, 2500];

    $("#mainconttable").tablesorter();

    $("#difficulty_submit").click(function() {
        var lb = parseInt($("#difficulty_min").val());
        var ub = parseInt($("#difficulty_max").val());

        // 逆でも対応する優しい世界
        if(lb > ub) {
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