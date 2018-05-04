#!/usr/bin/env python

# ------------------------------------------------------------------------
# Output post-like patch file by text files. Format text files as follows:
# [CONTEST-NAME](CONTEST-TOP-PAGE-URL)        |
#     WRITER(COLOR), WRITER(COLOR), ...       < comma-separated
#     SCORE-SCORE-SCORE-SCORE(PARTIAL-SCORE)  < partial score will do
#                                             < empty line
# [CONTEST-NAME](CONTEST-TOP-PAGE-URL)        |
#     ?                                       < '?' in case writer unknown
#     SCORE-SCORE-SCORE-SCORE-SCORE-SCORE     |
# ------------------------------------------------------------------------

import os
import re
import sys

def main():
    if not sys.argv[1:]:
        print 'Usage: {} <PATCH-TXT...>'.format(
            os.path.basename(sys.argv[0])
        )
        return 1

    inname = sys.argv[1]
    with open(inname, ) as fin:
        while True:
            cname = fin.readline().lstrip('\xef\xbb\xbf').rstrip('\n')
            if not cname.startswith('['):
                break

            writer = fin.readline().strip()
            scores = fin.readline().strip()
            blank = fin.readline()

            print '<div class="panel panel-default">'
            print '    <div class="panel-heading post-heading">'
            print '        <h3 class="panel-title"><a href="/post/-1">Dummy post</a></h3>'
            print '    </div>'
            print '    <div class="panel-body blog-post"> '+cname
            print '- writer: '+(', '.join([
                (
                    '&lt;span class=&#34;user-{0[COLOR]}&#34;&gt;'
                    '{0[NAME]}&lt;/span&gt;'
                ).format(
                    re.search(r'(?P<NAME>[\w-]+)\((?P<COLOR>\w+)\)', s).groupdict())
                    for s in writer.split(', ')]) if writer != '?' else '?')
            print '- scores: '+scores
            print '    </div>'
            print '</div>'
            print

if __name__ == '__main__':
    main()
