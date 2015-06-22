Wallschmart
======
Wallschmart fetches pages to render them as images. I wrote it to produce images suitable to display in a connected digital picture frame (actually a Raspberry Pi with an elderly monitor savec from a trash heap) as ghetto domestic signage.

Why ? Because I want the display device to remain as stupid as possible - so its input has to be static images and something has to generate them... Wallschmart !

This is a personal project that scratches my own itch... Therefore much hardcoded argumentation. Well - maybe someone will find it useful anyway...

## Dependencies
* wget (to get the source page)
* xmllint (to select the desired xpath in the page)
* vim (to use ex for search & replace)
* wkhtmltoimage (to render the output image from HTML)
* xvfb-run (because Debian's wkhtmltoimage won't run without an xserver so we use xvfb-run to make him believe there is one)
* iconv ('wkhtmltoimage --encoding utf-8' should make this step unnecessary but I fail to have it use that option)
* imagemagick (sometimes image post-processing is the quickest (and dirtiest) way to cut an output into shape)

## Installation

Checkout this wherever you want. You might typically wish to run /wallschmart from cron.

## Usage
/wallschmart is the orchestration script that successively runs modules and the publication script.

Each module is self-contained in its directory in the /modules directory. For test purposes, you may cd to a module's directory and run its wallschmart_$modulename script.

Example output at http://www.ruwenzori.net/wallschmart/

## Roadmap

* More modules !

If this thing evolves towards generalized modules, then the scrapping stage will fall square into [Weboob](http://weboob.org/) territory... And one might then as well write Weboob modules. But right now, Wallschmart is rather quick & dirty.

## Contributing

Patches welcome, new modules welcome !
