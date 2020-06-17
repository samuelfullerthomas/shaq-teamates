# shaq teamates

![shaq free throw](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Shaq_free_throw.jpg/256px-Shaq_free_throw.jpg)
Photo credit: Keith Allison from Baltimore, USA

## installation

if you have node installed, skip the node install step. Otherwise:

1. download and install node from https://nodejs.org/en/download/

2. run `npm install -g shaq-teamates`

3. in your terminal, you now can run the `finals` command

## usage

### `finals generate`
generates the finals rosters from the basketball reference finals page and saves a copy locally (this speeds up the processing of future searches).

IMPORTANT: You must run this command before you can get a players streaks.

### `finals "<player name>"`

ex:
`finals "shaquille oneal"`

returns:
```
shaquille oneal had teamates in these finals:
[ [ '1967', '1967', 0 ], [ '1984', '2019', 35 ] ]
```

### `finals "<player name> -o <filename>"`

if you pass a string to the `-o` or `--output` flag, the cli will also outputs the list of teamates and finals to a json file

ex:
`finals "shaquille oneal" -o "shaq"`

writes to:

`shaq.json`

### `finals --help`

list these commands