#!/usr/bin/env python
# -*- coding: utf-8 -*-

'''gets tasks from post (HTML) files'''

import os
import re
import string
import sys
import urllib2
from HTMLParser import HTMLParser
from collections import namedtuple

TASK_PREFIXES = {
    'tenka1-2016-quala.contest.atcoder.jp':
        'tenka1_2016_qualA',
    'yahoo-procon2017-final-open.contest.atcoder.jp':
        'yahoo_procon2017_final',
    'yahoo-procon2017-qual.contest.atcoder.jp':
        'yahoo_procon2017_qual',
    'rco-contest-2017-qual.contest.atcoder.jp':
        'rco_contest_2017_qual',
    'mujin-pc-2017.contest.atcoder.jp':
        'mujin_pc_2017',
    'dwacon2017-honsen.contest.atcoder.jp':
        'dwango2017final',
    'dwacon2017-prelims.contest.atcoder.jp':
        'dwango2017qual',
    'cf16-final-open.contest.atcoder.jp':
        'codefestival_2016_final',
    'cf16-exhibition-open.contest.atcoder.jp':
        'codefestival_2016_ex',
    'cf16-tournament-round1-open.contest.atcoder.jp':
        'asaporo',  # c f
    'cf16-tournament-round2-open.contest.atcoder.jp':
        'asaporo',  # e a
    'cf16-tournament-round3-open.contest.atcoder.jp':
        'asaporo',  # d b
    'cf16-relay-open.contest.atcoder.jp':
        'relay',
    'cf16-exhibition-final-open.contest.atcoder.jp':
        'cf16_exhibition_final',
    'ddcc2016-qual.contest.atcoder.jp':
        'ddcc_2016_qual',
    'code-festival-2016-qualc.contest.atcoder.jp':
        'codefestival_2016_qualC',
    'code-festival-2016-qualb.contest.atcoder.jp':
        'codefestival_2016_qualB',
    'code-festival-2016-quala.contest.atcoder.jp':
        'codefestival_2016_qualA',
    'tenka1-2016-qualb.contest.atcoder.jp':
        'tenka1_2016_qualB',
    'cf16-final-open.contest.atcoder.jp':
        'codefestival_2016_final',
    'ddcc2016-qual.contest.atcoder.jp':
        'ddcc_2016_qual',
    'dwacon2017-prelims.contest.atcoder.jp':
        'dwango2017qual',
    'yahoo-procon2017-qual.contest.atcoder.jp':
        'yahoo_procon2017_qual',
    'code-festival-2017-quala.contest.atcoder.jp':
        'code_festival_2017_quala',
    'tenka1-2017.contest.atcoder.jp':
        'tenka1_2017',
    'tenka1-2017-beginner.contest.atcoder.jp':
        'tenka1_2017',
    'ddcc2017-qual.contest.atcoder.jp':
        'ddcc2017_qual',
    'code-festival-2017-qualb.contest.atcoder.jp':
        'code_festival_2017_qualb',
    'code-festival-2017-qualc.contest.atcoder.jp':
        'code_festival_2017_qualc',
}


class Problem(object):
    CONTEST_TYPES = (ABC, ARC, AGC, OTHER) = 'brgo'
    def __init__(
            self, score, task_id, writers, contest_name, contest_url,
    ):
        self.score = score
        self.task_id = task_id
        self.writers = writers
        self.contest_name = contest_name
        self.contest_url = contest_url.rstrip('/')

        if '(' in self.score:
            self.score, self.partial_score = re.split(r'[()]', self.score)[:2]
        else:
            self.partial_score = None

        if self.score.isdigit():
            self.score = int(self.score)

        self.guess_contest_type()
        self.guess_task_url()

        # maybe bad
        if (
                self.task_url == (
                    'https://agc011.contest.atcoder.jp'
                    '/tasks/agc011_f'
                )):
            self.partial_score = '500, 1000'

    def guess_contest_type(self):
        if self.contest_name.startswith('AtCoder Beginner Contest'):
            self.contest_type = Problem.ABC
        elif self.contest_name.startswith('AtCoder Regular Contest'):
            self.contest_type = Problem.ARC
        elif self.contest_name.startswith('AtCoder Grand Contest'):
            self.contest_type = Problem.AGC
        else:
            self.contest_type = Problem.OTHER

    def get_task_basename(self):
        if self.contest_type != Problem.OTHER:
            contest_num = self.contest_name.rsplit(' ', 1)[-1]
            return 'a{}c{}_{}'.format(
                self.contest_type, contest_num, self.task_id.lower()
            )

        task_prefix = TASK_PREFIXES.get(self.contest_url)
        if task_prefix == 'asaporo':
            if 'round1' in self.contest_name:
                task_id = 'cf'[ord(self.task_id)-ord('A')]
            elif 'round2' in self.contest_name:
                task_id = 'ea'[ord(self.task_id)-ord('A')]
            elif 'round3' in self.contest_name:
                task_id = 'db'[ord(self.task_id)-ord('A')]
            else:
                raise ValueError('Unexpected task id.')
        elif task_prefix is None:
            print>>sys.stderr, `self.contest_url`
            return None
            #raise Exception('Need to edit TASK_PREFIXES')
        else:
            task_id = self.task_id.lower()

        return task_prefix+'_'+task_id

    def guess_task_url(self):
        try:
            self.task_url = 'https://'+self.contest_url+'/tasks/'
            self.task_url += self.get_task_basename()
        except TypeError:
            self.task_url = ''

    def get_task_name(self):
        if self.contest_type == Problem.OTHER:
            contest_name = self.contest_name
            for q in ('Qualification Qual', 'Qualification Round'):
                contest_name = contest_name.replace(q, '予選')
                
            return contest_name+': '+self.task_id

        task_id = (
            self.task_id if self.contest_type != Problem.ARC
            else chr(ord(self.task_id)+2)
        )

        return 'A{}C {}: {}'.format(
            self.contest_type.upper(),
            self.contest_name.rsplit(' ', 1)[-1], task_id
        )

class Post(object):
    def __init__(self, index, content):
        self.index = index
        self.content = content

        self.writer = None
        self.scores = None
        self.contests = None

        self.init_info()

    def init_info(self):
        contests = re.findall(r'\[[^\]]+\]\([^)]+\)', self.content)
        self.contests = [s for s in contests if 'JST' not in s]

        m = re.search(r'^- Writer.+', self.content,
                      flags=re.M|re.I)
        if m:
            wline = m.group()
            self.writer = re.findall(
                r'&lt;span class=&#34;user-(?P<COLOR>\w+)&#34;&gt;'
                r'(?P<NAME>[\w-]+)&lt;/span&gt;', wline
            )
            if not self.writer:
                self.writer = re.findall(
                    r'(?P<COLOR>)&gt;(?P<NAME>[\w-]+)&lt;', wline
                )

        scores = re.findall(
            ur'(?: |^|(?<=：))'
            r'\d+'
            r'(?: *\([^)]*\) *)?'
            r'(?:[, -]+\d+(?: *\([^)]*\) *)?)+',
            self.content.decode('utf-8'), flags=re.M
        )

        # ignore ratings
        scores = [s for s in scores if not s.startswith('0')]

        # replace separate characters with `-'
        scores = [s.replace(',', '-') for s in scores]

        # clear extra characters in partial score
        scores = [re.sub(r'[A-Za-z\s]+', '', s) for s in scores]

        self.scores = scores

    def get_info(self):
        try:
            contests = [
                re.search(
                    r'\[(?P<contest_name>[^]]+)\]'
                    r'\(https?://(?P<contest_url>[^)]+)\)', s
                ).groupdict()
                for s in self.contests
                if 'editorial' not in s and 'statistics' not in s
            ]
        except AttributeError:
            print>>sys.stderr, '### tsurai if it contains contests ###'
            print>>sys.stderr, self.contests
            print>>sys.stderr, '^ Please check ^'
            print>>sys.stderr
            return []

        if self.index < 0:
            for c in self.contests:
                print >>sys.stderr, 'Patched:', c.decode('utf-8').encode('utf-8')

        contests = [
            c for c in contests
            if ('contest.atcoder.jp' in c['contest_url'] or
                'beta.atcoder.jp' in c['contest_url']) and
            c['contest_name'] != u'前回のコンテスト'.encode('utf-8')
        ]

        scores = self.scores if self.scores else ['?']

        abc_and_arc = False
        task_offset = 0
        if len(contests) == 2:
            if (
                    'Beginner' in contests[0]['contest_name'] and
                    'Regular' in contests[1]['contest_name']):
                abc_and_arc = True
            elif (
                    'Regular' in contests[0]['contest_name'] and
                    'Beginner' in contests[1]['contest_name']):
                abc_and_arc = True
                contests.reverse()
            elif contests[0]['contest_name'] == 'Tenka1 Programmer Beginner Contest':
                abc_and_arc = True  # todo
                task_offset = 2

            if len(scores) == 2:
                if scores[0] > scores[1]:
                    scores.reverse()
            else:
                # if scoring is not noticed, then len(scores) < 2
                # if scoring is noticed but len(scores) < 2,
                # maybe parsing is failed.
                print >>sys.stderr, "### tsurai ###"
                print >>sys.stderr, "#", ', '.join(
                    d['contest_name'] for d in contests
                )
                print >>sys.stderr, "#", scores
                print >>sys.stderr

        elif len(contests) > 2:
            # a little tsurai
            pass

        if abc_and_arc:
            # store the index of ARC for the URL
            arc_id = contests[1]['contest_name'].rsplit(' ', 1)[-1]

        info = []
        TASKS = string.ascii_uppercase
        for contest, score in zip(contests, scores):
            for task_id, score_for_task in zip(TASKS, score.split('-')):
                if (
                        abc_and_arc and
                        'Beginner' in contest['contest_name'] and
                        task_id >= 'C'):

                    continue  # skip duplicated tasks

                if (
                        abc_and_arc and
                        'Beginner' not in contest['contest_name'] and
                        task_offset):

                    task_id = chr(ord(task_id)+task_offset)


                info.append(
                    Problem(
                        score_for_task, task_id, self.writer, **contest
                    )
                )

        return info

class PostRetriever(HTMLParser):
    def __init__(self, scanned_index):
        HTMLParser.__init__(self)
        self.scanned_index = scanned_index
        self.opened_tags = []
        self.posts = []
        self.buf = ''
        self.index = -1
        self.sees_post = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)

        if (
                tag == 'a' and
                self.opened_tags and
                self.opened_tags[-1][0] == 'h3' and
                self.opened_tags[-1][1].get('class', '') == 'panel-title'):

            self.index = int(attrs.get('href', '-1').split('/')[-1])
            self.sees_post = True
            self.buf = ''  # in case

        self.opened_tags.append((tag, attrs))

    def handle_data(self, data):
        if not data.strip():
            return

        try:
            assert self.opened_tags
        except AssertionError:
            print>>sys.stderr, `data`
            raise AssertionError

        cur_tag = self.opened_tags[-1]
        if (
                cur_tag[0] == 'div' and
                cur_tag[1].get('class', None) == 'panel-body blog-post'):

            self.buf += data

    def handle_endtag(self, tag):
        assert self.opened_tags

        cur_tag = self.opened_tags.pop()
        if (
                cur_tag[0] == 'div' and
                cur_tag[1].get('class', None) == 'panel panel-default'):

            if self.index not in self.scanned_index:
                self.posts.append(Post(self.index, self.buf))
                if self.index >= 0:
                    self.scanned_index.add(self.index)

            self.buf = ''
            self.index = -1
            self.sees_post = False

    def handle_entityref(self, name):
        if self.sees_post:
            self.buf += '&'+name+';'

        return '&'+name+';'

    def handle_charref(self, name):
        if self.sees_post:
            self.buf += '&#'+name+';'

        return '&#'+name+';'

    def get_posts(self, string):
        self.feed(string)
        return self.posts

    def get_scanned_index(self):
        return self.scanned_index

def colorize_user(color, name):
    if not color:
        return (
            '<a class="username" href="https://atcoder.jp/user/{name}">'
            '{name}</a>'
        ).format(name=name)
    return (
        '<a class="username" href="https://atcoder.jp/user/{name}">'
        '<span class="user-{color}">{name}</span></a>'
    ).format(color=color, name=name)
    return '<span class="user-{}">{}</span>'.format(color, name)

def format_writer(writer_list):
    if not writer_list:
        return ''

    writers = [colorize_user(*writer) for writer in writer_list]
    return ', '.join(writers) if writers else ''

def usage():
    print 'Usage: {} <HTML...>'.format(os.path.basename(sys.argv[1]))

def main():
    if not sys.argv[1:]:
        usage()
        return 1

    ## scan posts
    posts = []
    # * posts downloaded from atcoder.jp/?p=XX
    # * post-like files made by `make_ppost.py`
    #       (in case original posts do not work)

    scanned_index = set()
    for inname in sys.argv[1:]:
        with open(inname) as fin:
            string = fin.read()
            if string.startswith('\xef\xbb\xbf'):
                # ignore BOM
                string = string[3:]

        pr = PostRetriever(scanned_index)
        posts += pr.get_posts(string)
        scanned_index |= pr.get_scanned_index()

    ## get infos from scanned posts
    ss = {}
    for post in posts:
        for problem in post.get_info():
            if problem.score not in ss:
                ss[problem.score] = {}

            if problem.contest_type not in ss[problem.score]:
                ss[problem.score][problem.contest_type] = []

            ss[problem.score][problem.contest_type].append(problem)

    ## print header
    print u'''
    <!-- header -->
    <div class="container">
      <div class="page-header">
        <h1>AtCoder Scores</h1>
      </div>
      <p class="description"><a href="http://atcoder.jp/">AtCoder</a> の（重み付き配点に対応した AGC 001 以降の）問題を難易度順に並べる非公式サイトです．</p>

      <div class="header-form form-group">
        <div class="form-inline">
          難易度：
          <select id="difficulty_min" class="selectpicker" data-size="8">'''.encode('utf-8')

    min_score, max_score = min(ss), max(i for i in ss if i!='?')

    for i in range(min_score, max_score+1, 100):
        print ' '*12+'<option value={:>6}{}>{:>4}</option>'.format(
            '"'+str(i)+'"',
            (' selected=""' if False else ''), i
        )

    print u'''          </select>
          から
          <select id="difficulty_max" class="selectpicker" data-size="8">'''.encode('utf-8')

    for i in range(min_score, max_score+1, 100):
        print ' '*12+'<option value={:>6}{}>{:>4}</option>'.format(
            '"'+str(i)+'"',
            (' selected=""' if False else ''), i
        )

    print u'''          </select>
        </div>
        <div class="form-inline">
          User：<input type="text" name="form_username" class="form-control">
          Rival：<input type="text" name="form_rivalname" class="form-control">
          <input type="checkbox" name="form_notac">AC していない問題のみ表示
          <button type="button" id="difficulty_submit" class="btn btn-primary">適用</button>
        </div>
      </div>
      <!-- header end -->

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
'''.encode('utf-8')

    ## print contents
    print u'''      <table id="mainconttable" class="table table-striped table-hover table-condensed tablesorter">
        <thead>
          <tr>
            <th style="text-align:center; width:10%;">得点</th>
            <th style="width: 55%;">問題</th>
            <th style="width: 25%;">writer</th>
            <th style="width: 10%;">部分点</th>
          </tr>
        </thead>

        <tbody>'''.encode('utf-8')

    key_func = lambda x: x.contest_name+x.task_id
    for score, problems in sorted(list(ss.items())):
        if score == '?':
            continue

        for contest_type in Problem.CONTEST_TYPES:
            if contest_type not in problems:
                continue

            for problem in sorted(problems[contest_type], key=key_func):
                partial_score = (
                    '-' if problem.partial_score is None
                    else problem.partial_score
                )

                if not problem.task_url:
                    continue

                print (
                    u'''          <tr class="dif_{score}">
            <td class="mask_{score}">{score}</td>
            <td class="{task_bname}"><a href="{task_url}">{task_name}</a></td>
            <td class="{task_bname}">{writers}</td>
            <td class="{task_bname}">{partial_score}</td>
          </tr>'''.encode('utf-8')
                ).format(
                    score=score,
                    task_bname=problem.get_task_basename(),
                    task_url=problem.task_url,
                    task_name=problem.get_task_name(),
                    writers=format_writer(problem.writers),
                    partial_score=partial_score,
                )

    print u'''        </tbody>
      </table>
    </div>
  </body>
</html>'''

if __name__ == '__main__':
    main()
