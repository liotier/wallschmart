Wallschmart
======
Wallschmart fetches pages to render them as images. I wrote it to produce images suitable to display in a connected digital picture frame (actually a Raspberry Pi with an elderly monitor savec from a trash heap) as ghetto domestic signage.

Why ? Because I want the display device to remain as stupid as possible - so its input has to be static images and something has to generate them... Wallschmart !

This is a personal project that scratches my own itch... Therefore much hardcoded argumentation. Well - maybe someone will find it useful anyway...

## Dependencies
On the scrapper host:
* wget (to get the source page)
* xmllint (to select the desired xpath in the page)
* vim (to use ex for search & replace)
* wkhtmltoimage (to render the output image from HTML)
* xvfb-run (because Debian's wkhtmltoimage won't run without an xserver so we use xvfb-run to make him believe there is one)
* iconv ('wkhtmltoimage --encoding utf-8' should make this step unnecessary but I fail to have it use that option)
* imagemagick (sometimes image post-processing is the quickest (and dirtiest) way to cut an output into shape)

If you use a Raspberry Pi's framebuffer to display:
* inotify
* fbi

## Installation & usage

Checkout this wherever you want.

publish should be edited according to where you want the output to be sent. I use it to send the output pictures to a remote Raspberry Pi via SSH but you can of course use whatever other method you may wish.

You will typically wish to run wallschmart-hourly from cron every hour and wallschmart-minutely from cron every minute.

wallschmart-hourly launches the modules whose output does not need to be updated more often - such as weather predictions.

wallschmart-minutely launches the modules whose output needs to be regularly updated. It also launches the publication script that publishes all output including those of wallschmart-hourly

Each module is self-contained in its directory in the /modules directory. For test purposes, you may cd to a module's directory and run its wallschmart_$modulename script.

display watches a directory and on modification of its content it restarts fbi to display the images as a slideshow. The default 12 seconds displays fives images in a minute - which is perfectly synchronous with the current five images output of wallschmart-minutely and wallschmart-hourly. Less than ten seconds per image might be a bit too fast for the readers - so more than six images might not be comfortable... I'll have to ponder on that if I produce more modules.

Example output at http://www.ruwenzori.net/wallschmart/

## Roadmap

* More modules !
* More robustness (cf. TODO)

If this thing evolves towards generalized modules, then the scrapping stage will fall square into [Weboob](http://weboob.org/) territory... And one might then as well write Weboob modules. But right now, Wallschmart is rather quick & dirty.

## Contributing

Patches welcome, new modules welcome !
