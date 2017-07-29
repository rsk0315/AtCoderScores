#!/bin/bash

if [ -f index.html ] && [ "$1" != '--no-backup' ] ; then
    backup index.html
fi

./fetch_posts.py
(./get_tasks.py posts/*.html | cat top.html.part -) > index.html

firefox index.html

echo "Are you sure to upload? [y/N]" >&2
read query
if [ "${query::1}" != y ]; then
    echo "Cancelled uploading" >&2
    exit 1
fi

if [ ! $ATCODER_SCORES_DIR ]; then
    ATCODER_SCORES_DIR="${HOME}/github/AtCoderScores/"
fi

cp -f index.html $ATCODER_SCORES_DIR/index.html
cd $ATCODER_SCORES_DIR
git add index.html
git commit -m 'Update index.html'
git push origin gh-pages
cd -
