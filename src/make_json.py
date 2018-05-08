#!/usr/bin/env python3.6

import json
import os
import re
import string
import sys
from urllib.parse import urljoin

import mechanicalsoup
from bs4 import BeautifulSoup


# 「AtCoder Beginner Contest 042」のようなのを title，
# 「abc042」のようなのを screen name と呼ぶことにします．
TRADITIONAL_URL_RE = re.compile(
    r'\[(?P<title>[^\]]+)\]'
    r'\((?P<url>https?://(?P<scrname>[\w-]+).contest.atcoder.jp/?)\)'
)
BETA_URL_RE = re.compile(
    r'\[(?P<title>[^\]]+)\]'
    r'\((?P<url>https?://beta.atcoder.jp/contests/(?P<scrname>[\w-]+)/?)\)'
)
URL_REs = (TRADITIONAL_URL_RE, BETA_URL_RE)

CONTEST_TYPES = dict(zip(('abc', 'arc', 'agc', 'apc', 'other'), range(5)))

# JSON かなにかの形式にして後々は別ファイルに置きます
task_prefixes = {
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
    'yahoo-procon2018-final':
        'yahoo_procon2018_final',
    's8pc-3':
        's8pc_3',
    's8pc-4':
        's8pc_4',
    's8pc-5':
        's8pc_5',
    'njpc2017':
        'njpc2017',
}

# どう考えてもこの設計は悪っぽい
contest_category = {
    'tenka1-2016-quala':
        ('tenka1', 'qual'),
    'tenka1-2016-final-open':
        ('tenka1', 'final'),
    'yahoo-procon2017-final-open':
        ('yahoo', 'final'),
    'yahoo-procon2017-qual':
        ('yahoo', 'qual'),
    'mujin-pc-2017':
        (None, None),
    'dwacon2017-honsen':
        ('dwango', 'final'),
    'dwacon2017-prelims':
        ('dwango', 'qual'),
    'cf16-final-open':
        ('codefestival', 'final'),
    'cf16-exhibition-open':
        ('codefestival', None),
    'cf16-tournament-round1-open':
        ('codefestival', None),
    'cf16-tournament-round2-open':
        ('codefestival', None),
    'cf16-tournament-round3-open':
        ('codefestival', None),
    'cf16-relay-open':
        ('codefestival', None),
    'cf16-exhibition-final-open':
        ('codefestival', None),
    'ddcc2016-qual':
        ('ddcc', 'qual'),
    'ddcc2016-final':
        ('ddcc', 'final'),
    'code-festival-2016-qualc':
        ('codefestival', 'qual'),
    'code-festival-2016-qualb':
        ('codefestival', 'qual'),
    'code-festival-2016-quala':
        ('codefestival', 'qual'),
    'tenka1-2016-qualb':
        ('tenka1', 'qual'),
    'cf16-final-open':
        ('codefestival', 'final'),
    'dwacon2017-prelims':
        ('dwango', 'qual'),
    'code-festival-2017-quala':
        ('codefestival', 'qual'),
    'tenka1-2017':
        ('tenka1', None),
    'tenka1-2017-beginner':
        ('tenka1', None),
    'ddcc2017-qual':
        ('ddcc', 'qual'),
    'ddcc2017-final':
        ('ddcc', 'final'),
    'code-festival-2017-qualb':
        ('codefestival', 'qual'),
    'code-festival-2017-qualc':
        ('codefestival', 'qual'),
    'cf17-final-open':
        ('codefestival', 'final'),
    'cf17-exhibition-open':
        ('codefestival', None),
    'cf17-tournament-round1-open':
        ('codefestival', None),
    'cf17-tournament-round2-open':
        ('codefestival', None),
    'cf17-tournament-round3-open':
        ('codefestival', None),
    'cf17-relay-open':
        ('codefestival', None),
    'code-thanks-festival-2017-open':
        ('codefestival', None),
    'colopl2018-qual':
        ('colocon', 'qual'),
    'dwacon2018-prelims':
        ('dwango', 'qual'),
    'colopl2018-final-open':
        ('colocon', 'final'),
    'soundhound2018':
        (None, None),
    'dwacon2018-final-open':
        ('dwango', 'final'),
    'yahoo-procon2018-qual':
        ('yahoo', 'qual'),
    'yahoo-procon2018-final':
        ('yahoo', 'final'),
    's8pc-3':
        ('s8pc', None),
    's8pc-4':
        ('s8pc', None),
    's8pc-5':
        ('s8pc', None),
    'njpc2017':
        (None, None),
}

correct_names = {
    'degwer': 'DEGwer',
    'e869120': 'E869120',
    'hec': 'Hec',
}


def warn(*value):
    print('\x1b[1;35m', end='', file=sys.stderr)
    print(*value, end='', file=sys.stderr)
    print('\x1b[0m', file=sys.stderr, flush=True)


class PostCollector(object):
    TOP_URL = 'https://atcoder.jp/?lang=ja&p={}'
    POST_RE = re.compile(r'^/post/\d+$')

    def __init__(self, save_to='./post/'):
        self.save_to = save_to
        if not save_to.endswith('/'):
            self.save_to += '/'

        if os.path.isdir(save_to):
            self.collected = os.listdir(save_to)
        else:
            assert not os.path.exists(save_to)
            os.mkdir(save_to)
            self.collected = []

    def fetch(self):
        br = mechanicalsoup.Browser()

        i = 1
        disjoint = True
        while disjoint:
            top_page = br.get(self.TOP_URL.format(i))
            # AtCoder トップページの告知たちを save_to ディレクトリに
            # 保存します．新しい方から見ていって，すでに収集済みの
            # ところまできたらやめます．

            # 配点が未定など，つらいことがある告知 post/ddd は
            # post/-ddd にリネームしておいて，後で対処します．

            # 本当は '告知' in a.text にしたいんだけれども，post/77 の
            # ARC068/ABC053 の回に誤字があるためにこうなっています．
            # 問題がおこったら考え直します．えびより
            links = [
                a for a in top_page.soup.find_all('a', href=self.POST_RE)
                if '告' in a.text
            ]

            if not links:
                break

            for a in links:
                index = re.search(r'\d+', a.attrs['href']).group()
                # warn(index)
                if '-'+index in self.collected:
                    continue
                elif index in self.collected:
                    disjoint = False
                    break

                # print(a, file=sys.stderr)
                post_url = urljoin(top_page.url, a.attrs['href'])
                post = br.get(post_url)
                with open(self.save_to+index, 'w') as fout:
                    # print(index, file=sys.stderr)
                    print(post.text, file=fout)

                # self.new.append(index)

            i += 1

    def parse_all(self):
        ls = os.listdir(self.save_to)

        # 保存した告知のファイル名たちを持ってくるけれども，
        # つらいことがあったファイルやバックアップは除外するよ
        indices = [
            i for i in ls
            if ('-'+i not in ls) and (i[0] != '-') and (i[-1] != '~')
        ]

        self.posts = []
        for i in indices:
            with open(self.save_to+i) as fin:
                # print(fin.name, file=sys.stderr, flush=True)
                self.posts.append(Post(fin, i))


class Post(object):
    def __init__(self, fin, index):
        self.fin = fin
        self.index = index

        self.asked = False
        self.contests = self.parse()

    def parse(self):
        soup = BeautifulSoup(self.fin, 'html.parser')
        body = soup.find('div', attrs={'class': 'panel-body blog-post'})
        if body is None:
            print('index:', self.index, file=sys.stderr, flush=True)
            raise RuntimeError('Tsurai')

        # .findall() が .groupdict() 的なのを返してくれると捗るなぁ．
        # 余計なものまで引っ掛かるので除外します．
        # ついでに余計な空白も取り除きます
        cdicts = [
            [
                dict((k, v.strip()) for k, v in m.groupdict().items())
                for m in re_.finditer(body.text)
                if '前回' not in m.groupdict()['title']
            ] for re_ in URL_REs
        ]
        self.cdicts = cdicts = cdicts[0] + cdicts[1]

        if not cdicts:
            warn('Contest not found in post', self.index)
            return []

        writers = self.parse_writers(body.text) or self.ask_writers()
        scores = self.parse_scores(body.text) or self.ask_scores()

        if self.asked:
            # ask whether we should generate a patch file
            pass

        # warn(self.index)
        # warn(scores)
        if len(scores) > 2:
            warn('three or more contests in post', self.index)
            return []

        if len(scores) > 1:
            if 'abc' in cdicts[0]['scrname'] and 'arc' in cdicts[1]['scrname']:
                if scores[0][0][0] > scores[1][0][0]:
                    scores = scores[::-1]
            if 'arc' in cdicts[0]['scrname'] and 'abc' in cdicts[1]['scrname']:
                cdicts = cdicts[::-1]
                if scores[0][0][0] > scores[1][0][0]:
                    scores = scores[::-1]

            if 'abc' not in cdicts[0]['scrname']:
                warn('two or more irregular contests in post', self.index)
                return []

            return [
                Contest(cdicts[0], scores[0][:2], self.index, writers),
                Contest(
                    cdicts[1], scores[1], self.index, writers, 'CDEF', 'abcd'
                )
            ]

        if 'arc' in cdicts[0]['scrname']:
            return [Contest(
                cdicts[0], scores[0], self.index, writers, 'CDEF', 'abcd'
            )]
        elif cdicts[0]['scrname'] == 'tenka1-2017':
            return [Contest(
                cdicts[0], scores[0], self.index, writers, 'CDEF'
            )]
        else:
            return [Contest(cdicts[0], scores[0], self.index, writers)]

    def parse_writers(self, text):
        if 'writer' not in text.lower():
            warn('writer not found in post', self.index)
            return None

        if 'writer: -' in text.lower():
            return [Writer('')]

        bs = BeautifulSoup(text, 'html.parser')
        writers = bs.find_all(
            re.compile('span|a'), attrs={'class': Writer.TAG_RE}
        )

        if writers:
            for special_name in ('anonymous', 'other'):
                # 偽陽性がヤバヤバなのでなんとかしたい．
                if special_name in text:
                    writers.append(special_name)
        else:
            warn('cannot parse writers in post', self.index)

        i = 0
        while i < len(writers):
            # たぶん重複を除いているんだと思う

            if isinstance(writers[i], str):
                i += 1
                continue

            if writers[i].name == 'a' and writers[i].find('span') is not None:
                writers.pop(i)
                continue

            i += 1

        return [*map(Writer, writers)]

    def parse_scores(self, text):
        scores = [
            [
                (int(m.group(1)), m.group(2))
                for m in Score.PART_RE.finditer(s)
            ] for s in Score.RE.findall(text)
        ]

        if not scores:
            warn('cannot parse scores in post', self.index)
            return None

        return scores

    def ask_writers(self):
        user_re = re.compile(r'(?P<name>[\w-]+)\((?P<tag>\w+)\)')
        warn('Writers for {}?'.format(self.cdicts[0]['scrname']))
        warn('e.g. tourist(user-red) chokudai(user-red)')
        print('>', end=' ', file=sys.stderr, flush=True)
        writers = [
            Writer(name, color)
            for name, color in user_re.findall(input())
        ]

        self.asked = True
        return writers

    def ask_scores(self):
        scores = []
        for cdict in self.cdicts:
            warn('Scores for {}?'.format(cdict['scrname']))
            warn('e.g. 100-200-400(200)-600')
            print('>', end=' ', file=sys.stderr, flush=True)
            scores.append(
                [
                    (int(m.group(1)), m.group(2))
                    for m in Score.PART_RE.finditer(input())
                ]
            )

        self.asked = True
        return scores


class Writer(object):
    TAG_RE = re.compile(r'username|user-\w+')

    def __init__(self, tag, color=None):
        if isinstance(tag, str):
            # anonymous, other, etc. or ones asked interactively
            self.name = tag
            self.color = color
            return

        self.name = tag.text
        attrs = tag.attrs['class']
        if len(attrs) > 1:
            attrs.pop(attrs.index('username'))
            assert len(attrs) == 1

        self.color = attrs[0]

    def to_html(self):
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


class Score(object):
    # [^...]の中で丸括弧をエスケープしているのはエディタのハイライトが
    # 理由なのでそのままにしておいてください．えびより
    RE = re.compile(
        r'''\d+0\ *(?:\([^\)]+\))?     # score and partial scores
        (?:
            \ *[, -]\ *                # separator
            \d+0\ *(?:\([^\)]+\))?     # score and partial scores
        )+''', flags=re.VERBOSE
    )
    PART_RE = re.compile(r'(\d+) *(?:\(([^\)]+)\))?')


class Contest(object):
    def __init__(
            self, cdict, scores, index, writers, charseq=None, scr_charseq=None
    ):
        self.cdict = cdict
        self.scores = scores
        self.index = index
        self.writers = writers[:]
        self.charseq = charseq or string.ascii_uppercase[:len(scores)]
        self.scr_charseq = scr_charseq or self.charseq.lower()
        assert len(self.charseq) == len(self.scr_charseq) == len(scores)

        self.tasks = [
            Task(ch, sch, s, cdict, writers, index)
            for ch, sch, s in zip(self.charseq, self.scr_charseq, scores)
        ]


class Task(object):
    def __init__(self, char, scr_char, score, cdict, writers, index):
        # ARC 058 C (arc058_a) みたいなの，アなんですけど，
        # char には 'C'，scr_char には 'a' が入っています 
        self.char = char
        self.scr_char = scr_char
        self.fscore, self.pscore = score  # (full score, partial score)
        self.ctitle = cdict['title']
        self.scr_name = cdict['scrname']
        self.url = cdict['url']
        self.writers = writers
        self.index = index

        if self.url[-1] != '/':
            self.url += '/'

        if self.pscore is None:
            # 後々空文字列とかに変えるかもしれません
            self.pscore = None

        if re.match(r'a[bgpr]c\d{3}', self.scr_name):
            self.prefix = self.scr_name
            self.ctitle = 'A{}C {}'.format(
                self.scr_name[1].upper(), self.scr_name[3:6]
            )
            self.ctype = CONTEST_TYPES[self.scr_name[:3]]
            self.ccat = (self.scr_name[:3], None)

        else:
            self.prefix = task_prefixes[self.scr_name]
            self.ctype = CONTEST_TYPES['other']
            self.ccat = contest_category[self.scr_name]
            if self.prefix == 'asaporo':
                if 'round1' in self.scr_name:
                    self.scr_char = {'A': 'c', 'B': 'f'}[self.char]
                elif 'round2' in self.scr_name:
                    self.scr_char = {'A': 'e', 'B': 'a'}[self.char]
                elif 'round3' in self.scr_name:
                    self.scr_char = {'A': 'd', 'B': 'b'}[self.char]
                else:
                    assert False

            elif self.prefix == 'asaporo2':
                if 'round1' in self.scr_name:
                    self.scr_char = {'A': 'c', 'B': 'd'}[self.char]
                    self.char = self.scr_char.upper()
                elif 'round2' in self.scr_name:
                    pass
                elif 'round3' in self.scr_name:
                    self.scr_char = {'A': 'e', 'B': 'f'}[self.char]
                    self.char = self.scr_char.upper()
                else:
                    assert False

            elif 'Qualification ' in self.ctitle:
                self.ctitle = re.sub(
                    r'Qualification (?:Round|Qual)', '予選', self.ctitle
                )

    # def __str__(self):
    #     return (
    #         '          <tr class="dif_{0.fscore}">\n'
    #         + '            <td class="mask_{0.fscore}">{0.fscore}</td>\n'
    #         + '            <td class="{0.prefix}_{0.scr_char}"><a href="https://{0.scr_name}.contest.atcoder.jp/tasks/{0.prefix}_{0.scr_char}">{0.ctitle}: {0.char}</a> <a href="https://beta.atcoder.jp/contests/{0.scr_name}/tasks/{0.prefix}_{0.scr_char}">[beta]</a></td>\n'
    #         + '            <td class="{0.prefix}_{0.scr_char}">'
    #         + ', '.join(w.to_html() for w in self.writers)
    #         + '</td>\n'
    #         + '            <td class="{0.prefix}_{0.scr_char}">{0.pscore}</td>\n'
    #         + '          </tr>'
    #     ).format(self)

    @property
    def trad_url(self):
        return (
            'https://{0.scr_name}.contest.atcoder.jp/tasks/'
            '{0.prefix}_{0.scr_char}'
        ).format(self)

    @property
    def beta_url(self):
        return (
            'https://beta.atcoder.jp/contests/{0.scr_name}/tasks/'
            '{0.prefix}_{0.scr_char}'
        ).format(self)

    def __lt__(self, oth):
        if self.fscore != oth.fscore:
            return self.fscore < oth.fscore
        elif self.ctype != oth.ctype:
            return self.ctype < oth.ctype
        elif self.ctitle != oth.ctitle:
            return self.ctitle < oth.ctitle
        else:
            return self.char < oth.char


def main():
    pc = PostCollector()
    pc.fetch()
    pc.parse_all()

    tasks = []
    for post in pc.posts:
        for contest in post.contests:
            tasks.extend(contest.tasks)

    tasks = [
        task for task in tasks
        if not (
                task.prefix == 'tenka1_2016_final' and task.scr_char in 'ab'
                # 他にも除外したいのがあればここに or で追加する
        )
    ]

    tasks.sort()
    # task_dict = {i: [] for i in range(100, 2500, 100)}
    # for t in tasks:
    #     if t.fscore not in task_dict:
    #         task_dict[t.fscore] = []

    #     task_dict[t.fscore].append({
    #         'ctitle': t.ctitle,
    #         'char': t.char,
    #         'screen_name': (t.prefix+'_'+t.scr_char),
    #         'trad_url': t.trad_url,
    #         'beta_url': t.beta_url,
    #         'writers': [(w.name, w.color) for w in t.writers],
    #         'partial': t.pscore,
    #     })

    # print(json.dumps(task_dict))

    res = []
    for t in tasks:
        res.append({
            'fullScore': t.fscore,
            'partialScore': t.pscore,
            'contestTitle': t.ctitle,
            'contestScreenName': t.scr_name,
            'contestCategory': t.ccat,
            'taskChar': t.char,
            'taskScreenName': (t.prefix+'_'+t.scr_char),
            'traditionalURL': t.trad_url,
            'betaURL': t.beta_url,
            'writers': [
                (correct_names.get(w.name.lower(), w.name), w.color)
                for w in t.writers
            ],
        })

    json.dump(res, fp=sys.stdout, indent=4)


if __name__ == '__main__':
    main()
