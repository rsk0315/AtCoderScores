# -*- sh -*-

# We run this script in beta-working directory.
# beta-working directory contains `get_tasks.py3' and 'posts/*'.
# You may put a symlink to */AtCoderScores/{js,fonts,css,themes} into
# beta-working directory for checking.
# If `posts/' contains no patch files and irregular posts found,
# you should patch them manually (which is very tsurai task).

ATCODER_SCORES_DIR="$HOME/github/AtCoderScores"

OPTIND=1
while getopts ':m:' opt; do
    case $opt in
        'm' )
            commit_msg="$OPTARG";;
    esac
done

temp=$(mktemp -p . --suffix=.html | tee /dev/stderr)
python3 get_tasks.py3 >| "$temp"

if ! diff -q "$ATCODER_SCORES_DIR/index.html" "$temp"; then
    # Changed
    diff "$ATCODER_SCORES_DIR/index.html" "$temp" | less
else
    echo No changes are made. >&2
fi

echo 'Ready to check in browser? [y/N]' >&2
read
reply="${REPLY:0:1}"
if [[ "${reply,?}" != y ]]; then
    echo 'Aborted.' >&2
    exit 1
fi

firefox "$temp"  # XXX other browser?
echo 'Sure to upload? [y/N]' >&2
read
reply="${REPLY:0:1}"
if [[ "${reply,?}" != y ]]; then
    echo 'Aborted.' >&2
    exit 1
fi

mv -f "$temp" "$ATCODER_SCORES_DIR/index.html"
cp -v ./posts/*[^~] ./cache/__init__.py "$ATCODER_SCORES_DIR/posts/"
cd "$ATCODER_SCORES_DIR"
git add index.html
git commit -m "${commit_msg:-Add new contests}"
git add posts/* cache/*
git commit -m 'Add new posts and caches'
git push origin gh-pages
