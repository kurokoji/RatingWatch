var colors = [];
var rates = [];

function scrapingAtcoder(userid, cb) {
  $.ajax({
    type: 'GET',
    url: "https://atcoder.jp/user/" + userid,
    dataType: 'html',
    success: function(data) {
      var src = data.responseText;
      var usrc = getUserColor(src);
      var jsonStr = getAtcoderJSON(src);
      if (jsonStr == null) {
        alert("ユーザ名が間違っています");
        return;
      }
      var rating_history = JSON.parse(jsonStr);
      cb(rating_history);
      colors.push(usrc);
    }, error:function(e) {
      console.log(e);
    }
  });
}

function addUserElement(user, idx) {
  var a = document.getElementsByTagName("a").item(idx);
  var sp = document.getElementsByTagName("span").item(idx);
  console.log(colors[idx]);
  a.href = "https://atcoder.jp/user/" + user;
  sp.className = colors[idx];
  sp.innerHTML = user + " [" + rates[idx] + "]";
}

function addTweetButton(user) {
  var str = "";
  if (user.length === 1) {
    str = user[0] + "'s rate is " + rates[0];
  } else {
    if (rates[0] === rates[1]) {
      str = user[0] + "'s and " + user[1] + "'s rate is " + rates[0] + ".\nDraw!!";
    } else {
      str = user[0] + "'s rate is " + rates[0] + ".\n" + 
            user[1] + "'s rate is " + rates[1] + ".\n";
      if (rates[0] > rates[1]) {
        str += user[0] + " is the winner!!";
      } else {
        str += user[1] + " is the winner!!";
      }
    }
  }
  var ur = window.location.href;
  console.log(ur);
  console.log(str);
  twttr.widgets.createShareButton(ur, 
  document.getElementById('tweetbutton'), {
    text: str,
    hashtag: "RatingWatch"
  }
  );
}

function getUserColor(src) {
  var idxf = src.indexOf("user-");
  var idxe = src.indexOf('"', idxf);
  if (idxf != -1 && idxe != -1) {
    console.log(src.slice(idxf, idxe));
    return src.slice(idxf, idxe);
  }
  return null;
}

function getAtcoderJSON(src) {
  var idxf = src.indexOf('JSON.parse("');
  var idxe = src.indexOf('");]]>', idxf);
  if (idxf != -1 && idxe != -1) {
    // バックスラッシュ(円マーク)取り除かないとダメ
    return src.slice(idxf + 12, idxe).replace(/\\/g, "");
  }
  return null;
}

$(document).ready(function retrieveGETqs() {
  var query = window.location.search.substring(1);
  var parms = query.split('&');
  var names = parms[0].slice(parms[0].indexOf('=') + 1).split('+');
  document.getElementById('atcoderid').value = names.join(' ');
  console.log(names);

  if (names.length === 1){
    if (names[0] === "") {
      return;
    }
    scrapingAtcoder(names[0], function(user){
      var rating = [user];
      rates.push(rating[0][0][1]);
      drawGraph(rating, names);
    });
    setTimeout(addUserElement, 1000, names[0], 0);
    setTimeout(addTweetButton, 1000, names);
  }
  if (names.length === 2){
    scrapingAtcoder(names[0], function(user1){
      scrapingAtcoder(names[1], function(user2){
        var rating = [user1, user2];
        rates.push(rating[0][0][1]);
        rates.push(rating[1][0][1]);
        drawGraph(rating, names);
      });
    });
    setTimeout(addUserElement, 1000, names[0], 0);
    setTimeout(addUserElement, 1000, names[1], 1);
    setTimeout(addTweetButton, 1000, names);
  }
  for (var e of colors) console.log(e);
});


function drawGraph(rating_history, name) {
  var ctx = document.getElementById('myChart').getContext('2d');
  ctx.canvas.width = 750;         //グラフのwidth
  ctx.canvas.height = 500;        //グラフのheight
  console.log(rating_history[0][0]);
  Chart.defaults.global.elements.line.tension = 0;    //グラフを直線に

  var contest = [];

  if (name.length == 2){
    var rating_merge = [];
    var rating1 = [], rating2 = [];
    
    for (var e of rating_history[0]) rating_merge.push([e[0], e[3]]);
    for (var e of rating_history[1]) rating_merge.push([e[0], e[3]]);

    var r = rating_merge.filter(function(v, idx, s) {
      for (var i = 0; i < s.length; ++i) {
        if (v[0] === s[i][0]) {
          return i === idx;
        }
      }
      return false;
    });
    console.log(r[0]);

    r.sort(function(lhs, rhs) {
      if (lhs[0] > rhs[0]) {
        return 1;
      } else {
        return -1;
      }
    });
    console.log(r);
    for (var e of r) {
      contest.push(
        e[1].replace(/AtCoder Grand Contest/g, 'AGC').
        replace(/AtCoder Regular Contest/g, 'ARC').
        replace(/AtCoder Beginner Contest/g, 'ABC')
      );
    }
    var max_rate = -1;
    for (var e of r) {
      var flg = true;
      for (var t of rating_history[0]) {
        if (e[0] === t[0]) {
          max_rate = Math.max(max_rate, t[1]);
          rating1.push(t[1]);
          flg = false;
        }
      }
      if (flg && rating1.length === 0) {
        rating1.push(null);
      } else if (flg) {
        rating1.push(rating1[rating1.length - 1]);
      }
    }

    for (var e of r) {
      var flg = true;
      for (var t of rating_history[1]) {
        if (e[0] === t[0]) {
          max_rate = Math.max(max_rate, t[1]);
          rating2.push(t[1]);
          flg = false;
        }
      }
      if (flg && rating2.length === 0) {
        rating2.push(null);
      } else if (flg) {
        rating2.push(rating2[rating2.length - 1]);
      }
    }


    var myChart = new Chart(ctx, {
      type: 'line',           //グラフの種類
      data: {
        labels: contest,   //グラフの項目名(contest)
        datasets: [{
          label: name[0],        //グラフの名前(name)
          data: rating1,     //項目のデータ(rating)
          backgroundColor: "rgba(153,255,51,0.4)"   //線の下の色
        },
        {
          label: name[1],
          data: rating2,
          backgroundColor: "rgba(219,36,91,0.4)"
        }]
      },
      options: {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                min: 0,
                max: Math.ceil(max_rate / 1000) * 1000
              }
            }
          ]
        },
        responsive: false,
      }
    });
  } else {
    var m = rating_history[0].length;
  
    var contest = [];
    var rating = [];
    var max_rate = -1;
    for (var i = 1; i < m; i++){
      contest.push(rating_history[0][m - i][3].
        replace(/AtCoder Grand Contest/g, 'AGC').
        replace(/AtCoder Regular Contest/g, 'ARC').
        replace(/AtCoder Beginner Contest/g, 'ABC')
      );
      max_rate = Math.max(max_rate, rating_history[0][m - i][1]);
      rating.push(rating_history[0][m - i][1])
    }
    var myChart = new Chart(ctx, {
      type: 'line',           //グラフの種類
      data: {
        labels: contest,   //グラフの項目名(contest)
        datasets: [{
          label: name,        //グラフの名前(name)
          data: rating,     //項目のデータ(rating)
          backgroundColor: "rgba(153,255,51,0.4)"   //線の下の色
        }]
      },
      options: {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                min: 0,
                max: Math.ceil(max_rate / 1000) * 1000
              }
            }
          ]
        },
        responsive: false,
      }
    });
  }
}
