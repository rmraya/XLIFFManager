# XLIFF Manager

![XLIFF Manager logo](img/xliffmanager.png)

An open source UI for [OpenXLIFF Filters](https://github.com/rmraya/OpenXLIFF). OpenXLIFF is a set of programs that let you:

- Create XLIFF 1.2, 2.0 and 2.1 files that can be translated in any modern CAT tool.
- Convert your translated XLIFF files to original format with a couple of clicks.
- Validate XLIFF files created by any tool. Validation is supported for XLIFF 1.0, 1.1, 1.2 and 2.0.
- Produce an HTML file with word counts and segment status statistics from an XLIFF document.

![XLIFF Manager](docs/en/images/createXliff.png)

## Releases

Version | Comment | Release Date
:------:|---------|:-----------:
7.5.0 | Updated OpenXLIFF to version 3.20.0 | April 21, 2024
7.4.0 | Updated OpenXLIFF to version 3.17.0; migrated to Java 21 | January 12, 2024
7.3.0 | Updated OpenXLIFF to version 3.16.0 | October 31, 2023
7.2.0 | Updated OpenXLIFF to version 3.15.0 | September 13, 2023
7.1.0 | Added option to generate XLIFF 2.1; Updated OpenXLIFF to version 3.14.0 | September 1, 2023
7.0.0 | Updated OpenXLIFF Filters to version 3.12 | August 16, 2023
6.2.0 | Improved localization handling | June 2nd, 2023
6.1.0 | Updated OpenXLIFF Filters to version 3.7.0 | May 16th, 2023
6.0.0 | Added Spanish localization | April 1st, 2023
5.8.0 | Updated OpenXLIFF Filters to version 3.3.0 | February 22nd, 2023
5.7.0 | Updated OpenXLIFF Filters to version 3.1.0 | January 25th, 2023
5.6.0 | Updated OpenXLIFF Filters to version 2.12.0 | December 6th, 2022
5.5.0 | Added support for PHP Arrays; Updated OpenXLIFF to 2.9.1  | October 22nd, 2022
5.4.0 | Updated TXLF, JSON and DITA filters | October 8th, 2022
5.3.0 | Added new filter for TXLF files; Updated OpenXLIFF to 2.8.0  | September 2nd, 2022
5.2.0 | Updated OpenXLIFF to 2.7.0; updated electron to 20.0.2 | August 12th, 2022
5.1.0 | Updated OpenXLIFF to 2.6.0 | July 17th, 2022
5.0.0 | Redesigned GUI and added new Translation Tasks panel; Updated OpenXLIFF to version 2.5.0 | July 7th, 2022
4.2.0 | Updated OpenXLIFF to 2.4.1 | June 11th, 2022
4.1.0 | Updated OpenXLIFF to 2.3.0 | May 27th, 2022
4.0.1 | Updated electron library to version 18.0.2| April 6th, 2022
4.0.0 | Updated OpenXLIFF to 2.0.0 | March 29th, 2022
3.7.0 | Updated OpenXLIFF to 1.17.2 | February 25th, 2022
3.6.0 | Updated OpenXLIFF to 1.17.0 | December 1st, 2021
3.5.0 | Improved updates downloader and updated libraries | November&nbsp;16th,&nbsp;2021
3.4.0 | Updated OpenXLIFF to 1.14.0; updated libraries | October 3rd, 2021
3.3.0 | Updated OpenXLIFF to 1.13.0 | September 2nd, 2021
3.2.0 | Updated libraries; fixed automatic downloads of Apple M1 installer | July 4th 2021
3.1.0 | Updated libraries | June 18th, 2021
3.0.0 | Redesigned UI; updated OpenXLIFF | May 5th, 2021
2.7.0 | New check for updates dialog; Improved XLIFF validation | February 3rd, 2021
2.6.1 | Improved support for Trados Studio packages; improved conversion to/from XLIFF| January 1st, 2021
2.6.0 | Added support for SRT subtitles and Adobe InCopy ICML | November 25th, 2020
2.5.1 | Fixed JSON encoding and import of XLIFF matches | November 1st, 2020
2.5.0 | Added support for JSON files | October 1st, 2020
2.4.1 | Fixed support for TXLF files and improved XML catalog handling | September 5th, 2020
2.4.0 | Allowed conversion of 3rd party XLIFF and improved support for XLIFF 2.0 | August 26th,&nbsp;2020
2.3.0 | Upgraded OpenXLIFF and TypeScript; updated layout and theme handling | August 14th, 2020
2.2.0 | Upgraded OpenXLIFF, TypeScript and Electron | June 12th, 2020
2.1.0 | Improved entity resolution in catalog manager; added XInclude to default XML catalog | April 25th, 2020
2.0.1 | Updated libraries used in binaries | April 17th, 2020
2.0.0 | Added light & dark themes; implemented support for Trados Studio packages | April 3rd, 2020
1.8.0 | Migrated source code to TypeScript | January 28th, 2020
1.7.0 | Major code cleanup; Changed segmentation model for XLIFF 2.0 | January 1st, 2020
1.6.0 | Added support for XLIFF files from WPML WordPress Plugin | December 2nd, 2019
1.5.0 | Added menu and improved DITA support | September&nbsp;22nd,&nbsp;2019
1.4.2 | Fixed merge errors in XLIFF 2.0; several minor improvements | August 14th, 2019
1.4.1 | Improved performance generating XLIFF 2.0 with embedded skeleton; wait for server to be ready befor opening UI | July 26th, 2019
1.4.0 | Added option to automatically open translated files; allowed selection of default SRX file | July 17th, 2019
1.3.3 | Updated to OpenXLIFF Filters 1.3.3 | July 5th, 2019
1.3.2 | Implemented check for updates | May 5th, 2019
1.3.1 | Updated to OpenXLIFF Filters 1.3.1 | April 30th, 2019
1.3.0 | Allowed selection of DITAVAL files, added export as TMX, added default settings dialog | April 23rd, 2019
1.2.1 | Improved validation of XLIFF 2.0 | April 6th, 2019
1.2.0 | Added Translation Status Analysis | March 3rd, 2019
1.1.0 | Implemented XLIFF validation| November 20th, 2018
1.0.0 | Initial Release | November 12th, 2018

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
  - Trados Studio Packages (*.sdlppx)
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
  - JSON
  - Java Properties
  - PO (Portable Objects)
  - RC (Windows C/C++ Resources)
  - ResX (Windows .NET Resources)
  - TS (Qt Linguist translation source)

## Downloads

You can get ready to use installers of XLIFF Manager for Windows, macOS and Linux from [https://www.maxprograms.com/products/xliffmanager.html](https://www.maxprograms.com/products/xliffmanager.html).

## Documentation

- [XLIFF Manager User Guide](https://www.maxprograms.com/support/xliffmanager.pdf) (PDF)
- [XLIFF Manager User Guide](https://www.maxprograms.com/support/xliffmanager.html) (Web Help)

## Licenses

Source code of XLIFF Manager is free. Anyone can download the source code, compile, modify and use it at no cost in compliance with the accompanying license terms.

Subscriptions are available for technical support, bug fixes, and feature requests. By subscribing to a support plan, you contribute to the continuous improvement of XLIFF Manager. Your subscription fees pay for code development costs and ensure the quality and reliability of the software.

Subscription Keys are available at [Maxprograms Online Store](https://www.maxprograms.com/store/buy.html). Subscription Keys cannot be shared or transferred to different machines.

You can subscribe to [Maxprograms Support](https://groups.io/g/maxprograms/) at Groups.io and request peer assistance for the source code there.

## Requirements

- JDK 21 or newer is required for compiling and building. Get it from [Adoptium](https://adoptium.net/).
- Apache Ant 1.10.13 or newer. Get it from [https://ant.apache.org/](https://ant.apache.org/)
- Node.js 20.10.0 LTS or newer. Get it from [https://nodejs.org/](https://nodejs.org/)
- TypeScript 5.3.3 or newer.  Get it from [https://www.typescriptlang.org/](https://www.typescriptlang.org/)

## Building

- Checkout this repository.
- Point your `JAVA_HOME` environment variable to JDK 21
- Run `ant` to compile the Java code
- Run `npm install` to download and install NodeJS dependencies
- Run `npm start` to launch XLIFF Manager

### Steps for building

``` bash
  git clone https://github.com/rmraya/XLIFFManager.git
  cd XLIFFManager
  ant
  npm install
  npm start
```
