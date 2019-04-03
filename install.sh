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

function copy(){
	orig=$1
	folder=`echo $orig | tr '/' '\n' | head -n 2 | tail -n 1 | tr ' ' '_'`
	name=`echo $orig | tr '/' '\n' | tail -n 1`
	cont=`echo $name | tr '.' '\n' | head -n 1`
	ext=`echo $name | tr '.' '\n' | tail -n 1`
	location=$2
	count=1
#	if [ -e "$location$name" ] && [ -n "$(diff "$orig" "$location$name")" ]
#	then
#		let count="$count+1"
		name="${cont}-${folder}.${ext}"
#	fi
	while [ -e "$location$name" ] && [ -n "$(diff "$orig" "$location$name")" ]
	do
		let count="$count+1"
		name="${cont}-${count}.${ext}"
	done
	if [ -e "$location$name" ] && [ -z "$(diff "${orig}" "${location}${name}")" ]
	then
		echo "Exact same file already present"
		return
	fi
	if [ $count -gt 1 ]
	then
		echo "New name: $name"
	fi
	cp "$orig" "$location/$name"
}
echo "Install strategies to $g directory"
#sed "s!\./!!g; s/^/\"/g; s/$/\"/g"

e=$(find ./ -name *.js | grep -E 'indicators' )
echo "${e[@]}" | while read i
do
	echo "Copy indicator: $i"
	copy "$i" "$g/strategies/indicators/"
done

e=$(find ./ -name *.js | grep -E -v '!|indicators')
echo "${e[@]}" | while read i
do
	echo "Copy strategy: $i"
	copy "$i" "$g/strategies/"
done

e=$(find ./ -name *.toml | grep -E -v '!')
echo "${e[@]}" | while read i
do
	echo "Copy strategy config: $i"
	copy "$i" "$g/config/strategies/"
done

echo "Install complete"
