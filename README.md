![alt text](https://maxprograms.com/images/openxliff_s.png "Open Xliff Filters")

## XLIFF Manager

An open source UI for 
[OpenXLIFF Filters](https://github.com/rmraya/OpenXLIFF) written in JavaScript. OpenXLIFF is a set of programs that let you:

 - Create XLIFF 1.2 and 2.0 files that can be translated in any modern CAT tool.
 - Convert your translated XLIFF files to original format with a couple of clicks.
 - Validate XLIFF files created by any tool. Validation is supported for XLIFF 1.0, 1.1, 1.2 and 2.0.
 - Produce an HTML file with word counts and segment status statistics from an XLIFF document.

<img src="https://www.maxprograms.com/images/XliffManager3.png" alt="XLIFF Manager on Windows 10" width="680"/>

### Releases

Version | Comment | Release Date
--------|---------|-------------
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

### Supported File Formats

With XLIFF Manager you can create XLIFF for all formats supported by OpenXLIFF Filters:

- **General Documentation**
  - Adobe InDesign Interchange (INX)
  - Adobe InDesign IDML CS4, CS5, CS6 & CC
  - HTML
  - Microsoft Office (2007 and newer)
  - Microsoft Visio XML Drawings (2007 and newer)
  - MIF (Maker Interchange Format)
  - OpenOffice / LibreOffice / StarOffice
  - Plain Text
  - SDLXLIFF (Trados Studio)
  - TXML (GlobalLink/Wordfast PRO)   
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

### Downloads

You can get ready to use installers of XLIFF Manager for Windows, macOS and Linux from https://www.maxprograms.com/products/xliffmanager.html

"XLIFF Manager User Guide" is available in PDF format from https://www.maxprograms.com/support/xliffmanager.pdf 

### Building & running

Requirements: 
[node.js](https://nodejs.org) 12.6.0 or newer

- Checkout this repository.
- Copy [OpenXLIFF Filters](https://github.com/rmraya/OpenXLIFF) binaries to your local copy of this repository (build yourself or download from https://www.maxprograms.com ).
- Run `npm install`
- Finally, run `npm start`



