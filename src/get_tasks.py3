#!/usr/bin/env python3.6

import os
import re
import string
import sys
from collections import namedtuple
from functools import reduce
from urllib.parse import urljoin

import mechanicalsoup
from bs4 import BeautifulSoup

# irregular prefix of tasks
# {contest-name: task_prefix, ...}
# contest-name.contest.atcoder.jp/tasks/task_prefix_*
# beta.atcoder.jp/contests/contest-name/tasks/task_prefix_*
TRADITIONAL_URL = re.compile(
    r'\[(?P<CONTEST_TITLE>[^\]]+)\]'
    r'\((https?://(?P<CONTEST_NAME>[\w-]+).contest.atcoder.jp/?)\)'
)
BETA_URL = re.compile(
    r'\[(?P<CONTEST_TITLE>[^\]]+)\]'
    r'\((https?://beta.atcoder.jp/contests/(?P<CONTEST_NAME>[\w-]+)/?)\)'
)
TASK_PREFIXES = {
    'tenka1-2016-quala':
        'tenka1_2016_qualA',
    'tenka1-2016-final-open':
        'tenka1_2016_final',
    'yahoo-procon2017-final-open':
        'yahoo_procon2017_final',
    'yahoo-procon2017-qual':
        'yahoo_procon2017_qual',
    'rco-contest-2017-qual':
        'rco_contest_2017_qual',
    'mujin-pc-2017':
        'mujin_pc_2017',
    'dwacon2017-honsen':
        'dwango2017final',
    'dwacon2017-prelims':
        'dwango2017qual',
    'cf16-final-open':
        'codefestival_2016_final',
    'cf16-exhibition-open':
        'codefestival_2016_ex',
    'cf16-tournament-round1-open':
        'asaporo',  # c f
    'cf16-tournament-round2-open':
        'asaporo',  # e a
    'cf16-tournament-round3-open':
        'asaporo',  # d b
    'cf16-relay-open':
        'relay',
    'cf16-exhibition-final-open':
        'cf16_exhibition_final',
    'ddcc2016-qual':
        'ddcc_2016_qual',
    'ddcc2016-final':
        'ddcc_2016_final',
    'code-festival-2016-qualc':
        'codefestival_2016_qualC',
    'code-festival-2016-qualb':
        'codefestival_2016_qualB',
    'code-festival-2016-quala':
        'codefestival_2016_qualA',
    'tenka1-2016-qualb':
        'tenka1_2016_qualB',
    'cf16-final-open':
        'codefestival_2016_final',
    'ddcc2016-qual':
        'ddcc_2016_qual',
    'dwacon2017-prelims':
        'dwango2017qual',
    'yahoo-procon2017-qual':
        'yahoo_procon2017_qual',
    'code-festival-2017-quala':
        'code_festival_2017_quala',
    'tenka1-2017':
        'tenka1_2017',
    'tenka1-2017-beginner':
        'tenka1_2017',
    'ddcc2017-qual':
        'ddcc2017_qual',
    'ddcc2017-final':
        'ddcc2017_final',
    'code-festival-2017-qualb':
        'code_festival_2017_qualb',
    'code-festival-2017-qualc':
        'code_festival_2017_qualc',
    'cf17-final-open':
        'cf17_final',
    'cf17-exhibition-open':
        'cf17_exhibition',
    'cf17-tournament-round1-open':
        'asaporo2',  # c d
    'cf17-tournament-round2-open':
        'asaporo2',  # a b
    'cf17-tournament-round3-open':
        'asaporo2',  # e f
    'cf17-relay-open':
        'relay2',
    'code-thanks-festival-2017-open':
        'code_thanks_festival_2017',
    'colopl2018-qual':
        'colopl2018_qual',
    'dwacon2018-prelims':
        'dwacon2018_prelims',
    'colopl2018-final-open':
        'colopl2018_final',
    'soundhound2018':
        'soundhound2018',
    'dwacon2018-final-open':
        'dwacon2018_final',
    'yahoo-procon2018-qual':
        'yahoo_procon2018_qual',
}

ABC_TYPE, ARC_TYPE, AGC_TYPE, APC_TYPE, IRREGULAR_TYPE = range(5)
CONTEST_TYPES = {
    'abc': ABC_TYPE,
    'arc': ARC_TYPE,
    'agc': AGC_TYPE,
    'apc': APC_TYPE,
}

MAIN_TEMPLATE = '''<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AtCoder Scores</title>

    <!-- Bootstrap の CSS 読み込み -->
    <link href="./css/bootstrap.min.css" rel="stylesheet">

    <!-- jQuery 読み込み -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>

    <!-- Bootstrap の JS 読み込み -->
    <script src="./js/bootstrap.min.js"></script>

    <!-- tablesorter の CSS/JS 読み込み -->
    <link href="./themes/blue/style.css" rel="stylesheet" media="print, projection, screen">
    <script src="./js/jquery.tablesorter.min.js"></script>

    <!-- bootstrap-select の CSS/JS 読み込み -->
    <link href="./css/bootstrap-select.min.css" rel="stylesheet">
    <script src="./js/bootstrap-select.min.js"></script>

    <!-- purl の JS 読み込み -->
    <script src="./js/purl.js"></script>

    <!-- ユーザー CSS/JS 読み込み -->
    <link href="./css/user.css" rel="stylesheet">
    <script src="./js/user.js"></script>
  </head>

  <body>
    <!-- navigation -->
    <nav class="navbar navbar-inverse">
      <div class="container">
        <div class="navbar-header">
          <a class="navbar-brand" href="./index.html">AtCoder Scores</a>
        </div>

        <ul class="nav navbar-nav">
          <li><a href="./about.html">このページについて</a></li>
          <li><a href="./contact.html">お問い合わせ</a></li>
        </ul>
      </div>
    </nav>
    <!-- navigation end -->

    <!-- header -->
    <div class="container">
      <div class="page-header">
        <h1>AtCoder Scores</h1>
      </div>
      <p class="description"><a href="http://atcoder.jp/">AtCoder</a> の（重み付き配点に対応した AGC 001 以降の）問題を難易度順に並べる非公式サイトです．</p>

      <p>ユーザ名を指定すると進捗を表示します．（おそらく）API 関連の事情で反映には時間がかかることがありますことをご承知おきくださいませ．ご不満があれば<a href="./contact.html">こちら</a>まで</p>

      <div class="header-form form-group">
        <div class="form-inline">
          難易度：
          <select id="difficulty_min" class="selectpicker" data-size="8">
            {score_min}
          </select>
          から
          <select id="difficulty_max" class="selectpicker" data-size="8">
            {score_max}
          </select>
        </div>
        <div class="form-inline">
          User：<input type="text" name="form_username" class="form-control">
          Rival：<input type="text" name="form_rivalname" class="form-control">
          <input type="checkbox" name="form_notac">AC していない問題のみ表示
          <button type="button" id="difficulty_submit" class="btn btn-primary">適用</button>
        </div>
      </div>
      <!-- header end -->

      <!-- AOJ-ICPC みたいなやつ -->
      <table id="progresstable" class="table table-condensed" style="display:none;">
        <thead>
          <tr>
            <th style="font-weight:bold;text-align:center;">ID</th>
            <th style="font-weight:bold;text-align:center;">POINTS</th>
            {prog_head}
          </tr>
        </thead>

        <tbody>
          <tr id="progress_whole">
            <td style="font-weight:bold;text-align:center;">TOTAL</td>
            <td id="prog_whole_total" style="font-weight:bold;text-align:center;">0</td>
            {prog_whole}
          </tr>

          <tr id="progress_user" style="display:none;">
            <td id="prog_user_name" style="font-weight:bold;text-align:center;">User</td>
            <td id="prog_user_total" style="font-weight:bold;text-align:center;">0</td>
            {prog_user}
          </tr>

          <tr id="progress_rival" style="display:none">
            <td id="prog_rival_name" style="font-weight:bold;text-align:center;">Rival</td>
            <td id="prog_rival_total" style="font-weight:bold;text-align:center;">0</td>
            {prog_rival}
          </tr>
        </tbody>
      </table>
      <!-- AOJ-ICPC みたいなやつ end -->

      <div class="result_user" style="display:none">
        <div class="placeholders row">
          <div class="col-sm-3 col-xs-6">
            <h4>User AC</h4>
            <h3><div id="num_user_ac">0</div></h3>
          </div>
          <div class="col-sm-3 col-xs-6">
            <h4>未AC（誤答あり）</h4>
            <h3><div id="num_user_not_ac">0</div></h3>
          </div>
          <div class="col-sm-3 col-xs-6">
            <h4>未提出</h4>
            <h3><div id="num_user_unsubmitted">0</div></h3>
          </div>
        </div>
      </div>

      <div class="result_rival" style="display:none">
        <div class="placeholders row">
          <div class="col-sm-3 col-xs-6">
            <h4>Rival AC</h4>
            <h3><div id="num_rival_ac">0</div></h3>
          </div>
          <div class="col-sm-3 col-xs-6">
            <h4>未AC（誤答あり）</h4>
            <h3><div id="num_rival_not_ac">0</div></h3>
          </div>
          <div class="col-sm-3 col-xs-6">
            <h4>未提出</h4>
            <h3><div id="num_rival_unsubmitted">0</div></h3>
          </div>
        </div>
      </div>

      <table id="mainconttable" class="table table-striped table-hover table-condensed tablesorter">
        <thead>
          <tr>
            <th style="text-align:center; width:10%;">得点</th>
            <th style="width: 55%;">問題</th>
            <th style="width: 25%;">writer</th>
            <th style="width: 10%;">部分点</th>
          </tr>
        </thead>

        <tbody>
          {maintable}
        </tbody>
      </table>
    </div>
  </body>
</html>
'''

# contest
# |- index
# |- URL
# |- writer
# |- task
# |- task
# :  |- score
# :  |- (partial score)

class PostParser(object):
    TOP_URL = 'https://atcoder.jp/?lang=ja&p={}'
    POST_RE = re.compile(r'^/post/\d+$')

    def __init__(self):
        if not os.path.isdir('posts/'):
            os.mkdir('posts/')
            self.collected = []
        else:
            self.collected = os.listdir('posts/')

        # parser for partial score
        self.ps = lambda s: (
            (int(s), '-') if '(' not in s  # no partial scores
            else (int(s.split('(')[0]), re.split('[()]', s)[1])
        )
        # parser for writer
        # `user' for unlinked one
        # `user()' for `username'
        # `user(unrated) for `user-unrated'
        self.wp = lambda x: (
            Writer(x) if '(' not in x
            else Writer(x[:-2], 'username') if '()' in x
            else Writer(x.split('(')[0], 'user-'+x[:-1].split('(')[1])
        )

        self.min_score = 10000
        self.max_score = 0
        self.new = []

    def fetch(self):
        br = mechanicalsoup.Browser()

        i = 1
        disjoint = True
        while disjoint:
            top_page = br.get(self.TOP_URL.format(i))

            links = top_page.soup.find_all('a', href=self.POST_RE)
            # see https://atcoder.jp/post/77, which is titled:
            # "AtCoder Regular Contest 068 / Beginner Contest 053 告"
            # So this would not be: if '告知' in a.text
            # ...or make a patch
            links = [a for a in links if '告' in a.text]
            if not links:
                break

            for a in links:
                index = re.search(r'\d+', a.attrs['href']).group()
                if '-'+index in self.collected:
                    # modified post corresponding `post/index'
                    continue
                elif index in self.collected:
                    # already collected one
                    disjoint = False
                    break
                else:
                    # emulate `br.follow_link(a.attrs['href'])'
                    print(a, file=sys.stderr)
                    post_url = urljoin(top_page.url, a.attrs['href'])
                    post = br.get(post_url)
                    with open('posts/'+index, 'w') as fout:
                        print(index, file=sys.stderr)
                        print(post.text, file=fout)

                    self.new.append(index)
            i += 1

        #self.collected.extend(self.new)

    def parse_allposts(self):
        try:
            from cache import cache_posts, cache_indices
        except ImportError:
            cache_posts = []
            cache_indices = set([])
            #posts = cache.posts

        posts = list(map(
            lambda x: list(map(
                lambda y:
                Contest(y[0], y[1], y[2], list(map(Writer, y[3])), y[4], y[5]), x
            )), cache_posts
        ))
        for i in self.new:
            with open('posts/'+i) as fin:
                posts.append(self.parse(fin.read(), i))

        indices = [
            # remove unpatched irregular posts
            i for i in self.collected
            if '-'+i not in self.collected and i[0] != '-' and i[-1] != '~'
        ]

        for i in indices:
            if i in cache_indices:
                continue

            if i == '__init__.py':
                continue

            with open('posts/'+i) as fin:
                print(fin.name, file=sys.stderr, flush=True)
                posts.append(self.parse(fin.read(), i))

        with open('cache/__init__.py', 'w') as fout:
            print('cache_indices = {', file=fout)
            for i in set(indices) | set(self.new):
                print('    '+repr(i)+',', file=fout)

            print('}\n', file=fout)

            print('cache_posts = [', file=fout)
            for post in posts:
                print('    [', file=fout)
                for contest in post:
                    print(
                        '        ({}, {}, {}, {}, {}, {}),'.format(
                            contest.contest_name, contest.scores,
                            repr(contest.index), contest.writers,
                            repr(contest.task_name), repr(contest.task_char)
                        ), file=fout
                    )

                    if contest.scores[0][0] < self.min_score:
                        self.min_score = contest.scores[0][0]
                    if contest.scores[-1][0] > self.max_score:
                        self.max_score = contest.scores[-1][0]

                print('    ],', file=fout)

            print(']', file=fout)

        self.collected.extend(self.new)
        return reduce(lambda x, y: x+y, posts)

    def patch(self, contest_names, scores, writers, index):
        assert not os.path.isfile('posts/-'+index)
        with open('posts/-'+index, 'w'):
            pass

        writers_new = []
        scores_new = []
        i = 0
        while i < len(contest_names):
            print('Patching', contest_names[i], file=sys.stderr)
            print(
                'Score? hyphen-separated integers with parenthesized strings',
                file=sys.stderr
            )
            scores_in = input('> ').strip().split('-')
            if scores_in == ['']:
                if i < len(scores) and scores[i]:
                    scores_new.append(scores[i])
                else:
                    scores_new.append(list(map(self.ps, scores_in)))
            else:
                scores_new.append(list(map(self.ps, scores_in)))

            print(
                'Writers? space-separated string.  format: user(color)...',
                file=sys.stderr
            )
            if writers[i]:
                print(
                    'Default: ['+' '.join(
                        w.name+('' if w.color is None else '('+w.color+')')
                        for w in writers[i]
                    )+']',
                    file=sys.stderr
                )

            writers_in = input('> ').strip().split()
            if writers_in == ['']:
                writers_new.append(writers[i] or [])
            else:
                writers_new.append(list(map(self.wp, writers_in)))

            with open('posts/+'+index+'-'+str(i+1), 'w') as fout:
            #fout = sys.stderr
            #if 1:
                print('<div class="panel-body blog-post">', file=fout)
                print(contest_names[i], file=sys.stderr)
                print(
                    '[{0}](https://{2}.contest.atcoder.jp/)'.format(
                        *contest_names[i]
                    ), file=fout
                )
                print('-'.join(map(str, scores_in)), file=fout)
                print(
                    '- writer:', *list(map(Writer.to_tag, writers_new[-1])),
                    file=fout
                )
                print('</div>', file=fout)

            i += 1

        return writers_new, scores_new

    def parse(self, html, index):
        soup = BeautifulSoup(html, 'html.parser')
        body = soup.find('div', attrs={'class': 'panel-body blog-post'})
        if body is None:
            print('index is:', index, file=sys.stderr, flush=True)
            raise Exception('Tsurai')
        contest_names = (
            TRADITIONAL_URL.findall(body.text)
            + BETA_URL.findall(body.text)
        )
        contest_names = [cs for cs in contest_names if '前回' not in cs[0]]
        contest_names = [list(map(str.strip, cs)) for cs in contest_names]

        if not contest_names:
            print(
                '\x1b[0;91m! Contest not found:', index+'\x1b[0m',
                file=sys.stderr
            )
            #print(body.text, file=sys.stderr)
            return []

        writers = self.parse_writers(body.text, index)
        writers = [writers[:] for i in range(len(contest_names))]
        scores = self.parse_scores(body.text, index)
        if not scores or not writers[0]:
            writers, scores = self.patch(contest_names, scores, writers, index)
            #print((scores), (contest_names), file=sys.stderr)

        for ss in scores:
            if ss[0][0] < self.min_score:
                self.min_score = ss[0][0]
            if ss[-1][0] > self.max_score:
                self.max_score = ss[-1][0]

        if len(scores) > 1:
            if 'abc' in contest_names[0][1] and 'arc' in contest_names[1][1]:
                if scores[0][0][0] > scores[1][0][0]:
                    scores = scores[::-1]
            if 'arc' in contest_names[0][1] and 'abc' in contest_names[1][1]:
                contest_names = contest_names[::-1]
                if scores[0][0][0] > scores[1][0][0]:
                    scores = scores[::-1]

            if 'abc' not in contest_names[0][1]:
                print(
                    '\x1b[0;91m! Two or more irregular contests found:',
                    index+'\x1b[0m', file=sys.stderr
                )
                return []
                
            return [
                Contest(contest_names[0], scores[0][:2], index, writers[0]),
                Contest(
                    contest_names[1], scores[1], index, writers[1],
                    'CDEF', 'abcd'
                )
            ]

        if 'arc' in contest_names[0][1]:
            return [
                Contest(
                    contest_names[0], scores[0], index, writers[0],
                    'CDEF', 'abcd'
                )
            ]
        elif contest_names[0][2] == 'tenka1-2017':
            return [
                Contest(
                    contest_names[0], scores[0], index, writers[0],'CDEF'
                )
            ]

        print(contest_names[0], scores[0], index, writers[0], file=sys.stderr)
        return [Contest(contest_names[0], scores[0], index, writers[0])]
    
    def parse_writers(self, body, index):
        USER_RE = re.compile(r'username|user-\w+')
        bs = BeautifulSoup(body, 'html.parser')
        writers = bs.find_all(re.compile('span|a'), attrs={'class': USER_RE})
        if writers:
            if 'anonymous' in body:
                # XXX - false-positive
                writers.append('anonymous')
            if 'other' in body:
                # XXX - so ugly
                writers.append('other')
        elif 'writer' not in body.lower():
            print(
                '\x1b[0;91m! Writer not found in post:', index+'\x1b[0m',
                file=sys.stderr
            )
            return []
        elif 'writer: -' in body.lower():
            return [Writer('')]
        else:
            print(
                '\x1b[0;91m! Writer cannot be parsed:', index+'\x1b[0m',
                file=sys.stderr
            )
            return []

        i = 0
        while i < len(writers):
            if type(writers[i]) == str:
                i += 1
                continue

            if writers[i].name == 'a' and writers[i].find('span') is not None:
                writers.pop(i)
                continue

            i += 1

        return [Writer(w) for w in writers]

    def parse_scores(self, body, index):
        SCORES_RE = re.compile(
            r'\d+00 *(?:\([^\)]+\))?'       # score / partial scores
            r'(?:'
                r' *[, -] *'                # separator
                r'\d+00 *(?:\([^\)]+\))?'   # score / partial scores
            r')+'
        )

        scores = SCORES_RE.findall(body)
        scores = [re.findall(r'\d+ *(?:\([^\)]+\))?', s) for s in scores]
        scores = [list(map(self.ps, s)) for s in scores]
        if not scores:
            print(
                '\x1b[0;91m! Scores cannot be parsed:', index+'\x1b[0m',
                file=sys.stderr
            )
            return []

        #print(scores)
        return scores

class Contest(object):
    def __init__(
            self, contest_name, scores, index, writers,
            task_name=None, task_char=None
    ):
        self.contest_name = contest_name
        self.scores = scores
        self.index = index
        self.writers = writers
        if task_name is None:
            self.task_name = string.ascii_uppercase[:len(scores)]
        else:
            self.task_name = task_name

        if task_char is None:
            self.task_char = self.task_name.lower()
        else:
            self.task_char = task_char

        assert len(self.task_name) == len(self.task_char)
        assert len(self.scores) == len(self.task_char)
        self.set_tasks()

    def set_tasks(self):
        self.tasks = []
        for tn, tc, s in zip(self.task_name, self.task_char, self.scores):
            self.tasks.append(
                Task(tn, tc, s, self.contest_name, self.writers, self.index)
            )

class Task(object):
    def __init__(self, tname, tchar, score, cname, writers, index):
        self.tname = tname
        self.tchar = tchar
        self.score, self.pscore = score
        self.ctitle, self.url, self.cname = cname
        self.writers = writers
        self.index = index

        if self.url[-1] != '/':
            self.url += '/'
        if re.match('a[bgpr]c\d{3}', self.cname):
            self.prefix = self.cname
            self.ctitle = 'A{}C {}'.format(
                self.cname[1].upper(), self.cname[3:6]
            )
            self.ctype = CONTEST_TYPES[self.cname[:3]]
        else:
            # raise KeyError if new irregular contest comes
            # In many cases, self.cname.replace('-open', '').replace('-', '_')
            # will be the prefix.
            self.prefix = TASK_PREFIXES[self.cname]
            self.ctype = IRREGULAR_TYPE
            if self.prefix == 'asaporo':
                if 'round1' in self.cname:
                    self.tchar = {'A': 'c', 'B': 'f'}[self.tname]
                elif 'round2' in self.cname:
                    self.tchar = {'A': 'e', 'B': 'a'}[self.tname]
                elif 'round3' in self.cname:
                    self.tchar = {'A': 'd', 'B': 'b'}[self.tname]
            elif self.prefix == 'asaporo2':
                if 'round1' in self.cname:
                    self.tchar = {'A': 'c', 'B': 'd'}[self.tname]
                    self.tname = self.tchar.upper()
                elif 'round3' in self.cname:
                    self.tchar = {'A': 'e', 'B': 'f'}[self.tname]
                    self.tname = self.tchar.upper()
            elif 'Qualification ' in self.ctitle:
                self.ctitle = self.ctitle.replace(
                    'Qualification Round', '予選'
                ).replace(
                    'Qualification Qual', '予選'
                )

    def to_html(self, indent):
        trad_url = 'https://{0.cname}.contest.atcoder.jp/'.format(self)
        beta_url = 'https://beta.atcoder.jp/contests/{0.cname}/'.format(self)
        return (
            '<tr class="dif_{0.score}">'
            '{indent}  <td class="mask_{0.score}">{0.score}</td>'
            '{indent}  <td class="{0.prefix}_{0.tchar}">'
              '<a href="{trad_url}tasks/{0.prefix}_{0.tchar}">'
                '{0.ctitle}: {0.tname}</a>'
              ' <a href="{beta_url}tasks/{0.prefix}_{0.tchar}">[beta]</a>'
            '</td>'
            '{indent}  <td class="{0.prefix}_{0.tchar}">'
              '{writers}</td>'            
            '{indent}  <td class="{0.prefix}_{0.tchar}">'
              '{0.pscore}</td>'
            '{indent}</tr>'
        ).format(
            self,
            writers=', '.join(map(Writer.to_html, self.writers)),
            trad_url=trad_url, beta_url=beta_url,
            indent='\n'+' '*indent,
        )

    def __lt__(self, oth):
        if self.score != oth.score:
            return self.score < oth.score
        if self.ctype != oth.ctype:
            return self.ctype < oth.ctype
        if self.ctitle != oth.ctitle:
            return self.ctitle < oth.ctitle
        return self.tname < oth.tname

    def __repr__(self):
        return '{} {}'.format(self.score, self.cname)

class Writer(object):
    def __init__(self, tag, color=None):
        if type(tag) == str:
            # anonymous
            self.name = tag
            self.color = color
            return

        if type(tag) == list:
            # already parsed
            self.name, self.color = tag
            return

        self.name = tag.text
        attrs = tag.attrs['class']
        if len(attrs) > 1:
            attrs.pop(attrs.index('username'))
            assert len(attrs) == 1

        self.color = attrs[0]

    def to_html(self):
        # for html
        if self.color is None:
            return self.name

        if self.color == 'username':
            return (
                '<a class="username" href="https://atcoder.jp/user/{0.name}">'
                '{0.name}</a>'
            ).format(self)

        return (
            '<a class="username" href="https://atcoder.jp/user/{0.name}">'
            '<span class="{0.color}">{0.name}</span></a>'
        ).format(self)

    def to_tag(self):
        # for patch file
        if self.color is None:
            return self.name

        return (
            '<a class="{}">{}</a>'.format(self.color, self.name)
        ).replace('<', '&lt;').replace('>', '&gt;')

    def __repr__(self):
        return str([self.name, self.color])

def main():
    pr = PostParser()
    pr.fetch()
    contests = pr.parse_allposts()
    tasks = reduce(lambda x, y: x+y, [c.tasks for c in contests], [])
    tasks.sort()

    score_range = range(pr.min_score, pr.max_score+1, 100)
    print(
        MAIN_TEMPLATE.format(
            score_min=('\n'+' '*12).join(
                '<option value="{0}">{0}</option>'.format(i)
                for i in score_range
            ),
            score_max=('\n'+' '*12).join(
                '<option value="{0}">{0}</option>'.format(i)
                for i in score_range
            ),
            prog_head=('\n'+' '*12).join(
                '<th id="prog_head_{0}" class="mask_{0}">{0}</th>'.format(i)
                for i in score_range
            ),
            prog_whole=('\n'+' '*12).join(
                '<td id="prog_whole_{0}" class="mask_{0}">0</td>'.format(i)
                for i in score_range
            ),
            prog_user=('\n'+' '*12).join(
                '<td id="prog_user_{0}" class="mask_{0}">0</td>'.format(i)
                for i in score_range
            ),
            prog_rival=('\n'+' '*12).join(
                '<td id="prog_rival_{0}" class="mask_{0}">0</td>'.format(i)
                for i in score_range
            ),
            maintable=('\n'+' '*10).join(t.to_html(10) for t in tasks)
        )
    )

if __name__ == '__main__':
    main()
