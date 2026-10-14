# Netskrafl sources and vocabulary

Netskrafl source reference: https://github.com/mideind/Netskrafl/tree/452b7fcd147316b3be53e38c0126da2722f141b0

The extracted Icelandic new tile scores, bag frequencies, standard board layout, and packed-DAWG format follow `src/languages.py`, `src/skraflmechanics.py`, `src/alphabets.py`, and `src/dawgdictionary.py`. Source copyright © 2025 Miðeind ehf.; original author Vilhjálmur Þorsteinsson. Adaptations of Netskrafl source are provided under Creative Commons Attribution-NonCommercial 4.0: https://creativecommons.org/licenses/by-nc/4.0/legalcode .

`public/dictionary.bin` is the Netskrafl `ordalisti.bin.dawg` downloaded on 2026-10-14 from the public CDN named in the source Dockerfile: https://netskrafl-cdn.ams3.digitaloceanspaces.com/dawg/ordalisti.bin.dawg . No online game service or match is accessed by the product. The exact downloaded bytes and their checksum are tracked in this project.

The word data is derived from Beygingarlýsing íslensks nútímamáls (Database of Modern Icelandic Inflection / DMII). Stofnun Árna Magnússonar í íslenskum fræðum. Höfundur og ritstjóri Kristín Bjarnadóttir. Data is licensed CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/legalcode . Netskrafl makes additions/removals described by its resource files. The unchanged bundled vocabulary remains under its original terms.

The application uses this compact binary directly. No conversion to a complete JavaScript word Set takes place. The reader exposes a cursor over compressed edges, including terminal markers inside edges and little-endian child pointers.

The previous Hunspell dictionary is no longer distributed with the bookmarklet.
