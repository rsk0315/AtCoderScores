#!/bin/bash

if [ -f index.html ]; then
    backup index.html
fi

./fetch_posts.py
(./get_tasks.py posts/* | cat top.html.part -) > index.html

if [ ! $ATCODER_SCORES_DIR ]; then
    ATCODER_SCORES_DIR="${HOME}/github/AtCoderScores/"
fi

cp -f index.html $ATCODER_SCORES_DIR/index.html
cd $ATCODER_SCORES_DIR
git add index.html
git commit -m 'Update index.html'
git push origin gh-pages
cd -
