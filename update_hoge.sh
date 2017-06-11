#!/bin/bash

## please backup index.html in advance
(./get_posts.py posts/* | cat top.html.part -) > index.html
