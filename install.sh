#!/bin/bash

# Gekko-Strategies installator.

echo 'Gekko-Strategies installator'
if [ -n "$1" ]
then
g=$1
else
echo 'Type path to Gekko folder: [ex. /home/xFFFFF/gekko/] and press ENTER'
read g
fi

echo "Install strategies to $g directory";
#sed "s!\./!!g; s/^/\"/g; s/$/\"/g"
e=($(find . -name *.js | grep -E 'indicators' ))
for i in "${e[@]}"
do
echo "Copy indicator: $i"
cp $i $g/strategies/indicators/
done

e=($(find ./ -name *.js | grep -E -v '!|indicators'))
for i in "${e[@]}"
do
echo "Copy strategy: $i"
cp $i $g/strategies
done

e=($(find ./ -name *.toml | grep -E -v '!'))
for i in "${e[@]}"
do
echo "Copy strategy config: $i"
cp $i $g/config/strategies/
done
echo "Install complete"
