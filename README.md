# XLIFF Manager

<img src="https://maxprograms.com/images/xliffmanager_s.png" alt="XLIFF Manager logo"/>

An open source UI for [OpenXLIFF Filters](https://github.com/rmraya/OpenXLIFF) written in TypeScript. OpenXLIFF is a set of programs that let you:

- Create XLIFF 1.2 and 2.0 files that can be translated in any modern CAT tool.
- Convert your translated XLIFF files to original format with a couple of clicks.
- Validate XLIFF files created by any tool. Validation is supported for XLIFF 1.0, 1.1, 1.2 and 2.0.
- Produce an HTML file with word counts and segment status statistics from an XLIFF document.

<img src="https://www.maxprograms.com/images/XliffManager5.png" alt="XLIFF Manager on Windows 10" width="680"/>

## Releases

Version | Comment | Release Date
--------|---------|-------------
2.6.0 | Added support for SRT subtitles and Adobe InCopy ICML | November 25, 2020
2.5.1 | Fixed JSON encoding and import of XLIFF matches | November 1, 2020
2.5.0 | Added support for JSON files | October 1, 2020
2.4.1 | Fixed support for TXLF files and improved XML catalog handling | September 5, 2020
2.4.0 | Allowed conversion of 3rd party XLIFF and improved support for XLIFF 2.0 | August 26, 2020
2.3.0 | Upgraded OpenXLIFF and TypeScript; updated layout and theme handling | August 14, 2020
2.2.0 | Upgraded OpenXLIFF, TypeScript and Electron | June 12, 2020
2.1.0 | Improved entity resolution in catalog manager; added XInclude to default XML catalog | April 25, 2020
2.0.1 | Updated libraries used in binaries | April 17, 2020
2.0.0 | Added light & dark themes; implemented support for Trados Studio packages | April 3, 2020
1.8.0 | Migrated source code to TypeScript | January 28, 2020
1.7.0 | Major code cleanup; Changed segmentation model for XLIFF 2.0 | January 1, 2020
1.6.0 | Added support for XLIFF files from WPML WordPress Plugin | December 2, 2019
1.5.0 | Added menu and improved DITA support | September 22, 2019
1.4.2 | Fixed merge errors in XLIFF 2.0; several minor improvements | August 14, 2019
1.4.1 | Improved performance generating XLIFF 2.0 with embedded skeleton; wait for server to be ready befor opening UI | July 26, 2019
1.4.0 | Added option to automatically open translated files; allowed selection of default SRX file | July 17, 2019
1.3.3 | Updated to OpenXLIFF Filters 1.3.3 | July 5, 2019
1.3.2 | Implemented check for updates | May 5, 2019
1.3.1 | Updated to OpenXLIFF Filters 1.3.1 | April 30, 2019
1.3.0 | Allowed selection of DITAVAL files, added export as TMX, added default settings dialog | April 23, 2019
1.2.1 | Improved validation of XLIFF 2.0 | April 6, 2019
1.2.0 | Added Translation Status Analysis | March 3, 2019
1.1.0 | Implemented XLIFF validation| November 20, 2018
1.0.0 | Initial Release | November 12, 2018

## Supported File Formats

With XLIFF Manager you can create XLIFF for all formats supported by OpenXLIFF Filters:

- **General Documentation**
  - Adobe InCopy ICML
  - Adobe InDesign Interchange (INX)
  - Adobe InDesign IDML CS4, CS5, CS6 & CC
  - HTML
  - Microsoft Office (2007 and newer)
  - Microsoft Visio XML Drawings (2007 and newer)
  - MIF (Maker Interchange Format)
  - OpenOffice / LibreOffice / StarOffice
  - Plain Text
  - SDLXLIFF (Trados Studio)
  - SRT Subtitles
  - Trados Studio packages
  - TXML (GlobalLink/Wordfast PRO)
  - WPML XLIFF (WordPress Multilingual Plugin)
  - XLIFF from Other Tools (.mqxliff, .txlf, .xliff, etc.)
- **XML Formats**
  - XML (Generic)
  - DITA 1.0, 1.1, 1.2 and 1.3
  - DocBook 3.x, 4.x and 5.x
  - SVG
  - Word 2003 ML
  - XHTML
- **Software Development**
  - JavaScript
  - Java Properties
  - PO (Portable Objects)
  - RC (Windows C/C++ Resources)
  - ResX (Windows .NET Resources)
  - TS (Qt Linguist translation source)

## Downloads

You can get ready to use installers of XLIFF Manager for Windows, macOS and Linux from [https://www.maxprograms.com/products/xliffmanager.html](https://www.maxprograms.com/products/xliffmanager.html).

"XLIFF Manager User Guide" is available in PDF format from [https://www.maxprograms.com/support/xliffmanager.pdf](https://www.maxprograms.com/support/xliffmanager.pdf)

## Building & running

Requirements:

- [node.js](https://nodejs.org) 12.18.3 or newer

Building:

- Checkout this repository.
- Copy [OpenXLIFF Filters](https://github.com/rmraya/OpenXLIFF) binaries to your local copy of this repository (build yourself or download from [https://www.maxprograms.com](https://www.maxprograms.com)).
- Run `npm install`
- Finally, run `npm start`
