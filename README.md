# 8tracks-scraper
Scrape an 8tracks mix to plaintext, an rss feed, or a xspf/jspf playlist.

# TL,DR
```bash
# First, download a mix to an interim format
./8tracks-fetch-mix --mix (url to a mix) [--delay] > playlist.out

# Then, convert to the final format
cat playlist.out | ./playlist-to-xspf > playlist.xspf
cat playlist.out | ./playlist-to-jspf > playlist.jspf
```

# 8tracks-fetch-mix
Given an xtracks mix, crawl it and return all tracks that are part of the playlist.

Returns a "cookie-jar" type format:
```
key: value
foo: bar
%%
another: section
goes: here
%%
one-last: section
goes: here
```

The reason why is because crawling playlists can take a while (if delays need to be inserted to get
around rate-limiting) so any format that cannot be chunked would be hard to stream. With the above
format, each "section" can stand alone so streaming isn't hard.

# 8tracks-find-artist
```
8tracks-find-artist --artist "foo" --album "bar"
```

Given an artist or an album (or both!), return all tracks that can be found that match the given
filters. This is really helpful for creating playlists of all one artist or all one album. See
`8tracks-find-artist --help` for more info.

# playlist-to-xspf
Takes a playlist output and converts it to xspf format, which is readable by vlc. [More info
here](http://www.xspf.org/quickstart/).

Usage: `cat playlist-output.out | ./playlist-to-xspf > playlist.xspf`

# playlist-to-jspf
Takes a playlist output and converts it to jspf format. Not as widely supported.

Usage: `cat playlist-output.out | ./playlist-to-jspf > playlist.xspf`
