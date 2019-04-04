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
	if [ -e "$location$name" ] && [ -n "$(diff "$orig" "$location$name")" ]
	then
		let count="$count+1"
		name="${cont}-${folder}.${ext}"
	fi
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
#	cp "$orig" "$location/$name"
}

function processfiles(){
	location=$1
	echo "+++ Processing target location: ${location}"
	IFS=$'\n'
	for src in `cat ${tmpfile}`
	do
		# If the same file is already present we skip it
		if [ -e "$location$name" ] && [ -z "$(diff "${src}" "${location}${name}")" ]
		then
			continue
		fi
		echo "Source file: ${src}"
		folder=`echo "$src" | tr '/' '\n' | head -n 2 | tail -n 1 | tr ' ' '_'`
		name=`echo "$src"| tr '/' '\n' | tail -n 1`
		oname="$name"
		cont=`echo "$name" | tr '.' '\n' | head -n 1`
		ext=`echo "$name" | tr '.' '\n' | tail -n 1`
		# First check: do we have multiple different occurences of this file
		if [ `grep -E "/${name}$" ${tmpfile} | wc -l` -gt 1 ] 
		then
			pre="${src}"
			for other in `grep -E "/${name}$" ${tmpfile}`
			do
				if [ -n "$(diff "$pre" "$other")" ]
				then
					name="${cont}-${folder}.${ext}"
					break
				fi
			done
		fi
		# Second check: is there a different file under the same name in target folder
		if [ -e "$location$name" ] && [ -n "$(diff "${src}" "${location}${name}")" ]
		then
			name="${cont}-${folder}.${ext}"
		fi
		count=1
		# Third check: increase counter until there is no different file in target directory
		while [ -e "$location$name" ] && [ -n "$(diff "$src" "$location$name")" ]
		do
			let count="$count+1"
			name="${cont}-${count}.${ext}"
		done
		# If the same file is already present we don't copy
		if [ -e "$location$name" ] && [ -z "$(diff "${src}" "${location}${name}")" ]
		then
			echo "Exact same file already present"
			continue
		fi
		# If we changed the name report the change
		if [ "$oname" != "$name" ] 
		then
			echo "New name: $name"
		fi
		cp "$src" "$location/$name"
	done
	unset IFS
}

echo "Install strategies to $g directory"
#sed "s!\./!!g; s/^/\"/g; s/$/\"/g"

tmpfile="filenamecomparison.$(date '+%s').tmp"

find ./ -name *.js | grep -E 'indicators' | grep -v '!' > ${tmpfile}
processfiles "$g/strategies/indicators/"
find ./ -name *.js | grep -E -v '!|indicators' > ${tmpfile}
processfiles "$g/strategies/"
find ./ -name *.toml | grep -E -v '!' > ${tmpfile}
processfiles "$g/config/strategies/"
rm -f ${tmpfile}

echo "Install complete"
