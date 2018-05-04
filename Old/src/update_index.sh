#!/bin/bash

BACKUP=1
UPLOAD=1
EDITMESSAGE=0
if [ ! $ATCODER_SCORES_DIR ]; then
    # todo: use bash features for variable expansion
    ATCODER_SCORES_DIR="${HOME}/github/AtCoderScores/"
fi

# (maybe) bad hack for dealing (GNU-style) long option
for arg in $@; do
    case $arg in
        '--no-backup')
            BACKUP=0;;

        '--no-upload')
            UPLOAD=0;;

        '--message')
            EDITMESSAGE=1;;
    esac
done

if ! which backup 2> /dev/null; then
    BACKUP=0
fi

OLDER=$ATCODER_SCORES_DIR/index.html
if [ -f index.html ] && (( $BACKUP )); then
    OLDER=$(backup index.html 2>&1 | awk '{print $4}')
fi

./fetch_posts.py
(./get_tasks.py posts/*.html | cat top.html.part -) > index.html

firefox index.html &
if (( $BACKUP )); then
    diff $OLDER index.html | less
fi

diff $OLDER index.html | grep --color=always -E '^<'

if (( ! $UPLOAD )); then
    exit 0
fi

echo "Are you sure to upload? [y/N]" >&2
read query
if [ "${query::1}" != y ]; then
    echo "Cancelled uploading" >&2
    exit 1
fi

cp -f index.html $ATCODER_SCORES_DIR/index.html
cd $ATCODER_SCORES_DIR
git add index.html
if (( ! EDITMESSAGE )); then
    git commit -m 'Add new contest(s) to index.html (by script)'
else
    git commit
fi

git push origin gh-pages
status=$?
# do blah if needed
exit $status
